import {readFileSync} from "node:fs";
import {expect, test} from "@playwright/test";
import type {Page} from "@playwright/test";

const dist = readFileSync(new URL("dist/index.js", import.meta.url), "utf8")
  .replace("export { clippie };", "");

const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEElEQVR4AWP8z4APjEpjBQCgmgoBKVWovwAAAABJRU5ErkJggg==";

async function run(page: Page, body: string) {
  await page.route("http://localhost/", route => route.fulfill({
    contentType: "text/html",
    body: `<!doctype html><button id=b>go</button><script type=module>${dist}
const png = new Blob([Uint8Array.from(atob("${pngBase64}"), c => c.charCodeAt(0))], {type: "image/png"});
document.getElementById("b").onclick = async () => console.log(JSON.stringify(await (async () => { ${body} })()));
</script>`,
  }));
  await page.goto("http://localhost/");
  const [msg] = await Promise.all([
    page.waitForEvent("console"),
    page.click("#b"),
  ]);
  return JSON.parse(msg.text());
}

test("string", async ({page}) => {
  expect(await run(page, `return clippie("hello");`)).toBe(true);
});

test("image", async ({page}) => {
  expect(await run(page, `return clippie(png);`)).toBe(true);
});

test("image and text", async ({page}) => {
  expect(await run(page, `return clippie([png, "hello"]);`)).toBe(true);
});

test("array of strings", async ({page}) => {
  expect(await run(page, `return clippie(["foo", "bar"]);`)).toBe(true);
});

test("blob with no type", async ({page}) => {
  expect(await run(page, `return clippie(new Blob(["x"]));`)).toBe(true);
});

test("execCommand fallback", async ({page}) => {
  expect(await run(page, `
    Object.defineProperty(navigator, "clipboard", {value: undefined, configurable: true});
    return clippie("hello");
  `)).toBe(true);
});

test("reject:true rethrows", async ({page}) => {
  expect(await run(page, `
    Object.defineProperty(navigator, "clipboard", {value: {write: () => Promise.reject(new Error("nope"))}, configurable: true});
    try { await clippie("hello", {reject: true}); return "no throw"; } catch (e) { return e.message; }
  `)).toBe("nope");
});
