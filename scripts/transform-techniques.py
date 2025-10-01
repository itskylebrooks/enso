import json
import os
from pathlib import Path

def transform_technique_file(file_path):
    """Transform a technique JSON file from v1 to v2 schema"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Remove 'stance' field if it exists (moved to attack context)
    if 'stance' in data:
        del data['stance']
    
    # Move tags to after level and before summary
    tags = data.pop('tags', [])
    
    # Reorder top-level fields according to v2 schema
    new_data = {
        'id': data['id'],
        'slug': data['slug'],
        'name': data['name'],
        'jp': data['jp'],
        'category': data['category'],
        'attack': data['attack'],
        'weapon': data['weapon'],
        'level': data['level']
    }
    
    # Add optional aliases if they exist
    if 'aliases' in data:
        new_data['aliases'] = data['aliases']
    
    # Add summary and tags
    new_data['summary'] = data['summary']
    new_data['tags'] = tags
    
    # Transform versions
    new_versions = []
    for version in data.get('versions', []):
        new_version = {}
        
        # Handle version ID
        if version['id'] == 'v-official':
            new_version['id'] = 'v-standard'
        else:
            new_version['id'] = version['id']
        
        # Handle trainer/dojo info
        if 'sensei' in version and version['sensei'] not in ['—', '']:
            if 'Alfred Haase' in version['sensei']:
                new_version['trainerId'] = 'alfred-haase'
            # Add other trainers as needed
        
        if 'dojo' in version and version['dojo'] not in ['—', '']:
            if 'BSV Hamburg-Bramfeld' in version['dojo']:
                new_version['dojoId'] = 'bsv'
            # Add other dojos as needed
                
        # Add label override if it exists and is not "Standard"
        if 'label' in version and version['label'] != 'Standard':
            new_version['label'] = version['label']
        
        # Transform steps to stepsByEntry
        if 'steps' in version:
            # Most techniques use tenkan approach, but check for irimi patterns
            steps_data = version['steps']
            if any('irimi' in str(step).lower() for step in steps_data.get('en', [])):
                new_version['stepsByEntry'] = {
                    'irimi': steps_data
                }
            else:
                new_version['stepsByEntry'] = {
                    'tenkan': steps_data
                }
        
        # Copy other fields in the correct order
        if 'uke' in version:
            new_version['uke'] = version['uke']
        
        if 'keyPoints' in version:
            new_version['keyPoints'] = version['keyPoints']
        
        if 'commonMistakes' in version:
            new_version['commonMistakes'] = version['commonMistakes']
        
        if 'context' in version:
            new_version['context'] = version['context']
        
        # Media section
        if 'media' in version:
            new_version['media'] = version['media']
        else:
            new_version['media'] = []
        
        new_versions.append(new_version)
    
    new_data['versions'] = new_versions
    
    # Write the transformed file
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, indent=2, ensure_ascii=False)
    
    print(f"Transformed: {file_path}")

def main():
    # Get the techniques directory
    techniques_dir = Path("/Users/itskylebrooks/Code/VSCode/enso/content/techniques")
    
    # Process all JSON files except the one we already transformed
    for json_file in techniques_dir.glob("*.json"):
        if json_file.name != "katate-dori-kaiten-nage-soto.json":  # Skip the already transformed file
            try:
                transform_technique_file(json_file)
            except Exception as e:
                print(f"Error transforming {json_file}: {e}")

if __name__ == "__main__":
    main()