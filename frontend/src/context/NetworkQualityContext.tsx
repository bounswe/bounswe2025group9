/**
 * Network Quality Context
 * Provides global network quality state and user preferences
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  NetworkQuality,
  getBestNetworkQuality,
  onNetworkQualityChange,
  saveNetworkQualityPreference,
  getSavedNetworkQualityPreference,
} from '../lib/networkSpeed';

interface NetworkQualityContextType {
  /** Current network quality (auto-detected or user preference) */
  quality: NetworkQuality;
  /** Auto-detected network quality */
  detectedQuality: NetworkQuality;
  /** User's manual preference (null if auto) */
  userPreference: NetworkQuality | null;
  /** Whether user has enabled manual override */
  isManualOverride: boolean;
  /** Set user's manual quality preference */
  setQualityPreference: (quality: NetworkQuality | null) => void;
  /** Reset to auto-detection */
  resetToAuto: () => void;
}

const NetworkQualityContext = createContext<NetworkQualityContextType | undefined>(undefined);

interface NetworkQualityProviderProps {
  children: ReactNode;
}

/**
 * Provider component for network quality context
 */
export function NetworkQualityProvider({ children }: NetworkQualityProviderProps) {
  const [detectedQuality, setDetectedQuality] = useState<NetworkQuality>('medium');
  const [userPreference, setUserPreference] = useState<NetworkQuality | null>(null);

  // Initialize on mount
  useEffect(() => {
    // Load saved preference
    const savedPreference = getSavedNetworkQualityPreference();
    setUserPreference(savedPreference);

    // Get initial detected quality
    const initialQuality = getBestNetworkQuality();
    setDetectedQuality(initialQuality);

    // Listen for network quality changes
    const cleanup = onNetworkQualityChange((quality) => {
      setDetectedQuality(quality);
    });

    return cleanup;
  }, []);

  const setQualityPreference = (quality: NetworkQuality | null) => {
    setUserPreference(quality);
    if (quality) {
      saveNetworkQualityPreference(quality);
    } else {
      localStorage.removeItem('networkQualityPreference');
    }
  };

  const resetToAuto = () => {
    setQualityPreference(null);
  };

  const currentQuality = userPreference || detectedQuality;

  const value: NetworkQualityContextType = {
    quality: currentQuality,
    detectedQuality,
    userPreference,
    isManualOverride: userPreference !== null,
    setQualityPreference,
    resetToAuto,
  };

  return (
    <NetworkQualityContext.Provider value={value}>
      {children}
    </NetworkQualityContext.Provider>
  );
}

/**
 * Hook to use network quality context
 */
export function useNetworkQuality(): NetworkQualityContextType {
  const context = useContext(NetworkQualityContext);
  if (!context) {
    throw new Error('useNetworkQuality must be used within NetworkQualityProvider');
  }
  return context;
}

/**
 * Network Quality Settings Component
 * Allows users to manually control image quality
 */
export function NetworkQualitySettings() {
  const {
    quality,
    detectedQuality,
    isManualOverride,
    setQualityPreference,
    resetToAuto,
  } = useNetworkQuality();

  const qualities: Array<{ value: NetworkQuality; label: string; description: string }> = [
    { value: 'high', label: 'High Quality', description: 'Best for fast connections (5+ Mbps)' },
    { value: 'medium', label: 'Medium Quality', description: 'Balanced quality and speed' },
    { value: 'low', label: 'Low Quality', description: 'Save data on slow connections' },
  ];

  return (
    <div className="network-quality-settings">
      <h3 className="text-lg font-semibold mb-4">Image Quality Settings</h3>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Current Quality:</span>
          <span className="font-medium capitalize">{quality}</span>
        </div>
        
        {!isManualOverride && (
          <div className="text-xs text-gray-500">
            Auto-detected: {detectedQuality} quality
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="radio"
            id="quality-auto"
            name="quality"
            checked={!isManualOverride}
            onChange={() => resetToAuto()}
            className="mr-2"
          />
          <label htmlFor="quality-auto" className="cursor-pointer">
            <div className="font-medium">Auto (Recommended)</div>
            <div className="text-xs text-gray-500">
              Automatically adjust based on your connection
            </div>
          </label>
        </div>

        {qualities.map(({ value, label, description }) => (
          <div key={value} className="flex items-center">
            <input
              type="radio"
              id={`quality-${value}`}
              name="quality"
              checked={isManualOverride && quality === value}
              onChange={() => setQualityPreference(value)}
              className="mr-2"
            />
            <label htmlFor={`quality-${value}`} className="cursor-pointer">
              <div className="font-medium">{label}</div>
              <div className="text-xs text-gray-500">{description}</div>
            </label>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Lower quality images load faster and use less data, 
          which is great for mobile connections or limited data plans.
        </p>
      </div>
    </div>
  );
}

export default NetworkQualityProvider;

