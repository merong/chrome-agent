import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const { settings, updateUISettings } = useSettingsStore()
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')

  // Resolve system theme preference
  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // Update resolved theme when settings change
  useEffect(() => {
    const theme = settings.ui.theme
    if (theme === 'system') {
      setResolvedTheme(getSystemTheme())
    } else {
      setResolvedTheme(theme)
    }
  }, [settings.ui.theme])

  // Listen for system theme changes
  useEffect(() => {
    if (settings.ui.theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [settings.ui.theme])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement

    // Remove existing theme classes
    root.classList.remove('light', 'dark')

    // Add current theme class
    root.classList.add(resolvedTheme)

    // Also set data attribute for CSS selectors
    root.setAttribute('data-theme', resolvedTheme)
  }, [resolvedTheme])

  const setTheme = (theme: Theme) => {
    updateUISettings({ theme })
  }

  return (
    <ThemeContext.Provider
      value={{
        theme: settings.ui.theme,
        resolvedTheme,
        setTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
