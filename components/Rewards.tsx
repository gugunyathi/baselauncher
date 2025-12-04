
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import Modal from './Modal';
import { useUI, useUser } from '@/lib/state';
import confetti from 'canvas-confetti';

export default function Rewards() {
  const { rewards, claimRewards } = useUser();
  const { setShowRewards } = useUI();

  const handleClaim = () => {
    claimRewards();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <Modal onClose={() => setShowRewards(false)}>
      <div className="rewards-container">
        <div className="rewards-header">
          <span className="icon trophy-icon">emoji_events</span>
          <h2>Daily Rewards</h2>
        </div>

        <div className="streak-card">
          <div className="streak-count">{rewards.streak}</div>
          <div className="streak-label">Day Streak</div>
        </div>

        <div className="points-display">
          <h3>Total Points</h3>
          <p className="points-value">{rewards.points}</p>
        </div>

        <div className="daily-task">
          <p>Task: Check in with your AI Agent</p>
          <button 
            className="button primary claim-button" 
            onClick={handleClaim}
            disabled={!!rewards.lastClaimed && new Date(rewards.lastClaimed).getDate() === new Date().getDate()}
          >
            {!!rewards.lastClaimed && new Date(rewards.lastClaimed).getDate() === new Date().getDate() ? 'Claimed' : 'Claim 100 Points'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
