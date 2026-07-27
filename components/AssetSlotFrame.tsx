"use client"

import type { AssetSlot } from "@/lib/assets/manifest"

type AssetSlotFrameProps = {
  readonly active?: boolean
  readonly className?: string
  readonly sizes: string
  readonly slot: AssetSlot
}

function reportImageFailure(slotId: string): void {
  const payload = JSON.stringify({ slotId })
  navigator.sendBeacon(
    "/api/observability/image-failure",
    new Blob([payload], { type: "application/json" }),
  )
}

export function AssetSlotFrame({
  active = false,
  className = "",
  sizes,
  slot,
}: AssetSlotFrameProps) {
  if (slot.status === "filled") {
    return (
      <figure
        className={`asset-frame ${className}`}
        data-active={active}
        data-slot-id={slot.id}
        data-slot-status="filled"
      >
        <picture>
          <source srcSet={slot.avifPath} type="image/avif" />
          <source srcSet={slot.webpPath} type="image/webp" />
          <img
            alt={slot.intendedSubject}
            decoding="async"
            height={slot.height}
            loading={slot.loading}
            onError={() => reportImageFailure(slot.id)}
            sizes={sizes}
            src={slot.webpPath}
            width={slot.width}
          />
        </picture>
        <figcaption className="asset-credit">{slot.credit}</figcaption>
      </figure>
    )
  }

  return (
    <figure
      aria-label={`Missing camera asset slot ${slot.id}`}
      className={`asset-frame asset-gap ${className}`}
      data-active={active}
      data-slot-id={slot.id}
      data-slot-status="unfilled"
    >
      <div className="asset-gap__inner">
        <span className="asset-gap__flag">BUILD GAP</span>
        <strong>{slot.id}</strong>
        <p>{slot.intendedSubject}</p>
        <span>
          {slot.width} x {slot.height} / maximum {Math.round(slot.byteBudget / 1_024)} KB
        </span>
      </div>
      <figcaption className="asset-credit">
        Source credit unavailable until this slot is licensed and filled
      </figcaption>
    </figure>
  )
}
