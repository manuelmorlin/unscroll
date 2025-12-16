# 🎬 Unscroll

> End the endless scrolling. Let fate decide what you watch next.

A modern, minimalist web application that solves "decision paralysis" when choosing what to watch. Built with **Next.js 16**, **Firebase**, and **OpenAI**.

🔗 **Live Demo:** [unscroll-app.vercel.app](https://unscroll-app.vercel.app)

## ✨ Features

- **🎰 Slot Machine Picker** - Random selection from your watchlist with elegant animations
- **🔍 Movie Autocomplete** - Search movies as you type with TMDB integration
- **🤖 AI Autofill** - Enter a title, click "✨ Autofill" and let AI populate all metadata
- **💬 Persuasive AI** - Get a compelling reason to watch your selection
- **🔄 Real-time Sync** - Changes sync instantly across all connected devices
- **🎭 Demo Mode** - Try the app instantly without registration
- **🌙 Dark Mode** - Elegant, minimalist dark UI

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 16 (App Router), TypeScript, React 19 |
| **Styling** | Tailwind CSS 4, Framer Motion |
| **Backend** | Firebase (Auth, Firestore) |
| **AI** | OpenAI API (GPT-5-mini) |
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
│   └── api/               # API routes
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── media/             # Media list & forms
│   ├── slot-machine/      # Slot machine picker
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
│   ├── useMediaItems.ts   # Firestore realtime subscription
│   └── useAuth.ts         # Auth state management
├── lib/                   # Utilities & server code
│   ├── actions/           # Server Actions
│   ├── firebase/          # Firebase configuration
│   └── openai/            # OpenAI configuration
└── types/                 # TypeScript types
```

## 🔐 Firestore Security Rules

Copy the contents of `firestore.rules` to your Firebase Console → Firestore → Rules.

## 📄 License

MIT License - feel free to use this project for learning or as a starting point for your own projects.

## 👤 Author

**Manuel Morlin**
- GitHub: [@manuelmorlin](https://github.com/manuelmorlin)
