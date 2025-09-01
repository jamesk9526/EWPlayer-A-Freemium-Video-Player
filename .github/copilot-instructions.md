

* Global dark shell with logo, search, settings.
* Hero/banner with title + Play / More Info.
* Rows for Movies, TV Shows, Home Videos (cards w/ year).
* Series page with blurred backdrop + “Episodes” grid.
* Player page with a large video pane and a right “Up Next” rail.

# What we’re changing (target style)

* Add **rail-based home** (billboard + “Continue Watching” + editorial rows).
* **Card-first** design with unified sizing, progress bars, quick actions on hover/focus.
* **Details view** with tabs (About | Episodes | Extras | More Like This).
* **Player overlay**: big transport controls, next-up countdown, A/V & captions menu, skip-intro.
* **TV/keyboard** friendly focus rings + scroll-snap carousels.
* Clean **theming tokens** so everything feels cohesive.

---

# Component-by-component upgrade map

## 1) App shell & top nav

**Do**

* Add primary nav: **Home • TV • Movies • My List** (Kids optional). Keep Search on the right, Profile menu next to it.
* Make the header **translucent** and turn solid after scroll (`backdrop-blur` + gradient).

**Key styles**

* `header` uses sticky + gradient: `sticky top-0 bg-gradient-to-b from-black/70 to-transparent`
* Focus rings for D-pad/keyboard: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400`.

---

## 2) Billboard / hero (home top)

**Do**

* Use the selected title’s **backdrop video** (muted, autoplay on focus) or image with a bottom gradient.
* Actions: **Play**, **More Info**, **Add to List**. Underline a short logline, show year + rating + runtime badges.

**Tech**

* Lazy mount the trailer after 600–800ms “settle” time to avoid CPU spikes.
* Preload next billboard artwork via `<link rel="preload" as="image">`.

---

## 3) Rows → virtualized, snap, accessible

**Do**

* Convert your rows to **horizontal carousels** with **scroll-snap** and/or arrows.
* First row is **Continue Watching** (with progress).
* Follow with **Trending, Because You Watched X, Recently Added**.

**Tech**

* Virtualize with `react-window` or your own visibility observer to keep FPS smooth when you reach 1000+ items.
* Each row gets an ARIA label: `role="region" aria-labelledby="row-heading-id"`.

---

## 4) Title cards (unify)

**Do**

* Single **aspect ratio** (e.g., 2:3 poster for TV/Movie, 16:9 for episodes).
* On **hover/focus**: slight scale, show quick actions (**▶ Play**, **ℹ More**, **＋ List**), show a tiny **progress bar**.
* Badges: `UHD/HDR/Atmos`, `NEW`, `4K`.

**Styles**

* Card: rounded-xl, shadow-md, `overflow-hidden`, gradient mask on bottom for title legibility.
* Progress: a 2–3px bar using `linear-gradient` or a simple div.

---

## 5) Details view (modal or page)

**Do**

* **Hero**: wide backdrop, title + Resume/Play + Add.
* **Metadata** (year • rating • runtime • audio/subs chips).
* **Tabs**: **About | Episodes | Extras | More Like This**.
* **Episodes**: season switcher (left) + episode grid/list (right) with per-episode progress and a “▶ Resume” on the current one.

---

## 6) Player page (biggest UX win)

**Do**

* **Overlay controls** that fade in/out: big Play/Pause, robust scrub bar with thumbnails, time elapsed/remaining.
* **Next Up**: 5–7s countdown in the lower-right; right rail collapses into an icon button.
* **Skip Intro** button when `hasIntro` flag is true.
* **A/V menu**: Audio track, Subtitles, Quality/Auto; **Playback speed**.
* Keyboard: `Space/P` toggle, `←/→` seek 10s, `↑/↓` volume, `F` fullscreen, `M` mute.

**Fix the right-rail overflow**

* Make the page a **12-col grid** with a fixed rail and overflow scroll:

  * parent: `grid grid-cols-12 gap-6`
  * video area: `col-span-9`
  * rail: `col-span-3 sticky top-16 max-h-[calc(100dvh-6rem)] overflow-y-auto`
    No absolute positioning on rail; give it `box-border p-3` so thumbnails never spill.

---

## 7) Search & filters

**Do**

* Instant results, grouped by **Titles**, **People**, **Genres**.
* Optional filters sheet: Year, Resolution, Audio, Unwatched.

---

## 8) Accessibility & performance

* **Focus rings** everywhere; no hidden traps.
* **Skeleton loaders** for rows.
* Use **srcset** & **LQIP** for posters; defer billboard video.
* Preload details on **focus** (not just click) for snappy modals.

---

# Design tokens (Tailwind-friendly)

```ts
// tailwind.config.js excerpt
theme: {
  extend: {
    colors: {
      surface: {
        900: '#0b0b0d', 800: '#141418', 700: '#1b1b21', 600: '#23232b'
      },
      brand: { DEFAULT: '#ff4d16' },
    },
    boxShadow: { card: '0 6px 20px rgba(0,0,0,.35)' },
    borderRadius: { xl: '14px', '2xl': '18px' },
    transitionTimingFunction: { pleasant: 'cubic-bezier(.2,.8,.2,1)' },
  }
}
```

---

# Reference React snippets (concise & correct)

## Row with scroll-snap + keyboard nav

```tsx
// components/Row.tsx
import { useRef } from 'react';

export default function Row({ title, items }: { title: string; items: any[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const scrollByCard = (dir: 1 | -1) => {
    const el = scroller.current!;
    const w = el.firstElementChild?.clientWidth ?? 280;
    el.scrollBy({ left: dir * (w + 16) * 5, behavior: 'smooth' });
  };

  return (
    <section className="my-8" aria-label={title}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id={`${title}-h`} className="text-xl font-semibold">{title}</h2>
        <div className="space-x-2">
          <button className="btn" onClick={() => scrollByCard(-1)} aria-label="Scroll left">‹</button>
          <button className="btn" onClick={() => scrollByCard(1)} aria-label="Scroll right">›</button>
        </div>
      </div>

      <div
        ref={scroller}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-1 pb-2"
        role="list"
      >
        {items.map((it) => (
          <article key={it.id} role="listitem" className="snap-start">
            <TitleCard item={it} />
          </article>
        ))}
      </div>
    </section>
  );
}
```

## Title card with quick actions + progress

```tsx
// components/TitleCard.tsx
import { useState } from 'react';

export default function TitleCard({ item }: { item: any }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="group relative w-[220px] shrink-0 rounded-xl bg-surface-700 shadow-card overflow-hidden"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      tabIndex={0}
    >
      <img src={item.poster} alt={item.name} className="h-[330px] w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/10 to-transparent">
        <p className="line-clamp-2 text-sm font-semibold">{item.name}</p>
        <p className="text-xs opacity-70">{item.year}</p>
      </div>

      {/* quick actions */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition duration-150 ease-pleasant group-hover:opacity-100">
        <div className="pointer-events-auto flex gap-2">
          <button className="rounded-full bg-white/95 px-4 py-2 text-black font-medium">▶ Play</button>
          <button className="rounded-full bg-surface-800/90 px-4 py-2">More Info</button>
          <button className="rounded-full bg-surface-800/90 px-4 py-2">＋</button>
        </div>
      </div>

      {/* progress */}
      {item.progressPct > 0 && (
        <div className="absolute left-0 right-0 bottom-0 h-1 bg-white/10">
          <div style={{ width: `${item.progressPct}%` }} className="h-full bg-brand" />
        </div>
      )}
    </div>
  );
}
```

## Player layout with sticky right rail

```tsx
// pages/watch/[id].tsx
export default function Watch({ video, upNext }: { video: any; upNext: any[] }) {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6 grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-9">
        <VideoPlayer src={video.src} thumbnails={video.thumbVtt} />
        <h1 className="mt-4 text-2xl font-semibold">{video.title}</h1>
        <p className="text-sm opacity-70">{video.meta}</p>
      </div>

      <aside className="hidden lg:block col-span-3 sticky top-16 max-h-[calc(100dvh-6rem)] overflow-y-auto">
        <h3 className="mb-3 text-lg font-semibold">Up Next</h3>
        <ul className="space-y-3">
          {upNext.map(v => (
            <li key={v.id} className="rounded-xl bg-surface-700 p-2 hover:bg-surface-600 transition">
              <div className="flex gap-3">
                <img src={v.thumb} alt="" className="h-16 w-28 object-cover rounded-md" />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium">{v.title}</p>
                  <p className="text-xs opacity-60">{v.meta}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
```

---

# Data model nudge (to power UX)

* `Title{ id, type, name, synopsis, year, rating, genres[], images{poster,backdrop}, badges{uhd,hdr,atmos} }`
* `Episode{ id, s, e, runtime, hasIntro, images{still}, progress{position,percent} }`
* `Progress{ titleId, position, percent, lastSeen }`
* `Profile{ id, name, maturityLevel, settings{captions, playbackSpeed} }`

---

# “Do this next” checklist (short sprint)

1. Create **design tokens** + Tailwind config (above).
2. Replace current rows with `Row + TitleCard` components; add **Continue Watching** row.
3. Implement **DetailsModal** with tabs & related rows.
4. Swap Player page to **grid + sticky rail**; add overlay controls & next-up countdown.
5. Add **Focus states & keyboard** handlers.
6. Add **skeletons** and **image LQIP**.
7. Wire `hasIntro` to show **Skip Intro**.

---

# Prompts you can paste into Copilot

### 1) Create Row + TitleCard

```
You are editing a React + Tailwind project.

Goal: Replace our existing content rows with a Netflix-like carousel and unified title card.

Create two components:
- components/Row.tsx: horizontal scroller with scroll-snap, left/right buttons that scroll by ~5 cards. Accessible region with aria-label from props.title.
- components/TitleCard.tsx: 220x330 poster card (rounded-xl, shadow), gradient footer with name/year, three quick actions shown on hover/focus (Play, More Info, Add), and an optional 2px progress bar at the bottom when props.item.progressPct > 0. Include keyboard focus ring and Enter to Play.

Constraints:
- No external carousel libs.
- Use Tailwind classes only.
- Keep components pure; actions come via onPlay/onMore/onAdd props.
- Provide minimal unit tests for utility helpers if any.
```

### 2) Details view with tabs

```
Add a DetailsModal component with:
- Hero area (backdrop image, title, Resume/Play/Add buttons).
- Metadata chips for year, rating, runtime, and available audio/subs.
- Tabs: About | Episodes | Extras | More Like This.
- Episodes tab: left Season selector, right Episode list with per-episode progress and "Resume" on the current episode.

Style: dark, rounded-2xl, max-w-5xl, responsive.
Hook: expose <DetailsModal open titleId onClose /> and fetch details on mount.
```

### 3) Player overlay + next-up + sticky rail

```
Refactor watch page to a 12-col grid:
- Video area col-span-9 (lg+), Up Next rail col-span-3 (sticky top-16, max-h calc(100dvh - 6rem), overflow-y-auto).
Overlay controls:
- Big centered Play/Pause toggle, bottom scrub bar with thumbnail preview (given VTT), time elapsed/remaining, volume, captions menu, settings (playback speed 0.5–2x).
- If video.hasIntro=true and currentTime within introWindow show "Skip Intro" button that seeks to item.introEnd.
- Next episode countdown: when remaining < 8s show a pill in bottom-right; hitting it loads next.

Keyboard:
Space/P pause, arrows ±10s seek, up/down volume, F fullscreen, M mute, C captions.

Keep styles with Tailwind. No external player lib changes.
```

### 4) Accessibility & skeletons

```
Add focus-visible outlines on all interactive elements with Tailwind.
Add skeleton loaders for rows and details modal using gray animated blocks.
Optimize images with width/height attributes and LQIP placeholders; fade real image in onload.
```

---

# Prompts you can paste into Claude Sonnet 4 (more verbose, step-wise)

### 1) Architecture & file plan

```
You are Claude Sonnet 4. Create a step-by-step plan to transform an existing React + Tailwind video library UI into a Netflix/Plex-style interface.

Deliver:
1) A file tree listing for new/changed files.
2) For each file, a bullet list of responsibilities and props/events.
3) Tailwind utility classes and CSS tokens to introduce (colors, radii, shadows).
4) A risks & mitigations section (performance with 1000+ items, keyboard focus traps, thumbnail VTT handling, autoplay constraints on Safari).

Assume components: AppShell, TopNav, Billboard, Row, TitleCard, DetailsModal, VideoPlayer, UpNextRail.
```

### 2) Implement the Row + TitleCard components

```
Write production-ready code for components/Row.tsx and components/TitleCard.tsx with:
- scroll-snap horizontal carousel, arrow buttons, and accessible roles/labels.
- Hover/focus animated quick actions and a progress bar.
- Prop-driven callbacks: onPlay(item), onMore(item), onAdd(item).
- Unit test stubs for key helpers (calculate scroll step).
Return complete TypeScript code blocks only.
```

### 3) Watch page refactor with sticky Up Next and overlay controls

```
Produce a new pages/watch/[id].tsx and components/PlayerOverlay.tsx:
- 12-col grid, sticky right rail, overflow-y-auto.
- Overlay controls including Skip Intro window and Next Up countdown.
- Keyboard controls and ARIA labels.
Keep code self-contained and Tailwind-only.
```

### 4) Details modal with tabs & episodes

```
Return a complete DetailsModal.tsx implementing About | Episodes | Extras | More Like This tabs, with a Season selector and an Episode list showing progress and a Resume action. Include responsive layout and motion animations. Keep to Tailwind.
```

---

# Extra polish (small but pro)

* **Row headers** show a subtle “View All” link on the right.
* **Context menu** on cards: “Play from beginning”, “More like this”, “Mark watched”.
* **Editorial hubs**: simple JSON config to pin curated rows on Home.
* **Analytics hooks**: impression/click events on TitleCard; completion / skip-intro metrics.

