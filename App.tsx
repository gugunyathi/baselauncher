
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import AgentEdit from './components/AgentEdit';
import ControlTray from './components/console/control-tray/ControlTray';
import ErrorScreen from './components/demo/ErrorScreen';
import KeynoteCompanion from './components/demo/keynote-companion/KeynoteCompanion';
import Header from './components/Header';
import UserSettings from './components/UserSettings';
import Wallet from './components/Wallet';
import AppDrawer from './components/AppDrawer';
import Rewards from './components/Rewards';
import Dialer from './components/Dialer';
import Settings from './components/Settings';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { useAgent, useUI } from './lib/state';
import { AGENT_THEMES } from '@/lib/presets/agents';
import { useAutoSetupBaseAccount } from '@/hooks/useBaseAccount';

const API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * Main application component that provides a streaming interface for Live API.
 * Manages video streaming state and provides controls for webcam/screen capture.
 */
function App() {
  // Show error if API key is missing
  if (!API_KEY) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100%',
        backgroundColor: '#000',
        color: '#fff',
        fontSize: '18px',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div>
          <h2>Configuration Required</h2>
          <p>Please set the GEMINI_API_KEY environment variable to use this app.</p>
        </div>
      </div>
    );
  }
  
  // Auto-setup Base Account on first launch
  // This will prompt user to create a passkey-backed wallet
  useAutoSetupBaseAccount();
  
  const { 
    showUserConfig, 
    showAgentEdit, 
    showWallet, 
    showAppDrawer, 
    showRewards,
    showDialer,
    showSettings
  } = useUI();
  const { current } = useAgent();

  const currentTheme = AGENT_THEMES.find(t => t.id === current.theme) || AGENT_THEMES[0];

  return (
    <div className="App" style={{ background: currentTheme.css }}>
      <LiveAPIProvider apiKey={API_KEY}>
        <ErrorScreen />
        <Header />

        {showUserConfig && <UserSettings />}
        {showAgentEdit && <AgentEdit />}
        {showWallet && <Wallet />}
        {showAppDrawer && <AppDrawer />}
        {showRewards && <Rewards />}
        {showDialer && <Dialer />}
        {showSettings && <Settings />}

        <div className="streaming-console">
          <main>
            <div className="main-app-area">
              <KeynoteCompanion />
            </div>

            <ControlTray></ControlTray>
          </main>
        </div>

      </LiveAPIProvider>
    </div>
  );
}

export default App;
