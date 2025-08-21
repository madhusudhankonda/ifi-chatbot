# IFI Chatbot Deployment Guide

This guide walks you through deploying the IFI Chatbot to Render with all required services.

## Prerequisites

1. **Neon Database Account** - [neon.tech](https://neon.tech)
2. **Supabase Account** - [supabase.com](https://supabase.com)
3. **OpenAI API Key** - [platform.openai.com](https://platform.openai.com)
4. **Render Account** - [render.com](https://render.com)
5. **GitHub Repository** - Push your code to GitHub

## Step 1: Database Setup (Neon)

1. **Create Neon Project**:
   - Sign up for Neon at [neon.tech](https://neon.tech)
   - Create a new project
   - Choose a region close to your users

2. **Get Database URL**:
   - Go to your project dashboard
   - Copy the connection string from the "Connection Details" section
   - It should look like: `postgresql://user:password@host:port/database?sslmode=require`

3. **Enable pgvector** (if not automatically enabled):
   - Connect to your database using the SQL editor
   - Run: `CREATE EXTENSION IF NOT EXISTS vector;`

## Step 2: Authentication Setup (Supabase)

1. **Create Supabase Project**:
   - Sign up for Supabase at [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to be ready

2. **Configure Authentication**:
   - Go to Authentication → Settings
   - Enable email authentication
   - Configure any OAuth providers if needed (optional)

3. **Get API Keys**:
   - Go to Settings → API
   - Copy the Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Copy the anon/public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Copy the service_role key (`SUPABASE_SERVICE_ROLE_KEY`)

4. **Set up User Roles** (Optional):
   - In the SQL Editor, you can create policies for role-based access
   - The application handles roles via user metadata

## Step 3: OpenAI API Setup

1. **Get OpenAI API Key**:
   - Go to [platform.openai.com](https://platform.openai.com)
   - Navigate to API Keys
   - Create a new secret key
   - Copy the key (starts with `sk-`)

2. **Set Usage Limits** (Recommended):
   - Set monthly usage limits to control costs
   - Monitor usage through the OpenAI dashboard

## Step 4: Deploy to Render

### Option A: Automatic Deployment (Recommended)

1. **Fork/Clone Repository**:
   - Fork this repository to your GitHub account
   - Or clone and push to your own repository

2. **Connect to Render**:
   - Sign up for Render at [render.com](https://render.com)
   - Connect your GitHub account
   - Click "New +" → "Web Service"
   - Select your repository

3. **Configure Deployment**:
   - **Name**: `ifi-chatbot`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node.js`

### Option B: Manual Configuration

1. **Create Web Service**:
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect repository

2. **Build Settings**:
   ```
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

## Step 5: Environment Variables

In your Render service settings, add these environment variables:

### Required Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=sk-your_openai_api_key

# Next.js
NEXTAUTH_SECRET=your_random_secret_string
NEXTAUTH_URL=https://your-app.onrender.com
```

### Generate NEXTAUTH_SECRET

You can generate a secure secret using:
```bash
openssl rand -base64 32
```

## Step 6: Deploy

1. **Deploy Application**:
   - Click "Deploy" in Render
   - Wait for the build to complete
   - The database tables will be automatically created

2. **Verify Deployment**:
   - Visit your app URL
   - Try creating an account
   - Test the login functionality

## Step 7: Post-Deployment Setup

### Create Admin User

1. **Register Admin Account**:
   - Go to your deployed app
   - Register with email/password
   - Select "Administrator" role during registration

2. **Upload Test Documents**:
   - Login as admin
   - Go to `/admin`
   - Upload a test PDF or DOCX file
   - Verify processing completes

3. **Test Chat Functionality**:
   - Go to `/chat`
   - Ask questions about uploaded documents
   - Verify AI responses are working

## Monitoring & Maintenance

### Performance Monitoring

1. **Render Metrics**:
   - Monitor CPU and memory usage
   - Check response times
   - Review error logs

2. **Database Performance**:
   - Monitor Neon dashboard for query performance
   - Check connection limits
   - Review storage usage

### Cost Management

1. **OpenAI Usage**:
   - Set up billing alerts
   - Monitor token usage
   - Implement rate limiting if needed

2. **Render Resources**:
   - Start with Starter plan
   - Scale up based on usage
   - Monitor bandwidth usage

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify DATABASE_URL format
   - Check Neon project status
   - Ensure pgvector extension is enabled

2. **Authentication Issues**:
   - Verify Supabase URLs and keys
   - Check authentication settings
   - Review CORS configuration

3. **OpenAI API Errors**:
   - Verify API key is correct
   - Check billing status
   - Monitor rate limits

### Logs and Debugging

1. **Render Logs**:
   - Access via Render dashboard
   - Check both build and runtime logs
   - Look for specific error messages

2. **Application Logs**:
   - Console errors in browser
   - Network tab for API failures
   - Check authentication flow

## Security Considerations

1. **Environment Variables**:
   - Never commit secrets to version control
   - Use Render's environment variable management
   - Rotate keys periodically

2. **Database Security**:
   - Use strong passwords
   - Enable SSL connections
   - Restrict database access

3. **API Security**:
   - Implement rate limiting
   - Validate user inputs
   - Monitor for abuse

## Scaling

As your application grows:

1. **Database Scaling**:
   - Upgrade Neon plan for more storage
   - Consider read replicas
   - Optimize queries and indexes

2. **Application Scaling**:
   - Upgrade Render plan
   - Implement caching
   - Consider CDN for static assets

3. **AI Costs**:
   - Optimize prompt engineering
   - Implement response caching
   - Consider alternative models for some tasks

## Support

For deployment issues:
1. Check this deployment guide
2. Review application logs
3. Consult service provider documentation
4. Create an issue in the repository

