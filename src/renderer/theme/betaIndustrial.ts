import type { GlobalThemeOverrides } from 'naive-ui'

/**
 * Naive UI GlobalThemeOverrides for the Beta Industrial theme.
 *
 * Maps CSS design tokens to Naive UI component variables so the entire
 * component library inherits the dark, high-contrast workshop aesthetic.
 */
export const betaIndustrialOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: 'var(--bi-primary-container)',
    primaryColorHover: 'var(--bi-primary)',
    primaryColorPressed: 'var(--bi-inverse-primary)',
    primaryColorSuppl: 'var(--bi-primary)',

    errorColor: 'var(--bi-error)',
    warningColor: 'var(--bi-hazard-yellow)',
    successColor: 'var(--bi-success)',

    textColorBase: 'var(--bi-on-surface)',
    textColor1: 'var(--bi-on-surface)',
    textColor2: 'var(--bi-secondary)',
    textColor3: 'var(--bi-outline)',

    bodyColor: 'var(--bi-surface)',
    cardColor: 'var(--bi-surface-container)',
    modalColor: 'var(--bi-surface-container)',
    popoverColor: 'var(--bi-surface-container-high)',
    tableColor: 'var(--bi-surface-container)',
    inputColor: 'var(--bi-surface-container-low)',
    actionColor: 'var(--bi-surface-container-high)',

    hoverColor: 'var(--bi-primary-container-alpha-9)',
    borderColor: 'var(--bi-outline)',
    dividerColor: 'var(--bi-slate-gray)',

    borderRadius: 'var(--bi-radius)',
    borderRadiusSmall: 'var(--bi-radius-sm)',

    fontFamily: 'var(--bi-font-sans)',
    fontFamilyMono: 'var(--bi-font-mono)',

    heightMedium: 'var(--bi-touch-target)'
  },

  Button: {
    fontWeightStrong: '700'
  },

  DataTable: {
    thColor: 'var(--bi-surface-container-high)',
    tdColor: 'var(--bi-surface-container)',
    thTextColor: 'var(--bi-on-surface)',
    tdTextColor: 'var(--bi-on-surface)',
    borderColor: 'var(--bi-slate-gray)',
    borderRadius: 'var(--bi-radius)'
  },

  Input: {
    color: 'var(--bi-surface-container-low)',
    borderHover: 'var(--bi-primary-container)',
    borderFocus: 'var(--bi-primary-container)',
    boxShadowFocus: '0 0 0 2px var(--bi-primary-container-alpha-20)'
  },

  Menu: {
    color: 'var(--bi-surface)',
    itemColorActive: 'var(--bi-surface-container-high)',
    itemColorActiveHover: 'var(--bi-surface-container-highest)',
    itemTextColor: 'var(--bi-on-surface)',
    itemTextColorActive: 'var(--bi-primary-container)',
    itemIconColor: 'var(--bi-on-surface)',
    itemIconColorActive: 'var(--bi-primary-container)'
  }
}
