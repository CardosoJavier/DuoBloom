# Standardized Error Handling in Fitness Sync

This document outlines the standardized error handling strategy used in the Fitness Sync application.

## Overview

We use a `Result` pattern to handle API responses and errors, ensuring type safety and predictable behavior across the application. This approach avoids `try/catch` blocks in the UI layer and provides a consistent way to manage success and failure states.

## Core Components

### 1. ApiResult Type

Located in `types/api.ts`, `ApiResult<T>` is a discriminated union that represents the outcome of an operation:

```typescript
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };
```

### 2. AppError and ErrorCode

Located in `types/error.ts`, `AppError` defines the structure of an error, and `ErrorCode` enumerates known error scenarios.

```typescript
export enum ErrorCode {
  AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS",
  AUTH_EMAIL_NOT_CONFIRMED = "AUTH_EMAIL_NOT_CONFIRMED",
  // ... other codes
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface AppError {
  code: ErrorCode;
  message: string;
  originalError?: any;
}
```

## Implementation Layers

### API Layer (`api/user-api.ts`)

The API layer catches exceptions (e.g., from Supabase) and maps them to `AppError` using helper functions. It always returns an `ApiResult`.

```typescript
// Example from user-api.ts
const mapSupabaseError = (error: any): AppError => {
  if (error.message.includes("Email not confirmed")) {
    return { code: ErrorCode.AUTH_EMAIL_NOT_CONFIRMED, message: error.message };
  }
  // ... generic fallback
};

export const userApi = {
  signIn: async (data): Promise<ApiResult<AuthResponse>> => {
    const { error, data } = await supabase.auth.signInWithPassword(...);
    if (error) return { success: false, error: mapSupabaseError(error) };
    return { success: true, data: ... };
  }
};
```

### Store Layer (`store/authStore.ts`)

The Zustand store consumes `ApiResult`. It handles specific error codes (like `AUTH_EMAIL_NOT_CONFIRMED` triggering a state change) and exposes generic error messages to the UI via the `error` state.

```typescript
// Example from authStore.ts
const result = await userApi.signIn(...);
if (!result.success) {
  if (result.error.code === ErrorCode.AUTH_EMAIL_NOT_CONFIRMED) {
    set({ needsEmailConfirmation: true, error: null });
  } else {
    set({ error: result.error.message });
  }
}
```

## UI Usage (Displaying Errors)

The UI simply observes the `error` state from the store and displays it using a **Toast** notification.

**Do NOT use inline error boxes.** Always use the `Toast` component for transient error messages.

### Example: Displaying Error Toast

We use a custom hook `useAppToast` to handle toast notifications consistently and avoid duplication.

```typescript
import { useAppToast } from "@/hooks/use-app-toast";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

export default function LoginScreen() {
  const { error, clearError } = useAuthStore();
  const toast = useAppToast();

  useEffect(() => {
    if (error) {
      toast.error("Error", error);
      clearError(); // Important: Clear the error after showing the toast to avoid loops
    }
  }, [error, toast, clearError]);

  // ... rest of component
}
```

The `useAppToast` hook provides the following methods:

- `toast.success(title, description)`
- `toast.error(title, description)`
- `toast.warning(title, description)`
- `toast.info(title, description)`
