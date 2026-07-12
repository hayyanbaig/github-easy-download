# GitHub Easy Download

A browser extension that adds a one-click **Download** button to GitHub
repository pages. It automatically finds the project's latest release and
grabs the right file for your operating system — no more hunting through
the Releases page trying to figure out which `.exe`, `.dmg`, or `.deb` you
actually need.

## What it does

- Visit any GitHub repo that publishes releases (e.g.
  `github.com/microsoft/PowerToys`)
- A green **⬇ Download** button appears in the bottom-right corner
- Click it — it downloads the file that matches your OS (Windows, macOS,
  or Linux) automatically
- If it can't tell for sure which file you need, it shows you the full
  list so you can pick manually
- If the project doesn't publish downloadable files at all, it tells you
  that instead of just doing nothing

## How to install

### Option 1: Chrome, Edge, Brave (any Chromium browser)

1. Download this repository:
   - Click the green **Code** button above → **Download ZIP**, or
   - Grab the packaged extension from the [Releases page](../../releases)
2. Unzip it somewhere on your computer (keep the folder — don't delete it
   after installing, the browser loads the extension from these files
   directly)
3. Open `chrome://extensions` (or `edge://extensions`) in your browser
4. Turn on **Developer mode** (toggle in the top-right corner)
5. Click **Load unpacked**
6. Select the unzipped folder — the one that has `manifest.json` directly
   inside it
7. Done. Visit any GitHub repo with releases and the download button
   should appear

### Option 2: Firefox

*(Coming soon — link will be added here once published to Firefox
Add-ons.)*

## Privacy

This extension doesn't collect, store, or send any of your data anywhere.
It only talks to GitHub's public API to look up release files for the
repo you're currently viewing. Full details in [PRIVACY.md](PRIVACY.md).

## Limitations

- Only works on repos that publish **GitHub Releases** with attached
  files. Some large projects (like VS Code itself) host their installers
  elsewhere and won't show a direct download.
- File-naming conventions vary between projects, so the OS-matching is a
  best-effort guess — when it's unsure, it shows you the options instead
  of guessing wrong.
- GitHub limits how many lookups an IP address can make per hour without
  logging in, so on rare occasions the button may not appear until that
  resets.
  
## Support

If this saved you time, a star on the repo helps more than you'd think,and if you'd like to support development directly, reach out.

## License

MIT — see [LICENSE](LICENSE).
