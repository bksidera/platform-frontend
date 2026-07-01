/**
 * The work itself. The card pile presses into its lower edge from outside this
 * component so the image stays sovereign while the crowd of cards gathers at
 * its feet.
 */

interface Props {
  imageUrl: string
}

export function LivingFrame({ imageUrl }: Props) {
  return (
    <div className="relative inline-block">
      <img
        src={imageUrl}
        alt=""
        draggable={false}
        className="block w-auto h-auto select-none rounded-[8px] ring-1 ring-white/10
                   max-h-[52vh] max-w-[88vw] md:max-h-[56vh] md:max-w-[64vw] lg:max-w-[52vw]"
        style={{
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.05), 0 24px 60px -12px rgba(0,0,0,0.7), 0 4px 14px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  )
}
