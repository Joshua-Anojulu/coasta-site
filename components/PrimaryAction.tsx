import type { ReactNode } from "react"

type PrimaryActionProps = {
  readonly children: ReactNode
  readonly href: string
  readonly inverse?: boolean
}

export function PrimaryAction({
  children,
  href,
  inverse = false,
}: PrimaryActionProps) {
  return (
    <a className="primary-action" data-inverse={inverse} href={href}>
      {children}
      <span aria-hidden="true">↓</span>
    </a>
  )
}
