import { test, expect, type Page } from "@playwright/test";
const snapshot = async (page: Page) =>
  await (await page.request.get("/api/v2/state")).json();
async function openBoard(page: Page, name: string) {
  await page.goto("/");
  await page.getByText("Synthetic Production", { exact: true }).click();
  await page.getByText(name, { exact: true }).click();
}
test("existing canvas and storyboard edit the same Shot; failures are visible and retryable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw Error("V1 localStorage access forbidden");
      },
    });
    Object.defineProperty(window, "indexedDB", {
      get() {
        throw Error("V1 IndexedDB access forbidden");
      },
    });
  });
  await openBoard(page, "Board A");
  const frame = page.getByTestId("frame-placement-a");
  await expect(frame).toBeVisible();
  await expect(page.getByTestId("frame-planning")).toContainText(
    "Planning Frame",
  );
  await expect(
    page
      .getByTestId("frame-planning")
      .getByRole("button", { name: "Make Shot" }),
  ).toBeVisible();
  await frame.locator("input").nth(2).fill("Browser canonical edit");
  await expect
    .poll(async () => (await snapshot(page)).state.shots[0].title)
    .toBe("Browser canonical edit");
  await openBoard(page, "Board B");
  await expect(
    page.getByTestId("frame-placement-b").locator("input").nth(2),
  ).toHaveValue("Browser canonical edit");
  await page.getByRole("button", { name: "Storyboard", exact: true }).click();
  const cell = page.getByTestId("story-placement-b");
  await expect(cell).toBeVisible();
  await cell.locator("input").first().fill("Storyboard canonical edit");
  await expect
    .poll(async () => (await snapshot(page)).state.shots[0].title)
    .toBe("Storyboard canonical edit");
  await openBoard(page, "Board A");
  await expect(
    page.getByTestId("frame-placement-a").locator("input").nth(2),
  ).toHaveValue("Storyboard canonical edit");
  await page.route("**/api/v2/state", (route) =>
    route.request().method() === "PUT"
      ? route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Simulated durable write failure" }),
        })
      : route.continue(),
  );
  await page
    .getByTestId("frame-placement-a")
    .locator("input")
    .nth(2)
    .fill("Unsaved browser edit");
  await expect(page.getByRole("alert")).toContainText("Save failed");
  await expect(page.getByRole("alert")).toContainText(
    "Simulated durable write failure",
  );
  expect((await snapshot(page)).state.shots[0].title).toBe(
    "Storyboard canonical edit",
  );
  await page.unroute("**/api/v2/state");
  await page.getByRole("button", { name: "Retry save" }).click();
  await expect
    .poll(async () => (await snapshot(page)).state.shots[0].title)
    .toBe("Unsaved browser edit");
  await page.reload();
  await page.getByText("Synthetic Production", { exact: true }).click();
  await page.getByText("Board A", { exact: true }).click();
  await expect(
    page.getByTestId("frame-placement-a").locator("input").nth(2),
  ).toHaveValue("Unsaved browser edit");
  expect(errors).toEqual([]);
});
test("dragging and resizing affect one placement only; free image/text and wire render", async ({
  page,
}) => {
  await openBoard(page, "Board A");
  const before = await snapshot(page);
  const frame = page.getByTestId("frame-placement-a");
  const handle = frame.locator(".v2-frame-role");
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + 25, box!.y + 5);
  await page.mouse.down();
  await page.mouse.move(box!.x + 145, box!.y + 75, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(async () => (await snapshot(page)).state.boards[0].nodes[0].x)
    .not.toBe(before.state.boards[0].nodes[0].x);
  const resize = frame.locator("..").locator(".handle.se");
  const rb = await resize.boundingBox();
  expect(rb).not.toBeNull();
  await page.mouse.move(rb!.x + 3, rb!.y + 3);
  await page.mouse.down();
  await page.mouse.move(rb!.x + 63, rb!.y + 43, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(async () => (await snapshot(page)).state.boards[0].nodes[0].w)
    .not.toBe(before.state.boards[0].nodes[0].w);
  const after = await snapshot(page);
  expect(after.state.boards[1].nodes).toEqual(before.state.boards[1].nodes);
  expect(after.state.projects[0].shotOrder).toEqual(
    before.state.projects[0].shotOrder,
  );
  await expect(page.getByText("Synthetic note", { exact: true })).toBeVisible();
  await expect(page.locator("img").first()).toBeVisible();
  await expect(page.locator(".wire-layer .wire")).toHaveCount(1);
  await expect
    .poll(() =>
      page
        .locator(".image-card img, .image-node img, .node img")
        .first()
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
});

test("planning edits, placement duplication/deletion, Shot duplication and labels keep ownership", async ({
  page,
}) => {
  await openBoard(page, "Board A");
  let before = await snapshot(page);
  const planning = page.getByTestId("frame-planning");
  await planning.locator(".frame-title").fill("Updated planning");
  await expect
    .poll(
      async () =>
        (await snapshot(page)).state.boards[0].nodes.find(
          (n: any) => n.id === "planning",
        ).title,
    )
    .toBe("Updated planning");
  expect((await snapshot(page)).state.shots.length).toBe(
    before.state.shots.length,
  );
  const frame = page.getByTestId("frame-placement-a");
  await frame.locator(".frame-shot").fill("S99-SH88");
  await expect
    .poll(
      async () =>
        (await snapshot(page)).state.shots.find((s: any) => s.id === "shot-one")
          .shot,
    )
    .toBe("S99-SH88");
  expect((await snapshot(page)).state.projects[0].shotOrder).toEqual(
    before.state.projects[0].shotOrder,
  );
  await frame.locator(".v2-frame-role").click({ position: { x: 25, y: 5 } });
  await page.keyboard.press("Control+d");
  await expect
    .poll(
      async () =>
        (await snapshot(page)).state.boards[0].nodes.filter(
          (n: any) => n.kind === "placement",
        ).length,
    )
    .toBe(2);
  let duplicated = await snapshot(page);
  expect(duplicated.state.shots.length).toBe(before.state.shots.length);
  expect(
    duplicated.state.boards[0].nodes
      .filter((n: any) => n.kind === "placement")
      .every((n: any) => n.shotId === "shot-one"),
  ).toBe(true);
  await page.keyboard.press("Delete");
  await expect
    .poll(
      async () =>
        (await snapshot(page)).state.boards[0].nodes.filter(
          (n: any) => n.kind === "placement",
        ).length,
    )
    .toBe(1);
  expect((await snapshot(page)).state.shots.length).toBe(
    before.state.shots.length,
  );
  await page
    .getByRole("button", { name: "Duplicate Shot", exact: true })
    .first()
    .click();
  await expect
    .poll(async () => (await snapshot(page)).state.shots.length)
    .toBe(before.state.shots.length + 1);
  const after = await snapshot(page);
  expect(new Set(after.state.shots.map((s: any) => s.id)).size).toBe(
    after.state.shots.length,
  );
  expect(after.state.boards[1].nodes[0].shotId).toBe("shot-one");
  await page.locator(".textnode").dblclick();
  await page.locator(".textnode textarea").fill("Edited free text");
  await page.keyboard.press("Escape");
  await expect
    .poll(
      async () =>
        (await snapshot(page)).state.boards[0].nodes.find(
          (n: any) => n.id === "text",
        ).text,
    )
    .toBe("Edited free text");
});
