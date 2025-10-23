#!/usr/bin/env python3
"""
Generate sample embeddings for testing
Uses random vectors to simulate real embeddings
"""

import json
import random
import math
import os
from typing import List, Dict

def generate_random_embedding(dim: int, seed: int = None) -> List[float]:
    """Generate a normalized random embedding vector"""
    if seed is not None:
        random.seed(seed)
    
    # Generate random values
    vector = [random.gauss(0, 1) for _ in range(dim)]
    
    # Normalize to unit vector
    magnitude = math.sqrt(sum(x**2 for x in vector))
    if magnitude > 0:
        vector = [x / magnitude for x in vector]
    
    return vector


def generate_openai_embeddings_sample():
    """Generate sample embeddings for OpenAI models"""
    
    # Load basic HS codes
    with open('public/data/hs-codes-basic.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        hs_codes = data['hs_codes']
    
    models = {
        'text-embedding-3-small': 1536,
        'text-embedding-3-large': 3072
    }
    
    for model_name, dim in models.items():
        print(f"Generating OpenAI {model_name} embeddings ({dim}d)...")
        
        embeddings_data = []
        for i, hs_code in enumerate(hs_codes):
            # Use code as seed for reproducible embeddings
            seed = hash(hs_code['code']) % (2**31)
            embedding = generate_random_embedding(dim, seed)
            
            embeddings_data.append({
                **hs_code,
                'embedding': embedding,
                'provider': 'openai',
                'model': model_name
            })
        
        # Save to file
        output_dir = 'public/data/openai-embeddings'
        os.makedirs(output_dir, exist_ok=True)
        
        model_key = model_name.replace('.', '-')
        output_file = os.path.join(output_dir, f'{model_key}.json')
        
        output_data = {
            'hs_codes': embeddings_data,
            'metadata': {
                'provider': 'openai',
                'model': model_name,
                'total_codes': len(embeddings_data),
                'embedding_dim': dim,
                'note': 'Sample embeddings for testing. Replace with real embeddings from OpenAI API.',
                'version': '1.0'
            }
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f)
        
        file_size = os.path.getsize(output_file) / 1024
        print(f"  ✓ Saved to {output_file} ({file_size:.1f} KB)")


def generate_cohere_embeddings_sample():
    """Generate sample embeddings for Cohere"""
    
    with open('public/data/hs-codes-basic.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        hs_codes = data['hs_codes']
    
    dim = 1024
    print(f"Generating Cohere embeddings ({dim}d)...")
    
    embeddings_data = []
    for hs_code in hs_codes:
        seed = hash(hs_code['code']) % (2**31)
        embedding = generate_random_embedding(dim, seed)
        
        embeddings_data.append({
            **hs_code,
            'embedding': embedding,
            'provider': 'cohere',
            'model': 'embed-english-v3.0'
        })
    
    output_dir = 'public/data/cohere-embeddings'
    os.makedirs(output_dir, exist_ok=True)
    
    output_file = os.path.join(output_dir, 'embed-english-v3-0.json')
    
    output_data = {
        'hs_codes': embeddings_data,
        'metadata': {
            'provider': 'cohere',
            'model': 'embed-english-v3.0',
            'total_codes': len(embeddings_data),
            'embedding_dim': dim,
            'note': 'Sample embeddings for testing. Replace with real embeddings from Cohere API.',
            'version': '1.0'
        }
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f)
    
    file_size = os.path.getsize(output_file) / 1024
    print(f"  ✓ Saved to {output_file} ({file_size:.1f} KB)")


def generate_huggingface_embeddings_sample():
    """Generate sample embeddings for HuggingFace"""
    
    with open('public/data/hs-codes-basic.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        hs_codes = data['hs_codes']
    
    dim = 384
    print(f"Generating HuggingFace embeddings ({dim}d)...")
    
    embeddings_data = []
    for hs_code in hs_codes:
        seed = hash(hs_code['code']) % (2**31)
        embedding = generate_random_embedding(dim, seed)
        
        embeddings_data.append({
            **hs_code,
            'embedding': embedding,
            'provider': 'huggingface',
            'model': 'sentence-transformers/all-MiniLM-L6-v2'
        })
    
    output_dir = 'public/data/huggingface-embeddings'
    os.makedirs(output_dir, exist_ok=True)
    
    output_file = os.path.join(output_dir, 'sentence-transformers-all-MiniLM-L6-v2.json')
    
    output_data = {
        'hs_codes': embeddings_data,
        'metadata': {
            'provider': 'huggingface',
            'model': 'sentence-transformers/all-MiniLM-L6-v2',
            'total_codes': len(embeddings_data),
            'embedding_dim': dim,
            'note': 'Sample embeddings for testing. Replace with real embeddings from HuggingFace API.',
            'version': '1.0'
        }
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f)
    
    file_size = os.path.getsize(output_file) / 1024
    print(f"  ✓ Saved to {output_file} ({file_size:.1f} KB)")


def main():
    """Main function"""
    print("=" * 60)
    print("Sample Embeddings Generator")
    print("=" * 60)
    print()
    
    try:
        generate_openai_embeddings_sample()
        generate_cohere_embeddings_sample()
        generate_huggingface_embeddings_sample()
        
        print()
        print("=" * 60)
        print("✓ Sample embeddings generated successfully!")
        print("=" * 60)
        print()
        print("⚠️  IMPORTANT NOTES:")
        print("1. These are SAMPLE embeddings with random vectors")
        print("2. Do NOT use in production")
        print("3. Replace with real embeddings from:")
        print("   - OpenAI: https://platform.openai.com/docs/guides/embeddings")
        print("   - Cohere: https://docs.cohere.com/reference/embed")
        print("   - HuggingFace: https://huggingface.co/docs/api-inference/")
        print()
        print("📁 Embedding files saved to:")
        print("   - public/data/openai-embeddings/")
        print("   - public/data/cohere-embeddings/")
        print("   - public/data/huggingface-embeddings/")
        print()
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())