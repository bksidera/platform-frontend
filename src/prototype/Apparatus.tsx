/**
 * The mat apparatus (Addendum 2 §2): the plaque (identity and evidence, no
 * verbs) and the ledger edge (the guest book lying open). Gallery-label
 * register throughout.
 */

export function Plaque(props: {
  artist: string
  venue: string
  date: string
  pinCount: number
  stewardLine?: string
}) {
  return (
    <div className="text-center space-y-1.5">
      <p className="font-display text-xl text-parchment/95 leading-none">{props.artist}</p>
      <p className="text-[11px] tracking-[0.14em] text-parchment/50">
        {props.pinCount} {props.pinCount === 1 ? 'pin' : 'pins'} · {props.date} · {props.venue}
      </p>
      {props.stewardLine && (
        <button
          type="button"
          className="text-[11px] tracking-wide text-parchment/35 underline underline-offset-4 decoration-parchment/20"
        >
          {props.stewardLine}
        </button>
      )}
    </div>
  )
}

export function LedgerEdge({ names }: { names: string[] }) {
  return (
    <p
      aria-label="Recent names"
      className="text-[10px] tracking-[0.16em] text-parchment/35 text-center max-w-md truncate mb-2.5"
    >
      {names.join('  ·  ')}
    </p>
  )
}
