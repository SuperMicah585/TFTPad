# Study Group Requests Feature

This document describes the new study group requests functionality that allows logged-in users to request to join study groups.

## Overview

The study group requests feature enables users to:
- Request to join a study group from the group's detail page
- Cancel their pending requests
- Captains can view and respond to pending requests in the manage groups modal

## Database Schema

The feature uses the `study_group_requests` table with the following structure:

```sql
CREATE TABLE study_group_requests (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    study_group_id INTEGER REFERENCES study_groups(id),
    user_id INTEGER REFERENCES users(id),
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);
```

## API Endpoints

### Create Request
- **POST** `/api/study-group-requests`
- **Body**: `{ "study_group_id": number, "user_id": number }`
- **Response**: `StudyGroupRequest` object

### Get Group Requests (for captains)
- **GET** `/api/study-groups/{groupId}/requests`
- **Response**: `{ "requests": StudyGroupRequest[] }`

### Get User Requests
- **GET** `/api/users/{userId}/study-group-requests`
- **Response**: `{ "requests": StudyGroupRequest[] }`

### Respond to Request
- **POST** `/api/study-group-requests/{requestId}/approve`
- **POST** `/api/study-group-requests/{requestId}/reject`
- **Response**: `{ "message": string }`

### Cancel Request
- **DELETE** `/api/study-group-requests/{requestId}`
- **Response**: `{ "message": string }`

## Frontend Implementation

### Components Modified

1. **GroupDetailPage.tsx**
   - Added "Request to Join" button for non-members
   - Shows pending request status and cancel option
   - Shows membership status for existing members

2. **MyGroupsTab.tsx**
   - Added "Pending Requests" section in manage tab for captains
   - Allows captains to approve/reject requests
   - Shows request details including user info and request date

3. **studyGroupRequestService.ts** (New)
   - Service for all request-related API calls
   - Includes retry logic and error handling

### User Flow

#### For Users Requesting to Join:
1. Navigate to a study group's detail page
2. If not a member, see "Request to Join" button
3. Click button to send request
4. See pending status with option to cancel
5. Once approved/rejected, request disappears

#### For Captains Managing Requests:
1. Go to "My Groups" page
2. Click on a group to open manage modal
3. Navigate to "Manage" tab
4. See "Pending Requests" section
5. Click "Refresh" to load latest requests
6. Approve or reject each request
7. Approved users automatically join the group

## Features

### Request Management
- **Status Tracking**: Requests have pending/approved/rejected status
- **Duplicate Prevention**: Users can't request to join groups they're already members of
- **Request History**: Captains can see when requests were made
- **User Information**: Shows summoner name and rank for each request

### UI/UX
- **Loading States**: Shows spinners during API calls
- **Error Handling**: Displays error messages for failed operations
- **Confirmation Dialogs**: Asks for confirmation before canceling requests
- **Responsive Design**: Works on mobile and desktop
- **Visual Feedback**: Different colors and icons for different states

### Security
- **Authorization**: Only captains can see and respond to requests
- **Validation**: Prevents duplicate requests and invalid operations
- **Data Integrity**: Proper foreign key relationships

## Testing

Run the test script to verify functionality:

```bash
python test_study_group_requests.py
```

This will test:
- Creating requests
- Retrieving group and user requests
- Approving requests
- Error handling

## Future Enhancements

Potential improvements for the future:
- Email notifications for request status changes
- Bulk approve/reject functionality
- Request messaging system
- Request expiration dates
- Request analytics and reporting
