# Kantabai

A modern Next.js PWA built with TypeScript, Tailwind CSS, ShadCN UI, Clerk Authentication, and Neon Database.

## 🚀 Features

- **Next.js 14** - Latest version with App Router
- **TypeScript** - Type-safe development
- **PWA Support** - Installable web app with offline capabilities
- **Dark/Light Mode** - Theme toggle with system preference detection
- **Tailwind CSS** - Utility-first CSS framework
- **ShadCN UI** - Beautiful and accessible UI components
- **Clerk Authentication** - Complete authentication solution with webhooks
- **Drizzle ORM** - Type-safe database operations
- **Neon Database** - Serverless PostgreSQL database
- **ESLint** - Code linting and formatting

## 🏗️ Getting Started

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret_here

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Neon Database
DATABASE_URL=your_neon_database_connection_string_here
```

### 3. Database Setup

1. Create a Neon database account at [neon.tech](https://neon.tech)
2. Create a new database and copy the connection string
3. Generate and run database migrations:

```bash
npm run db:generate
npm run db:migrate
```

### 4. Clerk Webhook Setup

1. Go to your Clerk Dashboard
2. Navigate to Webhooks
3. Add endpoint: `https://yourdomain.com/api/webhooks/clerk`
4. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
5. Copy the webhook secret to your environment variables

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
kantabai/
├── app/                          # App Router directory
│   ├── api/webhooks/clerk/      # Clerk webhook handlers
│   ├── dashboard/               # Protected dashboard page
│   ├── sign-in/                # Clerk sign-in page
│   ├── sign-up/                # Clerk sign-up page
│   ├── globals.css             # Global styles with ShadCN variables
│   ├── layout.tsx              # Root layout with providers
│   └── page.tsx                # Home page
├── components/                  # React components
│   ├── ui/                     # ShadCN UI components
│   │   ├── avatar.tsx
│   │   ├── button.tsx
│   │   └── dropdown-menu.tsx
│   ├── header.tsx              # Main header component
│   ├── theme-provider.tsx      # Theme context provider
│   └── theme-toggle.tsx        # Dark/light mode toggle
├── lib/                        # Utility functions
│   ├── db.ts                   # Database configuration
│   ├── db-utils.ts             # Database utility functions
│   ├── schema.ts               # Drizzle database schema
│   └── utils.ts                # ShadCN utility functions
├── public/                     # Static assets and PWA files
│   ├── manifest.json           # PWA manifest
│   ├── icon-*.png             # PWA icons
│   └── favicon.ico            # Favicon
├── drizzle/                    # Database migrations (auto-generated)
├── components.json             # ShadCN configuration
├── drizzle.config.ts          # Drizzle configuration
├── middleware.ts              # Clerk middleware
├── next.config.js             # Next.js configuration with PWA
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## 🎨 Theme Support

The app includes a comprehensive dark/light mode system:

- **System preference detection** - Automatically detects user's system theme
- **Manual toggle** - Theme switcher in the header
- **Persistent storage** - Remembers user's theme preference
- **CSS variables** - Consistent theming across all components

## 📱 PWA Features

- **Installable** - Add to home screen on mobile and desktop
- **Offline support** - Service worker for offline functionality
- **App-like experience** - Standalone display mode
- **Custom icons** - Branded app icons for all platforms

## 🗄️ Database Features

- **Type-safe operations** - Drizzle ORM with TypeScript
- **User synchronization** - Automatic sync with Clerk authentication
- **Schema management** - Version-controlled database schema
- **Migration system** - Safe database updates

## 🔗 Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [ShadCN UI Documentation](https://ui.shadcn.com)
- [Clerk Documentation](https://clerk.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Neon Database Documentation](https://neon.tech/docs)
