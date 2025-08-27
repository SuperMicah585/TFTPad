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
    console.log('🔍 Initializing Google Analytics with ID:', gaId);
    
    // Add a visible indicator for debugging
    const debugDiv = document.createElement('div');
    debugDiv.id = 'ga-debug';
    debugDiv.style.cssText = 'position:fixed;top:10px;right:10px;background:red;color:white;padding:5px;z-index:9999;font-size:12px;';
    debugDiv.textContent = `GA: ${gaId}`;
    document.body.appendChild(debugDiv);
    
    // Load Google Analytics script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script1);

    // Initialize gtag (matching the provided code exactly)
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(...args: unknown[]) {
      window.dataLayer.push(args);
      console.log('📊 Google Analytics Event:', args);
      // Update debug indicator
      if (debugDiv) {
        debugDiv.style.background = 'green';
        debugDiv.textContent = `GA: ${gaId} ✅`;
      }
    };
    window.gtag('js', new Date());
    window.gtag('config', gaId);
    
    console.log('✅ Google Analytics initialized successfully');

    return () => {
      // Cleanup: remove the script when component unmounts
      const existingScript = document.querySelector(`script[src*="${gaId}"]`);
      if (existingScript) {
        existingScript.remove();
      }
      if (debugDiv) {
        debugDiv.remove();
      }
    };
  }, [gaId]);

  return null;
}

// Helper function to track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    console.log('📊 Tracking event:', { action, category, label, value });
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  } else {
    console.warn('⚠️ Google Analytics not available for event tracking');
  }
};

// Helper function to track page views
export const trackPageView = (page_title: string, page_location?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    console.log('📊 Tracking page view:', { page_title, page_location });
    window.gtag('config', DEFAULT_GA_ID, {
      page_title: page_title,
      page_location: page_location || window.location.href,
    });
  } else {
    console.warn('⚠️ Google Analytics not available for page view tracking');
  }
};

// Enhanced event tracking functions for specific user interactions
export const trackNavigation = (destination: string) => {
  trackEvent('navigation_click', 'navigation', destination, undefined);
};

export const trackButtonClick = (buttonName: string) => {
  trackEvent('button_click', 'engagement', buttonName, undefined);
};

export const trackFormSubmission = (formName: string) => {
  trackEvent('form_submit', 'engagement', formName, undefined);
};

export const trackLinkClick = (linkText: string, destination: string) => {
  trackEvent('link_click', 'engagement', `${linkText} -> ${destination}`, undefined);
};

export const trackSearch = (searchTerm: string) => {
  trackEvent('search', 'engagement', searchTerm, undefined);
};

export const trackFilter = (filterType: string, filterValue: string) => {
  trackEvent('filter_apply', 'engagement', `${filterType}: ${filterValue}`, undefined);
};

export const trackModalOpen = (modalName: string) => {
  trackEvent('modal_open', 'engagement', modalName, undefined);
};

export const trackLogin = (method: string) => {
  trackEvent('login', 'authentication', method, undefined);
};

export const trackLogout = () => {
  trackEvent('logout', 'authentication', 'user_logout', undefined);
};

export const trackProfileAction = (action: string) => {
  trackEvent('profile_action', 'user_profile', action, undefined);
};

export const trackStudyGroupAction = (action: string) => {
  trackEvent('study_group_action', 'study_groups', action, undefined);
};

export const trackBlogInteraction = (action: string) => {
  trackEvent('blog_interaction', 'content', action, undefined);
};

export const trackContactForm = (subject: string) => {
  trackEvent('contact_form', 'engagement', subject, undefined);
}; 