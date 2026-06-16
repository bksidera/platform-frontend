import { motion } from 'framer-motion'
import type { Contribution } from './types'
import type { ViewerRole } from './viewer'
import { ReadableContributionCard } from './ReadableContributionCard'

/**
 * The opened card (spec §2.2, §10): the canonical full card. Where the
 * thumbnail is a compressed paper artifact, this is the card opened for
 * reading — a dark gallery object, not a receipt or a form. The anatomy maps
 * one-to-one to the thumbnail: header → header, snippet → full note, photo →
 * large photo, mark → mark. Amount follows the same viewer-relative rule.
 */

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
          <ReadableContributionCard
            contribution={contribution}
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
                <ReadableContributionCard
                  contribution={c}
                  creatorFirst={creatorFirst}
                  viewerRole={viewerRole}
                  isOwn={isOwn(c)}
                />
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
