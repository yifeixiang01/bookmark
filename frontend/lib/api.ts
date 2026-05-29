const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.reload()
    }
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export interface ApiBookmark {
  id: string
  title: string
  url: string
  description?: string
  category: string
  tags: string[]
  visits: number
  createdAt: string
  favicon?: string
  sortOrder?: number
}

export interface ApiCategory {
  id: string
  name: string
  icon: string
  color?: string
  count: number
  order: number
  children?: ApiCategory[]
}

export interface ApiTag {
  id: string
  name: string
  color: string
}

export interface ApiUser {
  id: string
  username: string
}

export const api = {
  auth: {
    register: (username: string, password: string) =>
      fetchJson<{ token: string; user: ApiUser }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    login: (username: string, password: string) =>
      fetchJson<{ token: string; user: ApiUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
  },
  bookmarks: {
    list: (params?: { q?: string; category?: string; tags?: string[]; sort?: string }) => {
      const search = new URLSearchParams()
      if (params?.q) search.set('q', params.q)
      if (params?.category && params.category !== 'all') search.set('category', params.category)
      if (params?.tags?.length) search.set('tags', params.tags.join(','))
      if (params?.sort) search.set('sort', params.sort)
      return fetchJson<ApiBookmark[]>(`/bookmarks?${search.toString()}`)
    },
    get: (id: string) => fetchJson<ApiBookmark>(`/bookmarks/${id}`),
    create: (data: {
      title: string
      url: string
      description?: string
      category_id?: string
      tags?: string[]
      favicon?: string
    }) => fetchJson<ApiBookmark>('/bookmarks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Omit<ApiBookmark, 'id' | 'createdAt' | 'category'>> & { category_id?: string; tags?: string[]; favicon?: string | null }) =>
      fetchJson<ApiBookmark>(`/bookmarks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchJson<void>(`/bookmarks/${id}`, { method: 'DELETE' }),
    batchDelete: (ids: string[]) =>
      fetchJson<void>('/bookmarks/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
    batchMove: (ids: string[], category_id: string) =>
      fetchJson<void>('/bookmarks/batch-move', { method: 'POST', body: JSON.stringify({ ids, category_id }) }),
    reorder: (items: { id: string; sort_order: number }[]) =>
      fetchJson<void>('/bookmarks/reorder', { method: 'PUT', body: JSON.stringify({ items }) }),
  },
  categories: {
    list: () => fetchJson<ApiCategory[]>('/categories'),
    create: (data: { name: string; icon: string; color?: string; parent_id?: string }) =>
      fetchJson<ApiCategory>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; icon?: string; color?: string }) =>
      fetchJson<ApiCategory>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchJson<void>(`/categories/${id}`, { method: 'DELETE' }),
    reorder: (items: { id: string; sort_order: number }[]) =>
      fetchJson<void>('/categories/reorder', { method: 'PUT', body: JSON.stringify(items) }),
  },
  tags: {
    list: () => fetchJson<ApiTag[]>('/tags'),
    create: (data: { name: string; color: string }) =>
      fetchJson<ApiTag>('/tags', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; color?: string }) =>
      fetchJson<ApiTag>(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchJson<void>(`/tags/${id}`, { method: 'DELETE' }),
    merge: (source_id: string, target_id: string) =>
      fetchJson<void>('/tags/merge', { method: 'POST', body: JSON.stringify({ source_id, target_id }) }),
  },
  fetchMeta: (url: string) =>
    fetchJson<{ title?: string; description?: string; favicon?: string }>('/fetch-meta', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
}
