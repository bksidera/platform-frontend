import { motion } from 'framer-motion'
import type { Contribution } from './types'
import { amountDisplay, type ViewerRole } from './viewer'
import { PaymentGlyph } from './PaymentGlyph'

/**
 * The opened card (spec §2.2, §10): the canonical full card. Where the
 * thumbnail is a compressed paper artifact, this is the card opened for
 * reading — a dark gallery object, not a receipt or a form. The anatomy maps
 * one-to-one to the thumbnail: header → header, snippet → full note, photo →
 * large photo, mark → mark. Amount follows the same viewer-relative rule.
 */

function DetailBody({
  c,
  creatorFirst,
  viewerRole,
  isOwn,
}: {
  c: Contribution
  creatorFirst: string
  viewerRole: ViewerRole
  isOwn: boolean
}) {
  const name = c.visibility === 'private' ? 'Private card' : c.displayName
  const mark = amountDisplay(c, viewerRole, isOwn)
  return (
    <div className="space-y-3.5">
      <div className="flex items-start justify-between gap-4">
        <p className="font-display text-xl text-parchment/95 leading-tight">{name}</p>
        {mark.kind === 'glyph' && <span className="pt-1.5"><PaymentGlyph tone="parchment" size={11} /></span>}
        {mark.kind === 'amount' && <span className="pt-1 text-sm text-parchment/55">{mark.text}</span>}
      </div>
      {c.note && <p className="text-[15px] text-parchment/78 leading-relaxed">{c.note}</p>}
      {c.imageUrl && (
        <img
          src={c.imageUrl}
          alt=""
          className="w-full aspect-[4/3] object-cover rounded-[6px] ring-1 ring-white/10"
        />
      )}
      <p className="text-[11px] text-parchment/40 tracking-[0.08em]">
        Left with {creatorFirst} ·{' '}
        {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
      </p>
    </div>
  )
}

export function SupportDetailModal(props: {
  contribution: Contribution | null // single mode
  gallery: Contribution[] | null // cluster mode
  creatorName: string
  viewerRole: ViewerRole
  isOwn: (c: Contribution) => boolean
  onClose: () => void
}) {
  const { contribution, gallery, creatorName, viewerRole, isOwn, onClose } = props
  const creatorFirst = creatorName.split(' ')[0] ?? creatorName
  if (!contribution && !gallery) return null

  return (
    <div
      className="absolute inset-0 z-40 flex items-end md:items-center justify-center bg-black/55"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-[420px] max-h-[82vh] overflow-y-auto
                   bg-[#1a160f] border border-white/10 rounded-t-[14px] md:rounded-[14px]
                   px-6 pt-6 pb-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)]"
      >
        {contribution && (
          <DetailBody
            c={contribution}
            creatorFirst={creatorFirst}
            viewerRole={viewerRole}
            isOwn={isOwn(contribution)}
          />
        )}
        {gallery && (
          <div className="space-y-7">
            <h2 className="font-display text-lg text-parchment/95">
              {gallery.length} cards with {creatorFirst}
            </h2>
            {[...gallery].reverse().map((c) => (
              <div key={c.id} className="border-t border-white/8 pt-5 first:border-0 first:pt-0">
                <DetailBody c={c} creatorFirst={creatorFirst} viewerRole={viewerRole} isOwn={isOwn(c)} />
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
