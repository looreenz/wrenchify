---
name: Beta Industrial
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#e2bfb0'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#a98a7d'
  outline-variant: '#5a4136'
  surface-tint: '#ffb693'
  primary: '#ffb693'
  on-primary: '#561f00'
  primary-container: '#ff6b00'
  on-primary-container: '#572000'
  inverse-primary: '#a04100'
  secondary: '#b9c7e0'
  on-secondary: '#233144'
  secondary-container: '#3c4a5e'
  on-secondary-container: '#abb9d2'
  tertiary: '#c3c7cb'
  on-tertiary: '#2c3134'
  tertiary-container: '#959a9e'
  on-tertiary-container: '#2d3235'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb693'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7a3000'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#dfe3e7'
  tertiary-fixed-dim: '#c3c7cb'
  on-tertiary-fixed: '#171c1f'
  on-tertiary-fixed-variant: '#43474b'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
  beta-orange: '#FF6B00'
  charcoal-black: '#0F172A'
  slate-gray: '#334155'
  hazard-yellow: '#FDE047'
typography:
  display-lg:
    fontFamily: IBM Plex Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  touch-target: 52px
---

## Brand & Style

The design system is built for the high-intensity, physical environment of workshops and industrial settings. The brand personality is **utilitarian, mechanical, and uncompromising**, drawing inspiration from professional toolsets and heavy-duty machinery. 

The visual style is **Industrial Brutalism mixed with Modern Precision**. It utilizes heavy borders, high-contrast signals, and a "built-to-last" aesthetic. The interface prioritizes rapid recognition and durability, ensuring that information is legible even in suboptimal lighting or high-glare environments. The emotional response should be one of extreme reliability and functional power—turning the software into a digital extension of the user's physical tools.

## Colors

This palette is engineered for high visibility and professional impact, moving to a **Dark Mode default** to reduce eye strain in workshop bays and mimic industrial equipment interfaces.

- **Primary (Beta Orange):** A vibrant, high-energy orange (#FF6B00) used for primary actions, critical path indicators, and brand presence.
- **Surface (Charcoal & Slate):** The base environment is built on Deep Charcoal (#0F172A) for backgrounds and Slate (#334155) for containers, creating a rugged, mechanical depth.
- **On-Surface:** Neutral whites and high-brightness grays are used for maximum text contrast against the dark background.
- **Semantic Colors:**
    - **Success:** Bright Emerald for "Go/Safe" states.
    - **Warning:** Hazard Yellow for "Caution/Pending" states.
    - **Error:** Industrial Red for "Stop/Critical" alerts.

## Typography

The system utilizes **IBM Plex Sans** for its engineered, technical feel and superior legibility. Its "humanist-meets-geometric" construction ensures it remains readable under heavy use.

For all technical specifications, measurements, and numerical data, **JetBrains Mono** is mandatory. The monospaced nature prevents "jumping" numbers in live data feeds and provides a clear distinction between descriptive text and technical data. All labels in the system are set in uppercase monospaced type to evoke the feeling of stamped metal or industrial plates.

## Layout & Spacing

The layout follows a **Rigid Grid** philosophy. Content is organized into modular blocks that suggest mechanical assembly.

- **Grid:** A 12-column system with substantial 24px gutters to ensure clear separation of data modules.
- **Rhythm:** A strict 8px square grid. All components, from buttons to card heights, must snap to this increment.
- **Margins:** Generous outer margins (40px on desktop) provide a "safe zone" for the UI, preventing the interface from feeling cluttered.
- **Touch Strategy:** Touch targets are increased to 52px to accommodate users with gloves or those using wall-mounted touchscreens.

## Elevation & Depth

In this industrial aesthetic, depth is created through **Structural Layering** and **Bold Outlines** rather than soft shadows.

- **Tiers:** Use background color steps (#0F172A to #1E293B) to show hierarchy.
- **Borders:** Every container should have a visible 1px or 2px border using Slate-700. This reinforces the "constructed" feel of the UI.
- **Active Elevation:** Instead of a shadow, an active or "lifted" element is indicated by a 2px stroke of the Primary Orange or a high-contrast inner glow.
- **Glass:** Limited use of backdrop blurs is permitted only for diagnostic overlays, using a dark, low-transparency tint to keep focus on the technical data underneath.

## Shapes

The shape language is **Soft (0.25rem)**, leaning toward a "milled" look. 

- **Primary Components:** Buttons and input fields use a consistent 4px radius. This provides just enough softness to be modern while maintaining a heavy, structural appearance.
- **Containers:** Large dashboard modules or cards use the 8px (0.5rem) radius to define major work zones.
- **Prohibited:** Circular or pill-shaped buttons are avoided as they contradict the rigid, industrial narrative. The only exception is for "Status Indicators" which may be fully rounded to act as "lamps."

## Components

### Buttons
- **Primary:** High-contrast Beta Orange with Black text. Bold weight.
- **Secondary:** Deep Slate background with White text and a 1px border.
- **Hazard Action:** For irreversible actions, use a striped "hazard" pattern in the hover state.

### Input Fields
Inputs should look like physical ports. Use a dark background (#020617) with a 1px Slate border. On focus, the border thickens to 2px and changes to Beta Orange.

### Industrial Cards
Cards must have a clear "Header" section separated by a 1px horizontal rule. Use JetBrains Mono for the header title to signify "Technical Specification."

### Status Lamps
Instead of soft chips, use "Lamps"—small, high-saturation circles that appear to "glow" via a small, intense CSS box-shadow of the same color, placed next to the status text.

### Data Grids
Dense, high-contrast tables. Row hovers should use a high-visibility Slate-800 background. Vertical lines are encouraged between columns to facilitate scanning of technical specifications.