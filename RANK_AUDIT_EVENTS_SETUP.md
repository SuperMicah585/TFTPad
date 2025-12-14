# Rank Audit Events Setup

## Overview

This document describes the new rank audit events functionality that automatically populates the `rank_audit_events` table when a player is added via the 'add player' modal.

## How It Works

When a user successfully adds a player through the 'add player' modal:

1. **Riot API Validation**: The system validates the player with the Riot API
2. **Account Creation**: If valid, a new entry is created in the `riot_accounts` table
3. **MetaTFT API Call**: The system then makes a request to the MetaTFT API to fetch rank progression data
4. **Data Processing**: The response is processed to extract rank audit events
5. **Database Population**: Events are inserted into the `rank_audit_events` table

## API Endpoint

The system calls the MetaTFT API endpoint:
```
https://api.metatft.com/public/profile/lookup_by_riotid/{region}/{name}/{tag}?source=full_profile&tft_set={tft_set}
```

### Parameters:
- `region`: Riot region converted to uppercase (e.g., 'na1' → 'NA1', 'euw1' → 'EUW1')
- `name`: Player name (extracted from summoner_name before the '#')
- `tag`: Player tag (extracted from summoner_name after the '#')
- `tft_set`: Uses TFT_SET environment variable, converted to camelCase (e.g., 'TFTSet16')

## Data Processing

### Input Data Structure
The MetaTFT API returns an object with a `ranked_rating_changes` array:
```json
{
  "ranked_rating_changes": [
    {
      "num_games": 230,
      "rating_text": "DIAMOND IV 28 LP",
      "rating_numeric": 2428,
      "created_timestamp": "2025-08-29T06:30:40.502",
      "tft_set_name": "TFTSet16",
      "queue_id": 1100
    }
  ]
}
```

### Processing Logic
1. **Reverse Order**: Events are processed in reverse order (newest first)
2. **Cumulative Win/Loss Calculation**: 
   - If `rating_numeric` increases → `cumulative_wins += 1`
   - If `rating_numeric` decreases or stays same → `cumulative_losses += 1`
   - Each event stores the total accumulated wins and losses up to that point
3. **Timestamp Parsing**: Uses the `created_timestamp` field for the `created_at` field
4. **ELO Assignment**: Uses `rating_numeric` as the `elo` value

### Database Schema
Events are inserted into the `rank_audit_events` table:
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

## Region Mapping

The MetaTFT API expects regions in uppercase format:

| Riot Region | MetaTFT Region |
|-------------|----------------|
| na1         | NA1            |
| euw1        | EUW1           |
| eun1        | EUN1           |
| kr1         | KR1            |
| br1         | BR1            |
| la1         | LA1            |
| la2         | LA2            |
| oc1         | OC1            |
| tr1         | TR1            |
| ru1         | RU1            |
| jp1         | JP1            |
| ph2         | PH2            |
| sg2         | SG2            |
| th2         | TH2            |
| tw2         | TW2            |
| vn2         | VN2            |

## Implementation Details

### Functions Added

1. **`populate_rank_audit_events(riot_id, region)`**
   - Main function that orchestrates the entire process
   - Fetches player data from database
   - Parses summoner_name to extract name and tag
   - Maps region and constructs API URL
   - Processes response and inserts events

### Integration Points

The function is called from:
1. **`connect_riot_account()`** - When adding a new player via the modal
2. **`riot_login()`** - When creating a new account during login

### Error Handling

- **Non-blocking**: If rank audit events fail, the account creation still succeeds
- **Logging**: All errors are logged with detailed information
- **Graceful Degradation**: System continues to function even if MetaTFT API is unavailable

## Testing

Use the provided test script to verify functionality:
```bash
python test_rank_audit_events.py
```

## Monitoring

Check the application logs for:
- `"Fetching rank audit events from MetaTFT"`
- `"Successfully inserted X rank audit events"`
- `"Warning: Failed to populate rank audit events"`

## Troubleshooting

### Common Issues

1. **No ranked_rating_changes found**
   - Player may not have played ranked games
   - MetaTFT may not have data for this player

2. **Invalid summoner_name format**
   - Check that summoner_name contains a '#' character
   - Verify the format is "name#tag"

3. **Region mapping issues**
   - Ensure the region is properly mapped
   - Check that the region exists in the mapping table

4. **API timeout**
   - MetaTFT API may be slow or unavailable
   - Check network connectivity

### Debug Steps

1. Check application logs for detailed error messages
2. Verify the MetaTFT API URL construction
3. Test the API endpoint manually
4. Check database for inserted events
5. Verify region mapping is correct

## Future Enhancements

1. **Batch Processing**: Process multiple players at once
2. **Retry Logic**: Implement retry mechanism for failed API calls
3. **Caching**: Cache MetaTFT responses to reduce API calls
4. **Scheduling**: Periodic updates for existing players
5. **Metrics**: Track success/failure rates and API response times
