
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useAgent, useUI, useUser } from '@/lib/state';
import { useRef, useEffect } from 'react';
import { renderBasicFace } from './demo/basic-face/basic-face-render';

function MiniFace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Render static face
    // We pass static scales (mouth closed, eyes open) for the icon
    renderBasicFace({
        ctx,
        mouthScale: 0,
        eyeScale: 1,
        color: '#88CCFF' 
    });
  }, []);

  return (
    <div className="mini-agent-face">
        <canvas 
            ref={canvasRef} 
            width={64} 
            height={64} 
            className="mini-agent-face-canvas" 
        />
    </div>
  );
}

export default function Header() {
  const { showUserConfig, setShowUserConfig, setShowAgentEdit, setShowWallet, setShowRewards, setShowSettings } = useUI();
  const { name, avatar } = useUser();
  const { current } = useAgent();

  return (
    <header>
      <div className="roomInfo">
        <div className="roomName">
          <button 
            className="header-icon-button" 
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <span className="icon">settings</span>
          </button>

          <button
            onClick={() => setShowAgentEdit(true)}
            className="header-icon-button"
            title="Edit Agent"
          >
            <MiniFace />
          </button>
        </div>
      </div>
      
      <div className="header-controls">
        <button
          className="header-icon-button rewards-button"
          onClick={() => setShowRewards(true)}
          title="Rewards"
        >
          <span className="icon">redeem</span>
        </button>

        <button
          className="header-icon-button"
          onClick={() => setShowWallet(true)}
          title="Wallet"
        >
          <span className="icon">account_balance_wallet</span>
        </button>

        <button
          className="userSettingsButton"
          onClick={() => setShowUserConfig(!showUserConfig)}
          title="Profile"
        >
          <p className='user-name'>{name || 'Profile'}</p>
          <div className="profile-icon-container">
            {avatar ? (
              <img src={avatar} alt="Profile" className="header-avatar-img" />
            ) : (
              <span className="icon">person</span>
            )}
          </div>
        </button>
      </div>
    </header>
  );
}
