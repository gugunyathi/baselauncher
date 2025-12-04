/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useRef, useEffect, useCallback } from 'react';
import Modal from './Modal';
import { useUI } from '@/lib/state';
import c from 'classnames';

// Base ecosystem apps (always shown first)
const BASE_APPS = [
  { id: 'farcaster', name: 'Farcaster', icon: 'forum', color: '#9333ea', isBase: true, category: 'social', url: 'https://warpcast.com' },
  { id: 'aerodrome', name: 'Aerodrome', icon: 'flight_takeoff', color: '#2563eb', isBase: true, category: 'defi', url: 'https://aerodrome.finance' },
  { id: 'zora', name: 'Zora', icon: 'public', color: 'linear-gradient(135deg, #374151, #000)', isBase: true, category: 'nft', url: 'https://zora.co' },
  { id: 'basepaint', name: 'BasePaint', icon: 'palette', color: '#ec4899', isBase: true, category: 'nft', url: 'https://basepaint.xyz' },
  { id: 'moonwell', name: 'Moonwell', icon: 'dark_mode', color: '#6366f1', isBase: true, category: 'defi', url: 'https://moonwell.fi' },
  { id: 'blackbird', name: 'Blackbird', icon: 'local_cafe', color: '#292524', isBase: true, category: 'social', url: 'https://blackbird.xyz' },
  { id: 'sound', name: 'Sound.xyz', icon: 'music_note', color: '#000000', isBase: true, category: 'nft', url: 'https://sound.xyz' },
  { id: 'coinbase', name: 'Coinbase', icon: 'monetization_on', color: '#1d4ed8', isBase: true, category: 'defi', url: 'https://coinbase.com' },
];

// System/utility apps
const SYSTEM_APPS = [
  { id: 'browser', name: 'Browser', icon: 'language', color: '#475569', isBase: false, category: 'utility', package: 'com.android.chrome' },
  { id: 'camera', name: 'Camera', icon: 'photo_camera', color: '#27272a', isBase: false, category: 'system', package: 'com.android.camera' },
  { id: 'photos', name: 'Photos', icon: 'photo_library', color: '#0d9488', isBase: false, category: 'system', package: 'com.google.android.apps.photos' },
  { id: 'settings', name: 'Settings', icon: 'settings', color: '#4b5563', isBase: false, category: 'system', package: 'com.android.settings' },
];

// Common Android apps that users might have installed
const COMMON_DEVICE_APPS = [
  { id: 'whatsapp', name: 'WhatsApp', icon: 'chat', color: '#25D366', package: 'com.whatsapp', category: 'social' },
  { id: 'instagram', name: 'Instagram', icon: 'photo_camera', color: 'linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)', package: 'com.instagram.android', category: 'social' },
  { id: 'twitter', name: 'X', icon: 'alternate_email', color: '#000000', package: 'com.twitter.android', category: 'social' },
  { id: 'telegram', name: 'Telegram', icon: 'send', color: '#0088cc', package: 'org.telegram.messenger', category: 'social' },
  { id: 'youtube', name: 'YouTube', icon: 'play_circle', color: '#FF0000', package: 'com.google.android.youtube', category: 'media' },
  { id: 'spotify', name: 'Spotify', icon: 'headphones', color: '#1DB954', package: 'com.spotify.music', category: 'media' },
  { id: 'netflix', name: 'Netflix', icon: 'movie', color: '#E50914', package: 'com.netflix.mediaclient', category: 'media' },
  { id: 'tiktok', name: 'TikTok', icon: 'music_video', color: '#000000', package: 'com.zhiliaoapp.musically', category: 'social' },
  { id: 'snapchat', name: 'Snapchat', icon: 'camera_alt', color: '#FFFC00', package: 'com.snapchat.android', category: 'social' },
  { id: 'facebook', name: 'Facebook', icon: 'thumb_up', color: '#1877F2', package: 'com.facebook.katana', category: 'social' },
  { id: 'messenger', name: 'Messenger', icon: 'message', color: 'linear-gradient(135deg, #00B2FF, #006AFF)', package: 'com.facebook.orca', category: 'social' },
  { id: 'discord', name: 'Discord', icon: 'headset_mic', color: '#5865F2', package: 'com.discord', category: 'social' },
  { id: 'gmail', name: 'Gmail', icon: 'mail', color: '#EA4335', package: 'com.google.android.gm', category: 'productivity' },
  { id: 'maps', name: 'Maps', icon: 'map', color: '#4285F4', package: 'com.google.android.apps.maps', category: 'utility' },
  { id: 'drive', name: 'Drive', icon: 'cloud', color: '#4285F4', package: 'com.google.android.apps.docs', category: 'productivity' },
  { id: 'calendar', name: 'Calendar', icon: 'calendar_month', color: '#4285F4', package: 'com.google.android.calendar', category: 'productivity' },
  { id: 'clock', name: 'Clock', icon: 'schedule', color: '#5F6368', package: 'com.google.android.deskclock', category: 'utility' },
  { id: 'calculator', name: 'Calculator', icon: 'calculate', color: '#4285F4', package: 'com.google.android.calculator', category: 'utility' },
  { id: 'files', name: 'Files', icon: 'folder', color: '#5F6368', package: 'com.google.android.documentsui', category: 'utility' },
  { id: 'playstore', name: 'Play Store', icon: 'shop', color: 'linear-gradient(135deg, #4285F4, #34A853, #FBBC05, #EA4335)', package: 'com.android.vending', category: 'system' },
  { id: 'contacts', name: 'Contacts', icon: 'contacts', color: '#4285F4', package: 'com.google.android.contacts', category: 'system' },
  { id: 'phone', name: 'Phone', icon: 'call', color: '#4285F4', package: 'com.google.android.dialer', category: 'system' },
  { id: 'messages', name: 'Messages', icon: 'sms', color: '#1a73e8', package: 'com.google.android.apps.messaging', category: 'system' },
];

interface AppInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  isBase?: boolean;
  category: string;
  package?: string;
  url?: string;
  usageCount?: number;
}

interface InstalledApp {
  packageName: string;
  appName: string;
  isSystemApp: boolean;
}

// Storage keys
const USAGE_STORAGE_KEY = 'basephone_app_usage';
const INSTALLED_APPS_KEY = 'basephone_installed_apps';

// Get app usage from localStorage
const getAppUsage = (): Record<string, number> => {
  try {
    const stored = localStorage.getItem(USAGE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Save app usage to localStorage
const saveAppUsage = (usage: Record<string, number>) => {
  try {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
  } catch (e) {
    console.error('Failed to save app usage:', e);
  }
};

// Increment usage count for an app
const incrementUsage = (appId: string) => {
  const usage = getAppUsage();
  usage[appId] = (usage[appId] || 0) + 1;
  saveAppUsage(usage);
};

// Get installed apps from Android (if available) or localStorage
const getInstalledApps = (): InstalledApp[] => {
  try {
    // Check if running in Android WebView with JS interface
    if ((window as any).Android?.getInstalledApps) {
      const appsJson = (window as any).Android.getInstalledApps();
      return JSON.parse(appsJson);
    }
    
    // Fallback to stored list
    const stored = localStorage.getItem(INSTALLED_APPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const ITEMS_PER_PAGE = 15;

export default function AppDrawer() {
  const { setShowAppDrawer, setShowUserConfig } = useUI();
  const [currentPage, setCurrentPage] = useState(0);
  const [allApps, setAllApps] = useState<AppInfo[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance
  const minSwipeDistance = 50;

  // Load and organize apps
  useEffect(() => {
    const usage = getAppUsage();
    const installedApps = getInstalledApps();
    
    // Create a set of installed package names for quick lookup
    const installedPackages = new Set(installedApps.map(a => a.packageName));
    
    // Start with Base apps (always first)
    const apps: AppInfo[] = [...BASE_APPS.map(app => ({ ...app, usageCount: usage[app.id] || 0 }))];
    
    // Add device apps that are "installed" (matched or simulated)
    const deviceApps = COMMON_DEVICE_APPS
      .map(app => ({
        ...app,
        isBase: false,
        usageCount: usage[app.id] || 0,
      }))
      .filter(app => {
        // If we have real installed apps data, filter by it
        if (installedApps.length > 0) {
          return installedPackages.has(app.package || '');
        }
        // Otherwise show common apps (simulated)
        return true;
      })
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    
    // Add system apps
    const systemApps = SYSTEM_APPS.map(app => ({ ...app, usageCount: usage[app.id] || 0 }));
    
    // Combine: Base apps first, then most used device apps, then system apps
    setAllApps([...apps, ...deviceApps, ...systemApps]);
  }, []);

  // Create pages
  const pages = [];
  for (let i = 0; i < allApps.length; i += ITEMS_PER_PAGE) {
    pages.push(allApps.slice(i, i + ITEMS_PER_PAGE));
  }

  const handleAppClick = (app: AppInfo) => {
    // Track usage
    incrementUsage(app.id);
    
    if (app.id === 'settings') {
      setShowAppDrawer(false);
      setShowUserConfig(true);
      return;
    }
    
    // Try to launch the app
    if (app.url) {
      // Open Base ecosystem app URLs
      window.open(app.url, '_blank');
      setShowAppDrawer(false);
    } else if (app.package) {
      // Try Android intent
      if ((window as any).Android?.launchApp) {
        (window as any).Android.launchApp(app.package);
        setShowAppDrawer(false);
      } else {
        // Fallback: try intent URL scheme
        const intentUrl = `intent://#Intent;package=${app.package};end`;
        window.location.href = intentUrl;
        
        // If that fails, try market URL
        setTimeout(() => {
          window.open(`https://play.google.com/store/apps/details?id=${app.package}`, '_blank');
        }, 500);
        setShowAppDrawer(false);
      }
    } else {
      console.log(`Launching ${app.name}`);
      setShowAppDrawer(false);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const pageIndex = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
      setCurrentPage(pageIndex);
    }
  };

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentPage < pages.length - 1) {
      goToPage(currentPage + 1);
    }
    if (isRightSwipe && currentPage > 0) {
      goToPage(currentPage - 1);
    }
  };

  const goToPage = useCallback((pageIndex: number) => {
    if (scrollRef.current) {
      const pageWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({
        left: pageIndex * pageWidth,
        behavior: 'smooth'
      });
      setCurrentPage(pageIndex);
    }
  }, []);

  // Handle pagination dot clicks
  const handleDotClick = (index: number) => {
    goToPage(index);
  };

  return (
    <Modal onClose={() => setShowAppDrawer(false)} className="full-screen">
      <div className="app-drawer-container">
        <h2 className="drawer-title">All Apps</h2>
        
        {/* Page indicator showing current/total */}
        <div className="page-indicator">
          {currentPage + 1} / {pages.length}
        </div>
        
        <div 
          className="app-drawer-pages" 
          ref={scrollRef} 
          onScroll={handleScroll}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {pages.map((page, pageIndex) => (
            <div key={pageIndex} className="app-drawer-page">
              <div className="app-grid">
                {page.map((app) => (
                  <button key={app.id} className="app-item" onClick={() => handleAppClick(app)}>
                    <div 
                      className={c("app-icon", { "base-app-icon": app.isBase })}
                      style={{ background: app.color }}
                    >
                      <span className="icon material-symbols-outlined">{app.icon}</span>
                      {app.isBase && <span className="base-badge">◆</span>}
                    </div>
                    <span className="app-label">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="drawer-pagination">
          {pages.map((_, i) => (
            <button 
              key={i} 
              className={c("page-dot", { active: i === currentPage })}
              onClick={() => handleDotClick(i)}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
