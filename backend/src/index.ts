import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import { getDbDiagnostics, initDb } from './db'
import { authMiddleware } from './middleware/auth'
import authRouter from './routes/auth'
import bookmarksRouter from './routes/bookmarks'
import categoriesRouter from './routes/categories'
import tagsRouter from './routes/tags'
import metaRouter from './routes/meta'

const PORT = parseInt(process.env.PORT || '3001', 10)
const NODE_ENV = process.env.NODE_ENV || 'development'
const APP_VERSION = process.env.APP_VERSION || 'dev'

initDb()

const app = express()

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: true, credentials: true }))
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json())
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON body' })
    return
  }
  next(err)
})

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/health/db', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), database: getDbDiagnostics() })
})

app.get('/health/version', (_req, res) => {
  res.json({
    status: 'ok',
    version: APP_VERSION,
    nodeEnv: NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// Auth routes (public)
app.use('/api/auth', authRouter)

// Public meta fetch
app.use('/api/fetch-meta', metaRouter)

app.get('/api/diagnostics/version', (_req, res) => {
  res.json({
    status: 'ok',
    version: APP_VERSION,
    nodeEnv: NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/diagnostics/db', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), database: getDbDiagnostics() })
})

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
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  console.error(`[${requestId}] Unhandled error ${req.method} ${req.originalUrl}:`, err)
  res.status(500).json({
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message,
    requestId,
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bookmark manager API running on http://0.0.0.0:${PORT}`)
})
