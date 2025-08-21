# Quick Setup Guide

## 🚀 Get Your IFI Chatbot Running in 3 Steps

### Step 1: Set up Supabase (Authentication)

1. **Create Account**: Go to [supabase.com](https://supabase.com) and sign up
2. **New Project**: Click "New Project" and choose settings
3. **Get Credentials**: 
   - Go to Settings → API
   - Copy the Project URL
   - Copy the `anon` public key
   - Copy the `service_role` secret key

### Step 2: Get OpenAI API Key

1. **Create Account**: Go to [platform.openai.com](https://platform.openai.com)
2. **API Keys**: Navigate to API Keys section
3. **Create Key**: Click "Create new secret key"
4. **Copy Key**: Save the key (starts with `sk-`)

### Step 3: Update Environment Variables

Edit the `.env.local` file in your project root:

```env
# Replace these with your actual values:
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_key_here

OPENAI_API_KEY=sk-your_actual_openai_key_here

# For database (optional - can use Supabase's built-in Postgres):
DATABASE_URL=postgresql://postgres:password@db.your-project-id.supabase.co:5432/postgres
```

### Step 4: Test It Out

1. **Restart Dev Server**: Stop (`Ctrl+C`) and run `npm run dev`
2. **Visit**: http://localhost:3000
3. **Register**: Create a new account
4. **Chat**: Go to `/chat` and start asking questions!

---

## 🎯 Quick Test

Once configured:
- ✅ Register a new account → Should work without errors
- ✅ Login with your account → Should redirect to chat
- ✅ Go to `/admin` → Upload documents (admin accounts only)
- ✅ Chat interface → Ask questions about uploaded docs

## 🔧 Troubleshooting

**"Supabase not configured"**: Check your `.env.local` file has real URLs/keys
**"OpenAI API error"**: Verify your API key is correct and has credits
**"Database error"**: Make sure your DATABASE_URL is valid

## 💡 Tips

- Start with Supabase auth first - it's the foundation
- You can use Supabase's built-in database instead of separate Neon
- Set spending limits on OpenAI to control costs
- The app shows helpful dev notices when services aren't configured

Ready to go? Your modern AI chatbot awaits! 🚀

