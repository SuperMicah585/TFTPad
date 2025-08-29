import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import ReactGA from 'react-ga4';

function getPageTitle(pathname: string): string {
  switch (pathname) {
    case '/':
      return 'TFTPad - Home';
    case '/blog':
      return 'TFTPad - Blog';
    case '/contact':
      return 'TFTPad - Contact';
    case '/groups':
      return 'TFTPad - Groups - Browse Groups';
    case '/my-groups':
      return 'TFTPad - Groups - My Groups & Invitations';
    case '/players':
      return 'TFTPad - Groups - Players';
    case '/invitations':
      return 'TFTPad - Groups - Invitations';
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
      if (pathname.startsWith('/groups/') && pathname !== '/groups/') {
        return 'TFTPad - Group Details';
      }
      if (pathname.startsWith('/players/') && pathname !== '/players/') {
        return 'TFTPad - Player Profile';
      }
      return 'TFTPad';
  }
}

export function PageViewTracker() {
  const location = useLocation();
  
  useEffect(() => {
    const pageTitle = getPageTitle(location.pathname);
    document.title = pageTitle;
    
    // Track page view with react-ga4
    ReactGA.send({ 
      hitType: "pageview", 
      page: location.pathname,
      title: pageTitle
    });
    
  }, [location]);
  
  return null;
} 