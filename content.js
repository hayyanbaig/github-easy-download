// GitHub Easy Download — content script
// Runs on every github.com page, figures out if we're looking at a repo,
// fetches its latest release, picks the right file for this OS, and shows
// a floating download button.

(function () {
  "use strict";

  // ---------- 1. Figure out which repo we're on ----------
  function getRepoFromUrl() {
    // Pages we should NOT treat as a repo (GitHub's own top-level sections)
    const RESERVED = new Set([
      "settings", "notifications", "issues", "pulls", "marketplace",
      "explore", "topics", "trending", "collections", "sponsors",
      "codespaces", "new", "organizations", "orgs", "about", "login",
      "join", "search", "apps"
    ]);

    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const [owner, repo] = parts;
    if (RESERVED.has(owner)) return null;
    return { owner, repo: repo.replace(/\.git$/, "") };
  }

  // ---------- 2. OS / architecture detection ----------
  function detectOS() {
    const ua = navigator.userAgent;
    if (/Windows/i.test(ua)) return "windows";
    if (/Macintosh|Mac OS X/i.test(ua)) return "mac";
    if (/Android/i.test(ua)) return "android";
    if (/Linux/i.test(ua)) return "linux";
    return "unknown";
  }

  function detectArch() {
    const ua = navigator.userAgent;
    if (/arm64|aarch64/i.test(ua)) return "arm64";
    // Apple Silicon Macs often still report Intel UA strings, so this is best-effort only.
    return "x64";
  }

  // ---------- 3. Score each release asset against the detected OS ----------
  const IGNORE_EXT = /\.(sha256|sha1|asc|sig|txt|json|yml|yaml|blockmap|md)$/i;

  const OS_PATTERNS = {
    windows: [/\.exe$/i, /\.msi$/i, /win(dows|64|32)?/i],
    mac: [/\.dmg$/i, /\.pkg$/i, /mac(os)?|darwin|osx/i],
    linux: [/\.appimage$/i, /\.deb$/i, /\.rpm$/i, /\.tar\.gz$/i, /linux/i],
    android: [/\.apk$/i, /android/i],
  };

  const ARCH_PATTERNS = {
    arm64: [/arm64/i, /aarch64/i],
    x64: [/x64|amd64|x86_64/i],
  };

  function scoreAsset(asset, os, arch) {
    const name = asset.name;
    if (IGNORE_EXT.test(name)) return -1;

    let score = 0;
    const osPatterns = OS_PATTERNS[os] || [];
    for (const p of osPatterns) if (p.test(name)) score += 10;

    const archPatterns = ARCH_PATTERNS[arch] || [];
    for (const p of archPatterns) if (p.test(name)) score += 3;

    // Slight penalty for source-code style archives when a native installer exists
    if (/^source code/i.test(asset.label || "")) score -= 5;

    return score;
  }

  function pickBestAsset(assets, os, arch) {
    const scored = assets
      .map((a) => ({ asset: a, score: scoreAsset(a, os, arch) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return { best: null, confident: false, all: assets };

    const best = scored[0];
    // "Confident" if the top score clearly beats the runner-up (or there's only one match)
    const confident =
      scored.length === 1 || best.score - (scored[1]?.score ?? 0) >= 3;

    return { best: best.asset, confident, all: assets };
  }

  // ---------- 4. Fetch latest release from GitHub API ----------
  async function fetchLatestRelease(owner, repo) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
        { headers: { Accept: "application/vnd.github+json" } }
      );
      if (res.status === 404) return { type: "no_releases" };
      if (res.status === 403) return { type: "rate_limited" };
      if (!res.ok) return { type: "error" };
      const data = await res.json();
      if (!data.assets || data.assets.length === 0) return { type: "no_assets", release: data };
      return { type: "ok", release: data };
    } catch (e) {
      return { type: "network_error" };
    }
  }

  // ---------- 5. UI ----------
  function osLabel(os) {
    return { windows: "Windows", mac: "macOS", linux: "Linux", android: "Android" }[os] || "your system";
  }

  function formatSize(bytes) {
    const mb = bytes / 1024 / 1024;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  }

  function buildWidget({ release, best, confident, all, os, arch }) {
    const wrap = document.createElement("div");
    wrap.id = "ged-widget";

    const btn = document.createElement("button");
    btn.id = "ged-main-btn";
    btn.textContent = best
      ? `⬇ Download for ${osLabel(os)}`
      : `⬇ Download (choose file)`;
    wrap.appendChild(btn);

    const sub = document.createElement("div");
    sub.id = "ged-sub";
    sub.textContent = release.tag_name + (confident ? "" : " — best guess, please confirm");
    wrap.appendChild(sub);

    const panel = document.createElement("div");
    panel.id = "ged-panel";
    panel.style.display = "none";

    all.forEach((asset) => {
      const row = document.createElement("a");
      row.className = "ged-row";
      row.href = asset.browser_download_url;
      row.textContent = `${asset.name}  (${formatSize(asset.size)})`;
      if (best && asset.id === best.id) row.classList.add("ged-row-best");
      panel.appendChild(row);
    });
    wrap.appendChild(panel);

    btn.addEventListener("click", (e) => {
      if (best && confident) {
        window.location.href = best.browser_download_url;
      } else {
        e.preventDefault();
        panel.style.display = panel.style.display === "none" ? "block" : "none";
      }
    });

    const toggle = document.createElement("button");
    toggle.id = "ged-toggle";
    toggle.textContent = "⌄";
    toggle.title = "Show all files";
    toggle.addEventListener("click", () => {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });
    wrap.appendChild(toggle);

    return wrap;
  }

  function buildFallbackWidget({ type, owner, repo }) {
    const MESSAGES = {
      no_releases: "This project doesn't publish downloads via GitHub Releases.",
      no_assets: "Latest release has no downloadable files attached.",
      rate_limited: "GitHub's lookup limit was hit — try again in a few minutes.",
      error: "Couldn't check this repo for downloads right now.",
      network_error: "Couldn't reach GitHub to check for downloads.",
    };

    const wrap = document.createElement("div");
    wrap.id = "ged-widget";

    const btn = document.createElement("button");
    btn.id = "ged-main-btn";
    btn.classList.add("ged-neutral");
    btn.textContent = "⬇ View releases on GitHub";
    btn.addEventListener("click", () => {
      window.location.href = `https://github.com/${owner}/${repo}/releases`;
    });
    wrap.appendChild(btn);

    const sub = document.createElement("div");
    sub.id = "ged-sub";
    sub.textContent = MESSAGES[type] || MESSAGES.error;
    wrap.appendChild(sub);

    return wrap;
  }

  // ---------- 6. Main ----------
  async function init() {
    const repoInfo = getRepoFromUrl();
    if (!repoInfo) return;

    // Avoid duplicate widgets if GitHub's SPA navigation re-runs this script
    if (document.getElementById("ged-widget")) return;

    const result = await fetchLatestRelease(repoInfo.owner, repoInfo.repo);

    let widget;
    if (result.type === "ok") {
      const os = detectOS();
      const arch = detectArch();
      const { best, confident, all } = pickBestAsset(result.release.assets, os, arch);
      widget = buildWidget({ release: result.release, best, confident, all, os, arch });
    } else {
      widget = buildFallbackWidget({ type: result.type, owner: repoInfo.owner, repo: repoInfo.repo });
    }

    document.body.appendChild(widget);
  }

  init();

  // GitHub is a single-page app — re-check when the URL changes without a full reload
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      const existing = document.getElementById("ged-widget");
      if (existing) existing.remove();
      init();
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
