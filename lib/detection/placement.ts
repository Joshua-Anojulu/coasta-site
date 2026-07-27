export type Rect = {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export type Size = {
  readonly width: number
  readonly height: number
}

export type LabelPlacement = {
  readonly x: number
  readonly y: number
}

export function placeDetectionLabel(input: {
  readonly frame: Size
  readonly detection: Rect
  readonly label: Size
  readonly gap: number
}): LabelPlacement {
  const x = Math.min(
    Math.max(0, input.detection.x),
    input.frame.width - input.label.width,
  )
  const above = input.detection.y - input.label.height - input.gap
  const below = input.detection.y + input.detection.height + input.gap
  const desiredY = above >= 0 ? above : below
  const y = Math.min(Math.max(0, desiredY), input.frame.height - input.label.height)

  return { x, y }
}
