# State Management Strategy

This document outlines the standardized approach to state management for the Fitness Sync application. Following these guidelines ensures consistency, maintainability, and performance.

## 1. Global State (Zustand Stores)

**When to use:** For data that is truly global and needs to be accessed or modified by many different components across the entire application.

**What it's for:**
-   **User Authentication:** Storing the authenticated user's profile, session information, and authentication status (`useAuthStore`).
-   **Synced Partner Data:** Once a partner is synced, their basic information (ID, name, avatar) should be stored globally so components like the Profile header or a shared workout log can access it without re-fetching.
-   **Application Settings:** Persisted user preferences like theme (dark/light) and language (en/es).

**Key Principle:** The global store is for long-lived application state, not for temporary process states.

---

## 2. Chained/Sequential Process State (Custom Hooks)

**When to use:** For managing the state of a specific, multi-step user flow that spans multiple UI changes or API calls but is confined to a single feature.

**What it's for:**
-   **Partner Sync Process:** The flow of entering a code, waiting for a partner, and confirming the match (`usePartnerSync`).
-   **Multi-step Onboarding:** A hypothetical user onboarding flow that guides the user through several setup screens.
-   **Complex Forms:** A multi-page form or wizard.

**Key Principle:** A custom hook encapsulates the entire logic and state of a single, sequential process. The state within the hook should be carefully managed to prevent UI flickering on component re-mounts. The hook is the single source of truth for that process.

---

## 3. Component-Based State (`useState`, `useReducer`)

**When to use:** For state that is local and exclusive to a single component. This is the default and most common type of state.

**What it's for:**
-   **UI Interactivity:** Toggling the visibility of a modal, dropdown, or accordion.
-   **Form Inputs:** Managing the value of text inputs, checkboxes, and other form controls.
-   **Simple Async Operations:** Handling the `isLoading` or `error` state for a single API call that is initiated and contained within one component (e.g., fetching a list of items).

**Key Principle:** If the state is not needed by any other component, it belongs inside the component that creates it. This keeps components self-contained and easy to reason about.
