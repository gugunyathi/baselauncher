/**
 * Android Bridge Interface
 * Defines the JavaScript interface exposed by the Android WebView
 */

// Declare the Android bridge interface globally
declare global {
  interface Window {
    Android?: AndroidBridge;
  }
}

export interface AndroidBridge {
  // App launching
  launchApp: (packageName: string) => boolean;
  isAppInstalled: (packageName: string) => boolean;
  getInstalledApps: () => string;
  
  // Phone calls
  makeCall: (phoneNumber: string) => boolean;
  
  // SMS
  sendSMS: (phoneNumber: string, message: string) => boolean;
  
  // WhatsApp
  sendWhatsApp: (phoneNumber: string, message: string) => boolean;
  
  // Contacts
  searchContacts: (query: string) => string;
  getContacts: () => string;
  openContacts: () => boolean;
  
  // Navigation
  navigateTo: (destination: string) => boolean;
  
  // Alarms & Timers
  setAlarm: (hour: number, minute: number, label: string) => boolean;
  setTimer: (seconds: number, label: string) => boolean;
  
  // Browser
  openUrl: (url: string) => boolean;
  searchWeb: (query: string) => boolean;
  
  // Utilities
  showToast: (message: string) => void;
  requestPermissions: () => void;
}

// Helper function to check if Android bridge is available
export const hasAndroidBridge = (): boolean => {
  return typeof window !== 'undefined' && typeof window.Android !== 'undefined';
};

// Helper function to launch Android app
export const launchAndroidApp = (packageName: string): boolean => {
  console.log('Attempting to launch app:', packageName);
  
  // Try Android bridge first (WebView with JS interface)
  if (hasAndroidBridge() && window.Android?.launchApp) {
    const success = window.Android.launchApp(packageName);
    if (success) {
      console.log('App launched via Android bridge');
      return true;
    }
  }
  
  // Fallback: Try Android intent URL with launch action
  try {
    const intentUrl = `intent://launch/#Intent;package=${packageName};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end`;
    window.location.href = intentUrl;
    return true;
  } catch (e) {
    console.error('Failed to launch via intent:', e);
  }
  
  return false;
};

// Helper to make phone call
export const makePhoneCall = (phoneNumber: string): boolean => {
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
  console.log('Making call to:', cleanNumber);
  
  if (hasAndroidBridge() && window.Android?.makeCall) {
    return window.Android.makeCall(cleanNumber);
  }
  
  window.location.href = `tel:${cleanNumber}`;
  return true;
};

// Helper to send SMS
export const sendSMS = (phoneNumber: string, message: string): boolean => {
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
  console.log('Sending SMS to:', cleanNumber);
  
  if (hasAndroidBridge() && window.Android?.sendSMS) {
    return window.Android.sendSMS(cleanNumber, message);
  }
  
  window.location.href = `sms:${cleanNumber}?body=${encodeURIComponent(message)}`;
  return true;
};

// Helper to send WhatsApp message
export const sendWhatsAppMessage = (phoneNumber: string, message: string): boolean => {
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, '').replace('+', '');
  console.log('Sending WhatsApp to:', cleanNumber);
  
  if (hasAndroidBridge() && window.Android?.sendWhatsApp) {
    return window.Android.sendWhatsApp(phoneNumber, message);
  }
  
  const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');
  return true;
};

// Helper to search contacts
export const searchContacts = (query: string): any[] => {
  if (hasAndroidBridge() && window.Android?.searchContacts) {
    try {
      const result = window.Android.searchContacts(query);
      return JSON.parse(result);
    } catch (e) {
      console.error('Error searching contacts:', e);
    }
  }
  return [];
};

// Helper to get all contacts
export const getContacts = (): any[] => {
  if (hasAndroidBridge() && window.Android?.getContacts) {
    try {
      const result = window.Android.getContacts();
      return JSON.parse(result);
    } catch (e) {
      console.error('Error getting contacts:', e);
    }
  }
  return [];
};

// Helper to navigate to destination
export const navigateTo = (destination: string): boolean => {
  console.log('Navigating to:', destination);
  
  if (hasAndroidBridge() && window.Android?.navigateTo) {
    return window.Android.navigateTo(destination);
  }
  
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
  window.open(mapsUrl, '_blank');
  return true;
};

// Helper to open contacts app
export const openContactsApp = (): boolean => {
  if (hasAndroidBridge() && window.Android?.openContacts) {
    return window.Android.openContacts();
  }
  return launchAndroidApp('com.google.android.contacts');
};
