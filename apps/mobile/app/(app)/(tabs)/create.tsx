// This screen is never rendered directly — the FAB in _layout.tsx intercepts
// the tab press and opens the create modal instead. This file must exist for
// Expo Router to register the tab slot.
import { View } from 'react-native';
export default function CreateTabScreen() {
  return <View />;
}
