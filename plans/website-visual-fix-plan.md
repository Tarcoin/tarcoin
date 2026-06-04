# Website Visual Rendering Fix Plan

## Root Cause

The TARCOIN website at `website/` is missing a critical **`postcss.config.js`** file. This file is required by Next.js 14 to configure the PostCSS pipeline that processes Tailwind CSS directives.

Without it, the following breakages occur:

## What's Broken (Cascade)

| Dependency | Effect |
|---|---|
| No `postcss.config.js` | Tailwind CSS plugin never runs |
| Tailwind not running → `@apply` in `globals.css` fails | Custom classes (`.card`, `.btn-primary`, `.glass`, `.stat-value`, `.input-cyber`, `.timeline-item`) have **zero styles** |
| Custom Tailwind colors (`tarcoin-black`, `tarcoin-gold`, etc.) not generated | All `bg-tarcoin-*`, `text-tarcoin-*`, `border-tarcoin-*` classes fail |
| Custom fonts (`Orbitron`, `Space Grotesk`, `JetBrains Mono`) not activated | `font-orbitron`, `font-space`, `font-mono` classes have no effect |
| Custom animations (`animate-float`, `animate-glow`, `animate-pulse-gold`) not generated | All scroll-triggered `motion.div` animations from framer-motion still work (JS-based) but Tailwind animation classes don't |
| `glow-gold`, `glow-gold-hover`, `text-glow`, `scanlines` utility classes fail | Gold glow effects and scanline overlays are missing |

## Fix Plan

### Step 1: Create `website/postcss.config.js`

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

This single file tells Next.js's build pipeline to:
1. Run the `tailwindcss` PostCSS plugin (processes `@tailwind` directives and `@apply` rules)
2. Run `autoprefixer` for cross-browser CSS compatibility

### Step 2: Verify the Fix

After adding the config:
1. Kill any running `next dev` server
2. Restart with `cd website && npm run dev`
3. Visit `http://localhost:3000/` and confirm:
   - Dark background (`bg-tarcoin-black`) renders
   - Gold accent colors appear on headings, buttons, borders
   - `Orbitron` font shows on headings and navigation
   - `glass` card effects (frosted glass with gold borders) render
   - `btn-primary` gold gradient buttons render
   - Cyber grid background pattern appears
   - Scanline overlay is visible
   - All section backgrounds and cards render properly

## Files That Depend on postcss.config.js

- [`website/app/globals.css`](website/app/globals.css) — 237 lines of Tailwind `@apply` directives
- [`website/app/layout.tsx`](website/app/layout.tsx) — uses `bg-tarcoin-black`, `font-space`, `text-white`, font variables
- [`website/app/page.tsx`](website/app/page.tsx) — uses `bg-tarcoin-black`, `scanlines`, `cyber-bg`
- All 11 components in [`website/components/`](website/components/) — every single one uses custom Tailwind classes extensively

## No Other Changes Needed

The codebase is well-structured. All the Tailwind classes, `@apply` directives, custom theme colors in [`tailwind.config.ts`](website/tailwind.config.ts), and component markup are correct. The only missing piece is the PostCSS configuration file.