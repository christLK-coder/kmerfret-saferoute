import React, { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LightTheme, DarkTheme } from './src/theme/theme';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useThemeStore } from './src/store/themeStore';

function paperIcon({ name, color, size }: { name: string; color?: string; size: number; direction?: 'ltr' | 'rtl'; allowFontScaling?: boolean }) {
  return (
    <MaterialCommunityIcons
      name={name as keyof typeof MaterialCommunityIcons.glyphMap}
      color={color ?? '#000'}
      size={size}
    />
  );
}

export default function App() {
  const { isDark, loadTheme } = useThemeStore();

  useEffect(() => {
    loadTheme();
  }, []);

  return (
    <PaperProvider theme={isDark ? DarkTheme : LightTheme} settings={{ icon: paperIcon }}>
      <AppNavigator />
    </PaperProvider>
  );
}
