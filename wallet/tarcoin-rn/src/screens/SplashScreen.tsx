// TARCOIN Wallet — Splash Screen
// Fast async boot matching applet's UnlockWith.tsx initialization

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { StorageService } from '../services/StorageService';
import { colors } from '../theme/colors';

interface SplashScreenProps {
  onReady: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onReady }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Spinner animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Initialize storage async (Objective 1: non-blocking boot)
    const initStorage = async () => {
      await StorageService.init();
      // Minimum splash display time for polish
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => onReady());
      }, 800);
    };

    initStorage();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrapper,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* TARCOIN Logo Badge */}
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>TAR</Text>
        </View>

        <Text style={styles.title}>TARCOIN</Text>
        <Text style={styles.subtitle}>SECURE DIGITAL WALLET</Text>

        {/* Spinner */}
        <Animated.View
          style={[styles.spinner, { transform: [{ rotate: spin }] }]}
        />
        <Text style={styles.loadingText}>Launching securely...</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: colors.accentCyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logoText: {
    color: '#000000',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 6,
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '500',
    marginBottom: 40,
  },
  spinner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: colors.accentCyan,
    borderTopColor: 'transparent',
    marginBottom: 12,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
});
