
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef } from 'react';
import { LiveServerToolCall, Modality } from '@google/genai';

import BasicFace from '../basic-face/BasicFace';
import InfoDisplay from '../../InfoDisplay';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { createSystemInstructions } from '@/lib/prompts';
import { useAgent, useUI, useUser } from '@/lib/state';
import { TOOLS } from '@/lib/tools';
import confetti from 'canvas-confetti';

export default function KeynoteCompanion() {
  const { client, connected, setConfig } = useLiveAPIContext();
  const faceCanvasRef = useRef<HTMLCanvasElement>(null);
  const user = useUser();
  const { current, update: updateAgent } = useAgent();
  
  // UI Actions
  const { 
    setShowWallet, 
    setShowRewards, 
    setShowDialer, 
    setShowAppDrawer, 
    setShowUserConfig, 
    setShowAgentEdit 
  } = useUI();

  const { toggleBalanceVisibility, claimRewards } = useUser();

  // Set the configuration for the Live API
  useEffect(() => {
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: current.voice },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: createSystemInstructions(current, user),
          },
        ],
      },
      tools: TOOLS,
    });
  }, [setConfig, user, current]);

  // Handle Tool Calls
  useEffect(() => {
    const onToolCall = (toolCall: LiveServerToolCall) => {
      console.log('Tool call received:', toolCall);
      
      const functionResponses = toolCall.functionCalls.map((fc) => {
        let result = { status: 'success' };
        
        try {
          switch (fc.name) {
            case 'open_app': {
              const appName = (fc.args as any).appName?.toLowerCase();
              if (appName.includes('wallet') || appName.includes('money')) setShowWallet(true);
              else if (appName.includes('reward')) setShowRewards(true);
              else if (appName.includes('dialer') || appName.includes('phone') || appName.includes('call')) setShowDialer(true);
              else if (appName.includes('app') || appName.includes('drawer')) setShowAppDrawer(true);
              else if (appName.includes('setting') || appName.includes('profile')) setShowUserConfig(true);
              else if (appName.includes('edit') || appName.includes('agent')) setShowAgentEdit(true);
              break;
            }
            case 'close_app': {
              setShowWallet(false);
              setShowRewards(false);
              setShowDialer(false);
              setShowAppDrawer(false);
              setShowUserConfig(false);
              setShowAgentEdit(false);
              break;
            }
            case 'call_phone': {
              setShowDialer(true);
              // In a real app we would pre-fill the number here
              break;
            }
            case 'toggle_wallet_balance': {
              toggleBalanceVisibility();
              setShowWallet(true); // Open wallet so they can see the change
              break;
            }
            case 'claim_rewards': {
              claimRewards();
              setShowRewards(true); // Open rewards to show success
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
              });
              break;
            }
            case 'change_theme': {
                const themeId = (fc.args as any).themeId;
                if (themeId) {
                    updateAgent(current.id, { theme: themeId });
                }
                break;
            }
            default:
              console.warn('Unknown function call:', fc.name);
          }
        } catch (e) {
          console.error('Error executing tool:', e);
          result = { status: 'error' };
        }

        return {
          response: { result },
          id: fc.id,
          name: fc.name,
        };
      });

      client.sendToolResponse({ functionResponses });
    };

    client.on('toolcall', onToolCall);
    return () => {
      client.off('toolcall', onToolCall);
    };
  }, [client, setShowWallet, setShowRewards, setShowDialer, setShowAppDrawer, setShowUserConfig, setShowAgentEdit, toggleBalanceVisibility, claimRewards, updateAgent, current.id]);

  // Initiate the session when the Live API connection is established
  useEffect(() => {
    const beginSession = async () => {
      if (!connected) return;
      client.send(
        {
          text: 'Greet the user and introduce yourself and your role.',
        },
        true
      );
    };
    beginSession();
  }, [client, connected]);

  return (
    <div className="keynote-companion">
      <InfoDisplay />
      <BasicFace canvasRef={faceCanvasRef!} color={current.bodyColor} />
    </div>
  );
}
