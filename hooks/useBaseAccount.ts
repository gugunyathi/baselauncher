/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * useBaseAccount Hook
 * Manages Base Account connection state and provides automatic setup on first use
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useUser } from '@/lib/state';
import {
  connectWallet,
  disconnectWallet,
  getStoredAddress,
  isAccountSetUp,
  formatAddress,
  makePayment,
  checkPaymentStatus,
  getWalletBalances,
  sendEth,
  signMessage,
  getTransactionHistory,
  getTransactionReceipt,
  isOnBaseNetwork,
  switchToBaseChain,
  PaymentOptions,
  WalletBalances,
  Transaction,
} from '@/lib/baseAccount';

export interface UseBaseAccountReturn {
  // State
  address: string | null;
  formattedAddress: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isInitialized: boolean;
  error: string | null;
  balances: WalletBalances | null;
  isLoadingBalances: boolean;
  transactions: Transaction[];
  isOnBase: boolean;
  
  // Actions
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  pay: (options: PaymentOptions) => Promise<{ success: boolean; id?: string; error?: string }>;
  getPaymentStatus: (paymentId: string) => Promise<string>;
  refreshBalances: () => Promise<void>;
  send: (to: string, amount: string) => Promise<{ success: boolean; hash?: string; error?: string }>;
  sign: (message: string) => Promise<{ success: boolean; signature?: string; error?: string }>;
  refreshTransactions: () => void;
  checkTxStatus: (hash: string) => Promise<{ status: 'pending' | 'confirmed' | 'failed' }>;
  switchNetwork: () => Promise<boolean>;
}

/**
 * Hook for managing Base Account connection
 * Automatically initializes and connects on first use
 */
export function useBaseAccount(): UseBaseAccountReturn {
  const {
    baseAccount,
    setBaseAccountConnecting,
    setBaseAccountConnected,
    setBaseAccountError,
    setBaseAccountInitialized,
    disconnectBaseAccount,
  } = useUser();

  const initAttempted = useRef(false);
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isOnBase, setIsOnBase] = useState(true);

  /**
   * Initialize Base Account on mount
   * Checks localStorage for existing connection
   */
  useEffect(() => {
    if (initAttempted.current || baseAccount.isInitialized) {
      return;
    }
    
    initAttempted.current = true;

    const initializeAccount = async () => {
      // Check if already set up
      if (isAccountSetUp()) {
        const storedAddress = getStoredAddress();
        if (storedAddress) {
          setBaseAccountConnected(storedAddress);
          setBaseAccountInitialized(true);
          // Load transactions from storage
          setTransactions(getTransactionHistory());
          return;
        }
      }
      
      // Mark as initialized but not connected
      setBaseAccountInitialized(true);
    };

    initializeAccount();
  }, [baseAccount.isInitialized, setBaseAccountConnected, setBaseAccountInitialized]);

  /**
   * Load balances when connected
   */
  useEffect(() => {
    if (baseAccount.isConnected && baseAccount.address) {
      refreshBalances();
      checkNetwork();
    }
  }, [baseAccount.isConnected, baseAccount.address]);

  /**
   * Refresh wallet balances
   */
  const refreshBalances = useCallback(async () => {
    if (!baseAccount.address) return;
    
    setIsLoadingBalances(true);
    try {
      const newBalances = await getWalletBalances(baseAccount.address);
      setBalances(newBalances);
    } catch (error) {
      console.error('Failed to refresh balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [baseAccount.address]);

  /**
   * Check if on Base network
   */
  const checkNetwork = useCallback(async () => {
    const onBase = await isOnBaseNetwork();
    setIsOnBase(onBase);
  }, []);

  /**
   * Connect to Base Account
   * Creates a new account with passkey if first time
   */
  const connect = useCallback(async (): Promise<boolean> => {
    if (baseAccount.isConnecting) {
      return false;
    }

    setBaseAccountConnecting(true);
    setBaseAccountError(null);

    try {
      const result = await connectWallet({ testnet: false });
      
      if (result.success && result.address) {
        setBaseAccountConnected(result.address);
        setTransactions(getTransactionHistory());
        return true;
      } else {
        setBaseAccountError(result.error || 'Connection failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setBaseAccountError(errorMessage);
      return false;
    }
  }, [baseAccount.isConnecting, setBaseAccountConnecting, setBaseAccountConnected, setBaseAccountError]);

  /**
   * Disconnect from Base Account
   */
  const disconnect = useCallback(async (): Promise<void> => {
    await disconnectWallet();
    disconnectBaseAccount();
    setBalances(null);
    setTransactions([]);
  }, [disconnectBaseAccount]);

  /**
   * Make a payment using Base Pay
   */
  const pay = useCallback(async (options: PaymentOptions) => {
    const result = await makePayment(options);
    if (result.success) {
      // Refresh balances after payment
      setTimeout(refreshBalances, 2000);
    }
    return result;
  }, [refreshBalances]);

  /**
   * Get payment status
   */
  const getStatus = useCallback(async (paymentId: string) => {
    return checkPaymentStatus(paymentId);
  }, []);

  /**
   * Send ETH
   */
  const send = useCallback(async (to: string, amount: string) => {
    const result = await sendEth(to, amount);
    if (result.success) {
      setTransactions(getTransactionHistory());
      // Refresh balances after sending
      setTimeout(refreshBalances, 3000);
    }
    return result;
  }, [refreshBalances]);

  /**
   * Sign a message
   */
  const sign = useCallback(async (message: string) => {
    return signMessage(message);
  }, []);

  /**
   * Refresh transaction history
   */
  const refreshTransactions = useCallback(() => {
    setTransactions(getTransactionHistory());
  }, []);

  /**
   * Check transaction status
   */
  const checkTxStatus = useCallback(async (hash: string) => {
    return getTransactionReceipt(hash);
  }, []);

  /**
   * Switch to Base network
   */
  const switchNetwork = useCallback(async () => {
    const success = await switchToBaseChain(false);
    if (success) {
      setIsOnBase(true);
    }
    return success;
  }, []);

  return {
    // State
    address: baseAccount.address,
    formattedAddress: baseAccount.address ? formatAddress(baseAccount.address) : null,
    isConnected: baseAccount.isConnected,
    isConnecting: baseAccount.isConnecting,
    isInitialized: baseAccount.isInitialized,
    error: baseAccount.error,
    balances,
    isLoadingBalances,
    transactions,
    isOnBase,
    
    // Actions
    connect,
    disconnect,
    pay,
    getPaymentStatus: getStatus,
    refreshBalances,
    send,
    sign,
    refreshTransactions,
    checkTxStatus,
    switchNetwork,
  };
}

/**
 * Hook for automatic Base Account setup on first launch
 * Call this once at the app level to trigger automatic setup
 */
export function useAutoSetupBaseAccount(): void {
  const { baseAccount } = useUser();
  const { connect } = useBaseAccount();
  const setupAttempted = useRef(false);

  useEffect(() => {
    // Only attempt once
    if (setupAttempted.current) {
      return;
    }

    // Wait for initialization check to complete
    if (!baseAccount.isInitialized) {
      return;
    }

    // If already connected, no need to setup
    if (baseAccount.isConnected) {
      return;
    }

    // Check if this is first time (no stored address)
    if (!isAccountSetUp()) {
      setupAttempted.current = true;
      // Attempt automatic connection in background
      // Note: This will prompt user for passkey creation on first use
      // The SDK handles passkey backup to device automatically
      connect().catch(console.error);
    }
  }, [baseAccount.isInitialized, baseAccount.isConnected, connect]);
}
