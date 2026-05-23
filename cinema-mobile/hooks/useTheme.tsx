import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { DARK_COLORS, LIGHT_COLORS, ThemeColors, ThemeMode } from '../constants/theme';

type ThemeContextType = {
  colors: ThemeColors;
  mode: ThemeMode;
  isLight: boolean;
  toggleTheme: () => Promise<void>;
  setTheme: (mode: ThemeMode) => Promise<void>;
};

const THEME_KEY = 'theme-mode';
const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') setMode(saved);
    });
  }, []);

  const setTheme = async (nextMode: ThemeMode) => {
    setMode(nextMode);
    await AsyncStorage.setItem(THEME_KEY, nextMode);
  };

  const toggleTheme = async () => {
    await setTheme(mode === 'dark' ? 'light' : 'dark');
  };

  const value = useMemo(() => {
    const colors = mode === 'dark' ? DARK_COLORS : LIGHT_COLORS;
    return {
      colors,
      mode,
      isLight: mode === 'light',
      toggleTheme,
      setTheme,
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
