import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  trackEvent, 
  trackNavigation, 
  trackButtonClick, 
  trackFormSubmission, 
  trackLinkClick, 
  trackSearch, 
  trackFilter, 
  trackModalOpen, 
  trackLogin, 
  trackLogout, 
  trackProfileAction, 
  trackStudyGroupAction, 
  trackBlogInteraction, 
  trackContactForm 
} from '../components/GoogleAnalytics';

export const useAnalytics = () => {
  const location = useLocation();

  const trackPageInteraction = useCallback((action: string, category: string, label?: string, value?: number) => {
    trackEvent(action, category, label, value);
  }, []);

  const trackNavClick = useCallback((destination: string) => {
    trackNavigation(destination);
  }, []);

  const trackButtonInteraction = useCallback((buttonName: string) => {
    trackButtonClick(buttonName);
  }, []);

  const trackFormSubmit = useCallback((formName: string) => {
    trackFormSubmission(formName);
  }, []);

  const trackLinkInteraction = useCallback((linkText: string, destination: string) => {
    trackLinkClick(linkText, destination);
  }, []);

  const trackSearchQuery = useCallback((searchTerm: string) => {
    trackSearch(searchTerm);
  }, []);

  const trackFilterChange = useCallback((filterType: string, filterValue: string) => {
    trackFilter(filterType, filterValue);
  }, []);

  const trackModalInteraction = useCallback((modalName: string) => {
    trackModalOpen(modalName);
  }, []);

  const trackAuthLogin = useCallback((method: string) => {
    trackLogin(method);
  }, []);

  const trackAuthLogout = useCallback(() => {
    trackLogout();
  }, []);

  const trackUserProfileAction = useCallback((action: string) => {
    trackProfileAction(action);
  }, []);

  const trackStudyGroupInteraction = useCallback((action: string) => {
    trackStudyGroupAction(action);
  }, []);

  const trackBlogPostInteraction = useCallback((action: string) => {
    trackBlogInteraction(action);
  }, []);

  const trackContactSubmission = useCallback((subject: string) => {
    trackContactForm(subject);
  }, []);

  return {
    trackPageInteraction,
    trackNavClick,
    trackButtonInteraction,
    trackFormSubmit,
    trackLinkInteraction,
    trackSearchQuery,
    trackFilterChange,
    trackModalInteraction,
    trackAuthLogin,
    trackAuthLogout,
    trackUserProfileAction,
    trackStudyGroupInteraction,
    trackBlogPostInteraction,
    trackContactSubmission,
    currentPage: location.pathname
  };
};
