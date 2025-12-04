
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import { useUI } from '@/lib/state';
import c from 'classnames';

// Mapped from requested data to Material Symbols and CSS Colors
const APPS = [
  { id: 'farcaster', name: 'Farcaster', icon: 'forum', color: '#9333ea', isSystem: true, category: 'social' }, // bg-purple-600
  { id: 'aerodrome', name: 'Aerodrome', icon: 'flight_takeoff', color: '#2563eb', isSystem: true, category: 'defi' }, // bg-blue-600
  { id: 'zora', name: 'Zora', icon: 'public', color: 'linear-gradient(135deg, #374151, #000)', isSystem: true, category: 'nft' }, // bg-gradient-to-br from-gray-700 to-black
  { id: 'basepaint', name: 'BasePaint', icon: 'palette', color: '#ec4899', isSystem: true, category: 'nft' }, // bg-pink-500
  { id: 'moonwell', name: 'Moonwell', icon: 'dark_mode', color: '#6366f1', isSystem: true, category: 'defi' }, // bg-indigo-500
  { id: 'blackbird', name: 'Blackbird', icon: 'local_cafe', color: '#292524', isSystem: true, category: 'social' }, // bg-stone-800
  { id: 'sound', name: 'Sound.xyz', icon: 'music_note', color: '#000000', isSystem: true, category: 'nft' }, // bg-black
  { id: 'coinbase', name: 'Coinbase', icon: 'monetization_on', color: '#1d4ed8', isSystem: true, category: 'defi' }, // bg-blue-700
  { id: 'browser', name: 'Browser', icon: 'language', color: '#475569', isSystem: false, category: 'utility' }, // bg-slate-600
  { id: 'camera', name: 'Camera', icon: 'photo_camera', color: '#27272a', isSystem: false, category: 'system' }, // bg-zinc-800
  { id: 'photos', name: 'Photos', icon: 'photo_library', color: '#0d9488', isSystem: false, category: 'system' }, // bg-teal-600
  { id: 'settings', name: 'Settings', icon: 'settings', color: '#4b5563', isSystem: false, category: 'system' }, // bg-gray-600
];

const ITEMS_PER_PAGE = 9;

export default function AppDrawer() {
  const { setShowAppDrawer, setShowUserConfig } = useUI();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const pages = [];
  for (let i = 0; i < APPS.length; i += ITEMS_PER_PAGE) {
    pages.push(APPS.slice(i, i + ITEMS_PER_PAGE));
  }

  const handleAppClick = (app: any) => {
    if (app.id === 'settings' || app.id === 'onchain-id') { // Mapped from logic
      setShowAppDrawer(false);
      setShowUserConfig(true);
    } else {
      console.log(`Launching ${app.name}`);
      // Simulate launch
      setShowAppDrawer(false);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const pageIndex = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
      setCurrentPage(pageIndex);
    }
  };

  return (
    <Modal onClose={() => setShowAppDrawer(false)} className="full-screen">
      <div className="app-drawer-container">
        <h2 className="drawer-title">All Apps</h2>
        
        <div 
          className="app-drawer-pages" 
          ref={scrollRef} 
          onScroll={handleScroll}
        >
          {pages.map((page, pageIndex) => (
            <div key={pageIndex} className="app-drawer-page">
              <div className="app-grid">
                {page.map((app) => (
                  <button key={app.id} className="app-item" onClick={() => handleAppClick(app)}>
                    <div 
                      className="app-icon"
                      style={{ background: app.color }}
                    >
                      <span className="icon material-symbols-outlined">{app.icon}</span>
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
            <div 
              key={i} 
              className={c("page-dot", { active: i === currentPage })} 
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
