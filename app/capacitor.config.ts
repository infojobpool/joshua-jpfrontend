import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jobpool.app',
  appName: 'JobPool',
  webDir: 'dist',
  server: {
    url: 'https://www.jobpool.in',
    androidScheme: 'https',
    allowNavigation: ['*']
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
