import { darkTheme } from 'naive-ui'
import { betaIndustrialOverrides } from '../theme/betaIndustrial'

/**
 * Composable that provides the Beta Industrial theme configuration.
 *
 * Returns Naive UI's darkTheme plus custom overrides so every wrapped
 * component uses the Beta Industrial token system.
 */
export function useTheme() {
  return {
    theme: darkTheme,
    themeOverrides: betaIndustrialOverrides
  }
}
