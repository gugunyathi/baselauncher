
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef, useState } from 'react';
import { LiveServerToolCall, Modality } from '@google/genai';

import BasicFace from '../basic-face/BasicFace';
import InfoDisplay from '../../InfoDisplay';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { createSystemInstructions } from '@/lib/prompts';
import { useAgent, useUI, useUser } from '@/lib/state';
import { TOOLS } from '@/lib/tools';
import { useBaseAccount } from '@/hooks/useBaseAccount';
import { sendToken } from '@/lib/baseAccount';
import { LANGUAGE_CONFIGS } from '@/lib/languages';
import confetti from 'canvas-confetti';

// App package mappings for launching
const APP_PACKAGES: Record<string, string> = {
  'whatsapp': 'com.whatsapp',
  'instagram': 'com.instagram.android',
  'facebook': 'com.facebook.katana',
  'twitter': 'com.twitter.android',
  'x': 'com.twitter.android',
  'telegram': 'org.telegram.messenger',
  'youtube': 'com.google.android.youtube',
  'spotify': 'com.spotify.music',
  'netflix': 'com.netflix.mediaclient',
  'tiktok': 'com.zhiliaoapp.musically',
  'snapchat': 'com.snapchat.android',
  'messenger': 'com.facebook.orca',
  'discord': 'com.discord',
  'gmail': 'com.google.android.gm',
  'maps': 'com.google.android.apps.maps',
  'drive': 'com.google.android.apps.docs',
  'calendar': 'com.google.android.calendar',
  'clock': 'com.google.android.deskclock',
  'calculator': 'com.google.android.calculator',
  'camera': 'com.android.camera',
  'photos': 'com.google.android.apps.photos',
  'chrome': 'com.android.chrome',
  'browser': 'com.android.chrome',
  'phone': 'com.google.android.dialer',
  'contacts': 'com.google.android.contacts',
  'messages': 'com.google.android.apps.messaging',
  'playstore': 'com.android.vending',
  'play store': 'com.android.vending',
  'files': 'com.google.android.documentsui',
  'settings': 'com.android.settings',
};

export default function KeynoteCompanion() {
  const { client, connected, setConfig } = useLiveAPIContext();
  const faceCanvasRef = useRef<HTMLCanvasElement>(null);
  const user = useUser();
  const { current, update: updateAgent } = useAgent();
  const { balances, address, refreshBalances } = useBaseAccount();
  const [pendingCryptoTx, setPendingCryptoTx] = useState<{
    token: string;
    amount: string;
    recipientAddress: string;
    recipientName?: string;
  } | null>(null);
  
  // UI Actions
  const { 
    setShowWallet, 
    setShowRewards, 
    setShowDialer, 
    setShowAppDrawer, 
    setShowUserConfig, 
    setShowAgentEdit 
  } = useUI();

  const { toggleBalanceVisibility, claimRewards, setLanguage, language } = useUser();

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

  // Helper function to launch Android app
  const launchAndroidApp = (packageName: string) => {
    if ((window as any).Android?.launchApp) {
      (window as any).Android.launchApp(packageName);
      return true;
    }
    // Fallback: try intent URL
    const intentUrl = `intent://#Intent;package=${packageName};end`;
    window.location.href = intentUrl;
    return true;
  };

  // Helper to make phone call
  const makePhoneCall = (phoneNumber: string) => {
    const telUrl = `tel:${phoneNumber.replace(/\s+/g, '')}`;
    if ((window as any).Android?.makeCall) {
      (window as any).Android.makeCall(phoneNumber);
    } else {
      window.location.href = telUrl;
    }
  };

  // Helper to send SMS
  const sendSMS = (phoneNumber: string, message: string) => {
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    if ((window as any).Android?.sendSMS) {
      (window as any).Android.sendSMS(phoneNumber, message);
    } else {
      window.location.href = smsUrl;
    }
  };

  // Helper to send WhatsApp message
  const sendWhatsAppMessage = (phoneNumber: string, message: string) => {
    // Remove any non-digit characters except +
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    const waUrl = `https://wa.me/${cleanNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  // Handle Tool Calls
  useEffect(() => {
    const onToolCall = async (toolCall: LiveServerToolCall) => {
      console.log('Tool call received:', toolCall);
      
      const functionResponses = await Promise.all(toolCall.functionCalls.map(async (fc) => {
        let result: any = { status: 'success' };
        
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
              const phoneNumber = (fc.args as any).phoneNumber;
              if (phoneNumber) {
                makePhoneCall(phoneNumber);
                result = { status: 'success', message: `Calling ${phoneNumber}` };
              } else {
                setShowDialer(true);
                result = { status: 'success', message: 'Opened dialer' };
              }
              break;
            }
            
            case 'send_sms': {
              const { phoneNumber, message, contactName } = fc.args as any;
              if (phoneNumber && message) {
                sendSMS(phoneNumber, message);
                result = { status: 'success', message: `Sending SMS to ${contactName || phoneNumber}` };
              } else {
                result = { status: 'error', message: 'Missing phone number or message' };
              }
              break;
            }
            
            case 'send_whatsapp': {
              const { phoneNumber, message, contactName } = fc.args as any;
              if (phoneNumber && message) {
                sendWhatsAppMessage(phoneNumber, message);
                result = { status: 'success', message: `Sending WhatsApp message to ${contactName || phoneNumber}` };
              } else {
                result = { status: 'error', message: 'Missing phone number or message' };
              }
              break;
            }
            
            case 'send_crypto': {
              const { token, amount, recipientAddress, recipientName } = fc.args as any;
              if (!address) {
                result = { status: 'error', message: 'Wallet not connected. Please connect your wallet first.' };
                setShowWallet(true);
                break;
              }
              
              if (!token || !amount || !recipientAddress) {
                result = { status: 'error', message: 'Missing required parameters: token, amount, or recipient address' };
                break;
              }
              
              // Validate token
              const validTokens = ['ETH', 'USDC', 'cbBTC'];
              const upperToken = token.toUpperCase();
              if (!validTokens.includes(upperToken)) {
                result = { status: 'error', message: `Invalid token. Supported tokens: ${validTokens.join(', ')}` };
                break;
              }
              
              // Execute the send
              try {
                setShowWallet(true);
                const sendResult = await sendToken(upperToken, recipientAddress, amount);
                if (sendResult.success) {
                  confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                  });
                  result = { 
                    status: 'success', 
                    message: `Successfully sent ${amount} ${upperToken} to ${recipientName || recipientAddress}`,
                    transactionHash: sendResult.hash
                  };
                  // Refresh balances after sending
                  setTimeout(refreshBalances, 3000);
                } else {
                  result = { status: 'error', message: sendResult.error || 'Transaction failed' };
                }
              } catch (error) {
                result = { status: 'error', message: `Failed to send: ${error}` };
              }
              break;
            }
            
            case 'get_wallet_balance': {
              if (!address) {
                result = { status: 'error', message: 'Wallet not connected' };
                break;
              }
              
              await refreshBalances();
              
              if (balances?.tokens) {
                const tokenBalances = balances.tokens.map(t => 
                  `${t.symbol}: ${t.balance} ($${t.balanceUsd.toFixed(2)})`
                ).join(', ');
                result = { 
                  status: 'success', 
                  balances: tokenBalances,
                  totalUsd: balances.totalUsd.toFixed(2),
                  message: `Your wallet has: ${tokenBalances}. Total value: $${balances.totalUsd.toFixed(2)}`
                };
              } else {
                result = { status: 'success', message: 'No token balances found' };
              }
              setShowWallet(true);
              break;
            }
            
            case 'toggle_wallet_balance': {
              toggleBalanceVisibility();
              setShowWallet(true);
              break;
            }
            
            case 'claim_rewards': {
              claimRewards();
              setShowRewards(true);
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
                result = { status: 'success', message: `Changed theme to ${themeId}` };
              }
              break;
            }
            
            case 'launch_app': {
              const appName = (fc.args as any).appName?.toLowerCase();
              const packageName = APP_PACKAGES[appName];
              
              if (packageName) {
                launchAndroidApp(packageName);
                result = { status: 'success', message: `Launching ${appName}` };
              } else {
                // Try to find a partial match
                const matchedApp = Object.keys(APP_PACKAGES).find(key => 
                  key.includes(appName) || appName.includes(key)
                );
                if (matchedApp) {
                  launchAndroidApp(APP_PACKAGES[matchedApp]);
                  result = { status: 'success', message: `Launching ${matchedApp}` };
                } else {
                  result = { status: 'error', message: `App "${appName}" not found. Try opening the app drawer.` };
                  setShowAppDrawer(true);
                }
              }
              break;
            }
            
            case 'open_url': {
              const url = (fc.args as any).url;
              if (url) {
                const fullUrl = url.startsWith('http') ? url : `https://${url}`;
                window.open(fullUrl, '_blank');
                result = { status: 'success', message: `Opening ${url}` };
              }
              break;
            }
            
            case 'search_web': {
              const query = (fc.args as any).query;
              if (query) {
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                window.open(searchUrl, '_blank');
                result = { status: 'success', message: `Searching for: ${query}` };
              }
              break;
            }
            
            case 'set_alarm': {
              const { time, label } = fc.args as any;
              if (time) {
                // Android alarm intent
                const [hours, minutes] = time.split(':').map(Number);
                if ((window as any).Android?.setAlarm) {
                  (window as any).Android.setAlarm(hours, minutes, label || '');
                } else {
                  // Fallback: open clock app
                  const alarmUrl = `intent://alarm?hour=${hours}&minutes=${minutes}#Intent;package=com.google.android.deskclock;end`;
                  window.location.href = alarmUrl;
                }
                result = { status: 'success', message: `Setting alarm for ${time}${label ? ` - ${label}` : ''}` };
              }
              break;
            }
            
            case 'set_timer': {
              const { duration, label } = fc.args as any;
              if (duration) {
                const minutes = parseInt(duration);
                const seconds = minutes * 60;
                if ((window as any).Android?.setTimer) {
                  (window as any).Android.setTimer(seconds, label || '');
                } else {
                  // Fallback: open clock app
                  const timerUrl = `intent://timer?seconds=${seconds}#Intent;package=com.google.android.deskclock;end`;
                  window.location.href = timerUrl;
                }
                result = { status: 'success', message: `Setting ${minutes} minute timer${label ? ` - ${label}` : ''}` };
              }
              break;
            }
            
            case 'change_language': {
              const { languageCode } = fc.args as any;
              if (languageCode && LANGUAGE_CONFIGS[languageCode]) {
                setLanguage(languageCode);
                const newLang = LANGUAGE_CONFIGS[languageCode];
                result = { 
                  status: 'success', 
                  message: `Language changed to ${newLang.nativeName} (${newLang.name}). Please reconnect to apply the language change.`,
                  newLanguage: newLang.name,
                  nativeName: newLang.nativeName,
                  greeting: newLang.greeting
                };
              } else {
                result = { 
                  status: 'error', 
                  message: `Language "${languageCode}" not supported. Available: English, Spanish, French, German, Italian, Portuguese, Japanese, Korean, Chinese, Arabic, Hindi, Russian, Turkish, Dutch, Polish, Vietnamese, Thai, Indonesian, Swahili, Zulu, Afrikaans, Xhosa.` 
                };
              }
              break;
            }
            
            default:
              console.warn('Unknown function call:', fc.name);
              result = { status: 'error', message: `Unknown function: ${fc.name}` };
          }
        } catch (e) {
          console.error('Error executing tool:', e);
          result = { status: 'error', message: String(e) };
        }

        return {
          response: { result },
          id: fc.id,
          name: fc.name,
        };
      }));

      client.sendToolResponse({ functionResponses });
    };

    client.on('toolcall', onToolCall);
    return () => {
      client.off('toolcall', onToolCall);
    };
  }, [client, address, balances, refreshBalances, setShowWallet, setShowRewards, setShowDialer, setShowAppDrawer, setShowUserConfig, setShowAgentEdit, toggleBalanceVisibility, claimRewards, updateAgent, current.id, setLanguage]);

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
