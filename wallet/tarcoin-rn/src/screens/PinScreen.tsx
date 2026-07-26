// TARCOIN Wallet — 4-Digit PIN Lock Screen (Cake Wallet Style)
// React Native port of applet src/components/PinScreen.tsx
// Uses RN Animated API instead of framer-motion, Vibration instead of navigator.vibrate

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
  SafeAreaView,
  Easing,
} from 'react-native';
import { StorageService } from '../services/StorageService';
import { colors, radii, spacing } from '../theme/colors';
import type { WalletVault } from '../types';

interface PinScreenProps {
  onSuccess: (vault: WalletVault) => void;
}

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'BIO', '0', 'DEL'];

export const PinScreen: React.FC<PinScreenProps> = ({ onSuccess }) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [validating, setValidating] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Animation refs
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const dotScales = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
  ];
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 7, tension: 100, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (pin.length === 4 && !validating && !isSuccess) {
      handleValidatePin(pin);
    }
  }, [pin]);

  const triggerShake = () => {
    Vibration.vibrate([0, 40, 60, 40, 60, 40]);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const animateDotFill = (index: number) => {
    Animated.sequence([
      Animated.spring(dotScales[index], {
        toValue: 1.3,
        friction: 6,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(dotScales[index], {
        toValue: 1,
        friction: 6,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleValidatePin = async (enteredPin: string) => {
    setValidating(true);
    const valid = await StorageService.validatePin(enteredPin);

    if (valid) {
      setIsSuccess(true);
      Vibration.vibrate(25);
      // Animate all dots to success
      dotScales.forEach((dot) => {
        Animated.spring(dot, { toValue: 1.2, friction: 5, tension: 150, useNativeDriver: true }).start();
      });
      setTimeout(async () => {
        const vault = await StorageService.getVault();
        onSuccess(vault);
      }, 400);
    } else {
      triggerShake();
      setErrorMsg('Incorrect PIN. Try again.');
      setTimeout(() => {
        setErrorMsg('');
        setPin('');
        setValidating(false);
        dotScales.forEach((dot) => {
          Animated.spring(dot, { toValue: 1, friction: 5, tension: 150, useNativeDriver: true }).start();
        });
      }, 700);
    }
  };

  const handleKey = (key: string) => {
    if (validating || isSuccess) return;

    setActiveKey(key);
    setTimeout(() => setActiveKey(null), 130);

    if (key === 'DEL') {
      Vibration.vibrate(8);
      setErrorMsg('');
      setPin(prev => prev.slice(0, -1));
    } else if (key === 'BIO') {
      Vibration.vibrate(12);
      // Biometrics placeholder — auto-unlock in demo
      setPin('1234');
    } else if (pin.length < 4) {
      Vibration.vibrate(8);
      setErrorMsg('');
      const newIndex = pin.length;
      setPin(prev => prev + key);
      animateDotFill(newIndex);
    }
  };

  const getDotColor = (index: number): string => {
    if (isSuccess) return colors.accentSuccess;
    if (errorMsg) return colors.accentDanger;
    return pin.length > index ? colors.dotFilled : colors.dotEmpty;
  };

  const getDotBorderColor = (index: number): string => {
    if (isSuccess) return colors.accentSuccess;
    if (errorMsg) return colors.accentDanger;
    return pin.length > index ? colors.dotFilled : colors.dotBorder;
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* === HEADER: Logo + Title === */}
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.logoBadge,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <Text style={styles.logoBadgeText}>TAR</Text>
          {/* Online indicator dot */}
          <View style={styles.onlineDot} />
        </Animated.View>

        <Text style={styles.title}>TARCOIN</Text>
        <Text style={styles.subtitle}>SECURE DIGITAL WALLET</Text>
      </View>

      {/* === PIN SECTION: Label + Dots === */}
      <View style={styles.pinSection}>
        <Text style={styles.pinLabel}>Enter PIN</Text>

        {/* Error / Success message */}
        <View style={styles.messageBox}>
          {errorMsg ? (
            <View style={styles.errorBadge}>
              <Text style={styles.errorBadgeText}>⚠ {errorMsg}</Text>
            </View>
          ) : isSuccess ? (
            <View style={styles.successBadge}>
              <Text style={styles.successBadgeText}>✓ PIN Verified</Text>
            </View>
          ) : null}
        </View>

        {/* 4 Dot indicators with shake animation */}
        <Animated.View
          style={[
            styles.dotsRow,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          {[0, 1, 2, 3].map(i => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: getDotColor(i),
                  borderColor: getDotBorderColor(i),
                  transform: [{ scale: dotScales[i] }],
                  shadowColor:
                    isSuccess ? colors.accentSuccess :
                    errorMsg ? colors.accentDanger :
                    pin.length > i ? colors.accentCyan : 'transparent',
                  shadowOpacity: pin.length > i ? 0.7 : 0,
                  shadowRadius: 8,
                  elevation: pin.length > i ? 4 : 0,
                },
              ]}
            />
          ))}
        </Animated.View>
      </View>

      {/* === 3x4 KEYPAD GRID === */}
      <View style={styles.keypad}>
        {KEYPAD_KEYS.map((key) => {
          const isUtil = key === 'BIO' || key === 'DEL';
          const isActive = activeKey === key;

          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.key,
                isUtil && styles.keyUtil,
                isActive && styles.keyActive,
              ]}
              onPress={() => handleKey(key)}
              activeOpacity={0.7}
            >
              {key === 'DEL' ? (
                <Text style={[styles.keyText, styles.keyUtilText]}>⌫</Text>
              ) : key === 'BIO' ? (
                <Text style={[styles.keyText, styles.keyUtilText]}>☉</Text>
              ) : (
                <Text style={styles.keyText}>{key}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* === DEMO HINT === */}
      <TouchableOpacity style={styles.demoHint} onPress={() => setPin('1234')}>
        <Text style={styles.demoHintText}>
          Demo PIN: <Text style={styles.demoHintHighlight}>1234</Text> (tap to fill)
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
};

const KEY_SIZE = 76;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },

  // Header
  header: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.accentCyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  logoBadgeText: {
    color: '#000000',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  onlineDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accentSuccess,
    borderWidth: 2,
    borderColor: colors.bgPrimary,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 5,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '500',
  },

  // PIN section
  pinSection: {
    alignItems: 'center',
    width: '100%',
  },
  pinLabel: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '300',
    marginBottom: 12,
    letterSpacing: 1,
  },
  messageBox: {
    height: 28,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBadge: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
  },
  errorBadgeText: {
    color: colors.accentDanger,
    fontSize: 11,
    fontWeight: '600',
  },
  successBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.35)',
  },
  successBadgeText: {
    color: colors.accentSuccess,
    fontSize: 11,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },

  // Keypad
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: KEY_SIZE * 3 + spacing.lg * 2 + 32,
    justifyContent: 'center',
    gap: 16,
    rowGap: 16,
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: KEY_SIZE / 2,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  keyUtil: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  keyActive: {
    backgroundColor: colors.bgSurfaceActive,
  },
  keyText: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '400',
  },
  keyUtilText: {
    color: colors.textSecondary,
    fontSize: 22,
    opacity: 0.8,
  },

  // Demo hint
  demoHint: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0,229,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.15)',
  },
  demoHintText: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  demoHintHighlight: {
    color: colors.accentCyan,
    fontWeight: '700',
  },
});
