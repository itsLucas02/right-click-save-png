# Right-Click Save as PNG — by Aizzul

> Right-click any image in Brave, Chrome, Edge or Opera and save it as a **real PNG** — even when the site tries to hand you a `.webp`, `.avif`, or a broken `.htm` file instead.

[![Platform](https://img.shields.io/badge/browser-Chromium-4f8cff)](https://github.com/itsLucas02)
[![Manifest](https://img.shields.io/badge/manifest-v3-1c3fb8)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## Why this exists

Normally you right-click an image and choose **"Save image as…"**. Two things go wrong:

- **The file saves as `.webp` / `.avif`.** The browser copies the original bytes, so you get the format the website used — not PNG.
- **The file saves as `.htm`.** Some sites refuse direct downloads and send back a *web page* (often a "Preview Unavailable" placeholder) instead of the image.

This extension fixes both: it grabs the image **as it is already displayed on your screen**, re-encodes it to a true **PNG**, and saves it with a `.png` filename — every time.

---

## Features

- **Save any image as PNG** from the right-click menu.
- Converts **WebP, AVIF, GIF, JPEG, BMP, SVG…** to PNG automatically.
- Beats **`.htm` placeholder** downloads by capturing the pixels you can already see.
- Three capture methods, tried in order: *page pixels → background download → screen capture*.
- **No tracking, no accounts, no data collection.** Everything happens locally in your browser.

---

## Install (A–Z, for everyone)

No coding needed. Just follow every step.

### Step 1 — Download the extension

1. Go to the **Releases** page of this project: click the **Releases** link on the right side of this page (or go to `https://github.com/itsLucas02/right-click-save-png/releases`).
2. Under the newest release, find **Assets**.
3. Click **`right-click-save-png.zip`** to download it.

### Step 2 — Unzip it

1. Open your **Downloads** folder.
2. Right-click **`right-click-save-png.zip`** → **Extract All…** (Windows) or double-click it (Mac).
3. Extract it somewhere you will **keep** — for example `Documents\right-click-save-png`.
   > ⚠️ Do **not** delete or move this folder afterwards. The browser loads the extension from it. If you delete it, the extension stops working.
4. Open the extracted folder and check you can see a file called **`manifest.json`**. That folder is the one you need.

### Step 3 — Turn on Developer mode

1. Open your browser and type this in the address bar, then press Enter:
   - **Brave:** `brave://extensions`
   - **Chrome:** `chrome://extensions`
   - **Edge:** `edge://extensions`
   - **Opera:** `opera://extensions`
2. In the **top-right corner**, switch on **Developer mode**.

### Step 4 — Load the extension

1. Click the **Load unpacked** button (top-left area).
2. Select the **folder you extracted in Step 2** (the one that contains `manifest.json`) and confirm.
3. You should now see **"Right-Click Save as PNG by Aizzul"** in the list. 🎉
4. (Optional) Click the **puzzle-piece icon** in your toolbar and **pin** the extension so you can see it.

---

## How to use

1. Go to any web page with an image.
2. **Right-click the image.**
3. Click **"Save image as PNG by Aizzul"**.
4. Check your **Downloads** folder — you'll find the image saved as a `.png`. ✅

**Toolbar feedback:** a small badge on the extension icon tells you how it went:

- **`OK`** (green) — saved successfully.
- **`!`** (red) — it failed; a popup on the page explains why.

**Tip for the best quality:** if an image is huge, **scroll until the whole image is visible** before right-clicking. This guarantees the best result on stubborn sites.

---

## Troubleshooting

**The menu item doesn't appear when I right-click.**
You're probably not right-clicking on a real image (for example, a page background or a fake placeholder). Try it on a normal photo on any news site.

**It says the site "serves a web page, not an image".**
That site blocks direct downloads. The extension then uses *screen capture* instead — just make sure the image is **visible on screen**, then try again.

**The saved image looks lower quality than expected.**
That image was captured with the *screen-capture* fallback, so it's at your screen resolution, not the file's original size. Scroll it fully into view and save again for the best result.

**The extension disappeared after I restarted my computer.**
The folder you extracted was moved or deleted. Re-extract it and load it again (Step 4).

**How do I update it?**
Download the newest `.zip` from Releases, extract it over your old folder, then open `brave://extensions` and click the **reload (↻)** icon on the extension card.

---

## How it works

The extension tries three methods, in order, until one succeeds:

1. **Page pixels** — copies the already-decoded pixels from the image on the page and re-encodes them to PNG. Highest quality, keeps transparency.
2. **Background download** — re-fetches the original image bytes (with the page's referrer and your browser cache) and converts them to PNG.
3. **Screen capture** — takes a screenshot of the visible tab and crops it exactly to the image. Works on *any* site, at your screen resolution.

---

## Permissions & privacy

- `contextMenus` — to add the right-click menu item.
- `scripting` — to read the image you clicked on the current page.
- `host_permissions: <all_urls>` — needed so the fallback download can fetch an image from any site, and so the screen-capture fallback can run.
- `chrome.tabs.captureVisibleTab` — used **only** for the last-resort screen-capture method, on the tab you explicitly clicked.

**Nothing is sent anywhere.** There is no server, no analytics, and no telemetry. All processing happens on your device.

---

## Project layout

```
.
├── manifest.json      # Extension definition
├── background.js      # All the logic (menu, capture, download)
├── icons/             # 16 / 48 / 128 px logo
├── package.ps1        # Builds the distributable ZIP (for maintainers)
├── LICENSE
└── README.md
```

---

## License

Released under the **MIT License**. See [LICENSE](LICENSE).

## Author

Built by **Aizzul Luqman** ([@itsLucas02](https://github.com/itsLucas02)).

If this saved you from a hundred broken `.htm` downloads, a ⭐ on the repo is appreciated.
