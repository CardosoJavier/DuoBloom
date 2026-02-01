# Application Overview

## Name: Sync

### Core Concept

A neo-minimalist fitness tracking application designed specifically for couples.

### Goal

To gamify and simplify the process of getting healthy together. Unlike solitary fitness apps, Sync relies on shared accountability. It allows partners to visualize each other's hydration, nutrition streaks, workout logs, and body transformation progress in real-time, fostering a supportive environment ("Vibes") rather than a competitive one.

### Design Language

- **Aesthetic:** "Bento-grid" layouts, rounded corners (`rounded-[32px]`), and a soft, pastel color palette (Lavender primary) mixed with high-contrast slate text.
- **Interaction:** Smooth Framer Motion transitions, context-aware dialogs, and playful micro-interactions (confetti, liquid fills).
- **Theme:** Fully responsive Light and Dark modes.

---

## Detailed Feature Breakdown

### 1. Authentication & Onboarding

The entry point to the application, designed to feel welcoming and energetic.

- **Login/Signup Toggle:** A smooth, animated switch between creating an account and signing in.
- **Partner Code Integration:** After signup/profile creation, users get assigned a unique code (e.g., ALEX-8392) to link their account with their partner.
- **Visuals:** Decorative, blurred background elements to create depth.

#### Couple Pair flow:

The following steps describe how couples accounts are linked to each other.

1.  Users create an account by filling the sign up form.
2.  After valid form values are provided, user is redirected to “sync” page.
3.  At “sync” page, user gets their unique account “sync” code
4.  Below their unique code, there is an input text where users enters their partner code
5.  Once entered, a “wait screen” is displayed until both users in the couple enter each other's code.
6.  Then, a “confirm sync” screen is displayed, where each user MUST click enter.

### 2. Tab 1: Dashboard (The Today)

The central command center provides a "Glanceable" view of the couple's daily status.

- **Partner Bar (Sticky Header):** Displays who you are training with (Partner's avatar).
- **"Vibe" Button:** A gamified interaction. It's a button located inside the Partner Bar. Clicking this opens a dialog to send a motivational message. Upon sending, confetti explodes on the screen to celebrate the connection.
- **Nutrition Streak Widget:** A GitHub-contribution-style grid showing the current month's nutrition adherence. Clicking it deep-links to the detailed Streak view.
- **Hydration Widget:** Tracks daily water intake. The background fills up visually as the user logs glasses. It has a Plus/Minus buttons for rapid logging.
- **Meal Counter Widget:** A comparative bar chart showing how many meals "Me" vs. "Partner" have logged today.
- **Trend Widgets (Metrics):** Two side-by-side charts showing weight trends over the last 7 days for both the user and the partner, indicating percentage change (e.g., "-1.5%").

### 3. Tab 2: Meals (Food Journal)

A shared space to track nutrition, designed to accommodate different tracking styles (Visual vs. Analytical).

- **View Switcher:** A segmented control to toggle between Meals and Streak modes.

#### 1. Mode A: Meals (Visual Feed):

- **Date Navigator:** Browse meal history by day.
- **Photo Grid:** A visual grid of meals logged by both users.
- **Metadata:** Each card shows the meal title, calories, time logged, and the avatar of the user who ate it.

#### 2. Mode B: Streak (Analytical):

- **User Toggle:** Switch between viewing "My Streak" and "Partner's Streak."
- **Calendar Heatmap:** A detailed view of consistency over the selected month.
- **Stats Summary:** Big, bold metrics showing current streak count (in days) and total completion percentage.

### 4. Tab 3: Workouts

A logbook for physical activity where users upload a picture of themselves doing a physical activity for accountability and track.

- **Daily Log:** Displays a timeline of workouts for the selected date.
- **Workout Cards:** High-fidelity cards featuring:
  - Background image of the activity.
  - User avatar (who performed the workout).
  - Activity type (e.g., "Morning Run").
  - Duration/Timeframe (e.g., "7:00 AM - 7:45 AM").

### 5. Tab 4: Progress (Body Composition)

The central hub for tracking physical transformation, split into two distinct modes to allow for granular privacy and focused tracking.

- **Primary Switcher:** Toggle between Photos and Stats.

#### Mode A: Photos

Designed for visual comparison with granular privacy controls.

- **View Switcher:** Toggle between Gallery and Compare.
- **Privacy Mode:** A global toggle. When enabled, the partner's photos are blurred. When disabled, they are revealed.

**1. Gallery View:**

- Shows photos for a specific date.
- **Three Angles:** Explicit slots for Front, Side, and Back photos.
- Organized into "My Update" and "Partner's Update" sections.

**2. Compare View:**

- **Subject Selector:** Compare "Me" or "Partner".
- **Time Travel:** Select a "Before" date and an "After" date.
- **Side-by-Side View:** Renders the Front, Side, and Back photos of the two selected dates next to each other for easy visual comparison.

#### Mode B: Stats

Designed for numerical tracking without the need for photos.

- **Metric Toggle:** Switch between Weight (kg) and Body Fat (%).
- **Subject Toggle:** View "My Stats" or "Partner's Stats".
- **Interactive Chart:** A responsive line chart visualizing the trend over the last 6 weeks.

### 6. Tab 5: Profile

Identity management and application configuration.

- **Identity Card:** Shows User Avatar, Name, and "Member Since" date.
- **User Code:** A copyable card displaying the user's unique linkage code.
- **Menus:**
  - **Edit Profile:** Opens a dialog to: update Name, Update Email, Update Password, Delete Account.
  - **App Settings:** Opens a dialog to: Change Language: English / Español; Change Theme: Light / Dark / System Default.
- **Logout:** Securely ends the session.

### 7. Global / Context-Aware Features

- **"Add Measure" FAB (Floating Action Button):** A sticky button present on Meals, Workouts, and Progress tabs.
- **Context-Aware Form:** The dialog content changes based on the active tab:
  - If on Meals: Asks for Meal Name, Calories, and Photo.
  - If on Workouts: Asks for Activity Type, Start Time, and End Time.
  - If on Progress: Asks for Weight, Body Fat %, and buttons to upload Front, Side, and Back photos.
- **Daily Check-in:** Every morning, a popup appears on app load asking, "Did you stick to your nutrition plan yesterday?" to automate streak tracking.

---

## Tech Stack

### User Interface (UI)

- React Native
- Tailwind
- GlueStack
- TankStack Query

### Backend

- Supabase

### Colors

- **Light:** Bg: `#F9FAFB`
- **Dark:** Bg: `#0E172A`
- **Global:** Primary: `#9FA0FF`

### Components

- Components will be build from the primitive components provided by GlueStack UI library and customize them to fit the application style.
