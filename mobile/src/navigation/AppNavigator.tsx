// Navigateur racine : AuthNavigator ou MainNavigator selon la session
// Logique de session complète à l'étape 9
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';

export function AppNavigator() {
  // À l'étape 9 : vérifier session SQLite → choisir AuthNavigator ou MainNavigator
  return (
    <NavigationContainer>
      <AuthNavigator />
    </NavigationContainer>
  );
}
