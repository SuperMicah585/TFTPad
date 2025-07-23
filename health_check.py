#!/usr/bin/env python3
"""
Health check script for the TFT Flask API server.
This script monitors the server health and can restart it if needed.
"""

import requests
import time
import subprocess
import sys
import os
from datetime import datetime

# Configuration
SERVER_URL = "http://localhost:5001"
HEALTH_ENDPOINT = f"{SERVER_URL}/health"
CHECK_INTERVAL = 30  # seconds
MAX_FAILURES = 3  # number of consecutive failures before restart
LOG_FILE = "health_check.log"

def log_message(message):
    """Log a message with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {message}"
    print(log_entry)
    
    # Also write to log file
    with open(LOG_FILE, "a") as f:
        f.write(log_entry + "\n")

def check_server_health():
    """Check if the server is healthy"""
    try:
        response = requests.get(HEALTH_ENDPOINT, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'healthy' and data.get('database') == 'connected':
                return True, "Server is healthy"
            else:
                return False, f"Server unhealthy: {data}"
        else:
            return False, f"Server returned status code {response.status_code}"
    except requests.exceptions.RequestException as e:
        return False, f"Connection error: {str(e)}"
    except Exception as e:
        return False, f"Unexpected error: {str(e)}"

def restart_server():
    """Restart the Flask server"""
    log_message("Attempting to restart server...")
    
    try:
        # Kill existing Flask process
        subprocess.run(["pkill", "-f", "app.py"], check=False)
        time.sleep(2)
        
        # Start new Flask process
        subprocess.Popen([
            sys.executable, "app.py"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        log_message("Server restart initiated")
        return True
    except Exception as e:
        log_message(f"Failed to restart server: {str(e)}")
        return False

def main():
    """Main monitoring loop"""
    log_message("Starting health check monitor")
    
    consecutive_failures = 0
    
    while True:
        try:
            is_healthy, message = check_server_health()
            
            if is_healthy:
                if consecutive_failures > 0:
                    log_message(f"Server recovered: {message}")
                consecutive_failures = 0
            else:
                consecutive_failures += 1
                log_message(f"Health check failed ({consecutive_failures}/{MAX_FAILURES}): {message}")
                
                if consecutive_failures >= MAX_FAILURES:
                    log_message(f"Server has been unhealthy for {MAX_FAILURES} consecutive checks. Restarting...")
                    if restart_server():
                        consecutive_failures = 0
                        time.sleep(10)  # Wait for server to start
                    else:
                        log_message("Failed to restart server")
            
            time.sleep(CHECK_INTERVAL)
            
        except KeyboardInterrupt:
            log_message("Health check monitor stopped by user")
            break
        except Exception as e:
            log_message(f"Unexpected error in health check: {str(e)}")
            time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main() 