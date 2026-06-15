import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicArchive } from '../services/api'

/**
 * The Archive (/:slug): a monument, not a storefront. The artist's name set
 * large is the hero. Aggregate counts always; named Stewards arrive with the
 * two-key work (B6).
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

  return (
    <div className="min-h-full max-w-xl mx-auto px-6 py-16 flex flex-col gap-12">
      <header className="space-y-6">
        {archive.heroImageUrl && (
          <img
            src={archive.heroImageUrl}
            alt={archive.name}
            className="w-full aspect-[3/2] object-cover ring-1 ring-line"
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

      {/* The two acts. Stewardship arrives in B4; the Moment is live. */}
      <div className="mt-auto space-y-3">
        {archive.stripeOnboarded ? (
          <Link
            to={`/give/${archive.slug}`}
            className="block w-full text-center py-5 border border-line bg-surface font-display text-xl tracking-wide hover:border-parchment/30"
          >
            Make a gift
          </Link>
        ) : (
          <p className="text-center text-sm text-muted">Not yet receiving gifts.</p>
        )}
      </div>
    </div>
  )
}
