/**
 * Multi-language support for AI agent
 * Maps user locale to language settings and Gemini voices
 */

export type LanguageConfig = {
  code: string;           // ISO language code (e.g., 'en', 'es', 'fr')
  name: string;           // Language name in English
  nativeName: string;     // Language name in native language
  greeting: string;       // Sample greeting in the language
  voiceOptions: string[]; // Compatible Gemini voice names
  rtl?: boolean;          // Right-to-left language
};

// Gemini Live API supported voices and their language capabilities
// Reference: https://ai.google.dev/gemini-api/docs/live
export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  // English variants
  'en': {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    greeting: 'Hello! How can I help you today?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  'en-US': {
    code: 'en-US',
    name: 'English (US)',
    nativeName: 'English (US)',
    greeting: 'Hello! How can I help you today?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  'en-GB': {
    code: 'en-GB',
    name: 'English (UK)',
    nativeName: 'English (UK)',
    greeting: 'Hello! How may I assist you today?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Spanish
  'es': {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    greeting: '¡Hola! ¿En qué puedo ayudarte hoy?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  'es-ES': {
    code: 'es-ES',
    name: 'Spanish (Spain)',
    nativeName: 'Español (España)',
    greeting: '¡Hola! ¿En qué puedo ayudarte hoy?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  'es-MX': {
    code: 'es-MX',
    name: 'Spanish (Mexico)',
    nativeName: 'Español (México)',
    greeting: '¡Hola! ¿En qué te puedo ayudar hoy?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // French
  'fr': {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    greeting: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  'fr-FR': {
    code: 'fr-FR',
    name: 'French (France)',
    nativeName: 'Français (France)',
    greeting: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // German
  'de': {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    greeting: 'Hallo! Wie kann ich Ihnen heute helfen?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  'de-DE': {
    code: 'de-DE',
    name: 'German (Germany)',
    nativeName: 'Deutsch (Deutschland)',
    greeting: 'Hallo! Wie kann ich Ihnen heute helfen?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Italian
  'it': {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    greeting: 'Ciao! Come posso aiutarti oggi?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Portuguese
  'pt': {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    greeting: 'Olá! Como posso ajudá-lo hoje?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  'pt-BR': {
    code: 'pt-BR',
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    greeting: 'Olá! Como posso te ajudar hoje?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Dutch
  'nl': {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    greeting: 'Hallo! Hoe kan ik je vandaag helpen?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Polish
  'pl': {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    greeting: 'Cześć! Jak mogę ci dzisiaj pomóc?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Russian
  'ru': {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    greeting: 'Привет! Чем могу помочь сегодня?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Japanese
  'ja': {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    greeting: 'こんにちは！今日はどのようにお手伝いできますか？',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Korean
  'ko': {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    greeting: '안녕하세요! 오늘 무엇을 도와드릴까요?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Chinese (Simplified)
  'zh': {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    greeting: '你好！今天我能帮你什么？',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  'zh-CN': {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    greeting: '你好！今天我能帮你什么？',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  'zh-TW': {
    code: 'zh-TW',
    name: 'Chinese (Traditional)',
    nativeName: '繁體中文',
    greeting: '你好！今天我能幫你什麼？',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Arabic
  'ar': {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    greeting: 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
    rtl: true,
  },
  
  // Hindi
  'hi': {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    greeting: 'नमस्ते! आज मैं आपकी कैसे मदद कर सकता हूं?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Turkish
  'tr': {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    greeting: 'Merhaba! Bugün size nasıl yardımcı olabilirim?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Vietnamese
  'vi': {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    greeting: 'Xin chào! Hôm nay tôi có thể giúp gì cho bạn?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Thai
  'th': {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    greeting: 'สวัสดี! วันนี้ฉันช่วยอะไรคุณได้บ้าง?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Indonesian
  'id': {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    greeting: 'Halo! Bagaimana saya bisa membantu Anda hari ini?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Swahili
  'sw': {
    code: 'sw',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    greeting: 'Habari! Ninawezaje kukusaidia leo?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Zulu
  'zu': {
    code: 'zu',
    name: 'Zulu',
    nativeName: 'isiZulu',
    greeting: 'Sawubona! Ngingakusiza kanjani namuhla?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Afrikaans
  'af': {
    code: 'af',
    name: 'Afrikaans',
    nativeName: 'Afrikaans',
    greeting: 'Hallo! Hoe kan ek jou vandag help?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
  
  // Xhosa
  'xh': {
    code: 'xh',
    name: 'Xhosa',
    nativeName: 'isiXhosa',
    greeting: 'Molo! Ndingakunceda njani namhlanje?',
    voiceOptions: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'],
  },
};

// Default language fallback
export const DEFAULT_LANGUAGE = LANGUAGE_CONFIGS['en'];

/**
 * Get language configuration from browser locale
 */
export function getLanguageFromLocale(locale?: string): LanguageConfig {
  const browserLocale = locale || navigator.language || 'en';
  
  // Try exact match first (e.g., 'en-US')
  if (LANGUAGE_CONFIGS[browserLocale]) {
    return LANGUAGE_CONFIGS[browserLocale];
  }
  
  // Try base language (e.g., 'en' from 'en-US')
  const baseLanguage = browserLocale.split('-')[0];
  if (LANGUAGE_CONFIGS[baseLanguage]) {
    return LANGUAGE_CONFIGS[baseLanguage];
  }
  
  // Fallback to English
  return DEFAULT_LANGUAGE;
}

/**
 * Detect user's preferred language from multiple sources
 */
export function detectUserLanguage(): LanguageConfig {
  // Check localStorage for saved preference
  const savedLanguage = localStorage.getItem('preferredLanguage');
  if (savedLanguage && LANGUAGE_CONFIGS[savedLanguage]) {
    return LANGUAGE_CONFIGS[savedLanguage];
  }
  
  // Use browser language
  return getLanguageFromLocale();
}

/**
 * Save language preference
 */
export function saveLanguagePreference(languageCode: string): void {
  localStorage.setItem('preferredLanguage', languageCode);
}

/**
 * Get all available languages for UI selection
 */
export function getAvailableLanguages(): LanguageConfig[] {
  // Return unique languages (not including regional variants for cleaner UI)
  const uniqueLanguages = new Map<string, LanguageConfig>();
  
  Object.values(LANGUAGE_CONFIGS).forEach(config => {
    const baseCode = config.code.split('-')[0];
    // Prefer the base language code, but keep regional if it's more specific
    if (!uniqueLanguages.has(baseCode) || !config.code.includes('-')) {
      uniqueLanguages.set(baseCode, config);
    }
  });
  
  return Array.from(uniqueLanguages.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  );
}

/**
 * Map country code to language (for geolocation-based detection)
 */
export const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  // Americas
  'US': 'en-US',
  'CA': 'en',
  'MX': 'es-MX',
  'BR': 'pt-BR',
  'AR': 'es',
  'CO': 'es',
  'CL': 'es',
  'PE': 'es',
  'VE': 'es',
  
  // Europe
  'GB': 'en-GB',
  'DE': 'de',
  'FR': 'fr',
  'ES': 'es-ES',
  'IT': 'it',
  'NL': 'nl',
  'PL': 'pl',
  'PT': 'pt',
  'RU': 'ru',
  'UA': 'ru', // Many speak Russian
  'AT': 'de',
  'CH': 'de',
  'BE': 'nl',
  'SE': 'en', // Most speak English
  'NO': 'en',
  'DK': 'en',
  'FI': 'en',
  'IE': 'en',
  'CZ': 'en',
  'GR': 'en',
  'HU': 'en',
  'RO': 'en',
  
  // Asia
  'JP': 'ja',
  'KR': 'ko',
  'CN': 'zh-CN',
  'TW': 'zh-TW',
  'HK': 'zh-TW',
  'IN': 'hi',
  'PK': 'en',
  'BD': 'en',
  'ID': 'id',
  'TH': 'th',
  'VN': 'vi',
  'MY': 'en',
  'SG': 'en',
  'PH': 'en',
  
  // Middle East
  'SA': 'ar',
  'AE': 'ar',
  'EG': 'ar',
  'IL': 'en',
  'TR': 'tr',
  'IR': 'en',
  
  // Africa
  'ZA': 'en', // Default, but also zu, af, xh
  'NG': 'en',
  'KE': 'sw',
  'TZ': 'sw',
  'ET': 'en',
  'GH': 'en',
  'MA': 'ar',
  'DZ': 'ar',
  'TN': 'ar',
  
  // Oceania
  'AU': 'en',
  'NZ': 'en',
};

/**
 * Get language from country code
 */
export function getLanguageFromCountry(countryCode: string): LanguageConfig {
  const languageCode = COUNTRY_TO_LANGUAGE[countryCode.toUpperCase()];
  if (languageCode && LANGUAGE_CONFIGS[languageCode]) {
    return LANGUAGE_CONFIGS[languageCode];
  }
  return DEFAULT_LANGUAGE;
}
