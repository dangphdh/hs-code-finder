#!/usr/bin/env python3
"""
Generate embeddings using OpenAI API for HS codes
Requires: openai, python-dotenv

Usage:
    python scripts/generate-embeddings-openai.py
"""

import json
import os
import time
from typing import List, Dict
import sys

# Try to import openai, with helpful error message
try:
    import openai
except ImportError:
    print("Error: openai package not installed")
    print("Install with: pip install openai")
    sys.exit(1)


def load_hs_codes(data_file: str = "public/data/hs-codes-basic.json") -> List[Dict]:
    """Load HS codes from JSON file"""
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('hs_codes', [])
    except FileNotFoundError:
        print(f"Error: Could not find {data_file}")
        sys.exit(1)


def generate_openai_embeddings(
    hs_codes: List[Dict],
    model: str = "text-embedding-3-small",
    api_key: str = None
) -> List[Dict]:
    """Generate embeddings using OpenAI API"""
    
    if not api_key:
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            api_key = input("Enter your OpenAI API key: ").strip()
    
    if not api_key:
        print("Error: No API key provided")
        sys.exit(1)
    
    client = openai.OpenAI(api_key=api_key)
    
    embeddings_data = []
    batch_size = 100
    total_batches = (len(hs_codes) + batch_size - 1) // batch_size
    
    print(f"Generating embeddings for {len(hs_codes)} HS codes...")
    print(f"Using model: {model}")
    print(f"Batch size: {batch_size}, Total batches: {total_batches}")
    
    for batch_num, i in enumerate(range(0, len(hs_codes), batch_size)):
        batch = hs_codes[i:i+batch_size]
        descriptions = [item['description'] for item in batch]
        
        try:
            print(f"\nProcessing batch {batch_num + 1}/{total_batches}...", end=" ")
            
            response = client.embeddings.create(
                input=descriptions,
                model=model
            )
            
            for j, embedding in enumerate(response.data):
                embeddings_data.append({
                    **batch[j],
                    'embedding': embedding.embedding,
                    'provider': 'openai',
                    'model': model
                })
            
            print(f"✓ ({len(embeddings_data)} total)")
            
            # Rate limiting - be respectful to the API
            if batch_num < total_batches - 1:
                time.sleep(0.5)
            
        except Exception as e:
            print(f"\n✗ Error processing batch {batch_num + 1}: {str(e)}")
            continue
    
    return embeddings_data


def save_embeddings(embeddings: List[Dict], model: str):
    """Save embeddings to JSON file"""
    
    output_dir = "public/data/openai-embeddings"
    os.makedirs(output_dir, exist_ok=True)
    
    # Sanitize model name for filename
    model_key = model.replace("/", "-").replace(".", "-")
    output_file = os.path.join(output_dir, f"{model_key}.json")
    
    output_data = {
        'hs_codes': embeddings,
        'metadata': {
            'provider': 'openai',
            'model': model,
            'total_codes': len(embeddings),
            'embedding_dim': len(embeddings[0]['embedding']) if embeddings else 0,
            'created_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'version': '1.0'
        }
    }
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2)
        
        file_size = os.path.getsize(output_file) / (1024 * 1024)
        print(f"\n✓ Saved {len(embeddings)} embeddings to {output_file}")
        print(f"  File size: {file_size:.2f} MB")
        
    except Exception as e:
        print(f"✗ Error saving embeddings: {str(e)}")
        sys.exit(1)


def main():
    """Main function"""
    print("=" * 60)
    print("HS Code Embeddings Generator - OpenAI")
    print("=" * 60)
    
    # Load HS codes
    hs_codes = load_hs_codes()
    print(f"\n✓ Loaded {len(hs_codes)} HS codes")
    
    # Choose model
    print("\nAvailable models:")
    print("1. text-embedding-3-small (1536 dimensions, faster, cheaper)")
    print("2. text-embedding-3-large (3072 dimensions, more accurate)")
    
    model_choice = input("\nSelect model (1 or 2): ").strip()
    
    if model_choice == "2":
        model = "text-embedding-3-large"
    else:
        model = "text-embedding-3-small"
    
    # Generate embeddings
    embeddings = generate_openai_embeddings(hs_codes, model)
    
    if not embeddings:
        print("\n✗ Failed to generate embeddings")
        sys.exit(1)
    
    # Save embeddings
    save_embeddings(embeddings, model)
    
    print("\n" + "=" * 60)
    print("✓ Done! Embeddings ready for vector search.")
    print("=" * 60)


if __name__ == "__main__":
    main()