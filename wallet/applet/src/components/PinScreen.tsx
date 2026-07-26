import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, Delete, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { cakeObsidianTheme } from '../services/themes';
import tarcoinLogo from '../assets/images/tarcoin_logo.svg';

interface PinScreenProps {
  onSuccess: () => void;
  onValidatePin: (pin: string) => Promise<boolean>;
  onTriggerBiometrics?: () => Promise<boolean>;
  title?: string;
  subtitle?: string;
  isSettingNewPin?: boolean;
}

export const PinScreen: React.FC<PinScreenProps> = ({
  onSuccess,
  onValidatePin,
  onTriggerBiometrics,
  title = 'Enter PIN',
  subtitle = 'TARCOIN Encrypted Vault',
  isSettingNewPin = false,
}) => {
  const [pin, setPin] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [activePressedKey, setActivePressedKey] = useState<string | null>(null);

  // Objective 2 requirement:
  // When the 4th digit is entered, immediately validate the PIN.
  useEffect(() => {
    if (pin.length === 4 && !isValidating && !isSuccess) {
      handleCompletePin(pin);
    }
  }, [pin]);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(12);
      } catch (e) {
        // Ignore haptic error if unsupported
      }
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length >= 4 || isValidating || isSuccess) return;
    triggerHaptic();
    setActivePressedKey(num);
    setTimeout(() => setActivePressedKey(null), 150);
    setErrorMessage(null);
    setPin((prev) => prev + num);
  };

  const handleBackspace = () => {
    if (pin.length === 0 || isValidating || isSuccess) return;
    triggerHaptic();
    setActivePressedKey('backspace');
    setTimeout(() => setActivePressedKey(null), 150);
    setErrorMessage(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleBiometricsClick = async () => {
    if (!onTriggerBiometrics) return;
    triggerHaptic();
    setActivePressedKey('biometrics');
    setTimeout(() => setActivePressedKey(null), 150);
    
    try {
      setIsValidating(true);
      const passed = await onTriggerBiometrics();
      if (passed) {
        handleSuccess();
      } else {
        triggerError('Biometric verification failed');
      }
    } catch (e) {
      triggerError('Biometrics error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCompletePin = async (enteredPin: string) => {
    setIsValidating(true);
    try {
      const isValid = await onValidatePin(enteredPin);
      if (isValid) {
        handleSuccess();
      } else {
        triggerError('Incorrect PIN. Try again.');
      }
    } catch (err) {
      triggerError('Validation error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSuccess = () => {
    setIsSuccess(true);
    triggerHaptic();
    setTimeout(() => {
      onSuccess();
    }, 400); // Smooth brief success transition
  };

  const triggerError = (msg: string) => {
    setIsShaking(true);
    setErrorMessage(msg);
    triggerHaptic();
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate([40, 60, 40]);
      } catch (e) {}
    }

    setTimeout(() => {
      setIsShaking(false);
      setPin('');
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between py-10 px-6 select-none overflow-hidden"
      style={{ backgroundColor: cakeObsidianTheme.colors.bgPrimary }}
    >
      {/* Top Header & Logo */}
      <div className="flex flex-col items-center mt-6 z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative mb-5"
        >
          <img
            src={tarcoinLogo}
            alt="TARCOIN Logo"
            width={64}
            height={64}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl object-cover shadow-2xl"
            style={{
              boxShadow: '0 0 25px rgba(249, 115, 22, 0.35)',
            }}
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
        </motion.div>

        {/* Title Label */}
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1 text-center">
          {title}
        </h1>
        <p className="text-xs text-gray-400 tracking-wide font-medium">
          {subtitle}
        </p>
      </div>

      {/* Middle Dot Indicators section */}
      <div className="flex flex-col items-center justify-center my-auto z-10 w-full max-w-xs">
        {/* Error message indicator */}
        <div className="h-6 mb-3 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {errorMessage ? (
              <motion.div
                key="err"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-1.5 text-xs text-red-400 font-medium bg-red-950/40 px-3 py-1 rounded-full border border-red-800/40"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>{errorMessage}</span>
              </motion.div>
            ) : isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-800/40"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>PIN Verified</span>
              </motion.div>
            ) : (
              <motion.span
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                className="text-[11px] text-gray-400 tracking-wider font-mono"
              >
                ••••
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* 4 Rounded Dot Indicators */}
        <motion.div
          animate={
            isShaking
              ? { x: [-12, 12, -8, 8, -4, 4, 0] }
              : isSuccess
              ? { scale: [1, 1.12, 1] }
              : { x: 0 }
          }
          transition={{ duration: isShaking ? 0.45 : 0.2 }}
          className="flex items-center justify-center gap-5 my-2"
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <motion.div
                key={index}
                initial={false}
                animate={{
                  scale: isFilled ? 1.15 : 1,
                  backgroundColor: isSuccess
                    ? '#10B981'
                    : isShaking
                    ? '#EF4444'
                    : isFilled
                    ? cakeObsidianTheme.colors.dotFilled
                    : cakeObsidianTheme.colors.dotEmpty,
                  borderColor: isSuccess
                    ? '#10B981'
                    : isShaking
                    ? '#EF4444'
                    : isFilled
                    ? cakeObsidianTheme.colors.dotFilled
                    : '#323948',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="w-4 h-4 rounded-full border-2 relative transition-shadow"
                style={{
                  boxShadow:
                    isFilled && !isShaking && !isSuccess
                      ? '0 0 12px rgba(0, 229, 255, 0.6)'
                      : isSuccess
                      ? '0 0 12px rgba(16, 185, 129, 0.8)'
                      : isShaking
                      ? '0 0 12px rgba(239, 68, 68, 0.8)'
                      : 'none',
                }}
              />
            );
          })}
        </motion.div>
      </div>

      {/* 3x4 Grid of Circular Number Buttons */}
      <div className="w-full max-w-xs z-10 mb-4">
        <div className="grid grid-cols-3 gap-y-4 gap-x-6 justify-items-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <motion.button
              key={num}
              type="button"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleKeyPress(num)}
              className="w-18 h-18 rounded-full flex items-center justify-center text-2xl font-medium text-white shadow-md focus:outline-none transition-colors relative overflow-hidden"
              style={{
                backgroundColor:
                  activePressedKey === num
                    ? cakeObsidianTheme.colors.bgSurfaceActive
                    : cakeObsidianTheme.colors.bgSurface,
                border: '1px solid #262B36',
              }}
            >
              <span>{num}</span>
            </motion.button>
          ))}

          {/* Bottom Row: Biometrics Icon, 0, Backspace */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleBiometricsClick}
            disabled={!onTriggerBiometrics}
            title="Biometric Fingerprint / Face ID"
            className={`w-18 h-18 rounded-full flex items-center justify-center text-cyan-400 focus:outline-none transition-colors ${
              !onTriggerBiometrics ? 'opacity-30 cursor-not-allowed' : 'hover:text-cyan-300'
            }`}
            style={{
              backgroundColor:
                activePressedKey === 'biometrics'
                  ? cakeObsidianTheme.colors.bgSurfaceActive
                  : cakeObsidianTheme.colors.bgSurface,
              border: '1px solid #262B36',
            }}
          >
            <Fingerprint className="w-7 h-7" />
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleKeyPress('0')}
            className="w-18 h-18 rounded-full flex items-center justify-center text-2xl font-medium text-white shadow-md focus:outline-none transition-colors"
            style={{
              backgroundColor:
                activePressedKey === '0'
                  ? cakeObsidianTheme.colors.bgSurfaceActive
                  : cakeObsidianTheme.colors.bgSurface,
              border: '1px solid #262B36',
            }}
          >
            <span>0</span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleBackspace}
            title="Backspace"
            className="w-18 h-18 rounded-full flex items-center justify-center text-gray-300 hover:text-white focus:outline-none transition-colors"
            style={{
              backgroundColor:
                activePressedKey === 'backspace'
                  ? cakeObsidianTheme.colors.bgSurfaceActive
                  : cakeObsidianTheme.colors.bgSurface,
              border: '1px solid #262B36',
            }}
          >
            <Delete className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Demo Shortcut & Quick Fill Bar */}
        <div className="mt-6 flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setPin('1234');
            }}
            className="text-[11px] text-cyan-400/80 hover:text-cyan-300 transition-colors flex items-center gap-1 font-mono py-1 px-3 rounded-full bg-cyan-950/20 border border-cyan-800/30"
          >
            <Sparkles className="w-3 h-3" />
            <span>Default Demo PIN: <strong className="text-cyan-300">1234</strong> (Tap to Auto-fill)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
