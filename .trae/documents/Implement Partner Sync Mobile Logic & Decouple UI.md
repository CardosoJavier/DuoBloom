I will implement the Partner Sync mobile logic by creating a dedicated API layer, a custom hook for state management, and decoupled UI components.

### **1. Types & API Layer**
- **Create `types/sync.ts`**: Define interfaces for `SyncRequest` and `SyncRequestStatus` ("PENDING", "MATCHED").
- **Create `api/sync-api.ts`**: Implement Supabase calls corresponding to our SQL functions:
    - `attemptPartnerSync(partnerCode)`: Calls the RPC function.
    - `confirmPartnerSync(requestId)`: Calls the confirmation RPC.
    - `getActiveSyncRequest()`: Fetches the current request to support polling (waiting state).
    - `getRelationship()`: Checks if a permanent link already exists.

### **2. State Management (Custom Hook)**
- **Create `hooks/usePartnerSync.ts`**:
    - Manages the 3-step state machine: `input` -> `waiting` -> `found`.
    - Handles the polling logic (checking status every few seconds when in "waiting").
    - Exposes methods: `connect(code)`, `confirm()`, `cancel()`.
    - Exposes state: `step`, `isLoading`, `partnerName` (or code), `myCode`.

### **3. UI Decoupling**
- **Refactor `app/(auth)/bloom.tsx`**: Break it down into smaller, focused components in `components/auth/sync/`:
    - `SyncInput.tsx`: The form to enter code.
    - `SyncWaiting.tsx`: The polling/loading screen.
    - `SyncFound.tsx`: The confirmation screen with avatars.
- **Update `bloom.tsx`**: It will become a clean orchestrator that uses `usePartnerSync` and renders the appropriate child component.

### **4. Integration**
- The flow will be real and connected to the backend.
- "My Code" will be fetched from the actual authenticated user profile.
- The "Confirm" action will finalize the sync and redirect to the dashboard.
