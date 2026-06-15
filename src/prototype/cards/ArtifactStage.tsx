/**
 * The artifact alone — lit, sovereign, no chrome of its own. The plaque
 * belongs to the scene (CardStackPrototypePage), not to this element, so the
 * artifact never reads as a "section" with a caption.
 */
interface Props {
  imageUrl: string
}

export function ArtifactStage({ imageUrl }: Props) {
  return (
    <img
      src={imageUrl}
      alt=""
      draggable={false}
      className="block max-w-full max-h-full w-auto h-auto select-none"
      style={{
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.06), 0 24px 60px -12px rgba(0,0,0,0.7), 0 4px 14px rgba(0,0,0,0.5)',
      }}
    />
  )
}
