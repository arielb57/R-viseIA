(function(exports){
  // Utilities and functions for RéviseIA UI logic.
  // This file is environment-agnostic:
  // - when loaded in browser it attaches to window.App
  // - when required by Node (Jest) it exports functions via module.exports

  function safeParse(str){
    try { return JSON.parse(str); } catch(e) { return []; }
  }

  function getHistory(){
    if (typeof localStorage === "undefined") return [];
    try {
      return safeParse(localStorage.getItem("reviseia_history") || "[]");
    } catch (e) {
      return [];
    }
  }

  function setHistory(items){
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem("reviseia_history", JSON.stringify(items));
    } catch (e) {
      // ignore
    }
  }

  function saveToHistory(topic, content){
    if (!topic) return;
    const items = getHistory().filter(x => x.topic !== topic);
    items.unshift({ topic, content, ts: Date.now() });
    setHistory(items.slice(0,10));
  }

  function renderHistory(listEl, outputEl, statusEl){
    if (!listEl) return;
    const items = getHistory();
    listEl.innerHTML = "";
    if (items.length === 0){
      const li = document.createElement("li");
      li.textContent = "Aucun historique pour l’instant.";
      li.style.cursor = "default";
      li.style.textDecoration = "none";
      listEl.appendChild(li);
      return;
    }
    items.forEach(item=>{
      const li = document.createElement("li");
      li.textContent = item.topic;
      li.onclick = () => {
        if (outputEl) outputEl.textContent = item.content;
        if (statusEl) statusEl.textContent = `Rechargé : ${item.topic}`;
      };
      listEl.appendChild(li);
    });
  }

  function escapeHtml(str){
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Try navigator.clipboard.writeText, otherwise fallback to textarea + execCommand.
  // Returns a Promise<boolean>
  function copyText(text, opts = {}) {
    const navigatorObj = opts.navigator || (typeof navigator !== "undefined" ? navigator : undefined);
    const documentObj = opts.document || (typeof document !== "undefined" ? document : undefined);

    return new Promise((resolve) => {
      if (navigatorObj && navigatorObj.clipboard && typeof navigatorObj.clipboard.writeText === "function") {
        navigatorObj.clipboard.writeText(text).then(()=>resolve(true)).catch(()=>fallback());
      } else {
        fallback();
      }

      function fallback(){
        try {
          if (!documentObj) return resolve(false);
          const ta = documentObj.createElement("textarea");
          ta.value = text;
          // Off-screen
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          documentObj.body.appendChild(ta);
          ta.select();
          const ok = documentObj.execCommand && documentObj.execCommand("copy");
          documentObj.body.removeChild(ta);
          resolve(Boolean(ok));
        } catch (e) {
          resolve(false);
        }
      }
    });
  }

  // Export to printable window. Returns true on success, false if popup blocked.
  // Parameters: content (string), windowObj (default window), statusEl optional.
  function openPdf(content, windowObj, statusEl){
    const w = (windowObj || (typeof window !== "undefined" ? window : undefined)).open ? (windowObj || window).open("", "_blank") : null;
    if (!w) {
      if (statusEl) statusEl.textContent = "Popup bloquée";
      return false;
    }
    try {
      w.document.write(`
        <html><head><meta charset="utf-8" />
        <title>RéviseIA - Export PDF</title>
        <style>
          body{font-family:system-ui,Segoe UI,Roboto,Arial;padding:24px;line-height:1.5;}
          pre{white-space:pre-wrap;font-family:inherit;}
          h1{margin:0 0 12px;}
          .muted{color:#666;font-size:12px;margin-bottom:18px;}
        </style></head>
        <body>
          <h1>RéviseIA</h1>
          <div class="muted">Dans la fenêtre d’impression, choisis “Enregistrer en PDF”.</div>
          <pre>${escapeHtml(content)}</pre>
          <script>window.onload = () => window.print();<\/script>
        </body></html>
      `);
      if (typeof w.document.close === "function") w.document.close();
      return true;
    } catch(e) {
      return false;
    }
  }

  // Expose functions
  exports.getHistory = getHistory;
  exports.setHistory = setHistory;
  exports.saveToHistory = saveToHistory;
  exports.renderHistory = renderHistory;
  exports.escapeHtml = escapeHtml;
  exports.copyText = copyText;
  exports.openPdf = openPdf;

  // Attach to window if present for runtime usage
  if (typeof window !== "undefined") {
    window.App = window.App || {};
    window.App.getHistory = getHistory;
    window.App.setHistory = setHistory;
    window.App.saveToHistory = saveToHistory;
    window.App.renderHistory = renderHistory;
    window.App.escapeHtml = escapeHtml;
    window.App.copyText = copyText;
    window.App.openPdf = openPdf;
  }

  // Node.js module.exports compatibility
  if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = exports;
  }

})(typeof exports === "undefined" ? {} : exports);
