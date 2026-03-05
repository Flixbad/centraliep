import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'centraliep_theme'
const THEMES = ['system', 'light', 'dark']

const ThemeContext = createContext({ theme: 'system', setTheme: () => {} })

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'system')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme)
    const root = document.documentElement
    if (theme === 'system') {
      root.removeAttribute('data-theme')
      root.style.colorScheme = ''
    } else {
      root.setAttribute('data-theme', theme)
      root.style.colorScheme = theme
    }
  }, [theme])

  const setTheme = (t) => setThemeState(THEMES.includes(t) ? t : 'system')

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
