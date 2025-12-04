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

// Detect if running in Android WebView
export function isAndroidWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  // Check for Android WebView indicators
  return (
    ua.includes('wv') || // WebView marker
    (ua.includes('android') && !ua.includes('chrome')) || // Android without Chrome
    (window as any).Android !== undefined // Our custom Android bridge
  );
}

// Detect if running in a restricted environment (WebView, iframe issues)
export function isRestrictedEnvironment(): boolean {
  if (typeof window === 'undefined') return true;
  
  // Check for Android WebView
  if (isAndroidWebView()) return true;
  
  // Check if popups are likely blocked
  try {
    // Some WebViews block window.open
    if (window.opener === null && window.parent === window) {
      // We're in a top-level context, should be fine
      return false;
    }
  } catch {
    return true;
  }
  
  return false;
}

// Base Chain IDs
export const CHAIN_IDS = {
  BASE_MAINNET: '0x2105', // 8453
  BASE_SEPOLIA: '0x14A34', // 84532 (testnet)
};

// Token contract addresses on Base Mainnet
export const TOKEN_CONTRACTS = {
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base Mainnet (6 decimals)
  WETH: '0x4200000000000000000000000000000000000006', // Wrapped ETH on Base (18 decimals)
  cbBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', // Coinbase Wrapped BTC (8 decimals)
  cbETH: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', // Coinbase Staked ETH (18 decimals)
};

// Token metadata
export const TOKEN_INFO: Record<string, { symbol: string; name: string; decimals: number; icon: string }> = {
  ETH: { symbol: 'ETH', name: 'Ethereum', decimals: 18, icon: 'eth' },
  USDC: { symbol: 'USDC', name: 'USD Coin', decimals: 6, icon: 'usdc' },
  cbBTC: { symbol: 'cbBTC', name: 'Coinbase BTC', decimals: 8, icon: 'btc' },
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
let sdkInitError: Error | null = null;

/**
 * Get or create the Base Account SDK instance
 */
export function getBaseAccountSDK() {
  if (sdkInitError) {
    throw sdkInitError;
  }
  
  if (!sdkInstance) {
    try {
      // Check for WebView before initializing
      if (isAndroidWebView()) {
        sdkInitError = new Error('Base Account SDK not supported in WebView');
        throw sdkInitError;
      }
      sdkInstance = createBaseAccountSDK(APP_CONFIG);
    } catch (error) {
      sdkInitError = error instanceof Error ? error : new Error('Failed to initialize SDK');
      throw sdkInitError;
    }
  }
  return sdkInstance;
}

/**
 * Check if Base Account SDK is available
 */
export function isBaseAccountAvailable(): boolean {
  if (isAndroidWebView()) return false;
  try {
    getBaseAccountSDK();
    return true;
  } catch {
    return false;
  }
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
  // Check if we're in a WebView - SDK popup won't work
  if (isAndroidWebView()) {
    console.warn('Base Account SDK requires browser environment. WebView detected.');
    return {
      success: false,
      error: 'Wallet connection requires opening in a browser. Please use the browser version at baselauncher.vercel.app',
    };
  }

  try {
    const provider = getProvider();
    const testnet = options?.testnet ?? false;
    const chainId = testnet ? CHAIN_IDS.BASE_SEPOLIA : CHAIN_IDS.BASE_MAINNET;
    
    // Generate nonce for SIWE
    const nonce = options?.nonce ?? crypto.randomUUID().replace(/-/g, '');
    
    // Switch to Base chain first
    await switchToBaseChain(testnet);
    
    // Set a timeout for the connection attempt
    const connectionPromise = provider.request({
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

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout - please try again')), 30000);
    });

    // Connect and authenticate with passkey
    // The SDK handles passkey creation/backup automatically
    const response = await Promise.race([connectionPromise, timeoutPromise]) as { accounts: Array<{ address: string }> };

    // Extract address from response
    const { accounts } = response;
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
    
    // Provide more helpful error messages
    if (errorMessage.includes('Communicator: failed to connect')) {
      return {
        success: false,
        error: 'Unable to connect to wallet service. Please check your internet connection and try again. If using the app, try the browser version.',
      };
    }
    
    if (errorMessage.includes('popup') || errorMessage.includes('blocked')) {
      return {
        success: false,
        error: 'Popup was blocked. Please allow popups for this site and try again.',
      };
    }
    
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
 * Get token decimals based on contract address
 */
function getTokenDecimals(tokenAddress: string): number {
  switch (tokenAddress.toLowerCase()) {
    case TOKEN_CONTRACTS.USDC.toLowerCase():
      return 6;
    case TOKEN_CONTRACTS.cbBTC.toLowerCase():
      return 8;
    default:
      return 18;
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
    
    // Parse the result based on token decimals
    const decimals = getTokenDecimals(tokenAddress);
    const balance = parseInt(result, 16) / Math.pow(10, decimals);
    
    // Format based on decimals
    if (decimals === 6) return balance.toFixed(2);
    if (decimals === 8) return balance.toFixed(8);
    return balance.toFixed(6);
  } catch (error) {
    console.error('Failed to get token balance:', error);
    return '0';
  }
}

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  balanceUsd: number;
  icon: string;
  contractAddress?: string;
}

export interface WalletBalances {
  tokens: TokenBalance[];
  totalUsd: number;
}

// Current approximate prices (in production, fetch from price API)
const TOKEN_PRICES: Record<string, number> = {
  ETH: 3500,
  USDC: 1,
  cbBTC: 100000,
};

/**
 * Fetch current token prices from CoinGecko
 */
export async function fetchTokenPrices(): Promise<Record<string, number>> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin,bitcoin&vs_currencies=usd'
    );
    const data = await response.json();
    return {
      ETH: data.ethereum?.usd || TOKEN_PRICES.ETH,
      USDC: data['usd-coin']?.usd || 1,
      cbBTC: data.bitcoin?.usd || TOKEN_PRICES.cbBTC,
    };
  } catch (error) {
    console.error('Failed to fetch token prices:', error);
    return TOKEN_PRICES;
  }
}

/**
 * Get all wallet balances with USD values
 */
export async function getWalletBalances(address: string): Promise<WalletBalances> {
  try {
    // Fetch balances and prices in parallel
    const [eth, usdc, cbBTC, prices] = await Promise.all([
      getEthBalance(address),
      getTokenBalance(TOKEN_CONTRACTS.USDC, address),
      getTokenBalance(TOKEN_CONTRACTS.cbBTC, address),
      fetchTokenPrices(),
    ]);
    
    const ethBalance = parseFloat(eth);
    const usdcBalance = parseFloat(usdc);
    const cbBTCBalance = parseFloat(cbBTC);
    
    const tokens: TokenBalance[] = [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        balance: eth,
        balanceUsd: ethBalance * prices.ETH,
        icon: 'eth',
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        balance: usdc,
        balanceUsd: usdcBalance * prices.USDC,
        icon: 'usdc',
        contractAddress: TOKEN_CONTRACTS.USDC,
      },
      {
        symbol: 'cbBTC',
        name: 'Coinbase BTC',
        balance: cbBTC,
        balanceUsd: cbBTCBalance * prices.cbBTC,
        icon: 'btc',
        contractAddress: TOKEN_CONTRACTS.cbBTC,
      },
    ];
    
    const totalUsd = tokens.reduce((sum, token) => sum + token.balanceUsd, 0);
    
    return {
      tokens,
      totalUsd,
    };
  } catch (error) {
    console.error('Failed to get wallet balances:', error);
    return { 
      tokens: [
        { symbol: 'ETH', name: 'Ethereum', balance: '0', balanceUsd: 0, icon: 'eth' },
        { symbol: 'USDC', name: 'USD Coin', balance: '0', balanceUsd: 0, icon: 'usdc', contractAddress: TOKEN_CONTRACTS.USDC },
        { symbol: 'cbBTC', name: 'Coinbase BTC', balance: '0', balanceUsd: 0, icon: 'btc', contractAddress: TOKEN_CONTRACTS.cbBTC },
      ],
      totalUsd: 0 
    };
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
 * Send ERC20 token (USDC or cbBTC)
 */
export async function sendERC20Token(
  tokenAddress: string, 
  to: string, 
  amount: string,
  decimals: number
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const provider = getProvider();
    const address = getStoredAddress();
    
    if (!address) {
      throw new Error('Wallet not connected');
    }
    
    // Convert amount to token units based on decimals
    const tokenUnits = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
    const hexAmount = '0x' + tokenUnits.toString(16).padStart(64, '0');
    const paddedTo = to.toLowerCase().replace('0x', '').padStart(64, '0');
    
    // ERC20 transfer function signature: transfer(address,uint256)
    const transferData = `0xa9059cbb${paddedTo}${hexAmount.replace('0x', '')}`;
    
    const hash = await provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from: address,
        to: tokenAddress,
        data: transferData,
      }],
    }) as string;
    
    return { success: true, hash };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
    console.error('Send ERC20 token failed:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send any supported token (ETH, USDC, cbBTC)
 */
export async function sendToken(
  token: string,
  to: string,
  amount: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  const upperToken = token.toUpperCase();
  
  try {
    let result: { success: boolean; hash?: string; error?: string };
    
    if (upperToken === 'ETH') {
      result = await sendEth(to, amount);
    } else if (upperToken === 'USDC') {
      result = await sendERC20Token(TOKEN_CONTRACTS.USDC, to, amount, 6);
    } else if (upperToken === 'CBBTC') {
      result = await sendERC20Token(TOKEN_CONTRACTS.cbBTC, to, amount, 8);
    } else {
      return { success: false, error: `Unsupported token: ${token}` };
    }
    
    if (result.success && result.hash) {
      // Save to transaction history
      saveTransaction({
        hash: result.hash,
        type: 'send',
        amount,
        token: upperToken,
        to,
        timestamp: Date.now(),
        status: 'pending',
      });
    }
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
    console.error('Send token failed:', error);
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
