
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Tool, Type } from '@google/genai';

export const TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'open_app',
        description: 'Opens a specific application or modal on the phone interface.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            appName: {
              type: Type.STRING,
              description:
                'The name of the app to open. Accepted values: "wallet", "rewards", "dialer" (or "phone"), "apps" (or "drawer"), "settings" (or "profile"), "edit" (or "agent_settings").',
            },
          },
          required: ['appName'],
        },
      },
      {
        name: 'close_app',
        description: 'Closes any currently open application, modal, or drawer, returning to the home screen.',
      },
      {
        name: 'call_phone',
        description: 'Opens the phone dialer and initiates a call to a phone number.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            phoneNumber: {
              type: Type.STRING,
              description: 'The phone number to call.',
            },
            contactName: {
              type: Type.STRING,
              description: 'The name of the contact being called (for confirmation).',
            },
          },
        },
      },
      {
        name: 'send_sms',
        description: 'Sends an SMS text message to a phone number.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            phoneNumber: {
              type: Type.STRING,
              description: 'The phone number to send the message to.',
            },
            message: {
              type: Type.STRING,
              description: 'The text message content to send.',
            },
            contactName: {
              type: Type.STRING,
              description: 'The name of the contact (optional, for confirmation).',
            },
          },
          required: ['phoneNumber', 'message'],
        },
      },
      {
        name: 'send_whatsapp',
        description: 'Sends a WhatsApp message to a phone number or contact.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            phoneNumber: {
              type: Type.STRING,
              description: 'The phone number to send the WhatsApp message to (with country code, e.g., +1234567890).',
            },
            message: {
              type: Type.STRING,
              description: 'The message content to send via WhatsApp.',
            },
            contactName: {
              type: Type.STRING,
              description: 'The name of the contact (optional, for confirmation).',
            },
          },
          required: ['phoneNumber', 'message'],
        },
      },
      {
        name: 'send_crypto',
        description: 'Sends cryptocurrency (ETH, USDC, or cbBTC) to a wallet address on Base network. Requires user confirmation.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            token: {
              type: Type.STRING,
              description: 'The token to send. Accepted values: "ETH", "USDC", "cbBTC".',
            },
            amount: {
              type: Type.STRING,
              description: 'The amount of tokens to send (e.g., "0.01", "100", "0.001").',
            },
            recipientAddress: {
              type: Type.STRING,
              description: 'The wallet address to send tokens to (0x... format).',
            },
            recipientName: {
              type: Type.STRING,
              description: 'The name of the recipient (optional, for confirmation).',
            },
          },
          required: ['token', 'amount', 'recipientAddress'],
        },
      },
      {
        name: 'get_wallet_balance',
        description: 'Gets the current wallet balance for all tokens (ETH, USDC, cbBTC) and total USD value.',
      },
      {
        name: 'toggle_wallet_balance',
        description: 'Toggles the visibility of the wallet balance (show/hide).',
      },
      {
        name: 'claim_rewards',
        description: 'Claims the daily reward points for the user.',
      },
      {
        name: 'change_theme',
        description: 'Changes the background wallpaper/theme of the phone.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            themeId: {
              type: Type.STRING,
              description:
                'The ID of the theme. Accepted values: "base-blue", "cyber-dark", "sunset-vibes", "retro-grid", "mono-black", "mountains", "nebula", "minimalist", "abstract", "green-fern".',
            },
          },
          required: ['themeId'],
        },
      },
      {
        name: 'launch_app',
        description: 'Launches an installed app on the device by name.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            appName: {
              type: Type.STRING,
              description: 'The name of the app to launch (e.g., "WhatsApp", "Instagram", "YouTube", "Spotify", "Gmail", "Maps", "Camera", "Chrome").',
            },
          },
          required: ['appName'],
        },
      },
      {
        name: 'open_url',
        description: 'Opens a URL in the browser.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            url: {
              type: Type.STRING,
              description: 'The URL to open (e.g., "https://google.com").',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'search_web',
        description: 'Searches the web for information.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: 'The search query.',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'set_alarm',
        description: 'Sets an alarm on the device.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            time: {
              type: Type.STRING,
              description: 'The time for the alarm in 24-hour format (e.g., "07:30", "14:00").',
            },
            label: {
              type: Type.STRING,
              description: 'Optional label for the alarm.',
            },
          },
          required: ['time'],
        },
      },
      {
        name: 'set_timer',
        description: 'Sets a countdown timer.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            duration: {
              type: Type.STRING,
              description: 'Duration in minutes (e.g., "5", "30", "60").',
            },
            label: {
              type: Type.STRING,
              description: 'Optional label for the timer.',
            },
          },
          required: ['duration'],
        },
      },
    ],
  },
];
