
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';
import { Agent, Charlotte, Paul, Shane, Penny } from './presets/agents';

/**
 * User
 */
export type User = {
  name?: string;
  info?: string;
  baseName?: string;
  joinDate?: string;
  avatar?: string;
  wallet: {
    base: number;
    eth: number;
    usdc: number;
    btc: number;
    showBalances: boolean;
  };
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
    toggleBalanceVisibility: () => void;
    claimRewards: () => void;
  } & User
>(set => ({
  name: '',
  info: '',
  baseName: 'user.base.eth',
  joinDate: 'August 2023',
  avatar: undefined,
  wallet: {
    base: 1540.50, // Mock "BASE" ecosystem value or token
    eth: 0.45,
    usdc: 1200.00,
    btc: 0.02,
    showBalances: true,
  },
  rewards: {
    streak: 5,
    points: 450,
    lastClaimed: null,
  },
  setName: name => set({ name }),
  setInfo: info => set({ info }),
  setBaseName: baseName => set({ baseName }),
  setAvatar: avatar => set({ avatar }),
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
