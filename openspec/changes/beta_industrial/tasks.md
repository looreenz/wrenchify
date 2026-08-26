# Tasks: Beta Industrial Theme Implementation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~850-1000 lines |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation + Naive UI) → PR 2 (Layout + Customers) → PR 3 (Vehicles + Quotes) → PR 4 (Work Orders + Settings + Custom Components) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation + Naive UI integration | PR 1 | Token files, theme.css, useTheme, App.vue, betaIndustrial.ts; tests for useTheme |
| 2 | Layout + Customer views | PR 2 | MainLayout, CustomerList, CustomerForm; establishes migration pattern |
| 3 | Vehicle + Quote views | PR 3 | Vehicle views, Quote views, StatusLamp, IndustrialCard |
| 4 | Work Orders + Settings + Custom Components | PR 4 | Work order views, LineItemsEditor, SettingsView, HazardButton |

## Phase 1: Foundation (No Dependencies)

- [x] 1.1 Create `src/renderer/styles/tokens/colors.css` with 51 color tokens + semantic aliases (`--bi-bg`, `--bi-text`, `--bi-border`). Acceptance: All colors from DESIGN.md present. Effort: 2h. Risk: Low.
- [x] 1.2 Create `src/renderer/styles/tokens/typography.css` with font stacks + 7 size/weight/line-height tokens. Acceptance: `--bi-font-sans` and `--bi-font-mono` defined. Effort: 1h. Risk: Low.
- [x] 1.3 Create `src/renderer/styles/tokens/spacing.css` with 8px grid tokens + `--bi-touch-target`. Acceptance: `--bi-space-1` through `--bi-space-5` defined. Effort: 0.5h. Risk: Low.
- [x] 1.4 Create `src/renderer/styles/tokens/borders.css` with radius + border tokens. Acceptance: `--bi-radius-sm/md/lg` and border tokens defined. Effort: 0.5h. Risk: Low.
- [x] 1.5 Create `src/renderer/styles/theme.css` barrel importing all token files. Acceptance: Single import loads all tokens. Effort: 0.5h. Risk: Low.
- [x] 1.6 Create `src/renderer/theme/betaIndustrial.ts` with `GlobalThemeOverrides` object. Acceptance: All Naive UI component overrides match DESIGN.md. Effort: 2h. Risk: Medium (NDataTable stripe conflict).
- [x] 1.7 Create `src/renderer/composables/useTheme.ts` returning `{ theme, themeOverrides }`. Acceptance: Returns `darkTheme` + overrides. Effort: 1h. Risk: Low.
- [x] 1.8 Write unit test for `useTheme()` composable. Acceptance: Asserts theme is `darkTheme`, overrides contain expected keys. Effort: 1h. Risk: Low.

**Phase 1 total: ~8.5h**

## Phase 2: Naive UI Integration (Depends on Phase 1)

- [x] 2.1 Modify `src/renderer/App.vue`: import `theme.css`, wrap `<router-view>` in `<n-config-provider :theme="theme" :theme-overrides="themeOverrides">`, replace hardcoded body colors with `var(--bi-bg)`. Acceptance: App launches with dark theme, Naive UI components use orange primary. Effort: 2h. Risk: Low.
- [x] 2.2 Modify `src/renderer/index.ts`: import `theme.css` as global styles entry. Acceptance: CSS variables available globally. Effort: 0.5h. Risk: Low.
- [x] 2.3 Integration test: render App.vue, verify NButton picks up primary color. Acceptance: Test passes. Effort: 1.5h. Risk: Low.

**Phase 2 total: ~4h**

## Phase 3: Layout Migration (Depends on Phase 2)

- [x] 3.1 Modify `src/renderer/layouts/MainLayout.vue`: replace all hardcoded colors with `var(--bi-*)`, swap logo to dark-theme variant. Acceptance: Zero hex colors in file, sidebar uses `--bi-surface-container`. Effort: 2h. Risk: Low.

**Phase 3 total: ~2h**

## Phase 4: Customer Views (Depends on Phase 3)

- [x] 4.1 Modify `src/renderer/views/customers/CustomerList.vue`: replace `#fff` table bg, hardcoded spacing with tokens. Acceptance: Zero hex colors, table uses `--bi-surface-container`. Effort: 1.5h. Risk: Low.
- [x] 4.2 Modify `src/renderer/views/customers/CustomerForm.vue`: replace `#fff` form bg, `8px` radius with tokens. Acceptance: Zero hex colors, inputs use `--bi-surface-container-low`. Effort: 1.5h. Risk: Low.

**Phase 4 total: ~3h**

## Phase 5: Vehicle Views (Depends on Phase 3, parallel with Phase 4)

- [x] 5.1 Modify `src/renderer/views/vehicles/VehicleList.vue`: replace hardcoded colors, wrap each vehicle in IndustrialCard (create component in Phase 7 if not ready). Acceptance: Zero hex colors, plate/VIN in `--bi-font-mono`. Effort: 2h. Risk: Low.
- [x] 5.2 Modify `src/renderer/views/vehicles/VehicleForm.vue`: replace hardcoded colors with tokens. Acceptance: Zero hex colors. Effort: 1.5h. Risk: Low.
- [x] 5.3 Modify `src/renderer/views/vehicles/VehicleTimeline.vue`: replace hardcoded colors with tokens. Acceptance: Zero hex colors. Effort: 1h. Risk: Low.

**Phase 5 total: ~4.5h**

## Phase 6: Quote Views (Depends on Phase 3, parallel with Phase 4-5)

- [x] 6.1 Modify `src/renderer/views/quotes/QuoteList.vue`: replace hardcoded colors, add StatusLamp for quote status (draft=tertiary, accepted=emerald, rejected=error, converted=primary-container). Acceptance: Zero hex colors, status lamps render with correct colors. Effort: 2.5h. Risk: Medium (StatusLamp integration).
- [x] 6.2 Modify `src/renderer/views/quotes/QuoteDetail.vue`: replace hardcoded colors with tokens. Acceptance: Zero hex colors. Effort: 1.5h. Risk: Low.
- [x] 6.3 Modify `src/renderer/views/quotes/QuoteForm.vue`: replace hardcoded colors with tokens. Acceptance: Zero hex colors. Effort: 1.5h. Risk: Low.

**Phase 6 total: ~5.5h**

## Phase 7: Custom Components (Depends on Phase 1, build alongside Phase 5-6)

- [x] 7.1 Create `src/renderer/components/industrial/StatusLamp.vue` with props: color, size (sm/md/lg), label, pulse. Acceptance: Renders glowing circle with box-shadow, pulse animation works. Effort: 2h. Risk: Low.
- [x] 7.2 Create `src/renderer/components/industrial/IndustrialCard.vue` with mono-font header separated by 1px rule. Acceptance: Header in uppercase monospace, background lighter than page. Effort: 1.5h. Risk: Low.
- [x] 7.3 Create `src/renderer/components/industrial/HazardButton.vue` with diagonal striped hover (yellow/black, 45°, 8px stripes). Acceptance: Default red bg, hover shows stripes, disabled at 0.5 opacity. Effort: 2h. Risk: Medium (cross-platform gradient).
- [x] 7.4 Write unit tests for StatusLamp, IndustrialCard, HazardButton. Acceptance: Mount with props, assert rendered classes/styles. Effort: 3h. Risk: Low.

**Phase 7 total: ~8.5h**

## Phase 8: Work Order Views (Depends on Phase 3, Phase 7 for StatusLamp)

- [x] 8.1 Modify `src/renderer/views/work-orders/WorkOrderList.vue`: replace `#fff`, add StatusLamp for payment status (pending=yellow, partial=primary, paid=emerald). Acceptance: Zero hex colors, payment lamps render. Effort: 2.5h. Risk: Medium.
- [x] 8.2 Modify `src/renderer/views/work-orders/WorkOrderForm.vue`: replace hardcoded colors with tokens. Acceptance: Zero hex colors. Effort: 1.5h. Risk: Low.
- [x] 8.3 Modify `src/renderer/views/work-orders/PaymentSection.vue`: replace hardcoded colors with tokens. Acceptance: Zero hex colors. Effort: 1.5h. Risk: Low.
- [x] 8.4 Modify `src/renderer/components/LineItemsEditor.vue`: replace `#f9f9f9` row bg with `--bi-surface-container`, mono font for numeric columns. Acceptance: Zero hex colors, numeric data in monospace. Effort: 2h. Risk: Low.

**Phase 8 total: ~7.5h**

## Phase 9: Settings View (Depends on Phase 3)

- [x] 9.1 Modify `src/renderer/views/settings/SettingsView.vue`: replace hardcoded colors with tokens, ensure save button meets 52px touch target. Acceptance: Zero hex colors, save button uses `--bi-primary-container`. Effort: 1.5h. Risk: Low.

**Phase 9 total: ~1.5h**

## Phase 10: Integration & Polish (Depends on all above)

- [x] 10.1 Replace generic components with IndustrialCard in VehicleList where appropriate. Acceptance: Vehicles wrapped in IndustrialCard. Effort: 1h. Risk: Low.
- [x] 10.2 Replace delete actions with HazardButton in CustomerForm, VehicleForm, QuoteForm. Acceptance: Delete buttons show striped hover. Effort: 1.5h. Risk: Low.
- [ ] 10.3 Hardcoded color audit: `grep -rE '#[0-9a-fA-F]{3,8}' src/renderer/views/ src/renderer/layouts/` returns zero matches (excluding comments). Acceptance: Zero hardcoded colors. Effort: 1h. Risk: Low.
- [ ] 10.4 Visual consistency audit: verify all views use tokens, check contrast ratios. Acceptance: All text ≥ 4.5:1 contrast. Effort: 2h. Risk: Low.
- [ ] 10.5 Update documentation: add theme system docs, component usage examples. Acceptance: Docs explain token system and custom components. Effort: 2h. Risk: Low.

**Phase 10 total: ~7.5h**

## Summary

| Phase | Tasks | Effort | Dependencies |
|-------|-------|--------|--------------|
| 1: Foundation | 8 | 8.5h | None |
| 2: Naive UI Integration | 3 | 4h | Phase 1 |
| 3: Layout Migration | 1 | 2h | Phase 2 |
| 4: Customer Views | 2 | 3h | Phase 3 |
| 5: Vehicle Views | 3 | 4.5h | Phase 3 |
| 6: Quote Views | 3 | 5.5h | Phase 3 |
| 7: Custom Components | 4 | 8.5h | Phase 1 |
| 8: Work Order Views | 4 | 7.5h | Phase 3, 7 |
| 9: Settings View | 1 | 1.5h | Phase 3 |
| 10: Integration & Polish | 5 | 7.5h | All above |
| **Total** | **34** | **52.5h** | |

## Implementation Order

1. **Phase 1** (Foundation) — must come first, no dependencies
2. **Phase 2** (Naive UI Integration) — activates theme globally
3. **Phase 3** (Layout) — highest visual impact, validates end-to-end
4. **Phases 4, 5, 6, 7, 9** — can be parallelized after Phase 3
5. **Phase 8** (Work Orders) — depends on StatusLamp from Phase 7
6. **Phase 10** (Integration & Polish) — final cleanup and audit

## Risk Mitigation

- **NDataTable stripe conflict**: Test early in Phase 2. If conflict exists, override in `betaIndustrial.ts` or disable `striped` prop.
- **HazardButton gradient**: Test in Electron Chromium in Phase 7. Fallback to solid color if gradient fails.
- **Dark-theme logos**: Verify assets are production-ready before Phase 3. If not, use placeholder or defer logo swap.
