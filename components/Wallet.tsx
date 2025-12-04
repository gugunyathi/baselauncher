
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useUI, useUser } from '@/lib/state';
import { useBaseAccount } from '@/hooks/useBaseAccount';
import { Transaction, TokenBalance } from '@/lib/baseAccount';

type WalletTab = 'assets' | 'activity' | 'send' | 'receive';
type SendToken = 'ETH' | 'USDC' | 'cbBTC';

export default function Wallet() {
  const { wallet, toggleBalanceVisibility } = useUser();
  const { setShowWallet } = useUI();
  const {
    address,
    formattedAddress,
    isConnected,
    isConnecting,
    error,
    balances,
    isLoadingBalances,
    transactions,
    isOnBase,
    connect,
    disconnect,
    pay,
    refreshBalances,
    send,
    sign,
    switchNetwork,
  } = useBaseAccount();

  const [activeTab, setActiveTab] = useState<WalletTab>('assets');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  
  // Send form state
  const [sendAmount, setSendAmount] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sendToken, setSendToken] = useState<SendToken>('ETH');
  const [isSending, setIsSending] = useState(false);
  
  // Sign message state
  const [showSignModal, setShowSignModal] = useState(false);
  const [messageToSign, setMessageToSign] = useState('');
  const [signedResult, setSignedResult] = useState<string | null>(null);

  // Auto-clear status messages
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage(message);
    setStatusType(type);
  };

  const handleConnect = async () => {
    const success = await connect();
    if (success) {
      showStatus('Connected to Base Account!', 'success');
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    showStatus('Disconnected', 'info');
  };

  const handleSend = async () => {
    if (!sendAmount || !sendTo) {
      showStatus('Please enter amount and recipient address', 'error');
      return;
    }

    if (!sendTo.startsWith('0x') || sendTo.length !== 42) {
      showStatus('Invalid address format', 'error');
      return;
    }

    setIsSending(true);
    
    try {
      if (sendToken === 'ETH') {
        const result = await send(sendTo, sendAmount);
        if (result.success) {
          showStatus(`Transaction sent! Hash: ${result.hash?.slice(0, 10)}...`, 'success');
          setSendAmount('');
          setSendTo('');
          setActiveTab('activity');
        } else {
          showStatus(`Failed: ${result.error}`, 'error');
        }
      } else {
        // Use Base Pay for USDC
        const result = await pay({
          amount: sendAmount,
          to: sendTo,
          testnet: false,
        });
        if (result.success) {
          showStatus(`Payment sent! ID: ${result.id}`, 'success');
          setSendAmount('');
          setSendTo('');
          setActiveTab('activity');
        } else {
          showStatus(`Failed: ${result.error}`, 'error');
        }
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSignMessage = async () => {
    if (!messageToSign) {
      showStatus('Please enter a message to sign', 'error');
      return;
    }

    const result = await sign(messageToSign);
    if (result.success) {
      setSignedResult(result.signature || null);
      showStatus('Message signed!', 'success');
    } else {
      showStatus(`Failed to sign: ${result.error}`, 'error');
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      showStatus('Address copied!', 'success');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showStatus('Copied!', 'success');
  };

  const formatTxTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed': return '✓';
      case 'failed': return '✗';
      default: return '⏳';
    }
  };

  // Get token icon class
  const getTokenIconClass = (icon: string) => {
    switch (icon) {
      case 'eth': return 'eth-icon';
      case 'usdc': return 'usdc-icon';
      case 'btc': return 'btc-icon';
      default: return 'eth-icon';
    }
  };

  // Format balance for display
  const formatBalance = (balance: string, symbol: string) => {
    const num = parseFloat(balance);
    if (symbol === 'USDC') return num.toFixed(2);
    if (symbol === 'cbBTC') return num.toFixed(8);
    return num.toFixed(6);
  };

  // Get available balance for selected send token
  const getAvailableBalance = () => {
    if (!balances?.tokens) return '0';
    const token = balances.tokens.find(t => t.symbol === sendToken);
    return token?.balance || '0';
  };

  // Calculate total balance
  const totalUsd = balances?.totalUsd || 0;

  return (
    <Modal onClose={() => setShowWallet(false)}>
      <div className="wallet-widget">
        {/* Header */}
        <div className="wallet-header">
          <h2>Wallet</h2>
          <div className="wallet-header-actions">
            {isConnected && (
              <button onClick={() => refreshBalances()} className="refresh-btn" title="Refresh">
                <span className="icon">{isLoadingBalances ? 'sync' : 'refresh'}</span>
              </button>
            )}
            <button onClick={toggleBalanceVisibility} className="toggle-balance">
              <span className="icon">
                {wallet.showBalances ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="base-account-status">
          {isConnected ? (
            <>
              <div className="connected-status">
                <span className="status-dot connected"></span>
                <span className="address" onClick={copyAddress} title="Click to copy full address">
                  {formattedAddress}
                </span>
                {!isOnBase && (
                  <button onClick={switchNetwork} className="switch-network-btn">
                    Switch to Base
                  </button>
                )}
              </div>
              <button onClick={handleDisconnect} className="disconnect-btn-small">
                Disconnect
              </button>
            </>
          ) : (
            <button 
              onClick={handleConnect} 
              className="connect-base-btn"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <span className="icon spinning">sync</span>
                  Connecting...
                </>
              ) : (
                <>
                  <span className="base-logo">◆</span>
                  Connect Base Account
                </>
              )}
            </button>
          )}
          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Balance Display */}
        {isConnected && (
          <div className="wallet-total-display">
            <span className="label">Total Balance</span>
            <span className="value">
              {wallet.showBalances 
                ? isLoadingBalances 
                  ? 'Loading...'
                  : `$${totalUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                : '••••••••'
              }
            </span>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div className={`status-message ${statusType}`}>
            {statusMessage}
          </div>
        )}

        {/* Tab Navigation */}
        {isConnected && (
          <div className="wallet-tabs">
            <button 
              className={`tab ${activeTab === 'assets' ? 'active' : ''}`}
              onClick={() => setActiveTab('assets')}
            >
              Assets
            </button>
            <button 
              className={`tab ${activeTab === 'send' ? 'active' : ''}`}
              onClick={() => setActiveTab('send')}
            >
              Send
            </button>
            <button 
              className={`tab ${activeTab === 'receive' ? 'active' : ''}`}
              onClick={() => setActiveTab('receive')}
            >
              Receive
            </button>
            <button 
              className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              Activity
            </button>
          </div>
        )}

        {/* Tab Content */}
        {isConnected && (
          <div className="wallet-tab-content">
            {/* Assets Tab */}
            {activeTab === 'assets' && (
              <div className="assets-list">
                {isLoadingBalances ? (
                  <div className="loading-assets">Loading tokens...</div>
                ) : balances?.tokens && balances.tokens.length > 0 ? (
                  balances.tokens.map((token) => (
                    <div className="asset-item" key={token.symbol}>
                      <div className="asset-info">
                        <span className={`asset-icon ${getTokenIconClass(token.icon)}`}></span>
                        <div className="asset-details">
                          <span className="asset-name">{token.name}</span>
                          <span className="asset-symbol">{token.symbol}</span>
                        </div>
                      </div>
                      <div className="asset-balance-info">
                        <span className="asset-balance">
                          {wallet.showBalances 
                            ? `${formatBalance(token.balance, token.symbol)} ${token.symbol}` 
                            : '••••••'
                          }
                        </span>
                        <span className="asset-usd">
                          {wallet.showBalances 
                            ? `$${token.balanceUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                            : '••••'
                          }
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-assets">No tokens found</div>
                )}

                <button 
                  className="action-link"
                  onClick={() => setShowSignModal(true)}
                >
                  <span className="icon">edit</span>
                  Sign Message
                </button>
              </div>
            )}

            {/* Send Tab */}
            {activeTab === 'send' && (
              <div className="send-form-container">
                <div className="token-selector">
                  <button 
                    className={`token-btn ${sendToken === 'ETH' ? 'active' : ''}`}
                    onClick={() => setSendToken('ETH')}
                  >
                    <span className="asset-icon eth-icon small"></span>
                    ETH
                  </button>
                  <button 
                    className={`token-btn ${sendToken === 'USDC' ? 'active' : ''}`}
                    onClick={() => setSendToken('USDC')}
                  >
                    <span className="asset-icon usdc-icon small"></span>
                    USDC
                  </button>
                  <button 
                    className={`token-btn ${sendToken === 'cbBTC' ? 'active' : ''}`}
                    onClick={() => setSendToken('cbBTC')}
                  >
                    <span className="asset-icon btc-icon small"></span>
                    cbBTC
                  </button>
                </div>

                <div className="send-form">
                  <div className="input-group">
                    <label>Amount</label>
                    <div className="amount-input-wrapper">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={sendAmount}
                        onChange={e => setSendAmount(e.target.value)}
                        className="send-input amount-input"
                      />
                      <span className="token-label">{sendToken}</span>
                    </div>
                    <span className="balance-hint">
                      Available: {getAvailableBalance()} {sendToken}
                    </span>
                  </div>

                  <div className="input-group">
                    <label>Recipient Address</label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={sendTo}
                      onChange={e => setSendTo(e.target.value)}
                      className="send-input"
                    />
                  </div>

                  <button 
                    onClick={handleSend} 
                    className="send-btn primary"
                    disabled={isSending || !sendAmount || !sendTo}
                  >
                    {isSending ? (
                      <>
                        <span className="icon spinning">sync</span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <span className="icon">send</span>
                        Send {sendToken}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Receive Tab */}
            {activeTab === 'receive' && (
              <div className="receive-container">
                <div className="qr-placeholder">
                  <div className="qr-code">
                    {/* Simple visual representation of QR */}
                    <div className="qr-pattern">
                      <span className="icon" style={{ fontSize: '80px' }}>qr_code_2</span>
                    </div>
                  </div>
                </div>
                
                <div className="address-display">
                  <span className="full-address">{address}</span>
                  <button onClick={copyAddress} className="copy-btn">
                    <span className="icon">content_copy</span>
                    Copy Address
                  </button>
                </div>

                <p className="receive-note">
                  Send only ETH or ERC-20 tokens on Base network to this address.
                </p>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="activity-list">
                {transactions.length === 0 ? (
                  <div className="empty-state">
                    <span className="icon">history</span>
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  transactions.map((tx, i) => (
                    <div key={tx.hash + i} className={`activity-item ${tx.status}`}>
                      <div className="activity-icon">
                        <span className="icon">
                          {tx.type === 'send' ? 'arrow_upward' : tx.type === 'receive' ? 'arrow_downward' : 'payment'}
                        </span>
                      </div>
                      <div className="activity-details">
                        <div className="activity-header">
                          <span className="activity-type">
                            {tx.type === 'send' ? 'Sent' : tx.type === 'receive' ? 'Received' : 'Payment'}
                          </span>
                          <span className="activity-amount">
                            {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.token}
                          </span>
                        </div>
                        <div className="activity-meta">
                          <span className="activity-time">{formatTxTime(tx.timestamp)}</span>
                          <span className={`activity-status ${tx.status}`}>
                            {getStatusIcon(tx.status)} {tx.status}
                          </span>
                        </div>
                        {tx.to && (
                          <span 
                            className="activity-address"
                            onClick={() => copyToClipboard(tx.hash)}
                            title="Click to copy tx hash"
                          >
                            To: {tx.to.slice(0, 8)}...{tx.to.slice(-6)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Not Connected State */}
        {!isConnected && (
          <div className="not-connected-state">
            <div className="welcome-icon">
              <span className="icon">account_balance_wallet</span>
            </div>
            <h3>Welcome to Base Wallet</h3>
            <p>Connect your Base Account to view balances, send transactions, and manage your crypto.</p>
            <ul className="feature-list">
              <li><span className="icon">check</span> Passkey-secured wallet</li>
              <li><span className="icon">check</span> Send & receive ETH and USDC</li>
              <li><span className="icon">check</span> Transaction history</li>
              <li><span className="icon">check</span> Sign messages</li>
            </ul>
          </div>
        )}

        {/* Sign Message Modal */}
        {showSignModal && (
          <div className="sign-modal-overlay" onClick={() => setShowSignModal(false)}>
            <div className="sign-modal" onClick={e => e.stopPropagation()}>
              <div className="sign-modal-header">
                <h3>Sign Message</h3>
                <button onClick={() => setShowSignModal(false)} className="close-btn">
                  <span className="icon">close</span>
                </button>
              </div>
              
              <div className="sign-form">
                <textarea
                  placeholder="Enter message to sign..."
                  value={messageToSign}
                  onChange={e => setMessageToSign(e.target.value)}
                  className="sign-textarea"
                  rows={4}
                />
                
                <button onClick={handleSignMessage} className="sign-btn primary">
                  <span className="icon">edit</span>
                  Sign with Passkey
                </button>

                {signedResult && (
                  <div className="signature-result">
                    <label>Signature:</label>
                    <div className="signature-value" onClick={() => copyToClipboard(signedResult)}>
                      {signedResult.slice(0, 20)}...{signedResult.slice(-20)}
                      <span className="icon">content_copy</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
