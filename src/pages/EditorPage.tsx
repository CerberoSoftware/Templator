import { useEffect, useState } from 'react'
import { ArrowLeft, Snowflake } from 'lucide-react'
import { api } from '../api/client'
import { navigate } from '../router'

interface TemplateData {
  id: number
  name: string
  json_structure: string | null
  final_html: string | null
}

export default function EditorPage({ id }: { id: number }) {
  const [template, setTemplate] = useState<TemplateData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<TemplateData>(`/api/templates/${id}`)
      .then(setTemplate)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load template'))
  }, [id])

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="font-medium text-red-600">{error}</p>
        <a href="/" className="text-primary hover:underline">
          Back to templates
        </a>
      </div>
    )
  }

  if (template === null) {
    return <div className="flex h-full items-center justify-center text-sm text-ink-400">Loading…</div>
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-ice-200 bg-white px-4 py-3">
        <button
          onClick={() => navigate('/')}
          className="rounded-lg p-2 text-ink-600 transition hover:bg-ice-100"
          title="Back to templates"
        >
          <ArrowLeft className="size-4" />
        </button>
        <span className="font-semibold">{template.name}</span>
      </header>
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-ink-600">
          <Snowflake className="size-8 text-ice-300" />
          <p className="text-sm">The visual builder arrives in the next build step.</p>
        </div>
      </div>
    </div>
  )
}
