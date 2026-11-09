/** A single copyable item */
export type ClippieCopyable = string | Blob;

/** The content to copy */
export type ClippieContent = ClippieCopyable | Array<ClippieCopyable>;

/** A boolean indicating whether the copying was successful */
export type ClippieResult = boolean;

/** Options for the module */
export type ClippieOpts = {
  /** Whether to reject on unexpected errors */
  reject?: boolean;
};

/** Copies `content` to the clipboard, which can be text, images or an array of these */
export async function clippie(content: ClippieContent, {reject}: ClippieOpts = {}): Promise<ClippieResult> {
  try {
    const entries: Record<string, ClippieCopyable> = {};
    for (const c of ([] as ClippieCopyable[]).concat(content)) entries[(c as Blob).type || "text/plain"] = c;
    const text = entries["text/plain"];
    const {clipboard} = navigator;
    if (typeof text === "string" && Object.keys(entries).length === 1) {
      if (!clipboard?.writeText) return fallback(text);
      try {
        await clipboard.writeText(text);
        return true;
      } catch {
        return fallback(text);
      }
    }
    if (!window.ClipboardItem || !clipboard?.write) return false;
    await clipboard.write([new ClipboardItem(Object.fromEntries(
      Object.entries(entries).map(([type, c]) => [type, new Blob([c], {type})]),
    ))]);
    return true;
  } catch (err) {
    if (reject) throw err;
    return false;
  }
}

function fallback(text: string): boolean {
  const d = document;
  const copy = () => d.execCommand("copy"); // eslint-disable-line @typescript-eslint/no-deprecated -- required fallback when Clipboard API is unavailable
  let copied = false;
  const onCopy = (e: ClipboardEvent) => {
    e.stopImmediatePropagation();
    e.preventDefault();
    e.clipboardData!.setData("text/plain", text);
    copied = true;
  };
  d.addEventListener("copy", onCopy, {capture: true});
  try {
    copy();
    if (copied) return true;
    // no copy event fires with focus in a password field or with dom.event.clipboardevents.enabled off, so select a textarea
    const active = d.activeElement as HTMLElement | null;
    const el = d.createElement("textarea");
    el.value = text;
    el.readOnly = true;
    el.style.cssText = "position:fixed;top:0;clip-path:inset(50%);font-size:12pt;white-space:pre";
    el.ariaHidden = "true";
    // content outside of the topmost modal dialog or fullscreen element is inert, which is not exposed: https://github.com/whatwg/html/issues/9075
    (active?.closest(":modal") ?? d.querySelector(":modal") ?? d.body).append(el);
    try {
      el.select();
      el.setSelectionRange(0, text.length);
      return copy() || copied;
    } finally {
      el.remove();
      active?.focus({preventScroll: true});
    }
  } finally {
    d.removeEventListener("copy", onCopy, {capture: true});
  }
}
