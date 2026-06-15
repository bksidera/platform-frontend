import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createMonument, listMyMonuments, uploadImage } from '../../services/api'

/**
 * Monument creation and listing for the creator dashboard. Upload the show
 * poster, name the night, share the link (QR placard generation lands in B5).
 */
export function MonumentsPanel() {
  const queryClient = useQueryClient()
  const { data: monuments } = useQuery({ queryKey: ['myMonuments'], queryFn: listMyMonuments })

  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [venue, setVenue] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  const submit = async () => {
    if (!title.trim() || !venue.trim() || !eventDate || !file) return
    setBusy(true)
    setError(null)
    try {
      const imageUrl = await uploadImage(file)
      await createMonument({ title: title.trim(), venue: venue.trim(), eventDate, imageUrl })
      await queryClient.invalidateQueries({ queryKey: ['myMonuments'] })
      setCreating(false)
      setTitle('')
      setVenue('')
      setEventDate('')
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
        <h2 className="font-display text-2xl">Monuments</h2>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="text-sm text-muted underline underline-offset-4"
          >
            New Monument
          </button>
        )}
      </div>

      {creating && (
        <div className="border border-line bg-surface p-5 space-y-4">
          <input
            placeholder="Title — e.g. the show or the night"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-ink border border-line px-4 py-3 placeholder:text-muted/60"
          />
          <input
            placeholder="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="w-full bg-ink border border-line px-4 py-3 placeholder:text-muted/60"
          />
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full bg-ink border border-line px-4 py-3 text-parchment [color-scheme:dark]"
          />
          <label className="block text-sm text-muted">
            The poster — it becomes the Monument
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
              disabled={busy || !title.trim() || !venue.trim() || !eventDate || !file}
              onClick={submit}
              className="flex-1 py-3 border border-line bg-ink font-display disabled:opacity-40"
            >
              {busy ? 'Uploading…' : 'Create'}
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
        {(monuments ?? []).map((m) => (
          <li key={m.id} className="border border-line bg-surface p-4 flex items-center gap-4">
            <img src={m.imageUrl} alt="" className="w-14 h-14 object-cover ring-1 ring-line" />
            <div className="flex-1 min-w-0">
              <p className="font-display truncate">{m.title}</p>
              <p className="text-xs text-muted">
                {m.venue} · {new Date(m.eventDate).toLocaleDateString()} ·{' '}
                {m.inscriptionCount} inscribed
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 text-sm">
              <Link to={`/m/${m.qrSourceSlug}`} className="text-muted underline underline-offset-4">
                View
              </Link>
              <button
                type="button"
                onClick={() => copyLink(m.qrSourceSlug)}
                className="text-muted underline underline-offset-4"
              >
                {copiedSlug === m.qrSourceSlug ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
