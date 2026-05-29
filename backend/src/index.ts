import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import { initDb } from './db'
import { authMiddleware } from './middleware/auth'
import authRouter from './routes/auth'
import bookmarksRouter from './routes/bookmarks'
import categoriesRouter from './routes/categories'
import tagsRouter from './routes/tags'
import metaRouter from './routes/meta'

const PORT = parseInt(process.env.PORT || '3001', 10)
const NODE_ENV = process.env.NODE_ENV || 'development'

initDb()

const app = express()

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: true, credentials: true }))
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Auth routes (public)
app.use('/api/auth', authRouter)

// Public meta fetch
app.use('/api/fetch-meta', metaRouter)

// Protected API routes
app.use('/api/bookmarks', authMiddleware, bookmarksRouter)
app.use('/api/categories', authMiddleware, categoriesRouter)
app.use('/api/tags', authMiddleware, tagsRouter)

// Serve static frontend in production
if (NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '..', '..', 'frontend', 'dist')
  app.use(express.static(staticPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'))
  })
}

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: NODE_ENV === 'production' ? 'Internal server error' : err.message })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bookmark manager API running on http://0.0.0.0:${PORT}`)
})
