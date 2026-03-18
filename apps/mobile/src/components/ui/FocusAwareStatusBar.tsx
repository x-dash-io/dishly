import * as React from 'react';
import { StatusBar, StatusBarProps } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';

/**
 * Context-aware status bar.
 * Defaults: light icons (for dark navDark header backgrounds).
 * Pass style="dark" explicitly on auth screens and any screen with a light header.
 */
export function FocusAwareStatusBar(props: StatusBarProps) {
  const isFocused = useIsFocused();

  const defaults: StatusBarProps = {
    style: 'light',
    translucent: false,
  };

  return isFocused ? <StatusBar {...defaults} {...props} /> : null;
}
