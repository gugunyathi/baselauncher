/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Base Account SDK Integration
 * Provides automatic wallet setup with passkey backup support
 */
import { createBaseAccountSDK, pay, getPaymentStatus } from '@base-org/account';

// Storage keys for persistence
const STORAGE_KEYS = {
  WALLET_ADDRESS: 'baseAccount_address',
  IS_CONNECTED: 'baseAccount_connected',
  SETUP_COMPLETE: 'baseAccount_setupComplete',
  TRANSACTION_HISTORY: 'baseAccount_transactions',
};

// App configuration
const APP_CONFIG = {
  appName: 'Base Phone Launcher',
  appLogoUrl: 'https://baselauncher.vercel.app/icon-192x192.png',
};

// Base Chain IDs
export const CHAIN_IDS = {
  BASE_MAINNET: '0x2105', // 8453
  BASE_SEPOLIA: '0x14A34', // 84532 (testnet)
};

// Token contract addresses on Base
export const TOKEN_CONTRACTS = {
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base Mainnet
  WETH: '0x4200000000000000000000000000000000000006', // Wrapped ETH on Base
  cbETH: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', // Coinbase ETH
};

// ERC20 ABI for balance checking
const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// Create SDK instance (singleton)
let sdkInstance: ReturnType<typeof createBaseAccountSDK> | null = null;

/**
 * Get or create the Base Account SDK instance
 */
export function getBaseAccountSDK() {
  if (!sdkInstance) {
    sdkInstance = createBaseAccountSDK(APP_CONFIG);
  }
  return sdkInstance;
}

/**
 * Get the provider from the SDK
 */
export function getProvider() {
  return getBaseAccountSDK().getProvider();
}

/**
 * Check if Base Account is already set up (from localStorage)
 */
export function isAccountSetUp(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.SETUP_COMPLETE) === 'true';
  } catch {
    return false;
  }
}

/**
 * Get stored wallet address
 */
export function getStoredAddress(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
  } catch {
    return null;
  }
}

/**
 * Save wallet connection state to localStorage
 */
function saveConnectionState(address: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, address);
    localStorage.setItem(STORAGE_KEYS.IS_CONNECTED, 'true');
    localStorage.setItem(STORAGE_KEYS.SETUP_COMPLETE, 'true');
  } catch (error) {
    console.error('Failed to save connection state:', error);
  }
}

/**
 * Clear wallet connection state
 */
export function clearConnectionState() {
  try {
    localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
    localStorage.removeItem(STORAGE_KEYS.IS_CONNECTED);
    localStorage.removeItem(STORAGE_KEYS.SETUP_COMPLETE);
  } catch (error) {
    console.error('Failed to clear connection state:', error);
  }
}

/**
 * Switch to Base chain
 */
export async function switchToBaseChain(testnet = false): Promise<boolean> {
  try {
    const provider = getProvider();
    const chainId = testnet ? CHAIN_IDS.BASE_SEPOLIA : CHAIN_IDS.BASE_MAINNET;
    
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
    
    return true;
  } catch (error) {
    console.error('Failed to switch chain:', error);
    return false;
  }
}

export interface ConnectResult {
  success: boolean;
  address?: string;
  error?: string;
}

/**
 * Connect wallet with Sign in with Base (SIWB)
 * This creates a new account with passkey backup automatically
 */
export async function connectWallet(options?: {
  testnet?: boolean;
  nonce?: string;
}): Promise<ConnectResult> {
  try {
    const provider = getProvider();
    const testnet = options?.testnet ?? false;
    const chainId = testnet ? CHAIN_IDS.BASE_SEPOLIA : CHAIN_IDS.BASE_MAINNET;
    
    // Generate nonce for SIWE
    const nonce = options?.nonce ?? crypto.randomUUID().replace(/-/g, '');
    
    // Switch to Base chain first
    await switchToBaseChain(testnet);
    
    // Connect and authenticate with passkey
    // The SDK handles passkey creation/backup automatically
    const response = await provider.request({
      method: 'wallet_connect',
      params: [
        {
          version: '1',
          capabilities: {
            signInWithEthereum: {
              nonce,
              chainId,
            },
          },
        },
      ],
    });

    // Extract address from response
    const { accounts } = response as { accounts: Array<{ address: string }> };
    const address = accounts?.[0]?.address;
    
    if (!address) {
      throw new Error('No address returned from wallet');
    }

    // Save to localStorage for persistence
    saveConnectionState(address);

    return {
      success: true,
      address,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Connection failed';
    console.error('Wallet connection failed:', error);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Silent/background connection - tries to reconnect using stored session
 * Used for automatic setup on first launch
 */
export async function silentConnect(): Promise<ConnectResult> {
  // Check if already set up
  const storedAddress = getStoredAddress();
  if (storedAddress) {
    return {
      success: true,
      address: storedAddress,
    };
  }
  
  // Try to connect (this will prompt user if no existing session)
  return connectWallet();
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet(): Promise<void> {
  clearConnectionState();
  sdkInstance = null;
}

export interface PaymentOptions {
  amount: string;
  to: string;
  testnet?: boolean;
}

export interface PaymentResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Make a payment using Base Pay
 */
export async function makePayment(options: PaymentOptions): Promise<PaymentResult> {
  try {
    const { id } = await pay({
      amount: options.amount,
      to: options.to,
      testnet: options.testnet ?? false,
    });

    return {
      success: true,
      id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Payment failed';
    console.error('Payment failed:', error);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(paymentId: string, testnet = false): Promise<string> {
  try {
    const { status } = await getPaymentStatus({
      id: paymentId,
      testnet,
    });
    return status;
  } catch (error) {
    console.error('Failed to get payment status:', error);
    return 'unknown';
  }
}

/**
 * Format address for display (0x1234...5678)
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get ETH balance for an address
 */
export async function getEthBalance(address: string): Promise<string> {
  try {
    const provider = getProvider();
    const balance = await provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    }) as string;
    
    // Convert from wei to ETH
    const ethBalance = parseInt(balance, 16) / 1e18;
    return ethBalance.toFixed(6);
  } catch (error) {
    console.error('Failed to get ETH balance:', error);
    return '0';
  }
}

/**
 * Get ERC20 token balance
 */
export async function getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
  try {
    const provider = getProvider();
    
    // Encode the balanceOf function call
    const data = `0x70a08231000000000000000000000000${walletAddress.slice(2)}`;
    
    const result = await provider.request({
      method: 'eth_call',
      params: [
        {
          to: tokenAddress,
          data,
        },
        'latest',
      ],
    }) as string;
    
    // Parse the result (assuming 6 decimals for USDC, 18 for others)
    const decimals = tokenAddress === TOKEN_CONTRACTS.USDC ? 6 : 18;
    const balance = parseInt(result, 16) / Math.pow(10, decimals);
    return balance.toFixed(decimals === 6 ? 2 : 6);
  } catch (error) {
    console.error('Failed to get token balance:', error);
    return '0';
  }
}

export interface WalletBalances {
  eth: string;
  usdc: string;
  totalUsd: number;
}

/**
 * Get all wallet balances
 */
export async function getWalletBalances(address: string): Promise<WalletBalances> {
  try {
    const [eth, usdc] = await Promise.all([
      getEthBalance(address),
      getTokenBalance(TOKEN_CONTRACTS.USDC, address),
    ]);
    
    // Calculate total USD value (ETH price is approximate)
    const ethPrice = 2650; // TODO: Get real price from API
    const totalUsd = (parseFloat(eth) * ethPrice) + parseFloat(usdc);
    
    return {
      eth,
      usdc,
      totalUsd,
    };
  } catch (error) {
    console.error('Failed to get wallet balances:', error);
    return { eth: '0', usdc: '0', totalUsd: 0 };
  }
}

/**
 * Send ETH transaction
 */
export async function sendEth(to: string, amountEth: string): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const provider = getProvider();
    const address = getStoredAddress();
    
    if (!address) {
      throw new Error('Wallet not connected');
    }
    
    // Convert ETH to wei (hex)
    const weiValue = Math.floor(parseFloat(amountEth) * 1e18);
    const hexValue = '0x' + weiValue.toString(16);
    
    const hash = await provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from: address,
        to,
        value: hexValue,
      }],
    }) as string;
    
    // Save to transaction history
    saveTransaction({
      hash,
      type: 'send',
      amount: amountEth,
      token: 'ETH',
      to,
      timestamp: Date.now(),
      status: 'pending',
    });
    
    return { success: true, hash };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
    console.error('Send ETH failed:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Sign a message with the wallet
 */
export async function signMessage(message: string): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    const provider = getProvider();
    const address = getStoredAddress();
    
    if (!address) {
      throw new Error('Wallet not connected');
    }
    
    const signature = await provider.request({
      method: 'personal_sign',
      params: [message, address],
    }) as string;
    
    return { success: true, signature };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Signing failed';
    console.error('Sign message failed:', error);
    return { success: false, error: errorMessage };
  }
}

export interface Transaction {
  hash: string;
  type: 'send' | 'receive' | 'payment';
  amount: string;
  token: string;
  to?: string;
  from?: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

/**
 * Save transaction to history
 */
function saveTransaction(tx: Transaction) {
  try {
    const history = getTransactionHistory();
    history.unshift(tx);
    // Keep only last 50 transactions
    const trimmed = history.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.TRANSACTION_HISTORY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save transaction:', error);
  }
}

/**
 * Get transaction history
 */
export function getTransactionHistory(): Transaction[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTION_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get transaction receipt/status
 */
export async function getTransactionReceipt(hash: string): Promise<{ status: 'pending' | 'confirmed' | 'failed' }> {
  try {
    const provider = getProvider();
    const receipt = await provider.request({
      method: 'eth_getTransactionReceipt',
      params: [hash],
    }) as { status: string } | null;
    
    if (!receipt) {
      return { status: 'pending' };
    }
    
    return { status: receipt.status === '0x1' ? 'confirmed' : 'failed' };
  } catch (error) {
    console.error('Failed to get transaction receipt:', error);
    return { status: 'pending' };
  }
}

/**
 * Get current chain ID
 */
export async function getChainId(): Promise<string> {
  try {
    const provider = getProvider();
    return await provider.request({ method: 'eth_chainId' }) as string;
  } catch (error) {
    console.error('Failed to get chain ID:', error);
    return CHAIN_IDS.BASE_MAINNET;
  }
}

/**
 * Check if on Base network
 */
export async function isOnBaseNetwork(): Promise<boolean> {
  const chainId = await getChainId();
  return chainId === CHAIN_IDS.BASE_MAINNET || chainId === CHAIN_IDS.BASE_SEPOLIA;
}
