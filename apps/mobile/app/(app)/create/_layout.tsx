import { Stack } from 'expo-router';

export default function CreateLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="photos" />
      <Stack.Screen name="ingredients" />
      <Stack.Screen name="steps" />
      <Stack.Screen name="publish" />
    </Stack>
  );
}
