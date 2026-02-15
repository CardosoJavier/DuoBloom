# Partner Sync Process

## Summary
The Partner Sync process allows two users to link their accounts to share fitness data. It uses a "handshake" mechanism where one user enters the other's unique 8-character code. The process is handled via real-time polling of a `partner_sync_requests` table in Supabase.

## Detailed Flow

### 1. Prerequisite: Account Verification
- Users must have a verified account (handled via Supabase Auth) before accessing the sync screen.
- Each user is assigned a unique `pair_code` (e.g., "ALEX-8392") upon sign-up, stored in the `public.users` table.

### 2. Initiation (Input Step)
- **User A** navigates to the Sync Screen.
- **User A** sees their own code and shares it with **User B**.
- **User A** enters **User B's** code into the input field.
- **Action**: `syncApi.attemptPartnerSync(userId, partnerCode)` is called.
- **Backend**:
  - Checks if `partnerCode` exists.
  - Checks if a request already exists between these two users (symmetric check).
  - If no request exists: Creates a new row in `partner_sync_requests` with status `PENDING`.
  - If a request exists (initiated by User B): Updates status to `MATCHED`.

### 3. Waiting State
- If **User A** initiated the request first, they enter the `waiting` state.
- **Frontend**: The `usePartnerSync` hook polls `syncApi.getActiveSyncRequest` every 3 seconds.
- **UI**: Shows a loading spinner and instructions to tell the partner to enter the code.

### 4. Matching (Found Step)
- **User B** enters **User A's** code.
- **Backend**: Finds the existing `PENDING` request from User A and updates it to `MATCHED`.
- **Frontend**:
  - Both users' polling loops detect the status change to `MATCHED`.
  - Both users are transitioned to the `found` state.
  - UI displays both users' avatars connected by a heart.

### 5. Confirmation
- Both users must explicitly tap "Confirm Sync".
- **Action**: `syncApi.confirmPartnerSync(requestId, userId)` is called.
- **Backend**:
  - Updates `requester_confirmed` or `target_confirmed` to `true`.
  - Checks if *both* flags are true.
  - **If Both True**:
    1. Inserts a new row into the `relationships` table.
    2. Deletes the temporary row from `partner_sync_requests`.
    3. Returns `status: "SYNC_COMPLETED"`.
- **Frontend**:
  - If the other user hasn't confirmed yet: Shows "Waiting for partner..."
  - If sync completed: Redirects both users to the main dashboard (`/(tabs)`).

## Database Schema
- **`partner_sync_requests`**: Temporary table for the handshake.
  - `requester_id`, `target_id`, `status` (PENDING/MATCHED), `requester_confirmed`, `target_confirmed`.
- **`relationships`**: Permanent table for linked users.
  - `user_one_id`, `user_two_id`.

## Security
- **RLS Policies**:
  - Users can only view/update sync requests they are involved in.
  - Users can only view relationships they are part of.
- **Concurrency**:
  - A symmetric unique index on `partner_sync_requests` prevents duplicate or conflicting requests (A->B and B->A cannot exist simultaneously).
  - Row locking (`FOR UPDATE`) in SQL functions ensures atomic operations.
