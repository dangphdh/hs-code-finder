#!/usr/bin/env node
/**
 * Convert embedding JSON files to binary format
 * Reduces file size by ~68% (e.g., 2.5MB → 0.8MB)
 * 
 * Usage:
 *   npm run convert:embeddings
 * 
 * This script:
 * 1. Reads all JSON embedding files from public/data/*-embeddings/
 * 2. Converts them to binary format
 * 3. Saves as .bin files
 * 4. Reports size reduction
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Binary format constants
const MAGIC_NUMBER = 0x48534345; // "HSCE" in hex
const VERSION = 1;

class BinaryEmbeddingsConverter {
  /**
   * Convert embeddings to binary format
   */
  static embeddingsToBinary(embeddings, metadata) {
    if (embeddings.length === 0) {
      throw new Error('No embeddings to convert');
    }

    const embeddingDim = embeddings[0].embedding.length;

    // Calculate total size
    let totalSize = 16; // Magic + Version + Dim + Count
    totalSize += 256; // Provider and model (max 256 bytes each)

    embeddings.forEach((emb) => {
      const encoder = new TextEncoder();
      const codeBytes = encoder.encode(emb.code);
      const menuBytes = encoder.encode(emb.menu || '');
      const descBytes = encoder.encode(emb.description);
      const chapterBytes = encoder.encode(emb.chapter);
      const sectionBytes = encoder.encode(emb.section);

      totalSize += 2 + codeBytes.length;
      totalSize += 2 + menuBytes.length;
      totalSize += 2 + descBytes.length;
      totalSize += 2 + chapterBytes.length;
      totalSize += 2 + sectionBytes.length;
      totalSize += embeddingDim * 4;
    });

    const buffer = Buffer.alloc(totalSize);
    let offset = 0;

    // Write header
    buffer.writeUInt32BE(MAGIC_NUMBER, offset);
    offset += 4;

    buffer.writeUInt32BE(VERSION, offset);
    offset += 4;

    buffer.writeUInt32BE(embeddingDim, offset);
    offset += 4;

    buffer.writeUInt32BE(embeddings.length, offset);
    offset += 4;

    // Write provider and model
    const providerBuf = Buffer.alloc(128);
    providerBuf.write(metadata.provider, 'utf8');
    buffer.set(providerBuf, offset);
    offset += 128;

    const modelBuf = Buffer.alloc(128);
    modelBuf.write(metadata.model, 'utf8');
    buffer.set(modelBuf, offset);
    offset += 128;

    // Write embeddings
    embeddings.forEach((emb) => {
      // Write code
      const codeBytes = Buffer.from(emb.code, 'utf8');
      buffer.writeUInt16BE(codeBytes.length, offset);
      offset += 2;
      buffer.set(codeBytes, offset);
      offset += codeBytes.length;

      // Write menu
      const menuBytes = Buffer.from(emb.menu || '', 'utf8');
      buffer.writeUInt16BE(menuBytes.length, offset);
      offset += 2;
      buffer.set(menuBytes, offset);
      offset += menuBytes.length;

      // Write description
      const descBytes = Buffer.from(emb.description, 'utf8');
      buffer.writeUInt16BE(descBytes.length, offset);
      offset += 2;
      buffer.set(descBytes, offset);
      offset += descBytes.length;

      // Write chapter
      const chapterBytes = Buffer.from(emb.chapter, 'utf8');
      buffer.writeUInt16BE(chapterBytes.length, offset);
      offset += 2;
      buffer.set(chapterBytes, offset);
      offset += chapterBytes.length;

      // Write section
      const sectionBytes = Buffer.from(emb.section, 'utf8');
      buffer.writeUInt16BE(sectionBytes.length, offset);
      offset += 2;
      buffer.set(sectionBytes, offset);
      offset += sectionBytes.length;

      // Write embedding (float32)
      emb.embedding.forEach((val) => {
        buffer.writeFloatBE(val, offset);
        offset += 4;
      });
    });

    return buffer.slice(0, offset);
  }

  /**
   * Find and convert all embedding files
   */
  static async convertAll() {
    const dataDir = path.join(__dirname, '../public/data');

    if (!fs.existsSync(dataDir)) {
      console.error('❌ public/data directory not found');
      process.exit(1);
    }

    const embeddingDirs = fs
      .readdirSync(dataDir)
      .filter((name) => name.endsWith('-embeddings'));

    if (embeddingDirs.length === 0) {
      console.warn('⚠️  No embedding directories found in public/data/');
      console.warn('   Expected: *-embeddings/');
      return;
    }

    console.log('\n📦 Converting embeddings to binary format...\n');
    console.log('='.repeat(70));

    let totalOriginal = 0;
    let totalConverted = 0;

    for (const dir of embeddingDirs) {
      const dirPath = path.join(dataDir, dir);
      const files = fs
        .readdirSync(dirPath)
        .filter((f) => f.endsWith('.json'));

      for (const file of files) {
        const jsonPath = path.join(dirPath, file);
        const binPath = path.join(
          dirPath,
          file.replace('.json', '.bin')
        );

        try {
          // Read JSON
          console.log(`\n📄 ${dir}/${file}`);
          const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

          // Convert to binary
          const binary = this.embeddingsToBinary(
            jsonData.hs_codes,
            jsonData.metadata
          );

          // Save binary
          fs.writeFileSync(binPath, binary);

          // Calculate stats
          const jsonSize = fs.statSync(jsonPath).size;
          const binSize = binary.length;
          const reduction = ((1 - binSize / jsonSize) * 100).toFixed(1);

          console.log(`   ✓ Saved: ${path.basename(binPath)}`);
          console.log(`   📊 Original: ${(jsonSize / 1024).toFixed(1)}KB`);
          console.log(`   📊 Converted: ${(binSize / 1024).toFixed(1)}KB`);
          console.log(`   📈 Reduction: ${reduction}%`);

          totalOriginal += jsonSize;
          totalConverted += binSize;
        } catch (error) {
          console.error(
            `   ❌ Error processing ${file}:`,
            error.message
          );
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✨ Conversion complete!\n');
    console.log(`Total original:  ${(totalOriginal / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Total converted: ${(totalConverted / 1024 / 1024).toFixed(2)}MB`);

    const totalReduction = (
      (1 - totalConverted / totalOriginal) *
      100
    ).toFixed(1);
    console.log(`Total reduction: ${totalReduction}%`);

    const saved = (totalOriginal - totalConverted) / 1024 / 1024;
    console.log(`Space saved:     ${saved.toFixed(2)}MB\n`);

    console.log('💡 Next steps:');
    console.log('   1. Update vectorSearch.ts to load .bin files');
    console.log('   2. Update loadPrecomputedEmbeddings() method');
    console.log('   3. Test embedding loading in browser\n');
  }
}

// Run conversion
BinaryEmbeddingsConverter.convertAll().catch((error) => {
  console.error('Conversion failed:', error);
  process.exit(1);
});
