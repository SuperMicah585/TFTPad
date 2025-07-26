#!/usr/bin/env python3

# Read the file
with open('app.py', 'r') as f:
    content = f.read()

# Replace the timezone-naive datetime.now() with timezone-aware version
# This fixes the "can't subtract offset-naive and offset-aware datetimes" error
content = content.replace(
    'today = datetime.datetime.now()',
    'today = datetime.datetime.now(datetime.timezone.utc)'
)

# Write the file back
with open('app.py', 'w') as f:
    f.write(content)

print("✅ Fixed timezone issue in app.py")
print("Changed datetime.datetime.now() to datetime.datetime.now(datetime.timezone.utc)") 