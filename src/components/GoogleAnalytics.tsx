import { useEffect } from 'react';
import ReactGA from 'react-ga4';
import { DEFAULT_GA_ID } from './analytics-constants';

interface GoogleAnalyticsProps {
  measurementId?: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const gaId = measurementId || DEFAULT_GA_ID;

  useEffect(() => {
    // Initialize react-ga4
    ReactGA.initialize(gaId, {
      gaOptions: {
        siteSpeedSampleRate: 100
      }
    });
    
    // Track initial page view
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
    
    // Test event to verify GA is working
    ReactGA.event({
      action: 'app_loaded',
      category: 'app_lifecycle',
      label: 'react_ga4_initialized'
    });
    
  }, [gaId]);

  return null;
}

// Helper function to track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  ReactGA.event({
    action: action,
    category: category,
    label: label,
    value: value
  });
};

// Helper function to track page views
export const trackPageView = (page_title: string, page_location?: string) => {
  ReactGA.send({ 
    hitType: "pageview", 
    page: page_location || window.location.pathname,
    title: page_title
  });
};

// Test function to verify GA is working
export const testGoogleAnalytics = () => {
  ReactGA.event({
    action: 'manual_test',
    category: 'debug',
    label: 'test_event_' + Date.now()
  });
};

// Enhanced event tracking functions for specific user interactions
export const trackNavigation = (destination: string) => {
  trackEvent('navigation_click', 'navigation', destination);
};

export const trackButtonClick = (buttonName: string) => {
  trackEvent('button_click', 'engagement', buttonName);
};

export const trackFormSubmission = (formName: string) => {
  trackEvent('form_submit', 'engagement', formName);
};

export const trackLinkClick = (linkText: string, destination: string) => {
  trackEvent('link_click', 'engagement', `${linkText} -> ${destination}`);
};

export const trackSearch = (searchTerm: string) => {
  trackEvent('search', 'engagement', searchTerm);
};

export const trackFilter = (filterType: string, filterValue: string) => {
  trackEvent('filter_apply', 'engagement', `${filterType}: ${filterValue}`);
};

export const trackModalOpen = (modalName: string) => {
  trackEvent('modal_open', 'engagement', modalName);
};

export const trackLogin = (method: string) => {
  trackEvent('login', 'authentication', method);
};

export const trackLogout = () => {
  trackEvent('logout', 'authentication', 'user_logout');
};

export const trackProfileAction = (action: string) => {
  trackEvent('profile_action', 'user_profile', action);
};

export const trackStudyGroupAction = (action: string) => {
  trackEvent('study_group_action', 'study_groups', action);
};

export const trackBlogInteraction = (action: string) => {
  trackEvent('blog_interaction', 'content', action);
};

export const trackContactForm = (subject: string) => {
  trackEvent('contact_form', 'engagement', subject);
}; 