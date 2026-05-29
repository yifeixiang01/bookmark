'use client'

import { useState, useEffect } from 'react'
import { BookmarkManager } from '@/components/bookmark/bookmark-manager'
import { AuthModal } from '@/components/auth/auth-modal'

export default function HomePage() {
  const [auth, setAuth] = useState<{ token: string; user: { id: string; username: string } } | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        setAuth({ token, user })
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setChecking(false)
  }, [])

  const handleAuth = (token: string, user: { id: string; username: string }) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setAuth({ token, user })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setAuth(null)
  }

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!auth) {
    return <AuthModal onAuth={handleAuth} />
  }

  return <BookmarkManager user={auth.user} onLogout={handleLogout} />
}
