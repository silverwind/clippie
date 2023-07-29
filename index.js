export async function clippie(content, {reject = false} = {}) {
  try {
    if (Array.isArray(content)) {
      if (!navigator?.clipboard && content.length === 1 && typeof content[0] === "string") {
        return fallback(content);
      }
      await navigator.clipboard.write([
        new ClipboardItem(Object.fromEntries(content.map(c => [c.type ?? "text/plain", c]))),
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
        fallback(content);
      }
      return false;
    }
  } catch (err) {
    if (reject) throw err;
    return false;
  }
}

function fallback(content) {
  if (!document.execCommand) return false;
  const el = document.createElement("textarea");
  el.value = String(content);
  el.style.clipPath = "inset(50%)";
  el.ariaHidden = "true";
  document.body.append(el);
  try {
    el.select();
    const success = document.execCommand("copy");
    if (success) return true;
  } finally {
    el.remove();
  }
}
