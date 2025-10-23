#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate embeddings for HS codes using multiple providers.

Supports multiple embedding providers:
1. OpenAI - text-embedding-3-small, text-embedding-3-large
2. Cohere - embed-english-v3.0
3. Hugging Face - BAAI/bge-base-en-v1.5

Usage:
    python scripts/generate-embeddings.py <input_json> --provider openai [--model text-embedding-3-small]
    python scripts/generate-embeddings.py input.json --provider cohere
    python scripts/generate-embeddings.py input.json --provider huggingface

Environment Variables:
    OPENAI_API_KEY - OpenAI API key
    COHERE_API_KEY - Cohere API key
    HF_TOKEN - Hugging Face API token
"""

import json
import os
import time
import argparse
import sys
from pathlib import Path

# Fix for Windows console encoding issues
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import re


class EmbeddingsGenerator:
    """Base class for generating embeddings"""
    
    def __init__(self, provider: str, model: str = None):
        """
        Initialize embeddings generator.
        
        Args:
            provider: Embedding provider ('openai', 'cohere', 'huggingface')
            model: Model name/ID (provider-specific)
        """
        self.provider = provider.lower()
        self.model = model
        self.validate_provider()
    
    def validate_provider(self):
        """Validate provider"""
        valid_providers = ['openai', 'cohere', 'huggingface']
        if self.provider not in valid_providers:
            raise ValueError(f"Invalid provider. Must be one of: {', '.join(valid_providers)}")
    
    def load_hs_codes(self, json_file: str) -> List[Dict]:
        """
        Load HS codes from JSON file.
        
        Args:
            json_file: Path to JSON file
            
        Returns:
            List of HS code dictionaries
        """
        if not Path(json_file).exists():
            raise FileNotFoundError(f"JSON file not found: {json_file}")
        
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                hs_codes = data.get('hs_codes', [])
                
                if not hs_codes:
                    raise ValueError("No 'hs_codes' found in JSON file")
                
                return hs_codes
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON file: {e}")
    
    def _get_embedding_text(self, item: Dict) -> str:
        """
        Get text for embedding from a single HS code item.
        
        Combines English and Vietnamese descriptions for multilingual support.
        
        Args:
            item: HS code dictionary
            
        Returns:
            Combined text for embedding
        """
        texts = []
        
        # Add English description
        if 'description' in item and item['description']:
            texts.append(item['description'])
        
        # Add English keywords
        if 'keywords' in item and item['keywords']:
            # keywords might be a list or semicolon-separated string
            if isinstance(item['keywords'], list):
                keywords_text = ' '.join(item['keywords'])
            else:
                keywords_text = item['keywords'].replace(';', ' ')
            texts.append(keywords_text)
        
        # Add Vietnamese description if available
        if 'description_vi' in item and item['description_vi']:
            texts.append(item['description_vi'])
        
        # Add Vietnamese keywords if available
        if 'keywords_vi' in item and item['keywords_vi']:
            if isinstance(item['keywords_vi'], list):
                keywords_vi_text = ' '.join(item['keywords_vi'])
            else:
                keywords_vi_text = item['keywords_vi'].replace(';', ' ')
            texts.append(keywords_vi_text)
        
        # Combine all texts
        return ' | '.join(texts) if texts else 'N/A'
    
    def generate(self, hs_codes: List[Dict]) -> List[Dict]:
        """Generate embeddings (to be implemented by subclasses)"""
        raise NotImplementedError("Subclasses must implement generate()")
    
    def save_embeddings(self, embeddings: List[Dict], output_file: str = None):
        """
        Save embeddings to JSON file.
        
        Args:
            embeddings: List of embeddings with HS code data
            output_file: Output file path (auto-generated if None)
        """
        if not output_file:
            model_key = (self.model or 'default').replace('/', '-').replace('.', '-')
            output_dir = f"public/data/{self.provider}-embeddings"
            output_file = os.path.join(output_dir, f"{model_key}.json")
        
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Prepare metadata
        embedding_dim = len(embeddings[0]['embedding']) if embeddings else 0
        
        output_data = {
            'hs_codes': embeddings,
            'metadata': {
                'provider': self.provider,
                'model': self.model,
                'total_codes': len(embeddings),
                'embedding_dim': embedding_dim,
                'created_at': time.strftime('%Y-%m-%d %H:%M:%S'),
                'version': '1.0'
            }
        }
        
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2)
            
            file_size = output_path.stat().st_size / (1024 * 1024)
            print(f"\n✓ Saved {len(embeddings)} embeddings to {output_file}")
            print(f"  File size: {file_size:.2f} MB")
            print(f"  Embedding dimension: {embedding_dim}")
            
        except Exception as e:
            print(f"✗ Error saving embeddings: {e}")
            sys.exit(1)


class OpenAIEmbeddingsGenerator(EmbeddingsGenerator):
    """Generate embeddings using OpenAI API"""
    
    def __init__(self, model: str = "text-embedding-3-small"):
        """Initialize OpenAI generator"""
        super().__init__('openai', model)
        
        try:
            import openai
            self.openai = openai
        except ImportError:
            print("Error: openai package not installed")
            print("Install with: pip install openai")
            sys.exit(1)
    
    def generate(self, hs_codes: List[Dict]) -> List[Dict]:
        """
        Generate embeddings using OpenAI API.
        
        Args:
            hs_codes: List of HS code dictionaries
            
        Returns:
            List of embeddings with HS code data
        """
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            api_key = input("Enter your OpenAI API key: ").strip()
        
        if not api_key:
            print("Error: No API key provided")
            sys.exit(1)
        
        client = self.openai.OpenAI(api_key=api_key)
        embeddings_data = []
        batch_size = 100
        total_batches = (len(hs_codes) + batch_size - 1) // batch_size
        
        print(f"\n🔄 Generating embeddings for {len(hs_codes)} HS codes")
        print(f"   Provider: OpenAI")
        print(f"   Model: {self.model}")
        print(f"   Batch size: {batch_size}")
        print(f"   Total batches: {total_batches}")
        print(f"   Language: Multilingual (EN + VI)\n")
        
        try:
            for batch_num in range(total_batches):
                start_idx = batch_num * batch_size
                end_idx = min(start_idx + batch_size, len(hs_codes))
                batch = hs_codes[start_idx:end_idx]
                
                # Combine English and Vietnamese text for embedding
                texts = [self._get_embedding_text(item) for item in batch]
                
                print(f"Processing batch {batch_num + 1}/{total_batches}...", end=" ", flush=True)
                
                try:
                    response = client.embeddings.create(
                        input=texts,
                        model=self.model
                    )
                    
                    for j, embedding in enumerate(response.data):
                        embeddings_data.append({
                            **batch[j],
                            'embedding': embedding.embedding,
                            'provider': self.provider,
                            'model': self.model,
                            'embedding_text': texts[j]
                        })
                    
                    print(f"✓ ({len(embeddings_data)} total)")
                    
                    # Rate limiting
                    if batch_num < total_batches - 1:
                        time.sleep(0.5)
                
                except self.openai.RateLimitError:
                    print("⏱ Rate limit reached, waiting...")
                    time.sleep(30)
                    batch_num -= 1
                    continue
                
        except Exception as e:
            print(f"\n✗ Error: {e}")
            sys.exit(1)
        
        return embeddings_data


class CohereEmbeddingsGenerator(EmbeddingsGenerator):
    """Generate embeddings using Cohere API"""
    
    def __init__(self, model: str = "embed-english-v3.0"):
        """Initialize Cohere generator"""
        super().__init__('cohere', model)
        
        try:
            import cohere
            self.cohere = cohere
        except ImportError:
            print("Error: cohere package not installed")
            print("Install with: pip install cohere")
            sys.exit(1)
    
    def generate(self, hs_codes: List[Dict]) -> List[Dict]:
        """
        Generate embeddings using Cohere API.
        
        Args:
            hs_codes: List of HS code dictionaries
            
        Returns:
            List of embeddings with HS code data
        """
        api_key = os.getenv('COHERE_API_KEY')
        if not api_key:
            api_key = input("Enter your Cohere API key: ").strip()
        
        if not api_key:
            print("Error: No API key provided")
            sys.exit(1)
        
        client = self.cohere.ClientV2(api_key=api_key)
        embeddings_data = []
        batch_size = 100
        total_batches = (len(hs_codes) + batch_size - 1) // batch_size
        
        print(f"\n🔄 Generating embeddings for {len(hs_codes)} HS codes")
        print(f"   Provider: Cohere")
        print(f"   Model: {self.model}")
        print(f"   Batch size: {batch_size}")
        print(f"   Total batches: {total_batches}")
        print(f"   Language: Multilingual (EN + VI)\n")
        
        try:
            for batch_num in range(total_batches):
                start_idx = batch_num * batch_size
                end_idx = min(start_idx + batch_size, len(hs_codes))
                batch = hs_codes[start_idx:end_idx]
                
                # Combine English and Vietnamese text for embedding
                texts = [self._get_embedding_text(item) for item in batch]
                
                print(f"Processing batch {batch_num + 1}/{total_batches}...", end=" ", flush=True)
                
                try:
                    response = client.embed(
                        texts=texts,
                        model=self.model,
                        input_type='search_document'
                    )
                    
                    for j, embedding in enumerate(response.embeddings):
                        embeddings_data.append({
                            **batch[j],
                            'embedding': embedding,
                            'provider': self.provider,
                            'model': self.model,
                            'embedding_text': texts[j]
                        })
                    
                    print(f"✓ ({len(embeddings_data)} total)")
                    
                    if batch_num < total_batches - 1:
                        time.sleep(0.5)
                
                except Exception as e:
                    print(f"\n⚠ Error in batch {batch_num + 1}: {e}")
                    continue
        
        except Exception as e:
            print(f"\n✗ Error: {e}")
            sys.exit(1)
        
        return embeddings_data


class HuggingFaceEmbeddingsGenerator(EmbeddingsGenerator):
    """Generate embeddings using Hugging Face models"""
    
    def __init__(self, model: str = "BAAI/bge-base-en-v1.5"):
        """Initialize Hugging Face generator"""
        super().__init__('huggingface', model)
        
        try:
            from sentence_transformers import SentenceTransformer
            self.SentenceTransformer = SentenceTransformer
        except ImportError:
            print("Error: sentence-transformers package not installed")
            print("Install with: pip install sentence-transformers")
            sys.exit(1)
    
    def generate(self, hs_codes: List[Dict]) -> List[Dict]:
        """
        Generate embeddings using Hugging Face models locally.
        
        Args:
            hs_codes: List of HS code dictionaries
            
        Returns:
            List of embeddings with HS code data
        """
        embeddings_data = []
        batch_size = 32
        total_batches = (len(hs_codes) + batch_size - 1) // batch_size
        
        print(f"\n🔄 Generating embeddings for {len(hs_codes)} HS codes")
        print(f"   Provider: Hugging Face")
        print(f"   Model: {self.model}")
        print(f"   Batch size: {batch_size}")
        print(f"   Total batches: {total_batches}")
        print(f"   Language: Multilingual (EN + VI)\n")
        
        try:
            print("Loading model... (this may take a moment)")
            model = self.SentenceTransformer(self.model)
            embedding_dim = model.get_sentence_embedding_dimension()
            print(f"✓ Model loaded (embedding dimension: {embedding_dim})\n")
            
            for batch_num in range(total_batches):
                start_idx = batch_num * batch_size
                end_idx = min(start_idx + batch_size, len(hs_codes))
                batch = hs_codes[start_idx:end_idx]
                
                # Combine English and Vietnamese text for embedding
                texts = [self._get_embedding_text(item) for item in batch]
                
                print(f"Processing batch {batch_num + 1}/{total_batches}...", end=" ", flush=True)
                
                try:
                    embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
                    
                    for j, embedding in enumerate(embeddings):
                        embeddings_data.append({
                            **batch[j],
                            'embedding': embedding.tolist(),
                            'provider': self.provider,
                            'model': self.model,
                            'embedding_text': texts[j]
                        })
                    
                    print(f"✓ ({len(embeddings_data)} total)")
                
                except Exception as e:
                    print(f"\n⚠ Error in batch {batch_num + 1}: {e}")
                    continue
        
        except Exception as e:
            print(f"\n✗ Error: {e}")
            sys.exit(1)
        
        return embeddings_data


def get_generator(provider: str, model: str = None) -> EmbeddingsGenerator:
    """
    Get appropriate embeddings generator for provider.
    
    Args:
        provider: Provider name
        model: Model name (optional)
        
    Returns:
        Appropriate EmbeddingsGenerator subclass instance
    """
    provider = provider.lower()
    
    if provider == 'openai':
        return OpenAIEmbeddingsGenerator(model or 'text-embedding-3-small')
    elif provider == 'cohere':
        return CohereEmbeddingsGenerator(model or 'embed-english-v3.0')
    elif provider == 'huggingface':
        return HuggingFaceEmbeddingsGenerator(model or 'BAAI/bge-base-en-v1.5')
    else:
        raise ValueError(f"Unknown provider: {provider}")


def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description='Generate embeddings for HS codes',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Providers:
  openai         - OpenAI API (requires OPENAI_API_KEY env var)
  cohere         - Cohere API (requires COHERE_API_KEY env var)
  huggingface    - Hugging Face local models (no API key needed)

OpenAI Models:
  text-embedding-3-small   (1536 dimensions, faster, cheaper)
  text-embedding-3-large   (3072 dimensions, more accurate)

Cohere Models:
  embed-english-v3.0       (1024 dimensions)

HuggingFace Models:
  BAAI/bge-base-en-v1.5    (768 dimensions)
  BAAI/bge-small-en-v1.5   (384 dimensions, faster)
  all-MiniLM-L6-v2         (384 dimensions, lightweight)

Examples:
  python scripts/generate-embeddings.py hs-codes.json --provider openai
  python scripts/generate-embeddings.py hs-codes.json --provider openai --model text-embedding-3-large
  python scripts/generate-embeddings.py hs-codes.json --provider cohere
  python scripts/generate-embeddings.py hs-codes.json --provider huggingface
  python scripts/generate-embeddings.py hs-codes.json --provider huggingface --model BAAI/bge-small-en-v1.5
        '''
    )
    
    parser.add_argument('input_json', help='Input JSON file with HS codes')
    parser.add_argument(
        '--provider',
        required=True,
        choices=['openai', 'cohere', 'huggingface'],
        help='Embedding provider'
    )
    parser.add_argument(
        '--model',
        help='Model name (provider-specific, optional)'
    )
    parser.add_argument(
        '--output',
        help='Output JSON file path (auto-generated if not specified)'
    )
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("Embeddings Generator - HS Codes")
    print("=" * 70)
    
    try:
        # Create generator
        generator = get_generator(args.provider, args.model)
        
        print(f"\n📄 Input file: {args.input_json}")
        if args.output:
            print(f"📊 Output file: {args.output}")
        
        # Load HS codes
        print("\n📂 Loading HS codes...")
        hs_codes = generator.load_hs_codes(args.input_json)
        print(f"✓ Loaded {len(hs_codes)} HS codes")
        
        # Generate embeddings
        embeddings = generator.generate(hs_codes)
        
        if not embeddings:
            print("✗ Failed to generate embeddings")
            sys.exit(1)
        
        # Save embeddings
        generator.save_embeddings(embeddings, args.output)
        
        print("\n" + "=" * 70)
        print("✓ Done! Embeddings ready for vector search.")
        print("=" * 70)
    
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
