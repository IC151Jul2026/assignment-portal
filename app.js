(() => {
  "use strict";

  // Copy only the commands. Prompts and program output must never reach the
  // clipboard, or pasting the block straight back into a shell breaks.
  function extract(code) {
    const clone = code.cloneNode(true);
    clone.querySelectorAll(".p, .o, .ok").forEach((node) => node.remove());
    return clone.textContent.replace(/\n{3,}/g, "\n\n").trim();
  }

  function fallbackCopy(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }
    document.body.removeChild(area);
    return copied;
  }

  document.querySelectorAll(".terminal").forEach((terminal) => {
    const button = terminal.querySelector("[data-copy]");
    const code = terminal.querySelector("code");
    if (!button || !code) return;

    button.addEventListener("click", () => {
      const text = extract(code);

      const finish = (copied) => {
        button.textContent = copied ? "Copied" : "Copy failed";
        button.classList.toggle("copied", copied);
        window.setTimeout(() => {
          button.textContent = "Copy";
          button.classList.remove("copied");
        }, 1600);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          () => finish(true),
          () => finish(fallbackCopy(text)),
        );
      } else {
        finish(fallbackCopy(text));
      }
    });
  });
})();
