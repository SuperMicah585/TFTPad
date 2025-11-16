from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import requests
import os
import time
import logging
import jwt
import json
import redis
from datetime import datetime, timedelta, timezone
from functools import wraps
from supabase import create_client, Client
import git
# Try to load dotenv if available, otherwise use system environment variables
#test hook next
try:
    from dotenv import load_dotenv
    # Load environment variables from backend.env file
    load_dotenv('backend.env')
except ImportError:
    # dotenv not available, use system environment variables
    pass

# Configure logging - only show Redis cache logs
logging.basicConfig(level=logging.WARNING)  # Set to WARNING to suppress INFO logs
logger = logging.getLogger(__name__)
# Create a custom filter for Redis cache logs
class RedisCacheFilter(logging.Filter):
    def filter(self, record):
        # Only allow logs that contain Redis cache-related messages
        redis_keywords = [
            'cache hit', 'cache miss', 'redis cache', 'cached data', 
            'cache cleared', 'cache population', 'redis connection',
            'member_stats_group_', 'successfully cached', 'failed to cache'
        ]
        message = record.getMessage().lower()
        return any(keyword in message for keyword in redis_keywords)

# Apply the filter to the logger
logger.addFilter(RedisCacheFilter())

app = Flask(__name__)

# CORS configuration
CORS_ORIGINS = [origin.strip() for origin in os.environ.get('CORS_ORIGINS', 'http://localhost:5173,https://tftpad.com').split(',')]
CORS(app, 
     origins=CORS_ORIGINS,
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True)

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required")
TFT_SET = os.environ.get('TFT_SET', 'TFTSET15')
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

# Riot Games API configuration
API_KEY = os.environ.get('RIOT_API_KEY')
if not API_KEY:
    raise ValueError("RIOT_API_KEY environment variable is required")
BASE_URL = "https://americas.api.riotgames.com/tft/match/v1/matches"
RIOT_ACCOUNT_URL = "https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id"
TFT_LEAGUE_URL = "https://na1.api.riotgames.com/tft/league/v1/by-puuid"

# JWT configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
if not JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is required")
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

def parse_datetime_safe(date_string):
    """Safely parse datetime string with timezone handling"""
    import datetime
    try:
        if 'Z' in date_string:
            return datetime.datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        else:
            return datetime.datetime.fromisoformat(date_string)
    except ValueError:
        # Try parsing as date only
        return datetime.datetime.strptime(date_string.split('T')[0], '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)

def rank_to_elo(rank_str):
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

def _calculate_elo(tier, rank, league_points):
    """
    Calculate ELO from tier, rank, and league points.
    This should match the rank_to_elo function exactly.
    """
    if not tier or tier == 'unranked':
        return 0
    
    tier = tier.lower()
    
    # Base ELO for each tier (matching rank_to_elo function)
    tier_base_elos = {
        'iron': 0,
        'bronze': 400,
        'silver': 800,
        'gold': 1200,
        'platinum': 1600,
        'emerald': 2000,
        'diamond': 2400,
        'master': 2800,
        'grandmaster': 2800,
        'challenger': 2800
    }
    
    base_elo = tier_base_elos.get(tier, 0)
    
    # Add division value and league points (matching rank_to_elo function)
    if tier in ['master', 'grandmaster', 'challenger']:
        return base_elo + league_points
    else:
        # Calculate division value (matching rank_to_elo function)
        division_value = 0
        if rank == 'IV':
            division_value = 0
        elif rank == 'III':
            division_value = 100
        elif rank == 'II':
            division_value = 200
        elif rank == 'I':
            division_value = 300
        
        return base_elo + division_value + league_points

def execute_supabase_query_with_retry(query_func, max_retries=3, delay=1):
    """
    Execute a Supabase query with retry logic for connection issues
    """
    for attempt in range(max_retries):
        try:
            result = query_func()
            return result
        except Exception as e:
            error_msg = str(e)
            logger.warning(f"Supabase query attempt {attempt + 1} failed: {error_msg}")
            
            # Check if it's a connection-related error
            if any(keyword in error_msg.lower() for keyword in ['connection', 'timeout', 'unavailable', 'network']):
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {delay} seconds...")
                    time.sleep(delay)
                    delay *= 2  # Exponential backoff
                    continue
                else:
                    logger.error(f"Max retries reached for Supabase query: {error_msg}")
                    raise Exception(f"Database connection failed after {max_retries} attempts: {error_msg}")
            else:
                # Non-connection error, don't retry
                raise e
    
    return None

def populate_rank_audit_events(riot_id, region):
    """
    Fetch rank audit events from MetaTFT API and populate the rank_audit_events table
    """
    try:
        # Get the riot account data to extract name and tag
        def get_riot_account():
            return supabase.table('riot_accounts').select('summoner_name').eq('riot_id', riot_id).execute()
        
        account_response = execute_supabase_query_with_retry(get_riot_account)
        
        if not account_response or not account_response.data:
            print(f"No riot account found for riot_id: {riot_id}")
            return
        
        summoner_name = account_response.data[0]['summoner_name']
        
        # Parse summoner_name to extract name and tag (format: "name#tag")
        if '#' not in summoner_name:
            print(f"Invalid summoner_name format: {summoner_name}")
            return
        
        name, tag = summoner_name.split('#', 1)
        
        # MetaTFT API expects uppercase region and camelCase TFT set
        metatft_region = region.upper()
        metatft_tft_set = "TFTSet15"  # Use camelCase instead of TFTSET15
        
        # Construct MetaTFT API URL
        metatft_url = f"https://api.metatft.com/public/profile/lookup_by_riotid/{metatft_region}/{name}/{tag}?source=full_profile&tft_set={metatft_tft_set}"
        
        print(f"Fetching rank audit events from MetaTFT: {metatft_url}")
        
        # Make request to MetaTFT API
        response = requests.get(metatft_url, timeout=30)
        
        if response.status_code != 200:
            print(f"MetaTFT API request failed with status {response.status_code}: {response.text}")
            return
        
        data = response.json()
        
        if not data or 'ranked_rating_changes' not in data:
            print(f"No ranked_rating_changes found in MetaTFT response")
            return
        
        ranked_rating_changes = data['ranked_rating_changes']
        
        if not ranked_rating_changes:
            print(f"Empty ranked_rating_changes array")
            return
        
        print(f"Found {len(ranked_rating_changes)} rank audit events")
        
        # Process events in reverse order to calculate cumulative wins/losses
        events_to_insert = []
        previous_rating = None
        cumulative_wins = 0
        cumulative_losses = 0
        
        for event in reversed(ranked_rating_changes):
            current_rating = event.get('rating_numeric', 0)
            created_timestamp = event.get('created_timestamp')
            
            # Determine if this was a win or loss and accumulate
            if previous_rating is not None:
                if current_rating > previous_rating:
                    cumulative_wins += 1
                else:
                    cumulative_losses += 1
            
            # Parse the timestamp
            try:
                if created_timestamp:
                    # Parse ISO timestamp
                    created_at = parse_datetime_safe(created_timestamp)
                else:
                    created_at = datetime.now(timezone.utc)
            except Exception as e:
                print(f"Error parsing timestamp {created_timestamp}: {e}")
                created_at = datetime.now(timezone.utc)
            
            # Prepare event data with cumulative totals
            event_data = {
                'elo': current_rating,
                'wins': cumulative_wins,
                'losses': cumulative_losses,
                'riot_id': riot_id,
                'created_at': created_at.isoformat()
            }
            
            events_to_insert.append(event_data)
            previous_rating = current_rating
        
        # Insert events into database
        if events_to_insert:
            def insert_events():
                return supabase.table('rank_audit_events').insert(events_to_insert).execute()
            
            insert_response = execute_supabase_query_with_retry(insert_events)
            
            if insert_response and insert_response.data:
                print(f"Successfully inserted {len(events_to_insert)} rank audit events for riot_id: {riot_id}")
            else:
                print(f"Failed to insert rank audit events for riot_id: {riot_id}")
        
    except Exception as e:
        print(f"Error populating rank audit events for riot_id {riot_id}: {str(e)}")
        import traceback
        traceback.print_exc()

# JWT utility functions
def create_jwt_token(user_id: int, riot_id: str) -> str:
    """Create a JWT token for user authentication"""
    payload = {
        'user_id': user_id,
        'riot_id': riot_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def create_auth_jwt_token(user_id: int) -> str:
    """Create a JWT token for user authentication (user_id only)"""
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    """Verify and decode a JWT token (legacy - expects both user_id and riot_id)"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception('Token has expired')
    except jwt.InvalidTokenError:
        raise Exception('Invalid token')

def verify_auth_jwt_token(token: str) -> dict:
    """Verify and decode a JWT token (user_id only)"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception('Token has expired')
    except jwt.InvalidTokenError:
        raise Exception('Invalid token')

def require_auth(f):
    """Decorator to require JWT authentication (legacy - requires both user_id and riot_id)"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        try:
            payload = verify_jwt_token(token)
            request.user_id = payload['user_id']
            request.riot_id = payload['riot_id']
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': str(e)}), 401
    
    return decorated_function

def require_user_auth(f):
    """Decorator to require JWT authentication (user_id only)"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            payload = verify_auth_jwt_token(token)
            request.user_id = payload['user_id']
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': str(e)}), 401
    
    return decorated_function

def require_supabase_auth(f):
    """Decorator to require Supabase JWT authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        try:
            # Verify the JWT token with Supabase
            user = supabase.auth.get_user(token)
            
            if not user.user:
                return jsonify({'error': 'Invalid token'}), 401
            
            # Get user ID from our users table
            def get_user_id():
                return supabase.table('users').select('id').eq('email', user.user.email).execute()
            
            user_response = execute_supabase_query_with_retry(get_user_id)
            
            if not user_response or not user_response.data:
                return jsonify({'error': 'User not found in database'}), 404
            
            request.user_id = user_response.data[0]['id']
            request.supabase_user = user.user
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': str(e)}), 401
    
    return decorated_function

@app.route('/api/study-groups', methods=['GET'])
def get_study_groups():
    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        search = request.args.get('search', '')
        meeting_days = request.args.get('meeting_days', '')
        min_elo = request.args.get('minEloFilter', type=int)
        max_elo = request.args.get('maxEloFilter', type=int)
        time_filter = request.args.get('time', '')
        timezone_filter = request.args.get('timezone', '')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # OPTIMIZED: Use a more efficient approach to reduce database queries
        # Instead of N+1 queries, we'll batch the data fetching
        
        # First, get all groups with basic filters
        query = supabase.table('study_group').select('*')
        
        # Apply filters
        if search:
            # For search, we'll search in group names and also check member names
            # First, get groups that match the group name search
            group_name_query = supabase.table('study_group').select('id').ilike('group_name', f'%{search}%').execute()
            group_ids_by_name = [group['id'] for group in group_name_query.data]
            
            # Now search for groups that have members with matching names
            # Get all riot accounts that match the search
            member_search_query = supabase.table('riot_accounts').select('riot_id').ilike('summoner_name', f'%{search}%').execute()
            matching_riot_ids = [account['riot_id'] for account in member_search_query.data]
            
            # Get groups that have these members
            group_ids_by_members = []
            if matching_riot_ids:
                member_groups_query = supabase.table('user_to_study_group').select('study_group_id').in_('riot_id', matching_riot_ids).execute()
                group_ids_by_members = [member['study_group_id'] for member in member_groups_query.data]
            
            # Combine both sets of group IDs
            all_matching_group_ids = list(set(group_ids_by_name + group_ids_by_members))
            
            if all_matching_group_ids:
                # Use a different approach - get all groups and filter in Python
                all_groups_query = supabase.table('study_group').select('*').execute()
                filtered_groups = [group for group in all_groups_query.data if group['id'] in all_matching_group_ids]
                
                # Apply other filters to the filtered groups
                if meeting_days and meeting_days.strip():
                    filtered_groups = [group for group in filtered_groups if meeting_days in (group.get('meeting_schedule') or [])]
                
                if time_filter:
                    filtered_groups = [group for group in filtered_groups if group.get('time') == time_filter]
                
                if timezone_filter and timezone_filter.strip() and timezone_filter != 'Any Timezone':
                    filtered_groups = [group for group in filtered_groups if group.get('timezone') == timezone_filter]
                
                # Apply sorting
                if sort_by == 'avg_elo':
                    sort_by = 'created_at'  # We'll handle ELO sorting later
                
                if sort_by in ['created_at', 'group_name', 'description', 'time', 'timezone']:
                    reverse = sort_order == 'desc'
                    filtered_groups.sort(key=lambda x: x.get(sort_by, ''), reverse=reverse)
                
                # Apply pagination
                start_idx = offset
                end_idx = offset + limit
                paginated_groups = filtered_groups[start_idx:end_idx]
                
                # Set response data to the paginated groups
                response_data = paginated_groups
                total_count = len(filtered_groups)
            else:
                # If no matches found, return empty result
                return jsonify({
                    'groups': [],
                    'pagination': {
                        'current_page': page,
                        'total_pages': 0,
                        'total_items': 0,
                        'items_per_page': limit,
                        'has_next': False,
                        'has_prev': False
                    }
                })
        else:
            # No search - use the original query approach
            if meeting_days and meeting_days.strip():
                query = query.contains('meeting_schedule', f'["{meeting_days}"]')
            
            if time_filter:
                query = query.eq('time', time_filter)
            
            if timezone_filter and timezone_filter.strip() and timezone_filter != 'Any Timezone':
                query = query.eq('timezone', timezone_filter)
            
            # Apply sorting (except for avg_elo which we'll handle after)
            if sort_by == 'avg_elo':
                sort_by = 'created_at'  # Default to created_at for database query
            
            if sort_by not in ['created_at', 'group_name', 'description', 'time', 'timezone']:
                sort_by = 'created_at'
            
            if sort_order == 'asc':
                query = query.order(sort_by, desc=False)
            else:
                query = query.order(sort_by, desc=True)
            
            # Apply pagination
            query = query.range(offset, offset + limit - 1)
            
            # Execute query
            response = query.execute()
            response_data = response.data
            total_count = None  # Will be calculated later
        
        # OPTIMIZATION: Batch fetch all member data and riot account data at once
        group_ids = [group['id'] for group in response_data]
        
        if group_ids:
            # Get all members for all groups in one query
            all_members_query = supabase.table('user_to_study_group').select('*').in_('study_group_id', group_ids).execute()
            
            # Get all riot IDs
            riot_ids = [member['riot_id'] for member in all_members_query.data if member.get('riot_id')]
            
            # Get all riot accounts for all members in one query
            all_riot_accounts_query = supabase.table('riot_accounts').select('riot_id, rank').in_('riot_id', riot_ids).execute() if riot_ids else None
            
            # Create lookup maps for faster access
            riot_accounts_map = {}
            if all_riot_accounts_query and all_riot_accounts_query.data:
                for account in all_riot_accounts_query.data:
                    riot_accounts_map[account['riot_id']] = account
            
            # Group members by study group
            members_by_group = {}
            for member in all_members_query.data:
                group_id = member['study_group_id']
                if group_id not in members_by_group:
                    members_by_group[group_id] = []
                members_by_group[group_id].append(member)
        
        # Calculate ELO for each group using the batched data
        groups_with_elo = []
        for group in response_data:
            group_id = group['id']
            members = members_by_group.get(group_id, [])
            
            total_elo = 0
            member_count = 0
            
            for member in members:
                riot_id = member.get('riot_id')
                riot_account = riot_accounts_map.get(riot_id)
                
                if riot_account:
                    rank = riot_account.get('rank', 'UNRANKED')
                    try:
                        elo = rank_to_elo(rank)
                        total_elo += elo
                        member_count += 1
                    except Exception as elo_error:
                        total_elo += 0
                        member_count += 1
                else:
                    member_count += 1
            
            # Calculate average ELO
            avg_elo = round(total_elo / member_count) if member_count > 0 else 0
            
            group_with_elo = {
                **group,
                'member_count': member_count,
                'total_elo': total_elo,
                'avg_elo': avg_elo
            }
            groups_with_elo.append(group_with_elo)
        
        # Apply ELO filtering after calculating ELO for all groups
        if min_elo is not None or max_elo is not None:
            filtered_groups = []
            for group in groups_with_elo:
                avg_elo = group.get('avg_elo', 0)
                if min_elo is not None and avg_elo < min_elo:
                    continue
                if max_elo is not None and avg_elo > max_elo:
                    continue
                filtered_groups.append(group)
            groups_with_elo = filtered_groups
        
        # Apply sorting after ELO calculation
        if request.args.get('sort_by') == 'avg_elo':
            reverse = sort_order == 'desc'
            groups_with_elo.sort(key=lambda x: x.get('avg_elo', 0), reverse=reverse)
        
        # OPTIMIZED: Calculate total count efficiently
        if min_elo is not None or max_elo is not None:
            # For ELO filtering, we need to get all groups and calculate their ELO
            # Use the same batched approach for efficiency
            all_groups_query = supabase.table('study_group').select('*')
            
            # Apply the same filters as the main query
            if search:
                all_groups_query = all_groups_query.ilike('group_name', f'%{search}%')
            if meeting_days and meeting_days.strip():
                all_groups_query = all_groups_query.contains('meeting_schedule', f'["{meeting_days}"]')
            if time_filter:
                all_groups_query = all_groups_query.eq('time', time_filter)
            if timezone_filter and timezone_filter.strip() and timezone_filter != 'Any Timezone':
                all_groups_query = all_groups_query.eq('timezone', timezone_filter)
            
            all_groups_response = all_groups_query.execute()
            
            # Use the same batched approach for ELO calculation
            all_group_ids = [group['id'] for group in all_groups_response.data]
            
            if all_group_ids:
                # Get all members for all groups in one query
                all_members_for_count = supabase.table('user_to_study_group').select('*').in_('study_group_id', all_group_ids).execute()
            
                # Get all riot IDs
                all_riot_ids = [member['riot_id'] for member in all_members_for_count.data if member.get('riot_id')]
                
                # Get all riot accounts for all members in one query
                all_riot_accounts_for_count = supabase.table('riot_accounts').select('riot_id, rank').in_('riot_id', all_riot_ids).execute() if all_riot_ids else None
                
                # Create lookup maps for faster access
                riot_accounts_map_for_count = {}
                if all_riot_accounts_for_count and all_riot_accounts_for_count.data:
                    for account in all_riot_accounts_for_count.data:
                        riot_accounts_map_for_count[account['riot_id']] = account
                
                # Group members by study group
                members_by_group_for_count = {}
                for member in all_members_for_count.data:
                    group_id = member['study_group_id']
                    if group_id not in members_by_group_for_count:
                        members_by_group_for_count[group_id] = []
                    members_by_group_for_count[group_id].append(member)
                
                # Calculate total count by checking ELO for each group
                total_count = 0
                for group in all_groups_response.data:
                    group_id = group['id']
                    members = members_by_group_for_count.get(group_id, [])
                    
                    total_elo = 0
                    member_count = 0
                    
                    for member in members:
                        riot_id = member.get('riot_id')
                        riot_account = riot_accounts_map_for_count.get(riot_id)
                        
                        if riot_account:
                            rank = riot_account.get('rank', 'UNRANKED')
                            try:
                                elo = rank_to_elo(rank)
                                total_elo += elo
                                member_count += 1
                            except Exception as elo_error:
                                total_elo += 0
                                member_count += 1
                        else:
                            member_count += 1
                    
                    avg_elo = round(total_elo / member_count) if member_count > 0 else 0
                    
                    # Check if this group meets ELO criteria
                    if min_elo is not None and avg_elo < min_elo:
                        continue
                    if max_elo is not None and avg_elo > max_elo:
                        continue
                    total_count += 1
        else:
            # For non-ELO filtering, use a simple count query
            if search:
                # For search case, total_count is already calculated above
                pass
            else:
                count_query = supabase.table('study_group').select('*', count='exact')
                if meeting_days and meeting_days.strip():
                    count_query = count_query.contains('meeting_schedule', f'["{meeting_days}"]')
                if time_filter:
                    count_query = count_query.eq('time', time_filter)
                if timezone_filter and timezone_filter.strip() and timezone_filter != 'Any Timezone':
                    count_query = count_query.eq('timezone', timezone_filter)
                
                count_response = count_query.execute()
                total_count = count_response.count if hasattr(count_response, 'count') else len(count_response.data)
        
        total_pages = (total_count + limit - 1) // limit
        
        return jsonify({
            'groups': groups_with_elo,
            'pagination': {
                'current_page': page,
                'total_pages': total_pages,
                'total_items': total_count,
                'items_per_page': limit,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        })
    except Exception as e:
        import traceback
        return jsonify({'error': str(e)}), 500

@app.route('/api/study-groups/<int:group_id>', methods=['GET'])
def get_study_group(group_id):
    try:
        response = supabase.table('study_group').select('*').eq('id', group_id).single().execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        response = supabase.table('users').select('id, created_at').execute()
        return jsonify({'users': response.data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user-to-study-group', methods=['GET'])
def get_user_study_groups():
    try:
        # Get all user-study-group relationships
        result = supabase.table('user_to_study_group').select('*').execute()
        
        return jsonify({
            'user_study_groups': result.data
        })
    except Exception as e:
        return jsonify({'error': 'Failed to fetch user study groups'}), 500

@app.route('/api/study-groups', methods=['POST'])
def create_study_group():
    try:
        data = request.get_json()
        print(f"Received data for study group creation: {data}")
        
        user_id = data.get('user_id')
        group_name = data.get('group_name')
        description = data.get('description', '')
        image_url = data.get('image_url', '')
        
        print(f"Parsed data - user_id: {user_id} (type: {type(user_id)}), group_name: {group_name}, description: {description}, image_url: {image_url}")
        
        # Convert user_id to integer if it's a string
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
                print(f"Converted user_id to integer: {user_id}")
            except ValueError:
                print(f"Failed to convert user_id '{user_id}' to integer")
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        if not group_name:
            return jsonify({'error': 'Group name is required'}), 400
        
        # Create the study group
        now = datetime.now(timezone.utc).isoformat()
        
        study_group_data = {
            'group_name': group_name,
            'description': description,
            'image_url': image_url,
            'owner': user_id,
            'created_at': now
        }
        
        print(f"Study group data to insert: {study_group_data}")
        
        # Insert the study group
        group_response = supabase.table('study_group').insert(study_group_data).execute()
        
        print(f"Group insert response: {group_response}")
        
        if not group_response.data:
            print(f"Group insert failed: {group_response.error}")
            return jsonify({'error': 'Failed to create study group'}), 500
        
        new_group = group_response.data[0]
        group_id = new_group['id']
        
        print(f"Created group with ID: {group_id}")
        
        # Don't add the creator to user_to_study_group since they're already the owner
        # The owner is tracked in the study_group table, not in user_to_study_group
        
        print("Study group created successfully")
        
        return jsonify({
            'message': 'Study group created successfully',
            'group': new_group
        }), 201
        
    except Exception as e:
        print(f"Exception in create_study_group: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to create study group: {str(e)}'}), 500

@app.route('/api/study-groups/<int:group_id>', methods=['PUT'])
def update_study_group(group_id):
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Prepare update data
        update_data = {}
        
        if 'group_name' in data:
            update_data['group_name'] = data['group_name']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'image_url' in data:
            update_data['image_url'] = data['image_url']
        
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        # Update the study group
        result = supabase.table('study_group').update(update_data).eq('id', group_id).execute()
        
        if not result.data:
            return jsonify({'error': 'Study group not found'}), 404
        
        return jsonify({
            'message': 'Study group updated successfully',
            'group': result.data[0]
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to update study group', 'details': str(e)}), 500

@app.route('/api/study-groups/<int:group_id>/update-image', methods=['PUT'])
def update_study_group_image(group_id):
    try:
        data = request.get_json()
        image_url = data.get('image_url')
        
        if not image_url:
            return jsonify({'error': 'Image URL is required'}), 400
        
        # Update the study group with the image URL
        result = supabase.table('study_group').update({
            'image_url': image_url
        }).eq('id', group_id).execute()
        
        if not result.data:
            return jsonify({'error': 'Study group not found'}), 404
        
        return jsonify({
            'message': 'Study group image updated successfully',
            'group': result.data[0]
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to update study group image', 'details': str(e)}), 500

@app.route('/api/migrate/add-image-url-column', methods=['POST'])
def add_image_url_column():
    """Temporary endpoint to add image_url column to study_group table"""
    try:
        # Execute SQL to add the column
        result = supabase.rpc('exec_sql', {
            'sql': 'ALTER TABLE study_group ADD COLUMN IF NOT EXISTS image_url TEXT;'
        }).execute()
        
        return jsonify({
            'message': 'image_url column added successfully',
            'result': result.data
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to add image_url column', 'details': str(e)}), 500

# Captain functionality removed - this endpoint is no longer needed

@app.route('/api/study-groups/<int:group_id>/add-member', methods=['POST'])
def add_member_to_study_group(group_id):
    try:
        data = request.get_json()
        user_summoner_name = data.get('user_summoner_name')
        added_by_user_id = data.get('added_by_user_id')
        
        if not user_summoner_name:
            return jsonify({'error': 'User summoner name is required'}), 400
        
        # For now, skip the authorization check since we can't link users to riot accounts
        # TODO: Implement proper authorization when user-riot relationship is established
        
        # Get the riot_id for the person being added by looking up their riot account
        def get_riot_id_by_summoner():
            riot_result = supabase.table('riot_accounts').select('riot_id').eq('summoner_name', user_summoner_name).execute()
            
            if not riot_result.data:
                return None
            
            return riot_result.data[0]['riot_id']
        
        target_riot_id = execute_supabase_query_with_retry(get_riot_id_by_summoner)
        
        if not target_riot_id:
            logger.error(f"Target user not found for summoner_name: {user_summoner_name}")
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user is already a member of this group
        def check_existing_membership():
            existing_check = supabase.table('user_to_study_group').select('riot_id').eq('study_group_id', group_id).eq('riot_id', target_riot_id).execute()
            
            return existing_check.data and len(existing_check.data) > 0
        
        is_already_member = execute_supabase_query_with_retry(check_existing_membership)
        
        if is_already_member:
            return jsonify({'error': 'User is already a member of this study group'}), 409
        
        # Add the user to the study group
        def add_user_to_group():
            now = datetime.now(timezone.utc).isoformat()
            
            user_to_group_data = {
                'riot_id': target_riot_id,
                'study_group_id': group_id,
                'created_at': now
            }
            
            result = supabase.table('user_to_study_group').insert(user_to_group_data).execute()
            return result
        
        result = execute_supabase_query_with_retry(add_user_to_group)
        
        if not result or not result.data:
            logger.error(f"Failed to insert user {target_riot_id} into study group {group_id}")
            return jsonify({'error': 'Failed to add user to study group'}), 500
        
        return jsonify({
            'message': 'User added to study group successfully',
            'added_riot_id': target_riot_id,
            'study_group_id': group_id
        })
        
    except Exception as e:
        logger.error(f"Error adding member to study group {group_id}: {str(e)}")
        return jsonify({'error': f'Failed to add user to study group: {str(e)}'}), 500

@app.route('/api/study-groups/<int:group_id>/remove-member', methods=['POST'])
def remove_member_from_study_group(group_id):
    try:
        data = request.get_json()
        summoner_name = data.get('summoner_name')
        
        if not summoner_name:
            return jsonify({'error': 'Summoner name is required'}), 400
        
        # Get the riot_id for the user being removed
        def get_riot_id_by_summoner():
            riot_result = supabase.table('riot_accounts').select('riot_id').eq('summoner_name', summoner_name).execute()
            
            if not riot_result.data:
                return None
            
            return riot_result.data[0]['riot_id']
        
        target_riot_id = execute_supabase_query_with_retry(get_riot_id_by_summoner)
        
        if not target_riot_id:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user is a member of the group
        def check_membership():
            result = supabase.table('user_to_study_group').select('riot_id').eq('study_group_id', group_id).eq('riot_id', target_riot_id).execute()
            
            if not result.data:
                return None
            
            return result.data[0]['riot_id']
        
        membership = execute_supabase_query_with_retry(check_membership)
        
        if membership is None:
            return jsonify({'error': 'User is not a member of this study group'}), 404
        
        # Remove user from the group
        def remove_user():
            return supabase.table('user_to_study_group').delete().eq('study_group_id', group_id).eq('riot_id', target_riot_id).execute()
        
        result = execute_supabase_query_with_retry(remove_user)
        
        if not result or not result.data:
            return jsonify({'error': 'Failed to remove member from study group'}), 500
        
        return jsonify({
            'message': 'Member removed from study group successfully'
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to remove member from study group'}), 500

@app.route('/api/study-groups/<int:group_id>', methods=['DELETE'])
def delete_study_group(group_id):
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        # Verify that the user is the owner of this group
        def verify_owner():
            # Check if this user is the owner of the group
            owner_check = supabase.table('study_group').select('owner').eq('id', group_id).execute()
            
            if not owner_check.data:
                return None
            
            return owner_check.data[0]['owner']
        
        group_owner = execute_supabase_query_with_retry(verify_owner)
        
        if not group_owner:
            return jsonify({'error': 'Study group not found'}), 404
        
        if str(group_owner) != str(user_id):
            return jsonify({'error': 'Unauthorized: Only group owners can delete the study group'}), 403
        
        # Delete all related data in the correct order to maintain referential integrity
        try:
            # 1. Delete all user-to-study-group relationships for this group
            supabase.table('user_to_study_group').delete().eq('study_group_id', group_id).execute()
            
            # 2. Delete the study group itself
            group_result = supabase.table('study_group').delete().eq('id', group_id).execute()
            
            if not group_result or not group_result.data:
                return jsonify({'error': 'Failed to delete study group'}), 500
                
        except Exception as e:
            return jsonify({'error': f'Failed to delete study group: {str(e)}'}), 500
        
        return jsonify({
            'message': 'Study group deleted successfully',
            'deleted_group_id': group_id
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to delete study group'}), 500

@app.route('/api/study-groups/<int:group_id>/leave', methods=['POST'])
def leave_study_group(group_id):
    try:
        data = request.get_json()
        riot_id = data.get('riot_id')
        
        if not riot_id:
            return jsonify({'error': 'Riot ID is required'}), 400
        
        # Verify that the riot user exists
        def verify_riot_user():
            riot_result = supabase.table('riot_accounts').select('riot_id').eq('riot_id', riot_id).execute()
            
            if not riot_result.data:
                return None
            
            return riot_result.data[0]['riot_id']
        
        user_riot_id = execute_supabase_query_with_retry(verify_riot_user)
        
        if not user_riot_id:
            return jsonify({'error': 'Riot user not found'}), 404
        
        # Check if user is a member of the group
        def check_membership():
            result = supabase.table('user_to_study_group').select('riot_id').eq('study_group_id', group_id).eq('riot_id', user_riot_id).execute()
            
            if not result.data:
                return None
            
            return result.data[0]['riot_id']
        
        membership = execute_supabase_query_with_retry(check_membership)
        
        if membership is None:
            return jsonify({'error': 'User is not a member of this study group'}), 404
        
        # Remove user from the group
        def remove_user():
            return supabase.table('user_to_study_group').delete().eq('study_group_id', group_id).eq('riot_id', user_riot_id).execute()
        
        result = execute_supabase_query_with_retry(remove_user)
        
        if not result or not result.data:
            return jsonify({'error': 'Failed to leave study group'}), 500
        
        return jsonify({
            'message': 'Successfully left study group'
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to leave study group'}), 500

@app.route('/api/users/<int:user_id>/study-groups', methods=['GET'])
def get_user_study_groups_by_user(user_id):
    try:
        logger.info(f"Fetching study groups for user {user_id}")
        
        # Get the riot_id for the user first
        def get_riot_id_by_user_id():
            riot_result = supabase.table('riot_accounts').select('riot_id').eq('user_id', user_id).execute()
            
            if not riot_result.data:
                return None
            
            return riot_result.data[0]['riot_id']
        
        user_riot_id = execute_supabase_query_with_retry(get_riot_id_by_user_id)
        
        if not user_riot_id:
            logger.warning(f"No riot account found for user {user_id}")
            return jsonify({'user_study_groups': []})
        
        # OPTIMIZATION: Get user's study groups with member data in a single query
        def query_func():
            return supabase.table('user_to_study_group').select('*, study_group(*)').eq('riot_id', user_riot_id).execute()
        
        response = execute_supabase_query_with_retry(query_func)
        
        if not response or not response.data:
            logger.warning(f"No data returned for user {user_id} study groups")
            return jsonify({'user_study_groups': []})
        
        # Get all group IDs that the user is a member of
        group_ids = [item['study_group']['id'] for item in response.data if item.get('study_group')]
        
        if not group_ids:
            logger.info(f"Successfully fetched {len(response.data)} study groups for user {user_id}")
            return jsonify({'user_study_groups': response.data})
        
        # OPTIMIZATION: Get all members for all groups in one query
        all_members_query = supabase.table('user_to_study_group').select('*, riot_accounts(user_id, rank, summoner_name, icon_id, riot_id, region)').in_('study_group_id', group_ids).execute()
        
        # Get all riot IDs from all groups
        all_riot_ids = []
        if all_members_query and all_members_query.data:
            all_riot_ids = [member['riot_id'] for member in all_members_query.data if member.get('riot_id')]
        
        # Create lookup map for riot accounts
        riot_accounts_map = {}
        if all_members_query and all_members_query.data:
            for member in all_members_query.data:
                if member.get('riot_accounts'):
                    riot_accounts_map[member['riot_id']] = member['riot_accounts']
        
        # Group members by study group
        members_by_group = {}
        if all_members_query and all_members_query.data:
            for member in all_members_query.data:
                group_id = member['study_group_id']
                if group_id not in members_by_group:
                    members_by_group[group_id] = []
                members_by_group[group_id].append(member)
        
        # Enhance the response with member data
        enhanced_response = []
        for item in response.data:
            if not item.get('study_group'):
                continue
                
            group = item['study_group']
            group_id = group['id']
            
            # Get members for this group
            group_members = members_by_group.get(group_id, [])
            
            # Transform members with ELO data
            members_with_elo = []
            for member in group_members:
                elo = 0
                rank = 'UNRANKED'
                summoner_name = 'Unknown User'
                icon_id = None
                
                if member.get('riot_accounts'):
                    riot_account = member['riot_accounts']
                    rank = riot_account.get('rank', 'UNRANKED')
                    summoner_name = riot_account.get('summoner_name', 'Unknown User')
                    icon_id = riot_account.get('icon_id')
                    elo = rank_to_elo(rank)
                
                member_with_elo = {
                    **member,
                    'elo': elo,
                    'rank': rank,
                    'summoner_name': summoner_name,
                    'icon_id': icon_id
                }
                members_with_elo.append(member_with_elo)
            
            # Add member data to the response
            enhanced_item = {
                **item,
                'members': members_with_elo
            }
            enhanced_response.append(enhanced_item)
        
        logger.info(f"Successfully fetched {len(enhanced_response)} study groups with member data for user {user_id}")
        return jsonify({'user_study_groups': enhanced_response})
            
    except Exception as e:
        logger.error(f"Error fetching study groups for user {user_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch user study groups', 'details': str(e)}), 500

@app.route('/api/study-groups/<int:group_id>/users', methods=['GET'])
def get_study_group_users(group_id):
    # Check if rank updates are requested (default to True for backward compatibility)
    update_ranks = request.args.get('update_ranks', 'true').lower() == 'true'
    logger.info(f"Fetching users for group {group_id} with rank updates: {update_ranks}")
    try:
        
        def get_members():
            return supabase.table('user_to_study_group').select('*').eq('study_group_id', group_id).execute()
        
        # Get members from user_to_study_group table
        response = execute_supabase_query_with_retry(get_members)
        
        if not response or not response.data:
            return jsonify({'study_group_users': []})
        
        # Get all riot_ids from the members
        riot_ids = [member['riot_id'] for member in response.data if member.get('riot_id')]
        
        # Get riot account data for all members
        riot_accounts_map = {}
        if riot_ids:
            def get_riot_accounts():
                return supabase.table('riot_accounts').select('rank, summoner_name, icon_id, riot_id, region').in_('riot_id', riot_ids).execute()
            
            riot_response = execute_supabase_query_with_retry(get_riot_accounts)
            if riot_response and riot_response.data:
                for account in riot_response.data:
                    riot_accounts_map[account['riot_id']] = account
        
        # OPTIMIZATION: Batch update ranks if requested (simplified version)
        if update_ranks:
            # Update ranks sequentially but with optimized database queries
            for member in response.data:
                riot_id = member.get('riot_id')
                riot_account = riot_accounts_map.get(riot_id)
                if riot_account and riot_account.get('riot_id') and riot_account.get('region'):
                    try:
                        puuid = riot_account['riot_id']
                        region = riot_account['region']
                        current_rank = riot_account.get('rank', 'UNRANKED')
                        
                        logger.info(f"Updating rank for riot_id {riot_id} (puuid: {puuid}, region: {region})")
                        
                        # Use the region directly from the user's account
                        league_url = f"https://{region}.api.riotgames.com/tft/league/v1/by-puuid/{puuid}"
                        headers = {'X-Riot-Token': API_KEY}
                        league_response = requests.get(league_url, headers=headers, timeout=10)
                        
                        if league_response.status_code == 200:
                            league_data = league_response.json()
                            
                            # Find ranked TFT data
                            new_rank = None
                            for entry in league_data:
                                if entry.get('queueType') == 'RANKED_TFT':
                                    tier = entry.get('tier', 'UNRANKED')
                                    rank_division = entry.get('rank', '')
                                    league_points = entry.get('leaguePoints', 0)
                                    if tier != 'UNRANKED':
                                        new_rank = f"{tier} {rank_division} {league_points}LP"
                                    else:
                                        new_rank = 'UNRANKED'
                                    break
                            
                            # If no ranked TFT found, check for turbo TFT
                            if not new_rank:
                                for entry in league_data:
                                    if entry.get('queueType') == 'RANKED_TFT_TURBO':
                                        rated_tier = entry.get('ratedTier', 'UNRANKED')
                                        if rated_tier != 'UNRANKED':
                                            new_rank = f"TURBO {rated_tier}"
                                        else:
                                            new_rank = 'UNRANKED'
                                        break
                            
                            if not new_rank:
                                new_rank = 'UNRANKED'
                            
                            # Update the rank in our map
                            if new_rank != current_rank:
                                current_time = datetime.now(timezone.utc).isoformat()
                                update_data = {
                                    'date_updated': current_time,
                                    'rank': new_rank
                                }
                                
                                def update_riot_account():
                                    return supabase.table('riot_accounts').update(update_data).eq('riot_id', riot_id).execute()
                                
                                update_response = execute_supabase_query_with_retry(update_riot_account)
                                if update_response and update_response.data:
                                    logger.info(f"Successfully updated rank for riot_id {riot_id} to '{new_rank}'")
                                    # Update our local map
                                    if riot_id in riot_accounts_map:
                                        riot_accounts_map[riot_id]['rank'] = new_rank
                                else:
                                    logger.error(f"Failed to update rank for riot_id {riot_id}")
                            else:
                                # Just update timestamp
                                current_time = datetime.now(timezone.utc).isoformat()
                                update_data = {'date_updated': current_time}
                                
                                def update_riot_account():
                                    return supabase.table('riot_accounts').update(update_data).eq('riot_id', riot_id).execute()
                                
                                execute_supabase_query_with_retry(update_riot_account)
                                
                        else:
                            logger.error(f"Failed to fetch league data for user {user_id}: {league_response.status_code}")
                            
                    except Exception as update_error:
                        logger.error(f"Error updating rank for user {user_id}: {str(update_error)}")
                        continue
        
        # Build response using the optimized data
        users_with_elo = []
        for member in response.data:
            elo = 0
            rank = 'UNRANKED'
            summoner_name = 'Unknown User'
            icon_id = None
            
            riot_id = member.get('riot_id')
            riot_account = riot_accounts_map.get(riot_id)
            
            if riot_account:
                rank = riot_account.get('rank', 'UNRANKED')
                summoner_name = riot_account.get('summoner_name', 'Unknown User')
                icon_id = riot_account.get('icon_id')
                elo = rank_to_elo(rank)
            else:
                logger.info(f"No riot account found for riot_id {riot_id}")
            
            member_with_elo = {
                **member,
                'elo': elo,
                'rank': rank,
                'summoner_name': summoner_name,
                'icon_id': icon_id
            }
            users_with_elo.append(member_with_elo)
        
        return jsonify({'study_group_users': users_with_elo})
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/api/match/<match_id>', methods=['GET'])
def get_match_data(match_id):
    try:
        url = f"{BASE_URL}/{match_id}"
        headers = {'X-Riot-Token': API_KEY}
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'error': f'API request failed with status code {response.status_code}', 'message': response.text}), response.status_code
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Network error occurred', 'message': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'An unexpected error occurred', 'message': str(e)}), 500

@app.route('/api/match-history/<puuid>', methods=['GET'])
def get_match_history(puuid):
    try:
        region = request.args.get('region', 'americas')
        
        # Map server regions to routing regions for Riot API
        # Server regions: na1, br1, la1, la2, kr1, jp1, euw1, eun1, tr1, ru1, oc1, ph2, sg2, th2, tw2, vn2
        # Routing regions: americas, asia, europe, sea
        server_to_routing_mapping = {
            # Americas
            'na1': 'americas', 'br1': 'americas', 'la1': 'americas', 'la2': 'americas',
            # Asia
            'kr1': 'asia', 'jp1': 'asia',
            # Europe
            'euw1': 'europe', 'eun1': 'europe', 'tr1': 'europe', 'ru1': 'europe',
            # SEA
            'oc1': 'sea', 'sg2': 'sea', 'tw2': 'sea', 'vn2': 'sea',
            # Keep routing regions as-is for backward compatibility
            'americas': 'americas', 'asia': 'asia', 'europe': 'europe', 'sea': 'sea'
        }
        
        print(f"Received region: {region}, mapped to: {server_to_routing_mapping.get(region, 'americas')}")
        match_region = server_to_routing_mapping.get(region, 'americas')
        
        # Get match IDs from Riot API
        match_ids_url = f"https://{match_region}.api.riotgames.com/tft/match/v1/matches/by-puuid/{puuid}/ids"
        headers = {'X-Riot-Token': API_KEY}
        
        # Get the last 20 matches
        params = {'count': 20}
        response = requests.get(match_ids_url, headers=headers, params=params)
        
        if response.status_code != 200:
            return jsonify({'error': f'Failed to fetch match IDs: {response.status_code}'}), response.status_code
        
        match_ids = response.json()
        
        if not match_ids:
            return jsonify({'matches': []})
        
        # Get detailed match data for each match ID using parallel requests
        def fetch_match_data(match_id):
            try:
                match_url = f"https://{match_region}.api.riotgames.com/tft/match/v1/matches/{match_id}"
                match_response = requests.get(match_url, headers=headers)
                
                if match_response.status_code == 200:
                    match_data = match_response.json()
                    
                    # Find the player's data in the match
                    player_data = None
                    for participant in match_data['info']['participants']:
                        if participant['puuid'] == puuid:
                            player_data = participant
                            break
                    
                    if player_data:
                        # Extract champions and their items
                        champions = []
                        for unit in player_data['units']:
                            champion_name = unit['character_id'].replace('TFT15_', '')
                            star_level = unit['tier'] if unit['tier'] <= 4 else 4
                            
                            champions.append({
                                'name': champion_name,
                                'stars': star_level,
                                'items': unit.get('itemNames', [])
                            })
                        
                        # Extract traits
                        traits = []
                        for trait in player_data['traits']:
                            if trait['tier_current'] > 0:  # Only include active traits
                                traits.append({
                                    'name': trait['name'],
                                    'num_units': trait['num_units'],
                                    'tier_current': trait['tier_current'],
                                    'tier_total': trait['tier_total']
                                })
                        
                        return {
                            'matchId': match_id,
                            'gameCreation': match_data['info']['gameCreation'],
                            'gameLength': match_data['info']['game_length'],
                            'placement': player_data['placement'],
                            'playerName': player_data['riotIdGameName'],
                            'champions': champions,
                            'traits': traits
                        }
                
                return None
                
            except Exception as e:
                return None

        # Use concurrent.futures to parallelize the requests
        import concurrent.futures
        
        matches = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            # Submit all match data requests
            future_to_match_id = {executor.submit(fetch_match_data, match_id): match_id for match_id in match_ids}
            
            # Collect results as they complete
            for future in concurrent.futures.as_completed(future_to_match_id):
                match_data = future.result()
                if match_data:
                    matches.append(match_data)
        
        # Sort matches by game creation time (newest first)
        matches.sort(key=lambda x: x['gameCreation'], reverse=True)
        
        return jsonify({'matches': matches})
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Network error occurred', 'message': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'An unexpected error occurred', 'message': str(e)}), 500

@app.route('/api/riot-account', methods=['POST'])
def connect_riot_account():
    try:
        data = request.get_json()
        game_name = data.get('gameName')
        tag_line = data.get('tagLine')
        region = data.get('region', 'americas')  # Default to americas
        
        if not game_name or not tag_line:
            return jsonify({'error': 'gameName and tagLine are required'}, 400)
        
        # Use region-specific API endpoint
        if region == 'asia':
            riot_account_url = f"https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id"
        elif region == 'europe':
            riot_account_url = f"https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id"
        else:  # americas (default)
            riot_account_url = f"https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id"
        
        # Call Riot API to get account data
        
        url = f"{riot_account_url}/{game_name}/{tag_line}"
 
        headers = {'X-Riot-Token': API_KEY}
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            riot_data = response.json()
            puuid = riot_data.get('puuid')
            riot_id = riot_data.get('gameName') + '#' + riot_data.get('tagLine')
            
            print(f"Riot API response: {riot_data}")
            print(f"PUUID: {puuid}")
            print(f"Riot ID: {riot_id}")
            
            # Get user's region from Riot API
            region_url = f"https://{region}.api.riotgames.com/riot/account/v1/region/by-game/tft/by-puuid/{puuid}"
            region_response = requests.get(region_url, headers=headers)
            if region_response.status_code == 200:
                region_data = region_response.json()
                user_region = region_data.get('region', region)  # Use selected region as fallback
                print(f"User region from API: {user_region}")
            else:
                user_region = region  # Use the region the user selected from dropdown
                print(f"Using selected region as fallback: {user_region}")
            
            # Fetch TFT league data to get rank
            rank = None
            try:
                # Use the region directly from the user's account (no mapping needed for TFT league API)
                league_url = f"https://{user_region}.api.riotgames.com/tft/league/v1/by-puuid/{puuid}"
                league_response = requests.get(league_url, headers=headers)
                if league_response.status_code == 200:
                    league_data = league_response.json()
                    # Find ranked TFT data
                    for entry in league_data:
                        if entry.get('queueType') == 'RANKED_TFT':
                            tier = entry.get('tier', 'UNRANKED')
                            rank_division = entry.get('rank', '')
                            league_points = entry.get('leaguePoints', 0)
                            if tier != 'UNRANKED':
                                rank = f"{tier} {rank_division} {league_points}LP"
                            else:
                                rank = 'UNRANKED'
                            break
                    # If no ranked TFT found, check for turbo TFT
                    if not rank:
                        for entry in league_data:
                            if entry.get('queueType') == 'RANKED_TFT_TURBO':
                                rated_tier = entry.get('ratedTier', 'UNRANKED')
                                if rated_tier != 'UNRANKED':
                                    rank = f"TURBO {rated_tier}"
                                else:
                                    rank = 'UNRANKED'
                                break
            except Exception as e:
                print(f"Error fetching rank data: {e}")
                rank = None
            
            # Fetch summoner data to get profile icon
            icon_id = None
            try:
                summoner_url = f"https://{user_region}.api.riotgames.com/tft/summoner/v1/summoners/by-puuid/{puuid}"
                summoner_response = requests.get(summoner_url, headers=headers)
                if summoner_response.status_code == 200:
                    summoner_data = summoner_response.json()
                    icon_id = summoner_data.get('profileIconId')
                    print(f"Profile icon ID: {icon_id}")
                else:
                    print(f"Failed to fetch summoner data: {summoner_response.status_code}")
            except Exception as e:
                print(f"Error fetching summoner data: {e}")
                icon_id = None
            
            # Check if Riot account already exists by puuid
            try:
                existing_account = supabase.table('riot_accounts').select('*').eq('riot_id', puuid).execute()
                print(f"Existing account query result: {len(existing_account.data) if existing_account.data else 0}")
            except Exception as e:
                print(f"Error checking existing account: {e}")
                return jsonify({
                    'error': 'Database error occurred',
                    'message': 'Failed to check if account exists'
                }), 500
            riot_account_data = {
                'riot_id': puuid,  # Use puuid as the primary identifier
                'summoner_name': riot_data.get('gameName') + '#' + riot_data.get('tagLine'),
                'region': user_region,  # Store the user's region
                'rank': rank,  # Store the rank
                'icon_id': icon_id  # Store the profile icon ID
            }
            
            print(f"Account data to insert: {riot_account_data}")
            
            if existing_account.data and len(existing_account.data) > 0:
                # Return error if account already exists
                print(f"Account already exists: {existing_account.data[0]}")
                return jsonify({
                    'error': 'Riot account already exists',
                    'message': 'This Riot account is already connected to another user'
                }), 409
            else:
                # Insert new account
                try:
                    db_response = supabase.table('riot_accounts').insert(riot_account_data).execute()
                    print(f"Successfully inserted account: {riot_account_data}")
                    
                    # After successful account creation, fetch and populate rank audit events
                    try:
                        populate_rank_audit_events(puuid, user_region)
                    except Exception as audit_error:
                        print(f"Warning: Failed to populate rank audit events: {audit_error}")
                        # Don't fail the account creation if audit events fail
                    
                    return jsonify({
                        'success': True,
                        'message': 'Riot account connected successfully',
                        'data': {
                            'puuid': puuid,
                            'riot_id': riot_id,
                            'game_name': riot_data.get('gameName'),
                            'tag_line': riot_data.get('tagLine')
                        }
                    })
                except Exception as e:
                    print(f"Error inserting account: {e}")
                    return jsonify({
                        'error': 'Database error occurred',
                        'message': 'Failed to add account to database'
                    }), 500
        else:
            return jsonify({
                'error': f'Riot API request failed with status code {response.status_code}',
                'message': response.text
            }), response.status_code
            
    except requests.exceptions.RequestException as e:
        print(f"Request exception in connect_riot_account: {e}")
        return jsonify({'error': 'Network error occurred', 'message': str(e)}), 500
    except Exception as e:
        print(f"Unexpected exception in connect_riot_account: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred', 'message': str(e)}), 500



@app.route('/api/auth/riot-login', methods=['POST'])
def riot_login():
    """Authenticate user with Riot account and return JWT token"""
    try:
        data = request.get_json()
        game_name = data.get('gameName')
        tag_line = data.get('tagLine')
        region = data.get('region', 'americas')
        
        if not game_name or not tag_line:
            return jsonify({'error': 'gameName and tagLine are required'}), 400
        
        # Use region-specific API endpoint
        # Call actual Riot API to get account data
        if region == 'asia':
            riot_account_url = f"https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id"
        elif region == 'europe':
            riot_account_url = f"https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id"
        else:  # americas (default)
            riot_account_url = f"https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id"
        
        # Call Riot API to get account data
        url = f"{riot_account_url}/{game_name}/{tag_line}"
        headers = {'X-Riot-Token': API_KEY}
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            return jsonify({'error': 'Invalid Riot ID or region'}), 400
        
        riot_data = response.json()
        puuid = riot_data.get('puuid')
        riot_id = f"{riot_data.get('gameName')}#{riot_data.get('tagLine')}"
        
        # Get user's region from Riot API
        region_url = f"https://{region}.api.riotgames.com/riot/account/v1/region/by-game/tft/by-puuid/{puuid}"
        region_response = requests.get(region_url, headers=headers)
        
        if region_response.status_code == 200:
            region_data = region_response.json()
            user_region = region_data.get('region', region)  # Use selected region as fallback
        else:
            user_region = region  # Use the region the user selected from dropdown
        
        # Check if user exists by riot_id
        def check_user_exists():
            return supabase.table('users').select('id, email, created_at').eq('id', puuid).execute()
        
        user_response = execute_supabase_query_with_retry(check_user_exists)
        
        if user_response and user_response.data and len(user_response.data) > 0:
            # User exists, update their riot account info and return token
            user = user_response.data[0]
            user_id = user['id']
            
            # Update riot account info
            riot_account_data = {
                'user_id': user_id,
                'riot_id': puuid,
                'summoner_name': riot_id,
                'region': user_region
            }
            
            # Check if riot account exists
            def check_riot_account():
                return supabase.table('riot_accounts').select('*').eq('user_id', user_id).execute()
            
            riot_account_response = execute_supabase_query_with_retry(check_riot_account)
            
            if riot_account_response and riot_account_response.data and len(riot_account_response.data) > 0:
                # Update existing riot account
                execute_supabase_query_with_retry(
                    lambda: supabase.table('riot_accounts').update(riot_account_data).eq('user_id', user_id).execute()
                )
            else:
                # Create new riot account
                execute_supabase_query_with_retry(
                    lambda: supabase.table('riot_accounts').insert(riot_account_data).execute()
                )
                
                # After creating new riot account, fetch and populate rank audit events
                try:
                    populate_rank_audit_events(puuid, user_region)
                except Exception as audit_error:
                    print(f"Warning: Failed to populate rank audit events: {audit_error}")
                    # Don't fail the account creation if audit events fail
            
            # Create JWT token
            token = create_jwt_token(user_id, puuid)
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': user_id,
                    'riot_id': puuid,
                    'summoner_name': riot_id,
                    'region': user_region,
                    'created_at': user['created_at']
                }
            })
        else:
            # User doesn't exist, create new user
            now = datetime.now(timezone.utc).isoformat()
            user_data = {
                'riot_id': puuid,
                'created_at': now,
                'description': ''
            }
            
            def create_user():
                return supabase.table('users').insert(user_data).execute()
            
            insert_response = execute_supabase_query_with_retry(create_user)
            new_user = insert_response.data[0]
            user_id = new_user['id']
            
            # Create riot account
            riot_account_data = {
                'user_id': user_id,
                'riot_id': puuid,
                'summoner_name': riot_id,
                'region': user_region
            }
            
            execute_supabase_query_with_retry(
                lambda: supabase.table('riot_accounts').insert(riot_account_data).execute()
            )
            
            # Fetch and store initial rank data for new user
            try:
                
                # Use the same pattern as existing working code - direct PUUID-based league endpoint
                # Use the user's actual region (e.g., na1) directly
                league_url = f"https://{user_region}.api.riotgames.com/tft/league/v1/by-puuid/{puuid}"
                league_response = requests.get(league_url, headers=headers)
                
                if league_response.status_code == 200:
                    league_data = league_response.json()
                    if league_data and len(league_data) > 0:
                        tft_entry = league_data[0]  # Get first TFT entry
                        rank = f"{tft_entry.get('tier', 'UNRANKED')} {tft_entry.get('rank', '')} {tft_entry.get('leaguePoints', 0)}LP"
                        
                        # Update riot account with rank
                        update_result = execute_supabase_query_with_retry(
                            lambda: supabase.table('riot_accounts').update({
                                'rank': rank,
                                'date_updated': datetime.now(timezone.utc).isoformat()
                            }).eq('user_id', user_id).execute()
                        )
            except Exception as e:
                import traceback
            
            # After successful account creation, fetch and populate rank audit events
            try:
                populate_rank_audit_events(puuid, user_region)
            except Exception as audit_error:
                print(f"Warning: Failed to populate rank audit events: {audit_error}")
                # Don't fail the account creation if audit events fail
            
            
            
            # Create JWT token
            token = create_jwt_token(user_id, puuid)
            
            return jsonify({
                'success': True,
                'message': 'Account created and login successful',
                'token': token,
                'user': {
                    'id': user_id,
                    'riot_id': puuid,
                    'summoner_name': riot_id,
                    'region': user_region,
                    'created_at': new_user['created_at']
                }
            })
            
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Network error occurred', 'message': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'An unexpected error occurred', 'message': str(e)}), 500

@app.route('/api/auth/verify', methods=['GET'])
@require_auth
def verify_token():
    """Verify JWT token and return user info"""
    try:
        # Get full user data from database
        def get_user_data():
            return supabase.table('users').select('id, email, created_at').eq('id', request.user_id).execute()
        
        user_response = execute_supabase_query_with_retry(get_user_data)
        
        if not user_response or not user_response.data:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = user_response.data[0]
        
        # Get riot account data for summoner_name and region
        def get_riot_account():
            return supabase.table('riot_accounts').select('summoner_name, region').eq('user_id', request.user_id).execute()
        
        riot_response = execute_supabase_query_with_retry(get_riot_account)
        
        if riot_response and riot_response.data:
            riot_data = riot_response.data[0]
            summoner_name = riot_data.get('summoner_name', '')
            region = riot_data.get('region', '')
        else:
            summoner_name = ''
            region = ''
        
        return jsonify({
            'success': True,
            'user': {
                'id': user_data['id'],
                'email': user_data['email'],
                'summoner_name': summoner_name,
                'region': region,
                'created_at': user_data['created_at'],
                'description': 'No description available',
                'available': 0,
                'days': [],
                'time': '',
                'timezone': ''
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/api/auth/check-profile-completion', methods=['GET'])
@require_auth
def check_profile_completion():
    """Check if user profile is complete (has description, available days, and preferred time)"""
    try:
        def get_user_data():
            return supabase.table('users').select('id, email, created_at').eq('id', request.user_id).execute()
        
        user_response = execute_supabase_query_with_retry(get_user_data)
        
        if not user_response or not user_response.data:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = user_response.data[0]
        
        # Since we're using a simplified users table, profile is never complete
        # This endpoint now returns default values for all profile fields
        return jsonify({
            'success': True,
            'is_complete': False,
            'missing_fields': {
                'description': True,
                'available': True,
                'days': True,
                'time': True,
                'timezone': True
            },
            'profile_data': {
                'description': 'No description available',
                'available': 0,
                'days': [],
                'time': '',
                'timezone': ''
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/api/migrate/add-riot-id-column', methods=['POST'])
def add_riot_id_column():
    """Add riot_id column to users table"""
    try:
        # First, let's check if the column already exists by trying to select it
        try:
            test_query = supabase.table('users').select('riot_id').limit(1).execute()
            return jsonify({
                'success': True,
                'message': 'riot_id column already exists in users table'
            })
        except Exception as column_error:
            if 'column users.riot_id does not exist' in str(column_error):
                # Column doesn't exist, we need to add it
                # For now, let's just return an error asking to run the migration manually
                return jsonify({
                    'error': 'Database migration required',
                    'message': 'Please run the following SQL in your Supabase dashboard:\n\nALTER TABLE users ADD COLUMN IF NOT EXISTS riot_id TEXT;\nCREATE UNIQUE INDEX IF NOT EXISTS idx_users_riot_id ON users(riot_id) WHERE riot_id IS NOT NULL;'
                }), 400
            else:
                raise column_error
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/debug/table-structure', methods=['GET'])
def get_table_structure():
    """Get the structure of users and riot_accounts tables"""
    try:
        # Get users table structure
        users_query = supabase.table('users').select('*').limit(1).execute()
        riot_accounts_query = supabase.table('riot_accounts').select('*').limit(1).execute()
        
        # Get column names from the first row
        users_columns = list(users_query.data[0].keys()) if users_query.data else []
        riot_columns = list(riot_accounts_query.data[0].keys()) if riot_accounts_query.data else []
        
        return jsonify({
            'users_table': {
                'columns': users_columns,
                'sample_data': users_query.data[0] if users_query.data else None
            },
            'riot_accounts_table': {
                'columns': riot_columns,
                'sample_data': riot_accounts_query.data[0] if riot_accounts_query.data else None
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    try:
        # Test Supabase connection
        def test_query():
            return supabase.table('users').select('id').limit(1).execute()
        
        test_response = execute_supabase_query_with_retry(test_query, max_retries=1)
        
        if test_response is not None:
            return jsonify({
                'status': 'healthy', 
                'message': 'TFT Match API is running',
                'database': 'connected'
            })
        else:
            return jsonify({
                'status': 'unhealthy',
                'message': 'TFT Match API is running but database connection failed',
                'database': 'disconnected'
            }), 503
            
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'message': 'TFT Match API is running but database connection failed',
            'database': 'error',
            'error': str(e)
        }), 503

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'TFT Match API',
        'usage': 'GET /api/match/{match_id} to fetch match data',
        'example': '/api/match/NA1_5320285575'
    })

@app.route('/api/test-region-mapping', methods=['GET'])
def test_region_mapping():
    """Test endpoint to verify region mapping logic"""
    region = request.args.get('region', 'americas')
    
    # Map server regions to routing regions for Riot API
    server_to_routing_mapping = {
        # Americas
        'na1': 'americas', 'br1': 'americas', 'la1': 'americas', 'la2': 'americas',
        # Asia
        'kr1': 'asia', 'jp1': 'asia', 'oc1': 'asia', 'ph2': 'asia', 'sg2': 'asia', 'th2': 'asia', 'tw2': 'asia', 'vn2': 'asia',
        # Europe
        'euw1': 'europe', 'eun1': 'europe', 'tr1': 'europe', 'ru1': 'europe',
        # Keep routing regions as-is for backward compatibility
        'americas': 'americas', 'asia': 'asia', 'europe': 'europe'
    }
    
    routing_region = server_to_routing_mapping.get(region, 'americas')
    
    return jsonify({
        'input_region': region,
        'mapped_region': routing_region,
        'api_url': f"https://{routing_region}.api.riotgames.com/tft/league/v1/by-puuid/{{puuid}}"
    })

@app.route('/api/tft-league/<puuid>', methods=['GET'])
def get_tft_league_data(puuid):
    try:
        user_id = request.args.get('user_id')
        
        # Try to get region from riot_accounts table using PUUID first
        try:
            riot_account_response = supabase.table('riot_accounts').select('region').eq('riot_id', puuid).execute()
            if riot_account_response.data and len(riot_account_response.data) > 0:
                server_region = riot_account_response.data[0].get('region', 'americas')
            else:
                server_region = request.args.get('region', 'americas')
        except Exception as e:
            server_region = request.args.get('region', 'americas')  # Fallback to region parameter
        
        # Map server regions to routing regions for Riot API
        # Server regions: na1, br1, la1, la2, kr1, jp1, euw1, eun1, tr1, ru1, oc1, ph2, sg2, th2, tw2, vn2
        # Routing regions: americas, asia, europe
        server_to_routing_mapping = {
            # Americas
            'na1': 'americas', 'br1': 'americas', 'la1': 'americas', 'la2': 'americas',
            # Asia
            'kr1': 'asia', 'jp1': 'asia', 'oc1': 'asia', 'ph2': 'asia', 'sg2': 'asia', 'th2': 'asia', 'tw2': 'asia', 'vn2': 'asia',
            # Europe
            'euw1': 'europe', 'eun1': 'europe', 'tr1': 'europe', 'ru1': 'europe',
            # Keep routing regions as-is for backward compatibility
            'americas': 'americas', 'asia': 'asia', 'europe': 'europe'
        }
        
        # For TFT league endpoint, we need to use server regions directly, not routing regions
        # The TFT league API requires server regions like na1, kr, euw1, etc.
        # Map kr1 to kr for Korean server
        if server_region == 'kr1':
            server_region = 'kr'
        
        print(f"TFT League - Using server region directly: {server_region}")
        
        url = f"https://{server_region}.api.riotgames.com/tft/league/v1/by-puuid/{puuid}"
        headers = {'X-Riot-Token': API_KEY}
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            league_data = response.json()
            print(f"🔍 TFT League API response for {puuid}: {league_data}")
            print(f"🔍 Response type: {type(league_data)}")
            print(f"🔍 Response length: {len(league_data) if isinstance(league_data, list) else 'N/A'}")
            
            # Update rank and date_updated in database if the account exists
            try:
                # Check if account exists in riot_accounts table using puuid
                account_check = supabase.table('riot_accounts').select('*').eq('riot_id', puuid).execute()
                if account_check.data and len(account_check.data) > 0:
                    # Account exists, update their rank and date_updated
                    rank = None
                    # Find ranked TFT data
                    for entry in league_data:
                        if entry.get('queueType') == 'RANKED_TFT':
                            tier = entry.get('tier', 'UNRANKED')
                            rank_division = entry.get('rank', '')
                            league_points = entry.get('leaguePoints', 0)
                            if tier != 'UNRANKED':
                                rank = f"{tier} {rank_division} {league_points}LP"
                            else:
                                rank = 'UNRANKED'
                            break
                    # If no ranked TFT found, check for turbo TFT
                    if not rank:
                        for entry in league_data:
                            if entry.get('queueType') == 'RANKED_TFT_TURBO':
                                rated_tier = entry.get('ratedTier', 'UNRANKED')
                                if rated_tier != 'UNRANKED':
                                    rank = f"TURBO {rated_tier}"
                                else:
                                    rank = 'UNRANKED'
                                break
                    
                    # Update the rank and date_updated in the database
                    current_time = datetime.now(timezone.utc).isoformat()
                    
                    update_data = {'date_updated': current_time}
                    if rank is not None:
                        update_data['rank'] = rank
                    
                    supabase.table('riot_accounts').update(update_data).eq('riot_id', puuid).execute()
            except Exception as e:
                # Continue with the response even if update fails
                pass
            
            # Ensure we always return an array, even if the API returns an empty response
            if not isinstance(league_data, list):
                league_data = []
            
            # If no league data from Riot API, try to get stored rank from database
            if len(league_data) == 0:
                try:
                    account_data = supabase.table('riot_accounts').select('rank').eq('riot_id', puuid).execute()
                    if account_data.data and len(account_data.data) > 0 and account_data.data[0].get('rank'):
                        stored_rank = account_data.data[0]['rank']
                        print(f"🔍 Using stored rank for {puuid}: {stored_rank}")
                        # Create a mock league data entry from stored rank
                        if stored_rank and stored_rank != 'UNRANKED':
                            # Parse the stored rank to create league data
                            rank_parts = stored_rank.split()
                            if len(rank_parts) >= 2:
                                tier = rank_parts[0]
                                division = rank_parts[1]
                                lp = rank_parts[2] if len(rank_parts) > 2 else '0LP'
                                lp_value = int(lp.replace('LP', '')) if lp.replace('LP', '').isdigit() else 0
                                
                                mock_league_data = [{
                                    'queueType': 'RANKED_TFT',
                                    'tier': tier,
                                    'rank': division,
                                    'leaguePoints': lp_value,
                                    'wins': 0,
                                    'losses': 0,
                                    'summonerName': 'Stored Rank Data'
                                }]
                                league_data = mock_league_data
                                print(f"🔍 Created mock league data: {mock_league_data}")
                except Exception as e:
                    print(f"🔍 Error getting stored rank: {e}")
            
            return jsonify(league_data)
        else:
            return jsonify({
                'error': f'TFT League API request failed with status code {response.status_code}',
                'message': response.text
            }), response.status_code
            
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Network error occurred', 'message': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'An unexpected error occurred', 'message': str(e)}), 500

@app.route('/api/riot-account/<puuid>', methods=['GET'])
def get_riot_account_by_puuid(puuid):
    """Get Riot account data by PUUID (riot_id)"""
    try:
        logger.info(f"Fetching Riot account for PUUID {puuid}")
        
        def query_func():
            return supabase.table('riot_accounts').select('*').eq('riot_id', puuid).execute()
        
        response = execute_supabase_query_with_retry(query_func)
        
        if response and response.data and len(response.data) > 0:
            logger.info(f"Successfully fetched Riot account for PUUID {puuid}")
            return jsonify(response.data[0])
        else:
            logger.info(f"No Riot account found for PUUID {puuid}")
            return jsonify({'error': 'Riot account not found'}), 404
            
    except Exception as e:
        logger.error(f"Error fetching Riot account for PUUID {puuid}: {str(e)}")
        return jsonify({'error': 'Failed to fetch Riot account', 'details': str(e)}), 500

@app.route('/api/riot-account/summoner/<summoner_name>', methods=['GET'])
def get_riot_account_by_summoner(summoner_name):
    """Get Riot account data by summoner name"""
    try:
        logger.info(f"Fetching Riot account for summoner {summoner_name}")
        
        def query_func():
            return supabase.table('riot_accounts').select('*').eq('summoner_name', summoner_name).execute()
        
        response = execute_supabase_query_with_retry(query_func)
        
        if response and response.data and len(response.data) > 0:
            logger.info(f"Successfully fetched Riot account for summoner {summoner_name}")
            return jsonify(response.data[0])
        else:
            logger.info(f"No Riot account found for summoner {summoner_name}")
            return jsonify({'error': 'Riot account not found'}), 404
            
    except Exception as e:
        logger.error(f"Error fetching Riot account for summoner {summoner_name}: {str(e)}")
        return jsonify({'error': 'Failed to fetch Riot account', 'details': str(e)}), 500



@app.route('/api/users/<int:user_id>/owned-study-groups', methods=['GET'])
def get_user_owned_study_groups(user_id):
    try:
        logger.info(f"Fetching study groups owned by user {user_id}")
        
        def query_func():
            logger.info(f"Querying study_group table for owner={user_id}")
            return supabase.table('study_group').select('*').eq('owner', user_id).execute()
        
        response = execute_supabase_query_with_retry(query_func)
        
        if response and response.data:
            logger.info(f"Successfully fetched {len(response.data)} study groups owned by user {user_id}")
            return jsonify({'study_groups': response.data})
        else:
            logger.info(f"No study groups found owned by user {user_id}")
            return jsonify({'study_groups': []})
            
    except Exception as e:
        logger.error(f"Error fetching study groups owned by user {user_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch study groups', 'details': str(e)}), 500

@app.route('/api/users/<int:user_id>/owned-study-groups-with-members', methods=['GET'])
@require_user_auth
def get_user_owned_study_groups_with_members(user_id):
    try:
        # Security check: ensure user can only access their own groups
        if request.user_id != user_id:
            return jsonify({'error': 'Unauthorized access'}), 403
        
        logger.info(f"Fetching study groups with members owned by user {user_id}")
        
        # Get owned groups
        def get_owned_groups():
            return supabase.table('study_group').select('*').eq('owner', user_id).execute()
        
        owned_groups_response = execute_supabase_query_with_retry(get_owned_groups)
        
        if not owned_groups_response or not owned_groups_response.data:
            logger.info(f"No study groups found owned by user {user_id}")
            return jsonify({'study_groups': []})
        
        # Get all group IDs
        group_ids = [group['id'] for group in owned_groups_response.data]
        
        # Get all members for all owned groups in one query - simplified
        def get_all_members():
            return supabase.table('user_to_study_group').select('*').in_('study_group_id', group_ids).execute()
        
        members_response = execute_supabase_query_with_retry(get_all_members)
        
        # Get all riot_ids from members to fetch their account data
        riot_ids = []
        if members_response and members_response.data:
            riot_ids = [member['riot_id'] for member in members_response.data if member.get('riot_id')]
        
        # Fetch riot account data for all members
        riot_accounts_map = {}
        if riot_ids:
            def get_riot_accounts():
                return supabase.table('riot_accounts').select('*').in_('riot_id', riot_ids).execute()
            
            riot_accounts_response = execute_supabase_query_with_retry(get_riot_accounts)
            if riot_accounts_response and riot_accounts_response.data:
                for account in riot_accounts_response.data:
                    riot_accounts_map[account['riot_id']] = account
        
        # Create a map of group_id to members with riot account data
        group_members_map = {}
        if members_response and members_response.data:
            for member in members_response.data:
                group_id = member['study_group_id']
                riot_id = member.get('riot_id')
                
                # Merge member data with riot account data
                riot_account = riot_accounts_map.get(riot_id, {})
                rank = riot_account.get('rank', member.get('rank', 'UNRANKED'))
                
                # Convert rank to ELO using the existing function
                elo = rank_to_elo(rank) if rank and rank != 'UNRANKED' else 0
                
                member_with_data = {
                    **member,
                    'summoner_name': riot_account.get('summoner_name', member.get('summoner_name', 'Unknown User')),
                    'elo': elo,  # Use converted ELO from rank
                    'rank': rank,
                    'icon_id': riot_account.get('icon_id', member.get('icon_id'))
                }
                
                if group_id not in group_members_map:
                    group_members_map[group_id] = []
                group_members_map[group_id].append(member_with_data)
        
        # Add members to each group
        for group in owned_groups_response.data:
            group['members'] = group_members_map.get(group['id'], [])
        
        logger.info(f"Successfully fetched {len(owned_groups_response.data)} study groups with members owned by user {user_id}")
        
        # Debug: Log some member data to see what we're getting
        for group in owned_groups_response.data:
            if group.get('members'):
                logger.info(f"Group {group['id']} has {len(group['members'])} members")
                for member in group['members'][:2]:  # Log first 2 members
                    logger.info(f"  Member: {member.get('summoner_name')}, ELO: {member.get('elo')}, Rank: {member.get('rank')}")
        
        return jsonify({'study_groups': owned_groups_response.data})
            
    except Exception as e:
        logger.error(f"Error fetching study groups with members owned by user {user_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch study groups', 'details': str(e)}), 500

@app.route('/api/riot-account/<puuid>', methods=['DELETE'])
def delete_riot_account_by_puuid(puuid):
    """Delete Riot account by PUUID"""
    try:
        # Delete the Riot account by PUUID
        response = supabase.table('riot_accounts').delete().eq('riot_id', puuid).execute()
        
        if response.data:
            return jsonify({
                'success': True,
                'message': 'Riot account removed successfully'
            })
        else:
            return jsonify({'error': 'Riot account not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to remove Riot account'}), 500

@app.route('/api/riot-account/<puuid>/update-rank', methods=['POST'])
def update_riot_account_rank_by_puuid(puuid):
    """Update Riot account rank by PUUID"""
    try:
        # Get the Riot account by PUUID
        account_response = supabase.table('riot_accounts').select('*').eq('riot_id', puuid).execute()
        if not account_response.data or len(account_response.data) == 0:
            return jsonify({'error': 'Riot account not found'}), 404
        
        account = account_response.data[0]
        region = account.get('region', 'americas')
        
        # Map region to routing region for TFT league API
        routing_region = region
        if region == 'na1':
            routing_region = 'americas'
        elif region == 'euw1':
            routing_region = 'europe'
        elif region == 'kr':
            routing_region = 'asia'
        
        # Fetch TFT league data to get rank
        rank = None
        try:
            league_url = f"https://{routing_region}.api.riotgames.com/tft/league/v1/by-puuid/{puuid}"
            headers = {'X-Riot-Token': API_KEY}
            league_response = requests.get(league_url, headers=headers)
            
            if league_response.status_code == 200:
                league_data = league_response.json()
                # Find ranked TFT data
                for entry in league_data:
                    if entry.get('queueType') == 'RANKED_TFT':
                        tier = entry.get('tier', 'UNRANKED')
                        rank_division = entry.get('rank', '')
                        league_points = entry.get('leaguePoints', 0)
                        if tier != 'UNRANKED':
                            rank = f"{tier} {rank_division} {league_points}LP"
                        else:
                            rank = 'UNRANKED'
                        break
                # If no ranked TFT found, check for turbo TFT
                if not rank:
                    for entry in league_data:
                        if entry.get('queueType') == 'RANKED_TFT_TURBO':
                            rated_tier = entry.get('ratedTier', 'UNRANKED')
                            if rated_tier != 'UNRANKED':
                                rank = f"TURBO {rated_tier}"
                            else:
                                rank = 'UNRANKED'
                            break
        except Exception as e:
            rank = None
        
        # Update the rank in the database
        update_response = supabase.table('riot_accounts').update({'rank': rank}).eq('riot_id', puuid).execute()
        
        if update_response.data:
            return jsonify({
                'success': True,
                'message': 'Rank updated successfully',
                'rank': rank
            })
        else:
            return jsonify({'error': 'Failed to update rank'}), 500
            
    except Exception as e:
        return jsonify({'error': 'Failed to update rank'}), 500

@app.route('/api/riot-account/<puuid>/update-icon', methods=['POST'])
def update_riot_account_icon_by_puuid(puuid):
    """Update Riot account icon by PUUID"""
    try:
        # Get the Riot account by PUUID
        account_response = supabase.table('riot_accounts').select('*').eq('riot_id', puuid).execute()
        if not account_response.data or len(account_response.data) == 0:
            return jsonify({'error': 'Riot account not found'}), 404
        
        account = account_response.data[0]
        region = account.get('region', 'americas')
        
        # Fetch summoner data to get profile icon ID
        icon_id = None
        try:
            summoner_url = f"https://{region}.api.riotgames.com/tft/summoner/v1/summoners/by-puuid/{puuid}"
            headers = {'X-Riot-Token': API_KEY}
            summoner_response = requests.get(summoner_url, headers=headers)
            
            if summoner_response.status_code == 200:
                summoner_data = summoner_response.json()
                icon_id = summoner_data.get('profileIconId')
            else:
                return jsonify({'error': 'Failed to fetch summoner data'}), summoner_response.status_code
        except Exception as e:
            return jsonify({'error': 'Failed to fetch summoner data'}), 500
        
        # Update the icon_id in the database
        update_response = supabase.table('riot_accounts').update({'icon_id': icon_id}).eq('riot_id', puuid).execute()
        
        if update_response.data:
            return jsonify({
                'success': True,
                'message': 'Icon ID updated successfully',
                'icon_id': icon_id
            })
        else:
            return jsonify({'error': 'Failed to update icon ID'}), 500
            
    except Exception as e:
        return jsonify({'error': 'Failed to update icon ID'}), 500

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        path = request.form.get('path')
        bucket = request.form.get('bucket', 'study-group-icons')
        
        if not file or not path:
            return jsonify({'error': 'File and path are required'}), 400
        
        # Use service client for uploads to bypass RLS
        from supabase import create_client, Client
        supabase_service: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Upload the file
        try:
            # First try to delete the existing file if it exists
            try:
                supabase_service.storage.from_(bucket).remove([path])
            except:
                # File doesn't exist, which is fine
                pass
            
            # Upload the new file
            result = supabase_service.storage.from_(bucket).upload(path, file.read())
            # Get the public URL
            public_url = supabase_service.storage.from_(bucket).get_public_url(path)
            
            # Add cache-busting parameter
            cache_busted_url = f"{public_url}?t={int(time.time())}"
            
            
            return jsonify({
                'success': True,
                'path': path,
                'url': cache_busted_url
            })
        except Exception as upload_error:
            return jsonify({'error': 'Upload failed'}), 500
        
    except Exception as e:
        return jsonify({'error': 'Failed to upload image'}), 500

@app.route('/api/delete-image', methods=['DELETE'])
def delete_image():
    try:
        data = request.get_json()
        path = data.get('path')
        bucket = data.get('bucket', 'study-group-icons')
        
        if not path:
            return jsonify({'error': 'Path is required'}), 400
        
        # Use service client for deletions to bypass RLS
        from supabase import create_client, Client
        supabase_service: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Delete the file
        try:
            result = supabase_service.storage.from_(bucket).remove([path])
            return jsonify({
                'success': True,
                'message': 'Image deleted successfully'
            })
        except Exception as delete_error:
            return jsonify({'error': 'Delete failed'}), 500
        
    except Exception as e:
        return jsonify({'error': 'Failed to delete image'}), 500

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    try:
        response = supabase.table('users').select('id, email, created_at').eq('id', user_id).execute()
        if response.data and len(response.data) > 0:
            user_data = response.data[0]
            # Add default profile fields since the frontend expects them
            user_data['description'] = 'No description available'
            user_data['available'] = 0
            user_data['days'] = []
            user_data['time'] = ''
            user_data['timezone'] = ''
            return jsonify(user_data)
        else:
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user_profile(user_id):
    try:
        data = request.get_json()
        
        # Since the users table only has id, email, created_at, we'll return the user data
        # with the requested updates applied to the response (but not saved to DB)
        response = supabase.table('users').select('id, email, created_at').eq('id', user_id).execute()
        if not response.data or len(response.data) == 0:
            return jsonify({'error': 'User not found'}), 404
        
        user_data = response.data[0]
        
        # Apply the requested updates to the response data
        if 'description' in data:
            user_data['description'] = data['description']
        if 'available' in data:
            user_data['available'] = data['available']
        if 'days' in data:
            user_data['days'] = data['days']
        if 'time' in data:
            user_data['time'] = data['time']
        if 'timezone' in data:
            user_data['timezone'] = data['timezone']
        
        # Add default values for any missing fields
        if 'description' not in user_data:
            user_data['description'] = 'No description available'
        if 'available' not in user_data:
            user_data['available'] = 0
        if 'days' not in user_data:
            user_data['days'] = []
        if 'time' not in user_data:
            user_data['time'] = ''
        if 'timezone' not in user_data:
            user_data['timezone'] = ''
        
        return jsonify(user_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def rank_matches_filter(rank_str, min_rank, max_rank):
    """
    Check if a rank falls within the specified rank range.
    Works with actual rank strings like 'IRON I', 'DIAMOND II 50LP', etc.
    """
    if not rank_str or rank_str == 'UNRANKED':
        # Handle both formats: 'iron+' and 'IRON'
        return min_rank.lower() in ['iron+', 'iron']  # Only show unranked if min_rank is iron+
    
    rank_str = rank_str.upper()
    
    # Define rank hierarchy (lower index = lower rank)
    rank_hierarchy = [
        'IRON IV', 'IRON III', 'IRON II', 'IRON I',
        'BRONZE IV', 'BRONZE III', 'BRONZE II', 'BRONZE I',
        'SILVER IV', 'SILVER III', 'SILVER II', 'SILVER I',
        'GOLD IV', 'GOLD III', 'GOLD II', 'GOLD I',
        'PLATINUM IV', 'PLATINUM III', 'PLATINUM II', 'PLATINUM I',
        'EMERALD IV', 'EMERALD III', 'EMERALD II', 'EMERALD I',
        'DIAMOND IV', 'DIAMOND III', 'DIAMOND II', 'DIAMOND I',
        'MASTER I', 'MASTER', 'GRANDMASTER', 'CHALLENGER'
    ]
    
    # Handle TURBO ranks
    if rank_str.startswith('TURBO '):
        turbo_rank = rank_str.replace('TURBO ', '')
        if turbo_rank == 'UNRANKED':
            return min_rank.lower() in ['iron+', 'iron']
        # Map turbo ranks to regular ranks for comparison
        turbo_to_regular = {
            'IRON': 'IRON II',
            'BRONZE': 'BRONZE II',
            'SILVER': 'SILVER II',
            'GOLD': 'GOLD II',
            'PLATINUM': 'PLATINUM II',
            'EMERALD': 'EMERALD II',
            'DIAMOND': 'DIAMOND II'
        }
        rank_str = turbo_to_regular.get(turbo_rank, 'IRON IV')
    
    # Extract base rank (e.g., 'DIAMOND I' from 'DIAMOND I 50LP')
    base_rank = rank_str.split('LP')[0].strip() if 'LP' in rank_str else rank_str
    # Also handle cases where there might be extra spaces or numbers
    base_rank = ' '.join([part for part in base_rank.split() if not part.isdigit()])
    
    # Find rank position in hierarchy
    try:
        rank_position = rank_hierarchy.index(base_rank)
    except ValueError:
        # If rank not found, assume it's unranked
        return min_rank.lower() in ['iron+', 'iron']
    
    # Convert filter ranks to positions - handle both formats
    min_position = 0
    max_position = len(rank_hierarchy) - 1
    
    # Normalize min_rank to lowercase
    min_rank_lower = min_rank.lower()
    
    if min_rank_lower in ['bronze+', 'bronze']:
        min_position = 4  # Start from BRONZE IV
    elif min_rank_lower in ['silver+', 'silver']:
        min_position = 8  # Start from SILVER IV
    elif min_rank_lower in ['gold+', 'gold']:
        min_position = 12  # Start from GOLD IV
    elif min_rank_lower in ['platinum+', 'platinum']:
        min_position = 16  # Start from PLATINUM IV
    elif min_rank_lower in ['emerald+', 'emerald']:
        min_position = 20  # Start from EMERALD IV
    elif min_rank_lower in ['diamond+', 'diamond']:
        min_position = 24  # Start from DIAMOND IV
    elif min_rank_lower in ['master+', 'master']:
        min_position = 28  # Start from MASTER I
    elif min_rank_lower in ['grandmaster+', 'grandmaster']:
        min_position = 30  # Start from GRANDMASTER
    elif min_rank_lower in ['challenger+', 'challenger']:
        min_position = 31  # Start from CHALLENGER
    
    # Normalize max_rank to lowercase
    max_rank_lower = max_rank.lower()
    
    if max_rank_lower in ['iron+', 'iron']:
        max_position = 3  # Up to IRON I
    elif max_rank_lower in ['bronze+', 'bronze']:
        max_position = 7  # Up to BRONZE I
    elif max_rank_lower in ['silver+', 'silver']:
        max_position = 11  # Up to SILVER I
    elif max_rank_lower in ['gold+', 'gold']:
        max_position = 15  # Up to GOLD I
    elif max_rank_lower in ['platinum+', 'platinum']:
        max_position = 19  # Up to PLATINUM I
    elif max_rank_lower in ['emerald+', 'emerald']:
        max_position = 23  # Up to EMERALD I
    elif max_rank_lower in ['diamond+', 'diamond']:
        max_position = 27  # Up to DIAMOND I
    elif max_rank_lower in ['master+', 'master']:
        max_position = 29  # Up to MASTER
    elif max_rank_lower in ['grandmaster+', 'grandmaster']:
        max_position = 30  # Up to GRANDMASTER
    elif max_rank_lower in ['challenger+', 'challenger']:
        max_position = 31  # Up to CHALLENGER
    
    return min_position <= rank_position <= max_position

@app.route('/api/free-agents', methods=['GET'])
def get_free_agents():
    try:
        # Get filter parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 50, type=int)
        search = request.args.get('search', '')
        min_rank = request.args.get('minRank', 'iron+')
        max_rank = request.args.get('maxRank', 'challenger')
        region_filter = request.args.get('region', '')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Build base query for riot accounts only
        query = supabase.table('riot_accounts').select('id, riot_id, summoner_name, rank, region, date_updated, icon_id, created_at')
        
        # Apply text search filter
        if search:
            query = query.ilike('summoner_name', f'%{search}%')
        
        # Apply region filter
        if region_filter and region_filter.strip() and region_filter != 'All Regions' and region_filter != '':
            query = query.ilike('region', region_filter)
        
        # Apply sorting
        if sort_by == 'elo':
            sort_by = 'created_at'  # Default to created_at for database query
        
        if sort_order == 'asc':
            query = query.order(sort_by, desc=False)
        else:
            query = query.order(sort_by, desc=True)
        
        # Apply pagination
        query = query.range(offset, offset + limit - 1)
        
        # Execute query
        response = query.execute()
        
        # Process results and apply rank filtering
        free_agents = []
        for riot_account in response.data:
            rank = riot_account.get('rank', 'UNRANKED')
            
            # Apply rank filter
            if not rank_matches_filter(rank, min_rank, max_rank):
                continue
            
            # Map database fields to FreeAgent interface
            free_agent = {
                'id': riot_account['summoner_name'],  # Use summoner_name as the ID for user-friendly URLs
                'summoner_name': riot_account.get('summoner_name', 'Unknown'),
                'elo': rank_to_elo(rank),  # Calculate ELO for sorting
                'rank': rank,
                'looking_for': 'No description provided',
                'availability': [],  # No availability data from riot_accounts
                'time': '',  # No time data from riot_accounts
                'timezone': '',  # No timezone data from riot_accounts
                'experience': 'Unknown',  # We don't store peak rating, so default
                'created_date': riot_account.get('created_at', ''),
                'region': riot_account.get('region', 'Unknown'),
                'date_updated': riot_account.get('date_updated', ''),
                'icon_id': riot_account.get('icon_id')
            }
            free_agents.append(free_agent)
        
        # Apply ELO-based sorting if requested
        if request.args.get('sort_by') == 'elo':
            reverse = sort_order == 'desc'
            free_agents.sort(key=lambda x: x['elo'], reverse=reverse)
        
        # Get total count for pagination
        if page == 1 and (min_rank.lower() not in ['iron+', 'iron'] or max_rank.lower() not in ['challenger+', 'challenger'] or search or (region_filter and region_filter.strip() and region_filter != 'All Regions' and region_filter != '')):
            # For filtered results, get total count
            count_query = supabase.table('riot_accounts').select('id, riot_id, summoner_name, rank, region')
            
            if search:
                count_query = count_query.ilike('summoner_name', f'%{search}%')
            if region_filter and region_filter.strip() and region_filter != 'All Regions' and region_filter != '':
                count_query = count_query.ilike('region', region_filter)
            
            count_response = count_query.execute()
            
            # Count matching accounts
            total_count = 0
            for riot_account in count_response.data:
                rank = riot_account.get('rank', 'UNRANKED')
                if rank_matches_filter(rank, min_rank, max_rank):
                    total_count += 1
        else:
            # For unfiltered results, get total count
            count_response = supabase.table('riot_accounts').select('id').execute()
            total_count = len(count_response.data)
        
        # Calculate pagination info
        total_pages = (total_count + limit - 1) // limit
        has_next = page < total_pages
        has_prev = page > 1
        
        return jsonify({
            'free_agents': free_agents,
            'pagination': {
                'current_page': page,
                'total_pages': total_pages,
                'total_items': total_count,
                'items_per_page': limit,
                'has_next': has_next,
                'has_prev': has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/summoner/<puuid>', methods=['GET'])
def get_summoner_data(puuid):
    try:
        region = request.args.get('region', 'americas')
        url = f"https://{region}.api.riotgames.com/tft/summoner/v1/summoners/by-puuid/{puuid}"
        headers = {'X-Riot-Token': API_KEY}
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            summoner_data = response.json()
            return jsonify(summoner_data)
        else:
            return jsonify({
                'error': f'Summoner API request failed with status code {response.status_code}',
                'message': response.text
            }), response.status_code
            
    except requests.exceptions.RequestException as e:
        return jsonify({'error': 'Network error occurred', 'message': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'An unexpected error occurred', 'message': str(e)}), 500

# Study Group Invites API endpoints

@app.route('/api/study-group-invites', methods=['POST'])
def create_study_group_invite():
    try:
        data = request.get_json()
        user_one = data.get('user_one')  # Sender
        user_two = data.get('user_two')  # Receiver
        study_group_id = data.get('study_group_id')
        message = data.get('message', '')
        
        if not user_one or not user_two or not study_group_id:
            return jsonify({'error': 'user_one, user_two, and study_group_id are required'}), 400
        
        # Get the riot_id for user_two
        def get_riot_id_by_user_id():
            riot_result = supabase.table('riot_accounts').select('riot_id').eq('user_id', user_two).execute()
            
            if not riot_result.data:
                return None
            
            return riot_result.data[0]['riot_id']
        
        user_two_riot_id = execute_supabase_query_with_retry(get_riot_id_by_user_id)
        
        if not user_two_riot_id:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user_two is already in the study group
        def check_membership():
            return supabase.table('user_to_study_group').select('*').eq('riot_id', user_two_riot_id).eq('study_group_id', study_group_id).execute()
        
        membership_response = execute_supabase_query_with_retry(check_membership)
        
        if membership_response and membership_response.data and len(membership_response.data) > 0:
            return jsonify({'error': 'User is already a member of this study group'}), 400
        
        # Check if there's already a pending invite
        def check_existing_invite():
            return supabase.table('study_group_invites').select('*').eq('user_one', user_one).eq('user_two', user_two).eq('study_group_id', study_group_id).eq('status', 'pending').execute()
        
        existing_invite_response = execute_supabase_query_with_retry(check_existing_invite)
        
        if existing_invite_response and existing_invite_response.data and len(existing_invite_response.data) > 0:
            return jsonify({'error': 'A pending invitation already exists for this user and study group'}), 400
        
        # Create the invite
        now = datetime.now(timezone.utc).isoformat()
        
        invite_data = {
            'user_one': user_one,
            'user_two': user_two,
            'study_group_id': study_group_id,
            'message': message,
            'status': 'pending',
            'created_at': now
        }
        
        def create_invite():
            return supabase.table('study_group_invites').insert(invite_data).execute()
        
        invite_response = execute_supabase_query_with_retry(create_invite)
        
        if not invite_response or not invite_response.data:
            return jsonify({'error': 'Failed to create invitation'}), 500
        
        logger.info(f"Created study group invite: user_one={user_one}, user_two={user_two}, study_group_id={study_group_id}")
        
        return jsonify({
            'message': 'Invitation sent successfully',
            'invite': invite_response.data[0]
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating study group invite: {str(e)}")
        return jsonify({'error': 'Failed to create invitation', 'details': str(e)}), 500

@app.route('/api/study-group-invites/user/<int:user_id>', methods=['GET'])
def get_user_invites(user_id):
    try:
        # Get pending invites for the user (user_two)
        def get_pending_invites():
            return supabase.table('study_group_invites').select('*').eq('user_two', user_id).eq('status', 'pending').execute()
        
        invites_response = execute_supabase_query_with_retry(get_pending_invites)
        
        if not invites_response or not invites_response.data:
            return jsonify({'invites': []})
        
        # Get sender information and study group data for each invite
        invites_with_senders = []
        for invite in invites_response.data:
            # Get sender's Riot account info
            def get_sender_riot():
                return supabase.table('riot_accounts').select('summoner_name').eq('user_id', invite['user_one']).execute()
            
            riot_response = execute_supabase_query_with_retry(get_sender_riot)
            sender_name = riot_response.data[0]['summoner_name'] if riot_response and riot_response.data and len(riot_response.data) > 0 else 'Unknown User'
            
            # Get study group info
            def get_study_group():
                return supabase.table('study_group').select('group_name, description').eq('id', invite['study_group_id']).execute()
            
            study_group_response = execute_supabase_query_with_retry(get_study_group)
            study_group_data = study_group_response.data[0] if study_group_response and study_group_response.data and len(study_group_response.data) > 0 else {'group_name': 'Unknown Group', 'description': ''}
            
            invite_with_sender = {
                **invite,
                'sender_name': sender_name,
                'study_group': study_group_data
            }
            invites_with_senders.append(invite_with_sender)
        
        return jsonify({'invites': invites_with_senders})
        
    except Exception as e:
        logger.error(f"Error fetching user invites: {str(e)}")
        return jsonify({'error': 'Failed to fetch invitations', 'details': str(e)}), 500

@app.route('/api/study-group-invites/sent/<int:user_id>', methods=['GET'])
def get_sent_invites(user_id):
    try:
        # Get invites sent by the user (user_one)
        def get_sent_invites():
            return supabase.table('study_group_invites').select('*').eq('user_one', user_id).execute()
        
        invites_response = execute_supabase_query_with_retry(get_sent_invites)
        
        if not invites_response or not invites_response.data:
            return jsonify({'invites': []})
        
        # Get receiver information and study group data for each invite
        invites_with_receivers = []
        for invite in invites_response.data:
            # Get receiver's Riot account info
            def get_receiver_riot():
                return supabase.table('riot_accounts').select('summoner_name').eq('user_id', invite['user_two']).execute()
            
            riot_response = execute_supabase_query_with_retry(get_receiver_riot)
            receiver_name = riot_response.data[0]['summoner_name'] if riot_response and riot_response.data and len(riot_response.data) > 0 else 'Unknown User'
            
            # Get study group info
            def get_study_group():
                return supabase.table('study_group').select('group_name, description').eq('id', invite['study_group_id']).execute()
            
            study_group_response = execute_supabase_query_with_retry(get_study_group)
            study_group_data = study_group_response.data[0] if study_group_response and study_group_response.data and len(study_group_response.data) > 0 else {'group_name': 'Unknown Group', 'description': ''}
            
            invite_with_receiver = {
                **invite,
                'receiver_name': receiver_name,
                'study_group': study_group_data
            }
            invites_with_receivers.append(invite_with_receiver)
        
        return jsonify({'invites': invites_with_receivers})
        
    except Exception as e:
        logger.error(f"Error fetching sent invites: {str(e)}")
        return jsonify({'error': 'Failed to fetch sent invitations', 'details': str(e)}), 500

@app.route('/api/study-group-invites/<int:invite_id>/respond', methods=['POST'])
def respond_to_invite(invite_id):
    try:
        data = request.get_json()
        response = data.get('response')  # 'accept' or 'decline'
        
        if response not in ['accept', 'decline']:
            return jsonify({'error': 'Response must be either "accept" or "decline"'}), 400
        
        # Get the invite
        def get_invite():
            return supabase.table('study_group_invites').select('*').eq('id', invite_id).eq('status', 'pending').execute()
        
        invite_response = execute_supabase_query_with_retry(get_invite)
        
        if not invite_response or not invite_response.data or len(invite_response.data) == 0:
            return jsonify({'error': 'Invitation not found or already processed'}), 404
        
        invite_data = invite_response.data[0]
        
        # Update invite status
        now = datetime.now(timezone.utc).isoformat()
        
        new_status = 'accepted' if response == 'accept' else 'declined'
        
        def update_invite():
            return supabase.table('study_group_invites').update({
                'status': new_status
            }).eq('id', invite_id).execute()
        
        update_response = execute_supabase_query_with_retry(update_invite)
        
        if not update_response or not update_response.data:
            return jsonify({'error': 'Failed to update invitation'}), 500
        
        # If accepted, add user to study group
        if response == 'accept':
            # Get the riot_id for the user being added
            def get_riot_id_by_user_id():
                riot_result = supabase.table('riot_accounts').select('riot_id').eq('user_id', invite_data['user_two']).execute()
                
                if not riot_result.data:
                    return None
                
                return riot_result.data[0]['riot_id']
            
            user_riot_id = execute_supabase_query_with_retry(get_riot_id_by_user_id)
            
            if not user_riot_id:
                return jsonify({'error': 'User riot account not found'}), 404
            
            # Check if user is already in the group (double-check)
            def check_membership():
                return supabase.table('user_to_study_group').select('*').eq('riot_id', user_riot_id).eq('study_group_id', invite_data['study_group_id']).execute()
            
            membership_response = execute_supabase_query_with_retry(check_membership)
            
            if membership_response and membership_response.data and len(membership_response.data) > 0:
                return jsonify({'error': 'User is already a member of this study group'}), 400
            
            # Add user to study group
            def add_to_group():
                return supabase.table('user_to_study_group').insert({
                    'riot_id': user_riot_id,
                    'study_group_id': invite_data['study_group_id'],
                    'created_at': now
                }).execute()
            
            add_response = execute_supabase_query_with_retry(add_to_group)
            
            if not add_response or not add_response.data:
                return jsonify({'error': 'Failed to add user to study group'}), 500
            
            logger.info(f"User {user_riot_id} accepted invite and joined study group {invite_data['study_group_id']}")
        
        return jsonify({
            'message': f'Invitation {response}ed successfully',
            'status': new_status
        })
        
    except Exception as e:
        logger.error(f"Error responding to invite: {str(e)}")
        return jsonify({'error': 'Failed to process invitation response', 'details': str(e)}), 500

@app.route('/api/users/<int:user_id>/delete-account', methods=['DELETE'])
def delete_user_account(user_id):
    """
    Delete all user data from the database.
    This will remove the user from all tables except if they are a captain of any groups.
    """
    try:
        # First, check if the user is a captain of any groups
        def check_captain_status():
            return supabase.table('study_group').select('id, group_name').eq('owner', user_id).execute()
        
        captain_response = execute_supabase_query_with_retry(check_captain_status)
        
        if captain_response and captain_response.data and len(captain_response.data) > 0:
            # User is a captain of at least one group
            group_names = []
            for group in captain_response.data:
                if group.get('group_name'):
                    group_names.append(group['group_name'])
            
            return jsonify({
                'error': 'Cannot delete account while being a captain',
                'message': f'You are currently a captain of the following groups: {", ".join(group_names)}. Please transfer captaincy to another member or leave these groups before deleting your account.',
                'groups': group_names
            }), 400
        
        # Get the riot_id for the user
        def get_riot_id_by_user_id():
            riot_result = supabase.table('riot_accounts').select('riot_id').eq('user_id', user_id).execute()
            
            if not riot_result.data:
                return None
            
            return riot_result.data[0]['riot_id']
        
        user_riot_id = execute_supabase_query_with_retry(get_riot_id_by_user_id)
        
        # User is not a captain, proceed with deletion
        def delete_user_data():
            # 1. Delete all study group invites where user is sender or receiver
            supabase.table('study_group_invites').delete().or_(f'user_one.eq.{user_id},user_two.eq.{user_id}').execute()
            
            # 2. Delete all user-to-study-group relationships (using riot_id)
            if user_riot_id:
                supabase.table('user_to_study_group').delete().eq('riot_id', user_riot_id).execute()
            
            # 3. Delete Riot account
            supabase.table('riot_accounts').delete().eq('user_id', user_id).execute()
            
            # 4. Delete user profile
            supabase.table('users').delete().eq('id', user_id).execute()
            
            return True
        
        execute_supabase_query_with_retry(delete_user_data)
        
        logger.info(f"Successfully deleted all data for user {user_id}")
        
        return jsonify({
            'message': 'Account and all associated data deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Error deleting user account {user_id}: {str(e)}")
        return jsonify({'error': 'Failed to delete user account', 'details': str(e)}), 500

@app.route('/api/team-stats', methods=['GET'])
def get_team_stats():
    """
    Get team stats for a study group.
    Query parameters:
    - group_id: Study group ID
    - start_date: ISO date string for filtering events (now optional, kept for compatibility)
    """
    try:
        group_id = request.args.get('group_id', type=int)
        start_date = request.args.get('start_date')
        
        if not group_id:
            return jsonify({'error': 'group_id is required'}), 400
        
        # start_date is now optional - we'll show all available data up to 50 events per user
        
        # Get all riot_ids in the study group
        def get_group_members():
            return supabase.table('user_to_study_group').select('riot_id').eq('study_group_id', group_id).execute()
        
        members_response = execute_supabase_query_with_retry(get_group_members)
        
        if not members_response or not members_response.data:
            return jsonify({'error': 'Study group not found or has no members'}), 404
        
        riot_ids = [member['riot_id'] for member in members_response.data if member.get('riot_id')]
        
        if not riot_ids:
            return jsonify({'error': 'No valid Riot IDs found for group members'}), 404
        
        # Get rank audit events for these riot_ids (removed start_date filter to show all available data)
        logger.info(f"Fetching all available events for group members (no start_date filter)")
        
        def get_rank_events():
            return supabase.table('rank_audit_events').select('*').in_('riot_id', riot_ids).order('created_at').execute()
        
        events_response = execute_supabase_query_with_retry(get_rank_events)
        
        if not events_response:
            events_response = {'data': []}  # Return empty array if table doesn't exist yet
        
        events = events_response.data or []
        
        # If no events found, return empty array instead of mock data
        if not events:
            logger.info(f"No rank audit events found for group {group_id}, returning empty array")
            events = []
        
        logger.info(f"Found {len(events)} events for group {group_id} with {len(riot_ids)} members")
        
        # Calculate team stats
        member_count = len(user_ids)
        total_elo = sum(event['elo'] for event in events) if events else 0
        average_elo = total_elo / len(events) if events else 0
        total_wins = sum(event['wins'] for event in events) if events else 0
        total_losses = sum(event['losses'] for event in events) if events else 0
        
        return jsonify({
            'events': events,
            'memberCount': member_count,
            'averageElo': round(average_elo, 2),
            'totalWins': total_wins,
            'totalLosses': total_losses
        })
        
    except Exception as e:
        logger.error(f"Error getting team stats: {str(e)}")
        return jsonify({'error': 'Failed to get team stats', 'details': str(e)}), 500

def fetch_live_data_for_group(group_id):
    """Fetch live data from Riot API for all members in a group"""
    try:
        # Get all users in the study group with their riot accounts
        def get_group_members_with_riot_accounts():
            return supabase.table('user_to_study_group').select(
                'user_id, riot_accounts!inner(riot_id, summoner_name, region)'
            ).eq('study_group_id', group_id).execute()
        
        members_response = execute_supabase_query_with_retry(get_group_members_with_riot_accounts)
        
        if not members_response or not members_response.data:
            return {}
        
        live_data = {}
        
        for member in members_response.data:
            user_id = member['user_id']
            riot_account = member.get('riot_accounts')
            
            if not riot_account or not riot_account.get('riot_id'):
                continue
            
            riot_id = riot_account['riot_id']
            summoner_name = riot_account['summoner_name']
            region = riot_account.get('region', 'na1')
            
            try:
                # Fetch league data from Riot API
                league_url = f"https://{region}.api.riotgames.com/tft/league/v1/by-puuid/{riot_id}"
                headers = {
                    'X-Riot-Token': API_KEY
                }
                
                league_response = requests.get(league_url, headers=headers, timeout=10)
                
                if league_response.status_code == 200:
                    league_data = league_response.json()
                    
                    # Find Ranked TFT data (not Turbo)
                    ranked_data = None
                    for entry in league_data:
                        if entry.get('queueType') == 'RANKED_TFT':
                            ranked_data = entry
                            break
                    
                    if ranked_data:
                        # Convert rank to ELO
                        tier = ranked_data.get('tier', '').lower()
                        rank = ranked_data.get('rank', '')
                        league_points = ranked_data.get('leaguePoints', 0)
                        wins = ranked_data.get('wins', 0)
                        losses = ranked_data.get('losses', 0)
                        
                        # Calculate ELO (simplified version)
                        elo = _calculate_elo(tier, rank, league_points)
                        
                        # Create live data point
                        live_data[summoner_name] = {
                            'riot_id': riot_id,
                            'summoner_name': summoner_name,
                            'tier': tier,
                            'rank': rank,
                            'leaguePoints': league_points,
                            'wins': wins,
                            'losses': losses,
                            'elo': elo,
                            'created_at': datetime.now().isoformat(),
                            'isLive': True
                        }
                        
            except Exception as e:
                logger.error(f"Error fetching live data for {summoner_name}: {str(e)}")
                continue
        
        return live_data
        
    except Exception as e:
        logger.error(f"Error in fetch_live_data_for_group: {str(e)}")
        return {}

@app.route('/api/team-stats/members', methods=['GET'])
def get_member_stats():
    """
    Get individual member stats for a study group.
    Query parameters:
    - group_id: Study group ID
    - start_date: ISO date string for filtering events (now optional, kept for compatibility)
    - include_members: Set to 'true' to include live data from Riot API (optional, default: false)
    - force_refresh: Set to 'true' to bypass cache and fetch fresh data (optional, default: false)
    """
    try:
        group_id = request.args.get('group_id', type=int)
        start_date = request.args.get('start_date')
        include_members = request.args.get('include_members', 'false').lower() == 'true'
        force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'
        update_cache = request.args.get('update_cache', 'false').lower() == 'true'
        
        if not group_id:
            return jsonify({'error': 'group_id is required'}), 400
        
        # Check Redis cache first (unless force_refresh is requested)
        if not force_refresh:
            try:
                redis_key = f"member_stats_group_{group_id}"
                cached_data = redis_client.get(redis_key)
                
                if cached_data:
                    logger.warning(f"Redis cache hit for group {group_id}")
                    cache_data = json.loads(cached_data)
                    
                    # If live data is requested, we need to fetch it separately
                    if include_members:
                        logger.warning(f"Redis cache hit but live data requested for group {group_id}, fetching live data...")
                        live_data = fetch_live_data_for_group(group_id)
                        cache_data['liveData'] = live_data
                        
                        # Update the cache with the fresh live data
                        try:
                            updated_cache_data = {
                                "events": cache_data['events'],
                                "memberNames": cache_data['memberNames'],
                                "liveData": live_data,
                                "cached_at": datetime.now(timezone.utc).isoformat()
                            }
                            
                            redis_client.setex(
                                redis_key,
                                7200,  # 2 hours expiration (increased from 30 minutes)
                                json.dumps(updated_cache_data)
                            )
                            
                            logger.warning(f"Updated Redis cache for group {group_id} with fresh live data")
                        except Exception as e:
                            logger.warning(f"Failed to update Redis cache with live data for group {group_id}: {str(e)}")
                    
                    return jsonify(cache_data)
                else:
                    logger.warning(f"Redis cache miss for group {group_id}")
            except Exception as e:
                logger.warning(f"Redis cache error for group {group_id}: {str(e)}")
                # Continue with normal processing if cache fails
        
        # start_date is now optional - we'll show all available data up to 50 events per user
        
        # Get all members in the study group
        def get_group_members():
            return supabase.table('user_to_study_group').select('*').eq('study_group_id', group_id).execute()
        
        members_response = execute_supabase_query_with_retry(get_group_members)
        
        if not members_response or not members_response.data:
            return jsonify({'error': 'Study group not found or has no members'}), 404
        
        # Get all riot_ids from the members
        riot_ids = [member['riot_id'] for member in members_response.data if member.get('riot_id')]
        
        if not riot_ids:
            return jsonify({'error': 'No valid Riot IDs found for group members'}), 404
        
        # Get riot account data for all members
        def get_riot_accounts():
            return supabase.table('riot_accounts').select('riot_id, summoner_name, region').in_('riot_id', riot_ids).execute()
        
        riot_response = execute_supabase_query_with_retry(get_riot_accounts)
        
        if not riot_response or not riot_response.data:
            return jsonify({'error': 'No Riot accounts found for group members'}), 404
        
        # Create mapping of riot_id to summoner_name and region
        riot_id_to_name = {}
        riot_id_to_region = {}
        
        for account in riot_response.data:
            riot_id = account['riot_id']
            summoner_name = account['summoner_name']
            region = account.get('region', 'na1')
            
            riot_id_to_name[riot_id] = summoner_name
            riot_id_to_region[riot_id] = region
        
        riot_ids = list(riot_id_to_name.keys())
        
        logger.info(f"Found {len(riot_ids)} riot accounts for group {group_id}: {list(riot_id_to_name.items())}")
        
        if not riot_ids:
            return jsonify({'error': 'No valid Riot IDs found for group members'}), 404
        
        # Get rank audit events for these riot_ids (removed start_date filter to show all available data)
        logger.info(f"Fetching all available events for group members (no start_date filter)")
        
        def get_rank_events():
            return supabase.table('rank_audit_events').select('*').in_('riot_id', riot_ids).order('created_at').execute()
        
        events_response = execute_supabase_query_with_retry(get_rank_events)
        
        if not events_response:
            events_response = {'data': []}  # Return empty array if table doesn't exist yet
        
        events = events_response.data or []
        
        # Optimize events data for frontend processing
        logger.info(f"Processing {len(events)} raw events for optimization")
        
        # Group events by riot_id and apply smart filtering per day
        optimized_events = []
        events_by_riot_id = {}
        
        # Get current date for comparison (use local timezone for proper day grouping)
        import pytz
        
        # Use a common timezone (e.g., US Eastern) or you could make this configurable
        # For now, let's use UTC but we'll convert dates to local time for grouping
        current_utc = datetime.now(timezone.utc)
        
        # Convert to a reasonable timezone for date grouping
        # You might want to make this configurable based on user preference
        # Try different common US timezones to handle the issue properly
        timezone_to_try = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix']
        local_tz = pytz.UTC  # Default fallback
        
        # For this fix, let's use Pacific Time as it seems to match your scenario better
        try:
            local_tz = pytz.timezone('America/Los_Angeles')  # Pacific Time
        except:
            # Fallback to UTC if timezone is not available
            local_tz = pytz.UTC
        current_local = current_utc.astimezone(local_tz)
        current_date = current_local.date().isoformat()
        
        # First, group all events by riot_id and date (converted to local timezone)
        for event in events:
            riot_id = event['riot_id']
            if riot_id not in events_by_riot_id:
                events_by_riot_id[riot_id] = {}
            
            # Parse the date and convert to local timezone for proper grouping
            try:
                # Parse the UTC timestamp
                event_utc = datetime.fromisoformat(event['created_at'].replace('Z', '+00:00'))
                
                # Convert to local timezone for date grouping
                event_local = event_utc.astimezone(local_tz)
                event_date = event_local.date().isoformat()  # YYYY-MM-DD in local time
                
                if event_date not in events_by_riot_id[riot_id]:
                    events_by_riot_id[riot_id][event_date] = []
                
                events_by_riot_id[riot_id][event_date].append(event)
            except (KeyError, AttributeError, ValueError) as e:
                logger.warn(f"Skipping invalid event: {e}")
                continue
        
        # Now apply smart filtering: keep only one event per day per user
        logger.info(f"Applying smart filtering for {len(events_by_riot_id)} users")
        for riot_id, dates in events_by_riot_id.items():
            logger.info(f"Processing user {riot_id} with {len(dates)} unique dates")
            for event_date, day_events in dates.items():
                if not day_events:
                    continue
                
                # Check if this is today
                is_today = event_date == current_date
                
                if len(day_events) > 1:
                    logger.info(f"  Date {event_date} has {len(day_events)} events (is_today: {is_today})")
                    for i, event in enumerate(day_events):
                        logger.info(f"    Event {i+1}: {event['created_at']} | ELO: {event['elo']}")
                
                if is_today:
                    # For today, keep the most recent (latest) event
                    selected_event = max(day_events, key=lambda x: x['created_at'])
                    logger.info(f"  Selected for today: {selected_event['created_at']} | ELO: {selected_event['elo']}")
                else:
                    # For other days, keep the highest ELO event
                    selected_event = max(day_events, key=lambda x: x['elo'])
                    logger.info(f"  Selected for historical: {selected_event['created_at']} | ELO: {selected_event['elo']}")
                
                # Add the selected event to optimized events
                optimized_events.append({
                    'riot_id': riot_id,
                    'summoner_name': riot_id_to_name.get(riot_id, riot_id),
                    'created_at': selected_event['created_at'],
                    'elo': selected_event['elo'],
                    'wins': selected_event['wins'],
                    'losses': selected_event['losses']
                })
        
        # Sort optimized events by created_at
        optimized_events.sort(key=lambda x: x['created_at'])
        
        # The smart filtering already ensures one event per day per user
        # Just limit the total number of events per user to prevent huge responses
        MAX_EVENTS_PER_USER = 50
        limited_events = []
        events_per_user = {}
        
        for event in optimized_events:
            riot_id = event['riot_id']
            if riot_id not in events_per_user:
                events_per_user[riot_id] = []
            events_per_user[riot_id].append(event)
        
        # Keep only the most recent events for each user (smart filtering already applied)
        for riot_id, user_events in events_per_user.items():
            # Sort by created_at (most recent first) and take the latest MAX_EVENTS_PER_USER
            user_events.sort(key=lambda x: x['created_at'], reverse=True)
            limited_events.extend(user_events[:MAX_EVENTS_PER_USER])
        
        # Sort all events chronologically for final response
        limited_events.sort(key=lambda x: x['created_at'])
        
        logger.info(f"Optimized events: {len(limited_events)} (reduced from {len(events)}, max {MAX_EVENTS_PER_USER} per user, smart filtering: highest ELO for historical days, most recent for current day)")
        events = limited_events
        
        # Only fetch live data if explicitly requested
        live_data = {}
        if include_members:
            logger.info(f"Fetching live data for {len(riot_ids)} members")
            
            for riot_id in riot_ids:
                try:
                    # Find the riot account data we already fetched
                    riot_account = next((account for account in riot_response.data if account['riot_id'] == riot_id), None)
                    if not riot_account:
                        logger.warn(f"No riot account found for riot_id {riot_id}")
                        continue
                    
                    summoner_name = riot_account['summoner_name']
                    region = riot_account.get('region', 'na1')  # Default to na1 if region not set
                    
                    # Fetch league data from Riot API
                    try:
                        import requests
                        
                        # Use the correct TFT league endpoint with PUUID
                        league_url = f"https://{region}.api.riotgames.com/tft/league/v1/by-puuid/{riot_id}"
                        headers = {
                            'X-Riot-Token': API_KEY
                        }
                        
                        logger.info(f"🔍 Fetching league data for {summoner_name} (puuid: {riot_id})")
                        logger.info(f"🔗 League URL: {league_url}")
                        logger.info(f"🔑 Using API key: {API_KEY[:10]}...")
                        
                        league_response = requests.get(league_url, headers=headers, timeout=10)
                        logger.info(f"📡 League response status: {league_response.status_code}")
                        
                        if league_response.status_code == 200:
                            league_data = league_response.json()
                            logger.info(f"📊 League data received: {league_data}")
                            
                            # Find Ranked TFT data (not Turbo)
                            ranked_data = None
                            for entry in league_data:
                                if entry.get('queueType') == 'RANKED_TFT':
                                    ranked_data = entry
                                    break
                            
                            if ranked_data:
                                # Convert rank to ELO
                                tier = ranked_data.get('tier', '').lower()
                                rank = ranked_data.get('rank', '')
                                league_points = ranked_data.get('leaguePoints', 0)
                                wins = ranked_data.get('wins', 0)
                                losses = ranked_data.get('losses', 0)
                                
                                # Calculate ELO (simplified version)
                                elo = _calculate_elo(tier, rank, league_points)
                                
                                # Create live data point
                                live_data[summoner_name] = {
                                    'riot_id': riot_id,
                                    'summoner_name': summoner_name,
                                    'tier': tier,
                                    'rank': rank,
                                    'leaguePoints': league_points,
                                    'wins': wins,
                                    'losses': losses,
                                    'elo': elo,
                                    'created_at': datetime.now().isoformat(),
                                    'isLive': True
                                }
                                logger.info(f"✅ Live data for {summoner_name}: ELO {elo}")
                            else:
                                logger.warn(f"No ranked TFT data found for {summoner_name}")
                        elif league_response.status_code in [401, 403]:
                            # API key is invalid/expired - this is expected
                            logger.warn(f"Riot API key is invalid/expired for {summoner_name}: {league_response.status_code}")
                            logger.warn(f"Response content: {league_response.text}")
                            # Continue without live data for this user
                        else:
                            logger.warn(f"Failed to fetch league data for {summoner_name}: {league_response.status_code}")
                            logger.warn(f"Response content: {league_response.text}")
                            # Continue without live data for this user
                            
                    except Exception as e:
                        logger.error(f"Error fetching live data for {summoner_name}: {str(e)}")
                        logger.error(f"Full error details: {type(e).__name__}: {e}")
                        # Continue without live data for this user
                        
                except Exception as e:
                    logger.error(f"Error processing user {user_id}: {str(e)}")
            
            logger.info(f"Fetched live data for {len(live_data)} members")
        else:
            logger.info("Skipping live data fetch (not requested)")
        
        # If no events found, return empty events array with member names and live data
        if not events:
            logger.info(f"No rank audit events found for group {group_id}, returning empty events array with live data")
            return jsonify({
                "events": [],
                "memberNames": riot_id_to_name,
                "liveData": live_data
            })
        
        logger.info(f"Found {len(events)} events for group {group_id} with {len(riot_ids)} members")
        
        # Group events by summoner_name instead of riot_id
        member_stats = {}
        for event in events:
            riot_id = event['riot_id']
            summoner_name = riot_id_to_name.get(riot_id, riot_id)  # Use summoner_name, fallback to riot_id
            
            if summoner_name not in member_stats:
                member_stats[summoner_name] = []
            
            # Add summoner_name to the event data
            event_with_name = event.copy()
            event_with_name['summoner_name'] = summoner_name
            member_stats[summoner_name].append(event_with_name)
        
        logger.info(f"Final member_stats structure: {list(member_stats.keys())}")
        for summoner_name, events_list in member_stats.items():
            logger.info(f"  {summoner_name}: {len(events_list)} events")
        
        # Flatten all events into a single array
        all_events = []
        for summoner_name, events_list in member_stats.items():
            all_events.extend(events_list)
        
        # Create the response data
        response_data = {
            "events": all_events,
            "memberNames": riot_id_to_name,
            "liveData": live_data
        }
        
        # Cache the data in Redis (without live data to avoid API calls in cache)
        try:
            cache_data = {
                "events": all_events,
                "memberNames": riot_id_to_name,
                "liveData": {},  # Empty for cached data
                "cached_at": datetime.now(timezone.utc).isoformat()
            }
            
            redis_key = f"member_stats_group_{group_id}"
            redis_client.setex(
                redis_key,
                1800,  # 30 minutes expiration
                json.dumps(cache_data)
            )
            
            logger.warning(f"Successfully cached data for group {group_id}: {len(all_events)} events, {len(riot_id_to_name)} members")
        except Exception as e:
            logger.warning(f"Failed to cache data for group {group_id}: {str(e)}")
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error getting member stats: {str(e)}")
        return jsonify({'error': 'Failed to get member stats', 'details': str(e)}), 500

@app.route('/api/player-stats/<riot_id>', methods=['GET'])
def get_player_stats(riot_id):
    """
    Get individual player stats from rank_audit_events table with smart filtering.
    Path parameter:
    - riot_id: Riot ID of the player
    """
    try:
        logger.info(f"Getting player stats for riot_id: {riot_id}")
        
        def get_rank_events():
            return supabase.table('rank_audit_events').select('*').eq('riot_id', riot_id).order('created_at', desc=True).limit(200).execute()
        
        events_response = execute_supabase_query_with_retry(get_rank_events)
    
        if not events_response:
            events_response = {'data': []}  # Return empty array if table doesn't exist yet
        
        events = events_response.data or []
        
        logger.info(f"Found {len(events)} raw events for riot_id: {riot_id}")
        
        # Apply timezone-aware smart filtering (same logic as team stats)
        import pytz
        
        # Get current date for comparison (use local timezone for proper day grouping)
        current_utc = datetime.now(timezone.utc)
        
        # Convert to a reasonable timezone for date grouping
        try:
            local_tz = pytz.timezone('America/Los_Angeles')  # Pacific Time
        except:
            local_tz = pytz.UTC
        current_local = current_utc.astimezone(local_tz)
        current_date = current_local.date().isoformat()
        
        # Group events by date (converted to local timezone)
        events_by_date = {}
        for event in events:
            try:
                # Parse the UTC timestamp
                event_utc = datetime.fromisoformat(event['created_at'].replace('Z', '+00:00'))
                
                # Convert to local timezone for date grouping
                event_local = event_utc.astimezone(local_tz)
                event_date = event_local.date().isoformat()  # YYYY-MM-DD in local time
                
                if event_date not in events_by_date:
                    events_by_date[event_date] = []
                
                events_by_date[event_date].append(event)
            except (KeyError, AttributeError, ValueError) as e:
                logger.warn(f"Skipping invalid event: {e}")
                continue
        
        # Apply smart filtering: keep only one event per day
        optimized_events = []
        logger.info(f"Applying smart filtering for {len(events_by_date)} unique dates")
        
        for event_date, day_events in events_by_date.items():
            if not day_events:
                continue
                
            # Check if this is today
            is_today = event_date == current_date
            
            if len(day_events) > 1:
                logger.info(f"  Date {event_date} has {len(day_events)} events (is_today: {is_today})")
            
            if is_today:
                # For today, keep the most recent (latest) event
                selected_event = max(day_events, key=lambda x: x['created_at'])
                logger.info(f"  Selected for today: {selected_event['created_at']} | ELO: {selected_event['elo']}")
            else:
                # For other days, keep the highest ELO event
                selected_event = max(day_events, key=lambda x: x['elo'])
                logger.info(f"  Selected for historical: {selected_event['created_at']} | ELO: {selected_event['elo']}")
            
            optimized_events.append(selected_event)
        
        # Sort by date (most recent first)
        optimized_events.sort(key=lambda x: x['created_at'], reverse=True)
        
        logger.info(f"Optimized events: {len(optimized_events)} (reduced from {len(events)}, smart filtering: highest ELO for historical days, most recent for current day)")
        
        return jsonify({
            'events': optimized_events
        })
        
    except Exception as e:
        logger.error(f"Error getting player stats: {str(e)}")
        return jsonify({'error': 'Failed to get player stats', 'details': str(e)}), 500

@app.route('/api/rank-audit-events', methods=['POST'])
def create_rank_audit_event():
    """Create a rank audit event"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        required_fields = ['elo', 'wins', 'losses', 'riot_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Get current date (UTC) for duplicate checking
        current_date = datetime.now(timezone.utc).date()
        
        # Check if an entry with the same wins, losses, and date already exists for this user
        def check_existing_event():
            return supabase.table('rank_audit_events').select('*').eq('riot_id', data['riot_id']).eq('wins', data['wins']).eq('losses', data['losses']).gte('created_at', current_date.isoformat()).lt('created_at', (current_date + timedelta(days=1)).isoformat()).execute()

        existing_response = execute_supabase_query_with_retry(check_existing_event)

        # If matching entries exist for the same day, delete them before inserting the new one
        if existing_response and existing_response.data and len(existing_response.data) > 0:
            logger.info(f"Found {len(existing_response.data)} existing entries with same wins/losses on same day for riot_id {data['riot_id']}, deleting them")
            
            def delete_existing_events():
                return supabase.table('rank_audit_events').delete().eq('riot_id', data['riot_id']).eq('wins', data['wins']).eq('losses', data['losses']).gte('created_at', current_date.isoformat()).lt('created_at', (current_date + timedelta(days=1)).isoformat()).execute()
            
            delete_response = execute_supabase_query_with_retry(delete_existing_events)
            
            if not delete_response:
                logger.error(f"Failed to delete existing entries for riot_id {data['riot_id']}")
                return jsonify({'error': 'Failed to delete existing entries'}), 500
            
            logger.info(f"Successfully deleted {len(existing_response.data)} existing entries")

        def create_event():
            return supabase.table('rank_audit_events').insert(data).execute()

        response = execute_supabase_query_with_retry(create_event)

        if response and response.data:
            return jsonify({'success': True, 'event': response.data[0]}), 201
        else:
            return jsonify({'error': 'Failed to create rank audit event'}), 500

    except Exception as e:
        logger.error(f"Error creating rank audit event: {str(e)}")
        return jsonify({'error': 'Failed to create rank audit event'}), 500

@app.route('/api/redis-health', methods=['GET'])
def redis_health_check():
    """Check Redis connection health"""
    try:
        # Test Redis connection
        redis_client.ping()
        logger.warning("Redis connection health check successful")
        return jsonify({'status': 'healthy', 'message': 'Redis connection successful'})
    except Exception as e:
        logger.warning(f"Redis connection health check failed: {str(e)}")
        return jsonify({'status': 'unhealthy', 'message': f'Redis connection failed: {str(e)}'}), 500

@app.route('/api/cache/clear/<int:group_id>', methods=['DELETE'])
def clear_group_cache(group_id):
    """Clear cache for a specific group"""
    try:
        redis_key = f"member_stats_group_{group_id}"
        result = redis_client.delete(redis_key)
        
        if result:
            logger.warning(f"Redis cache cleared for group {group_id}")
            return jsonify({'message': f'Cache cleared for group {group_id}'})
        else:
            logger.warning(f"No Redis cache found for group {group_id}")
            return jsonify({'message': f'No cache found for group {group_id}'})
    except Exception as e:
        logger.warning(f"Error clearing Redis cache for group {group_id}: {str(e)}")
        return jsonify({'error': 'Failed to clear cache'}), 500

@app.route('/api/cache/clear-all', methods=['DELETE'])
def clear_all_cache():
    """Clear all member stats cache"""
    try:
        # Get all keys matching the pattern
        pattern = "member_stats_group_*"
        keys = redis_client.keys(pattern)
        
        if keys:
            deleted = redis_client.delete(*keys)
            logger.warning(f"Redis cache cleared: {deleted} cache entries")
            return jsonify({'message': f'Cleared {deleted} cache entries'})
        else:
            logger.warning("No Redis cache entries found to clear")
            return jsonify({'message': 'No cache entries found'})
    except Exception as e:
        logger.warning(f"Error clearing all Redis cache: {str(e)}")
        return jsonify({'error': 'Failed to clear cache'}), 500

def refresh_group_cache_data(group_id):
    """Helper function to refresh cache for a specific group with fresh data"""
    print(f"PRINT: refresh_group_cache_data called with group_id = {group_id}")
    
    try:
        print(f"PRINT: Starting try block")
        logger.warning(f"Starting refresh_group_cache_data for group {group_id}")
        

        
        print(f"PRINT: Step 0: Basic test - group_id = {group_id}")
        logger.warning(f"Step 0: Basic test - group_id = {group_id}")
        
        # Step 1: Test database connection with simple query
        try:
            print(f"PRINT: Step 1: Testing basic database connection")
            logger.warning(f"Step 1: Testing basic database connection")
            # Try a simple query first - using riot_id instead of user_id
            test_response = supabase.table('user_to_study_group').select('riot_id').eq('study_group_id', group_id).limit(1).execute()
            print(f"PRINT: Step 1: Basic query successful, response type: {type(test_response)}")
            logger.warning(f"Step 1: Basic query successful, response type: {type(test_response)}")
            
            if not test_response:
                print(f"PRINT: Step 1: No response from basic query")
                logger.warning(f"Step 1: No response from basic query")
                return False
                
        except Exception as basic_error:
            print(f"PRINT: Step 1: Basic database query error: {str(basic_error)}")
            logger.error(f"Step 1: Basic database query error: {str(basic_error)}")
            return False
        
        # Step 2: Get group members (split into two queries since no join relationship exists)
        try:
            print(f"PRINT: Step 2: Getting group members")
            logger.warning(f"Step 2: Getting group members")
            
            # First, get all riot_ids for this group
            def get_group_riot_ids():
                return supabase.table('user_to_study_group').select('riot_id').eq('study_group_id', group_id).execute()
            
            group_response = execute_supabase_query_with_retry(get_group_riot_ids)
            print(f"PRINT: Step 2a: Group query successful, found {len(group_response.data) if group_response.data else 0} members")
            logger.warning(f"Step 2a: Group query successful, found {len(group_response.data) if group_response.data else 0} members")
            
            if not group_response or not group_response.data:
                print(f"PRINT: No members found for group {group_id} during cache refresh")
                logger.warning(f"No members found for group {group_id} during cache refresh")
                return False
            
            # Extract riot_ids
            riot_ids = [member['riot_id'] for member in group_response.data if member.get('riot_id')]
            print(f"PRINT: Step 2b: Extracted {len(riot_ids)} riot_ids")
            logger.warning(f"Step 2b: Extracted {len(riot_ids)} riot_ids")
            
            if not riot_ids:
                print(f"PRINT: No valid Riot IDs found for group {group_id} during cache refresh")
                logger.warning(f"No valid Riot IDs found for group {group_id} during cache refresh")
                return False
            
            # Second, get riot account details for these riot_ids
            def get_riot_accounts():
                return supabase.table('riot_accounts').select('riot_id, summoner_name, region').in_('riot_id', riot_ids).execute()
            
            accounts_response = execute_supabase_query_with_retry(get_riot_accounts)
            print(f"PRINT: Step 2c: Riot accounts query successful, found {len(accounts_response.data) if accounts_response.data else 0} accounts")
            logger.warning(f"Step 2c: Riot accounts query successful, found {len(accounts_response.data) if accounts_response.data else 0} accounts")
            
            # Create mapping of riot_id to summoner_name
            riot_id_to_name = {}
            for account in accounts_response.data:
                if account.get('riot_id'):
                    riot_id_to_name[account['riot_id']] = account.get('summoner_name', 'Unknown')
            
            print(f"PRINT: Step 2d: Created mapping for {len(riot_id_to_name)} accounts")
            logger.warning(f"Step 2d: Created mapping for {len(riot_id_to_name)} accounts")
            
        except Exception as db_error:
            print(f"PRINT: Step 2: Database query error: {str(db_error)}")
            logger.error(f"Step 2: Database query error: {str(db_error)}")
            return False
        
        # Step 3: Data already extracted in Step 2, so we can skip this step
        print(f"PRINT: Step 3: Data already extracted in Step 2, skipping")
        logger.warning(f"Step 3: Data already extracted in Step 2, skipping")
        
        # Step 4: Get events and apply optimization (same as rank_audit_processor.py)
        try:
            print(f"PRINT: Step 4: Fetching events")
            logger.warning(f"Step 4: Fetching events")
            events_response = supabase.table('rank_audit_events').select('*').in_('riot_id', riot_ids).order('created_at').execute()
            
            if not events_response:
                events_response = {'data': []}
            
            raw_events = events_response.data or []
            print(f"PRINT: Step 4a: Fetched {len(raw_events)} raw events")
            logger.warning(f"Step 4a: Fetched {len(raw_events)} raw events")
            
            # Apply the same optimization logic as rank_audit_processor.py
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
            
            for event in raw_events:
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
                    print(f"PRINT: Skipping invalid event: {e}")
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
                    
                    optimized_events.append(selected_event)
            
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
            events = limited_events
            
            print(f"PRINT: Step 4b: After optimization: {len(events)} events")
            logger.warning(f"Step 4b: After optimization: {len(events)} events")
            
        except Exception as events_error:
            print(f"PRINT: Step 4: Error fetching events: {str(events_error)}")
            logger.error(f"Step 4: Error fetching events: {str(events_error)}")
            events = []
        
        # Step 5: Create cache data
        try:
            print(f"PRINT: Step 5: Creating cache data")
            logger.warning(f"Step 5: Creating cache data")
            cache_data = {
                "events": events,
                "memberNames": riot_id_to_name,
                "liveData": {},  # Empty for cached data
                "cached_at": datetime.now(timezone.utc).isoformat()
            }
            print(f"PRINT: Step 5: Cache data created successfully")
            logger.warning(f"Step 5: Cache data created successfully")
        except Exception as cache_error:
            print(f"PRINT: Step 5: Error creating cache data: {str(cache_error)}")
            logger.error(f"Step 5: Error creating cache data: {str(cache_error)}")
            return False
        
        # Step 6: Store in Redis
        try:
            print(f"PRINT: Step 6: Storing in Redis")
            logger.warning(f"Step 6: Storing in Redis")
            redis_key = f"member_stats_group_{group_id}"
            cache_json = json.dumps(cache_data)
            redis_client.setex(
                redis_key,
                7200,  # 2 hours expiration
                cache_json
            )
            
            print(f"PRINT: Step 6: Successfully refreshed Redis cache for group {group_id}: {len(events)} events, {len(riot_id_to_name)} members")
            logger.warning(f"Step 6: Successfully refreshed Redis cache for group {group_id}: {len(events)} events, {len(riot_id_to_name)} members")
            return True
        except Exception as redis_error:
            print(f"PRINT: Step 6: Error storing data in Redis: {str(redis_error)}")
            logger.error(f"Step 6: Error storing data in Redis: {str(redis_error)}")
            return False
        
    except Exception as e:
        print(f"PRINT: Exception caught: {str(e)}")
        logger.error(f"Unexpected error in refresh_group_cache_data: {str(e)}")
        import traceback
        print(f"PRINT: Traceback: {traceback.format_exc()}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

@app.route('/api/cache/refresh/<int:group_id>', methods=['POST'])
def refresh_group_cache(group_id):
    """Refresh cache for a specific group with fresh data"""
    try:
        success = refresh_group_cache_data(group_id)
        
        if success:
            return jsonify({'message': f'Cache refreshed for group {group_id}'})
        else:
            return jsonify({'error': 'Failed to refresh cache'}), 500
            
    except Exception as e:
        logger.warning(f"Error in refresh_group_cache endpoint for group {group_id}: {str(e)}")
        return jsonify({'error': 'Failed to refresh cache'}), 500

@app.route('/api/riot-accounts', methods=['GET'])
def get_all_riot_accounts():
    """Get all riot accounts"""
    try:
        def get_accounts():
            return supabase.table('riot_accounts').select('riot_id, summoner_name, rank, region, created_at').execute()
        
        response = execute_supabase_query_with_retry(get_accounts)
        
        if response and response.data:
            return jsonify({'accounts': response.data})
        else:
            return jsonify({'accounts': []})
        
    except Exception as e:
        logger.error(f"Error getting all riot accounts: {str(e)}")
        return jsonify({'error': 'Failed to get riot accounts'}), 500

@app.route('/api/free-agents/<user_id>', methods=['GET'])
def get_free_agent_by_id(user_id):
    """
    Get a single free agent by their user ID (supports riot_id, summoner_name, or URL-encoded summoner_name)
    """
    try:
        # URL decode the user_id in case it's a URL-encoded summoner name
        from urllib.parse import unquote
        decoded_user_id = unquote(user_id)
        
        # Query by riot_id or summoner_name
        # First try to find by riot_id
        riot_response = supabase.table('riot_accounts').select('id, summoner_name, rank, region, date_updated, icon_id, riot_id, created_at').eq('riot_id', decoded_user_id).execute()
        
        # If not found by riot_id, try to find by summoner_name
        if not riot_response.data:
            riot_response = supabase.table('riot_accounts').select('id, summoner_name, rank, region, date_updated, icon_id, riot_id, created_at').eq('summoner_name', decoded_user_id).execute()
        
        if not riot_response.data:
            return jsonify({'error': 'Free agent not found'}), 404
        
        riot_account = riot_response.data[0]
        rank = riot_account.get('rank', 'UNRANKED')
        
        # Map database fields to FreeAgent interface
        free_agent = {
            'id': riot_account['summoner_name'],  # Use summoner_name as the ID for user-friendly URLs
            'summoner_name': riot_account.get('summoner_name', 'Unknown'),
            'elo': rank_to_elo(rank),
            'rank': rank,
            'looking_for': 'No description provided',
            'availability': [],  # No availability data from riot_accounts
            'time': '',  # No time data from riot_accounts
            'timezone': '',  # No timezone data from riot_accounts
            'experience': 'Unknown',  # We don't store peak rating, so default
            'created_date': riot_account.get('created_at', ''),
            'region': riot_account.get('region', 'Unknown'),
            'date_updated': riot_account.get('date_updated', ''),
            'icon_id': riot_account.get('icon_id'),
            'riot_id': riot_account.get('riot_id')
        }
        
        return jsonify(free_agent)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/supabase/verify', methods=['POST'])
def verify_supabase_auth():
    """Verify Supabase JWT token and return user info"""
    try:
        data = request.get_json()
        access_token = data.get('access_token')
        
        print(f"🔐 Backend: Received verification request with token: {access_token[:20]}...")
        
        if not access_token:
            return jsonify({'error': 'Access token is required'}), 400
        
        # Verify the JWT token with Supabase
        try:
            # Use Supabase to verify the token
            user = supabase.auth.get_user(access_token)
            
            if not user.user:
                return jsonify({'error': 'Invalid token'}), 401
            
            # Check if user exists in our users table by email
            def check_user_exists():
                return supabase.table('users').select('id, created_at').eq('email', user.user.email).execute()
            
            user_response = execute_supabase_query_with_retry(check_user_exists)
            
            if not user_response or not user_response.data:
                # User doesn't exist in our table, create them
                now = datetime.now(timezone.utc).isoformat()
                
                # Convert UUID to integer for the existing table structure
                # This is a temporary fix - ideally the table should be updated to use UUID
                try:
                    user_id_int = int(user.user.id.replace('-', '')[:10], 16) % 1000000  # Convert UUID to int
                except:
                    user_id_int = hash(user.user.id) % 1000000  # Fallback
                
                user_data = {
                    'id': user_id_int,  # Use integer ID for existing table
                    'email': user.user.email,
                    'created_at': now
                }
                
                def create_user():
                    return supabase.table('users').insert(user_data).execute()
                
                insert_response = execute_supabase_query_with_retry(create_user)
                if not insert_response or not insert_response.data:
                    return jsonify({'error': 'Failed to create user'}), 500
                
                new_user = insert_response.data[0]
            else:
                new_user = user_response.data[0]
            
            return jsonify({
                'success': True,
                'user': {
                    'id': str(new_user['id']),  # Convert back to string for frontend
                    'email': user.user.email,
                    'created_at': new_user['created_at'],
                    'user_metadata': user.user.user_metadata
                }
            })
            
        except Exception as e:
            return jsonify({'error': 'Token verification failed'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/supabase/user', methods=['GET'])
def get_supabase_user():
    """Get current user info from Supabase token"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        access_token = auth_header.split(' ')[1]
        
        # Verify the JWT token with Supabase
        try:
            print(f"🔐 Backend: Verifying token with Supabase...")
            user = supabase.auth.get_user(access_token)
            
            print(f"🔐 Backend: Supabase user response: {user.user.id if user.user else 'None'}")
            
            if not user.user:
                return jsonify({'error': 'Invalid token'}), 401
            
            # Get user from our users table by email
            def get_user_data():
                return supabase.table('users').select('id, created_at').eq('email', user.user.email).execute()
            
            user_response = execute_supabase_query_with_retry(get_user_data)
            
            if not user_response or not user_response.data:
                # User doesn't exist in our table, create them
                print(f"🔐 Backend: Creating new user with email: {user.user.email}")
                now = datetime.now(timezone.utc).isoformat()
                
                # Convert UUID to integer for the existing table structure
                try:
                    user_id_int = int(user.user.id.replace('-', '')[:10], 16) % 1000000  # Convert UUID to int
                except:
                    user_id_int = hash(user.user.id) % 1000000  # Fallback
                
                user_data = {
                    'id': user_id_int,  # Use integer ID for existing table
                    'email': user.user.email,
                    'created_at': now
                }
                
                def create_user():
                    return supabase.table('users').insert(user_data).execute()
                
                insert_response = execute_supabase_query_with_retry(create_user)
                if not insert_response or not insert_response.data:
                    return jsonify({'error': 'Failed to create user'}), 500
                
                new_user = insert_response.data[0]
                print(f"🔐 Backend: Created new user with ID: {new_user['id']}")
            else:
                new_user = user_response.data[0]
                print(f"🔐 Backend: Found existing user with ID: {new_user['id']}")
            
            return jsonify({
                'success': True,
                'user': {
                    'id': str(new_user['id']),  # Convert back to string for frontend
                    'email': user.user.email,
                    'created_at': new_user['created_at'],
                    'user_metadata': user.user.user_metadata
                }
            })
            
        except Exception as e:
            return jsonify({'error': 'Token verification failed'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/supabase/exchange-token', methods=['POST'])
def exchange_supabase_token():
    print("🔐 Exchange token endpoint called - START")
    print(f"🔐 Request method: {request.method}")
    print(f"🔐 Request URL: {request.url}")
    print(f"🔐 Request headers: {dict(request.headers)}")
    
    """Exchange Supabase JWT token for our custom JWT token"""
    try:
        print("🔐 Exchange token endpoint called")
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            print("❌ Missing or invalid authorization header")
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        supabase_token = auth_header.split(' ')[1]
        print(f"🔐 Supabase token received: {supabase_token[:20]}...")
        
        # Verify the Supabase JWT token
        print("🔐 Verifying Supabase token...")
        user = supabase.auth.get_user(supabase_token)
        
        if not user.user:
            print("❌ Invalid Supabase token")
            return jsonify({'error': 'Invalid Supabase token'}), 401
        
        print(f"🔐 Supabase user verified: {user.user.email}")
        
        # Get user ID from our users table
        def get_user_id():
            return supabase.table('users').select('id').eq('email', user.user.email).execute()
        
        print("🔐 Getting user ID from database...")
        user_response = execute_supabase_query_with_retry(get_user_id)
        
        if not user_response or not user_response.data:
            print("❌ User not found in database")
            return jsonify({'error': 'User not found in database'}), 404
        
        user_id = user_response.data[0]['id']
        print(f"🔐 User ID found: {user_id}")
        
        # Get user's riot account for the JWT token
        def get_riot_account():
            return supabase.table('riot_accounts').select('riot_id').eq('user_id', user_id).execute()
        
        print("🔐 Getting riot account...")
        riot_response = execute_supabase_query_with_retry(get_riot_account)
        
        if not riot_response or not riot_response.data:
            # If no riot account, create a placeholder riot_id
            riot_id = f"user_{user_id}"
            print(f"🔐 No riot account found, using placeholder: {riot_id}")
        else:
            riot_id = riot_response.data[0]['riot_id']
            print(f"🔐 Riot account found: {riot_id}")
        
        # Create our custom JWT token
        print("🔐 Creating JWT token...")
        custom_token = create_jwt_token(user_id, riot_id)
        print("🔐 JWT token created successfully")
        
        return jsonify({
            'success': True,
            'token': custom_token,
            'user_id': user_id,
            'riot_id': riot_id
        })
        
    except Exception as e:
        print(f"❌ Error in exchange token: {str(e)}")
        print(f"❌ Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        logger.error(f"Error exchanging Supabase token: {str(e)}")
        return jsonify({'error': 'Failed to exchange token', 'details': str(e)}), 500

@app.route('/api/auth/create-jwt-from-user-id', methods=['POST'])
def create_jwt_from_user_id():
    """Create JWT token directly from user ID (bypasses Supabase session issues)"""
    try:
        print("🔐 Create JWT from user ID endpoint called")
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        print(f"🔐 Creating JWT for user ID: {user_id}")
        
        # Validate that the user exists in the users table
        def validate_user():
            return supabase.table('users').select('id').eq('id', user_id).execute()
        
        user_response = execute_supabase_query_with_retry(validate_user)
        
        if not user_response or not user_response.data:
            print(f"🔐 User {user_id} not found in users table")
            return jsonify({'error': 'User not found'}), 404
        
        print(f"🔐 User {user_id} validated successfully")
        
        # Create our custom JWT token for authentication (user_id only)
        print("🔐 Creating authentication JWT token...")
        custom_token = create_auth_jwt_token(user_id)
        print("🔐 JWT token created successfully")
        
        return jsonify({
            'success': True,
            'token': custom_token,
            'user_id': user_id
        })
        
    except Exception as e:
        print(f"❌ Error creating JWT from user ID: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to create JWT token', 'details': str(e)}), 500

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    print("🔐 Test endpoint called")
    return jsonify({'message': 'Test endpoint working'})

@app.route('/api/update_server', methods=['POST'])
def update_server():
    """Simple webhook endpoint for GitHub to update the server"""
    try:
        print("🔄 Update server webhook called")
         #sdassdasd
        # Verify the request is from GitHub using webhook secret
        github_secret = os.environ.get('GITHUB_WEBHOOK_SECRET')
        if github_secret:
            # Get the signature from the request headers
            signature = request.headers.get('X-Hub-Signature-256')
            if not signature:
                print("❌ Missing GitHub signature header")
                return jsonify({'error': 'Missing signature header'}), 401
            
            # Verify the signature
            import hmac
            import hashlib
            
            # Get the raw payload
            payload = request.get_data()
            
            # Create expected signature
            expected_signature = 'sha256=' + hmac.new(
                github_secret.encode('utf-8'),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            if not hmac.compare_digest(signature, expected_signature):
                print("❌ Invalid GitHub signature")
                return jsonify({'error': 'Invalid signature'}), 401
            
            print("✅ GitHub signature verified")
        else:
            print("⚠️ No GitHub webhook secret configured, skipping verification")
        
        # Simple git pull
        import subprocess
        current_dir = '/home/phelpsm4/tftpad'
        
        print(f"🔄 Pulling latest changes from {current_dir}")
        result = subprocess.run(['git', 'pull', 'origin', 'main'], 
                              cwd=current_dir, 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Server updated successfully")
            return jsonify({'message': 'Updated successfully'}), 200
        else:
            print(f"❌ Git pull failed: {result.stderr}")
            return jsonify({'error': 'Git pull failed', 'details': result.stderr}), 500
            
    except Exception as e:
        print(f"❌ Webhook error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Webhook error: {str(e)}'}), 500

@app.route('/api/query', methods=['POST', 'OPTIONS'])
def query_openai():
    """
    Query OpenAI with user input and set16_data as system context.
    """
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({})
        # Flask-CORS should handle this, but explicitly set headers as backup
        origin = request.headers.get('Origin')
        if origin and origin in CORS_ORIGINS:
            response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response, 200
    
    try:
        # Get OpenAI API key from environment
        openai_secret = os.environ.get('OPENAI_SECRET')
        if not openai_secret:
            return jsonify({'error': 'OPENAI_SECRET not configured'}), 500
        
        # Get user query from request
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON in request body'}), 400
        
        user_query = data.get('query', '').strip()
        
        if not user_query:
            return jsonify({'error': 'Query is required'}), 400
        
        # Fetch set16_data from Supabase (excluding image column)
        champion_cost_map = {}  # Map champion names to their costs
        try:
            set16_response = supabase.table('set16_data').select('*').execute()
            set16_data = set16_response.data if set16_response.data else []
            
            # Remove image column from each row and extract champion cost mapping
            if set16_data:
                for row in set16_data:
                    # Remove image column
                    row_data = {k: v for k, v in row.items() if k != 'image'}
                    
                    # Try to extract champion name and cost from various possible structures
                    # Check if row has direct champion fields
                    if 'name' in row_data and 'cost' in row_data:
                        champ_name = str(row_data.get('name', '')).strip()
                        cost = row_data.get('cost')
                        if champ_name and cost:
                            champion_cost_map[champ_name.lower()] = cost
                    
                    # Check if row has unit_cost and a name field
                    if 'unit_cost' in row_data:
                        cost = row_data.get('unit_cost')
                        # Try different name fields
                        for name_field in ['name', 'champion', 'unit', 'apiName']:
                            if name_field in row_data:
                                champ_name = str(row_data.get(name_field, '')).strip()
                                if champ_name:
                                    # Clean up API names (remove TFT16_ prefix if present)
                                    clean_name = champ_name.replace('TFT16_', '').replace('TFT15_', '').replace('TFT_', '')
                                    champion_cost_map[clean_name.lower()] = cost
                                    champion_cost_map[champ_name.lower()] = cost
                    
                    # Check if row has nested units/champions array
                    for nested_key in ['units', 'champions']:
                        if nested_key in row_data and isinstance(row_data[nested_key], list):
                            for unit in row_data[nested_key]:
                                if isinstance(unit, dict):
                                    cost = unit.get('unit_cost') or unit.get('cost')
                                    for name_field in ['name', 'champion', 'unit', 'apiName']:
                                        if name_field in unit:
                                            champ_name = str(unit.get(name_field, '')).strip()
                                            if champ_name and cost:
                                                clean_name = champ_name.replace('TFT16_', '').replace('TFT15_', '').replace('TFT_', '')
                                                champion_cost_map[clean_name.lower()] = cost
                                                champion_cost_map[champ_name.lower()] = cost
                
                # Clean up the data for system context (remove image column)
                set16_data = [
                    {k: v for k, v in row.items() if k != 'image'}
                    for row in set16_data
                ]
        except Exception as e:
            print(f"Warning: Could not fetch set16_data: {str(e)}")
            set16_data = []
        
        # Format set16_data as system context
        system_context = "You are a helpful assistant with access to TFT Set 16 data. Use the following information to answer questions:\n\n"
        if set16_data:
            # Convert the data to a readable format
            system_context += json.dumps(set16_data, indent=2)
        else:
            system_context += "No set16_data available."
        
        # Prepare OpenAI API request
        # Note: Using /v1/chat/completions as the standard OpenAI endpoint
        # If you need /v1/conversations, please let me know as that's not a standard OpenAI endpoint
        openai_url = "https://api.openai.com/v1/chat/completions"
        headers = {
            'Authorization': f'Bearer {openai_secret}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'model': 'gpt-4o-mini',  # You can change this to gpt-4, gpt-3.5-turbo, etc.
            'messages': [
                {
                    'role': 'system',
                    'content': system_context
                },
                {
                    'role': 'user',
                    'content': user_query
                }
            ],
            'temperature': 0.7,
            'max_tokens': 1000
        }
        
        # Make request to OpenAI
        response = requests.post(openai_url, headers=headers, json=payload, timeout=30)
        
        if response.status_code != 200:
            error_data = response.json() if response.content else {}
            print(f"OpenAI API error: {response.status_code} - {error_data}")
            return jsonify({
                'error': 'OpenAI API request failed',
                'details': error_data.get('error', {}).get('message', 'Unknown error')
            }), response.status_code
        
        # Extract the response content
        openai_response = response.json()
        assistant_message = openai_response.get('choices', [{}])[0].get('message', {}).get('content', '')
        
        return jsonify({
            'response': assistant_message,
            'championCostMap': champion_cost_map
        }), 200
        
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request to OpenAI timed out'}), 504
    except requests.exceptions.RequestException as e:
        print(f"OpenAI API request exception: {str(e)}")
        return jsonify({'error': f'Failed to connect to OpenAI: {str(e)}'}), 500
    except Exception as e:
        print(f"Query endpoint error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 