// Onglets principaux après connexion (Home, Missions, Carte, Profil)
// Implémentation complète à l'étape 12
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { KmerFretColors } from '../theme/theme';

export type MainTabParamList = {
  Home: undefined;
  Missions: undefined;
  Map: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function PlaceholderScreen({ name }: { name: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>{name} — étape 12</Text>
    </View>
  );
}

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: KmerFretColors.primary,
        tabBarInactiveTintColor: '#9E9E9E',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        options={{ title: 'Accueil', tabBarIcon: () => null }}
        children={() => <PlaceholderScreen name="Accueil" />}
      />
      <Tab.Screen
        name="Missions"
        options={{ title: 'Missions', tabBarIcon: () => null }}
        children={() => <PlaceholderScreen name="Missions" />}
      />
      <Tab.Screen
        name="Map"
        options={{ title: 'Carte', tabBarIcon: () => null }}
        children={() => <PlaceholderScreen name="Carte" />}
      />
      <Tab.Screen
        name="Profile"
        options={{ title: 'Profil', tabBarIcon: () => null }}
        children={() => <PlaceholderScreen name="Profil" />}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text:   { fontSize: 16, color: '#666' },
});
