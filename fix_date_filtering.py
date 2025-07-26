#!/usr/bin/env python3
"""
Script to fix date filtering in team stats endpoints
"""

import re

def fix_date_filtering():
    """Fix the date filtering logic in app.py"""
    
    # Read the file
    with open('app.py', 'r') as f:
        content = f.read()
    
    # Replace the problematic mock data generation logic
    old_pattern = r'# Generate mock data for the last 30 days\n            import datetime\n            mock_events = \[\]\n            for riot_id in riot_ids:\n                base_elo = 1200 \+ \(hash\(riot_id\) % 400\)  # Different starting ELO for each player\n                current_elo = base_elo\n                \n                for i in range\(30\):  # Last 30 days\n                    event_date = datetime\.datetime\.now\(\) - datetime\.timedelta\(days=29-i\)\n                                        # Simple date comparison without timezone issues\n                    start_date_only = start_date\.split\(\'T\'\)\[0\]  # Get just the date part\n                    event_date_only = event_date\.strftime\(\'%Y-%m-%d\'\)\n                    if event_date_only >= start_date_only:\n                        # Simulate ELO changes\n                        elo_change = \(hash\(f"{riot_id}{i}"\) % 100\) - 50  # -50 to \+50\n                        current_elo = max\(800, min\(2000, current_elo \+ elo_change\)\)\n                        \n                        wins = \(hash\(f"{riot_id}{i}wins"\) % 5\)\n                        losses = \(hash\(f"{riot_id}{i}losses"\) % 5\)\n                        \n                        mock_events\.append\(\{\n                            \'id\': len\(mock_events\) \+ 1,\n                            \'created_at\': event_date\.isoformat\(\),\n                            \'elo\': current_elo,\n                            \'wins\': wins,\n                            \'losses\': losses,\n                            \'riot_id\': riot_id\n                        \}\)'
    
    new_pattern = '''# Generate mock data from group creation date onwards
            import datetime
            mock_events = []
            
            # Parse the group creation date
            start_date_only = start_date.split('T')[0]  # Get just the date part
            start_date_obj = datetime.datetime.strptime(start_date_only, '%Y-%m-%d')
            today = datetime.datetime.now()
            
            # Calculate days since group creation
            days_since_creation = (today - start_date_obj).days
            logger.info(f"Group created {days_since_creation} days ago")
            
            for riot_id in riot_ids:
                base_elo = 1200 + (hash(riot_id) % 400)  # Different starting ELO for each player
                current_elo = base_elo
                
                # Generate data from group creation date to today
                for i in range(days_since_creation + 1):  # +1 to include today
                    event_date = start_date_obj + datetime.timedelta(days=i)
                    
                    # Only generate data if the event date is not in the future
                    if event_date <= today:
                        # Simulate ELO changes
                        elo_change = (hash(f"{riot_id}{i}") % 100) - 50  # -50 to +50
                        current_elo = max(800, min(2000, current_elo + elo_change))
                        
                        wins = (hash(f"{riot_id}{i}wins") % 5)
                        losses = (hash(f"{riot_id}{i}losses") % 5)
                        
                        mock_events.append({
                            'id': len(mock_events) + 1,
                            'created_at': event_date.isoformat(),
                            'elo': current_elo,
                            'wins': wins,
                            'losses': losses,
                            'riot_id': riot_id
                        })'''
    
    # Replace both occurrences
    content = re.sub(old_pattern, new_pattern, content, flags=re.MULTILINE | re.DOTALL)
    
    # Write the fixed content back
    with open('app.py', 'w') as f:
        f.write(content)
    
    print("✅ Fixed date filtering logic in app.py")

if __name__ == "__main__":
    fix_date_filtering() 