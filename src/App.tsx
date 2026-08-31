import { useEffect } from 'react'
import { Snowflake } from 'lucide-react'
import { usePath } from './router'
import { useAuth } from './stores/auth'
import Login from './pages/Login'
import TemplateList from './pages/TemplateList'
import EditorPage from './pages/EditorPage'

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

  if (status === 'guest') {
    return <Login />
  }

  if (path === '/' || path === '/templates') {
    return <TemplateList />
  }

  const editorMatch = path.match(/^\/editor\/(\d+)$/)
  if (editorMatch) {
    return <EditorPage id={Number(editorMatch[1])} />
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
