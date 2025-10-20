/**
 * Network speed detection utility
 * Detects the user's network speed and provides appropriate quality level for images
 */

export type NetworkQuality = 'high' | 'medium' | 'low';

interface NetworkSpeedInfo {
  quality: NetworkQuality;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

/**
 * Get the network connection information using the Network Information API
 */
function getNetworkInfo(): NetworkSpeedInfo {
  // Check if Network Information API is available
  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

  if (connection) {
    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink; // Mbps
    const rtt = connection.rtt; // Round-trip time in ms

    // Determine quality based on effective type and downlink
    let quality: NetworkQuality = 'medium';

    if (effectiveType === '4g' && downlink && downlink >= 5) {
      quality = 'high';
    } else if (effectiveType === '4g' || (effectiveType === '3g' && downlink && downlink >= 1)) {
      quality = 'medium';
    } else {
      quality = 'low';
    }

    return { quality, effectiveType, downlink, rtt };
  }

  // Fallback: Assume medium quality if API is not available
  return { quality: 'medium' };
}

/**
 * Test actual download speed by downloading a small test file
 * This is more accurate but takes time
 */
async function measureActualSpeed(): Promise<NetworkQuality> {
  try {
    // Use a small image to test speed (you can use one of your own images)
    const testUrl = '/api/speedtest-dummy.jpg';
    
    const startTime = performance.now();
    const response = await fetch(testUrl, { cache: 'no-cache' });
    
    if (!response.ok) {
      throw new Error('Speed test failed');
    }
    
    const blob = await response.blob();
    const endTime = performance.now();
    
    const durationInSeconds = (endTime - startTime) / 1000;
    const speedMbps = (blob.size * 8) / (durationInSeconds * 1000000);
    
    // Classify based on speed
    if (speedMbps >= 5) {
      return 'high';
    } else if (speedMbps >= 1.5) {
      return 'medium';
    } else {
      return 'low';
    }
  } catch (error) {
    console.warn('Speed test failed, using default quality:', error);
    return 'medium';
  }
}

/**
 * Get the current network quality
 * Uses Network Information API if available, otherwise returns a sensible default
 */
export function getNetworkQuality(): NetworkQuality {
  const info = getNetworkInfo();
  return info.quality;
}

/**
 * Listen for network quality changes
 */
export function onNetworkQualityChange(callback: (quality: NetworkQuality) => void): () => void {
  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

  if (!connection) {
    // If API not available, just call callback once with current quality
    callback(getNetworkQuality());
    return () => {};
  }

  const handleChange = () => {
    const info = getNetworkInfo();
    callback(info.quality);
  };

  connection.addEventListener('change', handleChange);

  // Call immediately with current value
  handleChange();

  // Return cleanup function
  return () => {
    connection.removeEventListener('change', handleChange);
  };
}

/**
 * Get network quality with optional speed test
 * @param performSpeedTest - Whether to perform an actual speed test (slower but more accurate)
 */
export async function getNetworkQualityWithTest(performSpeedTest: boolean = false): Promise<NetworkQuality> {
  if (performSpeedTest) {
    return await measureActualSpeed();
  }
  return getNetworkQuality();
}

/**
 * Save network quality preference to localStorage
 */
export function saveNetworkQualityPreference(quality: NetworkQuality): void {
  try {
    localStorage.setItem('networkQualityPreference', quality);
  } catch (error) {
    console.warn('Failed to save network quality preference:', error);
  }
}

/**
 * Get saved network quality preference from localStorage
 */
export function getSavedNetworkQualityPreference(): NetworkQuality | null {
  try {
    const saved = localStorage.getItem('networkQualityPreference');
    if (saved === 'high' || saved === 'medium' || saved === 'low') {
      return saved;
    }
  } catch (error) {
    console.warn('Failed to load network quality preference:', error);
  }
  return null;
}

/**
 * Get the best network quality to use
 * Considers saved preference, detected quality, and user's data saver mode
 */
export function getBestNetworkQuality(): NetworkQuality {
  // Check if user has enabled data saver mode
  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
  
  if (connection?.saveData) {
    return 'low';
  }

  // Check for saved preference
  const savedPreference = getSavedNetworkQualityPreference();
  if (savedPreference) {
    return savedPreference;
  }

  // Use detected quality
  return getNetworkQuality();
}

