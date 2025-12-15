# 🎬 Unscroll

> End the endless scrolling. Let fate decide what you watch next.

A modern, minimalist web application that solves "decision paralysis" when choosing what to watch. Built as a portfolio project showcasing full-stack development skills with **Next.js 15**, **Supabase**, and **OpenAI**.

![Unscroll Demo](./demo.gif)

## ✨ Features

- **🎰 Slot Machine Picker** - Random selection from your watchlist with elegant animations
- **🤖 AI Autofill** - Enter a title, click "✨ Autofill" and let AI populate all metadata
- **💬 Persuasive AI** - Get a compelling reason to watch your selection
- **🔄 Real-time Sync** - Changes sync instantly across all connected devices
- **🎭 Demo Mode** - Try the app instantly without registration (perfect for recruiters!)
- **🌙 Dark Mode** - Elegant, minimalist dark UI with focus on typography

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 15 (App Router), TypeScript (Strict), React 19 |
| **Styling** | Tailwind CSS 4, Framer Motion |
| **Backend** | Supabase (PostgreSQL, Auth, Realtime) |
| **AI** | OpenAI API (gpt-4o-mini) |
| **Validation** | Zod |
| **Icons** | Lucide React |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Supabase account (free tier works)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/unscroll.git
   cd unscroll
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   OPENAI_API_KEY=sk-your-openai-key
   DEMO_USER_EMAIL=demo@unscroll.app
   DEMO_USER_PASSWORD=secure-demo-password
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql` in the SQL Editor
   - Enable Realtime for `media_items` table (Database > Replication)
   - Create a demo user in Authentication > Users

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication page
│   ├── app/               # Main application (protected)
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── media/             # Media list & forms
│   ├── slot-machine/      # Slot machine picker
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
│   ├── useMediaItems.ts   # Media + Realtime subscription
│   └── useAuth.ts         # Auth state management
├── lib/                   # Utilities & server code
│   ├── actions/           # Server Actions
│   ├── supabase/          # Supabase clients
│   └── openai/            # OpenAI configuration
├── types/                 # TypeScript types
└── middleware.ts          # Auth middleware
```

## 🔐 Authentication Flow

1. **Standard Auth**: Email/password registration & login via Supabase Auth
2. **Demo Mode**: Click "Try Demo" for instant access to a sandbox account
3. **Protected Routes**: Middleware redirects unauthenticated users to `/auth`

## 🔄 Realtime Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Device A  │     │  Supabase   │     │   Device B  │
│             │────▶│  Realtime   │────▶│             │
│  Add Movie  │     │  Broadcast  │     │  Auto-sync  │
└─────────────┘     └─────────────┘     └─────────────┘
```

The `useMediaItems` hook subscribes to Postgres changes and updates the UI instantly.

## 🤖 AI Integration

### Autofill (`actionAutofill`)
- Input: Movie/series title
- Output: Genre, plot, cast, duration, format, year
- Model: gpt-4o-mini with JSON mode

### Persuade (`actionPersuade`)
- Input: Title, genre, plot
- Output: Compelling reason to watch + mood
- Temperature: 0.8 (creative)

## 📸 Screenshots

| Auth Screen | Slot Machine | Watchlist |
|-------------|--------------|-----------|
| ![Auth](./screenshots/auth.png) | ![Slot](./screenshots/slot.png) | ![List](./screenshots/list.png) |

## 🚧 Roadmap

- [ ] Streaming platforms integration
- [ ] Collaborative watchlists
- [ ] Watch history analytics
- [ ] Mobile app (React Native)
- [ ] Browser extension

## 📄 License

MIT © [Your Name](https://github.com/yourusername)

---

<p align="center">
  <strong>Built with ❤️ for recruiters in Zurich</strong><br>
  <a href="https://linkedin.com/in/yourprofile">LinkedIn</a> • 
  <a href="https://github.com/yourusername">GitHub</a>
</p>
