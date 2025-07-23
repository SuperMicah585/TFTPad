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
      return 'TFTPad - Study Groups';
    case '/study-groups/groups':
      return 'TFTPad - Study Groups - Browse Groups';
    case '/study-groups/my-groups':
      return 'TFTPad - Study Groups - My Groups & Invitations';
    case '/study-groups/free-agents':
      return 'TFTPad - Study Groups - Free Agents';
    case '/study-groups/invitations':
      return 'TFTPad - Study Groups - Invitations';
    case '/tracker':
      return 'TFTPad - Tracker';
    case '/tracker/game':
      return 'TFTPad - Tracker - Game';
    case '/tracker/units':
      return 'TFTPad - Tracker - Units';
    case '/tracker/comps':
      return 'TFTPad - Tracker - Comps';
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
    default:
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