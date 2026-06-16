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

  const selectAmount = (cents: number) => {
    setOptOut(false)
    setAmountCents(cents)
    setCustomOpen(false)
    setCustom('')
  }

  const openCustom = () => {
    setOptOut(false)
    setCustomOpen(true)
    setAmountCents(null)
  }

  return (
    <motion.div
      layout
      className="w-full rounded-[12px] border border-[#d5c7ad]/80 px-5 pt-5 pb-5 text-[#211c16]"
      style={cardStyle}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="font-display text-xl leading-none text-[#211c16]">Leave a card</p>
        <span className="h-2 w-2 rounded-full bg-[#211c16]/20 shadow-[0_1px_0_rgba(255,255,255,0.35)_inset]" aria-hidden />
      </div>

      {/* Name */}
      <label className="block mb-4">
        <input
          autoFocus
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent border-0 border-b border-[#211c16]/15 rounded-none px-0 pb-2
                     font-display text-xl text-[#211c16] placeholder:text-[#211c16]/50 focus:outline-none focus:border-[#211c16]/40"
        />
      </label>

      {/* Note */}
      <label className="block mb-4">
        <textarea
          maxLength={240}
          rows={3}
          placeholder="Your note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-transparent px-0 py-0.5 text-[14px] text-[#211c16]/85 placeholder:text-[#211c16]/50 resize-none focus:outline-none leading-6"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, transparent 0, transparent 23px, rgba(33,28,22,0.12) 23px, rgba(33,28,22,0.12) 24px)',
          }}
        />
      </label>

      {/* Photo */}
      <div className="mb-1">
        {imageUrl ? (
          <div className="relative h-14 w-14 rotate-[-1.5deg] rounded-[4px] bg-[#fbf5e8] p-1 shadow-[0_1px_2px_rgba(0,0,0,0.22)]">
            <img src={imageUrl} alt="" className="h-full w-full rounded-[2px] object-cover" />
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => setImageUrl(null)}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#211c16] border border-[#f2ebdd]/70 text-[#f2ebdd] text-[10px] leading-none"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-[#211c16]/40 hover:text-[#211c16]/65 transition-colors">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#211c16]/14 text-base leading-none">
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

      {/* Divider */}
      <div className="my-4 h-px bg-[#211c16]/10" />

      {/* Amount */}
      <div className="space-y-2.5">
        <div>
          <span className="block text-[11px] font-medium text-[#211c16]/62">Amount</span>
          <p className="mt-0.5 text-[11px] leading-snug text-[#211c16]/55">
            If this moved you, an amount can travel with your card.
          </p>
        </div>
        <div className="flex gap-1.5">
          {PRESETS.map((cents) => (
            <button
              key={cents}
              type="button"
              onClick={() => selectAmount(cents)}
              aria-pressed={amountCents === cents && !customOpen && !optOut}
              className={`flex-1 rounded-[6px] border py-1.5 text-sm transition-colors ${
                amountCents === cents && !customOpen && !optOut
                  ? 'border-[#211c16]/70 bg-[#211c16] font-medium text-[#f2ebdd]'
                  : 'border-[#211c16]/16 text-[#211c16]/58 hover:border-[#211c16]/30 hover:text-[#211c16]/85'
              }`}
            >
              ${cents / 100}
            </button>
          ))}
          <button
            type="button"
            onClick={openCustom}
            aria-pressed={customOpen && !optOut}
            className={`flex-1 rounded-[6px] border py-1.5 text-sm transition-colors ${
              customOpen && !optOut
                ? 'border-[#211c16]/70 bg-[#211c16] font-medium text-[#f2ebdd]'
                : 'border-[#211c16]/16 text-[#211c16]/58 hover:border-[#211c16]/30 hover:text-[#211c16]/85'
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
            className="w-full rounded-[6px] border border-[#211c16]/16 bg-transparent px-3 py-1.5 text-xs text-[#211c16] placeholder:text-[#211c16]/35 focus:outline-none focus:border-[#211c16]/32"
          />
        )}

        <button
          type="button"
          onClick={() => setOptOut((c) => !c)}
          aria-pressed={optOut}
          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-left text-xs transition-colors ${
            optOut
              ? 'border-[#211c16]/45 bg-[#211c16]/[0.08] text-[#211c16]/82'
              : 'border-[#211c16]/12 text-[#211c16]/58 hover:border-[#211c16]/28 hover:text-[#211c16]/76'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${optOut ? 'bg-[#211c16]/70' : 'bg-[#211c16]/18'}`} />
          Leave only the card
        </button>

        {optOut && (
          <p className="text-[11px] leading-snug text-[#211c16]/45">
            {needsCardContent
              ? 'Add a note or photo to leave only the card.'
              : 'Your card will be placed without an amount.'}
          </p>
        )}
      </div>

      {error && <p className="mt-3 text-xs text-red-800/80">{error}</p>}

      <button
        type="button"
        disabled={busy || (!canPlacePaid && !canPlaceUnpaid)}
        onClick={place}
        className="mt-5 w-full rounded-[9px] border border-[#211c16] bg-[#211c16] py-3 font-display text-base text-[#f2ebdd]
                   shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition-opacity
                   disabled:border-[#211c16]/8 disabled:bg-[#211c16]/8 disabled:text-[#211c16]/32 disabled:shadow-none"
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
