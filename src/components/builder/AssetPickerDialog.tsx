import { useEffect, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { api } from '../../api/client'

interface Asset {
  id: number
  name: string
  url: string
  mime: string
  size: number
  created_at: string
}

export function AssetPickerDialog({
  onClose,
  onPick,
}: {
  onClose: () => void
  onPick: (url: string) => void
}) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    try {
      const list = await api.get<Asset[]>('/api/assets')
      setAssets(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      await api.upload<Asset>('/api/assets', file)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-6" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-[680px] max-w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-ice-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold">Image library</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
            >
              <Upload className="size-3.5" />
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={(e) => void onFileChange(e)}
            />
            <button onClick={onClose} className="rounded-lg p-1.5 text-ink-600 transition hover:bg-ice-100">
              <X className="size-4" />
            </button>
          </div>
        </header>
        {error && <div className="bg-red-50 px-5 py-2 text-sm text-red-700">{error}</div>}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading && <p className="text-sm text-ink-400">Loading…</p>}
          {!loading && assets.length === 0 && (
            <p className="text-sm text-ink-400">No images yet. Upload one above.</p>
          )}
          {!loading && assets.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {assets.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onPick(a.url)}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-ice-200 transition hover:border-primary"
                  title={a.name}
                >
                  <div className="flex h-28 items-center justify-center bg-ice-50">
                    <img
                      src={a.url}
                      alt={a.name}
                      className="max-h-full max-w-full object-contain p-1"
                    />
                  </div>
                  <div className="border-t border-ice-100 px-2 py-1.5">
                    <p className="truncate text-[11px] text-ink-600">{a.name}</p>
                    <p className="text-[10px] text-ink-400">{(a.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <div className="absolute inset-0 rounded-xl ring-2 ring-primary ring-offset-0 opacity-0 transition group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
