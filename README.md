# 🎬 Unscroll

> End the endless scrolling. Let fate decide what you watch next.

A modern movie tracking app with an **iOS 26.2 Ethereal Cinema-inspired UI**. Track what you've watched, manage your watchlist, and let the slot machine decide your next film. Built with **Next.js 16**, **Firebase**, and **OpenAI**.

🔗 **Live Demo:** [unscroll-app.vercel.app](https://unscroll-app.vercel.app)

## ✨ Features

- **🎰 Slot Machine Picker** - Can't decide? Spin the slot machine to randomly pick from your watchlist
- **📔 Diary** - Log films you've watched with ratings (1-5 stars), reviews, and rewatch tracking
- **📋 Watchlist** - Save films you want to watch for later
- **🔍 Movie Search** - Search movies as you type with TMDB integration
- **🤖 AI Autofill** - Enter a title, click "✨ Autofill" and let AI populate all metadata
- **💡 AI Recommendations** - Get personalized film recommendations based on your diary
- **💬 Persuasive AI** - Get a compelling reason to watch your selection
- **🔄 Real-time Sync** - Changes sync instantly across all connected devices
- **🎭 Demo Mode** - Try the app with pre-populated sample data (no registration needed)
- **🌙 Ethereal Dark UI** - Glassmorphism design with subtle gradients and smooth animations

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 16 (App Router + Turbopack), TypeScript, React 19 |
| **Styling** | Tailwind CSS 4, Framer Motion |
| **Backend** | Firebase (Auth, Firestore) |
| **AI** | OpenAI API (GPT-4o-mini) |
| **Movie Data** | TMDB API |
| **Validation** | Zod |
| **Hosting** | Vercel |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Firebase account (free tier works)
- OpenAI API key (optional, for AI features)
- TMDB API key (optional, for movie autocomplete)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/manuelmorlin/unscroll.git
   cd unscroll
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new project at [Firebase Console](https://console.firebase.google.com)
   - Enable **Authentication** → Email/Password
   - Enable **Firestore Database**
   - Go to Project Settings → Service Accounts → Generate new private key
   - Add your domain to Authentication → Settings → Authorized domains

4. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your credentials:
   ```env
   # Firebase (Client)
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

   # Firebase (Server - from service account JSON)
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

   # OpenAI (optional)
   OPENAI_API_KEY=sk-your-openai-key

   # TMDB (optional)
   TMDB_API_KEY=your-tmdb-api-key
   ```

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
│   └── api/               # API routes (auth, demo, logout)
├── components/            # React components
│   ├── auth/              # Auth forms, Demo button
│   ├── media/             # MediaList, Diary, AddMediaForm, Recommendations
│   ├── slot-machine/      # Slot machine picker with animations
│   └── ui/                # StarRating, reusable UI components
├── hooks/                 # Custom React hooks
│   ├── useMediaItems.ts   # Firestore realtime subscription
│   └── useAuth.ts         # Auth state management
├── lib/                   # Utilities & server code
│   ├── actions/           # Server Actions (AI, auth, media, TMDB)
│   ├── firebase/          # Firebase client & admin config
│   └── openai/            # OpenAI client configuration
├── types/                 # TypeScript types
└── scripts/               # Utility scripts (populate demo, etc.)
```

## 🔐 Firestore Security Rules

Copy the contents of `firestore.rules` to your Firebase Console → Firestore → Rules.

## 📄 License

MIT License - feel free to use this project for learning or as a starting point for your own projects.

## 👤 Author

**Manuel Morlin**
- GitHub: [@manuelmorlin](https://github.com/manuelmorlin)
