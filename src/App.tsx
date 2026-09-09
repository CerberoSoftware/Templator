import { lazy, Suspense, useEffect } from 'react'
import { Snowflake } from 'lucide-react'
import { usePath } from './router'
import { useAuth } from './stores/auth'

const TemplateList = lazy(() => import('./pages/TemplateList'))
const EditorPage = lazy(() => import('./pages/EditorPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

export default function App() {
  const status = useAuth((s) => s.status)
  const init = useAuth((s) => s.init)
  const path = usePath()

  useEffect(() => {
    void init()
  }, [init])

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center gap-3 text-ink-600">
        <Snowflake className="size-6 animate-pulse text-primary" />
        <span className="text-sm font-medium">Loading eTemplator…</span>
      </div>
    )
  }

  if (path === '/' || path === '/templates') {
    return (
      <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-ink-400">Loading…</div>}>
        <TemplateList />
      </Suspense>
    )
  }

  const editorMatch = path.match(/^\/editor\/(\d+)$/)
  if (editorMatch) {
    return (
      <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-ink-400">Loading editor…</div>}>
        <EditorPage id={Number(editorMatch[1])} />
      </Suspense>
    )
  }

  if (path === '/settings' || path === '/brand' || path === '/brand-settings') {
    return (
      <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-ink-400">Loading settings…</div>}>
        <SettingsPage />
      </Suspense>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <p className="text-lg font-semibold">Page not found</p>
      <a href="/" className="text-primary hover:underline">
        Back to templates
      </a>
    </div>
  )
}
