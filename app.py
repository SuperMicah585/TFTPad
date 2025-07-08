from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json

app = Flask(__name__)

# Configure CORS to allow requests from localhost and production domain
CORS(app, origins=['http://localhost:5173', 'https://tftpad.com'])

# Riot Games API configuration
API_KEY = "RGAPI-4de1edea-9c55-46c3-b982-89bd11578a44"
BASE_URL = "https://americas.api.riotgames.com/tft/match/v1/matches"

@app.route('/api/match/<match_id>', methods=['GET'])
def get_match_data(match_id):
    """
    Fetch TFT match data from Riot Games API
    
    Args:
        match_id (str): The match ID (e.g., NA1_5320285575)
    
    Returns:
        JSON response with match data or error message
    """
    try:
        # Construct the API URL
        url = f"{BASE_URL}/{match_id}"
        
        # Set up headers with API key
        headers = {
            'X-Riot-Token': API_KEY
        }
        
        # Make the API request
        response = requests.get(url, headers=headers)
        
        # Check if the request was successful
        if response.status_code == 200:
            # Return the match data as JSON
            return jsonify(response.json())
        else:
            # Return error information
            return jsonify({
                'error': f'API request failed with status code {response.status_code}',
                'message': response.text
            }), response.status_code
            
    except requests.exceptions.RequestException as e:
        # Handle network errors
        return jsonify({
            'error': 'Network error occurred',
            'message': str(e)
        }), 500
    except Exception as e:
        # Handle any other errors
        return jsonify({
            'error': 'An unexpected error occurred',
            'message': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'TFT Match API is running'})

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with usage information"""
    return jsonify({
        'message': 'TFT Match API',
        'usage': 'GET /api/match/{match_id} to fetch match data',
        'example': '/api/match/NA1_5320285575'
    })

if __name__ == '__main__':
    # For development - in production, use a proper WSGI server
    app.run(debug=True, host='0.0.0.0', port=5000) 