import { motion, useReducedMotion } from 'framer-motion'
import type { Contribution } from './types'
import { amountDisplay, type ViewerRole } from './viewer'
import { PaymentGlyph } from './PaymentGlyph'

/**
 * The placed card thumbnail (spec §2.1, §4–7): a hard square, warm paper, a
 * compressed representation of one card. The square shell never changes width;
 * the interior adapts to whatever the card holds (photo, note, amount mark, or
 * a minimal mark) and degrades gracefully through every content combination.
 * The full, readable card lives in the detail view.
 */

export function initials(name: string): string {
  const parts = name.replace(/[^a-zA-Z0-9 ]/g, ' ').trim().split(/\s+/)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : parts[0]?.[1] ?? ''
  return (a + b).toUpperCase() || '·'
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

interface Props {
  contribution: Contribution
  size: number // square edge in px
  viewerRole?: ViewerRole
  isOwn?: boolean
  appear?: boolean
  onClick: () => void
}

const SHELL =
  'pointer-events-auto rounded-[6px] border border-[#d4c8b2]/55 bg-[#eee6d7] text-[#2a251e] ' +
  'shadow-[0_1px_0_rgba(255,255,255,0.55)_inset,0_2px_5px_rgba(0,0,0,0.2),0_8px_20px_-8px_rgba(0,0,0,0.58)] overflow-hidden text-left'

export function SupportArtifact({
  contribution,
  size,
  viewerRole = 'public',
  isOwn = false,
  appear,
  onClick,
}: Props) {
  const reducedMotion = useReducedMotion()
  const isPrivate = contribution.visibility === 'private'
  const name = isPrivate ? 'Private' : firstName(contribution.displayName)
  const hasPhoto = !!contribution.imageUrl
  const hasNote = !!contribution.note
  const mark = amountDisplay(contribution, viewerRole, isOwn)

  const showNoteUnderPhoto = hasPhoto && hasNote && size >= 88
  const isMinimal = !hasPhoto && !hasNote
  const pad = Math.round(size * (isMinimal ? 0.1 : 0.085))

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={isPrivate ? 'Private card' : `Card from ${contribution.displayName}`}
      initial={appear && !reducedMotion ? { opacity: 0, scale: 1.2 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`${SHELL} relative flex flex-col`}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        padding: pad,
        background:
          'linear-gradient(145deg, rgba(242,235,222,0.98), rgba(231,222,204,0.97) 60%, rgba(218,207,185,0.94))',
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-1.5">
        <span
          className={`min-w-0 truncate font-display leading-none text-[#2a251e] ${
            isMinimal ? 'max-w-[82%]' : ''
          }`}
          style={{ fontSize: Math.max(9.5, Math.round(size * (isMinimal ? 0.14 : 0.125))) }}
        >
          {name}
        </span>
        {mark.kind === 'glyph' && <PaymentGlyph tone="green" size={Math.round(size * 0.1)} />}
        {mark.kind === 'amount' && (
          <span
            className="shrink-0 font-medium leading-none text-[#2a251e]/55"
            style={{ fontSize: Math.max(8, Math.round(size * 0.1)) }}
          >
            {mark.text}
          </span>
        )}
      </div>

      {hasPhoto ? (
        <div className="mt-1.5 flex min-h-0 flex-1 flex-col gap-1">
          <span
            className="block min-h-0 flex-1 overflow-hidden rounded-[3px] bg-[#2a251e]/8 p-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
            style={{
              transform: `rotate(${(stableTilt(contribution.id) / 10).toFixed(2)}deg)`,
              background: '#f8f2e5',
            }}
          >
            <img
              src={contribution.imageUrl}
              alt=""
              className="h-full w-full rounded-[2px] object-cover"
              draggable={false}
            />
          </span>
          {showNoteUnderPhoto && (
            <span
              className="block truncate text-[#2a251e]/55 leading-none"
              style={{ fontSize: Math.max(8, Math.round(size * 0.095)) }}
            >
              {contribution.note}
            </span>
          )}
        </div>
      ) : hasNote ? (
        <div className="mt-1.5 flex min-h-0 flex-1 items-center">
          <span
            className="block overflow-hidden font-display text-[#2a251e]/74"
            style={{
              fontSize: Math.max(10, Math.round(size * 0.13)),
              lineHeight: 1.1,
              display: '-webkit-box',
              WebkitLineClamp: size >= 88 ? 4 : 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {contribution.note}
          </span>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <span
            className="font-display tracking-wide text-[#2a251e]/20"
            style={{ fontSize: Math.round(size * 0.3) }}
          >
            {isPrivate ? '·' : initials(contribution.displayName)}
          </span>
        </div>
      )}

      {isMinimal && <span className="mt-auto block h-px w-2/3 bg-[#2a251e]/10" />}
    </motion.button>
  )
}

function stableTilt(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return ((Math.abs(hash) % 41) - 20) / 2
}
