import { z } from "zod"
import rawManifest from "@/data/assets-manifest.json"

const ChapterSchema = z.enum(["CH1", "CH2", "CH3", "CH4", "CH5", "CH6"])

const AssetSlotBaseSchema = z.object({
  byteBudget: z.number().int().positive(),
  chapter: ChapterSchema,
  height: z.number().int().positive(),
  id: z.string().min(1),
  intendedSubject: z.string().min(1),
  loading: z.enum(["eager", "lazy"]),
  width: z.number().int().positive(),
})

const AssetSlotSchema = z.discriminatedUnion("status", [
  AssetSlotBaseSchema.extend({
    avifPath: z.null(),
    credit: z.null(),
    status: z.literal("unfilled"),
    webpPath: z.null(),
  }),
  AssetSlotBaseSchema.extend({
    avifPath: z.string().startsWith("/"),
    credit: z.string().min(1),
    status: z.literal("filled"),
    webpPath: z.string().startsWith("/"),
  }),
])

const AssetManifestSchema = z.object({
  slots: z.array(AssetSlotSchema).min(1),
})

export type AssetSlot = z.infer<typeof AssetSlotSchema>
export type AssetChapter = z.infer<typeof ChapterSchema>

export const ASSET_SLOTS: readonly AssetSlot[] = AssetManifestSchema.parse(rawManifest).slots

export function getAssetSlots(chapter: AssetChapter): readonly AssetSlot[] {
  return ASSET_SLOTS.filter((slot) => slot.chapter === chapter)
}

export class AssetSlotContractError extends Error {
  readonly name = "AssetSlotContractError"

  constructor(readonly slotId: string) {
    super(`Asset slot ${slotId} is not declared`)
  }
}

// The credit's leading segment is the real road and city. Chapter chrome shows it
// in place of an invented camera id, so the frame never implies a capture that did
// not happen: these are licensed photographs, not stills pulled off a live feed.
export function slotLocation(slot: AssetSlot): string | null {
  if (slot.status !== "filled") {
    return null
  }
  return slot.credit.split(" · ")[0] ?? null
}

export function getAssetSlot(slotId: string): AssetSlot {
  const slot = ASSET_SLOTS.find((candidate) => candidate.id === slotId)
  if (slot === undefined) {
    throw new AssetSlotContractError(slotId)
  }
  return slot
}
