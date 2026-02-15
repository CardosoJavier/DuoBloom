I will fix the issues identified during manual testing to improve the user experience and ensure the sync flow works seamlessly.

### **1. Add Logout Button to Sync Screen**
- **Issue**: Users stuck on the sync screen cannot logout or switch accounts.
- **Fix**: Update `SyncInput.tsx` to include a "Back to Login" or "Logout" button at the bottom, using `useAuthStore` to handle the logout action.

### **2. Fix User Sync Code Display**
- **Issue**: The user's sync code is missing or showing "..." on signup.
- **Fix**: The `usePartnerSync` hook relies on `user?.pairCode`. It seems the `user` object in `authStore` might not be fully populated immediately after signup/login or the pair code is missing from the initial session data.
- **Solution**:
    - Ensure `authStore` fetches the full user profile (including `pair_code`) upon successful authentication.
    - Verify `api/user-api.ts` correctly maps the `pair_code` from the database to the user object.

### **3. Fix Redirection Delay (Dashboard -> Sync)**
- **Issue**: After verification, users briefly see the dashboard before being redirected to the sync screen.
- **Fix**:
    - The redirection logic in `app/_layout.tsx` relies on `checkSyncStatus`.
    - Currently, `checkSyncStatus` is async and might be running *after* the initial render of the `(tabs)` layout.
    - **Solution**: Enhance the `InitialLayout` component to show a loading state (e.g., a spinner or splash screen) while `checkSyncStatus` is resolving, preventing the premature render of the dashboard. Only once the sync status is confirmed (true/false) should the navigation decision be made.

### **Implementation Steps**
1.  **Modify `components/auth/sync/SyncInput.tsx`**: Add the logout button.
2.  **Update `store/authStore.ts` & `api/user-api.ts`**: Ensure `pairCode` is consistently fetched and stored.
3.  **Refactor `app/_layout.tsx`**: Introduce a `isCheckingSync` state to block rendering until sync status is known.
