import React, { useState } from 'react';
import { UnlockWith } from './components/UnlockWith';
import { WalletDashboard } from './components/WalletDashboard';
import { PerformanceInspector } from './components/PerformanceInspector';
import { WalletVault, BootMetrics } from './types';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [vault, setVault] = useState<WalletVault | null>(null);
  const [bootMetrics, setBootMetrics] = useState<BootMetrics>({
    splashTimeMs: 0,
    storageLoadTimeMs: 0,
    electrumDeferTimeMs: 0,
    totalBootTimeMs: 0,
    status: 'loading',
  });

  const handleUnlocked = (unlockedVault: WalletVault, metrics: BootMetrics) => {
    setVault(unlockedVault);
    setBootMetrics(metrics);
    setIsUnlocked(true);
  };

  const handleLockWallet = () => {
    setIsUnlocked(false);
  };

  const handleVaultUpdate = (updatedVault: WalletVault) => {
    setVault(updatedVault);
  };

  return (
    <div className="min-h-screen bg-[#0A0C0F] font-sans antialiased selection:bg-cyan-500 selection:text-black">
      {!isUnlocked || !vault ? (
        <UnlockWith onUnlocked={handleUnlocked} />
      ) : (
        <WalletDashboard
          vault={vault}
          bootMetrics={bootMetrics}
          onLock={handleLockWallet}
          onVaultUpdate={handleVaultUpdate}
        />
      )}

      {/* Developer & User Performance Audit Toolbar */}
      <PerformanceInspector metrics={bootMetrics} />
    </div>
  );
}
