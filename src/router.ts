import { useEffect, useState } from 'react'

let listeners: Array<() => void> = []

export function navigate(path: string): void {
  history.pushState({}, '', path)
  for (const listener of listeners) listener()
}

export function usePath(): string {
  const [path, setPath] = useState(() => location.pathname)
  useEffect(() => {
    const update = () => setPath(location.pathname)
    window.addEventListener('popstate', update)
    listeners.push(update)
    return () => {
      window.removeEventListener('popstate', update)
      listeners = listeners.filter((l) => l !== update)
    }
  }, [])
  return path
}
