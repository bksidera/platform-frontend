import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import QRCode from 'qrcode'
import {
  approveCardPhoto,
  createFrame,
  getCreatorFrame,
  hideCard,
  holdCardPhoto,
  listMyFrames,
  uploadImage,
} from '../../services/api'
import type { CreatorCard, MyFrame } from '../../types/api.types'

function formatAmount(card: CreatorCard) {
  if (!card.amountCents) return 'Card only'
  const amount = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: card.currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(card.amountCents / 100)
  return card.paymentStatus === 'succeeded' ? amount : `${amount} waiting`
}

function formatMoney(cents = 0) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function frameSignal(frame: MyFrame) {
  const held = frame.heldPhotoCount ?? 0
  const waiting = frame.amountPendingCents ?? 0
  if (held > 0) return `${held} photo${held === 1 ? '' : 's'} to review`
  if (waiting > 0) return `${formatMoney(waiting)} still waiting`
  if ((frame.amountReceivedCents ?? 0) > 0) return `${formatMoney(frame.amountReceivedCents)} received`
  return `${frame.cardCount} ${frame.cardCount === 1 ? 'card' : 'cards'} gathered`
}

function photoStatusLabel(card: CreatorCard) {
  if (!card.photoUrl) return null
  if (card.photoModerationStatus === 'approved') return 'Photo visible'
  if (card.photoModerationStatus === 'held') return 'Photo held'
  return 'Photo pending'
}

function formatCardDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
}

function slugFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'frame'
}

function ReviewCard({
  card,
  onHide,
  onModeratePhoto,
}: {
  card: CreatorCard
  onHide: (cardId: string) => void
  onModeratePhoto: (cardId: string, action: 'approve' | 'hold') => void
}) {
  const photoStatus = photoStatusLabel(card)
  const held = card.photoModerationStatus === 'held'

  return (
    <li className={card.hiddenByCreator ? 'opacity-55' : ''}>
      <article
        className="rounded-[8px] border border-[#d8ceb9]/70 px-5 py-5 text-[#211c16]
                   shadow-[0_1px_0_rgba(255,255,255,0.58)_inset,0_14px_34px_rgba(0,0,0,0.24)]"
        style={{
          background:
            'linear-gradient(145deg, rgba(244,237,224,0.99), rgba(232,224,207,0.98) 58%, rgba(219,208,187,0.96))',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-2xl leading-tight text-[#211c16]/90">{card.displayName}</p>
            <p className="mt-1 text-xs text-[#2a251e]/48">{card.email}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-lg leading-tight text-[#211c16]/78">{formatAmount(card)}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#2a251e]/40">
              {card.hiddenByCreator ? 'hidden' : card.visibility}
            </p>
          </div>
        </div>

        {card.note && (
          <p className="mt-5 font-display text-[19px] leading-relaxed text-[#2a251e]/78">
            {card.note}
          </p>
        )}

        {card.photoUrl && (
          <div className="mt-5 grid gap-4 sm:grid-cols-[9rem_1fr]">
            <div className="rounded-[7px] bg-[#fbf5e8] p-1.5 shadow-[0_1px_1px_rgba(255,255,255,0.65)_inset,0_8px_18px_-14px_rgba(42,37,30,0.8)]">
              <img
                src={card.photoUrl}
                alt=""
                className={`aspect-[4/3] w-full rounded-[4px] object-cover saturate-[0.78] contrast-[0.94] sepia-[0.08] ${
                  held ? 'opacity-45' : 'opacity-95'
                }`}
              />
            </div>
            <div className="flex flex-col justify-between gap-4">
              <div>
                <p className="font-display text-base text-[#211c16]/78">{photoStatus}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#2a251e]/50">
                  {held
                    ? 'This photo is hidden from the public frame.'
                    : 'This photo is on the card. Hold it if it should not stay public.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {card.photoModerationStatus !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => onModeratePhoto(card.id, 'approve')}
                    className="rounded-[5px] border border-[#211c16]/16 px-3 py-2 text-[#211c16]/72 hover:border-[#211c16]/28"
                  >
                    Show photo
                  </button>
                )}
                {card.photoModerationStatus !== 'held' && (
                  <button
                    type="button"
                    onClick={() => onModeratePhoto(card.id, 'hold')}
                    className="rounded-[5px] border border-[#211c16]/12 px-3 py-2 text-[#211c16]/50 hover:text-[#211c16]/72"
                  >
                    Hold photo
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#2a251e]/10 pt-3 text-xs text-[#2a251e]/45">
          <span>{formatCardDate(card.createdAt)}</span>
          {card.photoUrl && photoStatus && <span>{photoStatus}</span>}
          {card.hiddenByCreator ? (
            <span>Hidden from frame</span>
          ) : (
            <button
              type="button"
              onClick={() => onHide(card.id)}
              className="underline underline-offset-4 hover:text-[#211c16]/76"
            >
              Hide card
            </button>
          )}
        </div>
      </article>
    </li>
  )
}

export function FramesPanel() {
  const queryClient = useQueryClient()
  const { data: frames, isLoading } = useQuery({ queryKey: ['myFrames'], queryFn: listMyFrames })

  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const [qrSlug, setQrSlug] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const { data: openFrame, isLoading: cardsLoading } = useQuery({
    queryKey: ['creatorFrame', openSlug],
    queryFn: () => getCreatorFrame(openSlug ?? ''),
    enabled: !!openSlug,
  })

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (!qrSlug) {
      setQrDataUrl(null)
      return
    }
    let cancelled = false
    void QRCode.toDataURL(publicFrameUrl(qrSlug), {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 512,
      color: { dark: '#15120e', light: '#ece6d9' },
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [qrSlug])

  const publicFrameUrl = (slug: string) => `${window.location.origin}/m/${slug}`

  const submit = async () => {
    if (!title.trim() || !file) return
    setBusy(true)
    setError(null)
    try {
      const imageUrl = await uploadImage(file)
      await createFrame({ title: title.trim(), context: context.trim() || undefined, imageUrl })
      await queryClient.invalidateQueries({ queryKey: ['myFrames'] })
      setCreating(false)
      setTitle('')
      setContext('')
      setFile(null)
      setPreviewUrl(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const copyLink = (slug: string) => {
    void navigator.clipboard.writeText(publicFrameUrl(slug))
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const downloadQr = (frameTitle: string) => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `${slugFileName(frameTitle)}-qr.png`
    a.click()
  }

  const hide = async (cardId: string) => {
    await hideCard(cardId)
    await queryClient.invalidateQueries({ queryKey: ['creatorFrame', openSlug] })
    await queryClient.invalidateQueries({ queryKey: ['myFrames'] })
  }

  const moderatePhoto = async (cardId: string, action: 'approve' | 'hold') => {
    if (action === 'approve') {
      await approveCardPhoto(cardId)
    } else {
      await holdCardPhoto(cardId)
    }
    await queryClient.invalidateQueries({ queryKey: ['creatorFrame', openSlug] })
  }

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-5 border-b border-line pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Share center</p>
          <h2 className="mt-1 font-display text-3xl">Living Frames ready to send</h2>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">
            Create the work object, copy the link, pull the QR, and review the cards gathering at its edge.
          </p>
        </div>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="shrink-0 rounded-[7px] border border-line bg-surface px-4 py-2 text-sm text-parchment hover:border-parchment/30"
          >
            New frame
          </button>
        )}
      </div>

      {creating && (
        <div className="rounded-[8px] border border-line bg-surface p-5 shadow-[0_18px_60px_-42px_rgba(0,0,0,0.9)]">
          <div className="mb-5">
            <p className="font-display text-xl">Prepare a frame</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Choose the image first. The public link will keep the work dominant and hold one waiting card below it.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-[12rem_1fr]">
            <div className="space-y-3">
              <div className="aspect-[4/5] overflow-hidden rounded-[8px] border border-line bg-ink shadow-[0_16px_34px_-24px_rgba(0,0,0,0.9)]">
                {previewUrl ? (
                  <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center px-5 text-center text-sm text-muted">
                    Select the creator image
                  </div>
                )}
              </div>
              <label className="block">
                <span className="sr-only">Creator image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-muted file:mr-3 file:rounded-[5px] file:border file:border-line file:bg-ink
                             file:text-parchment file:px-3 file:py-2 file:text-xs"
                />
              </label>
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-muted">Title</span>
                <input
                  placeholder="Blue Door, June 11"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-[7px] border border-line bg-ink px-4 py-3 placeholder:text-muted/60"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.12em] text-muted">Context</span>
                <input
                  placeholder="Venue, show, release, or moment"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="w-full rounded-[7px] border border-line bg-ink px-4 py-3 placeholder:text-muted/60"
                />
              </label>
            </div>
          </div>
          {error && <p className="text-sm text-red-300/90">{error}</p>}
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              disabled={busy || !title.trim() || !file}
              onClick={submit}
              className="flex-1 rounded-[7px] border border-line bg-ink py-3 font-display disabled:opacity-40"
            >
              {busy ? 'Uploading...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false)
                setError(null)
              }}
              className="rounded-[7px] border border-line px-5 text-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="rounded-[8px] border border-line bg-surface p-5 text-sm text-muted">Loading frames...</p>}

      {!isLoading && (frames ?? []).length === 0 && !creating && (
        <div className="grid gap-5 rounded-[8px] border border-dashed border-line bg-surface/60 p-6 md:grid-cols-[1fr_14rem] md:items-center">
          <div>
            <p className="font-display text-2xl">Create the first shareable frame.</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Start with one strong image and a little context. You will get a public link and QR for the place where cards gather.
            </p>
          </div>
          <div className="rounded-[8px] border border-line bg-ink/70 p-3">
            <div className="aspect-[4/5] rounded-[6px] border border-line bg-surface/45" />
            <div className="mx-auto mt-3 h-10 w-16 rounded-[5px] bg-parchment/70" />
          </div>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-[7px] border border-line bg-ink px-4 py-2 text-sm text-parchment hover:border-parchment/30 md:col-span-2 md:w-fit"
          >
            Create first frame
          </button>
        </div>
      )}

      <ul className="space-y-4">
        {(frames ?? []).map((frame) => {
          const expanded = openSlug === frame.slug
          const heldPhotoCount =
            expanded
              ? (openFrame?.cards ?? []).filter(
                  (card) => card.photoUrl && card.photoModerationStatus !== 'approved',
                ).length
              : 0
          return (
            <li key={frame.id} className="overflow-hidden rounded-[8px] border border-line bg-surface">
              <div className="grid gap-4 p-4 lg:grid-cols-[9.5rem_1fr_auto] lg:items-start">
                <Link
                  to={`/m/${frame.slug}`}
                  className="block h-44 w-full overflow-hidden rounded-[7px] border border-line bg-ink lg:h-48"
                  aria-label={`Open ${frame.title}`}
                >
                  <img src={frame.imageUrl} alt="" className="h-full w-full object-cover" />
                </Link>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-brass/30 bg-brass/10 px-2.5 py-1 text-[11px] text-parchment">
                      Live
                    </span>
                    {(frame.heldPhotoCount ?? 0) > 0 && (
                      <span className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted">
                        {frame.heldPhotoCount} photo{frame.heldPhotoCount === 1 ? '' : 's'} to review
                      </span>
                    )}
                  </div>
                  <p className="mt-3 font-display text-3xl leading-tight">{frame.title}</p>
                  <p className="mt-1 text-sm text-muted">{frame.context ?? 'Living Frame'}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-[7px] border border-line bg-ink/35 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Cards</p>
                      <p className="mt-1 font-display text-xl">{frame.visibleCardCount ?? frame.cardCount}</p>
                    </div>
                    <div className="rounded-[7px] border border-line bg-ink/35 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Received</p>
                      <p className="mt-1 font-display text-xl">{formatMoney(frame.amountReceivedCents)}</p>
                    </div>
                    <div className="rounded-[7px] border border-line bg-ink/35 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Waiting</p>
                      <p className="mt-1 font-display text-xl">{formatMoney(frame.amountPendingCents)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    {frameSignal(frame)}
                  </p>
                  <p className="mt-3 break-all rounded-[6px] border border-line bg-ink/30 px-3 py-2 text-xs text-muted">
                    {publicFrameUrl(frame.slug)}
                  </p>
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-2 text-sm sm:flex sm:flex-wrap lg:flex-col lg:items-stretch">
                  <button
                    type="button"
                    onClick={() => copyLink(frame.slug)}
                    className="rounded-[6px] border border-parchment/28 bg-ink px-3 py-2 text-parchment hover:border-parchment/45"
                  >
                    {copiedSlug === frame.slug ? 'Copied' : 'Copy link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrSlug(qrSlug === frame.slug ? null : frame.slug)}
                    className="rounded-[6px] border border-line px-3 py-2 text-parchment hover:border-parchment/30"
                  >
                    {qrSlug === frame.slug ? 'Hide QR' : 'Show QR'}
                  </button>
                  <Link
                    to={`/m/${frame.slug}`}
                    className="rounded-[6px] border border-line px-3 py-2 text-center text-muted hover:text-parchment"
                  >
                    Preview
                  </Link>
                  <button
                    type="button"
                    onClick={() => setOpenSlug(expanded ? null : frame.slug)}
                    className="rounded-[6px] border border-line px-3 py-2 text-muted hover:text-parchment"
                  >
                    {expanded ? 'Close cards' : 'Review cards'}
                  </button>
                </div>
              </div>

              {qrSlug === frame.slug && (
                <div className="border-t border-line bg-ink/28 p-4">
                  <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
                    <div className="flex aspect-square items-center justify-center rounded-[7px] bg-parchment p-2">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} alt={`QR code for ${frame.title}`} className="h-full w-full" />
                      ) : (
                        <span className="text-xs text-ink/60">Preparing QR</span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="font-display text-lg">QR for the frame</p>
                        <p className="mt-1 break-all text-xs leading-relaxed text-muted">
                          {publicFrameUrl(frame.slug)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <button
                          type="button"
                          onClick={() => downloadQr(frame.title)}
                          disabled={!qrDataUrl}
                          className="rounded-[6px] border border-line px-3 py-2 text-parchment disabled:opacity-40"
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={() => copyLink(frame.slug)}
                          className="rounded-[6px] border border-line px-3 py-2 text-muted hover:text-parchment"
                        >
                          {copiedSlug === frame.slug ? 'Copied' : 'Copy link'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {expanded && (
                <div className="border-t border-line bg-ink/30 p-4">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-xl">Cards left with this work</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        Cards appear as they were left. Hold photos or hide a card when it should not stay on the public frame.
                      </p>
                    </div>
                    {!cardsLoading && heldPhotoCount > 0 && (
                      <span className="shrink-0 border border-brass/30 bg-brass/10 px-2.5 py-1 text-xs text-parchment">
                        {heldPhotoCount} photo{heldPhotoCount === 1 ? '' : 's'} held
                      </span>
                    )}
                  </div>
                  {cardsLoading && <p className="text-sm text-muted">Loading cards...</p>}
                  {!cardsLoading && openFrame?.cards.length === 0 && (
                    <p className="text-sm text-muted">No cards yet.</p>
                  )}
                  <ul className="grid gap-4 lg:grid-cols-2">
                    {(openFrame?.cards ?? []).map((card) => (
                      <ReviewCard
                        key={card.id}
                        card={card}
                        onHide={(cardId) => void hide(cardId)}
                        onModeratePhoto={(cardId, action) => void moderatePhoto(cardId, action)}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
