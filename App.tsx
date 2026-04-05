import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BrandedSplash } from './src/components/BrandedSplash';
import { ErrorState } from './src/components/ErrorState';
import { DatabaseProvider, useDatabaseStatus } from './src/context/DatabaseContext';
import { ToastProvider } from './src/context/ToastContext';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';

/** Minimum time the branded splash stays visible after data is ready (feels intentional, not flickery). */
const MIN_SPLASH_MS = 550;

function AppShell() {
  const { resolved } = useAppTheme();
  const { ready, error, retry } = useDatabaseStatus();
  const [handoffReady, setHandoffReady] = useState(false);
  const nativeHidden = useRef(false);

  // Hand off from native splash to our branded view as soon as JS is up.
  useEffect(() => {
    if (nativeHidden.current) return;
    nativeHidden.current = true;
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (error) {
      setHandoffReady(true);
      return;
    }
    if (!ready) return;
    const t = setTimeout(() => setHandoffReady(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, [ready, error]);

  if (!handoffReady) {
    return (
      <BrandedSplash
        message={
          error
            ? 'Something went wrong'
            : ready
              ? 'Opening your workspace…'
              : 'Securing your data…'
        }
      />
    );
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={retry} />;
  }

  return (
    <>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
      <ToastProvider>
        <RootNavigator />
      </ToastProvider>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <DatabaseProvider>
            <AppShell />
          </DatabaseProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
