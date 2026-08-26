import type { GlobalThemeOverrides } from 'naive-ui'

/**
 * Naive UI GlobalThemeOverrides for the Beta Industrial theme.
 *
 * Uses literal hex values (not CSS variables) because Naive UI's
 * GlobalThemeOverrides object doesn't resolve var() references.
 */
export const betaIndustrialOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#ff6b00',
    primaryColorHover: '#ffb693',
    primaryColorPressed: '#a04100',
    primaryColorSuppl: '#ffb693',

    errorColor: '#ffb4ab',
    warningColor: '#fde047',
    successColor: '#4ade80',

    textColorBase: '#dae2fd',
    textColor1: '#dae2fd',
    textColor2: '#b9c7e0',
    textColor3: '#a98a7d',

    bodyColor: '#0b1326',
    cardColor: '#171f33',
    modalColor: '#171f33',
    popoverColor: '#222a3d',
    tableColor: '#171f33',
    inputColor: '#131b2e',
    actionColor: '#222a3d',

    hoverColor: 'rgba(255, 107, 0, 0.09)',
    borderColor: '#a98a7d',
    dividerColor: '#334155',

    borderRadius: '4px',
    borderRadiusSmall: '2px',

    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontFamilyMono: "ui-monospace, 'SF Mono', Monaco, 'Cascadia Code', monospace",

    heightMedium: '52px'
  },

  Button: {
    fontWeightStrong: '700'
  },

  DataTable: {
    thColor: '#222a3d',
    tdColor: '#171f33',
    thTextColor: '#dae2fd',
    tdTextColor: '#dae2fd',
    borderColor: '#334155',
    borderRadius: '4px'
  },

  Input: {
    color: '#131b2e',
    borderHover: '#ff6b00',
    borderFocus: '#ff6b00',
    boxShadowFocus: '0 0 0 2px rgba(255, 107, 0, 0.2)'
  },

  Menu: {
    color: '#0b1326',
    itemColorActive: '#222a3d',
    itemColorActiveHover: '#2d3449',
    itemTextColor: '#dae2fd',
    itemTextColorActive: '#ff6b00',
    itemIconColor: '#dae2fd',
    itemIconColorActive: '#ff6b00'
  }
}
