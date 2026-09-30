// Copies text using the Clipboard API, falling back to the older
// execCommand("copy") path when the API is missing or refuses the write
// (e.g. embedded browsers, non-secure origins or an unfocused document).
export async function copyText(text) {
  if (!text) throw new Error("There is nothing to copy.");

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the legacy copy path.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  let copied;
  try {
    copied = document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }

  if (!copied) {
    throw new Error("Clipboard access is unavailable.");
  }
}
