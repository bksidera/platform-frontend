import { useState } from 'react'
import { motion } from 'framer-motion'

/**
 * The card being written. The waiting card expands into this paper object,
 * with amount presented as one material that can travel with the note/photo/name
 * rather than as a separate checkout.
 */

const PRESETS = [500, 1000, 2500]

export interface CardDraft {
  displayName: string
  note: string
  imageUrl: string | null
  amountCents: number | null // null = opted out
}

interface Props {
  creatorFirst: string
  busy: boolean
  error: string | null
  onPlace: (draft: CardDraft) => void
}

const cardStyle = {
  background:
    'linear-gradient(145deg, rgba(242,235,221,0.98), rgba(230,221,203,0.96) 58%, rgba(216,205,184,0.95))',
  boxShadow:
    '0 1px 0 rgba(255,255,255,0.65) inset, 0 22px 48px rgba(0,0,0,0.34), 0 7px 20px rgba(0,0,0,0.26)',
}

export function OpenContributionCard({ creatorFirst, busy, error, onPlace }: Props) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [amountCents, setAmountCents] = useState<number | null>(1000)
  const [customOpen, setCustomOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const [optOut, setOptOut] = useState(false)

  const dollars = amountCents ? Math.round(amountCents / 100) : null
  const canPlacePaid = !optOut && !!amountCents && amountCents >= 100 && name.trim().length > 0
  const canPlaceUnpaid = optOut && name.trim().length > 0 && (note.trim().length > 0 || !!imageUrl)
  const needsCardContent = optOut && name.trim().length > 0 && !note.trim() && !imageUrl

  const place = () => {
    if (!canPlacePaid && !canPlaceUnpaid) return
    onPlace({
      displayName: name.trim(),
      note: note.trim(),
      imageUrl,
      amountCents: optOut ? null : amountCents,
    })
  }

  return (
    <motion.div
      layout
      className="w-full rounded-[12px] border border-[#d5c7ad]/80 px-5 pt-5 pb-4 space-y-4 text-[#211c16]"
      style={cardStyle}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="font-display text-xl leading-none text-[#211c16]/88">Leave a card</p>
        <span className="h-2.5 w-2.5 rounded-full bg-[#211c16]/14 shadow-[0_1px_0_rgba(255,255,255,0.35)_inset]" aria-hidden />
      </div>

      <label className="block">
        <input
          autoFocus
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent border-0 border-b border-[#211c16]/18 rounded-none px-0 py-1.5
                     font-display text-lg text-[#211c16] placeholder:text-[#211c16]/22 focus:outline-none focus:border-[#211c16]/42"
        />
      </label>

      <label className="block">
        <textarea
          maxLength={240}
          rows={2}
          placeholder="What do you want to leave with Maria?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-transparent px-0 py-0.5 text-[13px] text-[#211c16]/82 placeholder:text-[#211c16]/34 resize-none focus:outline-none leading-6"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, transparent 0, transparent 23px, rgba(33,28,22,0.16) 23px, rgba(33,28,22,0.16) 24px)',
          }}
        />
      </label>

      <div className="flex items-center gap-3">
        {imageUrl ? (
          <div className="relative h-16 w-16 rotate-[-1.5deg] rounded-[4px] bg-[#fbf5e8] p-1 shadow-[0_1px_2px_rgba(0,0,0,0.22)]">
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full rounded-[2px] object-cover"
            />
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => setImageUrl(null)}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#211c16] border border-[#f2ebdd]/70 text-[#f2ebdd] text-[10px] leading-none"
            >
              x
            </button>
          </div>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full py-1 pr-2 text-xs text-[#211c16]/58 transition-colors hover:text-[#211c16]/82">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#211c16]/[0.055] text-base leading-none text-[#211c16]/42">
              +
            </span>
            Add a photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setImageUrl(URL.createObjectURL(f))
              }}
            />
          </label>
        )}
      </div>

      <div
        className={`space-y-2.5 border-t border-[#211c16]/10 pt-3 transition-opacity ${
          optOut ? 'opacity-55' : ''
        }`}
      >
        <div>
          <span className="block text-[11px] text-[#211c16]/48">Amount</span>
          <p className="mt-0.5 text-[11px] leading-snug text-[#211c16]/50">
            If this moved you, an amount can travel with your card.
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          {PRESETS.map((cents) => (
            <button
              key={cents}
              type="button"
              disabled={optOut}
              onClick={() => {
                setAmountCents(cents)
                setCustomOpen(false)
                setCustom('')
              }}
              aria-pressed={amountCents === cents && !customOpen && !optOut}
              className={`px-1 py-1 transition-colors ${
                amountCents === cents && !customOpen && !optOut
                  ? 'border-b border-[#211c16] font-medium text-[#211c16]'
                  : 'text-[#211c16]/58 hover:text-[#211c16]/82'
              }`}
            >
              ${cents / 100}
            </button>
          ))}
          <button
            type="button"
            disabled={optOut}
            onClick={() => {
              setCustomOpen(true)
              setAmountCents(null)
            }}
            aria-pressed={customOpen && !optOut}
            className={`px-1 py-1 transition-colors ${
              customOpen && !optOut
                ? 'border-b border-[#211c16] font-medium text-[#211c16]'
                : 'text-[#211c16]/58 hover:text-[#211c16]/82'
            }`}
          >
            Other
          </button>
        </div>
        {customOpen && !optOut && (
          <input
            autoFocus
            inputMode="decimal"
            placeholder="Amount in dollars"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value)
              const d = parseFloat(e.target.value)
              setAmountCents(d >= 1 ? Math.round(d * 100) : null)
            }}
            className="w-full rounded-[6px] border border-[#211c16]/18 bg-transparent px-3 py-1.5 text-xs text-[#211c16] placeholder:text-[#211c16]/35 focus:outline-none focus:border-[#211c16]/35"
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => setOptOut((current) => !current)}
        aria-pressed={optOut}
        className={`w-fit border-b py-0.5 text-left text-xs transition-colors ${
          optOut
            ? 'border-[#211c16]/42 text-[#211c16]/72'
            : 'border-transparent text-[#211c16]/50 hover:border-[#211c16]/20 hover:text-[#211c16]/68'
        }`}
      >
        Leave only the card
      </button>

      {optOut && (
        <p className="text-[11px] leading-snug text-[#211c16]/45">
          {needsCardContent
            ? 'Add a note or photo to leave only the card.'
            : 'Your card will be placed without an amount.'}
        </p>
      )}

      {error && <p className="text-xs text-red-800/80">{error}</p>}

      <button
        type="button"
        disabled={busy || (!canPlacePaid && !canPlaceUnpaid)}
        onClick={place}
        className="w-full rounded-[8px] border border-[#211c16]/24 bg-[#211c16]/[0.92] py-2.5 font-display text-sm text-[#f2ebdd]
                   shadow-[0_5px_12px_rgba(0,0,0,0.18)] transition-opacity
                   disabled:border-[#211c16]/8 disabled:bg-[#211c16]/10 disabled:text-[#211c16]/38 disabled:shadow-none"
      >
        {busy
          ? 'One moment'
          : optOut
            ? `Leave this with ${creatorFirst}`
            : dollars
              ? `Place $${dollars} with ${creatorFirst}`
              : `Place this with ${creatorFirst}`}
      </button>
    </motion.div>
  )
}
