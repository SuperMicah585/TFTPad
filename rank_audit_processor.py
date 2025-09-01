import requests
import time
import logging
import jwt
import json
import redis
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import sys
import os
from supabase import create_client, Client
#Test hook next
# Try to load dotenv if available, otherwise use system environment variables
try:
    from dotenv import load_dotenv
    # Load environment variables from backend.env file
    load_dotenv('backend.env')
except ImportError:
    # dotenv not available, use system environment variables
    pass

# Configure logging - only show Redis cache logs
logging.basicConfig(
    level=logging.WARNING,  # Set to WARNING to suppress INFO logs
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('rank_audit_processor.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Create a custom filter for Redis cache logs
class RedisCacheFilter(logging.Filter):
    def filter(self, record):
        # Only allow logs that contain Redis cache-related messages
        redis_keywords = [
            'cache hit', 'cache miss', 'redis cache', 'cached data', 
            'cache cleared', 'cache population', 'redis connection',
            'member_stats_group_', 'successfully cached', 'failed to cache',
            'redis cache population', 'redis cache error'
        ]
        message = record.getMessage().lower()
        return any(keyword in message for keyword in redis_keywords)

# Apply the filter to the logger
logger.addFilter(RedisCacheFilter())

# Configuration
FLASK_API_BASE_URL = os.environ.get('FLASK_API_BASE_URL')
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
JWT_ALGORITHM = 'HS256'
RIOT_API_KEY = os.environ.get('RIOT_API_KEY')

# Validate required environment variables
if not JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is required")
if not RIOT_API_KEY:
    raise ValueError("RIOT_API_KEY environment variable is required")

# Supabase configuration (same as app.py)
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Redis configuration
REDIS_HOST = os.environ.get('REDIS_HOST')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD')
REDIS_DB = int(os.environ.get('REDIS_DB', 0))
if not REDIS_HOST or not REDIS_PASSWORD:
    raise ValueError("REDIS_HOST and REDIS_PASSWORD environment variables are required")

# Initialize Redis client
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD,
    db=REDIS_DB,
    decode_responses=True
)

# Batch processing configuration
BATCH_SIZE = 10
BATCH_DELAY = 10  # seconds

def create_jwt_token(user_id: int, riot_id: str) -> str:
    """Create a JWT token for authentication"""
    payload = {
        'user_id': user_id,
        'riot_id': riot_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=24),  # 24 hour expiration
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def get_auth_headers(token: str) -> Dict[str, str]:
    """Get headers with JWT authentication"""
    return {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

def rank_to_elo(rank_str: str) -> int:
    """
    Convert TFT rank string to ELO points based on the breakdown:
    0-300 Iron IV, III, II, I
    400-700 Bronze IV, III, II, I
    800-1100 Silver IV, III, II, I
    1200-1500 Gold IV, III, II, I
    1600-1900 Platinum IV, III, II, I
    2000-2300 Emerald IV, III, II, I
    2400-2700 Diamond IV, III, II, I
    2800+ Master, Grandmaster, Challenger + LP
    """
    if not rank_str or rank_str == 'UNRANKED':
        return 0
    
    rank_str = rank_str.upper()
    
    # Handle TURBO ranks
    if rank_str.startswith('TURBO '):
        turbo_rank = rank_str.replace('TURBO ', '')
        if turbo_rank == 'UNRANKED':
            return 0
        elif turbo_rank == 'IRON':
            return 200
        elif turbo_rank == 'BRONZE':
            return 600
        elif turbo_rank == 'SILVER':
            return 1000
        elif turbo_rank == 'GOLD':
            return 1400
        elif turbo_rank == 'PLATINUM':
            return 1800
        elif turbo_rank == 'EMERALD':
            return 2200
        elif turbo_rank == 'DIAMOND':
            return 2600
        else:
            return 0
    
    # Handle regular ranks
    def get_division_value(rank_str, base_elo):
        if ' IV' in rank_str:
            return base_elo + 0
        elif ' III' in rank_str:
            return base_elo + 100
        elif ' II' in rank_str:
            return base_elo + 200
        elif ' I' in rank_str:
            return base_elo + 300
        else:
            return base_elo
    
    def add_lp_to_elo(rank_str, base_elo):
        """Add LP to base ELO for any rank"""
        lp = 0
        if 'LP' in rank_str:
            try:
                lp_part = rank_str.split('LP')[0].strip()
                lp = int(lp_part.split()[-1])
            except:
                lp = 0
        return base_elo + lp
    
    if 'IRON' in rank_str:
        base_elo = get_division_value(rank_str, 0)
        return add_lp_to_elo(rank_str, base_elo)
    elif 'BRONZE' in rank_str:
        base_elo = get_division_value(rank_str, 400)
        return add_lp_to_elo(rank_str, base_elo)
    elif 'SILVER' in rank_str:
        base_elo = get_division_value(rank_str, 800)
        return add_lp_to_elo(rank_str, base_elo)
    elif 'GOLD' in rank_str:
        base_elo = get_division_value(rank_str, 1200)
        return add_lp_to_elo(rank_str, base_elo)
    elif 'PLATINUM' in rank_str:
        base_elo = get_division_value(rank_str, 1600)
        return add_lp_to_elo(rank_str, base_elo)
    elif 'EMERALD' in rank_str:
        base_elo = get_division_value(rank_str, 2000)
        return add_lp_to_elo(rank_str, base_elo)
    elif 'DIAMOND' in rank_str:
        base_elo = get_division_value(rank_str, 2400)
        return add_lp_to_elo(rank_str, base_elo)
    elif 'MASTER' in rank_str or 'GRANDMASTER' in rank_str or 'CHALLENGER' in rank_str:
        base_elo = 2800
        return add_lp_to_elo(rank_str, base_elo)
    return 0

def get_all_riot_accounts(token: str) -> List[Dict[str, Any]]:
    """Fetch all riot accounts from the database via Flask API"""
    try:
        headers = get_auth_headers(token)
        response = requests.get(f"{FLASK_API_BASE_URL}/api/riot-accounts", headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            accounts = data.get('accounts', [])
            return accounts
        else:
            return []
            
    except Exception as e:
        return []

def fetch_league_data(riot_id: str, region: str) -> Optional[Dict[str, Any]]:
    """Fetch league data from Riot API for a given riot_id"""
    try:
        # Use the region directly from the user's account
        url = f"https://{region}.api.riotgames.com/tft/league/v1/by-puuid/{riot_id}"
        headers = {'X-Riot-Token': RIOT_API_KEY}
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            league_data = response.json()
            return league_data
        elif response.status_code == 404:
            return None
        elif response.status_code == 429:
            return None
        else:
            return None
            
    except requests.exceptions.Timeout:
        return None
    except requests.exceptions.RequestException as e:
        return None
    except Exception as e:
        return None

def extract_rank_data(league_data: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Extract rank data from league API response"""
    try:
        # Find ranked TFT data (not Turbo)
        for entry in league_data:
            if entry.get('queueType') == 'RANKED_TFT':
                tier = entry.get('tier', 'UNRANKED')
                rank_division = entry.get('rank', '')
                league_points = entry.get('leaguePoints', 0)
                wins = entry.get('wins', 0)
                losses = entry.get('losses', 0)
                
                if tier != 'UNRANKED':
                    rank_str = f"{tier} {rank_division} {league_points}LP"
                else:
                    rank_str = 'UNRANKED'
                
                elo = rank_to_elo(rank_str)
                
                return {
                    'elo': elo,
                    'wins': wins,
                    'losses': losses,
                    'rank_str': rank_str
                }
        
        # If no ranked TFT found, check for turbo TFT
        for entry in league_data:
            if entry.get('queueType') == 'RANKED_TFT_TURBO':
                rated_tier = entry.get('ratedTier', 'UNRANKED')
                wins = entry.get('wins', 0)
                losses = entry.get('losses', 0)
                
                if rated_tier != 'UNRANKED':
                    rank_str = f"TURBO {rated_tier}"
                else:
                    rank_str = 'UNRANKED'
                
                elo = rank_to_elo(rank_str)
                
                return {
                    'elo': elo,
                    'wins': wins,
                    'losses': losses,
                    'rank_str': rank_str
                }
        
        # No rank data found
        return None
        
    except Exception as e:
        return None




def create_rank_audit_event(riot_id: str, rank_data: Dict[str, Any], token: str) -> bool:
    """Create a rank audit event in the database via Flask API"""
    try:
        # Check if wins/losses have changed by comparing with the most recent event
        def get_latest_event():
            return supabase.table('rank_audit_events').select('id, wins, losses').eq('riot_id', riot_id).order('created_at', desc=True).limit(1).execute()
        
        latest_response = get_latest_event()
        
        current_time = datetime.now(timezone.utc).isoformat()
        
        event_data = {
            'created_at': current_time,
            'elo': rank_data['elo'],
            'wins': rank_data['wins'],
            'losses': rank_data['losses'],
            'riot_id': riot_id
        }
        
        # If no previous events exist, create the event
        if not latest_response or not latest_response.data:
            # Create new event
            headers = get_auth_headers(token)
            response = requests.post(
                f"{FLASK_API_BASE_URL}/api/rank-audit-events",
                json=event_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 201:
                return True
            else:
                return False
        
        # Check if wins/losses are the same as the most recent event
        latest_event = latest_response.data[0]
        latest_wins = latest_event.get('wins', 0)
        latest_losses = latest_event.get('losses', 0)
        
        if rank_data['wins'] == latest_wins and rank_data['losses'] == latest_losses:
            # Same wins/losses - replace the previous event with the most recent one
            latest_event_id = latest_event.get('id')
            
            if latest_event_id:
                # Update the existing event with new timestamp and ELO
                headers = get_auth_headers(token)
                response = requests.put(
                    f"{FLASK_API_BASE_URL}/api/rank-audit-events/{latest_event_id}",
                    json=event_data,
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    return True
                else:
                    return False
            else:
                # Fallback: create new event if we can't update
                headers = get_auth_headers(token)
                response = requests.post(
                    f"{FLASK_API_BASE_URL}/api/rank-audit-events",
                    json=event_data,
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code == 201:
                    return True
                else:
                    return False
        else:
            # Different wins/losses - create new event
            headers = get_auth_headers(token)
            response = requests.post(
                f"{FLASK_API_BASE_URL}/api/rank-audit-events",
                json=event_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 201:
                return True
            else:
                return False
            
    except Exception as e:
        return False

def update_riot_account_rank(riot_id: str, rank_str: str, token: str) -> bool:
    """Update the rank column in the riot_accounts table directly using riot_id"""
    try:
        # Update the rank directly in the database using Supabase with riot_id
        update_response = supabase.table('riot_accounts').update({'rank': rank_str}).eq('riot_id', riot_id).execute()
        
        if update_response.data:
            return True
        else:
            return False
            
    except Exception as e:
        return False

def process_riot_account(account: Dict[str, Any], token: str) -> bool:
    """Process a single riot account"""
    riot_id = account.get('riot_id')
    region = account.get('region', 'americas')
    user_id = account.get('user_id')
    
    if not riot_id:
        return False
    
    # Fetch league data
    league_data = fetch_league_data(riot_id, region)
    if not league_data:
        return False
    
    # Extract rank data
    rank_data = extract_rank_data(league_data)
    if not rank_data:
        return False
    
    # Create rank audit event
    success = create_rank_audit_event(riot_id, rank_data, token)
    
    # Update the rank in the riot_accounts table
    update_riot_account_rank(riot_id, rank_data['rank_str'], token)
    
    return success

def process_batch(accounts: List[Dict[str, Any]], token: str) -> int:
    """Process a batch of riot accounts"""
    successful = 0
    failed = 0
    
    for account in accounts:
        try:
            if process_riot_account(account, token):
                successful += 1
            else:
                failed += 1
        except Exception as e:
            failed += 1
    
    return successful

def main():
    """Main function to process all riot accounts"""
    # Create a JWT token for authentication (using a system user ID)
    # You might want to create a dedicated system user for this
    system_user_id = 1  # Assuming user ID 1 exists, or create a system user
    system_riot_id = "system_audit_processor"
    token = create_jwt_token(system_user_id, system_riot_id)
    
    # Get all riot accounts
    accounts = get_all_riot_accounts(token)
    if not accounts:
        return
    
    total_accounts = len(accounts)
    
    # Process accounts in batches
    total_processed = 0
    total_successful = 0
    
    for i in range(0, total_accounts, BATCH_SIZE):
        batch = accounts[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (total_accounts + BATCH_SIZE - 1) // BATCH_SIZE
        
        successful = process_batch(batch, token)
        total_successful += successful
        total_processed += len(batch)
        
        # Wait before next batch (except for the last batch)
        if i + BATCH_SIZE < total_accounts:
            time.sleep(BATCH_DELAY)

    def add_data_to_redis_server():
        """Add member stats data to Redis cache for all study groups"""
        logger.warning("Starting Redis cache population for member stats...")
        
        try:
            # Get all study groups
            study_groups_response = supabase.table('study_group').select('id, group_name').execute()
            
            if not study_groups_response or not study_groups_response.data:
                logger.warning("No study groups found for Redis cache population")
                return
            
            study_groups = study_groups_response.data
            logger.warning(f"Found {len(study_groups)} study groups for Redis cache population")
            
            for group in study_groups:
                group_id = group['id']
                group_name = group['group_name']
                
                try:
                    logger.warning(f"Processing group {group_id}: {group_name} for Redis cache")
                    
                    # Get all users in the study group with their riot accounts
                    members_response = supabase.table('user_to_study_group').select(
                        'riot_id, riot_accounts!inner(summoner_name, region)'
                    ).eq('study_group_id', group_id).execute()
                    
                    if not members_response or not members_response.data:
                        logger.warning(f"No members found for group {group_id} in Redis cache population")
                        continue
                    
                    # Extract riot_ids and create mapping of riot_id to summoner_name and region
                    riot_ids = []
                    riot_id_to_name = {}
                    riot_id_to_region = {}
                    
                    for member in members_response.data:
                        riot_id = member['riot_id']
                        riot_account = member.get('riot_accounts')
                        
                        if riot_account:
                            riot_ids.append(riot_id)
                            summoner_name = riot_account['summoner_name']
                            region = riot_account.get('region', 'na1')
                            
                            riot_id_to_name[riot_id] = summoner_name
                            riot_id_to_region[riot_id] = region
                    
                    if not riot_ids:
                        logger.warning(f"No valid Riot IDs found for group {group_id} in Redis cache population")
                        continue
                    
                    # Get rank audit events for these riot_ids
                    events_response = supabase.table('rank_audit_events').select('*').in_('riot_id', riot_ids).order('created_at').execute()
                    
                    if not events_response:
                        events_response = {'data': []}
                    
                    events = events_response.data or []
                    
                    # Apply the same optimization logic as get_member_stats
                    from datetime import datetime, timezone
                    import pytz
                    
                    # Get current date for comparison
                    current_utc = datetime.now(timezone.utc)
                    
                    try:
                        local_tz = pytz.timezone('America/Los_Angeles')
                    except:
                        local_tz = pytz.UTC
                    
                    current_local = current_utc.astimezone(local_tz)
                    current_date = current_local.date().isoformat()
                    
                    # Group events by riot_id and date
                    events_by_riot_id = {}
                    
                    for event in events:
                        riot_id = event['riot_id']
                        if riot_id not in events_by_riot_id:
                            events_by_riot_id[riot_id] = {}
                        
                        try:
                            event_utc = datetime.fromisoformat(event['created_at'].replace('Z', '+00:00'))
                            event_local = event_utc.astimezone(local_tz)
                            event_date = event_local.date().isoformat()
                            
                            if event_date not in events_by_riot_id[riot_id]:
                                events_by_riot_id[riot_id][event_date] = []
                            
                            events_by_riot_id[riot_id][event_date].append(event)
                        except (KeyError, AttributeError, ValueError) as e:
                            logger.warn(f"Skipping invalid event: {e}")
                            continue
                    
                    # Apply smart filtering
                    optimized_events = []
                    
                    for riot_id, dates in events_by_riot_id.items():
                        for event_date, day_events in dates.items():
                            if not day_events:
                                continue
                            
                            is_today = event_date == current_date
                            
                            if is_today:
                                selected_event = max(day_events, key=lambda x: x['created_at'])
                            else:
                                selected_event = max(day_events, key=lambda x: x['elo'])
                            
                            optimized_events.append({
                                'riot_id': riot_id,
                                'summoner_name': riot_id_to_name.get(riot_id, riot_id),
                                'created_at': selected_event['created_at'],
                                'elo': selected_event['elo'],
                                'wins': selected_event['wins'],
                                'losses': selected_event['losses']
                            })
                    
                    # Sort and limit events
                    optimized_events.sort(key=lambda x: x['created_at'])
                    
                    MAX_EVENTS_PER_USER = 50
                    limited_events = []
                    events_per_user = {}
                    
                    for event in optimized_events:
                        riot_id = event['riot_id']
                        if riot_id not in events_per_user:
                            events_per_user[riot_id] = []
                        events_per_user[riot_id].append(event)
                    
                    for riot_id, user_events in events_per_user.items():
                        user_events.sort(key=lambda x: x['created_at'], reverse=True)
                        limited_events.extend(user_events[:MAX_EVENTS_PER_USER])
                    
                    limited_events.sort(key=lambda x: x['created_at'])
                    
                    # Group events by summoner_name
                    member_stats = {}
                    for event in limited_events:
                        riot_id = event['riot_id']
                        summoner_name = riot_id_to_name.get(riot_id, riot_id)
                        
                        if summoner_name not in member_stats:
                            member_stats[summoner_name] = []
                        
                        event_with_name = event.copy()
                        event_with_name['summoner_name'] = summoner_name
                        member_stats[summoner_name].append(event_with_name)
                    
                    # Flatten all events into a single array
                    all_events = []
                    for summoner_name, events_list in member_stats.items():
                        all_events.extend(events_list)
                    
                    # Create the final data structure
                    cache_data = {
                        "events": all_events,
                        "memberNames": riot_id_to_name,
                        "liveData": {},  # Empty for cached data
                        "cached_at": datetime.now(timezone.utc).isoformat()
                    }
                    
                    # Store in Redis with group_id as key
                    redis_key = f"member_stats_group_{group_id}"
                    redis_client.setex(
                        redis_key,
                        7200,  # 2 hours expiration (increased from 30 minutes)
                        json.dumps(cache_data)
                    )
                    
                    logger.warning(f"Successfully cached data for group {group_id}: {len(all_events)} events, {len(riot_id_to_name)} members")
                    
                except Exception as e:
                    logger.warning(f"Error processing group {group_id} for Redis cache: {str(e)}")
                    continue
            
            logger.warning("Redis cache population completed")
            
        except Exception as e:
            logger.warning(f"Error in Redis cache population: {str(e)}")
    
    # Call the Redis caching function
    try:
        add_data_to_redis_server()
        logger.warning("Redis cache population completed successfully")
    except Exception as e:
        logger.warning(f"Error during Redis cache population: {str(e)}")
        logger.warning("Continuing with normal processing completion...")
    
    
    # Only log Redis cache completion, not general processing stats

if __name__ == '__main__':
    main() 