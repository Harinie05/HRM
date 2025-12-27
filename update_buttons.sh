#!/bin/bash

# Batch script to update all buttons to use dynamic colors
# This script will find and replace hardcoded button colors with dynamic CSS variables

echo "Starting batch update of all buttons to use dynamic colors..."

# Define the base directory
BASE_DIR="c:/Users/Harinie/OneDrive/Desktop/Nutryah HRM/hr/src"

# Find all JSX files
find "$BASE_DIR" -name "*.jsx" -type f | while read file; do
    echo "Processing: $file"
    
    # Replace common button color patterns
    sed -i 's/bg-blue-600/bg-dynamic-primary/g' "$file"
    sed -i 's/bg-blue-700/bg-dynamic-primary-hover/g' "$file"
    sed -i 's/hover:bg-blue-700/hover:bg-dynamic-primary-hover/g' "$file"
    sed -i 's/hover:bg-blue-600/hover:bg-dynamic-primary-hover/g' "$file"
    
    # Replace gradient buttons
    sed -i 's/bg-gradient-to-r from-blue-600 to-indigo-600/bg-dynamic-primary/g' "$file"
    sed -i 's/hover:from-blue-700 hover:to-indigo-700/hover:bg-dynamic-primary-hover/g' "$file"
    
    echo "Updated: $file"
done

echo "Batch update completed!"