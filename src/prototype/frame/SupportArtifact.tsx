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
  'pointer-events-auto rounded-[6px] border border-[#cfc7b5]/40 bg-[#ece6d9] ' +
  'shadow-[0_2px_4px_rgba(0,0,0,0.18),0_6px_16px_-6px_rgba(0,0,0,0.5)] overflow-hidden text-left'

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

  // Note snippet beneath a photo only when the square is large enough to read it.
  const showNoteUnderPhoto = hasPhoto && hasNote && size >= 88
  const pad = Math.round(size * 0.085)

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`Card from ${isPrivate ? 'a private supporter' : contribution.displayName}`}
      initial={appear && !reducedMotion ? { opacity: 0, scale: 1.2 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`${SHELL} relative flex flex-col`}
      style={{ width: size, height: size, flexShrink: 0, padding: pad }}
    >
      {/* Header row: identity left, amount mark right. */}
      <div className="flex items-center justify-between gap-1.5 shrink-0">
        <span
          className="min-w-0 truncate font-display leading-none text-[#2a251e]"
          style={{ fontSize: Math.max(9, Math.round(size * 0.125)) }}
        >
          {name}
        </span>
        {mark.kind === 'glyph' && <PaymentGlyph size={Math.round(size * 0.1)} />}
        {mark.kind === 'amount' && (
          <span
            className="shrink-0 font-medium leading-none text-[#2a251e]/55"
            style={{ fontSize: Math.max(8, Math.round(size * 0.1)) }}
          >
            {mark.text}
          </span>
        )}
      </div>

      {/* Body zone. */}
      {hasPhoto ? (
        <div className="mt-1.5 flex-1 min-h-0 flex flex-col gap-1">
          <span className="block flex-1 min-h-0 overflow-hidden rounded-[3px] bg-[#2a251e]/8">
            <img
              src={contribution.imageUrl}
              alt=""
              className="h-full w-full object-cover"
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
        <div className="mt-1.5 flex-1 min-h-0 flex items-start">
          <span
            className="block overflow-hidden text-[#2a251e]/72"
            style={{
              fontSize: Math.max(8.5, Math.round(size * 0.115)),
              lineHeight: 1.28,
              display: '-webkit-box',
              WebkitLineClamp: size >= 88 ? 3 : 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {contribution.note}
          </span>
        </div>
      ) : (
        // Minimal card (name + amount only): a quiet centered seal, never empty.
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <span
            className="font-display tracking-wide text-[#2a251e]/22"
            style={{ fontSize: Math.round(size * 0.34) }}
          >
            {isPrivate ? '·' : initials(contribution.displayName)}
          </span>
        </div>
      )}
    </motion.button>
  )
}

export function ClusterChip(props: { count: number; size: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label={`${props.count} more cards`}
      className={`${SHELL} flex items-center justify-center bg-[#ece6d9]/85`}
      style={{ width: props.size, height: props.size, flexShrink: 0 }}
    >
      <span
        className="font-medium text-[#2a251e]/80"
        style={{ fontSize: Math.round(props.size * 0.18) }}
      >
        +{props.count}
      </span>
    </button>
  )
}
