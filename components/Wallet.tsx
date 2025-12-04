
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import Modal from './Modal';
import { useUI, useUser } from '@/lib/state';

export default function Wallet() {
  const { wallet, toggleBalanceVisibility } = useUser();
  const { setShowWallet } = useUI();

  // Mock Exchange Rates for demo purposes
  const RATES = {
    BASE: 5.25,
    ETH: 2650.00,
    USDC: 1.00,
    BTC: 64000.00
  };

  const totalValue = 
    (wallet.base * RATES.BASE) + 
    (wallet.eth * RATES.ETH) + 
    (wallet.usdc * RATES.USDC) + 
    (wallet.btc * RATES.BTC);

  const formatCurrency = (amount: number, currency: string) => {
    if (!wallet.showBalances) return '••••••';
    if (currency === 'USDC') return `$${amount.toLocaleString()}`;
    return `${amount} ${currency}`;
  };

  return (
    <Modal onClose={() => setShowWallet(false)}>
      <div className="wallet-widget">
        <div className="wallet-header">
          <h2>My Wallet</h2>
          <button onClick={toggleBalanceVisibility} className="toggle-balance">
            <span className="icon">
              {wallet.showBalances ? 'visibility' : 'visibility_off'}
            </span>
          </button>
        </div>

        <div className="wallet-total-display">
            <span className="label">Total Balance</span>
            <span className="value">
                {wallet.showBalances 
                    ? `$${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                    : '••••••••'
                }
            </span>
        </div>

        <div className="assets-list">
          <div className="asset-item">
            <div className="asset-info">
              <span className="asset-icon base-icon"></span>
              <span className="asset-name">BASE</span>
            </div>
            <span className="asset-balance">{formatCurrency(wallet.base, 'BASE')}</span>
          </div>
          
          <div className="asset-item">
            <div className="asset-info">
              <span className="asset-icon eth-icon"></span>
              <span className="asset-name">ETH</span>
            </div>
            <span className="asset-balance">{formatCurrency(wallet.eth, 'ETH')}</span>
          </div>

          <div className="asset-item">
            <div className="asset-info">
              <span className="asset-icon usdc-icon"></span>
              <span className="asset-name">USDC</span>
            </div>
            <span className="asset-balance">{formatCurrency(wallet.usdc, 'USDC')}</span>
          </div>

          <div className="asset-item">
            <div className="asset-info">
              <span className="asset-icon btc-icon"></span>
              <span className="asset-name">BTC</span>
            </div>
            <span className="asset-balance">{formatCurrency(wallet.btc, 'BTC')}</span>
          </div>
        </div>

        <div className="wallet-actions">
           <button className="button primary">Send</button>
           <button className="button primary">Receive</button>
        </div>
      </div>
    </Modal>
  );
}
