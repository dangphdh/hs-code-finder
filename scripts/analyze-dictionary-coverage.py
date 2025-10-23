#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dictionary Coverage Analyzer

Analyzes the translation dictionary to show:
- Total entries in dictionary
- Coverage percentage for a given CSV file
- Missing translations that could improve coverage
- Suggested new entries to add

Usage:
    python scripts/analyze-dictionary-coverage.py [csv_file]

Example:
    python scripts/analyze-dictionary-coverage.py public/data/harmonized-system/data/harmonized-system.csv
"""

import sys
import io
import csv
import argparse
from pathlib import Path
from typing import Dict, List, Set, Tuple
from collections import Counter

# Fix encoding for Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Import translation dictionary
from csv_to_bilingual import TRANSLATION_DICT


class DictionaryCoverageAnalyzer:
    """Analyze translation dictionary coverage"""
    
    def __init__(self, csv_file: str):
        """
        Initialize analyzer
        
        Args:
            csv_file: Path to CSV file to analyze
        """
        self.csv_file = Path(csv_file)
        self.dictionary = TRANSLATION_DICT
        self.descriptions = []
        self.coverage_data = {
            'exact_matches': [],
            'partial_matches': [],
            'no_matches': [],
        }
    
    def analyze(self) -> bool:
        """Analyze dictionary coverage"""
        print(f"📊 Dictionary Coverage Analyzer")
        print(f"📖 Dictionary entries: {len(self.dictionary)}")
        print()
        
        # Read CSV
        print(f"📖 Reading CSV file...")
        if not self._read_csv():
            return False
        
        print(f"✅ Found {len(self.descriptions)} descriptions")
        print()
        
        # Analyze coverage
        print(f"🔍 Analyzing coverage...")
        self._analyze_coverage()
        
        # Print results
        self._print_results()
        
        # Print recommendations
        self._print_recommendations()
        
        return True
    
    def _read_csv(self) -> bool:
        """Read CSV file and extract descriptions"""
        try:
            with open(self.csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    description = row.get('description', '').strip()
                    if description:
                        self.descriptions.append(description)
            return True
        except Exception as e:
            print(f"❌ Error reading CSV: {e}")
            return False
    
    def _analyze_coverage(self):
        """Analyze coverage for each description"""
        for desc in self.descriptions:
            # Check for exact match
            if desc in self.dictionary:
                self.coverage_data['exact_matches'].append(desc)
                continue
            
            # Check for partial match
            matched = False
            for dict_key in self.dictionary.keys():
                if dict_key.lower() in desc.lower():
                    self.coverage_data['partial_matches'].append((desc, dict_key))
                    matched = True
                    break
            
            if not matched:
                self.coverage_data['no_matches'].append(desc)
    
    def _print_results(self):
        """Print coverage results"""
        exact = len(self.coverage_data['exact_matches'])
        partial = len(self.coverage_data['partial_matches'])
        missing = len(self.coverage_data['no_matches'])
        total = exact + partial + missing
        
        print(f"📈 Coverage Results:")
        print(f"   Exact matches: {exact:,} ({exact*100//total if total else 0}%)")
        print(f"   Partial matches: {partial:,} ({partial*100//total if total else 0}%)")
        print(f"   No matches: {missing:,} ({missing*100//total if total else 0}%)")
        print(f"   Total coverage: {(exact+partial)*100//total if total else 0}%")
        print()
        
        # Show sample exact matches
        if exact > 0:
            print(f"✅ Sample Exact Matches (showing first 5):")
            for desc in self.coverage_data['exact_matches'][:5]:
                translation = self.dictionary[desc]
                print(f"   • {desc}")
                print(f"     → {translation}")
        
        # Show sample partial matches
        if partial > 0:
            print()
            print(f"🔄 Sample Partial Matches (showing first 5):")
            for desc, dict_key in self.coverage_data['partial_matches'][:5]:
                translation = self.dictionary[dict_key]
                print(f"   • {desc}")
                print(f"     (matched key: {dict_key})")
                print(f"     → {translation}")
        
        # Show sample missing
        if missing > 0:
            print()
            print(f"❌ Sample Missing Translations (showing first 10):")
            for i, desc in enumerate(self.coverage_data['no_matches'][:10], 1):
                print(f"   {i}. {desc}")
    
    def _print_recommendations(self):
        """Print recommendations for improving coverage"""
        print()
        print(f"💡 Recommendations:")
        
        # Find frequently missing descriptions
        if self.coverage_data['no_matches']:
            print()
            print(f"🎯 Most Common Missing Descriptions:")
            
            # Group by similar patterns
            missing_by_category = {}
            for desc in self.coverage_data['no_matches']:
                # Extract first word as category
                words = desc.split(';')
                if words:
                    category = words[0].strip()
                    if category not in missing_by_category:
                        missing_by_category[category] = []
                    missing_by_category[category].append(desc)
            
            # Show top categories
            sorted_categories = sorted(
                missing_by_category.items(),
                key=lambda x: len(x[1]),
                reverse=True
            )[:5]
            
            for category, items in sorted_categories:
                print(f"   • {category} ({len(items)} items)")
        
        print()
        print(f"📝 To improve coverage:")
        print(f"   1. Add new entries to TRANSLATION_DICT in csv-to-bilingual.py")
        print(f"   2. Or create translation-cache.json with manual translations")
        print(f"   3. Or use csv-to-bilingual-ai.py with OpenAI/Cohere provider")
        print()
        print(f"🚀 Current strategy:")
        print(f"   • Dictionary: {len(self.dictionary)} entries")
        print(f"   • Expected coverage: ~26% from current dictionary")
        print(f"   • Remaining: Use AI provider for accurate translations")


def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description='Analyze translation dictionary coverage',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python scripts/analyze-dictionary-coverage.py public/data/harmonized-system/data/harmonized-system.csv
        '''
    )
    
    parser.add_argument('csv_file', help='CSV file to analyze')
    args = parser.parse_args()
    
    # Validate file
    if not Path(args.csv_file).exists():
        print(f"❌ File not found: {args.csv_file}")
        return 1
    
    # Run analysis
    analyzer = DictionaryCoverageAnalyzer(args.csv_file)
    success = analyzer.analyze()
    
    return 0 if success else 1


if __name__ == '__main__':
    sys.exit(main())
