
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import Modal from './Modal';
import { useUI, useUser } from '@/lib/state';
import React, { useRef } from 'react';

export default function UserSettings() {
  const { name, info, baseName, joinDate, avatar, setName, setInfo, setBaseName, setAvatar } = useUser();
  const { setShowUserConfig } = useUI();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal onClose={() => setShowUserConfig(false)}>
      <div className="userSettings">
        <div className="profile-header">
           <div className="profile-avatar-large" onClick={handleAvatarClick} title="Click to change photo">
             {avatar ? (
               <img src={avatar} alt="Profile" className="avatar-image" />
             ) : (
               <span className="icon">person</span>
             )}
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileChange} 
               accept="image/*" 
               style={{ display: 'none' }} 
             />
           </div>
           <h2>Onchain ID</h2>
           <div className="profile-badge">Verified</div>
        </div>

        <div className="profile-details">
            <div className="detail-item">
                <span className="label">Base Name</span>
                <input 
                  type="text" 
                  value={baseName} 
                  onChange={(e) => setBaseName(e.target.value)}
                  className="value highlight editable-input"
                  placeholder="name.base.eth"
                />
            </div>
            <div className="detail-item">
                <span className="label">Joined</span>
                <span className="value">{joinDate}</span>
            </div>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            setShowUserConfig(false);
          }}
        >
          <div>
            <p>Display Name</p>
            <input
              type="text"
              name="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div>
            <p>About You (Context for AI)</p>
            <textarea
              rows={3}
              name="info"
              value={info}
              onChange={e => setInfo(e.target.value)}
              placeholder="Tell your agent about your interests..."
            />
          </div>

          <button className="button primary">Update Profile</button>
        </form>
      </div>
    </Modal>
  );
}
