export async function clippie(content) {
  if (content instanceof Blob) {
    const item = new ClipboardItem({[content.type]: content}); // eslint-disable-line no-undef
    await navigator.clipboard.write([item]);
  } else {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      return fallback(content);
    }
  }
  return true;
}

function fallback(text) {
  if (!document.execCommand) return false;
  const tempTextArea = document.createElement("textarea");
  tempTextArea.value = text;
  tempTextArea.style.top = 0;
  tempTextArea.style.left = 0;
  tempTextArea.style.position = "fixed";
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  const success = document.execCommand("copy");
  document.body.removeChild(tempTextArea);
  return success;
}
