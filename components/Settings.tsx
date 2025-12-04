
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import Modal from './Modal';
import { useUI, useUser } from '@/lib/state';
import { useState } from 'react';

// Check if running as an installed Android app (TWA/WebAPK)
const isAndroidApp = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
    || window.matchMedia('(display-mode: fullscreen)').matches
    || (window.navigator as any).standalone === true;
  const isAndroid = /Android/i.test(navigator.userAgent);
  return isAndroid && isStandalone;
};

export default function Settings() {
  const { setShowSettings, setShowUserConfig, setShowAgentEdit, setShowWallet } = useUI();
  const { wallet, toggleBalanceVisibility } = useUser();
  const [showLauncherHelp, setShowLauncherHelp] = useState(false);

  const handleOpenProfile = () => {
    setShowSettings(false);
    setShowUserConfig(true);
  };

  const handleOpenAgent = () => {
    setShowSettings(false);
    setShowAgentEdit(true);
  };

  const handleOpenWallet = () => {
    setShowSettings(false);
    setShowWallet(true);
  };

  // Open Android default home settings via intent URL
  const handleChangeLauncher = () => {
    if (isAndroidApp()) {
      // Try to open the home settings using intent URL
      // This works on most Android devices
      try {
        window.location.href = 'intent://settings/home#Intent;scheme=android-app;end';
      } catch {
        setShowLauncherHelp(true);
      }
    } else {
      setShowLauncherHelp(true);
    }
  };

  // Show app info/uninstall page
  const handleUninstallApp = () => {
    if (isAndroidApp()) {
      // Open app settings for this app
      try {
        window.location.href = 'intent://settings/apps/app.vercel.baselauncher.twa#Intent;scheme=android-app;end';
      } catch {
        setShowLauncherHelp(true);
      }
    } else {
      setShowLauncherHelp(true);
    }
  };

  return (
    <Modal onClose={() => setShowSettings(false)}>
      <div className="settings-modal">
        <h2>Settings</h2>

        <div className="settings-section">
            <h3>General</h3>
            <button className="settings-item" onClick={handleOpenProfile}>
                <span className="icon">person</span>
                <div className="settings-text">
                    <span className="title">Onchain ID & Profile</span>
                    <span className="subtitle">Manage your identity and context</span>
                </div>
                <span className="icon arrow">chevron_right</span>
            </button>

            <button className="settings-item" onClick={handleOpenAgent}>
                <span className="icon">smart_toy</span>
                <div className="settings-text">
                    <span className="title">Agent Configuration</span>
                    <span className="subtitle">Customize personality and voice</span>
                </div>
                <span className="icon arrow">chevron_right</span>
            </button>
            
            <button className="settings-item" onClick={handleOpenWallet}>
                <span className="icon">account_balance_wallet</span>
                <div className="settings-text">
                    <span className="title">Wallet Settings</span>
                    <span className="subtitle">View assets and transactions</span>
                </div>
                <span className="icon arrow">chevron_right</span>
            </button>
        </div>

        <div className="settings-section">
            <h3>Display</h3>
            <div className="settings-item toggle-item" onClick={toggleBalanceVisibility}>
                <div className="settings-text">
                    <span className="title">Show Wallet Balances</span>
                    <span className="subtitle">Show total value on wallet widget</span>
                </div>
                <div className={`toggle-switch ${wallet.showBalances ? 'active' : ''}`}></div>
            </div>
        </div>

        <div className="settings-section">
            <h3>About</h3>
            <div className="about-info">
                <p>Base Phone Launcher</p>
                <p className="version">v1.0.0</p>
            </div>
        </div>

        {/* Launcher Settings Section - Only show on Android */}
        {isAndroidApp() && (
          <div className="settings-section">
            <h3>Launcher</h3>
            <button className="settings-item" onClick={handleChangeLauncher}>
                <span className="icon">home</span>
                <div className="settings-text">
                    <span className="title">Change Default Launcher</span>
                    <span className="subtitle">Switch to a different home app</span>
                </div>
                <span className="icon arrow">chevron_right</span>
            </button>

            <button className="settings-item" onClick={handleUninstallApp}>
                <span className="icon">delete</span>
                <div className="settings-text">
                    <span className="title">Uninstall Base Phone</span>
                    <span className="subtitle">Remove this launcher from your device</span>
                </div>
                <span className="icon arrow">chevron_right</span>
            </button>
          </div>
        )}

        {/* Launcher Help Modal */}
        {showLauncherHelp && (
          <div className="launcher-help-overlay" onClick={() => setShowLauncherHelp(false)}>
            <div className="launcher-help-modal" onClick={e => e.stopPropagation()}>
              <h3>How to Change Launcher</h3>
              <div className="help-steps">
                <p><strong>Option 1: Via Settings</strong></p>
                <ol>
                  <li>Open your phone's <strong>Settings</strong> app</li>
                  <li>Go to <strong>Apps</strong> → <strong>Default apps</strong></li>
                  <li>Tap <strong>Home app</strong></li>
                  <li>Select your preferred launcher</li>
                </ol>
                
                <p><strong>Option 2: Uninstall</strong></p>
                <ol>
                  <li>Open <strong>Settings</strong> → <strong>Apps</strong></li>
                  <li>Find <strong>Base Phone Launcher</strong></li>
                  <li>Tap <strong>Uninstall</strong></li>
                </ol>
              </div>
              <button className="help-close-btn" onClick={() => setShowLauncherHelp(false)}>
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
