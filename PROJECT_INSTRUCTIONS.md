# [CLIENT NAME] — Project Instructions for Claude

## ⚡ BASE TEMPLATE IS ALREADY SET UP
Do NOT re-install packages. Do NOT recreate the folder structure.
Do NOT touch globals.css reset or tailwind.config.ts color system.
The tech foundation is complete. Your job is design and content only.

## WHAT YOU NEED TO DO IN EACH SESSION:

### 1. SET THE BRAND (do this first, everything else follows)
In globals.css, fill in the CSS variables:
--color-primary: [HEX]
--color-secondary: [HEX]
--color-accent: [HEX]
--color-background: [HEX]
--color-text: [HEX]
--color-muted: [HEX]

In layout.tsx, import the chosen Google Fonts and assign:
--font-display: '[Display Font]'
--font-body: '[Body Font]'

### 2. BUILD SECTIONS
Create one file per scroll section in /components/sections/
Name them: 01_Hero.tsx, 02_Services.tsx, 03_About.tsx etc.
Stack them in app/page.tsx in order.

### 3. ANIMATION RULES (follow every time)
- All sections: fade + slide up on viewport entry (Framer Motion useInView)
- Stagger children: 0.1s delay between items
- Hero elements: staggered reveal on mount (0.2s between each)
- Hover states: subtle scale(1.02) or color shift — never both
- Page load: no splash screen unless client brief specifically requests it

### 4. MOBILE RULES (non-negotiable)
- Test every section at 375px width
- No horizontal overflow anywhere
- Touch targets minimum 44px height
- Font sizes: never below 14px on mobile

### 5. THE FOOTER STAMP
The "Architected & Engineered by Fayed Intelligence" line in Footer.tsx
must remain on every project. Do not remove or hide it.

### 6. .env.local
Fill in all NEXT_PUBLIC_ variables with real client data before building.
These populate throughout the site automatically.

## MOTION LIBRARY
Use variants from `lib/animations.ts` for all animations.
Use `<WordReveal>` for all hero headlines.
Use `<CounterNumber>` for all stats.
Use `clipRevealVariant` for image reveals.
Lenis is already initialized — do not add any other scroll library.

## CLIENT BRIEF
[PASTE CLIENT DETAILS HERE BEFORE STARTING]
- Business name:
- Niche:
- Colors:
- Fonts:
- Sections needed:
- Tone (warm/professional/playful/luxury):
- Language (AR/EN/DE/bilingual):
- Special features (chatbot/booking/gallery/map):
