import { useEffect } from 'react';
import { DEFAULT_GA_ID } from './analytics-constants';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

interface GoogleAnalyticsProps {
  measurementId?: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  // Use provided measurement ID or default to the TFTPad GA ID
  const gaId = measurementId || DEFAULT_GA_ID;

  useEffect(() => {
    // Load Google Analytics script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script1);

    // Initialize gtag (matching the provided code exactly)
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(...args: unknown[]) {
      window.dataLayer.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', gaId);

    return () => {
      // Cleanup: remove the script when component unmounts
      const existingScript = document.querySelector(`script[src*="${gaId}"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [gaId]);

  return null;
}

// Helper function to track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Helper function to track page views
export const trackPageView = (page_title: string, page_location?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-2J0VEH6V5E', {
      page_title: page_title,
      page_location: page_location || window.location.href,
    });
  }
}; 