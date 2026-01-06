#!/bin/bash

# Script to reseed templates with updated configuration
# This will delete all existing templates and create new ones with the latest data

echo "🔄 Reseeding templates..."

response=$(curl -s -X POST http://localhost:8080/api/reseed-templates \
  -H "Content-Type: application/json")

echo "$response" | jq '.'

if echo "$response" | jq -e '.success == true' > /dev/null; then
  echo "✅ Templates reseeded successfully!"
  echo "🎉 Now create a new project to see the updated template with title, border colors, and background colors."
else
  echo "❌ Failed to reseed templates"
  exit 1
fi
