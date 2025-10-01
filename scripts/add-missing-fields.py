import json
import os
from pathlib import Path

def add_missing_fields_to_versions(file_path):
    """Add missing keyPoints and commonMistakes fields to technique versions"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified = False
    
    for version in data.get('versions', []):
        # Add keyPoints if missing
        if 'keyPoints' not in version:
            version['keyPoints'] = {
                "en": [],
                "de": []
            }
            modified = True
        
        # Add commonMistakes if missing
        if 'commonMistakes' not in version:
            version['commonMistakes'] = {
                "en": [],
                "de": []
            }
            modified = True
        
        # Add context if missing
        if 'context' not in version:
            version['context'] = {
                "en": "",
                "de": ""
            }
            modified = True
    
    if modified:
        # Write the updated file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"Added missing fields to: {file_path}")
    else:
        print(f"No fields needed: {file_path}")

def main():
    # Get the techniques directory
    techniques_dir = Path("/Users/itskylebrooks/Code/VSCode/enso/content/techniques")
    
    # Process all JSON files 
    for json_file in techniques_dir.glob("*.json"):
        try:
            add_missing_fields_to_versions(json_file)
        except Exception as e:
            print(f"Error processing {json_file}: {e}")

if __name__ == "__main__":
    main()