# Google Analytics Setup and Event Tracking

## Overview

This document outlines the comprehensive Google Analytics setup for TFTPad, including page view tracking and custom event tracking for user interactions.

## Configuration

### Google Analytics ID
- **Measurement ID**: `G-2J0VEH6V5E`
- **Location**: `src/components/analytics-constants.ts`

### Core Components

#### 1. GoogleAnalytics Component (`src/components/GoogleAnalytics.tsx`)
- Initializes Google Analytics with the measurement ID
- Provides helper functions for tracking various events
- Handles script loading and cleanup

#### 2. PageViewTracker Component (`src/components/PageViewTracker.tsx`)
- Automatically tracks page views on route changes
- Sets appropriate page titles for each route
- Handles dynamic routes (study group details, free agent profiles)

#### 3. useAnalytics Hook (`src/hooks/useAnalytics.ts`)
- Custom hook providing easy-to-use analytics functions
- Automatically includes current page context
- Centralized analytics interface for components

## Event Tracking Categories

### 1. Navigation Events
- **Category**: `navigation`
- **Events**: Navigation clicks between pages
- **Implementation**: `trackNavigation(destination, source)`

### 2. Engagement Events
- **Category**: `engagement`
- **Events**: Button clicks, form submissions, link clicks, search queries, filter applications, modal opens
- **Implementation**: Various functions like `trackButtonClick`, `trackFormSubmission`, etc.

### 3. Authentication Events
- **Category**: `authentication`
- **Events**: Login, logout
- **Implementation**: `trackLogin(method)`, `trackLogout()`

### 4. User Profile Events
- **Category**: `user_profile`
- **Events**: Profile actions, account deletion
- **Implementation**: `trackProfileAction(action)`

### 5. Study Group Events
- **Category**: `study_groups`
- **Events**: Join requests, group interactions
- **Implementation**: `trackStudyGroupAction(action, groupId)`

### 6. Content Events
- **Category**: `content`
- **Events**: Blog post interactions
- **Implementation**: `trackBlogInteraction(action, blogPost)`

## Page-Specific Tracking

### 1. Header Navigation (`src/components/header.tsx`)
- Tracks navigation clicks for all main navigation links
- Includes source page information

### 2. Contact Page (`src/components/ContactPage.tsx`)
- Tracks contact form submissions
- Captures subject line for analysis

### 3. Blog Page (`src/components/BlogPage.tsx`)
- Tracks blog post clicks
- Records which blog posts are most popular

### 4. Groups Page (`src/components/GroupsPage.tsx`)
- Tracks search queries
- Tracks filter applications
- Tracks modal interactions

### 5. Profile Page (`src/components/ProfilePage.tsx`)
- Tracks profile actions
- Tracks account deletion attempts and completions

### 6. Authentication Components
- **RiotLoginModal**: Tracks successful logins
- **UserMenu**: Tracks logout events

### 7. Group Detail Page (`src/components/GroupDetailPage.tsx`)
- Tracks join request submissions
- Tracks request cancellations

## Implementation Examples

### Basic Event Tracking
```typescript
import { trackEvent } from './GoogleAnalytics';

// Track a custom event
trackEvent('button_click', 'engagement', 'submit_button', 1);
```

### Using the Analytics Hook
```typescript
import { useAnalytics } from '../hooks/useAnalytics';

function MyComponent() {
  const { trackButtonInteraction, trackSearchQuery } = useAnalytics();

  const handleButtonClick = () => {
    trackButtonInteraction('submit_button');
    // ... rest of handler
  };

  const handleSearch = (query: string) => {
    trackSearchQuery(query);
    // ... rest of handler
  };
}
```

### Page View Tracking
```typescript
import { trackPageView } from './GoogleAnalytics';

// Track a custom page view
trackPageView('Custom Page Title', '/custom-page');
```

## Event Data Structure

### Standard Event Format
```typescript
{
  event_category: string,    // Category of the event
  event_label: string,       // Descriptive label
  value: number,            // Optional numeric value
  page_location: string     // Current page URL
}
```

### Example Events

#### Navigation Click
```javascript
{
  event_category: 'navigation',
  event_label: '/study-groups',
  value: undefined
}
```

#### Search Query
```javascript
{
  event_category: 'engagement',
  event_label: 'search_term_here',
  value: undefined
}
```

#### Form Submission
```javascript
{
  event_category: 'engagement',
  event_label: 'contact_form',
  value: undefined
}
```

## Analytics Dashboard Setup

### Recommended Google Analytics Reports

1. **Audience Overview**
   - Page views, users, sessions
   - Geographic data
   - Device categories

2. **Behavior Reports**
   - Page views by page
   - Event tracking data
   - User flow analysis

3. **Custom Reports**
   - Study group interactions
   - Blog post popularity
   - User engagement funnel

### Key Metrics to Monitor

1. **User Engagement**
   - Page views per session
   - Time on page
   - Bounce rate

2. **Feature Usage**
   - Study group searches
   - Blog post clicks
   - Contact form submissions

3. **User Journey**
   - Navigation patterns
   - Conversion funnels
   - Drop-off points

## Testing and Validation

### Testing Event Tracking
1. Open browser developer tools
2. Navigate to Network tab
3. Filter by "google-analytics" or "collect"
4. Perform actions and verify events are sent

### Common Issues and Solutions

1. **Events not firing**
   - Check if Google Analytics is properly initialized
   - Verify measurement ID is correct
   - Ensure no ad blockers are interfering

2. **Missing page views**
   - Check PageViewTracker component
   - Verify route changes are detected
   - Check for JavaScript errors

3. **Inconsistent data**
   - Clear browser cache
   - Check for multiple GA instances
   - Verify event parameters are consistent

## Future Enhancements

### Planned Features
1. **Enhanced E-commerce Tracking**
   - Study group membership conversions
   - Premium feature usage

2. **User Segmentation**
   - Track user behavior by rank
   - Analyze engagement by region

3. **A/B Testing Integration**
   - Track experiment variations
   - Measure conversion differences

4. **Real-time Analytics**
   - Live user activity monitoring
   - Instant feedback on feature usage

### Custom Dimensions and Metrics
Consider adding custom dimensions for:
- User rank/tier
- Geographic region
- Study group membership status
- Feature usage patterns

## Maintenance

### Regular Tasks
1. **Monthly Review**
   - Check event tracking accuracy
   - Review user engagement metrics
   - Update tracking as needed

2. **Quarterly Analysis**
   - Analyze user behavior patterns
   - Identify optimization opportunities
   - Plan new tracking requirements

3. **Annual Audit**
   - Comprehensive tracking review
   - Performance optimization
   - Compliance verification

## Support and Troubleshooting

For issues with Google Analytics tracking:
1. Check browser console for errors
2. Verify network requests to Google Analytics
3. Test with different browsers/devices
4. Review Google Analytics real-time reports
5. Check for ad blocker interference

## Resources

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Google Analytics Events Guide](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [React Router Analytics Integration](https://reactrouter.com/docs/en/v6/start/overview)
