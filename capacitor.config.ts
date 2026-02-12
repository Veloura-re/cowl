import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.veloura.cowl',
  appName: 'Claire',
  webDir: 'out',

  // Server configuration for development
  // This allows the mobile app to connect to your development server
  server: {
    // IMPORTANT: When testing on mobile devices (same WiFi network):
    // 1. Find your computer's local IP address by running 'ipconfig' in terminal
    // 2. Look for "IPv4 Address" (e.g., 192.168.1.100)
    // 3. Uncomment the line below and replace with your IP
    // url: 'http://192.168.1.100:3000',
    // cleartext: true, // Required for HTTP (non-HTTPS) connections
  },

  // Deep linking configuration for OAuth and authentication redirects
  plugins: {
    // This allows the app to handle custom URL schemes like com.veloura.cowl://
    // Useful for OAuth redirects and deep linking
  }
};

export default config;
