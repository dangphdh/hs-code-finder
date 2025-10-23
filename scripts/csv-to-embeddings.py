#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Complete pipeline for transforming HS code data from CSV to embeddings.

This script orchestrates the entire workflow:
1. Convert CSV to JSON format
2. Generate embeddings using specified provider
3. Optional: Convert embeddings to binary format

Usage:
    python scripts/csv-to-embeddings.py <csv_file> --provider openai [options]

Examples:
    python scripts/csv-to-embeddings.py hs-codes.csv --provider openai
    python scripts/csv-to-embeddings.py data.csv --provider huggingface --model BAAI/bge-small-en-v1.5
    python scripts/csv-to-embeddings.py data-bilingual.csv --format bilingual --provider openai --to-binary
"""

import json
import os
import sys
import time
import argparse
import subprocess
from pathlib import Path
from typing import Dict, Optional, Tuple
from datetime import datetime

# Fix for Windows console encoding issues
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')


class EmbeddingsPipeline:
    """Orchestrate the complete CSV to embeddings pipeline"""
    
    def __init__(self, csv_file: str, provider: str, format_type: str = 'basic', 
                 model: str = None, output_json: str = None, to_binary: bool = False):
        """
        Initialize pipeline.
        
        Args:
            csv_file: Input CSV file path
            provider: Embedding provider ('openai', 'cohere', 'huggingface')
            format_type: CSV format ('basic', 'extended', 'bilingual')
            model: Embedding model (provider-specific)
            output_json: Output JSON file for embeddings
            to_binary: Whether to convert embeddings to binary format
        """
        self.csv_file = csv_file
        self.provider = provider.lower()
        self.format_type = format_type.lower()
        self.model = model
        self.to_binary = to_binary
        self.start_time = time.time()
        
        # Auto-generate file paths
        self.interim_json = output_json or f"temp_hs-codes-{int(time.time())}.json"
        self.output_json = output_json or f"public/data/hs-codes-{provider}-embeddings.json"
        
        self.validate()
    
    def validate(self):
        """Validate inputs"""
        if not Path(self.csv_file).exists():
            raise FileNotFoundError(f"CSV file not found: {self.csv_file}")
        
        valid_providers = ['openai', 'cohere', 'huggingface']
        if self.provider not in valid_providers:
            raise ValueError(f"Invalid provider: {self.provider}")
        
        valid_formats = ['basic', 'extended', 'bilingual']
        if self.format_type not in valid_formats:
            raise ValueError(f"Invalid format: {self.format_type}")
    
    def run_csv_to_json(self) -> str:
        """
        Step 1: Convert CSV to JSON.
        
        Returns:
            Path to generated JSON file
        """
        print("\n" + "=" * 70)
        print("STEP 1: Converting CSV to JSON")
        print("=" * 70)
        
        cmd = [
            'python',
            'scripts/csv-to-json.py',
            self.csv_file,
            '--format', self.format_type,
            '--output', self.interim_json
        ]
        
        print(f"\nRunning: {' '.join(cmd)}")
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            print(result.stdout)
            
            if not Path(self.interim_json).exists():
                raise RuntimeError(f"JSON file not created: {self.interim_json}")
            
            return self.interim_json
        
        except subprocess.CalledProcessError as e:
            print(f"✗ Error: {e.stderr}")
            sys.exit(1)
    
    def run_generate_embeddings(self, json_file: str) -> str:
        """
        Step 2: Generate embeddings from JSON.
        
        Args:
            json_file: Input JSON file
            
        Returns:
            Path to generated embeddings file
        """
        print("\n" + "=" * 70)
        print("STEP 2: Generating Embeddings")
        print("=" * 70)
        
        cmd = [
            'python',
            'scripts/generate-embeddings.py',
            json_file,
            '--provider', self.provider
        ]
        
        if self.model:
            cmd.extend(['--model', self.model])
        
        cmd.extend(['--output', self.output_json])
        
        print(f"\nRunning: {' '.join(cmd)}")
        print(f"Provider: {self.provider}")
        if self.model:
            print(f"Model: {self.model}")
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            print(result.stdout)
            
            if not Path(self.output_json).exists():
                raise RuntimeError(f"Embeddings file not created: {self.output_json}")
            
            return self.output_json
        
        except subprocess.CalledProcessError as e:
            print(f"✗ Error: {e.stderr}")
            sys.exit(1)
    
    def run_convert_to_binary(self, embeddings_file: str) -> str:
        """
        Step 3 (Optional): Convert embeddings to binary format.
        
        Args:
            embeddings_file: Input embeddings JSON file
            
        Returns:
            Path to generated binary file
        """
        print("\n" + "=" * 70)
        print("STEP 3: Converting Embeddings to Binary Format")
        print("=" * 70)
        
        # Note: This would use the convert-embeddings-to-binary.mjs script
        # For now, we'll note this as a future step
        print("\n📌 Binary conversion is handled separately via npm script:")
        print("   npm run convert:embeddings")
        print("\nBinary files will be created alongside JSON files.")
        
        return embeddings_file
    
    def cleanup(self):
        """Clean up temporary files"""
        if self.interim_json != self.output_json:
            if Path(self.interim_json).exists():
                try:
                    Path(self.interim_json).unlink()
                    print(f"✓ Cleaned up temporary file: {self.interim_json}")
                except Exception as e:
                    print(f"⚠ Could not delete temporary file: {e}")
    
    def get_file_stats(self, file_path: str) -> Dict:
        """Get file statistics"""
        if not Path(file_path).exists():
            return {}
        
        path = Path(file_path)
        size_kb = path.stat().st_size / 1024
        size_mb = size_kb / 1024
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                hs_codes = data.get('hs_codes', [])
                return {
                    'size_kb': f"{size_kb:.2f}",
                    'size_mb': f"{size_mb:.2f}",
                    'count': len(hs_codes),
                    'embedding_dim': len(hs_codes[0].get('embedding', [])) if hs_codes and 'embedding' in hs_codes[0] else 0
                }
        except Exception:
            return {'size_kb': f"{size_kb:.2f}", 'size_mb': f"{size_mb:.2f}"}
    
    def print_report(self, json_file: str, embeddings_file: str):
        """Print final report"""
        elapsed = time.time() - self.start_time
        
        json_stats = self.get_file_stats(json_file)
        embeddings_stats = self.get_file_stats(embeddings_file)
        
        print("\n" + "=" * 70)
        print("PIPELINE COMPLETE - Summary Report")
        print("=" * 70)
        
        print(f"\n⏱ Total time: {elapsed:.1f} seconds")
        
        print(f"\n📄 Step 1 Output (JSON):")
        print(f"   File: {json_file}")
        print(f"   Size: {json_stats.get('size_mb', 'N/A')} MB ({json_stats.get('size_kb', 'N/A')} KB)")
        print(f"   HS Codes: {json_stats.get('count', 'N/A')}")
        
        print(f"\n🔍 Step 2 Output (Embeddings):")
        print(f"   File: {embeddings_file}")
        print(f"   Size: {embeddings_stats.get('size_mb', 'N/A')} MB ({embeddings_stats.get('size_kb', 'N/A')} KB)")
        print(f"   HS Codes: {embeddings_stats.get('count', 'N/A')}")
        print(f"   Embedding Dim: {embeddings_stats.get('embedding_dim', 'N/A')}")
        print(f"   Provider: {self.provider}")
        if self.model:
            print(f"   Model: {self.model}")
        
        if self.to_binary:
            print(f"\n⚙️ Next Step (Binary Conversion):")
            print(f"   Run: npm run convert:embeddings")
            print(f"   This will create {embeddings_stats.get('size_mb', 'N/A')} MB of additional binary files")
        
        print("\n" + "=" * 70)
        print("✓ HS Code data successfully transformed from CSV to embeddings!")
        print("=" * 70)
    
    def run(self):
        """Execute the complete pipeline"""
        print("=" * 70)
        print("CSV → JSON → Embeddings Pipeline")
        print("=" * 70)
        
        print(f"\n📝 Configuration:")
        print(f"   Input CSV: {self.csv_file}")
        print(f"   CSV Format: {self.format_type}")
        print(f"   Provider: {self.provider}")
        if self.model:
            print(f"   Model: {self.model}")
        print(f"   Output JSON: {self.output_json}")
        if self.to_binary:
            print(f"   Convert to Binary: Yes")
        
        try:
            # Step 1: Convert CSV to JSON
            json_file = self.run_csv_to_json()
            
            # Step 2: Generate embeddings
            embeddings_file = self.run_generate_embeddings(json_file)
            
            # Step 3: Optional binary conversion
            if self.to_binary:
                self.run_convert_to_binary(embeddings_file)
            
            # Cleanup
            self.cleanup()
            
            # Print report
            self.print_report(json_file, embeddings_file)
        
        except KeyboardInterrupt:
            print("\n\n⚠ Pipeline interrupted by user")
            self.cleanup()
            sys.exit(1)
        
        except Exception as e:
            print(f"\n✗ Pipeline error: {e}")
            self.cleanup()
            sys.exit(1)


def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description='Transform HS code data from CSV to embeddings',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
CSV Formats:
  basic       - code, description, chapter, section
  extended    - code, menu, description, chapter, section, keywords
  bilingual   - code, menu, menu_vi, description, description_vi, chapter, section, keywords, keywords_vi

Providers:
  openai      - OpenAI text-embedding-3-small (default) or text-embedding-3-large
  cohere      - Cohere embed-english-v3.0
  huggingface - Hugging Face models (local, no API key needed)

Examples:
  # Basic CSV to embeddings (OpenAI)
  python scripts/csv-to-embeddings.py hs-codes.csv --provider openai
  
  # Extended CSV with Cohere
  python scripts/csv-to-embeddings.py data-extended.csv --format extended --provider cohere
  
  # Bilingual CSV with HuggingFace
  python scripts/csv-to-embeddings.py data-bilingual.csv --format bilingual --provider huggingface
  
  # With binary conversion
  python scripts/csv-to-embeddings.py hs-codes.csv --provider openai --to-binary
  
  # Custom model
  python scripts/csv-to-embeddings.py hs-codes.csv --provider openai --model text-embedding-3-large
        '''
    )
    
    parser.add_argument('csv_file', help='Input CSV file path')
    parser.add_argument(
        '--format',
        choices=['basic', 'extended', 'bilingual'],
        default='basic',
        help='CSV format type (default: basic)'
    )
    parser.add_argument(
        '--provider',
        required=True,
        choices=['openai', 'cohere', 'huggingface'],
        help='Embedding provider'
    )
    parser.add_argument(
        '--model',
        help='Embedding model (provider-specific, optional)'
    )
    parser.add_argument(
        '--output',
        help='Output embeddings JSON file path (auto-generated if not specified)'
    )
    parser.add_argument(
        '--to-binary',
        action='store_true',
        help='Convert embeddings to binary format after generation'
    )
    
    args = parser.parse_args()
    
    # Run pipeline
    pipeline = EmbeddingsPipeline(
        csv_file=args.csv_file,
        provider=args.provider,
        format_type=args.format,
        model=args.model,
        output_json=args.output,
        to_binary=args.to_binary
    )
    
    pipeline.run()


if __name__ == "__main__":
    main()
