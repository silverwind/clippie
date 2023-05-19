export async function clippie(content, {reject = false} = {}) {
  try {
    if (Array.isArray(content)) {
      await navigator.clipboard.write([
        new ClipboardItem(Object.fromEntries(content.map(c => [c.type ?? "text/plain", c]))),
      ]);
      return true;
    } else if (content instanceof Blob) {
      await navigator.clipboard.write([new ClipboardItem({[content.type]: content})]);
      return true;
    } else {
      return copyText(String(content));
    }
  } catch (err) {
    if (reject) throw err;
    return false;
  }
}

async function copyText(str) {
  try {
    await navigator.clipboard.writeText(str);
    return true;
  } catch {
    if (!document.execCommand) return;
    const el = document.createElement("textarea");
    el.value = str;
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
  return false;
}
