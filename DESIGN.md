# Site design - Muay Thai training log

A light, sleek, mobile-first web app that reads my training markdown files and turns them into a beautiful log. Interface in English (I'm learning English too); note content stays as written, including any Vietnamese words in brackets.

## Mood
Clean and calm, with a sporty energy. Mostly white space, soft lavender and lime glows, big confident numbers, rounded cards, pastel category colours. Built from the four Dribbble references:
- Soft lime + lavender gradient glow at the top of screens, fading into an off-white background
- White cards with large radius, almost no shadow
- Huge bold numerals for stats, with small grey labels underneath
- Horizontal day strip and a month calendar with filled circles for trained days
- Pastel-tinted category cards (lilac, mint, butter, peach)
- Floating pill-shaped bottom navigation in near-black
- Round 44px icon buttons with an arrow (↗) on cards
- One near-black "contrast" card per screen for emphasis

Light mode only. No dark mode.

## Design tokens

### Colour
| Token | Value | Use |
|---|---|---|
| `--bg` | `#F6F5FA` | Page background (lavender-tinted off-white) |
| `--surface` | `#FFFFFF` | Cards |
| `--ink` | `#121216` | Main text, dark contrast card, bottom nav |
| `--ink-2` | `#6B6A75` | Secondary text, labels |
| `--line` | `#ECEBF2` | Hairline borders, dividers |
| `--lavender` | `#7B6CF6` | Primary accent: active states, trained days, links |
| `--lavender-soft` | `#ECE8FF` | "Added by Pi Liang" panels, selected chips |
| `--lime` | `#D6F36B` | Second accent: highlights, today, "My notes" card |
| `--lime-soft` | `#F3FBD2` | Soft lime backgrounds |

Category tints (card backgrounds, text stays `--ink`):
| Category | Tint |
|---|---|
| Stance & movement | `#DCEFE4` mint |
| Punches | `#E8E2FF` lilac |
| Kicks | `#FFF1BF` butter |
| Knees | `#FFE2D6` peach |
| Elbows | `#DCEBFF` sky |
| Defence | `#F1E4FA` orchid |
| Clinch | `#E4F0F7` mist |
| Combos | `#F3FBD2` lime |

Header glow: two blurred radial gradients behind the top 280px. Lime at the top left, lavender at the top right, about 60% opacity, fading into `--bg`.

All text must meet WCAG AA contrast (4.5:1). If white on `--lavender` fails, darken the lavender used behind white text.

### Type
- Font: **Be Vietnam Pro** (Google Fonts, weights 400/500/600/700/800). Clean in English and still renders the Vietnamese words in my notes properly.
- Scale: display 48/800 (stats), h1 28/700, h2 20/700, h3 17/600, body 15/400 with 1.55 line-height, label 12/500 uppercase-free in `--ink-2`.
- Numbers use `font-variant-numeric: tabular-nums`.

### Shape and space
- Radius: cards 24px, inner panels 16px, chips and buttons fully round.
- Spacing scale 4/8/12/16/20/24/32. Page side padding 20px.
- Shadow: none by default. Floating nav only: `inset 0 1px 0 rgba(255,255,255,0.10), 0 10px 30px rgba(18,18,22,0.28)`.
- Icons: Lucide-style 1.75px stroke, inline SVG.
- Motion: 200ms ease-out on taps and accordions. Respect `prefers-reduced-motion`.

## Navigation
Floating near-black pill at the bottom with 5 tabs. The active tab is a lavender pill (`--lavender-strong`) with a white icon and label; inactive tabs are icons only in `rgba(255,255,255,0.78)`.

- **Position:** like Apple's apps (Fitness, Contacts), the bar sits over the home-indicator area: `bottom: max(16px, calc(env(safe-area-inset-bottom) - 13px))` = 21pt from the screen bottom on an iPhone with a 34pt home indicator; 16px in Safari and on desktop. Centred, `width: min(400px, 100% - 32px)`.
- **Size:** bar 64px tall; tabs 48px tall; the pill sits 8px from the bar's outer edge (7px padding + 1px border). Inactive tabs are 44px wide (11px padding + 22px icon), 2px apart, so the active label fits with 5 tabs; under 375px wide the bar is `100% - 24px`.
- **Glass (15%):** `background: rgba(18,18,22,0.86)`, `backdrop-filter: blur(18px) saturate(160%)` (plus `-webkit-`), `border: 1px solid rgba(255,255,255,0.12)`, shadow `inset 0 1px 0 rgba(255,255,255,0.10), 0 10px 30px rgba(18,18,22,0.28)`. Content scrolling underneath shows as a soft blur. Where `backdrop-filter` isn't supported, the bar is solid `--ink`.

| Tab | Route |
|---|---|
| Home | `#/` |
| Sessions | `#/sessions` |
| Techniques | `#/techniques` |
| Drills | `#/drills` (dumbbell icon) |
| Words | `#/words` |

Session detail: `#/session/2026-10-09`. A single drill: `#/drills/<drill-id>` (the id is the drill name in lowercase with hyphens, e.g. `#/drills/elbow-wall-drill`) - opens the Drills screen scrolled to that drill with a lavender ring.

## Screens

### 1. Home
- Glow header. Small label "Muay Thai" and big title **"N days in"** ("1 day in" on the start date), counting calendar days from `startDate` to today with the start day as day 1. Subtitle: "Session X · Started <date>".
- "Day N" is reserved for session numbers (session cards, session detail, Words). Don't use it for the calendar-day count.
- **Stats row**, 3 big numerals: Sessions · This week · Techniques learned.
- **Week strip**: Mon-Sun chips for the current week. Trained days are filled lavender, today has a lime ring.
- **Latest session**: white card with Day badge, date, summary, technique chips, ↗ button. Opens the session.
- **Home drills** (right under Latest session): compact white card with a lime dumbbell circle, "N drills to practise" and how many are ticked today ("1 of 4 done today" / "None done yet today"), ↗ button. Opens `#/drills`. Hidden when there are no active drills.
- **Next time**: near-black card with the "Next time" bullets from the latest session, in white text.
- **Milestones** from `goals.md`: a progress line (done / total), then each milestone as a row with a check circle.

### 2. Sessions
- Month calendar ("October 2026" with ‹ ›). Trained days are filled lavender circles, today has a lime ring. Tapping a trained day opens that session.
- Below: session cards, newest first. Each shows a large "Day 1" + date, the summary, up to 4 technique chips (+N), and small icons when the session has My notes or New words.

### 3. Session detail
- Glow header: "Day 1", full date (e.g. "Friday, 9 October 2026"), and the Class line.
- Sticky chip bar that scrolls to each section: Lesson · Conditioning · Body · My notes · New words · Next time. Only show chips for sections that have content.
- **Lesson**: one accordion card per technique, tinted by category. Collapsed: number badge for punches (1-6) + name. Expanded:
  - **From class**: white inner panel - the coach's points.
  - **How it works**: `--lavender-soft` panel with a small "Added by Pi Liang" tag. The coach/Pi Liang difference must be obvious at a glance. (Pi Liang is the Project Claude that writes the notes; the site never says "Claude". Notes mark these parts `*(added by Pi Liang)*`; older notes with `*(added by Claude)*` still work.)
  - "Ask the coach" lines (marked with "-> **Ask the coach**" or "-> **Check with the coach**") get a small lime "Ask coach" tag.
- **Conditioning** and **Body**: simple white cards. Pi Liang's sub-part uses the same lavender panel.
- **My notes**: `--lime-soft` card with a quote mark. It's my own voice, so it should feel personal.
- **New words**: rows of "what I said -> **standard term**", with the note in small grey text below, then the **Example** line: a small "Example" label and the sentence in italics, with a lavender left rule (quote style). The standard term is bold with a lime highlighter where it appears in the sentence (case-insensitive; for "load / load up" style terms either part matches). Rows without an example just leave the line out.
- **Next time**: checklist-style rows.

### 4. Techniques
- **Status summary**: a 4-segment bar showing counts per status.
- Filter chips: All · Stance & movement · Punches · Kicks · Knees · Elbows · Defence · Clinch · Combos. Hide empty categories.
- 2-column grid of category-tinted cards: name, Thai term if any, status pill, and a 4-dot progress indicator (filled up to the current status).
- Tap a card -> bottom sheet with the key cue, first taught and last updated dates, a "Home drill" link for each **active** drill that lists the technique, and links to every session that mentions the technique.

Status labels: Seen · Drilling · Clean on pads · Usable in sparring (same as the files).

### 5. Drills
Home drills that fix what the coach corrects, from `drills.md`.
- Glow header: label "Practice", title **"Home drills"**, subtitle "N active drills · N fixed".
- **Today** (the near-black card): big "done / active" numeral with "done today", one dot per active drill (lime when ticked), and a short line of encouragement.
- Filter chips: **Active** (default) · Fixed · All, with counts. Empty Fixed view: "No fixed drills yet".
- One white card per drill:
  - Drill name (small, `--lavender-ink`), then the **Fixes** line as the headline (18/700).
  - Chips: the techniques (category-tinted; tap -> that technique's bottom sheet; "All punches" -> Techniques filtered to Punches) and the "Day N" it came from (`--lavender-soft`, tap -> the session). Chips are 32px tall with a 44px tap area.
  - **Coach's cue** in a `--lime-soft` callout with the same ink-and-lime dot as "From class" - it's the coach's words.
  - **Dose** line with a timer icon.
  - **How to do it** accordion (collapsed by default, 200ms like the lesson accordions), steps as a numbered list with ink circles and lime numbers.
  - Footer: "Practised N days" (or "Not practised yet") and "Done today" when ticked.
- **Done today:** a round 48px check button top-right on each Active drill. Grey outline when not done, lime fill with an ink check when done. Stored in `localStorage` (`muay-thai-log:drills-done`, a list of dates per drill), so it's per device and resets each day. "Practised N days" counts the stored dates. If storage is blocked, ticks still work until the page is closed.
- **Fixed** drills look calmer: outlined instead of white, no lime, a small mint "Fixed" badge instead of the check button.

### 6. Words
- Search field ("Search words...").
- All New words rows from every session, deduplicated by standard term, sorted A-Z. Each row: standard term (bold), what I said, note, the Example line (same style as Session detail), and the "Day N" where it first appeared.
- Search matches what I said, the standard term, the note and the example.
- Toggle "Flashcards": one card at a time. The front shows what I said, tap to reveal the standard term, its note and the example sentence.

## Data (no build step)
- The markdown files are the source of truth. The site fetches and parses them in the browser.
- `data/sessions.json` lists sessions (GitHub Pages can't list folders). Pi Liang adds a row each time a session is logged.
- Parse `sessions/*.md` by headings: `##` = section, `###` = technique, `**From class**` / `**How it works**` = the two parts, markdown tables for New words.
- Parse `techniques.md` tables (category = `##` heading) and `goals.md` checkboxes.
- Parse `drills.md`: each `##` is a drill; the `- **Label:**` bullets are read by label (Fixes, Coach's cue, Technique, From, Status, Dose, How + numbered list), so order doesn't matter and missing fields are skipped. Technique names match `techniques.md` rows; "all punches" (all + a category) means every technique in that category.
- Render markdown with a pinned CDN version of `marked`. Escape everything else.
- If a file fails to load or parse, show a friendly empty state ("Nothing here yet") and never a blank page.

## Layout
- Designed at 390px wide, works from 360px.
- On tablet and desktop: a centred app column, max 480px, on the `--bg` background. Nothing else changes.
- Tap targets at least 44px. No horizontal scroll except the week strip and the chip bar.

## Privacy
GitHub Pages sites are public. Don't show my name anywhere on the site.
