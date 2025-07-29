# Firebase Indexes Setup Guide

## Required Indexes for Dashboard Functionality

To enable the full dashboard functionality with real-time data, you need to create the following composite indexes in your Firebase Firestore:

### 1. Interview Sessions Index
**Collection:** `interview_sessions`
**Fields:**
- `userId` (Ascending)
- `completedAt` (Descending)

**Purpose:** For getting recent interview sessions and weekly progress

### 2. User Activity Index
**Collection:** `user_activity`
**Fields:**
- `userId` (Ascending)
- `timestamp` (Descending)

**Purpose:** For getting user activity feed

## How to Create Indexes

### Option 1: Using Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `interviewx-82f75`
3. Navigate to Firestore Database
4. Click on the "Indexes" tab
5. Click "Create Index"
6. Add the indexes listed above

### Option 2: Using the Direct Links
Click these links to create the indexes directly:

**Interview Sessions Index:**
```
https://console.firebase.google.com/v1/r/project/interviewx-82f75/firestore/indexes?create_composite=Cltwcm9qZWN0cy9pbnRlcnZpZXd4LTgyZjc1L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9pbnRlcnZpZXdfc2Vzc2lvbnMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaDwoLY29tcGxldGVkQXQQARoMCghfX25hbWVfXxAB
```

## After Creating Indexes

Once the indexes are created and built (this may take a few minutes), you can:

1. **Enable Real Weekly Progress:**
   - Update the `getWeeklyProgress` function in `firebase/dashboardService.ts`
   - Remove the mock data and uncomment the real query

2. **Enable Real Activity Feed:**
   - Update the `getUserActivity` function in `firebase/dashboardService.ts`
   - Remove the mock data and uncomment the real query

## Current Status

The dashboard is currently using mock data for:
- Weekly progress charts
- Activity feed

This ensures the app works immediately while you set up the Firebase indexes. Once the indexes are created, you can switch to real data by updating the service functions.

## Testing

After creating the indexes:
1. Wait for them to finish building (check the Firebase Console)
2. Restart your Expo development server
3. Test the dashboard functionality
4. Complete an interview to see real data being tracked 