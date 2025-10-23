#!/usr/bin/env node

/**
 * Transform HS code data from CSV to JSON format
 * 
 * Usage:
 *   node scripts/csv-to-json.mjs <csv_file> [--format basic|extended|bilingual] [--output output.json]
 * 
 * Examples:
 *   node scripts/csv-to-json.mjs hs-codes.csv
 *   node scripts/csv-to-json.mjs data.csv --format extended --output output.json
 *   node scripts/csv-to-json.mjs data-bilingual.csv --format bilingual
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class CSVToJSONConverter {
  constructor(format = 'basic') {
    this.format = format.toLowerCase();
    this.validateFormat();
  }

  validateFormat() {
    const validFormats = ['basic', 'extended', 'bilingual'];
    if (!validFormats.includes(this.format)) {
      throw new Error(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
    }
  }

  parseKeywords(keywordsStr) {
    if (!keywordsStr || !keywordsStr.trim()) return [];
    return keywordsStr.split(',').map(kw => kw.trim()).filter(kw => kw);
  }

  extractMenuFromDescription(description) {
    if (!description) return '';
    const words = description.split(/\s+/).slice(0, 8);
    let menu = words.join(' ');
    menu = menu.replace(/[,.]$/, '');
    return menu.length <= 100 ? menu : menu.substring(0, 97) + '...';
  }

  generateKeywords(description) {
    if (!description) return [];
    
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'that', 'this', 'these',
      'those', 'as', 'if', 'while', 'when', 'where'
    ]);

    let words = description.toLowerCase();
    words = words.replace(/[,;:()\-]/g, ' ');
    words = words.split(/\s+/);

    const keywords = words.filter(w => !commonWords.has(w) && w.length > 2);
    
    const seen = new Set();
    const unique = [];
    for (const kw of keywords) {
      if (!seen.has(kw)) {
        seen.add(kw);
        unique.push(kw);
      }
    }

    return unique.slice(0, 10);
  }

  convertBasicRow(row) {
    try {
      const code = (row.code || '').trim();
      const description = (row.description || '').trim();
      const chapter = (row.chapter || '').trim();
      const section = (row.section || '').trim();

      if (!code || !description || !chapter || !section) {
        console.log(`  ⚠ Skipping row with missing fields: ${JSON.stringify(row)}`);
        return null;
      }

      if (!/^\d{6}$/.test(code)) {
        console.log(`  ⚠ Skipping invalid HS code: ${code}`);
        return null;
      }

      return {
        code,
        menu: this.extractMenuFromDescription(description),
        description,
        chapter,
        section,
        keywords: this._generateKeywords(description)
      };
    } catch (e) {
      console.log(`  ✗ Error converting basic row: ${e.message}`);
      return null;
    }
  }

  convertExtendedRow(row) {
    try {
      const code = (row.code || '').trim();
      const menu = (row.menu || '').trim();
      const description = (row.description || '').trim();
      const chapter = (row.chapter || '').trim();
      const section = (row.section || '').trim();
      const keywordsStr = (row.keywords || '').trim();

      if (!code || !menu || !description || !chapter || !section) {
        console.log(`  ⚠ Skipping row with missing fields: ${JSON.stringify(row)}`);
        return null;
      }

      if (!/^\d{6}$/.test(code)) {
        console.log(`  ⚠ Skipping invalid HS code: ${code}`);
        return null;
      }

      return {
        code,
        menu,
        description,
        chapter,
        section,
        keywords: this.parseKeywords(keywordsStr) || this.generateKeywords(description)
      };
    } catch (e) {
      console.log(`  ✗ Error converting extended row: ${e.message}`);
      return null;
    }
  }

  convertBilingualRow(row) {
    try {
      const code = (row.code || '').trim();
      const menu = (row.menu || '').trim();
      const menuVi = (row.menu_vi || '').trim();
      const description = (row.description || '').trim();
      const descriptionVi = (row.description_vi || '').trim();
      const chapter = (row.chapter || '').trim();
      const section = (row.section || '').trim();
      const keywordsStr = (row.keywords || '').trim();
      const keywordsViStr = (row.keywords_vi || '').trim();

      if (!code || !menu || !description || !chapter || !section) {
        console.log(`  ⚠ Skipping row with missing fields: ${JSON.stringify(row)}`);
        return null;
      }

      if (!/^\d{6}$/.test(code)) {
        console.log(`  ⚠ Skipping invalid HS code: ${code}`);
        return null;
      }

      const hsCode = {
        code,
        menu,
        description,
        chapter,
        section,
        keywords: this.parseKeywords(keywordsStr) || this.generateKeywords(description)
      };

      if (menuVi) hsCode.menu_vi = menuVi;
      if (descriptionVi) hsCode.description_vi = descriptionVi;
      if (keywordsViStr) hsCode.keywords_vi = this.parseKeywords(keywordsViStr);

      return hsCode;
    } catch (e) {
      console.log(`  ✗ Error converting bilingual row: ${e.message}`);
      return null;
    }
  }

  _generateKeywords(description) {
    return this.generateKeywords(description);
  }

  convert(csvFile) {
    if (!fs.existsSync(csvFile)) {
      throw new Error(`CSV file not found: ${csvFile}`);
    }

    const csvData = fs.readFileSync(csvFile, 'utf-8');
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`CSV columns: ${Object.keys(records[0] || {}).join(', ')}`);

    const hsCodes = [];
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      if (!row.code && !row.description) continue;

      let hsCode;
      if (this.format === 'basic') {
        hsCode = this.convertBasicRow(row);
      } else if (this.format === 'extended') {
        hsCode = this.convertExtendedRow(row);
      } else if (this.format === 'bilingual') {
        hsCode = this.convertBilingualRow(row);
      }

      if (hsCode) {
        hsCodes.push(hsCode);
      }

      if ((i + 2) % 100 === 0) {
        console.log(`  Processed ${i + 1} rows... (${hsCodes.length} valid)`);
      }
    }

    return hsCodes;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Transform HS code data from CSV to JSON format

Usage:
  node scripts/csv-to-json.mjs <csv_file> [options]

Options:
  --format    CSV format: basic, extended, bilingual (default: basic)
  --output    Output JSON file path (default: public/data/hs-codes-converted.json)
  --help      Show this help message

Examples:
  node scripts/csv-to-json.mjs hs-codes.csv
  node scripts/csv-to-json.mjs data.csv --format extended
  node scripts/csv-to-json.mjs data-bilingual.csv --format bilingual --output custom-output.json
    `);
    process.exit(0);
  }

  try {
    // Parse arguments
    const csvFile = args[0];
    let format = 'basic';
    let output = 'public/data/hs-codes-converted.json';

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--format' && i + 1 < args.length) {
        format = args[++i];
      } else if (args[i] === '--output' && i + 1 < args.length) {
        output = args[++i];
      }
    }

    console.log('='.repeat(70));
    console.log('CSV to JSON Converter - HS Codes');
    console.log('='.repeat(70));

    const converter = new CSVToJSONConverter(format);
    console.log(`\n📄 Using format: ${format}`);
    console.log(`📂 Input file: ${csvFile}`);
    console.log(`📊 Output file: ${output}`);

    console.log('\n🔄 Converting CSV to JSON...');
    const hsCodes = converter.convert(csvFile);

    if (hsCodes.length === 0) {
      console.log('✗ No valid HS codes found in CSV');
      process.exit(1);
    }

    const outputData = {
      hs_codes: hsCodes,
      metadata: {
        total_codes: hsCodes.length,
        format: format,
        created_from: csvFile,
        created_at: new Date().toISOString()
      }
    };

    // Create output directory
    const outputPath = path.resolve(output);
    const outputDir = path.dirname(outputPath);
    fs.mkdirSync(outputDir, { recursive: true });

    // Save JSON
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');

    const fileSize = fs.statSync(outputPath).size / 1024;

    console.log(`\n✓ Successfully converted ${hsCodes.length} HS codes!`);
    console.log(`✓ Saved to: ${output}`);
    console.log(`✓ File size: ${fileSize.toFixed(2)} KB`);
    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
