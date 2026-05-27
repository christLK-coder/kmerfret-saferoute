import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { LightTheme } from './src/theme/theme';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <PaperProvider theme={LightTheme}>
      <AppNavigator />
    </PaperProvider>
  );
}
