import { useState } from 'react'
import { HoldToConfirm } from '../components/give/HoldToConfirm'

/**
 * The inverted flow's sheets (Addendum 2 §4). The scene stays; these rise
 * quietly over the mat. Money language exists only in the amount sheet and
 * the Hold — nowhere earlier. Abandonment returns the pin to the mat, no
 * guilt copy.
 */

function Sheet(props: { children: React.ReactNode; onPutBack: () => void }) {
  return (
    <div className="absolute inset-x-0 bottom-0 px-5 pb-6">
      <div className="w-full max-w-sm mx-auto bg-ink/92 backdrop-blur-sm border border-line p-5 space-y-4">
        {props.children}
        <button
          type="button"
          onClick={props.onPutBack}
          className="block mx-auto text-[11px] tracking-wide text-parchment/35 underline underline-offset-4 decoration-parchment/20"
        >
          Put it back
        </button>
      </div>
    </div>
  )
}

export function IdentifySheet(props: {
  artist: string
  onDone: (name: string, email: string) => void
  onChooseSpot?: () => void
  onPutBack: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  return (
    <Sheet onPutBack={props.onPutBack}>
      <input
        autoFocus
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-surface border border-line px-4 py-3 text-sm placeholder:text-muted/60"
      />
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full bg-surface border border-line px-4 py-3 text-sm placeholder:text-muted/60"
      />
      <p className="text-[11px] text-parchment/40">Your name will be visible to {props.artist}.</p>
      <button
        type="button"
        disabled={!name.trim() || !email.includes('@')}
        onClick={() => props.onDone(name.trim(), email.trim())}
        className="w-full py-3 border border-line bg-surface font-display disabled:opacity-40"
      >
        Continue
      </button>
      {props.onChooseSpot && (
        <button
          type="button"
          onClick={props.onChooseSpot}
          className="block mx-auto text-[11px] tracking-wide text-parchment/40 underline underline-offset-4 decoration-parchment/20"
        >
          Choose a different spot
        </button>
      )}
    </Sheet>
  )
}

export function NoteSheet(props: {
  onDone: (note: string, photoUrl: string | null) => void
  onPutBack: () => void
}) {
  const [note, setNote] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  return (
    <Sheet onPutBack={props.onPutBack}>
      <textarea
        maxLength={240}
        rows={2}
        placeholder="Add a note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full bg-surface border border-line px-4 py-3 text-sm placeholder:text-muted/60 resize-none"
      />
      <label className="block text-[11px] text-parchment/50">
        Add a photo from tonight (optional)
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0]
            setPhotoUrl(f ? URL.createObjectURL(f) : null)
          }}
          className="mt-2 block w-full text-xs file:mr-3 file:border file:border-line file:bg-ink file:text-parchment/80 file:px-3 file:py-1.5 file:text-xs"
        />
      </label>
      {photoUrl && <img src={photoUrl} alt="" className="w-full aspect-[4/3] object-cover ring-1 ring-line" />}
      <button
        type="button"
        onClick={() => props.onDone(note.trim(), photoUrl)}
        className="w-full py-3 border border-line bg-surface font-display"
      >
        {note.trim() || photoUrl ? 'Continue' : 'Skip'}
      </button>
    </Sheet>
  )
}

const PRESETS = [5, 10, 25]

export function AmountSheet(props: {
  onHoldComplete: (amountDollars: number) => void
  onPutBack: () => void
}) {
  const [amount, setAmount] = useState<number>(10)
  const [custom, setCustom] = useState('')
  return (
    <Sheet onPutBack={props.onPutBack}>
      <div className="flex gap-2">
        {PRESETS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setAmount(d)
              setCustom('')
            }}
            aria-pressed={amount === d && !custom}
            className={`flex-1 py-2.5 border text-sm ${
              amount === d && !custom
                ? 'border-parchment/50 text-parchment'
                : 'border-line text-parchment/60'
            }`}
          >
            ${d}
          </button>
        ))}
        <input
          inputMode="decimal"
          placeholder="$"
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value)
            const d = parseFloat(e.target.value)
            if (d >= 1) setAmount(Math.round(d))
          }}
          className="w-16 bg-surface border border-line px-2 py-2.5 text-sm text-center placeholder:text-muted/60"
        />
      </div>
      <HoldToConfirm
        label={`Press and hold to give $${amount}`}
        onConfirm={() => props.onHoldComplete(amount)}
      />
    </Sheet>
  )
}
