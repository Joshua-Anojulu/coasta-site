import type { CSSProperties } from "react"

type FeedPanelProps = {
  readonly id: string
  readonly road: string
  readonly signal?: number
  readonly className?: string
  readonly style?: CSSProperties
}

/**
 * A monitor tile drawn entirely in CSS. No photograph, no div-pretending-to-be
 * a screenshot of a real product (house-style ban 2): this is the world's own
 * hardware, the way a machined-hardware family draws a bezel rather than
 * photographing one. The horizon, the lane rules and the sweep are geometry, so
 * the tile costs nothing to load and scales to any count the choreography wants.
 */
export function FeedPanel({ id, road, signal = 3, className = "", style }: FeedPanelProps) {
  return (
    <figure className={`feed ${className}`} style={style}>
      <div className="feed__screen" aria-hidden="true">
        <div className="feed__horizon" />
        <div className="feed__lane feed__lane--a" />
        <div className="feed__lane feed__lane--b" />
        <div className="feed__lane feed__lane--c" />
        <div className="feed__sweep" />
        <div className="feed__scanlines" />
      </div>
      <figcaption className="feed__chrome">
        <span className="feed__id">{id}</span>
        <span className="feed__road">{road}</span>
        <span className="feed__signal" aria-hidden="true">
          {[0, 1, 2, 3].map((bar) => (
            <i key={bar} data-on={bar < signal} />
          ))}
        </span>
      </figcaption>
    </figure>
  )
}
