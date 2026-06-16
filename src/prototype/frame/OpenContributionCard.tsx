import { useState } from 'react'
import { motion } from 'framer-motion'

/**
 * The card being written. The waiting card expands into this paper object,
 * with amount presented as one material that can travel with the note/photo/name
 * rather than as a separate checkout.
 */

const PRESETS = [500, 1000, 2500]
const NAME_LIMIT = 24
const NOTE_LIMIT = 120

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
  const [justCard, setJustCard] = useState(false)

  const dollars = amountCents ? Math.round(amountCents / 100) : null
  const amountSelected = !justCard && !!amountCents && amountCents >= 100
  const hasCardContent = note.trim().length > 0 || !!imageUrl
  const canPlace = amountSelected || (justCard && hasCardContent)
  const needsCardContent = justCard && !hasCardContent

  const place = () => {
    if (!canPlace) return
    onPlace({
      displayName: name.trim() || 'A card was left',
      note: note.trim(),
      imageUrl,
      amountCents: justCard ? null : amountCents,
    })
  }

  const selectAmount = (cents: number) => {
    setJustCard(false)
    setAmountCents(cents)
    setCustomOpen(false)
    setCustom('')
  }

  const openCustom = () => {
    setJustCard(false)
    setCustomOpen(true)
    setAmountCents(null)
  }

  const selectJustCard = () => {
    setJustCard(true)
    setCustomOpen(false)
  }

  return (
    <motion.div
      layout
      className="w-full rounded-[12px] border border-[#d5c7ad]/80 px-5 pt-5 pb-5 text-[#211c16]"
      style={cardStyle}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="font-display text-xl leading-none text-[#211c16]">Leave a card for {creatorFirst}</p>
        {amountSelected && (
          <span
            className="h-2.5 w-2.5 rounded-full bg-[#3a7554] shadow-[0_1px_0_rgba(255,255,255,0.45)_inset]"
            aria-label="Amount attached"
            role="img"
          />
        )}
      </div>

      {/* Name */}
      <label className="block mb-4">
        <span className="mb-1.5 block text-[11px] font-medium text-[#211c16]/58">Your name</span>
        <input
          autoFocus
          aria-label="Your name"
          placeholder="Alex"
          maxLength={NAME_LIMIT}
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, NAME_LIMIT))}
          className="w-full bg-transparent border-0 border-b border-[#211c16]/15 rounded-none px-0 pb-2
                     font-display text-xl text-[#211c16] placeholder:text-[#211c16]/50 focus:outline-none focus:border-[#211c16]/40"
        />
      </label>

      {/* Note */}
      <label className="block mb-4">
        <span className="mb-1.5 block text-[11px] font-medium text-[#211c16]/58">Your card</span>
        <textarea
          maxLength={NOTE_LIMIT}
          rows={3}
          aria-label="Your card"
          placeholder="What stayed with you?"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, NOTE_LIMIT))}
          className="w-full bg-transparent px-0 py-0.5 text-[14px] text-[#211c16]/85 placeholder:text-[#211c16]/50 resize-none focus:outline-none leading-6"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, transparent 0, transparent 23px, rgba(33,28,22,0.12) 23px, rgba(33,28,22,0.12) 24px)',
          }}
        />
        {note.length >= 90 && (
          <span className="mt-1 block text-right text-[10px] text-[#211c16]/38">
            {note.length}/{NOTE_LIMIT}
          </span>
        )}
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
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm text-[#211c16]/52 hover:text-[#211c16]/72 transition-colors">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#211c16]/14 text-base leading-none">
              +
            </span>
            <span className="flex flex-col leading-tight">
              <span>Add a photo</span>
              <span className="text-[11px] text-[#211c16]/36">Optional</span>
            </span>
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

      {/* Support */}
      <div className="space-y-2.5">
        <div>
          <span className="block text-[11px] font-medium text-[#211c16]/68">Amount</span>
          <p className="mt-0.5 text-[11px] leading-snug text-[#211c16]/55">
            Optional. Only {creatorFirst} sees the amount.
          </p>
        </div>
        <div className="flex gap-1.5">
          {PRESETS.map((cents) => (
            <button
              key={cents}
              type="button"
              onClick={() => selectAmount(cents)}
              aria-pressed={amountCents === cents && !customOpen && !justCard}
              className={`min-h-11 flex-1 rounded-[6px] border py-2 text-sm transition-colors ${
                amountCents === cents && !customOpen && !justCard
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
            aria-pressed={customOpen && !justCard}
            className={`min-h-11 flex-1 rounded-[6px] border py-2 text-sm transition-colors ${
              customOpen && !justCard
                ? 'border-[#211c16]/70 bg-[#211c16] font-medium text-[#f2ebdd]'
                : 'border-[#211c16]/16 text-[#211c16]/58 hover:border-[#211c16]/30 hover:text-[#211c16]/85'
            }`}
          >
            Other
          </button>
        </div>

        {customOpen && !justCard && (
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
          onClick={selectJustCard}
          aria-pressed={justCard}
          className={`inline-flex min-h-11 w-full items-center gap-2 rounded-[6px] border px-3 py-2 text-left text-sm transition-colors ${
            justCard
              ? 'border-[#211c16]/55 bg-[#211c16]/[0.08] text-[#211c16]/86'
              : 'border-[#211c16]/16 text-[#211c16]/62 hover:border-[#211c16]/30 hover:text-[#211c16]/82'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${justCard ? 'bg-[#211c16]/70' : 'bg-[#211c16]/18'}`} />
          Just the card
        </button>

        {needsCardContent && (
          <p className="text-[11px] leading-snug text-[#211c16]/50">
            Add a note, photo, or amount to leave a card.
          </p>
        )}
      </div>

      {error && <p className="mt-3 text-xs text-red-800/80">{error}</p>}

      <button
        type="button"
        disabled={busy || !canPlace}
        onClick={place}
        className="mt-5 w-full rounded-[9px] border border-[#211c16] bg-[#211c16] py-3 font-display text-base text-[#f2ebdd]
                   shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition-opacity
                   disabled:border-[#211c16]/8 disabled:bg-[#211c16]/8 disabled:text-[#211c16]/32 disabled:shadow-none"
      >
        {busy
          ? 'Leaving card…'
          : `Leave card for ${creatorFirst}`}
      </button>
      {amountSelected && dollars && !busy && (
        <p className="mt-2 text-center text-[11px] text-[#211c16]/50">Amount: ${dollars}</p>
      )}
    </motion.div>
  )
}
