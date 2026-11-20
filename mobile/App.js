/**
 * BookIt! Native Shell
 * --------------------
 * React Native / Expo shell that hosts the production BookIt! web app
 * (https://bookit-production-236d981c.up.railway.app) in an offline-resilient
 * WebView with:
 *  - NetInfo connectivity tracking with a dedicated offline screen
 *  - Automatic reload the moment the device reconnects
 *  - Exponential backoff auto-retry (2s -> 5s -> 10s -> 30s) on WebView load errors
 *  - Visible-first WebView rendering with a thin, non-interactive top progress bar
 *  - Native handling for external schemes (tel:, mailto:, maps.google.com)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  Platform,
  AppState,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';

const DEFAULT_BOOKIT_URL = 'https://bookit-production-236d981c.up.railway.app';
const RAW_ENV_URL =
  typeof process !== 'undefined' &&
  process.env &&
  typeof process.env.EXPO_PUBLIC_API_URL === 'string'
    ? process.env.EXPO_PUBLIC_API_URL.trim()
    : '';

const BOOKIT_URL =
  RAW_ENV_URL && /^https?:\/\//i.test(RAW_ENV_URL) ? RAW_ENV_URL : DEFAULT_BOOKIT_URL;

const BACKOFF_DELAYS_MS = [2000, 5000, 10000, 30000];

export default function App() {
  const webviewRef = useRef(null);
  const retryTimerRef = useRef(null);
  const retryCountRef = useRef(0);

  const [isOffline, setIsOffline] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [webKey, setWebKey] = useState(0);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const triggerReload = useCallback(() => {
    clearRetryTimer();
    setLoadError(null);
    setIsLoading(true);
    if (webviewRef.current) {
      webviewRef.current.reload();
    } else {
      setWebKey((k) => k + 1);
    }
  }, [clearRetryTimer]);

  const scheduleAutoRetry = useCallback(() => {
    clearRetryTimer();
    const attempt = retryCountRef.current;
    const delay = BACKOFF_DELAYS_MS[Math.min(attempt, BACKOFF_DELAYS_MS.length - 1)];
    retryCountRef.current = attempt + 1;
    retryTimerRef.current = setTimeout(() => {
      triggerReload();
    }, delay);
  }, [clearRetryTimer, triggerReload]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline((prevOffline) => {
        if (prevOffline && !offline) {
          retryCountRef.current = 0;
          triggerReload();
        }
        return offline;
      });
    });
    return () => {
      unsubscribe();
      clearRetryTimer();
    };
  }, [clearRetryTimer, triggerReload]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && loadError) {
        retryCountRef.current = 0;
        triggerReload();
      }
    });
    return () => sub.remove();
  }, [loadError, triggerReload]);

  const handleShouldStartLoadWithRequest = useCallback((request) => {
    const url = request?.url || '';
    if (!url) return false;
    if (
      url.startsWith('tel:') ||
      url.startsWith('mailto:') ||
      url.startsWith('maps:') ||
      url.includes('maps.google.com')
    ) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    return true;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FEECE8"
        translucent={false}
      />

      {isLoading && !isOffline && !loadError && (
        <View style={styles.progressBarContainer} pointerEvents="none">
          <View style={styles.progressBarFill} />
        </View>
      )}

      {isOffline || loadError ? (
        <View style={styles.fallbackContainer}>
          <View style={styles.fallbackCard}>
            <Text style={styles.brandBadge}>BookIt! South Africa</Text>
            <Text style={styles.fallbackTitle}>
              {isOffline ? 'You appear to be offline' : 'Reconnecting to BookIt!…'}
            </Text>
            <Text style={styles.fallbackSubtitle}>
              {isOffline
                ? 'Please check your mobile data or Wi-Fi connection. BookIt! will reconnect automatically as soon as your signal returns.'
                : 'We are retrying the connection to BookIt! servers automatically.'}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              activeOpacity={0.85}
              onPress={() => {
                retryCountRef.current = 0;
                triggerReload();
              }}
            >
              <Text style={styles.retryButtonText}>Retry Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <WebView
          key={webKey}
          ref={webviewRef}
          source={{ uri: BOOKIT_URL }}
          style={styles.webview}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          pullToRefreshEnabled={true}
          allowsBackForwardNavigationGestures={true}
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          onLoadStart={() => {
            setIsLoading(true);
          }}
          onLoadEnd={() => {
            setIsLoading(false);
            retryCountRef.current = 0;
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setIsLoading(false);
            setLoadError(nativeEvent?.description || 'Connection error');
            scheduleAutoRetry();
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            if (nativeEvent?.statusCode >= 502) {
              setLoadError(`Server temporarily unavailable (${nativeEvent.statusCode})`);
              scheduleAutoRetry();
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F7',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFF9F7',
  },
  progressBarContainer: {
    height: 3,
    width: '100%',
    backgroundColor: '#FEECE8',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    width: '65%',
    backgroundColor: '#EE361C',
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFF9F7',
  },
  fallbackCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: '#F3DFD9',
    alignItems: 'center',
  },
  brandBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EE361C',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  fallbackTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#291822',
    textAlign: 'center',
    marginBottom: 10,
  },
  fallbackSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#6E5A64',
    textAlign: 'center',
    marginBottom: 22,
  },
  retryButton: {
    backgroundColor: '#EE361C',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 999,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
