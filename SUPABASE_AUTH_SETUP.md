# Supabase Authentication Setup Guide

This guide will help you set up Supabase authentication for the TFTPad application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Setup Steps

### 1. Create Environment Variables

Create a `.env` file in your project root with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_SERVER_URL=http://localhost:5001
```

### 2. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "Project URL" and paste it as `VITE_SUPABASE_URL`
4. Copy the "anon public" key and paste it as `VITE_SUPABASE_ANON_KEY`

### 3. Configure Authentication Settings

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:5173` for development)
3. Add redirect URLs:
   - `http://localhost:5173/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)
4. Configure email templates if desired

### 4. Enable OAuth Providers

1. Go to Authentication > Providers
2. Enable Discord:
   - Set up a Discord application at https://discord.com/developers/applications
   - Add your Discord Client ID and Secret
   - Set redirect URL to: `https://your-project.supabase.co/auth/v1/callback`
3. Enable Google:
   - Set up a Google OAuth application in Google Cloud Console
   - Add your Google Client ID and Secret
   - Set redirect URL to: `https://your-project.supabase.co/auth/v1/callback`

### 5. Database Setup

The application expects the following table structure:

```sql
-- Users table (simplified)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 6. Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to your app
3. Click "Sign In" and try signing in with Discord or Google
4. Check that the authentication flow works correctly

## Features

### Authentication Methods
- **Discord OAuth**: Users can sign in with their Discord account
- **Google OAuth**: Users can sign in with their Google account

### User Management
- Automatic user creation in the database upon first sign-in
- Session management handled by Supabase
- Secure token-based authentication

### Security
- JWT tokens managed by Supabase
- Row Level Security (RLS) policies
- Secure OAuth redirects

## Troubleshooting

### Common Issues

1. **Redirect URL Mismatch**: Ensure your redirect URLs are correctly configured in both Supabase and your OAuth providers.

2. **CORS Issues**: Make sure your site URL is properly configured in Supabase authentication settings.

3. **Environment Variables**: Verify that all environment variables are correctly set and accessible.

4. **Database Permissions**: Ensure RLS policies are correctly configured for your users table.

### Debug Mode

To enable debug logging, add this to your `.env` file:

```env
VITE_DEBUG=true
```

## Migration from Riot Authentication

If you're migrating from the previous Riot authentication system:

1. **User Data**: Existing user data will need to be migrated to the new schema
2. **Sessions**: All existing sessions will be invalidated
3. **Features**: Some features may need to be updated to work with the new authentication system

## Next Steps

After setting up authentication:

1. Configure your production environment
2. Set up proper error handling and logging
3. Test the authentication flow thoroughly
4. Update any components that depend on the old authentication system
