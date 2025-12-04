
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState } from 'react';
import Modal from './Modal';
import { useUI } from '@/lib/state';

export default function Dialer() {
  const { setShowDialer } = useUI();
  const [number, setNumber] = useState('');
  const [status, setStatus] = useState<'idle' | 'calling' | 'connected'>('idle');

  const handleClick = (digit: string) => {
    if (status === 'idle') {
      setNumber(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
      if (status === 'idle') {
        setNumber(prev => prev.slice(0, -1));
      }
  };

  const handleCall = () => {
    if (number.length > 0) {
      setStatus('calling');
      setTimeout(() => setStatus('connected'), 1500);
    }
  };

  const handleHangup = () => {
    setStatus('idle');
    setNumber('');
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  return (
    <Modal onClose={() => setShowDialer(false)}>
      <div className="dialer">
        <div className="dialer-display">
            {status === 'idle' ? number : status === 'calling' ? 'Calling...' : 'Connected'}
            {status !== 'idle' && <div className="dialer-number">{number}</div>}
        </div>
        
        <div className="dialer-grid">
          {digits.map(d => (
            <button key={d} className="dialer-key" onClick={() => handleClick(d)} disabled={status !== 'idle'}>
              {d}
            </button>
          ))}
        </div>

        <div className="dialer-actions">
           {status === 'idle' ? (
               <button className="call-button" onClick={handleCall}>
                   <span className="icon">call</span>
               </button>
           ) : (
               <button className="hangup-button" onClick={handleHangup}>
                   <span className="icon">call_end</span>
               </button>
           )}
           {status === 'idle' && number.length > 0 && (
                <button className="backspace-button" onClick={handleBackspace}>
                    <span className="icon">backspace</span>
                </button>
           )}
        </div>
      </div>
    </Modal>
  );
}
