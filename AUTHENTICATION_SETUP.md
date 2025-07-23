# Supabase Authentication Setup

This guide will help you set up Supabase authentication for your TFTPad application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Setup Steps

### 1. Create Environment Variables

Create a `.env` file in your project root with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
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
3. Add any additional redirect URLs as needed
4. Configure email templates if desired

### 4. Enable Email Authentication

1. Go to Authentication > Providers
2. Ensure "Email" provider is enabled
3. Configure email confirmation settings

### 5. Database Setup (Optional)

If you want to store additional user data, create a `profiles` table:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 6. Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to your app
3. Try signing up with a new email
4. Check your email for the confirmation link
5. Sign in with your credentials

## Features Included

- ✅ User registration with email confirmation
- ✅ User login/logout
- ✅ Protected routes
- ✅ User menu with profile information
- ✅ Mobile-responsive authentication UI
- ✅ Loading states and error handling

## Usage

### Protecting Routes

Wrap any component that requires authentication:

```tsx
import { ProtectedRoute } from './components/auth/ProtectedRoute'

<Route 
  path="/protected" 
  element={
    <ProtectedRoute>
      <ProtectedComponent />
    </ProtectedRoute>
  } 
/>
```

### Using Authentication in Components

```tsx
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, signOut } = useAuth()
  
  if (!user) {
    return <div>Please sign in</div>
  }
  
  return <div>Welcome, {user.email}!</div>
}
```

## Troubleshooting

### Common Issues

1. **Environment variables not loading**: Make sure your `.env` file is in the project root and variables start with `VITE_`
2. **Email not received**: Check your spam folder and verify email settings in Supabase
3. **Authentication errors**: Check the browser console for detailed error messages
4. **CORS issues**: Ensure your site URL is correctly configured in Supabase

### Getting Help

- Check the [Supabase documentation](https://supabase.com/docs)
- Review the [Supabase Auth documentation](https://supabase.com/docs/guides/auth)
- Check the browser console for error messages 