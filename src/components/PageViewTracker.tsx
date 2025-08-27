import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { trackPageView } from './GoogleAnalytics';

function getPageTitle(pathname: string): string {
  switch (pathname) {
    case '/':
      return 'TFTPad - Home';
    case '/blog':
      return 'TFTPad - Blog';
    case '/contact':
      return 'TFTPad - Contact';
    case '/study-groups':
      return 'TFTPad - Study Groups - Browse Groups';
    case '/my-groups':
      return 'TFTPad - Study Groups - My Groups & Invitations';
    case '/free-agents':
      return 'TFTPad - Study Groups - Free Agents';
    case '/invitations':
      return 'TFTPad - Study Groups - Invitations';
    case '/profile':
      return 'TFTPad - Profile';
    // Blog posts
    case '/blog/defensive-stats':
      return 'TFTPad - Defensive Stats';
    case '/blog/champion-pool':
      return 'TFTPad - Champion Pool';
    case '/blog/econ':
      return 'TFTPad - Econ';
    case '/blog/positioning-units':
      return 'TFTPad - Positioning Units';
    case '/blog/base-stats-comparison':
      return 'TFTPad - Base Stats Comparison';
    case '/blog/item-pool':
      return 'TFTPad - Item Pool';
    case '/blog/understanding-dmg':
      return 'TFTPad - Understanding DMG';
    case '/blog/mana':
      return 'TFTPad - Mana';
    // Dynamic routes
    default:
      if (pathname.startsWith('/study-groups/') && pathname !== '/study-groups/') {
        return 'TFTPad - Study Group Details';
      }
      if (pathname.startsWith('/free-agents/') && pathname !== '/free-agents/') {
        return 'TFTPad - Free Agent Profile';
      }
      return 'TFTPad';
  }
}

export function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    const pageTitle = getPageTitle(location.pathname);
    document.title = pageTitle;
    trackPageView(pageTitle, window.location.href);
  }, [location]);
  return null;
} 