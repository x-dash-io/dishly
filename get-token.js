// Simple script to get a Clerk JWT token for testing
const { createClerkClient } = require('@clerk/backend');

// You'll need to replace these with actual values from your Clerk dashboard
const CLERK_PUBLISHABLE_KEY = 'pk_test_...'; // Get from mobile app .env
const CLERK_SECRET_KEY = 'sk_test_...'; // Get from API .dev.vars

async function getToken() {
  try {
    const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });
    
    // This would require actual user credentials - for testing purposes,
    // you might need to create a test user or use an existing one
    
    console.log('To get a JWT token:');
    console.log('1. Open the mobile app and sign in');
    console.log('2. Go to Profile tab and tap "🔐 Copy JWT Token"');
    console.log('3. Paste it here for testing');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

getToken();
