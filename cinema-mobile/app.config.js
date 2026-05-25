const fs = require('fs');
const path = require('path');

const reverseGoogleClientId = (clientId) => {
  const prefix = clientId?.replace('.apps.googleusercontent.com', '');
  return prefix ? `com.googleusercontent.apps.${prefix}` : '';
};

module.exports = ({ config }) => {
  const projectRoot = __dirname;
  const iosBundleIdentifier = 'mn.khovdteatr.app';
  const androidPackage = 'mn.khovdteatr.app';
  const iosGoogleServicesFile = './GoogleService-Info.plist';
  const androidGoogleServicesFile = './google-services.json';
  const hasIosGoogleServices = fs.existsSync(path.join(projectRoot, iosGoogleServicesFile));
  const hasAndroidGoogleServices = fs.existsSync(path.join(projectRoot, androidGoogleServicesFile));
  const googleOAuth = {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    iosReversedClientId:
      process.env.EXPO_PUBLIC_GOOGLE_IOS_REVERSED_CLIENT_ID ||
      reverseGoogleClientId(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
  };

  const schemes = [
    'khovdteatr',
    config.scheme,
    googleOAuth.iosReversedClientId,
  ].filter(Boolean);

  return {
    ...config,
    scheme: Array.from(new Set(schemes)),
    ios: {
      ...(config.ios || {}),
      bundleIdentifier: iosBundleIdentifier,
      ...(hasIosGoogleServices ? { googleServicesFile: iosGoogleServicesFile } : {}),
      infoPlist: {
        ...(config.ios?.infoPlist || {}),
        CFBundleURLTypes: [
          ...((config.ios?.infoPlist?.CFBundleURLTypes || []).filter(
            (entry) => !entry?.CFBundleURLSchemes?.includes(googleOAuth.iosReversedClientId),
          )),
          {
            CFBundleURLSchemes: [googleOAuth.iosReversedClientId].filter(Boolean),
          },
        ],
      },
    },
    android: {
      ...(config.android || {}),
      package: androidPackage,
      ...(hasAndroidGoogleServices ? { googleServicesFile: androidGoogleServicesFile } : {}),
    },
    plugins: [
      ...(config.plugins || []),
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: googleOAuth.iosReversedClientId,
        },
      ],
    ],
    extra: {
      ...(config.extra || {}),
      googleOAuth,
    },
  };
};
