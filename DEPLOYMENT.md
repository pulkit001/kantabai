# Deployment Guide for Kantabai

This guide will help you deploy your Kantabai application to production using Git and Vercel.

## Prerequisites

1. **GitHub Account** - For code repository
2. **Vercel Account** - For deployment (free tier available)
3. **Neon Database** - For production database
4. **Clerk Account** - For authentication

## Step 1: Prepare for Deployment

### 1.1 Environment Variables
Create production environment variables in Vercel dashboard:

```env
# Clerk Authentication (Production)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Clerk URLs (Update with your domain)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Neon Database (Production)
DATABASE_URL=postgresql://...
```

### 1.2 Database Setup
1. Create a production database in Neon
2. Copy the connection string
3. Run migrations in production (Vercel will do this automatically)

## Step 2: Git Repository Setup

```bash
# Initialize Git repository
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Kantabai PWA with auth and database"

# Add remote origin (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/kantabai.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Vercel Deployment

### Option A: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option B: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables
5. Deploy

## Step 4: Post-Deployment Configuration

### 4.1 Update Clerk Webhook URL
1. Go to Clerk Dashboard → Webhooks
2. Update endpoint URL to: `https://your-domain.vercel.app/api/webhooks/clerk`
3. Ensure events are subscribed: `user.created`, `user.updated`, `user.deleted`

### 4.2 Test PWA Features
1. Visit your deployed site
2. Test "Add to Home Screen" functionality
3. Verify offline capabilities
4. Test dark/light mode toggle

### 4.3 Database Verification
1. Sign up a new user
2. Check if user appears in Neon database
3. Verify dashboard shows correct database status

## Step 5: Domain Configuration (Optional)

### Custom Domain
1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update Clerk settings with new domain
4. Update environment variables if needed

## Troubleshooting

### Common Issues:

1. **Build Errors**: Check build logs in Vercel dashboard
2. **Database Connection**: Verify DATABASE_URL is correct
3. **Auth Issues**: Ensure Clerk URLs match your domain
4. **PWA Not Working**: Check manifest.json and service worker

### Debug Commands:
```bash
# Check build locally
npm run build

# Test production build locally
npm run start

# Generate and check database migrations
npm run db:generate
```

## Environment Variables Checklist

- [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- [ ] CLERK_SECRET_KEY  
- [ ] CLERK_WEBHOOK_SECRET
- [ ] DATABASE_URL
- [ ] NEXT_PUBLIC_CLERK_SIGN_IN_URL
- [ ] NEXT_PUBLIC_CLERK_SIGN_UP_URL
- [ ] NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
- [ ] NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL

## Post-Deployment Testing

- [ ] Homepage loads correctly
- [ ] Sign up/Sign in works
- [ ] Dashboard shows user data
- [ ] Dark/light mode toggle works
- [ ] PWA install prompt appears
- [ ] Database sync with Clerk works
- [ ] All pages are responsive

## Performance Optimization

Your app is already optimized with:
- ✅ Next.js 14 with App Router
- ✅ Static generation where possible
- ✅ PWA caching strategies
- ✅ Optimized images and fonts
- ✅ Tree-shaking and code splitting

## Security Features

- ✅ Clerk authentication with webhooks
- ✅ Environment variable protection
- ✅ HTTPS enforcement
- ✅ Security headers via Vercel
- ✅ Database connection encryption
