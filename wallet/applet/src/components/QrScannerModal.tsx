import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  Sparkles,
  QrCode,
  AlertCircle,
  RefreshCw,
  Copy,
  Zap,
} from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (address: string) => void;
}

const PRESET_QR_TARGETS = [
  {
    name: 'TARCOIN Merchant Node',
    address: 'tar1q8x9y7z6w5v4u3t2s1r0q9p8o7n6m5l4k3j2h1',
    label: 'Verified Merchant',
  },
  {
    name: 'Electrum Liquidity Pool',
    address: 'tar1q5u4v3w2x1y0z9a8b7c6d5e4f3g2h1j0k9l8m',
    label: 'Staking & Exchange',
  },
  {
    name: 'Obsidian Cold Vault',
    address: 'tar1q9a8b7c6d5e4f3g2h1j0k9l8m7n6p5q4r3s2t1',
    label: 'Cold Storage Wallet',
  },
  {
    name: 'Cake Wallet Payee',
    address: 'tar1q3m2k1j0h9g8f7e6d5c4b3a21z0y9x8w7v6u5',
    label: 'Peer-to-Peer Transfer',
  },
];

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'presets'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraActive(true);
      } else {
        setCameraError('Camera API not accessible in this browser context.');
      }
    } catch (err) {
      setCameraError('Camera access denied or unattached. Using simulated scan scanner.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleSelectAddress = (address: string) => {
    setScannedResult(address);
    setIsScanning(false);
    setTimeout(() => {
      onScanSuccess(address);
      onClose();
    }, 400);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate reading QR code from uploaded image
    setIsScanning(true);
    setTimeout(() => {
      const demoAddress = 'tar1q8x9y7z6w5v4u3t2s1r0q9p8o7n6m5l4k3j2h1';
      handleSelectAddress(demoAddress);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="w-full max-w-md bg-[#1A1D24] border border-[#262B36] rounded-2xl p-5 text-white shadow-2xl relative space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#262B36]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Scan TARCOIN QR Code</h3>
              <p className="text-[10px] text-gray-400">Scan or upload recipient wallet QR code</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#0F1115] flex items-center justify-center text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#0F1115] p-1 rounded-xl border border-[#262B36] text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'camera'
                ? 'bg-cyan-400 text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'presets'
                ? 'bg-cyan-400 text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'upload'
                ? 'bg-cyan-400 text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
        </div>

        {/* CAMERA VIEWPORT */}
        {activeTab === 'camera' && (
          <div className="relative w-full h-64 bg-black rounded-2xl overflow-hidden border border-[#262B36] flex flex-col items-center justify-center">
            {isCameraActive ? (
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-[#0F1115] flex flex-col items-center justify-center text-center p-4">
                <QrCode className="w-12 h-12 text-cyan-400/50 mb-2 animate-pulse" />
                <p className="text-xs text-gray-300 font-medium">Camera Simulator Active</p>
                <p className="text-[10px] text-gray-500 max-w-xs mt-1">
                  Point camera at a TARCOIN QR code or pick a quick target below
                </p>
              </div>
            )}

            {/* QR Scan Framing Corners & Animated Scanline */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div className="w-44 h-44 border-2 border-cyan-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-cyan-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-cyan-400" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-cyan-400" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-cyan-400" />

                {/* Animated Horizontal Laser Scanline */}
                <motion.div
                  animate={{ y: [0, 160, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_8px_#00E5FF]"
                />
              </div>
            </div>

            {/* Tap to simulate scan button overlay */}
            <div className="absolute bottom-3 left-3 right-3 z-10 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  handleSelectAddress('tar1q8x9y7z6w5v4u3t2s1r0q9p8o7n6m5l4k3j2h1')
                }
                className="w-full py-2 px-3 rounded-xl bg-cyan-500/90 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg backdrop-blur-md flex items-center justify-center gap-1.5 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate Scan QR Code</span>
              </button>
            </div>
          </div>
        )}

        {/* PRESET TARGETS TAB */}
        {activeTab === 'presets' && (
          <div className="space-y-2">
            <p className="text-[11px] text-gray-400">Select a verified recipient TARCOIN address:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {PRESET_QR_TARGETS.map((target, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectAddress(target.address)}
                  className="w-full p-3 bg-[#0F1115] hover:bg-[#151820] border border-[#262B36] hover:border-cyan-500/40 rounded-xl text-left transition-all flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white group-hover:text-cyan-300">
                        {target.name}
                      </p>
                      <span className="text-[9px] font-semibold bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800/40">
                        {target.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono truncate max-w-[260px]">
                      {target.address}
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FILE UPLOAD TAB */}
        {activeTab === 'upload' && (
          <div className="p-6 bg-[#0F1115] border border-dashed border-[#262B36] hover:border-cyan-500/40 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 transition-colors">
            <div className="w-12 h-12 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Upload QR Code Image</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                PNG, JPG, or WEBP image containing a TARCOIN QR code
              </p>
            </div>

            <label className="cursor-pointer px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20">
              <span>Choose Image File</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Selected Result Confirmation Pill */}
        {scannedResult && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2 truncate">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-mono truncate">{scannedResult}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-400">Selected</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
