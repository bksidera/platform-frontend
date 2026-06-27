import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFrame, listMyFrames, uploadImage } from '../../services/api'

export function FramesPanel() {
  const queryClient = useQueryClient()
  const { data: frames } = useQuery({ queryKey: ['myFrames'], queryFn: listMyFrames })

  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  const submit = async () => {
    if (!title.trim() || !file) return
    setBusy(true)
    setError(null)
    try {
      const imageUrl = await uploadImage(file)
      await createFrame({ title: title.trim(), context: context.trim() || undefined, imageUrl })
      await queryClient.invalidateQueries({ queryKey: ['myFrames'] })
      setCreating(false)
      setTitle('')
      setContext('')
      setFile(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const copyLink = (slug: string) => {
    void navigator.clipboard.writeText(`${window.location.origin}/m/${slug}`)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  return (
    <section className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl">Frames</h2>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="text-sm text-muted underline underline-offset-4"
          >
            New frame
          </button>
        )}
      </div>

      {creating && (
        <div className="border border-line bg-surface p-5 space-y-4">
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-ink border border-line px-4 py-3 placeholder:text-muted/60"
          />
          <input
            placeholder="Context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full bg-ink border border-line px-4 py-3 placeholder:text-muted/60"
          />
          <label className="block text-sm text-muted">
            Creator image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-2 block w-full text-sm file:mr-3 file:border file:border-line file:bg-ink
                         file:text-parchment file:px-3 file:py-2 file:text-sm"
            />
          </label>
          {error && <p className="text-sm text-red-300/90">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={busy || !title.trim() || !file}
              onClick={submit}
              className="flex-1 py-3 border border-line bg-ink font-display disabled:opacity-40"
            >
              {busy ? 'Uploading...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="px-5 border border-line text-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {(frames ?? []).map((frame) => (
          <li key={frame.id} className="border border-line bg-surface p-4 flex items-center gap-4">
            <img src={frame.imageUrl} alt="" className="w-14 h-14 object-cover ring-1 ring-line" />
            <div className="flex-1 min-w-0">
              <p className="font-display truncate">{frame.title}</p>
              <p className="text-xs text-muted">
                {frame.context ?? 'Living Frame'} · {frame.cardCount}{' '}
                {frame.cardCount === 1 ? 'card' : 'cards'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 text-sm">
              <Link to={`/m/${frame.slug}`} className="text-muted underline underline-offset-4">
                View
              </Link>
              <button
                type="button"
                onClick={() => copyLink(frame.slug)}
                className="text-muted underline underline-offset-4"
              >
                {copiedSlug === frame.slug ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
