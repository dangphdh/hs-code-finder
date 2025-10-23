#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convert Harmonized System CSV to Bilingual Format (English + Vietnamese)

Input: harmonized-system.csv (5 columns: section, hscode, description, parent, level)
Output: hs-codes-bilingual.csv (bilingual format with EN/VI translations)

Usage:
    python csv-to-bilingual.py [input_file] [output_file]

Example:
    python csv-to-bilingual.py public/data/harmonized-system/data/harmonized-system.csv samples/hs-codes-harmonized-bilingual.csv
"""

import sys
import io
import csv
import json
import argparse
import re
from pathlib import Path
from typing import Dict, List, Tuple
from datetime import datetime

# Fix encoding for Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Vietnamese translation dictionary (HS codes descriptions)
TRANSLATION_DICT = {
    # Animals & animal products
    "Animals; live": "Động vật; sống",
    "Horses, asses, mules and hinnies; live": "Ngựa, lừa, la và cái la; sống",
    "Horses; live, pure-bred breeding animals": "Ngựa; sống, động vật giống thuần chủng",
    "Horses; live, other than pure-bred breeding animals": "Ngựa; sống, không phải động vật giống thuần chủng",
    "Asses; live": "Lừa; sống",
    "Mules and hinnies; live": "La và cái la; sống",
    "Bovine animals; live": "Động vật thuộc họ ngựa vằn; sống",
    "Cattle; live, pure-bred breeding animals": "Gia súc; sống, động vật giống thuần chủng",
    "Cattle; live, other than pure-bred breeding animals": "Gia súc; sống, không phải động vật giống thuần chủng",
    
    # Meat products
    "Meat of horses": "Thịt ngựa",
    "Meat of cattle": "Thịt gia súc",
    "Swine meat": "Thịt heo",
    "Meat of sheep or goats": "Thịt cừu hoặc dê",
    "Meat of poultry": "Thịt gia cầm",
    
    # Fish & seafood
    "Fish": "Cá",
    "Crustaceans": "Động vật chân khớp nước",
    "Molluscs and other aquatic invertebrates": "Thân mềm và các động vật không xương sống dưới nước khác",
    
    # Dairy & eggs
    "Milk and milk products": "Sữa và các sản phẩm từ sữa",
    "Eggs": "Trứng",
    "Honey": "Mật ong",
    
    # Vegetables & fruits
    "Edible vegetables and certain roots and tubers": "Rau ăn được và một số rau củ nhất định",
    "Edible fruit and nuts": "Trái cây ăn được và hạt",
    "Coffee, tea and spices": "Cà phê, trà và gia vị",
    
    # Grains
    "Cereals": "Ngũ cốc",
    "Milling products": "Sản phẩm xay",
    "Oil seeds and oleaginous fruits": "Hạt dầu và quả oleaginous",
    
    # Sugar
    "Sugar and sugar confectionery": "Đường và kẹo đường",
    
    # Food industry
    "Residues and waste from the food industries": "Dư lượu và chất thải từ các ngành công nghiệp thực phẩm",
    
    # Beverages & vinegar
    "Beverages, vinegar and vinegar substitutes": "Đồ uống, dấm và các chất thay thế dấm",
    
    # Animal feed
    "Preparations of meat, of fish or of crustaceans, molluscs or other aquatic invertebrates": "Chuẩn bị từ thịt, cá hoặc động vật chân khớp, thân mềm hoặc các động vật không xương sống dưới nước khác",
    "Residues and waste from the food industries; prepared animal feed": "Dư lượng và chất thải từ các ngành công nghiệp thực phẩm; thức ăn gia súc chuẩn bị",
    
    # Mineral products
    "Mineral products": "Sản phẩm khoáng chất",
    "Salt; sulphur; earth and stone; lime and cement": "Muối; lưu huỳnh; đất và đá; vôi và xi-măng",
    "Ores, slag and ash": "Quặng, xỉ và tro",
    "Mineral fuels, mineral oils and products of their distillation": "Nhiên liệu khoáng chất, dầu khoáng chất và các sản phẩm của sự chưng cất của chúng",
    
    # Chemicals
    "Chemical and allied industries": "Các ngành công nghiệp hóa chất và liên quan",
    "Organic chemicals": "Hóa chất hữu cơ",
    "Inorganic chemicals": "Hóa chất vô cơ",
    "Pharmaceutical products": "Sản phẩm dược phẩm",
    "Fertilisers": "Phân bón",
    "Plastics and articles thereof": "Chất dẻo và các bài viết từ đó",
    "Rubber and articles thereof": "Cao su và các bài viết từ đó",
    
    # Leather
    "Hides and skins": "Da",
    "Leather": "Da thuộc",
    "Furskins and artificial fur": "Lông thú và lông nhân tạo",
    
    # Wood & paper
    "Wood and articles of wood; wood charcoal": "Gỗ và các bài viết gỗ; than chế gỗ",
    "Pulp of wood or other fibrous cellulosic material": "Bột gỗ hoặc các vật liệu xenluloza sợi khác",
    "Paper and paperboard and articles thereof": "Giấy và bìa carton và các bài viết từ đó",
    
    # Textiles
    "Textiles and textile articles": "Vải dệt và các bài viết dệt",
    "Silk": "Lụa",
    "Wool and fine or coarse animal hair": "Len và tóc mịn hoặc thô từ động vật",
    "Cotton": "Bông",
    "Yarn": "Sợi",
    "Woven fabrics": "Vải dệt",
    "Knitted or crocheted fabrics": "Vải dệt kim hoặc móc",
    "Articles of apparel": "Bài viết quần áo",
    "Footwear": "Giày",
    "Headgear": "Mũ",
    "Umbrellas": "Ô",
    "Artificial flowers": "Hoa nhân tạo",
    
    # Ceramics & glass
    "Ceramics and products of ceramics": "Gốm sứ và các sản phẩm gốm sứ",
    "Glass and glassware": "Thủy tinh và các vật từ thủy tinh",
    
    # Precious metals
    "Precious metals and metals clad with precious metal": "Kim loại quý và kim loại bọc bằng kim loại quý",
    "Pearls": "Ngọc trai",
    
    # Base metals
    "Iron and steel": "Sắt và thép",
    "Articles of iron and steel": "Bài viết từ sắt và thép",
    "Copper and articles thereof": "Đồng và các bài viết từ đó",
    "Nickel and articles thereof": "Niken và các bài viết từ đó",
    "Tin and articles thereof": "Thiếc và các bài viết từ đó",
    "Aluminium and articles thereof": "Nhôm và các bài viết từ đó",
    "Lead and articles thereof": "Chì và các bài viết từ đó",
    "Zinc and articles thereof": "Kẽm và các bài viết từ đó",
    
    # Machinery & electrical
    "Machinery and mechanical appliances": "Máy móc và các thiết bị cơ khí",
    "Electrical machinery and equipment": "Máy điện và thiết bị điện",
    "Boilers, machinery and mechanical appliances": "Nồi hơi, máy móc và các thiết bị cơ khí",
    
    # Transport
    "Vehicles other than railway or tramway rolling stock": "Phương tiện vận tải khác ngoài xe lăn đường sắt hoặc xe điện",
    "Railway or tramway locomotives, rolling stock and parts": "Tàu hỏa hoặc tàu điện, xe lăn và các bộ phận",
    "Aircraft": "Máy bay",
    "Ships and floating structures": "Tàu thuyền và các cấu trúc nổi",
    
    # Optical & precision
    "Optical instruments": "Dụng cụ quang học",
    "Surgical instruments": "Dụng cụ phẫu thuật",
    "Clocks and watches": "Đồng hồ và đồng hồ đeo tay",
    "Musical instruments": "Dụng cụ âm nhạc",
    
    # Miscellaneous
    "Miscellaneous manufactured articles": "Các bài viết sản xuất khác",
    "Toys and games": "Đồ chơi và trò chơi",
    "Arms and ammunition": "Vũ khí và đạn dược",
    "Works of art": "Tác phẩm nghệ thuật",
}


class TranslationService:
    """Service to handle translations of HS codes descriptions"""
    
    def __init__(self):
        """Initialize translation service with dictionary"""
        self.translation_dict = TRANSLATION_DICT
        self.cache = {}
    
    def translate_description(self, english_text: str) -> str:
        """
        Translate description from English to Vietnamese
        
        Args:
            english_text: English description
            
        Returns:
            Vietnamese translation or original text if not found
        """
        if english_text in self.cache:
            return self.cache[english_text]
        
        # Direct match
        if english_text in self.translation_dict:
            translation = self.translation_dict[english_text]
            self.cache[english_text] = translation
            return translation
        
        # Try to find partial matches
        for en_key, vi_value in self.translation_dict.items():
            if en_key.lower() in english_text.lower():
                self.cache[english_text] = vi_value
                return vi_value
        
        # If no translation found, return empty (will be marked for manual translation)
        self.cache[english_text] = ""
        return ""
    
    def get_keywords_from_description(self, description: str, language: str = "en") -> str:
        """
        Extract keywords from description
        
        Args:
            description: Full description
            language: Language code ("en" or "vi")
            
        Returns:
            Comma-separated keywords
        """
        # Remove special characters and split by common separators
        text = re.sub(r'[,;()]', ' ', description.lower())
        words = text.split()
        
        # Filter out common words
        stop_words_en = {'live', 'other', 'than', 'pure', 'bred', 'animals', 'of', 'and', 'or', 'the', 'a', 'an', 'in', 'to', 'for', 'with', 'from', 'not', 'this', 'that', 'these', 'those'}
        stop_words_vi = {'sống', 'khác', 'hơn', 'thuần', 'giống', 'động', 'vật', 'của', 'và', 'hoặc', 'cái', 'trong', 'để', 'cho', 'với', 'từ', 'không', 'này', 'kia', 'các'}
        
        stop_words = stop_words_en if language == "en" else stop_words_vi
        keywords = [w for w in words if len(w) > 2 and w not in stop_words]
        
        return ', '.join(keywords[:5])  # Limit to 5 keywords


class CSVBilingualConverter:
    """Convert Harmonized System CSV to bilingual format"""
    
    def __init__(self, input_file: str, output_file: str):
        """
        Initialize converter
        
        Args:
            input_file: Input CSV file path
            output_file: Output CSV file path
        """
        self.input_file = Path(input_file)
        self.output_file = Path(output_file)
        self.translator = TranslationService()
        self.stats = {
            'total': 0,
            'translated': 0,
            'partial': 0,
            'missing': 0,
        }
    
    def convert(self):
        """Convert CSV file to bilingual format"""
        print(f"🔄 Starting conversion from {self.input_file} to {self.output_file}")
        print(f"📊 Reading input file...")
        
        rows = []
        try:
            with open(self.input_file, 'r', encoding='utf-8') as infile:
                reader = csv.DictReader(infile)
                for row in reader:
                    rows.append(row)
            
            print(f"✅ Read {len(rows)} rows")
        except Exception as e:
            print(f"❌ Error reading input file: {e}")
            return False
        
        # Process rows
        print(f"🔄 Processing rows...")
        bilingual_rows = self._process_rows(rows)
        
        # Write output
        print(f"💾 Writing output file...")
        try:
            self._write_output(bilingual_rows)
            print(f"✅ Successfully converted to {self.output_file}")
            self._print_stats()
            return True
        except Exception as e:
            print(f"❌ Error writing output file: {e}")
            return False
    
    def _process_rows(self, rows: List[Dict]) -> List[Dict]:
        """
        Process rows and add Vietnamese translations
        
        Args:
            rows: Input rows
            
        Returns:
            Processed rows with bilingual content
        """
        processed_rows = []
        
        for i, row in enumerate(rows):
            if (i + 1) % 1000 == 0:
                print(f"   Processing row {i + 1}/{len(rows)}")
            
            self.stats['total'] += 1
            
            # Get English description
            description_en = row.get('description', '').strip()
            
            # Translate to Vietnamese
            description_vi = self.translator.translate_description(description_en)
            
            # Extract keywords
            keywords_en = self.translator.get_keywords_from_description(description_en, "en")
            keywords_vi = self.translator.get_keywords_from_description(description_vi, "vi") if description_vi else ""
            
            # Update stats
            if description_vi:
                self.stats['translated'] += 1
            else:
                self.stats['missing'] += 1
            
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
    
    def _write_output(self, rows: List[Dict]):
        """
        Write bilingual rows to CSV
        
        Args:
            rows: Bilingual rows to write
        """
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
        description='Convert Harmonized System CSV to bilingual format',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python csv-to-bilingual.py input.csv output.csv
  python csv-to-bilingual.py public/data/harmonized-system/data/harmonized-system.csv samples/hs-codes-harmonized-bilingual.csv
        '''
    )
    
    parser.add_argument('input_file', help='Input CSV file path')
    parser.add_argument('output_file', help='Output CSV file path')
    
    args = parser.parse_args()
    
    # Validate input file exists
    if not Path(args.input_file).exists():
        print(f"❌ Input file not found: {args.input_file}")
        return 1
    
    # Run conversion
    converter = CSVBilingualConverter(args.input_file, args.output_file)
    success = converter.convert()
    
    return 0 if success else 1


if __name__ == '__main__':
    sys.exit(main())
