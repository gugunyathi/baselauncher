
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';
import { Agent, Charlotte, Paul, Shane, Penny } from './presets/agents';
import { LanguageConfig, detectUserLanguage, saveLanguagePreference, LANGUAGE_CONFIGS } from './languages';

/**
 * Base Account Wallet State
 */
export type BaseAccountState = {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isInitialized: boolean;
  error: string | null;
};

/**
 * User
 */
export type User = {
  name?: string;
  info?: string;
  baseName?: string;
  joinDate?: string;
  avatar?: string;
  language: LanguageConfig;
  wallet: {
    base: number;
    eth: number;
    usdc: number;
    btc: number;
    showBalances: boolean;
  };
  baseAccount: BaseAccountState;
  rewards: {
    streak: number;
    points: number;
    lastClaimed: string | null;
  };
};

export const useUser = create<
  {
    setName: (name: string) => void;
    setInfo: (info: string) => void;
    setBaseName: (baseName: string) => void;
    setAvatar: (avatar: string) => void;
    setLanguage: (languageCode: string) => void;
    toggleBalanceVisibility: () => void;
    claimRewards: () => void;
    // Base Account actions
    setBaseAccountConnecting: (connecting: boolean) => void;
    setBaseAccountConnected: (address: string) => void;
    setBaseAccountError: (error: string | null) => void;
    setBaseAccountInitialized: (initialized: boolean) => void;
    disconnectBaseAccount: () => void;
  } & User
>(set => ({
  name: '',
  info: '',
  baseName: 'user.base.eth',
  joinDate: 'August 2023',
  avatar: undefined,
  language: detectUserLanguage(),
  wallet: {
    base: 0,
    eth: 0,
    usdc: 0,
    btc: 0,
    showBalances: true,
  },
  baseAccount: {
    address: null,
    isConnected: false,
    isConnecting: false,
    isInitialized: false,
    error: null,
  },
  rewards: {
    streak: 0,
    points: 0,
    lastClaimed: null,
  },
  setName: name => set({ name }),
  setInfo: info => set({ info }),
  setBaseName: baseName => set({ baseName }),
  setAvatar: avatar => set({ avatar }),
  setLanguage: (languageCode: string) => {
    const langConfig = LANGUAGE_CONFIGS[languageCode];
    if (langConfig) {
      saveLanguagePreference(languageCode);
      set({ language: langConfig });
    }
  },
  toggleBalanceVisibility: () =>
    set(state => ({
      wallet: { ...state.wallet, showBalances: !state.wallet.showBalances },
    })),
  claimRewards: () =>
    set(state => {
        // Prevent double claiming for demo purposes if needed, but for now just increment
        return {
            rewards: {
                ...state.rewards,
                points: state.rewards.points + 100,
                lastClaimed: new Date().toISOString(),
                streak: state.rewards.streak + 1
            }
        }
    }),
  // Base Account state management
  setBaseAccountConnecting: (connecting: boolean) =>
    set(state => ({
      baseAccount: { ...state.baseAccount, isConnecting: connecting, error: null },
    })),
  setBaseAccountConnected: (address: string) =>
    set(state => ({
      baseAccount: {
        ...state.baseAccount,
        address,
        isConnected: true,
        isConnecting: false,
        error: null,
      },
      baseName: `${address.slice(0, 6)}...${address.slice(-4)}.base.eth`,
    })),
  setBaseAccountError: (error: string | null) =>
    set(state => ({
      baseAccount: { ...state.baseAccount, error, isConnecting: false },
    })),
  setBaseAccountInitialized: (initialized: boolean) =>
    set(state => ({
      baseAccount: { ...state.baseAccount, isInitialized: initialized },
    })),
  disconnectBaseAccount: () =>
    set(state => ({
      baseAccount: {
        address: null,
        isConnected: false,
        isConnecting: false,
        isInitialized: true,
        error: null,
      },
      baseName: 'user.base.eth',
    })),
}));

/**
 * Agents
 */
function getAgentById(id: string) {
  const { availablePersonal, availablePresets } = useAgent.getState();
  return (
    availablePersonal.find(agent => agent.id === id) ||
    availablePresets.find(agent => agent.id === id)
  );
}

export const useAgent = create<{
  current: Agent;
  availablePresets: Agent[];
  availablePersonal: Agent[];
  setCurrent: (agent: Agent | string) => void;
  addAgent: (agent: Agent) => void;
  update: (agentId: string, adjustments: Partial<Agent>) => void;
}>(set => ({
  current: Paul,
  availablePresets: [Paul, Charlotte, Shane, Penny],
  availablePersonal: [],

  addAgent: (agent: Agent) => {
    set(state => ({
      availablePersonal: [...state.availablePersonal, agent],
      current: agent,
    }));
  },
  setCurrent: (agent: Agent | string) =>
    set({ current: typeof agent === 'string' ? getAgentById(agent) : agent }),
  update: (agentId: string, adjustments: Partial<Agent>) => {
    let agent = getAgentById(agentId);
    if (!agent) return;
    const updatedAgent = { ...agent, ...adjustments };
    set(state => ({
      availablePresets: state.availablePresets.map(a =>
        a.id === agentId ? updatedAgent : a
      ),
      availablePersonal: state.availablePersonal.map(a =>
        a.id === agentId ? updatedAgent : a
      ),
      current: state.current.id === agentId ? updatedAgent : state.current,
    }));
  },
}));

/**
 * UI
 */
export const useUI = create<{
  showUserConfig: boolean;
  setShowUserConfig: (show: boolean) => void;
  showAgentEdit: boolean;
  setShowAgentEdit: (show: boolean) => void;
  showWallet: boolean;
  setShowWallet: (show: boolean) => void;
  showAppDrawer: boolean;
  setShowAppDrawer: (show: boolean) => void;
  showRewards: boolean;
  setShowRewards: (show: boolean) => void;
  showDialer: boolean;
  setShowDialer: (show: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}>(set => ({
  showUserConfig: false,
  setShowUserConfig: (show: boolean) => set({ showUserConfig: show }),
  showAgentEdit: false,
  setShowAgentEdit: (show: boolean) => set({ showAgentEdit: show }),
  showWallet: false,
  setShowWallet: (show: boolean) => set({ showWallet: show }),
  showAppDrawer: false,
  setShowAppDrawer: (show: boolean) => set({ showAppDrawer: show }),
  showRewards: false,
  setShowRewards: (show: boolean) => set({ showRewards: show }),
  showDialer: false,
  setShowDialer: (show: boolean) => set({ showDialer: show }),
  showSettings: false,
  setShowSettings: (show: boolean) => set({ showSettings: show }),
}));
