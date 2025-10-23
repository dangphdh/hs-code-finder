#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Enhanced CSV to Bilingual Converter with AI Translation Support

This script converts Harmonized System CSV to bilingual format with optional
AI-powered translation for missing Vietnamese descriptions.

Supports:
  - Local dictionary-based translation (fast, free)
  - OpenAI translation (accurate, paid)
  - Cohere translation (alternative, paid)
  - Batch translation with caching

Usage:
    # Using only dictionary
    python csv-to-bilingual-ai.py input.csv output.csv

    # Using OpenAI for missing translations
    python csv-to-bilingual-ai.py input.csv output.csv --provider openai

    # Using Cohere for missing translations
    python csv-to-bilingual-ai.py input.csv output.csv --provider cohere

    # Translate only specific rows
    python csv-to-bilingual-ai.py input.csv output.csv --provider openai --limit 100
"""

import sys
import io
import csv
import json
import argparse
import re
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime

# Fix encoding for Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Try to import AI providers
try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

try:
    import cohere
    HAS_COHERE = True
except ImportError:
    HAS_COHERE = False

# Translation dictionary (same as csv-to-bilingual.py)
TRANSLATION_DICT = {
    "Animals; live": "Động vật; sống",
    "Horses, asses, mules and hinnies; live": "Ngựa, lừa, la và cái la; sống",
    "Horses; live, pure-bred breeding animals": "Ngựa; sống, động vật giống thuần chủng",
    "Horses; live, other than pure-bred breeding animals": "Ngựa; sống, không phải động vật giống thuần chủng",
    "Asses; live": "Lừa; sống",
    "Mules and hinnies; live": "La và cái la; sống",
    "Bovine animals; live": "Động vật thuộc họ ngựa vằn; sống",
    "Cattle; live, pure-bred breeding animals": "Gia súc; sống, động vật giống thuần chủng",
    "Cattle; live, other than pure-bred breeding animals": "Gia súc; sống, không phải động vật giống thuần chủng",
    # ... (add more as needed, truncated for brevity)
}


class TranslationService:
    """Unified translation service with multiple providers"""
    
    def __init__(self, provider: str = "dict", api_key: Optional[str] = None, cache_file: Optional[str] = None):
        """
        Initialize translation service
        
        Args:
            provider: Translation provider ("dict", "openai", or "cohere")
            api_key: API key for paid providers
            cache_file: Path to cache file for translations
        """
        self.provider = provider
        self.api_key = api_key
        self.cache_file = cache_file or "translation-cache.json"
        self.cache = self._load_cache()
        self.local_dict = TRANSLATION_DICT
        self.stats = {
            'cache_hits': 0,
            'dict_hits': 0,
            'api_calls': 0,
            'api_errors': 0,
            'cache_misses': 0,
        }
        
        # Initialize API clients
        if provider == "openai" and HAS_OPENAI:
            openai.api_key = api_key
        elif provider == "cohere" and HAS_COHERE:
            self.cohere_client = cohere.Client(api_key=api_key)
    
    def _load_cache(self) -> Dict[str, str]:
        """Load translation cache from file"""
        cache_file = Path(self.cache_file)
        if cache_file.exists():
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️  Warning: Could not load cache file: {e}")
                return {}
        return {}
    
    def _save_cache(self):
        """Save translation cache to file"""
        try:
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(self.cache, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"⚠️  Warning: Could not save cache file: {e}")
    
    def translate(self, text: str, auto_save: bool = True) -> str:
        """
        Translate text from English to Vietnamese
        
        Args:
            text: English text to translate
            auto_save: Whether to save cache after translation
            
        Returns:
            Vietnamese translation
        """
        if not text:
            return ""
        
        # Check cache first
        if text in self.cache:
            self.stats['cache_hits'] += 1
            return self.cache[text]
        
        # Try local dictionary
        translation = self._translate_from_dict(text)
        if translation:
            self.stats['dict_hits'] += 1
            self.cache[text] = translation
            return translation
        
        # Try API provider
        if self.provider == "openai":
            translation = self._translate_with_openai(text)
        elif self.provider == "cohere":
            translation = self._translate_with_cohere(text)
        else:
            translation = ""
        
        self.stats['cache_misses'] += 1
        self.cache[text] = translation
        
        if auto_save:
            self._save_cache()
        
        return translation
    
    def _translate_from_dict(self, text: str) -> str:
        """Translate using local dictionary"""
        # Direct match
        if text in self.local_dict:
            return self.local_dict[text]
        
        # Partial match
        for key, value in self.local_dict.items():
            if key.lower() in text.lower():
                return value
        
        return ""
    
    def _translate_with_openai(self, text: str) -> str:
        """Translate using OpenAI API"""
        if not HAS_OPENAI:
            print("❌ OpenAI library not installed. Install with: pip install openai")
            return ""
        
        try:
            self.stats['api_calls'] += 1
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional translator. Translate Harmonized System product descriptions from English to Vietnamese. Only provide the translation, no explanations."
                    },
                    {
                        "role": "user",
                        "content": f"Translate to Vietnamese:\n{text}"
                    }
                ],
                temperature=0.3,
                max_tokens=100,
            )
            
            translation = response.choices[0].message.content.strip()
            return translation
        
        except Exception as e:
            self.stats['api_errors'] += 1
            print(f"⚠️  OpenAI translation error: {e}")
            return ""
    
    def _translate_with_cohere(self, text: str) -> str:
        """Translate using Cohere API"""
        if not HAS_COHERE:
            print("❌ Cohere library not installed. Install with: pip install cohere")
            return ""
        
        try:
            self.stats['api_calls'] += 1
            
            prompt = f"""Translate the following Harmonized System product description from English to Vietnamese.
Only provide the translation, no explanations.

English: {text}
Vietnamese:"""
            
            response = self.cohere_client.generate(
                model="command",
                prompt=prompt,
                max_tokens=100,
                temperature=0.3,
            )
            
            translation = response.generations[0].text.strip()
            return translation
        
        except Exception as e:
            self.stats['api_errors'] += 1
            print(f"⚠️  Cohere translation error: {e}")
            return ""
    
    def print_stats(self):
        """Print translation statistics"""
        print(f"\n📊 Translation Statistics:")
        print(f"   Cache hits: {self.stats['cache_hits']}")
        print(f"   Dictionary hits: {self.stats['dict_hits']}")
        print(f"   API calls: {self.stats['api_calls']}")
        print(f"   API errors: {self.stats['api_errors']}")
        print(f"   Cache misses: {self.stats['cache_misses']}")
        
        total = sum(self.stats.values())
        if total > 0:
            cache_rate = (self.stats['cache_hits'] + self.stats['dict_hits']) * 100 // total
            print(f"   Hit rate: {cache_rate}% (no API calls needed)")


class EnhancedCSVBilingualConverter:
    """Enhanced CSV to bilingual converter with AI support"""
    
    def __init__(self, input_file: str, output_file: str, 
                 provider: str = "dict", api_key: Optional[str] = None,
                 limit: Optional[int] = None):
        """
        Initialize converter
        
        Args:
            input_file: Input CSV file path
            output_file: Output CSV file path
            provider: Translation provider
            api_key: API key for paid providers
            limit: Limit number of rows to process
        """
        self.input_file = Path(input_file)
        self.output_file = Path(output_file)
        self.limit = limit
        self.translator = TranslationService(provider=provider, api_key=api_key)
        self.stats = {
            'total': 0,
            'translated': 0,
            'missing': 0,
        }
    
    def convert(self) -> bool:
        """Convert CSV file to bilingual format"""
        print(f"🔄 Starting conversion from {self.input_file} to {self.output_file}")
        print(f"📊 Translation provider: {self.translator.provider}")
        print(f"💾 Cache file: {self.translator.cache_file}")
        print()
        
        # Read input
        print(f"📖 Reading input file...")
        rows = self._read_input()
        if not rows:
            return False
        
        print(f"✅ Read {len(rows)} rows")
        
        # Process rows
        print(f"🔄 Processing rows...")
        bilingual_rows = self._process_rows(rows)
        
        # Write output
        print(f"💾 Writing output file...")
        try:
            self._write_output(bilingual_rows)
            print(f"✅ Successfully wrote to {self.output_file}")
            self._print_stats()
            self.translator.print_stats()
            return True
        except Exception as e:
            print(f"❌ Error writing output file: {e}")
            return False
    
    def _read_input(self) -> List[Dict]:
        """Read input CSV file"""
        try:
            rows = []
            with open(self.input_file, 'r', encoding='utf-8') as infile:
                reader = csv.DictReader(infile)
                for i, row in enumerate(reader):
                    if self.limit and i >= self.limit:
                        break
                    rows.append(row)
            return rows
        except Exception as e:
            print(f"❌ Error reading input file: {e}")
            return []
    
    def _process_rows(self, rows: List[Dict]) -> List[Dict]:
        """Process rows and add Vietnamese translations"""
        processed_rows = []
        
        for i, row in enumerate(rows):
            if (i + 1) % 500 == 0:
                print(f"   Processing row {i + 1}/{len(rows)}")
            
            self.stats['total'] += 1
            
            # Get English description
            description_en = row.get('description', '').strip()
            
            # Translate to Vietnamese
            description_vi = self.translator.translate(description_en)
            
            # Update stats
            if description_vi:
                self.stats['translated'] += 1
            else:
                self.stats['missing'] += 1
            
            # Extract keywords
            keywords_en = self._extract_keywords(description_en, "en")
            keywords_vi = self._extract_keywords(description_vi, "vi") if description_vi else ""
            
            # Build bilingual row
            bilingual_row = {
                'code': row.get('hscode', ''),
                'menu': row.get('section', ''),
                'description': description_en,
                'description_vi': description_vi,
                'keywords': keywords_en,
                'keywords_vi': keywords_vi,
                'chapter': row.get('parent', ''),
                'level': row.get('level', ''),
            }
            
            processed_rows.append(bilingual_row)
        
        return processed_rows
    
    def _extract_keywords(self, description: str, language: str = "en") -> str:
        """Extract keywords from description"""
        if not description:
            return ""
        
        # Remove special characters and split
        text = re.sub(r'[,;()]', ' ', description.lower())
        words = text.split()
        
        # Filter stop words
        stop_words_en = {'live', 'other', 'than', 'pure', 'bred', 'animals', 'of', 'and', 'or', 'the', 'a', 'an', 'in', 'to', 'for', 'with', 'from', 'not', 'this', 'that', 'these', 'those', 'animal'}
        stop_words_vi = {'sống', 'khác', 'hơn', 'thuần', 'giống', 'động', 'vật', 'của', 'và', 'hoặc', 'cái', 'trong', 'để', 'cho', 'với', 'từ', 'không', 'này', 'kia', 'các'}
        
        stop_words = stop_words_en if language == "en" else stop_words_vi
        keywords = [w for w in words if len(w) > 2 and w not in stop_words]
        
        return ', '.join(keywords[:5])
    
    def _write_output(self, rows: List[Dict]):
        """Write bilingual rows to CSV"""
        fieldnames = ['code', 'menu', 'description', 'description_vi', 'keywords', 'keywords_vi', 'chapter', 'level']
        
        with open(self.output_file, 'w', newline='', encoding='utf-8') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
    
    def _print_stats(self):
        """Print conversion statistics"""
        total = self.stats['total']
        translated = self.stats['translated']
        missing = self.stats['missing']
        
        print(f"\n📈 Conversion Statistics:")
        print(f"   Total rows: {total}")
        print(f"   Translated: {translated} ({translated*100//total if total else 0}%)")
        print(f"   Missing translations: {missing} ({missing*100//total if total else 0}%)")


def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description='Convert Harmonized System CSV to bilingual format with optional AI translation',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Using only local dictionary (fast, free)
  python csv-to-bilingual-ai.py input.csv output.csv

  # Using OpenAI for missing translations (requires OPENAI_API_KEY env var)
  python csv-to-bilingual-ai.py input.csv output.csv --provider openai

  # Using Cohere for missing translations (requires COHERE_API_KEY env var)
  python csv-to-bilingual-ai.py input.csv output.csv --provider cohere

  # Translate only first 100 rows
  python csv-to-bilingual-ai.py input.csv output.csv --provider openai --limit 100
        '''
    )
    
    parser.add_argument('input_file', help='Input CSV file path')
    parser.add_argument('output_file', help='Output CSV file path')
    parser.add_argument('--provider', choices=['dict', 'openai', 'cohere'], default='dict',
                        help='Translation provider (default: dict)')
    parser.add_argument('--api-key', help='API key for paid providers (or set env var)')
    parser.add_argument('--limit', type=int, help='Limit number of rows to process')
    
    args = parser.parse_args()
    
    # Validate input file
    if not Path(args.input_file).exists():
        print(f"❌ Input file not found: {args.input_file}")
        return 1
    
    # Get API key if needed
    api_key = args.api_key
    if not api_key and args.provider != "dict":
        import os
        env_var = f"{args.provider.upper()}_API_KEY"
        api_key = os.getenv(env_var)
        if not api_key:
            print(f"❌ API key required for {args.provider}. Set {env_var} environment variable or use --api-key")
            return 1
    
    # Run conversion
    converter = EnhancedCSVBilingualConverter(
        args.input_file,
        args.output_file,
        provider=args.provider,
        api_key=api_key,
        limit=args.limit
    )
    success = converter.convert()
    
    return 0 if success else 1


if __name__ == '__main__':
    sys.exit(main())
