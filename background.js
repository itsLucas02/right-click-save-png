const MENU_ID = "save-as-png";

function setBadge(tabId, text, color) {
  chrome.action.setBadgeText({ tabId, text });
  if (color) chrome.action.setBadgeBackgroundColor({ tabId, color });
}

function clearBadge(tabId) {
  setTimeout(() => chrome.action.setBadgeText({ tabId, text: "" }), 4000);
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_ID, title: "Save image as PNG by Aizzul", contexts: ["image"] });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;
  run(info, tab.id);
});

async function showOnPage(tabId, message) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (m) => alert("Save as PNG: " + m),
      args: [message],
    });
  } catch {}
}

async function run(info, tabId) {
  setBadge(tabId, "...", "#888888");
  try {
    const [r] = await chrome.scripting.executeScript({
      target: { tabId, frameIds: [info.frameId ?? 0] },
      func: saveImageAsPng,
      args: [info.srcUrl || "", info.pageUrl || ""],
    });
    const res = r?.result;
    if (res?.ok) {
      setBadge(tabId, "OK", "#2e7d32");
      console.log("Save as PNG: saved", res.name, "via", res.method);
    } else {
      const err = res?.error || "unknown error";
      setBadge(tabId, "!", "#c62828");
      console.warn("Save as PNG failed:", err);
      showOnPage(tabId, err);
    }
  } catch (e) {
    const err = String(e?.message || e);
    setBadge(tabId, "!", "#c62828");
    console.error("Save as PNG failed:", err);
    showOnPage(tabId, err);
  }
  clearBadge(tabId);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Re-fetch the bytes from the background, where host_permissions bypass CORS.
  // Send the page referer (hotlink checks key on it) and prefer the cache, which
  // may already hold the real image bytes the <img> loaded.
  if (msg?.type === "fetch-image") {
    (async () => {
      const opts = {
        credentials: "include",
        cache: "force-cache",
        redirect: "follow",
        headers: { Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" },
      };
      if (msg.pageUrl) {
        opts.referrer = msg.pageUrl;
        opts.referrerPolicy = "unsafe-url";
      }
      try {
        let r = await fetch(msg.url, opts);
        let type = r.headers.get("content-type") || "";
        if (type.includes("text/html")) {
          r = await fetch(msg.url, { ...opts, cache: "default" });
          type = r.headers.get("content-type") || "";
        }
        if (!r.ok) return sendResponse({ ok: false, error: `HTTP ${r.status}` });
        if (type.includes("text/html")) return sendResponse({ ok: false, error: "web page", html: true });
        return sendResponse({ ok: true, type, buffer: await r.arrayBuffer() });
      } catch (e) {
        return sendResponse({ ok: false, error: String(e?.message || e) });
      }
    })();
    return true;
  }

  // Last resort: screenshot the visible tab and crop to the image.
  if (msg?.type === "capture-tab") {
    chrome.tabs
      .captureVisibleTab(sender.tab?.windowId, { format: "png" })
      .then((dataUrl) => sendResponse({ ok: true, dataUrl }))
      .catch((e) => sendResponse({ ok: false, error: String(e?.message || e) }));
    return true;
  }
});

// Injected into the page. Must be self-contained (no outer references).
function saveImageAsPng(srcUrl, pageUrl) {
  const pngFilename = (url) => {
    let base = "image";
    try {
      const u = new URL(url, location.href);
      base = decodeURIComponent(u.pathname.split("/").pop() || "") || "image";
    } catch {}
    base = base.replace(/\.[^./\\]+$/, "").replace(/[\\/:*?"<>|]+/g, "_").trim().slice(0, 120) || "image";
    return base + ".png";
  };

  const draw = (source, w, h) => {
    if (!w || !h) return Promise.reject(new Error("no pixels"));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d").drawImage(source, 0, 0, w, h);
    return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("canvas is tainted"))), "image/png"));
  };

  const collectImages = (root, out = []) => {
    for (const img of root.querySelectorAll("img")) out.push(img);
    for (const el of root.querySelectorAll("*")) if (el.shadowRoot) collectImages(el.shadowRoot, out);
    return out;
  };

  async function screenshotCrop(el) {
    const r = el.getBoundingClientRect();
    const x = Math.max(0, r.left);
    const y = Math.max(0, r.top);
    const w = Math.min(r.right, innerWidth) - x;
    const h = Math.min(r.bottom, innerHeight) - y;
    if (w < 2 || h < 2) throw new Error("image is not on screen");
    const res = await chrome.runtime.sendMessage({ type: "capture-tab" });
    if (!res?.ok) throw new Error(res?.error || "capture failed");
    const shot = await new Promise((ok, no) => {
      const im = new Image();
      im.onload = () => ok(im);
      im.onerror = () => no(new Error("screenshot decode failed"));
      im.src = res.dataUrl;
    });
    const s = shot.width / innerWidth;
    const c = document.createElement("canvas");
    c.width = Math.round(w * s);
    c.height = Math.round(h * s);
    c.getContext("2d").drawImage(shot, Math.round(x * s), Math.round(y * s), c.width, c.height, 0, 0, c.width, c.height);
    return await new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error("encode failed"))), "image/png"));
  }

  const imgs = collectImages(document);
  const target =
    imgs.find((i) => i.currentSrc === srcUrl || i.src === srcUrl) ||
    imgs.find((i) => srcUrl && (i.currentSrc || i.src || "").startsWith(srcUrl)) ||
    imgs.filter((i) => i.naturalWidth > 0).sort((a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight)[0];

  const name = pngFilename(srcUrl || target?.currentSrc || target?.src || "");

  return (async () => {
    const reasons = [];
    let blob = null;
    let method = "";

    if (target) {
      try {
        blob = await draw(target, target.naturalWidth || target.width, target.naturalHeight || target.height);
        if (blob) method = "page pixels";
      } catch (e) {
        reasons.push("page pixels: " + e.message);
      }
    } else {
      reasons.push("page pixels: image element not found");
    }

    if (!blob) {
      const url = srcUrl || target?.currentSrc || target?.src;
      if (url) {
        try {
          const res = await chrome.runtime.sendMessage({ type: "fetch-image", url, pageUrl });
          if (res?.ok) {
            const bmp = await createImageBitmap(new Blob([res.buffer], { type: res.type || "application/octet-stream" }));
            blob = await draw(bmp, bmp.width, bmp.height);
            if (blob) method = "download";
          } else {
            reasons.push("download: " + (res?.error || "failed"));
          }
        } catch (e) {
          reasons.push("download: " + e.message);
        }
      } else {
        reasons.push("download: no URL");
      }
    }

    if (!blob && target) {
      try {
        blob = await screenshotCrop(target);
        if (blob) method = "screen capture";
      } catch (e) {
        reasons.push("screen capture: " + e.message);
      }
    }

    if (!blob) return { ok: false, error: reasons.join(" | ") || "could not obtain the image" };

    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    (document.body || document.documentElement).appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 60000);
    return { ok: true, name, method };
  })();
}
