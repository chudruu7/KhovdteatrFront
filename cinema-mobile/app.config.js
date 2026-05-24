const reverseGoogleClientId = (clientId) => {
  const prefix = clientId?.replace('.apps.googleusercontent.com', '');
  return prefix ? `com.googleusercontent.apps.${prefix}` : '';
};

module.exports = ({ config }) => {
  const googleOAuth = {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
  };

  const schemes = [
    config.scheme,
    reverseGoogleClientId(googleOAuth.iosClientId),
    reverseGoogleClientId(googleOAuth.androidClientId),
  ].filter(Boolean);

  return {
    ...config,
    scheme: Array.from(new Set(schemes)),
    extra: {
      ...(config.extra || {}),
      googleOAuth,
    },
  };
};
