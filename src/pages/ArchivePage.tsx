import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicArchive } from '../services/api'

/**
 * The Archive (/:slug): creator identity, not a storefront. Frames are shared
 * as direct public objects when a creator wants cards attached to a work.
 */
export function ArchivePage() {
  const { slug = '' } = useParams()
  const { data: archive, isLoading } = useQuery({
    queryKey: ['archive', slug],
    queryFn: () => getPublicArchive(slug),
  })

  if (isLoading) {
    return <div className="min-h-full flex items-center justify-center text-muted">…</div>
  }
  if (!archive) {
    return (
      <div className="min-h-full flex items-center justify-center text-muted">
        No archive at this address.
      </div>
    )
  }

  const frames = archive.frames ?? []

  return (
    <div className="min-h-full max-w-3xl mx-auto px-6 py-12 md:py-16 flex flex-col gap-10">
      <header className="space-y-6">
        {archive.heroImageUrl && (
          <img
            src={archive.heroImageUrl}
            alt={archive.name}
            className="w-full aspect-[3/2] object-cover rounded-[8px] ring-1 ring-line"
          />
        )}
        <h1 className="font-display text-5xl leading-tight">{archive.name}</h1>
        {archive.stewardCount > 0 && (
          <p className="text-muted text-sm tracking-wide">
            Sustained by {archive.stewardCount}{' '}
            {archive.stewardCount === 1 ? 'Steward' : 'Stewards'}
          </p>
        )}
      </header>

      {archive.bio && <p className="text-parchment/90 leading-relaxed">{archive.bio}</p>}

      {archive.mediaLinks && archive.mediaLinks.length > 0 && (
        <ul className="space-y-2">
          {archive.mediaLinks.map((l) => (
            <li key={l.url}>
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-muted underline underline-offset-4 hover:text-parchment"
              >
                {l.kind === 'link' ? l.url : l.kind}
              </a>
            </li>
          ))}
        </ul>
      )}

      {frames.length > 0 ? (
        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Living Frames</p>
            <h2 className="mt-1 font-display text-3xl">Works holding cards</h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {frames.map((frame) => (
              <li key={frame.id}>
                <Link
                  to={`/m/${frame.slug}`}
                  className="group block overflow-hidden rounded-[8px] border border-line bg-surface transition-colors hover:border-parchment/30"
                >
                  <img src={frame.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
                  <div className="p-4">
                    <p className="font-display text-2xl leading-tight text-parchment/95">{frame.title}</p>
                    {frame.context && <p className="mt-1 text-sm text-muted">{frame.context}</p>}
                    <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">
                      {frame.cardCount} {frame.cardCount === 1 ? 'card' : 'cards'} gathered
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-center text-sm text-muted">No active frame shared here yet.</p>
      )}
    </div>
  )
}
