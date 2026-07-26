// TARCOIN Wallet — App Root Entry Point
// Controls screen flow: Splash -> PIN Lock -> Dashboard

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SplashScreen } from './src/screens/SplashScreen';
import { PinScreen } from './src/screens/PinScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import type { WalletVault } from './src/types';
import { colors } from './src/theme/colors';

export default function App() {
  const [appState, setAppState] = useState<'splash' | 'pin' | 'dashboard'>('splash');
  const [activeVault, setActiveVault] = useState<WalletVault | null>(null);

  return (
    <View style={styles.container}>
      {appState === 'splash' && (
        <SplashScreen onReady={() => setAppState('pin')} />
      )}

      {appState === 'pin' && (
        <PinScreen
          onSuccess={(vault) => {
            setActiveVault(vault);
            setAppState('dashboard');
          }}
        />
      )}

      {appState === 'dashboard' && activeVault && (
        <DashboardScreen
          vault={activeVault}
          onLock={() => setAppState('pin')}
          onVaultUpdate={(updated) => setActiveVault(updated)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
});
