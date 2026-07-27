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
  const animationName = await page
    .locator(".monitor-scanlines")
    .evaluate((element) => getComputedStyle(element).animationName)

  // Then
  expect(prefersReducedMotion).toBe(true)
  expect(animationName).toBe("none")
  await expect(page.locator("[data-motion-state='assembled']")).toHaveCount(4)
  await expect(page.locator(".camera-wall__tile[data-active='true']")).toHaveCount(1)
})

test("keeps detection depiction confined to the read chapter", async ({ page }) => {
  // Given
  const hero = page.locator("#approach")
  const read = page.locator("#read")

  // When
  const heroBoxes = hero.locator(".detection-box")
  const readBoxes = read.locator(".detection-box")

  // Then
  await expect(heroBoxes).toHaveCount(0)
  await expect(readBoxes).toHaveCount(1)
  await expect(read.getByText("Concept visualization, not model output")).toBeVisible()
})
