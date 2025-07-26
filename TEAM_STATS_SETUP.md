# Team Stats Feature Setup

This document describes the new Team Stats feature that has been added to the study groups functionality.

## Overview

The Team Stats feature allows users to view rank progression data for all members of a study group in a line graph format. This helps track team performance over time since the group was created.

## Features

- **Team Stats Tab**: New tab in group modals showing rank progression
- **Line Graph**: Visual representation of ELO changes over time
- **Member Tracking**: Individual member progress tracking
- **Date Filtering**: Data filtered from group creation date onwards

## Database Schema

### New Table: `rank_audit_events`

```sql
CREATE TABLE rank_audit_events (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    elo INTEGER NOT NULL,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    riot_id TEXT NOT NULL,
    
    CONSTRAINT fk_riot_id FOREIGN KEY (riot_id) REFERENCES riot_accounts(riot_id) ON DELETE CASCADE
);
```

### Indexes for Performance

- `idx_rank_audit_events_riot_id` - For filtering by riot_id
- `idx_rank_audit_events_created_at` - For date range queries
- `idx_rank_audit_events_riot_id_created_at` - Composite index for common queries

## API Endpoints

### 1. Get Team Stats
```
GET /api/team-stats?group_id={group_id}&start_date={start_date}
```

**Parameters:**
- `group_id` (required): Study group ID
- `start_date` (required): ISO date string for filtering events

**Response:**
```json
{
  "events": [
    {
      "id": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "elo": 1200,
      "wins": 5,
      "losses": 3,
      "riot_id": "player_riot_id"
    }
  ],
  "memberCount": 3,
  "averageElo": 1250.5,
  "totalWins": 15,
  "totalLosses": 10
}
```

### 2. Get Member Stats
```
GET /api/team-stats/members?group_id={group_id}&start_date={start_date}
```

**Parameters:**
- `group_id` (required): Study group ID
- `start_date` (required): ISO date string for filtering events

**Response:**
```json
{
  "player_riot_id_1": [
    {
      "id": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "elo": 1200,
      "wins": 5,
      "losses": 3,
      "riot_id": "player_riot_id_1"
    }
  ],
  "player_riot_id_2": [
    {
      "id": 2,
      "created_at": "2024-01-01T00:00:00Z",
      "elo": 1250,
      "wins": 7,
      "losses": 2,
      "riot_id": "player_riot_id_2"
    }
  ]
}
```

## Frontend Components

### 1. TeamStatsChart Component
- **Location**: `src/components/TeamStatsChart.tsx`
- **Purpose**: Renders the line graph showing rank progression
- **Features**:
  - SVG-based line chart
  - Color-coded member lines
  - Interactive legend with trend indicators
  - Responsive design

### 2. Team Stats Service
- **Location**: `src/services/teamStatsService.ts`
- **Purpose**: Handles API calls for team stats data
- **Features**:
  - Retry logic with exponential backoff
  - Error handling
  - TypeScript interfaces

### 3. Updated Group Components
- **GroupsTab**: Added Team Stats tab to group modals
- **MyGroupsTab**: Added Team Stats tab to my groups modals

## Setup Instructions

### 1. Database Setup
Run the SQL script to create the `rank_audit_events` table:

```bash
# Execute the SQL script in your Supabase database
# File: create_rank_audit_events_table.sql
```

### 2. Backend Setup
The Flask server (`app.py`) already includes the new endpoints:
- `/api/team-stats`
- `/api/team-stats/members`

### 3. Frontend Setup
The frontend components are already implemented and ready to use.

## Usage

1. **Navigate to Study Groups**: Go to the study groups page
2. **Click on a Group**: Click on any study group tile
3. **Select Team Stats Tab**: Click on the "Team Stats" tab in the modal
4. **View Progress**: The line graph will show rank progression for all group members

## Data Population

The `rank_audit_events` table needs to be populated with rank progression data. This can be done through:

1. **Manual Insertion**: Insert records manually for testing
2. **Automated Scripts**: Create scripts to pull data from Riot API
3. **User Actions**: Trigger updates when users update their ranks

## Security

- Row Level Security (RLS) is enabled on the `rank_audit_events` table
- Users can only view rank audit events for:
  - Their own riot_id
  - Group members' riot_ids (if they're in the same group)
- Foreign key constraints ensure data integrity

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live updates
2. **Advanced Analytics**: Win rate trends, performance metrics
3. **Export Features**: Download team stats as CSV/PDF
4. **Comparison Tools**: Compare performance across different time periods
5. **Predictions**: AI-powered performance predictions

## Troubleshooting

### Common Issues

1. **No Data Displayed**: Check if the `rank_audit_events` table has data
2. **API Errors**: Verify the backend server is running on port 5001
3. **Permission Errors**: Check RLS policies in Supabase
4. **Chart Not Rendering**: Ensure all required dependencies are installed

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify API endpoints are responding correctly
3. Check database for data in `rank_audit_events` table
4. Verify user permissions in Supabase 