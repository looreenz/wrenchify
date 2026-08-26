# Proposal: Beta Industrial Theme Implementation

## Intent

Implement the beta_industrial design system to transform wrenchify from a generic light-themed app into a high-contrast, industrial-brutalist interface optimized for auto repair shop environments. The design prioritizes rapid recognition in suboptimal lighting conditions and creates a "digital extension of physical tools" aesthetic.

**Why now**: The app has 15 views with hardcoded colors and no theme system. Adding features without a design system will increase technical debt. The beta_industrial theme provides a complete, well-specified design system (DESIGN.md) that can be implemented incrementally.

## Scope

### In Scope
- CSS variable-based design token system (colors, typography, spacing, elevation)
- Naive UI theme integration using `n-config-provider`
- Font loading: IBM Plex Sans + JetBrains Mono
- Custom industrial components: status lamps, industrial cards, hazard action buttons
- Migration of all 15 views + 1 layout to use design tokens
- Dark mode as default (per DESIGN.md specification)

### Out of Scope
- Theme switching UI (light/dark toggle)
- Additional themes (precision_workshop, etc.)
- Animation/transition system
- Responsive design improvements
- Accessibility audit (deferred to separate change)

## Technology Decision: CSS Pure (Variables + Naive UI Theme)

**Decision**: Use CSS custom properties + Naive UI's native theme system. **NOT Tailwind CSS.**

### Rationale

| Factor | Tailwind CSS | CSS Pure (Chosen) |
|--------|--------------|-------------------|
| Bundle size | +2-3MB (problematic for desktop) | 0KB additional |
| Naive UI integration | Conflicts with theme system | Native `n-config-provider` support |
| Project size (15 views) | Overkill | Right-sized |
| Custom components | Requires `@apply` or config | Direct CSS variable usage |
| Design token mapping | Indirect (config → utilities) | Direct (DESIGN.md → CSS vars) |
| Maintenance | Two styling systems | Single source of truth |

**Key reasons against Tailwind**:
1. Desktop app bundle size matters (Electron apps already 100MB+)
2. Naive UI's theming API is excellent and purpose-built for this use case
3. Adding Tailwind creates cognitive overhead (two systems vs one)
4. Custom industrial components (status lamps with glow effects) are easier with raw CSS
5. Project is small enough that utility-first speed gains are negligible

## Approach

### 1. Design Token Structure
```
src/renderer/styles/
├── tokens/
│   ├── colors.css      (surface, primary, semantic colors)
│   ├── typography.css  (font families, scales, weights)
│   ├── spacing.css     (8px grid system)
│   └── elevation.css   (borders, structural layering)
└── theme.css           (imports all tokens)
```

### 2. Naive UI Integration
- Create `src/renderer/theme/betaIndustrial.ts` with Naive UI theme overrides
- Wrap app in `n-config-provider` with custom theme
- Map CSS variables to Naive UI theme tokens for consistency

### 3. Font Loading
- Use `@fontsource/ibm-plex-sans` and `@fontsource/jetbrains-mono`
- Import in main.ts, apply via CSS variables
- Fallback to system fonts if loading fails

### 4. Migration Strategy
- Phase 1: Create token system + theme provider (no visual changes)
- Phase 2: Migrate MainLayout (sidebar, navigation)
- Phase 3: Migrate views one by one (start with CustomerList as reference)
- Phase 4: Build custom industrial components
- Phase 5: Replace remaining hardcoded styles

### 5. Custom Components
- `StatusLamp.vue`: Glowing circle indicator with CSS box-shadow
- `IndustrialCard.vue`: Header + content with JetBrains Mono headers
- `HazardButton.vue`: Striped hover pattern for destructive actions

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/renderer/styles/` | New | Design token CSS files |
| `src/renderer/theme/` | New | Naive UI theme configuration |
| `src/renderer/App.vue` | Modified | Add n-config-provider wrapper |
| `src/renderer/layouts/MainLayout.vue` | Modified | Apply industrial styling |
| `src/renderer/views/**/*.vue` | Modified | Replace hardcoded colors with tokens |
| `src/renderer/components/` | New | StatusLamp, IndustrialCard, HazardButton |
| `package.json` | Modified | Add @fontsource dependencies |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Naive UI theme overrides insufficient | Low | Naive UI has comprehensive theme API; fallback to CSS overrides |
| Font loading performance | Low | Fontsource packages are optimized; use font-display: swap |
| Migration breaks existing layouts | Medium | Migrate incrementally, test each view |
| Custom components don't match design | Low | DESIGN.md provides exact specs; build reference implementation first |

## Rollback Plan

1. Keep `main` branch stable until Phase 3 complete
2. Each phase is a separate PR; revert individual phases if needed
3. CSS variables are additive; removing theme.css reverts to system defaults
4. Naive UI theme provider is opt-in; removing wrapper reverts to default theme

## Dependencies

- `@fontsource/ibm-plex-sans`: IBM Plex Sans font files
- `@fontsource/jetbrains-mono`: JetBrains Mono font files
- No other external dependencies required

## Success Criteria

- [ ] All colors from DESIGN.md implemented as CSS variables
- [ ] Naive UI components use beta_industrial theme (buttons, inputs, tables)
- [ ] IBM Plex Sans and JetBrains Mono load and apply correctly
- [ ] Status lamps, industrial cards, hazard buttons match DESIGN.md specs
- [ ] All 15 views + 1 layout use design tokens (zero hardcoded colors)
- [ ] Visual regression: no layout breaks during migration
- [ ] Bundle size increase < 500KB (fonts only)

## Capabilities

### New Capabilities
- `theme-system`: CSS variable-based design token system with Naive UI integration
- `industrial-components`: Custom status lamps, industrial cards, hazard action buttons

### Modified Capabilities
- `customer-management`: Apply industrial theme to customer views
- `vehicle-management`: Apply industrial theme to vehicle views
- `quote-management`: Apply industrial theme to quote views (if exists)
- `work-order-management`: Apply industrial theme to work order views
- `app-settings`: Apply industrial theme to settings view

## Estimated Effort

- **Phase 1** (Token system + theme provider): 4 hours
- **Phase 2** (MainLayout migration): 2 hours
- **Phase 3** (View migrations, 15 views): 8 hours
- **Phase 4** (Custom components): 6 hours
- **Phase 5** (Polish + testing): 4 hours
- **Total**: ~24 hours (3 days)
