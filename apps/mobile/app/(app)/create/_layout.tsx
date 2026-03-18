import { Stack } from 'expo-router';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export default function CreateLayout() {
  return (
    <BottomSheetModalProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="photos" />
        <Stack.Screen name="ingredients" />
        <Stack.Screen name="steps" />
        <Stack.Screen name="publish" />
      </Stack>
    </BottomSheetModalProvider>
  );
}
