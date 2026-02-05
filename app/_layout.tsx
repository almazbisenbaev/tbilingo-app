import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

import AppHeader from '@/components/AppHeader';
import InstallPrompt from '@/components/InstallPrompt';
import { Colors } from '@/constants/theme';
import { AuthProvider } from '../contexts/AuthContext';

 

export const unstable_settings = {
  anchor: '(tabs)',
};

const CustomDefaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    primary: Colors.tint,
    text: Colors.text,
  },
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={CustomDefaultTheme}>
        <Head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content={Colors.tint} />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Stack screenOptions={{ header: (props) => <AppHeader {...props} /> }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
        <InstallPrompt />
      </ThemeProvider>
    </AuthProvider>
  );
}
