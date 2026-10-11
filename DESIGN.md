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
| `--lavender-soft` | `#ECE8FF` | "Claude added" panels, selected chips |
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
- Shadow: none by default. Floating nav only: `0 8px 24px rgba(18,18,22,0.18)`.
- Icons: Lucide-style 1.75px stroke, inline SVG.
- Motion: 200ms ease-out on taps and accordions. Respect `prefers-reduced-motion`.

## Navigation
Floating near-black pill at the bottom with 4 tabs. The active tab is a lavender circle with a white icon and label.

| Tab | Route |
|---|---|
| Home | `#/` |
| Sessions | `#/sessions` |
| Techniques | `#/techniques` |
| Words | `#/words` |

Session detail: `#/session/2026-10-09`.

## Screens

### 1. Home
- Glow header. Small label "Muay Thai" and big title **"N days in"** ("1 day in" on the start date), counting calendar days from `startDate` to today with the start day as day 1. Subtitle: "Session X · Started <date>".
- "Day N" is reserved for session numbers (session cards, session detail, Words). Don't use it for the calendar-day count.
- **Stats row**, 3 big numerals: Sessions · This week · Techniques learned.
- **Week strip**: Mon-Sun chips for the current week. Trained days are filled lavender, today has a lime ring.
- **Latest session**: white card with Day badge, date, summary, technique chips, ↗ button. Opens the session.
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
  - **How it works**: `--lavender-soft` panel with a small "Added by Claude" tag. The coach/Claude difference must be obvious at a glance.
  - "Ask the coach" lines (marked with "-> **Ask the coach**" or "-> **Check with the coach**") get a small lime "Ask coach" tag.
- **Conditioning** and **Body**: simple white cards. The Claude-added sub-part uses the same lavender panel.
- **My notes**: `--lime-soft` card with a quote mark. It's my own voice, so it should feel personal.
- **New words**: rows of "what I said -> **standard term**", with the note in small grey text below.
- **Next time**: checklist-style rows.

### 4. Techniques
- **Status summary**: a 4-segment bar showing counts per status.
- Filter chips: All · Stance & movement · Punches · Kicks · Knees · Elbows · Defence · Clinch · Combos. Hide empty categories.
- 2-column grid of category-tinted cards: name, Thai term if any, status pill, and a 4-dot progress indicator (filled up to the current status).
- Tap a card -> bottom sheet with the key cue, first taught and last updated dates, and links to every session that mentions the technique.

Status labels: Seen · Drilling · Clean on pads · Usable in sparring (same as the files).

### 5. Words
- Search field ("Search words...").
- All New words rows from every session, deduplicated by standard term, sorted A-Z. Each row: standard term (bold), what I said, note, and the "Day N" where it first appeared.
- Toggle "Flashcards": one card at a time. The front shows what I said, tap to reveal the standard term.

## Data (no build step)
- The markdown files are the source of truth. The site fetches and parses them in the browser.
- `data/sessions.json` lists sessions (GitHub Pages can't list folders). Claude adds a row each time a session is logged.
- Parse `sessions/*.md` by headings: `##` = section, `###` = technique, `**From class**` / `**How it works**` = the two parts, markdown tables for New words.
- Parse `techniques.md` tables (category = `##` heading) and `goals.md` checkboxes.
- Render markdown with a pinned CDN version of `marked`. Escape everything else.
- If a file fails to load or parse, show a friendly empty state ("Nothing here yet") and never a blank page.

## Layout
- Designed at 390px wide, works from 360px.
- On tablet and desktop: a centred app column, max 480px, on the `--bg` background. Nothing else changes.
- Tap targets at least 44px. No horizontal scroll except the week strip and the chip bar.

## Privacy
GitHub Pages sites are public. Don't show my name anywhere on the site.
