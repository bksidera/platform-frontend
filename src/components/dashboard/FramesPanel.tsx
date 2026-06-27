import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFrame, listMyFrames, uploadImage } from '../../services/api'

export function FramesPanel() {
  const queryClient = useQueryClient()
  const { data: frames, isLoading } = useQuery({ queryKey: ['myFrames'], queryFn: listMyFrames })

  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

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
      setPreviewUrl(null)
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
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-5">
        <div>
          <h2 className="font-display text-2xl">Frames</h2>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">
            Create one public object for a work, then share its link wherever people encounter it.
          </p>
        </div>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="shrink-0 border border-line bg-surface px-4 py-2 text-sm text-parchment hover:border-parchment/30"
          >
            New frame
          </button>
        )}
      </div>

      {creating && (
        <div className="border border-line bg-surface p-5">
          <div className="grid gap-5 md:grid-cols-[12rem_1fr]">
            <div className="space-y-3">
              <div className="aspect-[4/5] overflow-hidden border border-line bg-ink">
                {previewUrl ? (
                  <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center px-5 text-center text-sm text-muted">
                    Select the creator image
                  </div>
                )}
              </div>
              <label className="block">
                <span className="sr-only">Creator image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-muted file:mr-3 file:border file:border-line file:bg-ink
                             file:text-parchment file:px-3 file:py-2 file:text-xs"
                />
              </label>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-muted">Title</span>
                <input
                  placeholder="Blue Door, June 11"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-line bg-ink px-4 py-3 placeholder:text-muted/60"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-muted">Context</span>
                <input
                  placeholder="Venue, show, release, or moment"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="w-full border border-line bg-ink px-4 py-3 placeholder:text-muted/60"
                />
              </label>
            </div>
          </div>
          {error && <p className="text-sm text-red-300/90">{error}</p>}
          <div className="mt-5 flex gap-3">
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
              onClick={() => {
                setCreating(false)
                setError(null)
              }}
              className="px-5 border border-line text-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="border border-line bg-surface p-5 text-sm text-muted">Loading frames...</p>}

      {!isLoading && (frames ?? []).length === 0 && !creating && (
        <div className="border border-dashed border-line bg-surface/60 p-6">
          <p className="font-display text-xl">No frames yet.</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Start with one image and a little context. The public link becomes the place where cards gather.
          </p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-5 border border-line bg-ink px-4 py-2 text-sm text-parchment hover:border-parchment/30"
          >
            Create first frame
          </button>
        </div>
      )}

      <ul className="space-y-3">
        {(frames ?? []).map((frame) => (
          <li key={frame.id} className="flex items-center gap-4 border border-line bg-surface p-4">
            <img src={frame.imageUrl} alt="" className="h-16 w-14 object-cover ring-1 ring-line" />
            <div className="flex-1 min-w-0">
              <p className="font-display truncate">{frame.title}</p>
              <p className="text-xs text-muted">
                {frame.context ?? 'Living Frame'} · {frame.cardCount}{' '}
                {frame.cardCount === 1 ? 'card' : 'cards'}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 text-sm">
              <Link to={`/m/${frame.slug}`} className="text-muted underline underline-offset-4 hover:text-parchment">
                Open
              </Link>
              <button
                type="button"
                onClick={() => copyLink(frame.slug)}
                className="text-muted underline underline-offset-4 hover:text-parchment"
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
