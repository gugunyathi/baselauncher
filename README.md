<div align="center">

# 📱 Base Phone Launcher

**An AI-powered Android home launcher built with React, TypeScript, and Google Gemini**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://baselauncher.vercel.app)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?logo=react)](https://react.dev)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%20AI-4285F4?logo=google)](https://ai.google.dev)

</div>

---

## 🌟 Overview

Base Phone Launcher is a minimalist, AI-first Android home launcher that replaces your phone's default home screen. It features a conversational AI assistant powered by Google Gemini, wallet integration for Web3, and a clean, distraction-free interface.

### ✨ Key Features

- **🤖 AI Assistant** - Voice-activated AI companion using Google Gemini Live API
- **🏠 Home Launcher** - Functions as a full Android home screen replacement
- **👛 Wallet Integration** - Built-in crypto wallet display for Base chain assets
- **📱 App Drawer** - Clean grid-based app launcher
- **📞 Dialer** - Integrated phone dialer interface
- **🎨 Themes** - Multiple customizable background themes
- **🏆 Rewards** - Gamification with streaks and points
- **⚙️ Settings** - Easy launcher switching and app management

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Android device (for APK installation)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gugunyathi/baselauncher.git
   cd baselauncher
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file with your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   
   Navigate to `http://localhost:3000`

---

## 📦 Building

### Web Build

```bash
npm run build
```

Output will be in the `dist/` folder.

### Android APK Build

This project uses [Bubblewrap](https://github.com/ArcTouchLLC/aspect) to wrap the PWA as a Trusted Web Activity (TWA).

1. **Install Bubblewrap CLI**
   ```bash
   npm install -g @aspect-cli/cli
   ```

2. **Build the Android APK**
   ```bash
   bubblewrap build
   ```

3. **Output files**
   - `app-release-signed.apk` - Ready to install APK
   - `app-release-bundle.aab` - For Google Play Store upload

---

## 🏠 Using as Android Launcher

Once installed on your Android device:

1. Press the **Home button**
2. Select **"BasePhone"** from the launcher chooser
3. Tap **"Always"** to set as default

### Switching Back to Default Launcher

Go to **Settings** in the app and use:
- **"Change Default Launcher"** - Opens Android home settings
- **"Uninstall Base Phone"** - Removes the app

Or manually: **Settings → Apps → Default apps → Home app**

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool |
| **Zustand** | State Management |
| **Google Gemini** | AI Assistant |
| **Bubblewrap/TWA** | Android Wrapper |
| **Vercel** | Hosting |

---

## 📁 Project Structure

```
baselauncher/
├── app/                    # Android TWA source
│   └── src/main/
│       ├── AndroidManifest.xml
│       └── java/.../
├── components/             # React components
│   ├── Header.tsx
│   ├── Settings.tsx
│   ├── Wallet.tsx
│   ├── AppDrawer.tsx
│   ├── Dialer.tsx
│   └── ...
├── contexts/               # React contexts
│   └── LiveAPIContext.tsx
├── hooks/                  # Custom hooks
├── lib/                    # Utilities & state
│   ├── state.ts
│   ├── prompts.ts
│   └── presets/agents.ts
├── public/                 # Static assets
├── App.tsx                 # Main app component
├── index.tsx               # Entry point
├── index.css               # Global styles
├── twa-manifest.json       # Bubblewrap config
└── vite.config.ts          # Vite configuration
```

---

## 🔧 Configuration

### TWA Manifest (`twa-manifest.json`)

Key settings for the Android app:

```json
{
  "packageId": "app.vercel.baselauncher.twa",
  "name": "Base Phone Launcher",
  "display": "fullscreen",
  "orientation": "portrait"
}
```

### Android Manifest

The app is configured as a home launcher with:
```xml
<intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.HOME" />
    <category android:name="android.intent.category.DEFAULT" />
</intent-filter>
```

---

## 🌐 Deployment

### Vercel (Recommended)

```bash
vercel --prod
```

The app is live at: **https://baselauncher.vercel.app**

### Environment Variables on Vercel

Add `GEMINI_API_KEY` in your Vercel project settings.

---

## 📄 License

Apache 2.0 - See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev) - AI capabilities
- [Bubblewrap](https://github.com/ArcTouchLLC/aspect) - TWA tooling
- [Base](https://base.org) - Web3 inspiration

---

<div align="center">

**Made with ❤️ for the future of mobile**

</div>
