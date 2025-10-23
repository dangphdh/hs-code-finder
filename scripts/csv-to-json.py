#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convert HS code data from CSV format to JSON format.

Supports multiple CSV formats:
1. Basic format: code, description, chapter, section
2. Extended format: code, menu, description, chapter, section, keywords
3. Bilingual format: code, menu, menu_vi, description, description_vi, chapter, section

Usage:
    python scripts/csv-to-json.py <csv_file> [--format basic|extended|bilingual] [--output output.json]

Examples:
    python scripts/csv-to-json.py hs-codes.csv
    python scripts/csv-to-json.py data.csv --format extended --output output.json
    python scripts/csv-to-json.py data-bilingual.csv --format bilingual
"""

import csv
import json
import argparse
import sys
from pathlib import Path
from typing import List, Dict, Optional
import re

# Fix for Windows console encoding issues
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')


class CSVToJSONConverter:
    """Convert HS code CSV data to JSON format"""
    
    def __init__(self, format_type: str = "basic"):
        """
        Initialize converter with specified format.
        
        Args:
            format_type: One of 'basic', 'extended', 'bilingual'
        """
        self.format_type = format_type.lower()
        self.validate_format()
    
    def validate_format(self):
        """Validate format type"""
        valid_formats = ['basic', 'extended', 'bilingual']
        if self.format_type not in valid_formats:
            raise ValueError(f"Invalid format. Must be one of: {', '.join(valid_formats)}")
    
    def parse_keywords(self, keywords_str: Optional[str]) -> List[str]:
        """
        Parse keywords from comma-separated string.
        
        Args:
            keywords_str: Comma-separated keywords string
            
        Returns:
            List of keywords
        """
        if not keywords_str or not keywords_str.strip():
            return []
        
        # Split by comma, strip whitespace, filter empty strings
        return [kw.strip() for kw in keywords_str.split(',') if kw.strip()]
    
    def extract_menu_from_description(self, description: str) -> str:
        """
        Extract menu name from description if not provided.
        Takes the first few words or a meaningful chunk.
        
        Args:
            description: Full description text
            
        Returns:
            Extracted menu name
        """
        if not description:
            return ""
        
        # Take first 50 characters or first sentence
        words = description.split()[:8]  # First 8 words max
        menu = ' '.join(words)
        
        # Remove trailing punctuation
        menu = re.sub(r'[,.]$', '', menu)
        
        return menu if len(menu) <= 100 else menu[:97] + "..."
    
    def convert_basic_row(self, row: Dict[str, str]) -> Optional[Dict]:
        """
        Convert basic format row: code, description, chapter, section
        
        Args:
            row: CSV row as dictionary
            
        Returns:
            HS Code dictionary or None if invalid
        """
        try:
            code = row.get('code', '').strip()
            description = row.get('description', '').strip()
            chapter = row.get('chapter', '').strip()
            section = row.get('section', '').strip()
            
            # Validate required fields
            if not all([code, description, chapter, section]):
                print(f"  ⚠ Skipping row with missing required fields: {row}")
                return None
            
            # Code should be 6 digits
            if not re.match(r'^\d{6}$', code):
                print(f"  ⚠ Skipping invalid HS code: {code}")
                return None
            
            return {
                'code': code,
                'menu': self.extract_menu_from_description(description),
                'description': description,
                'chapter': chapter,
                'section': section,
                'keywords': self._generate_keywords(description)
            }
        except Exception as e:
            print(f"  ✗ Error converting basic row: {e}")
            return None
    
    def convert_extended_row(self, row: Dict[str, str]) -> Optional[Dict]:
        """
        Convert extended format row: code, menu, description, chapter, section, keywords
        
        Args:
            row: CSV row as dictionary
            
        Returns:
            HS Code dictionary or None if invalid
        """
        try:
            code = row.get('code', '').strip()
            menu = row.get('menu', '').strip()
            description = row.get('description', '').strip()
            chapter = row.get('chapter', '').strip()
            section = row.get('section', '').strip()
            keywords_str = row.get('keywords', '').strip()
            
            # Validate required fields
            if not all([code, menu, description, chapter, section]):
                print(f"  ⚠ Skipping row with missing required fields: {row}")
                return None
            
            # Code should be 6 digits
            if not re.match(r'^\d{6}$', code):
                print(f"  ⚠ Skipping invalid HS code: {code}")
                return None
            
            return {
                'code': code,
                'menu': menu,
                'description': description,
                'chapter': chapter,
                'section': section,
                'keywords': self.parse_keywords(keywords_str) or self._generate_keywords(description)
            }
        except Exception as e:
            print(f"  ✗ Error converting extended row: {e}")
            return None
    
    def convert_bilingual_row(self, row: Dict[str, str]) -> Optional[Dict]:
        """
        Convert bilingual format row: 
        code, menu, menu_vi, description, description_vi, chapter, section, keywords, keywords_vi
        
        Args:
            row: CSV row as dictionary
            
        Returns:
            HS Code dictionary or None if invalid
        """
        try:
            code = row.get('code', '').strip()
            menu = row.get('menu', '').strip()
            menu_vi = row.get('menu_vi', '').strip()
            description = row.get('description', '').strip()
            description_vi = row.get('description_vi', '').strip()
            chapter = row.get('chapter', '').strip()
            section = row.get('section', '').strip()
            keywords_str = row.get('keywords', '').strip()
            keywords_vi_str = row.get('keywords_vi', '').strip()
            
            # Validate required fields
            if not all([code, menu, description, chapter, section]):
                print(f"  ⚠ Skipping row with missing required fields: {row}")
                return None
            
            # Code should be 6 digits
            if not re.match(r'^\d{6}$', code):
                print(f"  ⚠ Skipping invalid HS code: {code}")
                return None
            
            hs_code = {
                'code': code,
                'menu': menu,
                'description': description,
                'chapter': chapter,
                'section': section,
                'keywords': self.parse_keywords(keywords_str) or self._generate_keywords(description)
            }
            
            # Add Vietnamese translations if provided
            if menu_vi:
                hs_code['menu_vi'] = menu_vi
            if description_vi:
                hs_code['description_vi'] = description_vi
            if keywords_vi_str:
                hs_code['keywords_vi'] = self.parse_keywords(keywords_vi_str)
            
            return hs_code
        except Exception as e:
            print(f"  ✗ Error converting bilingual row: {e}")
            return None
    
    def _generate_keywords(self, description: str) -> List[str]:
        """
        Generate keywords from description by extracting meaningful terms.
        
        Args:
            description: Description text
            
        Returns:
            List of generated keywords
        """
        if not description:
            return []
        
        # Remove common words and punctuation, extract meaningful terms
        common_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'is', 'are', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'can', 'that', 'this', 'these',
            'those', 'or', 'and', 'as', 'if', 'while', 'when', 'where'
        }
        
        # Split and clean
        words = description.lower()
        words = re.sub(r'[,;:()\-]', ' ', words)
        words = words.split()
        
        # Filter meaningful words
        keywords = [w for w in words if w not in common_words and len(w) > 2]
        
        # Remove duplicates while preserving order
        seen = set()
        unique_keywords = []
        for kw in keywords:
            if kw not in seen:
                seen.add(kw)
                unique_keywords.append(kw)
        
        return unique_keywords[:10]  # Limit to 10 keywords
    
    def convert(self, csv_file: str) -> List[Dict]:
        """
        Convert CSV file to list of HS code dictionaries.
        
        Args:
            csv_file: Path to CSV file
            
        Returns:
            List of HS code dictionaries
        """
        if not Path(csv_file).exists():
            raise FileNotFoundError(f"CSV file not found: {csv_file}")
        
        hs_codes = []
        
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                if not reader.fieldnames:
                    raise ValueError("CSV file is empty or has no headers")
                
                print(f"CSV columns: {', '.join(reader.fieldnames)}")
                
                for row_num, row in enumerate(reader, start=2):
                    # Skip empty rows
                    if not any(row.values()):
                        continue
                    
                    # Convert row based on format
                    if self.format_type == 'basic':
                        hs_code = self.convert_basic_row(row)
                    elif self.format_type == 'extended':
                        hs_code = self.convert_extended_row(row)
                    elif self.format_type == 'bilingual':
                        hs_code = self.convert_bilingual_row(row)
                    else:
                        continue
                    
                    if hs_code:
                        hs_codes.append(hs_code)
                    
                    # Show progress
                    if row_num % 100 == 0:
                        print(f"  Processed {row_num} rows... ({len(hs_codes)} valid)")
        
        except csv.Error as e:
            raise ValueError(f"CSV parsing error: {e}")
        
        return hs_codes


def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description='Convert HS code data from CSV to JSON format',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python scripts/csv-to-json.py hs-codes.csv
  python scripts/csv-to-json.py data.csv --format extended
  python scripts/csv-to-json.py data-bilingual.csv --format bilingual --output my-output.json
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
        '--output',
        default='public/data/hs-codes-converted.json',
        help='Output JSON file path (default: public/data/hs-codes-converted.json)'
    )
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("CSV to JSON Converter - HS Codes")
    print("=" * 70)
    
    try:
        # Create converter
        converter = CSVToJSONConverter(format_type=args.format)
        print(f"\n📄 Using format: {args.format}")
        print(f"📂 Input file: {args.csv_file}")
        print(f"📊 Output file: {args.output}")
        
        # Convert CSV to JSON
        print("\n🔄 Converting CSV to JSON...")
        hs_codes = converter.convert(args.csv_file)
        
        if not hs_codes:
            print("✗ No valid HS codes found in CSV")
            sys.exit(1)
        
        # Prepare output data
        output_data = {
            'hs_codes': hs_codes,
            'metadata': {
                'total_codes': len(hs_codes),
                'format': args.format,
                'created_from': args.csv_file
            }
        }
        
        # Create output directory
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Save JSON
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        file_size = output_path.stat().st_size / 1024
        
        print(f"\n✓ Successfully converted {len(hs_codes)} HS codes!")
        print(f"✓ Saved to: {output_path}")
        print(f"✓ File size: {file_size:.2f} KB")
        print("\n" + "=" * 70)
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
