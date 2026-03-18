const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL!,
  clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!,
};

// Validate at startup
for (const [key, value] of Object.entries(env)) {
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export { env };
