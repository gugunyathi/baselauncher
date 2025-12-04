
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
        description: 'Opens the phone dialer and initiates a call request.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            phoneNumber: {
              type: Type.STRING,
              description: 'The phone number to call (optional).',
            },
          },
        },
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
    ],
  },
];
