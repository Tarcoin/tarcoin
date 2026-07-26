export const cakeObsidianTheme = {
  name: 'Cake Obsidian (Dark)',
  colors: {
    bgPrimary: '#0F1115', // Deep obsidian black requested in Objective 2
    bgSurface: '#1A1D24', // Subtle surface color for circular buttons
    bgSurfaceHover: '#252932',
    bgSurfaceActive: '#2E3440',
    borderSubtle: '#262B36',
    
    textPrimary: '#FFFFFF',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    
    accentTarcoin: '#00E5FF', // Vibrant Cyan for TARCOIN
    accentOrange: '#F7931A',
    accentSuccess: '#10B981',
    accentDanger: '#EF4444',
    accentWarning: '#F59E0B',
    
    dotEmpty: '#262B36',
    dotFilled: '#00E5FF',
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  borderRadius: {
    circle: '9999px',
    card: '16px',
    button: '12px',
  },
};

export const blueWalletClassicTheme = {
  name: 'BlueWallet Classic',
  colors: {
    bgPrimary: '#0A1128',
    bgSurface: '#121F45',
    bgSurfaceHover: '#1B2C5D',
    bgSurfaceActive: '#243A75',
    borderSubtle: '#1E3266',
    
    textPrimary: '#FFFFFF',
    textSecondary: '#8CA0D7',
    textMuted: '#5168A0',
    
    accentTarcoin: '#007AFF',
    accentOrange: '#F7931A',
    accentSuccess: '#34C759',
    accentDanger: '#FF3B30',
    accentWarning: '#FF9500',
    
    dotEmpty: '#1E3266',
    dotFilled: '#007AFF',
  },
};

export type WalletTheme = typeof cakeObsidianTheme;
