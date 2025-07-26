#!/usr/bin/env python3
"""
Script to fix datetime comparison issues in app.py
"""

import re

def fix_datetime_comparison():
    """Fix the datetime comparison issues in app.py"""
    
    # Read the file
    with open('app.py', 'r') as f:
        content = f.read()
    
    # Replace the problematic datetime comparison lines
    old_pattern = r'if event_date >= datetime\.datetime\.fromisoformat\(start_date\.replace\(\'Z\', \'\+00:00\'\)\):'
    new_pattern = '''                    # Simple date comparison without timezone issues
                    start_date_only = start_date.split('T')[0]  # Get just the date part
                    event_date_only = event_date.strftime('%Y-%m-%d')
                    if event_date_only >= start_date_only:'''
    
    # Replace both occurrences
    content = re.sub(old_pattern, new_pattern, content)
    
    # Write the fixed content back
    with open('app.py', 'w') as f:
        f.write(content)
    
    print("✅ Fixed datetime comparison issues in app.py")

if __name__ == "__main__":
    fix_datetime_comparison() 