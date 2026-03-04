Authentication & Onboarding: Finite State Machine (FSM)

1. Architectural Philosophy
   The application uses a Declarative Routing model.
   The Store (authStore.ts) is the "Brain." It calculates the current AuthStatus based on raw data.
   The Guard (AuthGuard.tsx) is the "Traffic Cop." It observes the status and ensures the user's current URL matches that status.
   The Screens are "Dumb." They trigger actions (Login, Verify, Setup) but do not manually navigate to the next step. They simply wait for the Store to update, which triggers the Guard.
2. The FSM State Hierarchy
   The state is derived in this specific order. If a higher-priority condition is not met, the machine stops there.
   StatusData ConditionTarget Route
   - UNAUTHENTICATEDsession == null/(auth)/login
   - AWAITING_VERIFICATIONsession exists BUT email_confirmed_at == null/(auth)/confirm-email
   - AWAITING_CRYPTO_SETUPuser.publicKey is missing in DB/(auth)/security/setup
   - AWAITING_CRYPTO_RECOVERYuser.publicKey exists in DB BUT SecureStore is empty/(auth)/security/restore
   - AWAITING_PARTNERCrypto is secure BUT no relationship exists/(auth)/bloom
   - READYAll conditions met/(tabs)
3. Component Responsibilities
   authStore.ts (Technical Requirements)
   Status Derivation: Must implement getAuthStatus() which evaluates the table above.
   Atomic checkAuth: This function is the heart of the system. It must be called:
   On App launch.
   Immediately after successful Login.
   Immediately after successful Email Verification.
   Data Persistence: Handles saving the private key to SecureStore and the session to Supabase.
   No Side Effects: Must not import expo-router. It only updates state.
   AuthGuard.tsx (Technical Requirements)
   Loop Prevention: Before calling router.replace(), it must check: if (currentPath === targetPath) return;.
   Sub-Flow Protection: In AWAITING_CRYPTO_SETUP, it must allow access to the entire sub-directory (Setup, Recovery words, and Challenge) without redirecting the user back to the start of the setup.
   Initialization Lock: Must display a Loading Spinner while isInitializing is true to prevent "flickering" of protected routes.
4. Detailed Flow Logic
   The Sign-Up Flow (New User)
   Signup Screen: User submits $\rightarrow$ signUp() called.
   Verification: Supabase sends OTP. Store sees email_confirmed_at is null. Guard moves user to /confirm-email.
   Profile Creation: User enters OTP $\rightarrow$ verifyEmail() called.
   Note: Upon success, Supabase triggers create the public.users row. Store calls checkAuth() to fetch this new profile.
   Encryption Setup: Store sees publicKey is null. Guard moves user to /(auth)/security/setup.
   Completion: User generates keys and completes the challenge. Store updates publicKey. Guard moves user to /(auth)/bloom.
   The Login Flow (New Device / Existing User)
   Login Screen: User submits $\rightarrow$ login() called.
   Session Sync: Store calls checkAuth().
   Recovery Detection: \* Store sees user.publicKey exists in the database. Store checks SecureStore and finds NO private key. Result: Status is AWAITING_CRYPTO_RECOVERY.
   Restoration: Guard moves user to /(auth)/security/restore.
   Finalization: User enters 12 words $\rightarrow$ Key is re-derived and saved locally. Store updates hasLocalPrivateKey: true. Guard moves user to /(tabs).
5. Failure Handling (Sad Paths)
   Verification Failed: User remains on /confirm-email with an error message.
   SecureStore Error: If the device hardware fails to save the key, setup displays a "Hardware Error" and does not allow the user to proceed, as the account would be unrecoverable.
   Network Interruption: checkAuth must be retryable. If it fails, the Guard keeps the user in a loading state or on the Login screen.
