import { z } from "zod"
import { ASSET_SLOTS } from "@/lib/assets/manifest"
import { readJsonBody } from "@/lib/http/read-json-body"
import { recordImageFailure } from "@/lib/observability"

const ImageFailureSchema = z.object({
  slotId: z.string().min(1),
})

export async function POST(request: Request): Promise<Response> {
  const body = await readJsonBody(request, 1_024)
  if (!body.ok) {
    return new Response(null, { status: 400 })
  }

  const payload = ImageFailureSchema.safeParse(body.value)
  if (!payload.success) {
    return new Response(null, { status: 400 })
  }

  const declared = ASSET_SLOTS.some((slot) => slot.id === payload.data.slotId)
  if (!declared) {
    return new Response(null, { status: 400 })
  }

  recordImageFailure(payload.data.slotId)
  return new Response(null, { status: 204 })
}
