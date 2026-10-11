# Prompt for Claude Code

Paste everything below the line into Claude Code, opened in the `muay-thai-training` folder.

---

Build my Muay Thai training log as a static web app in this folder and publish it on GitHub Pages.

**Read first:** `DESIGN.md` (the full design spec - follow it closely), `data/sessions.json`, `sessions/2026-10-09.md`, `techniques.md`, `goals.md`, `templates/session.md`.

**What to build**
1. `index.html`, `styles.css` and `app.js` in the folder root. Plain HTML/CSS/JS - no framework, no build step, no npm.
2. A hash-routed single-page app with the 5 screens in DESIGN.md: Home, Sessions, Session detail, Techniques, Words.
3. It reads the markdown files at runtime with `fetch` and parses them as described in the "Data" section. The markdown files stay the source of truth - don't convert them to JSON, and don't change their format.
4. Load `marked` from cdnjs or jsDelivr with an exact pinned version. Load Be Vietnam Pro from Google Fonts. Use inline SVG icons.
5. Interface text in English, using the labels in DESIGN.md. Note content is shown as written (it may include Vietnamese words in brackets).
6. Light mode only. Use the colour and type tokens from DESIGN.md as CSS variables.
7. Every screen needs an empty state, because there is only 1 session so far.

**Quality bar**
- I'm a very visual person. It must feel clean, sleek and premium, like the Dribbble references described in DESIGN.md - not like a template.
- Test at 360px, 390px and 1280px wide with Playwright. Take screenshots of every screen and fix anything misaligned, cramped or low-contrast before you call it done.
- Check WCAG AA contrast for all text.
- No console errors.

**Publish**
- Create a public GitHub repo named `muay-thai-training` under my account, push everything, and turn on GitHub Pages from the main branch root.
- Add a `.nojekyll` file so the markdown files are served as-is.
- Confirm the live URL loads and shows Day 1.

**When done, tell me in plain words:** the live URL, and anything you couldn't do. I'm not a developer - don't ask me to run any commands. Do any git or terminal work yourself.
