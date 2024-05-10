type ClippieContent = string | Blob | (string | Blob)[];
type Success = boolean;

type ClippieOpts = {
  /** Whether to reject on unexpected errors. */
  reject?: boolean;
}

export async function clippie(content: ClippieContent, {reject = false}: ClippieOpts = {}): Promise<Success> {
  try {
    if (Array.isArray(content)) {
      if (!navigator?.clipboard && content.length === 1 && typeof content[0] === "string") {
        return fallback(content[0]);
      }
      await navigator.clipboard.write([
        new ClipboardItem(Object.fromEntries(content.map(c => {
          return [(c as any)?.type ?? "text/plain", c];
        }))),
      ]);
      return true;
    } else if (content instanceof Blob) {
      await navigator.clipboard.write([new ClipboardItem({[content.type]: content})]);
      return true;
    } else {
      try {
        await navigator.clipboard.writeText(String(content));
        return true;
      } catch {
        return fallback(content);
      }
    }
  } catch (err) {
    if (reject) throw err;
    return false;
  }
}

function fallback(content: string): boolean {
  if (!document.execCommand) return false; // eslint-disable-line etc/no-deprecated
  const el = document.createElement("textarea");
  el.value = String(content);
  el.style.clipPath = "inset(50%)";
  el.ariaHidden = "true";
  document.body.append(el);
  try {
    el.select();
    return document.execCommand("copy"); // eslint-disable-line etc/no-deprecated
  } finally {
    el.remove();
  }
}
