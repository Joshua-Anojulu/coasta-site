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

/* The camera-traversal test lived here. Its subject was the coverage map, which
   is gone, and its real intent (every interactive element reachable by keyboard
   in order) is already covered by the traversal test below. Deleted rather than
   retargeted, because a test kept alive by pointing it at an unrelated element
   is worse than no test. */

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

test("shows a visible focus indicator on the primary action", async ({ page }) => {
  // Given: the CTA is the one control every visitor is meant to reach, so it is
  // the right place to assert the focus ring now that the map controls are gone.
  const cta = page.getByRole("link", { name: "Join the waitlist" }).first()
  await cta.scrollIntoViewIfNeeded()

  // When
  await cta.focus()

  // Then
  const focusStyle = await cta.evaluate((element) => {
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

  // The alert copy must still be present when nothing animates. Reduced motion
  // stops movement; it never removes content (Ch7.1).
  await expect(page.getByText("Police vehicle, right shoulder").first()).toBeAttached()
  await expect(page.getByText("Debris in the centre lane").first()).toBeAttached()
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

/* The assembly mechanic hides content and then shows it again. That is only
   safe while both escape hatches hold, and if either breaks the page still
   looks perfect to anyone testing it in a normal browser: the content is
   simply gone for everyone else. Hence these two. */

const hiddenAssembled = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[data-assemble]")].filter(
      (el) => Number(getComputedStyle(el).opacity) < 0.99,
    ).length,
  )

test("assembles nothing when reduced motion is preferred", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "reduced-motion")

  // Given: the page has loaded without any scrolling at all.
  await page.waitForLoadState("networkidle")

  // Then: every block is already whole, wherever it sits on the page.
  expect(await page.locator("[data-assemble]").count()).toBeGreaterThan(0)
  expect(await hiddenAssembled(page)).toBe(0)
  expect(await page.evaluate(() => document.documentElement.dataset["assembly"])).toBeUndefined()
})

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  test("renders the whole page rather than hiding what it cannot animate", async ({
    page,
  }) => {
    // Given: no script has run, so nothing can ever mark a block as arrived.
    await page.goto("/")

    // Then: the rule that hides them never matched in the first place.
    expect(await page.locator("[data-assemble]").count()).toBeGreaterThan(0)
    expect(await hiddenAssembled(page)).toBe(0)
    await expect(page.getByText("A reported hazard is one somebody already hit.")).toBeVisible()
  })
})
