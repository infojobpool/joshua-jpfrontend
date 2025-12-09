import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jobpool.app',
  appName: 'JobPool',
  webDir: 'out', // Next.js static export outputs to 'out' directory
  server: {
    // Remove server.url for production builds - use local webDir instead
    // url: 'https://www.jobpool.in',
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
