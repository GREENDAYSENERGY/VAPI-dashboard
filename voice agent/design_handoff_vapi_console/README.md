# Handoff: Gadi.ai Voice Agent Console — VAPI Dashboard Redesign

## Overview

This is a redesign of the **VAPI-dashboard** Next.js app (repo: `GREENDAYSENERGY/VAPI-dashboard`) into a polished, Gadi.ai-branded operator console for an **operations lead** monitoring a fleet of AI voice agents.

The current `/dashboard` is functional but feels developer-tool-ish: 4 pastel KPI cards, two charts, one giant table. It mixes content that belongs on different surfaces (live monitoring vs. historical logs vs. cost analytics) into a single screen, and uses ad-hoc colors (`#166534` green emoji logo, 6-pastel disposition badges, mixed primary colors) that fight with the brand.

The redesign splits this into **five focused screens** with a consistent visual language anchored on the **Gadi.ai design system** (one blue, Poppins, flat surfaces, mono numerics, subtle blue-tinted shadows).

## About the Design Files

The files in this bundle are **design references created in HTML/React+JSX-via-Babel**. They are NOT production code to copy directly.

The current codebase is **Next.js 16 + React 19 + Tailwind v4 + shadcn + Drizzle + TanStack Table**, with VAPI fetched in `src/lib/vapi.ts`. The task is to **rebuild the screens shown in the prototypes inside that existing environment**, using the codebase's conventions (Server Components where data is read, Client Components for interactivity, shadcn primitives, Tailwind for layout).

What to keep from the existing repo:
- `src/lib/vapi.ts` — the `VapiCall` interface, `getCalls`, `getCall` are good
- `src/lib/pricing.ts` — `calcCost`, `calcBlocks`, `formatDuration` — reuse as-is
- `src/db/schema.ts` — `callNotes` table works for the notes feature
- `src/app/api/calls/route.ts`, `src/app/api/notes/route.ts` — API routes
- Auth + session (`src/lib/auth.ts`, login page)
- shadcn primitives (`button`, `card`, `dialog`, `input`, `sheet`, `table`, `badge`, `select`)
- `@tanstack/react-table` for the logs table
- Recharts (used in the prototype as inline SVG; switch to Recharts in the rebuild)

What to replace:
- `src/app/(dashboard)/layout.tsx` — sidebar + new topbar
- `src/app/(dashboard)/dashboard/page.tsx` — split into Overview + new Live + new Logs
- `src/app/(dashboard)/pricing/page.tsx` — fold into a new Analytics page
- `src/components/StatsCards.tsx` — replace with new KPI component
- `src/components/CallsTable.tsx` — restyle, keep behavior
- `src/components/CallModal.tsx` — replace with new CallDetailDrawer (still uses shadcn `Sheet`)
- `src/components/OutcomesChart.tsx`, `CallsPerDayChart.tsx`, `PricingTable.tsx`, `DateRangePicker.tsx` — replace/reskin

What to add (net-new):
- A **Live Calls** page and a `LiveCalls` data hook (will need a new `/api/calls/live` route, or VAPI WebSocket if available)
- An **Analytics** page with line chart, donut, cost-composition bar, heatmap
- A **Tweaks** layer (optional, see below) — likely not shipped; was for design exploration

## Fidelity

**High-fidelity.** Pixel values, exact hex codes, typography, spacing, and interactions are all final. The developer should recreate the UI pixel-perfectly, using:

- **Gadi.ai design tokens** from `design/colors_and_type.css` (copied into this handoff). Drop these CSS custom properties into `src/app/globals.css` and use them in Tailwind config + arbitrary `[var(--token)]` classes.
- **Poppins** as the only typeface (weights 300/400/500/600/700/800). Already loaded via Google Fonts in the design files; replace `next/font` Geist with Poppins.

## Route Structure

Replace the current single `/dashboard` with five routes under `(dashboard)`:

| Route | Replaces / new | Server or Client |
|---|---|---|
| `/overview`  | Net-new; partially replaces `/dashboard` KPI + charts | Server (reads calls) |
| `/live`      | Net-new | Client (polls or WS) |
| `/calls`     | Replaces the calls table from `/dashboard` | Server (initial) + Client (table) |
| `/analytics` | Replaces `/pricing` | Server (reads calls) + Client (charts) |
| `/billing`   | Net-new (out of scope for this handoff) | — |

Update `/dashboard` to redirect to `/overview` for backward compatibility.

---

## Screens

### 1. App Shell — Sidebar + Topbar

**File: `src/app/(dashboard)/layout.tsx`**

Replace the existing sidebar entirely. The new shell is a **grid `[232px 1fr] / [56px 1fr]`**:

#### Sidebar (`232px` wide, `--surface`, right border `1px var(--line)`)

Stack vertically:
1. **Brand row** (`56px` tall, padding `0 18px`, bottom border `1px var(--line)`):
   - 24px blue dot-cluster icon (`design/assets/icon-dots-blue.svg`)
   - Wordmark: `Gadi` in Poppins 600 size 18px color `var(--text-1)`, followed by `.ai` in Poppins 400 color `var(--accent)`
2. **Org switcher card** (margin `12px 12px 4px`, padding `14px 18px`, border `1px var(--line)`, radius `--radius-md`, bg `--surface-2`):
   - 32×32 rounded-8 avatar bg `--accent-deep` color white, content = org initials ("GG")
   - Name (`13px / 600` color `--text-1`)
   - Plan + count (`11px` color `--text-3`) — e.g. `"Gadi Pro · 1,284 systems"`
   - Chevron-down icon on the right
   - Hover: border color → `--accent`
3. **Section header** "OPERATIONS" — `10px/600/0.1em uppercase`, color `--text-4`, padding `18px 22px 6px`
4. **Nav links** (5 items, padding `0 8px`):
   - `Overview` (icon: LayoutDashboard)
   - `Live Calls` (icon: Radio) — with **live indicator pulse** on the right (7px green dot with animated 4px halo, `livePulse 1.6s` keyframe). Count badge ("2") if calls in progress
   - `Call Logs` (icon: List) — with count pill (e.g. "184")
   - `Analytics` (icon: Activity)
   - `Billing` (icon: Wallet)
5. **Section header** "CONFIGURE"
6. **Nav links**:
   - `Assistant` (icon: Bot)
   - `Phone Numbers` (icon: Phone)
   - `Team` (icon: Users)
7. **Footer** (margin-top auto, padding `12px 8px`, top border `1px --line`):
   - `Settings` (icon: Settings)
   - `Help` (icon: HelpCircle)

**Nav link spec** (`button`, full width):
- Padding `9px 14px`, radius `--radius-md`, gap 12px between icon and label
- Font `13px / 500` color `--text-2`
- Icon 16px stroke `currentColor`
- Hover: bg `--surface-3`, color `--text-1`
- Active: bg `--accent-soft`, color `--accent-deep`, weight 600, plus a `3px` left-edge bar (radius 2) bg `--accent` running from `top:8px` to `bottom:8px` (use `::before`)
- Count badge: `font-size: 11px; padding: 2px 6px; border-radius: 999px; bg --surface-3; color --text-2; font-weight: 600` — active state turns the badge bg `rgba(0,121,193,0.18)` and color `--accent-deep`
- Live dot: `7px` green `var(--pos)` with animated halo `0 0 0 4px rgba(22,163,74,0.18) → 0 0 0 6px rgba(22,163,74,0.05) at 50%` over `1.6s ease-in-out infinite`

#### Topbar (`56px` tall, right of sidebar)

`display: flex; align-items: center; padding: 0 22px; gap: 12px; border-bottom: 1px var(--line); background: --surface`

Left-to-right:
1. **Breadcrumbs**: `13px` color `--text-3`, `8px` gap, `12px` chevron between. Current segment color `--text-1` weight 600. `white-space: nowrap`. Example: `"Operations" › "Overview"`
2. **Flex spacer** (`flex: 1`)
3. **Search input pill** (`34px` tall, padding `0 12px`, radius 999, border `1px --line`, bg `--surface-2`, `width: 320px; flex-shrink: 1; min-width: 180px`):
   - 14px search icon
   - Input placeholder `"Search calls, customers, transcripts…"`
   - `⌘K` kbd hint at the right (`10px mono`, padded pill bg `--surface-3` border `1px --line`)
   - On focus: border `--accent` + `var(--shadow-focus)`
4. **Live ticker pill** (`34px` tall, padding `0 12px`, radius 999, bg `--surface-3` border `1px --line`, `font-size: 12px; color: --text-2; white-space: nowrap; flex-shrink: 0`):
   - Animated green dot
   - `<b>{liveCount}</b> live`
   - 4px gray dot separator
   - `<b>17</b> queued`
   - 4px gray dot separator
   - `Today <b>$74</b>`
   - Hover: border → `--accent`. Click → navigate to `/live`
5. **Vertical divider** `1px × 22px`
6. **Bell icon button** (34px circle, hover bg `--surface-3`) with `7px` accent dot pip top-right
7. **Profile pill** (padding `4px 10px 4px 4px`, radius 999):
   - 28px round avatar bg `--accent-deep` color white containing initials
   - Two-line name: name `13px/500 --text-1`, role `11px --text-3`
   - Chevron-down

#### Density and Sidebar variants (optional — currently exposed as Tweaks; skip for v1):

The design supports compact density (`--row-h: 34px`, `--card-p: 16px`, `--kpi-num: 26px`) and icon-only / rail sidebar variants. These are nice-to-haves; ship `comfortable` + `full` first.

---

### 2. Overview Screen — `/overview`

**File: `src/app/(dashboard)/overview/page.tsx`**

The operations command center. Loads server-side with `getCalls({ createdAtGt: 14daysAgo, limit: 1000 })`.

#### Section A — Hero band

Full-width navy band (`var(--bg-dark)` = `#0a4a73`) with a subtle radial highlight:

```css
background:
  radial-gradient(1200px 400px at 90% 0%, rgba(0,121,193,0.14) 0%, transparent 60%),
  linear-gradient(180deg, var(--accent-deep) 0%, var(--blue-800) 100%);
border-radius: var(--radius-lg);
padding: 28px 32px;
```

Add a subtle `icon-dots-white.svg` decoration in the top-right at 220px wide, 6% opacity.

Two-column layout (flex, `align-items: flex-end`):

- **Left** (max-width 520px):
  - Eyebrow `"GOOD AFTERNOON, ALEX"` (`10px/600/0.16em uppercase` color `rgba(255,255,255,0.55)`)
  - H2 `"Your fleet is performing well today."` (Poppins 600 / 22px / -0.01em, color white)
  - Sub: `"Sunny generated <b>N appointments</b> from <b>N connected calls</b> — that's a <b>X% booking rate</b>, +4pts above your 30-day baseline."` (13px, color `rgba(255,255,255,0.75)`, bold parts pure white)

- **Right** (flex row, 32px gap):
  - 3 hero-stat columns separated by `1px rgba(255,255,255,0.16)` vertical dividers:
    - "LIVE NOW" / `{liveCount}` / sub `"2 connected · 1 ringing"`
    - "QUEUED · TODAY" / `17` / `"Next call in 2:14"`
    - "SPEND · TODAY" / `$74` / `"$1.76 / appointment"`
  - **"Monitor live" button** (primary, white bg, color `--accent-deep`, radio icon) → links to `/live`

Each hero-stat: label `11px/600/0.1em uppercase rgba(255,255,255,0.55)`, value Poppins 600 / 28px / -0.02em / tabular-nums / white, sub `11px rgba(255,255,255,0.6)`.

#### Section B — KPI row (4 cards in grid-4)

`display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px`. Each KPI:
- Bg `--surface`, border `1px --line`, radius `--radius-md`, padding 20px, `position: relative`
- **Featured** variant (first card): bg `linear-gradient(180deg, var(--accent-soft) 0%, var(--surface) 60%)`, border `--accent-soft-2`
- **Label**: `11px/600/0.1em uppercase --text-3`, with a 12px icon prepended in an `--text-3` muted ico slot
- **Value**: Poppins 600 / 30px / -0.02em / tabular-nums / `--text-1`, with optional `unit` (14px / 500 / `--text-3`)
- **Sub row** below value (12px `--text-3`, `white-space: nowrap`):
  - Delta chip: `+N%` colored `--pos` (positive) or `--neg` (negative), inline-flex with arrow-up/arrow-down icon (11px)
  - Followed by a description text (`"vs prior 14d"`, `"102 connected"`, etc.)
- Optional **sparkline** absolutely positioned `right: 12; top: 18; width: 70; height: 28; opacity: 0.55` — area chart with `--accent` line over a gradient fill

The 4 KPIs:

| Label | Value | Delta | Sub | Spark? |
|---|---|---|---|---|
| Calls placed · 14d (featured) | Total count | +12% | "vs prior 14d" | yes |
| Connect rate | `55.4%` | +2.4% | "102 connected" | no |
| Appointments booked | Count | +18% | "33% of connected" | no |
| Avg handle time | `1:27` (mono) | -6% (inverted: negative is GOOD) | "faster than baseline" | no |

#### Section C — Three-column row (1.4fr 1fr 1fr, gap 16)

**Card 1 — "Call volume · last 24 hours"**

- Card head: title + meta `"N calls"` on the right
- Body: 24 vertical bars (`flex: 1` each, 3px gap, bg `--accent-soft-2`, min-height 4px, current hour bar `--accent`). Heights scale to max hour count, container height 70px.
- X-axis labels below (`9px mono --text-4`, every 4 hours)
- Footer row: `Peak <b>NN:00</b>` and `Last hour <b>N</b>` (12px `--text-3` with bold values `--text-1`)

**Card 2 — "Outcomes mix · 14d"**

- Card head: title + ghost button "View all →" → `/calls`
- Body: 6 disposition rows (gap 12), each:
  - 3-column grid `[80px 1fr 60px]`, align-items: center
  - Label (`12px/500 --text-1`)
  - Horizontal bar: 8px tall, bg `--surface-3`, radius 4, with a colored fill scaled to %. Colors per disposition (see Tokens below)
  - Count + percent: `12 · 18%` (12px mono `--text-2` right-aligned)
- Order: BOOKED, CB, VM, NQ, DNC, NO_ANSWER

**Card 3 — "Agent health"**

- Card head: title + green pill `"All systems go"` (chip with green dot)
- 6 rows, each 3-column grid `[1fr auto auto]`:
  - Label (13px `--text-2`)
  - Value (13px / 600 / mono / tabular `--text-1`)
  - Target indicator: small green/yellow dot + target text (`"≥ 38%"`, `"< 600 ms"`, etc.) `11px mono --text-3`, `white-space: nowrap`

Rows: Connect rate · Booking rate · Avg latency TTFB · Voicemail drops · DNC requests 7d · Cost / appointment

#### Section D — Bottom row (grid 2fr 1fr, gap 16)

**Card — "Recent activity"** (left, takes 2/3 width):
- Card head: title with Activity icon + ghost button "Open call logs →"
- 7 rows, each:
  - 3-col grid `[36px 1fr auto]`, gap 12, padding `12px 18px`, bottom border `1px --line-soft`
  - 36×36 disposition icon (rounded 8, bg = disposition-soft, color = disposition strong)
  - Name (13px/500 `--text-1`) + summary excerpt (110 char max, 11.5px `--text-3`)
  - Right: disposition label (12px/600 `--text-1`) + "duration · time ago" (11px mono `--text-3`)
- Click → opens `CallDetailDrawer`

**Card — "Needs review"** (right, 1/3 width):
- 3 items, each:
  - Kind pill (uppercase 10px/700/0.08em, bg `--warn-soft`, color `--warn`, padding `2px 7px`)
  - Title (13px/600 `--text-1`)
  - Detail (12px `--text-3`, line-height 1.5)
  - CTA button (xs, secondary)

---

### 3. Live Calls Screen — `/live`

**File: `src/app/(dashboard)/live/page.tsx`** (Client Component, needs WebSocket or polling)

This is the only fully-client screen. It mounts a connection to VAPI's real-time events (or polls `/api/calls/live` if WS isn't wired yet) and updates an in-memory list of active sessions.

#### Page head

- Eyebrow `"OPERATIONS · LIVE"`, H1 `"Live Calls"`, sub `"N in progress · 17 queued for the next 12 minutes"`
- Right side actions row:
  - Segmented pill control: `All (3) / In progress / Ringing / Queued` (see Tokens — `.pills` + `.pill.active`)
  - Outlined button `Refresh` (with refresh icon)
  - Danger button `Pause campaign` (with phone-off icon, color `--neg`)

#### Live grid (`grid: 380px 1fr / auto; gap: 16; height: 100vh - 56 - 120; min-height: 600px`)

**Left pane — Active sessions list** (card, full-height flex column):
- Head: "Active sessions" title + meta "Auto-refresh · streaming over WebSocket"
- Scrollable item list:
  - Each item: padding `12px 18px`, bottom border `1px --line-soft`, cursor pointer
  - Active state: bg `--accent-soft`, left border `3px --accent`, padding-left adjusts so total width matches
  - Header row: name (13px/600 `--text-1`) + phone (`11px mono --text-3, nowrap`) on the left; status badge (`ON CALL` green / `RINGING` orange) + duration (mono, only when in progress) on the right
  - Body row: `<b>Intent</b> · {intent}` (11.5px `--text-3`)
  - Live partial bubble: italic blue text on `--accent-soft` bg, radius 8, padding `6px 10px`, line-height 1.4 — e.g. `"…that's why your January numbers look lower than December. Would you like to book a free panel inspection?"`

- Below in-progress items, the same list shows **queued** items (opacity 0.85, status pill `QUEUED` text-3, `in 1:48` mono)

**Right pane — Selected call detail** (`grid-template-rows: auto auto 1fr auto`):

1. **Header** (`live-d-hd`, padding `18px 22px 16px`, bottom border):
   - Left: H3 name + status chip; line below has phone, dot separator, `"Outbound · {assistantId}"`
   - Right action buttons (gap 8): `Mic` (toggles on/off), `Listen in` (volume), `Whisper` (headphones), `Take over` (arrows-LR), `End` (danger phone-off)

2. **Meta strip** (`live-d-meta`, padding `14px 22px`, bottom border, bg `--surface-2`, `grid: repeat(5, 1fr); gap: 16`):
   - Each cell: label (10px/600/0.1em uppercase `--text-3`) over value (14px/600 `--text-1` `tabular-nums`, mono for numbers)
   - Cells: Elapsed (mono `M:SS`) · Sentiment (`62%` + 5px gradient bar red→amber→green) · Intent (sans 13px) · Cost so far (mono `$0.443`) · Latency TTFB (mono `412 ms`)

3. **Transcript scroller** (overflow auto, padding 22, gap 14, bg `--surface-2`):
   - Each message: `max-width 80%`, flex with 24×24 round avatar
   - Assistant: avatar bg `--accent` text white; bubble bg `--accent` color white, top-left radius 4, padding `10px 14px`, 13px, line-height 1.5
   - User: row-reverse, avatar bg `--surface-3` color `--text-2` border `1px --line`; bubble bg `--surface` border `1px --line`, top-right radius 4
   - Timestamps below bubble: 10px mono `--text-4`
   - At the bottom, a partial-listening indicator: dashed border `--accent-soft-2`, bg `--accent-soft`, animated pulse dot + italic transcript fragment

4. **Footer** (`live-d-foot`, top border, padding `14px 22px`):
   - Left: two audio meters (caller + agent) — 5-bar SVG with `meter` keyframe animation, plus labels
   - Right: `Recording ● Encrypted · {call.id}` (11px `--text-3`, recording dot in `--pos`)

#### Mock streaming behavior

The prototype `setInterval(() => setTick(t+1), 1000)` and reveals transcript messages every 14 seconds. **In production:** subscribe to VAPI's call events for the selected call, append `assistant-message`, `user-message`, `partial-transcript` events to local state.

---

### 4. Call Logs Screen — `/calls`

**File: `src/app/(dashboard)/calls/page.tsx`** (Server Component) + `src/components/CallsTable.tsx` (Client, restyled).

#### Page head

- Eyebrow / H1 / sub
- Right actions: outlined `Last 14 days ▾` (calendar icon, chevron-down) and `Export CSV` (download icon)

#### Filter bar (`display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px`)

1. Search input (320px max, flex 1) — name/number/summary
2. Disposition pills group (segmented, see Tokens). One pill per disposition + an `All` pill at the start. Each pill shows label + count badge.
3. "Booked only" toggle pill (left margin auto, green when active)
4. `More filters` ghost button on the right

#### Table (`.card.card-flush` containing `.table`)

- Header row: bg `--surface-2`, cells `text-transform: uppercase; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; color: --text-3; padding: 10px 14px`
- Sortable headers show ascending/descending arrow next to label; click to toggle direction (default desc, switching column resets to desc)
- Body row: cells padding `10px 14px`, bottom border `1px --line-soft`, height `--row-h = 40px`, cursor pointer, hover bg `--surface-2`

Columns:

| Column | Cell content |
|---|---|
| Customer | 28px round avatar (initials) + name (500) over phone (11px mono `--text-3`). `min-width 0`, `white-space: nowrap` on both lines |
| Disposition | `<DispositionChip />` (see Tokens) |
| Date | Two lines: `MMM d` (12.5px `--text-1`) over `h:mm a` (11px mono `--text-3`) |
| Duration | `M:SS` mono 12.5px |
| Outcome | Booked → green pill with calendar icon; CB → blue "Retry scheduled" with refresh icon; else em-dash `--text-4` |
| Assistant | 16×16 mono assistant avatar bg `--accent-soft` color `--accent-deep` + name (11px) |
| Cost | Right-aligned mono `$0.xxx` |
| (action) | Chevron-right icon button (stops propagation, also opens drawer) |

Footer:
- Showing N of M calls
- Pagination: ← Previous · `1 / N` · Next →

#### Row click → CallDetailDrawer (component below)

---

### 5. Call Detail Drawer

**Component: `src/components/CallDetailDrawer.tsx`** (Client)

Replaces the existing `CallModal.tsx`. Continue using shadcn's `Sheet` primitive — the visual layout below maps to `SheetContent`.

#### Layout

- Width: `720px`, max-width `92vw`, slides from right with `translateX(40px) → 0` opacity 0→1, 200ms
- Mask: `rgba(10,30,50,0.4)` with `backdrop-filter: blur(2px)`, 160ms fade
- Grid: `auto 1fr`

#### Header (`drawer-head`, padding `20px 24px 16px`, bottom border)

- H2: customer name (Poppins 600 / 18px / -0.01em), inline with disposition chip(s) — if `appointment_booked` and disposition isn't already `BOOKED`, show a second `Booked` chip
- Meta row (12px `--text-3`, gap 14, flex-wrap): each item with a 12px icon prefix
  - Phone (mono)
  - Date (locale `"medium short"` format)
  - Duration (mono)
  - Assistant
  - VAPI cost (mono `$0.xxxx`)
- Close button (icon-btn) on the right

#### Body — five sections, each prefixed by a `section-h` label

1. **AI Summary**
   - Section label: sparkle icon + `"AI Summary"`
   - Card: bg `--accent-soft`, border `1px --accent-soft-2`, left border `3px --accent`, radius `--radius-md`, padding `14px 18px`, 13px / 1.6 line-height

2. **Recording**
   - Section: headphones icon + `"Recording"`
   - Recorder bar: bg `--surface-2`, border, radius, padding `12px 16px`, flex row gap 14:
     - 40px round play button bg `--accent` color white
     - Waveform: 64 bars in an SVG (deterministic pseudo-random heights). Bars before playhead = `--accent`, after = `--line-strong`. Progress updated by an interval while playing.
     - Time `M:SS / M:SS` mono `--text-2`
     - Icon button for Download

3. **Structured Data**
   - Section: tag icon + `"Structured Data"`
   - Card: bg `--surface-2`, border, radius, padding `14px 18px`. 2-col grid 12px / 24px gap of K/V items:
     - Label (10px/600/0.08em uppercase `--text-3`)
     - Value (13px mono tabular `--text-1`, switch to sans for non-numeric values)
   - Fields: Disposition, Appointment, Success eval, Ended reason, Call ID, Assistant

4. **Transcript**
   - Section: filetext icon + `"Transcript"` + right-aligned `"N messages"` (11px `--text-3`)
   - Container: bg `--surface-2`, border, radius, `max-height: 360px; overflow: auto`
   - Each line: 2-col grid `[60px 1fr]`, gap 14, padding `12px 16px`, bottom border `1px --line-soft`
     - Left: role pill (10px/600/0.08em uppercase, `--accent` for Agent, `--text-3` for Caller) + timestamp `M:SS` below in `10px mono --text-4`
     - Right: message text (13px / 1.55)
   - If `messages.length === 0`: render an italic "No transcript — call did not connect." line

5. **Cost Breakdown**
   - Section: dollar icon + `"Cost Breakdown"`
   - Card: bg `--surface-2`, border, radius, padding `14px 18px`
   - Top row: label `"VAPI cost"` + total `$x.xxxx` (mono 16px / 700)
   - Stack bar (18px tall, radius 999, overflow hidden, bg `--surface-3`, 1px border), with 4 segments:
     - STT — `--blue-400`
     - LLM — `--blue-600`
     - TTS — `--blue-700`
     - Telephony — `--blue-200`
   - Legend below with 8px square swatch + label + bold cost

6. **Notes**
   - Section: message-square icon + `"Notes"`
   - Textarea (full width, border, radius, padding `12px 14px`, 13px, min-height 80, resize vertical, focus → `--accent` border + focus shadow)
   - Right-aligned actions: `Reassign` (ghost) + `Save note` primary (with check-circle icon). The save POSTs to `/api/notes`.

---

### 6. Analytics & Costs — `/analytics`

**File: `src/app/(dashboard)/analytics/page.tsx`**. Replaces `/pricing`.

#### Page head

- Eyebrow / H1 `"Analytics & Costs"` / sub
- Right actions: `Last 14 days ▾` and `Export`

#### KPI row (5 cards, `grid-template-columns: repeat(5, 1fr); gap: 16`)

| Label | Value | Delta | Sub | Featured |
|---|---|---|---|---|
| Booked appointments | Count | +18% | "vs prior 14d" | yes |
| Connect rate | `55.4%` | +2.4% | "N of M" | |
| Cost / booking | `$1.57` | -9% (inverse) | "efficient" | |
| Total VAPI cost | `$53.38` | +11% (inverse) | "avg $0.290/call" | |
| Gross margin | `91%` | +3% | "+$521 vs cost" | |

#### Trend chart card

- Head: title `"Daily volume · last 14 days"` + segmented pills `Calls / Bookings / Cost`
- Body: 220px tall line+area chart. Built with Recharts (`LineChart`, `Line type="monotone" stroke="var(--accent)" strokeWidth={2}`, gradient area underneath, 4 horizontal grid lines `dasharray 3 3 var(--line-soft)`, x-axis labels every ~7 days)
- 2.5px points; on hover show tooltip with formatted value

#### Two-up row (`grid: 1fr 1fr; gap: 16`)

**Card — "Outcome mix"** (donut)
- Head: title + meta `"N calls"`
- Body: 2-column `[auto 1fr] gap 24`. Left: 180×180 donut (22px thickness) with center overlay (`"BOOKED"` eyebrow + big count + `"X%"` sub). Right: legend rows with colored squares + label + count + percent.

Disposition colors are the same set used by the chip system (see Tokens).

**Card — "VAPI cost composition"**
- Head: title + total
- Stack bar 24px tall same as the drawer's cost bar, but at aggregate level
- Below: 2×2 grid of legend entries (swatch + label + bold mono total)
- Footer: 3 mini-stats divider above — VAPI cost / Calc revenue / Margin (with green color for positive)

#### Pricing Calculator card

- Head: title + meta `"$0.50 per 15-second block · rounded up"`
- Body: a horizontal "calc row" with arrows between steps:
  - Input (numeric, mono, padded box) for seconds
  - Chevron arrow
  - "Blocks" step: `N × 15s`
  - Chevron arrow
  - "Duration billed" step: `M:SS`
  - Right-aligned big "Revenue" output: Poppins 600 / 22px / `--pos`
- Below the row: explanation in 11px mono `--text-3`: `"72s ÷ 15s = 4.80 → ceil = 5 blocks × $0.50 = $2.50"`

Logic comes from `src/lib/pricing.ts` (unchanged).

#### Disposition breakdown table

`.dz-table` — 6 cols: Disposition / Calls / Duration / VAPI cost / Revenue / Margin. Numbers right-aligned, mono, tabular. Total row at the bottom in bold with a 2px top border `--line-strong`.

#### Hourly heatmap

- Head: title + meta `"Calls by hour & day"`
- Body: grid `[32px repeat(24, 1fr)] gap 2`. 7 rows for Mon–Sun.
- First column: day labels (9px mono `--text-4`)
- Cells: 14px tall, radius 2, bg interpolates from `--surface-3` (low) to `--accent` (high) via `color-mix(in oklch, var(--accent) Np%, var(--surface-3))`
- Bottom legend: `Fewer ▢▢▢▢▢ More`

---

## Interactions & Behavior

| Action | Behavior |
|---|---|
| Click row in Call Logs | Open `CallDetailDrawer` for that call. ESC or backdrop click closes. |
| Click row in Recent Activity (Overview) | Same — opens drawer |
| Click row in Active Sessions (Live) | Selects that call, right pane updates |
| Click `Monitor live` hero button | Navigate to `/live` |
| Click `View all →` on Outcomes Mix | Navigate to `/calls` |
| Click live ticker pill | Navigate to `/live` |
| Disposition filter pill click | Set filter, table re-filters |
| Booked-only toggle | Filters table |
| Column header click | Toggle sort; first click on a new column = descending |
| Pause campaign button | Confirmation modal (not designed) → POST to a control endpoint |
| Mic / Listen in / Whisper / Take over / End | These need real VAPI integration. Stub with toasts in v1 if backend isn't ready. |
| Save note | POST `/api/notes` `{ callId, note }` |
| Export CSV | Same logic as the existing CallsTable export |

### Animations

- **Drawer entrance:** mask fade 160ms, content `translateX(40px) → 0` + opacity 0→1, 200ms ease-out
- **Live pulse:** 1.6s `ease-in-out` infinite — box-shadow halo grows from `0 0 0 4px rgba(22,163,74,0.18)` to `0 0 0 6px rgba(22,163,74,0.05)` and back
- **Audio meter:** 5 bars, each scales Y from 0.5 to 1 over 0.8s ease-in-out infinite, staggered by `0s 0.1s 0.2s 0.05s 0.15s`
- **Ringing pulse:** opacity 0.3 ↔ 1 over 1.0s
- **Sort change / filter:** no transition needed; just re-render
- **Hover transitions:** all `0.12s` ease on button colors/borders/bg

---

## State Management

- **Overview**: Server Component fetches calls. No interactive state besides `openCall`.
- **Live**: Client. State = `liveCalls: VapiCall[]` (subscribed), `selectedId: string`, `muted: bool`, `elapsedTick: number`. Use a `useEffect` interval + WebSocket subscription.
- **Call Logs**: Server fetches initial set; Client handles `search: string`, `dispFilter: string`, `bookedOnly: bool`, `sortBy: { k, desc }`. Use TanStack Table.
- **Drawer**: lifted state in the parent (Overview / Logs). `openCall: VapiCall | null`. Optionally use URL param `?call=<id>` so drawer is shareable.
- **Analytics**: Server fetch initial; Client charts re-render purely from props. Calculator local state `seconds: number`.

---

## Design Tokens

All tokens live in `design/colors_and_type.css` (copied into this handoff). The key application-layer additions (in `design/styles.css`) are:

### Colors

| Token | Value | Use |
|---|---|---|
| `--brand-main` | `#333333` | Primary text (in light mode `--text-1` extends this) |
| `--brand-aux-2` / `--accent` | `#0079c1` | Buttons, links, active nav, accent fills |
| `--accent-strong` | `#00629c` | Primary button hover |
| `--accent-deep` | `#0a4a73` | Avatars, hero text, deep blue bands |
| `--accent-soft` | `#e6f2fa` | Active nav bg, summary card bg, light highlights |
| `--accent-soft-2` | `#cce5f5` | Borders on accent-soft cards, sparkline area |
| `--text-1` `--text-2` `--text-3` `--text-4` | `#1a2530 / #525252 / #737373 / #a3a3a3` | Type scale |
| `--surface` `--surface-2` `--surface-3` | `#fff / #fcfcfc / #f5f5f5` | Layers |
| `--line` `--line-strong` `--line-soft` | `#e8e8e8 / #d1d1d1 / #f0f0f0` | Borders |
| `--pos` `--pos-soft` | `#16a34a / #e8f5ec` | Positive (BOOKED, deltas up) |
| `--warn` `--warn-soft` | `#d97706 / #fcf0e2` | Voicemail, warnings |
| `--neg` `--neg-soft` | `#dc2626 / #fbe9e9` | DNC, errors |

**Disposition mapping:**
- `BOOKED` → `--pos-soft` / `--pos` (green)
- `CB` → `--accent-soft` / `--accent` (blue)
- `VM` → `--warn-soft` / `--warn` (amber)
- `DNC` → `--neg-soft` / `--neg` (red)
- `NQ` → `#f1f1f4` / `#5e6a78` (slate)
- `NO_ANSWER` → `--surface-3` / `--text-3` (neutral)

### Type scale (Poppins everywhere)

- Display: Poppins 600 / -0.02em for big numbers and headings
- Sans: Poppins 400 body / 500 UI labels / 600 emphasis
- Mono: ui-monospace stack for all numeric values (phone, time, currency, IDs)

### Spacing

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 96`. Card padding 20 (compact 16). Table row 40 (compact 34). Section gaps 16.

### Radii

`xs 4 · sm 6 · md 10 · lg 16 · xl 24 · pill 999`. Cards `md`. Buttons `sm`. Bars / chips `pill`.

### Shadows (blue-tinted, low)

```
--shadow-xs: 0 1px 2px rgba(10,74,115,0.04);
--shadow-sm: 0 2px 4px rgba(10,74,115,0.06), 0 1px 2px rgba(10,74,115,0.04);
--shadow-md: 0 4px 12px rgba(10,74,115,0.08), 0 2px 4px rgba(10,74,115,0.04);
--shadow-lg: 0 12px 32px rgba(10,74,115,0.10), 0 4px 8px rgba(10,74,115,0.06);
--shadow-xl: 0 24px 56px rgba(10,74,115,0.14);
--shadow-focus: 0 0 0 3px rgba(0,121,193,0.25);
```

The brand is fundamentally flat — most cards use a border, not a shadow. Drawers and popovers get `--shadow-xl`.

---

## Assets

Logos and icons from the Gadi.ai design system, included in this bundle:

- `design/assets/icon-dots-blue.svg` — primary mark (sidebar)
- `design/assets/icon-dots-white.svg` — for dark/navy bands (hero)
- `design/assets/logo-lockup-dark.svg` — for light surfaces
- `design/assets/logo-lockup-white.svg` — for dark surfaces

**Functional UI icons** are Lucide-style line icons inlined as React components in `design/components/icons.jsx`. The production app should use **`lucide-react`** (already in `package.json` as `lucide-react@^1.16.0`). The icon names map 1:1 with Lucide names: `LayoutDashboard`, `Phone`, `Radio`, `List`, `Activity`, `Wallet`, `Users`, `Bot`, `Settings`, `Search`, `Bell`, `Calendar`, `ChevronDown`, etc.

The brandbook says **no emoji** — remove the `☀️` from the current sidebar entirely.

---

## Mock Data

`design/data.js` generates 184 deterministic VapiCall-shaped records and 3 live calls. **Do not ship this file** — the real app reads from VAPI via `src/lib/vapi.ts`. The mock data is useful as a fixture for Storybook / Jest snapshots; the shape exactly matches the existing `VapiCall` interface.

---

## Files in this handoff bundle

| Path | What it is |
|---|---|
| `README.md` | This document |
| `prototypes/VAPI Console.html` | Interactive prototype — open in a browser to explore all 5 screens |
| `prototypes/design/styles.css` | All application styles; tokens and component classes. Port these to the production app's `globals.css` and Tailwind config. |
| `prototypes/design/colors_and_type.css` | Gadi.ai base design tokens. Drop verbatim into `globals.css`. |
| `prototypes/design/components/*.jsx` | React components for sidebar, topbar, atoms (KPI/chip/charts), call-drawer |
| `prototypes/design/screens/*.jsx` | One file per screen — read these for exact JSX structure / data wiring |
| `prototypes/design/app.jsx` | Shell + screen routing |
| `prototypes/design/data.js` | Mock VAPI data (reference only) |
| `prototypes/design/assets/*` | Logos + dot icon |

---

## Implementation order (suggested)

1. **Tokens & Tailwind setup** — paste `colors_and_type.css` + the new `:root` block from `styles.css` into `globals.css`. Add Poppins via `next/font`. Add Tailwind extension for the colors (CSS vars work directly with `bg-[var(--accent)]`).
2. **App shell** (`layout.tsx`) — new sidebar + topbar. Wire org switcher to a stub.
3. **Atoms** — port `KPI`, `DispositionChip`, `Sparkline`, `LineChart` wrapper around Recharts, `Donut` wrapper.
4. **CallDetailDrawer** — replace `CallModal`. Reuse `Sheet` from shadcn.
5. **Call Logs page** — wraps existing TanStack Table with new visual tokens. Drop the existing `StatsCards`.
6. **Overview page** — new hero, KPI row, three-up row, recent activity. Server Component reads calls 14d.
7. **Analytics page** — port the existing `/pricing` content here, add the line chart and heatmap.
8. **Live page** — wire mock data first; integrate VAPI WebSocket events second.
9. Delete the old `/dashboard` and `/pricing` routes (or redirect them).

---

## Known caveats from the prototype

- The "Hero" font referenced in the brandbook for the `.ai` mark is **not shipped**; the prototype uses Poppins 400 as a stand-in. Match this until a real Hero font is available.
- Semantic status colors (`success / warning / danger`) are **derived**, not from the brandbook. Confirm with design before they ship to a customer-facing surface.
- Sparkline / line chart / donut are hand-built SVG in the prototype for portability. In the production app, **prefer Recharts** (already a dependency).
- The Tweaks panel is for design exploration only — drop it in production.
