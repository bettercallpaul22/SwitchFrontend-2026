import React from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <Text style={styles.title}>SwitchApp</Text>
      <ActivityIndicator size="large" color="#f59e0b" />
      <Text style={styles.caption}>Checking your session...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
    gap: 12
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5
  },
  caption: {
    color: '#cbd5e1',
    fontSize: 14
  }
});
