/**
 * AdaptiveImage Component
 * Automatically loads the appropriate image quality based on network speed
 */

import { useState, useEffect, ImgHTMLAttributes } from 'react';
import { getBestNetworkQuality, onNetworkQualityChange, NetworkQuality } from '../lib/networkSpeed';
import '../styles/AdaptiveImage.css';

interface FoodImageUrls {
  imageUrlHigh?: string;
  imageUrlMedium?: string;
  imageUrlLow?: string;
  imageUrl?: string; // Fallback for legacy data
}

interface AdaptiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** Image URLs for different quality levels */
  images: FoodImageUrls;
  /** Alt text for the image */
  alt: string;
  /** Override the automatic quality selection */
  forceQuality?: NetworkQuality;
  /** Fallback image URL if no optimized images are available */
  fallbackSrc?: string;
  /** Callback when image loads successfully */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
}

/**
 * Get the appropriate image URL based on quality level
 */
function getImageUrlByQuality(images: FoodImageUrls, quality: NetworkQuality): string | undefined {
  switch (quality) {
    case 'high':
      return images.imageUrlHigh || images.imageUrlMedium || images.imageUrlLow || images.imageUrl;
    case 'medium':
      return images.imageUrlMedium || images.imageUrlLow || images.imageUrlHigh || images.imageUrl;
    case 'low':
      return images.imageUrlLow || images.imageUrlMedium || images.imageUrlHigh || images.imageUrl;
    default:
      return images.imageUrlMedium || images.imageUrl;
  }
}

/**
 * AdaptiveImage component that loads images based on network quality
 */
export function AdaptiveImage({
  images,
  alt,
  forceQuality,
  fallbackSrc = '/assets/placeholder-food.png',
  onLoad,
  onError,
  className = '',
  ...props
}: AdaptiveImageProps) {
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>('medium');
  const [imageSrc, setImageSrc] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Detect network quality on mount and listen for changes
  useEffect(() => {
    if (forceQuality) {
      setNetworkQuality(forceQuality);
      return;
    }

    // Get initial quality
    const initialQuality = getBestNetworkQuality();
    setNetworkQuality(initialQuality);

    // Listen for network changes
    const cleanup = onNetworkQualityChange((quality) => {
      setNetworkQuality(quality);
    });

    return cleanup;
  }, [forceQuality]);

  // Update image source when quality changes
  useEffect(() => {
    const url = getImageUrlByQuality(images, networkQuality);
    setImageSrc(url || fallbackSrc);
    setIsLoading(true);
    setHasError(false);
  }, [images, networkQuality, fallbackSrc]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    
    // Try fallback if current image failed
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
    
    onError?.();
  };

  return (
    <div className={`adaptive-image-container ${className}`} {...props}>
      <img
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`adaptive-image ${isLoading ? 'loading' : ''} ${hasError ? 'error' : ''}`}
        loading="lazy"
        {...props}
      />
      {isLoading && (
        <div className="adaptive-image-loader" aria-label="Loading image">
          {/* Optional: Add a loading spinner or skeleton */}
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to use adaptive image URL
 * Returns the appropriate image URL based on current network quality
 */
export function useAdaptiveImageUrl(images: FoodImageUrls, forceQuality?: NetworkQuality): string {
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>('medium');

  useEffect(() => {
    if (forceQuality) {
      setNetworkQuality(forceQuality);
      return;
    }

    const initialQuality = getBestNetworkQuality();
    setNetworkQuality(initialQuality);

    const cleanup = onNetworkQualityChange((quality) => {
      setNetworkQuality(quality);
    });

    return cleanup;
  }, [forceQuality]);

  return getImageUrlByQuality(images, networkQuality) || '/assets/placeholder-food.png';
}

/**
 * Preload an image for better performance
 */
export function preloadImage(images: FoodImageUrls, quality?: NetworkQuality): Promise<void> {
  return new Promise((resolve, reject) => {
    const qualityToUse = quality || getBestNetworkQuality();
    const url = getImageUrlByQuality(images, qualityToUse);
    
    if (!url) {
      reject(new Error('No image URL available'));
      return;
    }

    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

export default AdaptiveImage;

