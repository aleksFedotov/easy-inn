import 'dotenv/config';
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'EasyInn',
  slug: 'easyinn-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'easyinnmobile',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png', 
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    package: "com.easyinn.easyinnmobile",
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      foregroundImage: './assets/images/icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    "expo-notifications",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.API_URL,
    eas: {
      projectId: "fc9d19ca-1683-4e44-9507-5171adb2f840", 
    },
  },
});