# DAI App Frontend

Progressive Web App (PWA) for Mosque Financial Administration and Congregation Management System.

## Features

- **PWA Support**: Installable on mobile (Android/iOS) and desktop
- **Responsive Design**: Mobile-first, optimized for all screen sizes
- **Google SSO**: Authentication via Supabase
- **Offline Support**: Service worker caching
- **Modern UI**: Tailwind CSS with clean, professional design

## Tech Stack

- React 18+ with Vite
- React Router (navigation)
- Tailwind CSS (styling)
- Zustand (state management)
- Supabase (auth & database)
- Vite PWA Plugin
- Axios, date-fns, Lucide React

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your Supabase credentials

# Run development server
npm run dev
```

## Building for Production

```bash
# Build static files for Cloudflare Pages
npm run build

# Preview build
npm run preview
```

The `dist/` directory contains static files ready for deployment to Cloudflare Pages, Netlify, or Vercel.

## PWA Installation

**Android/iOS:**
- Open in browser → Menu → "Install app" or "Add to Home Screen"

**Desktop:**
- Install button will appear in address bar

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── services/       # API and Supabase clients
├── stores/         # Zustand state stores
└── App.jsx         # Main app with routing
```

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## License

MIT
