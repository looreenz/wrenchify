---
name: Precision Workshop
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#5a4136'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#8e7164'
  outline-variant: '#e2bfb0'
  surface-tint: '#a04100'
  primary: '#a04100'
  on-primary: '#ffffff'
  primary-container: '#ff6b00'
  on-primary-container: '#572000'
  inverse-primary: '#ffb693'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fd'
  on-secondary-container: '#57657b'
  tertiary: '#505f76'
  on-tertiary: '#ffffff'
  tertiary-container: '#8a9ab2'
  on-tertiary-container: '#223246'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb693'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7a3000'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  surface-studio: '#FFFFFF'
  surface-muted: '#F1F5F9'
  surface-border: '#E2E8F0'
  hazard-yellow: '#FDE047'
  industrial-red: '#EF4444'
  success-emerald: '#10B981'
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
  headline-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
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

This design system reimagines industrial ruggedness through the lens of modern professionalism. It transitions from a heavy, dark aesthetic to a **Modern / Corporate** light theme that emphasizes clarity, efficiency, and high-precision management. The brand personality is **methodical, transparent, and authoritative**, moving away from "industrial grit" toward "technical excellence."

The visual style is **Minimalist Precision**. It utilizes expansive white space, a refined light-grey surface hierarchy, and razor-sharp typography. The emotional response is one of organized control—transforming a chaotic workshop environment into a streamlined, data-driven operation. The signature orange is retained as a high-visibility tactical accent, now popping against a crisp, professional backdrop rather than a dark void.

## Colors

The palette is engineered for high-contrast legibility in well-lit environments, prioritizing a clean "Studio" look.

- **Primary (Beta Orange):** #FF6B00. Reserved for critical actions, active states, and brand signatures. It serves as a visual "anchor" in the light environment.
- **Surface Hierarchy:** 
    - **Base:** White (#FFFFFF) is the primary workspace background.
    - **Containers:** Light Grey (#F8FAFC) and Muted Slate (#F1F5F9) create logical grouping without the weight of dark backgrounds.
- **Typography & Ink:** Use Deep Slate (#0F172A) for primary text to maintain a high-contrast ratio that meets accessibility standards even in high-glare workshop settings.
- **Semantic Accents:** 
    - **Success:** Emerald green for completed tasks and safety clearances.
    - **Warning:** Hazard Yellow remains for cautionary status but uses dark text for contrast.
    - **Error:** Industrial Red for critical alerts and stop-commands.

## Typography

This design system utilizes **IBM Plex Sans** for all prose and UI navigation. Its technical, engineered curves provide a professional "blueprint" feel while maintaining excellent legibility.

For all technical specifications, numeric measurements, and inventory IDs, **JetBrains Mono** is required. The monospaced alignment ensures that columns of numbers remain perfectly vertically aligned, which is critical for scanning parts lists or diagnostic logs. 

**Labeling Convention:** All metadata labels should be set in uppercase JetBrains Mono at a bold weight to mimic industrial etched plates or stamped parts.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy to maintain a sense of structural integrity. 

- **Grid System:** A 12-column grid on desktop (max-width 1440px) with 24px gutters.
- **Rhythm:** Every component must adhere to a strict 8px spacing scale. Padding and margins should always be multiples of 8 (e.g., 8, 16, 24, 32, 48).
- **Mobile Adaptation:** On mobile devices, margins shrink to 16px. Content reflows into a single column, but the 8px rhythm is strictly maintained to preserve the "engineered" feel.
- **Touch Targets:** To support users in a physical workshop environment, all interactive elements maintain a minimum touch target of 52px.

## Elevation & Depth

In the light theme, hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines**.

- **Surface Tiering:** Use color to denote depth. The background is white, while interactive "wells" or sidebars use a light grey (#F1F5F9) fill.
- **Borders:** Instead of heavy shadows, use 1px solid borders (#E2E8F0) to define containers. This creates a "technical drawing" aesthetic.
- **Ambient Shadows:** Reserve shadows only for temporary overlays like modals or dropdowns. Use a very soft, highly diffused shadow (e.g., `0 10px 15px -3px rgba(0, 0, 0, 0.05)`) to keep the interface feeling light and airy.
- **Active State:** Focus states do not use shadows; instead, they use a 2px solid stroke of Beta Orange to indicate the active "port."

## Shapes

The shape language is **Soft (0.25rem)**, reflecting a "milled" or "machined" finish where sharp edges are slightly rounded for safety and ergonomics.

- **Core Components:** Buttons, inputs, and cards use a 4px (0.25rem) radius.
- **Decorative Elements:** Status lamps and notification pips are the only circular elements permitted, acting as "indicators" or "LEDs."
- **Pill Shapes:** Avoid pill-shaped buttons; they are too casual for this technical toolset. Stick to the refined 4px radius for all primary actions.

## Components

### Buttons
- **Primary:** Beta Orange (#FF6B00) background with White text. Bold weight.
- **Secondary:** White background with a 1px Slate-300 border and Slate-900 text.
- **Tertiary/Ghost:** No background, Slate-600 text, becomes underlined on hover.

### Input Fields
Inputs should look like clean data entry ports. Use a white background with a 1px border (#E2E8F0). On focus, the border changes to 2px Beta Orange. Use JetBrains Mono for the input text to ensure numeric clarity.

### Technical Cards
Cards feature a "Header" strip in #F8FAFC with a 1px bottom border. Titles in the header use JetBrains Mono. The card body is pure white.

### Data Grids
High-density tables with subtle horizontal rules (#F1F5F9). Row hovers use #F8FAFC. For numeric columns, ensure font-variant-numeric: tabular-nums is applied to JetBrains Mono.

### Industrial Status Indicators
"Lamps" are small circles (12px) with a solid semantic color. They do not use glow effects in the light theme; instead, they are paired with high-contrast uppercase labels for instant recognition.