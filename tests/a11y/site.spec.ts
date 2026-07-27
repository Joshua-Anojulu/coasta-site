import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name === "reduced-motion") {
    await page.emulateMedia({ reducedMotion: "reduce" })
  }
  await page.goto("/")
})

test("has no detectable axe violations and names every image and control", async ({
  page,
}) => {
  // Given
  await page.waitForLoadState("networkidle")

  // When
  const results = await new AxeBuilder({ page }).analyze()

  // Then
  expect(results.violations).toEqual([])
  const images = page.locator("img")
  for (let index = 0; index < (await images.count()); index += 1) {
    await expect(images.nth(index)).toHaveAttribute("alt", /\S+/)
  }
  const controls = page.locator(
    'button:visible, input:not([tabindex="-1"]):visible, summary:visible, a[href]:visible',
  )
  for (let index = 0; index < (await controls.count()); index += 1) {
    await expect(controls.nth(index)).toHaveAccessibleName(/\S+/)
  }
})

test("traverses every camera by keyboard and clears the reading with Escape", async ({
  page,
}) => {
  // Given
  const cameras = page.locator("[data-camera-id]")
  const firstCamera = cameras.first()
  await firstCamera.scrollIntoViewIfNeeded()
  await firstCamera.focus()

  // When and Then
  const count = await cameras.count()
  for (let index = 0; index < count; index += 1) {
    const camera = cameras.nth(index)
    await expect(camera).toBeFocused()
    await expect(camera).toHaveAttribute("data-road-ref", /\S+/)
    const roadReference = await camera.getAttribute("data-road-ref")
    if (roadReference === null) {
      throw new Error("Focused camera has no road reference")
    }
    await expect(page.locator("#coverage-status strong")).toHaveText(roadReference)
    if (index < count - 1) {
      await page.keyboard.press("Tab")
    }
  }

  const hoverCamera = cameras.nth(Math.min(6, count - 1))
  await hoverCamera.hover()
  const hoverReference = await hoverCamera.getAttribute("data-road-ref")
  if (hoverReference === null) {
    throw new Error("Hovered camera has no road reference")
  }
  await expect(page.locator("#coverage-status strong")).toHaveText(hoverReference)

  await page.keyboard.press("Escape")
  await expect(page.locator("#coverage-status strong")).toHaveText(
    "Road reference appears here",
  )
})

test("traverses every visible control from the document start", async ({ page }) => {
  // Given
  const controls = page.locator(
    'a[href]:visible, button:visible, input:not([tabindex="-1"]):visible, summary:visible',
  )
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    document.body.focus()
  })

  // When and Then
  const count = await controls.count()
  for (let index = 0; index < count; index += 1) {
    await page.keyboard.press("Tab")
    await expect(controls.nth(index)).toBeFocused()
  }
})

test("shows a visible focus indicator on camera controls", async ({ page }) => {
  // Given
  const camera = page.locator("[data-camera-id]").first()
  await camera.scrollIntoViewIfNeeded()

  // When
  await camera.focus()

  // Then
  const focusStyle = await camera.evaluate((element) => {
    const style = getComputedStyle(element)
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth }
  })
  expect(focusStyle.outlineStyle).not.toBe("none")
  expect(focusStyle.outlineWidth).not.toBe("0px")
})

test("renders assembled scenes when reduced motion is preferred", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "reduced-motion")

  // Given
  const prefersReducedMotion = await page.evaluate(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  )

  // When
  const cueAnimation = await page
    .locator(".intro-cue span:last-child")
    .evaluate((element) => getComputedStyle(element).animationName)

  // The road paints a static frame under reduced motion rather than an empty
  // stage: the scene is assembled, it simply does not travel (Ch7.1).
  const canvasPainted = await page.locator(".drive-canvas").evaluate((el) => {
    const c = el as HTMLCanvasElement
    return c.width > 0 && c.height > 0
  })

  // Then
  expect(prefersReducedMotion).toBe(true)
  expect(cueAnimation).toBe("none")
  expect(canvasPainted).toBe(true)
  await expect(page.locator("[data-motion-state='assembled']")).toHaveCount(1)
})

test("never implies captured model output", async ({ page }) => {
  // Given: the drive depicts hazards on a canvas, which is exactly the place a
  // viewer could read as real captured detection. The disclaimer is what keeps
  // the net impression honest, so its absence is a failure, not a cosmetic gap.
  const drive = page.locator("#the-drive")
  const intro = page.locator("#approach")

  // Then
  await expect(drive.locator("[data-illustration-note]")).toHaveCount(1)
  await expect(drive.locator("[data-illustration-note]")).toHaveText(
    /illustration of the alert sequence/i,
  )

  // The hero asserts the lens, never a detection (the round-1 review finding
  // that removed the box from the hero in the first place).
  await expect(intro.locator(".detection-box")).toHaveCount(0)
  await expect(intro.locator("canvas")).toHaveCount(0)
})
