# Environment Variables Setup for TFTpad

This document explains how to set up environment variables for the TFTpad project to keep sensitive configuration data secure.

## Project Structure

This project has separate frontend and backend deployments, so we use different environment files:

- **Frontend**: Uses `.env` file (React/Vite frontend)
- **Backend**: Uses `backend.env` file (Flask API backend)

## Quick Setup

### For Frontend Development
1. Copy the `env_template.txt` file to `.env`:
   ```bash
   cp env_template.txt .env
   ```

2. Edit the `.env` file with your frontend-specific values

### For Backend Development/Deployment
1. Use the `backend.env` file for your Flask backend:
   ```bash
   cp backend.env .env
   # or keep it as backend.env and load it specifically
   ```

2. Edit the `backend.env` file with your backend-specific values

3. Make sure both `.env` and `backend.env` are in your `.gitignore` file to prevent committing secrets

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Your Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `REDIS_HOST` | Redis server hostname | `your-redis-host.com` |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD` | Redis server password | `your-redis-password` |
| `REDIS_DB` | Redis database number | `0` |
| `RIOT_API_KEY` | Riot Games API key | `RGAPI-your-api-key-here` |
| `JWT_SECRET_KEY` | Secret key for JWT token signing | `your-secret-key-change-in-production` |

### Optional Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `FLASK_ENV` | Flask environment | `production` |
| `FLASK_DEBUG` | Flask debug mode | `False` |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `http://localhost:5173,https://tftpad.com` |
| `TFT_SET` | Current TFT set | `TFTSET15` |
| `FLASK_API_BASE_URL` | Base URL for Flask API (used by rank_audit_processor) | `https://tftpad-phelpsm4.pythonanywhere.com` |

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong, unique secrets** for production
3. **Rotate API keys** regularly
4. **Use different values** for development and production environments
5. **Limit access** to environment variables to only necessary personnel

## Production Deployment

### Backend Deployment (Flask API)

For backend deployment, set environment variables through your hosting platform:

- **PythonAnywhere**: 
  - Copy `backend.env` to your server
  - Set environment variables in the WSGI configuration file
  - Or use the web app settings to configure environment variables
- **Heroku**: Use `heroku config:set VARIABLE_NAME=value`
- **Docker**: Use `-e` flags or docker-compose environment files
- **AWS/GCP**: Use their respective secret management services

### Frontend Deployment (React/Vite)

For frontend deployment:
- **Vercel/Netlify**: Set environment variables in the platform dashboard
- **Static hosting**: Use build-time environment variables
- **Docker**: Use `-e` flags or docker-compose environment files

### Backend-Specific Configuration

The `backend.env` file contains all the variables needed for your Flask API:
- Database connections (Supabase)
- Redis cache configuration
- Riot Games API access
- JWT token signing
- CORS settings for your frontend domain

## Troubleshooting

If you encounter issues:

1. **Check that `.env` file exists** in the project root
2. **Verify all required variables** are set
3. **Ensure `python-dotenv` is installed**: `pip install python-dotenv`
4. **Check file permissions** on the `.env` file
5. **Restart your application** after making changes

## Example .env File

```env
# Supabase Configuration
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key-here

# Redis Configuration
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Riot Games API Configuration
RIOT_API_KEY=your-riot-api-key-here

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production

# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=False

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com

# TFT Configuration
TFT_SET=TFTSET15
```
