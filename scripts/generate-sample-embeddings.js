#!/usr/bin/env node
/**
 * Generate sample embeddings for testing (Node.js version)
 * Run this with: node scripts/generate-sample-embeddings.js
 */

import fs from 'fs';
import path from 'path';

function generateRandomEmbedding(dim, seed) {
  // Simple seeded random generator
  let value = seed;
  const embeddings = [];
  
  for (let i = 0; i < dim; i++) {
    value = (value * 9301 + 49297) % 233280;
    embeddings.push((value / 233280) * 2 - 1);
  }
  
  // Normalize
  const magnitude = Math.sqrt(embeddings.reduce((sum, x) => sum + x*x, 0));
  return embeddings.map(x => x / magnitude);
}

function generateEmbeddings() {
  console.log('Generating sample embeddings...\n');
  
  // Load basic HS codes
  const basicData = JSON.parse(fs.readFileSync('public/data/hs-codes-basic.json', 'utf-8'));
  const hsCodes = basicData.hs_codes;
  
  // OpenAI embeddings
  console.log('Generating OpenAI text-embedding-3-small (1536d)...');
  const openaiSmallData = {
    hs_codes: hsCodes.map((code, i) => ({
      ...code,
      embedding: generateRandomEmbedding(1536, parseInt(code.code)),
      provider: 'openai',
      model: 'text-embedding-3-small'
    })),
    metadata: {
      provider: 'openai',
      model: 'text-embedding-3-small',
      total_codes: hsCodes.length,
      embedding_dim: 1536,
      note: 'Sample embeddings for testing'
    }
  };
  
  fs.mkdirSync('public/data/openai-embeddings', { recursive: true });
  fs.writeFileSync('public/data/openai-embeddings/text-embedding-3-small.json', JSON.stringify(openaiSmallData));
  console.log('✓ Saved to public/data/openai-embeddings/text-embedding-3-small.json\n');
  
  // OpenAI large
  console.log('Generating OpenAI text-embedding-3-large (3072d)...');
  const openaiLargeData = {
    hs_codes: hsCodes.map(code => ({
      ...code,
      embedding: generateRandomEmbedding(3072, parseInt(code.code)),
      provider: 'openai',
      model: 'text-embedding-3-large'
    })),
    metadata: {
      provider: 'openai',
      model: 'text-embedding-3-large',
      total_codes: hsCodes.length,
      embedding_dim: 3072,
      note: 'Sample embeddings for testing'
    }
  };
  
  fs.writeFileSync('public/data/openai-embeddings/text-embedding-3-large.json', JSON.stringify(openaiLargeData));
  console.log('✓ Saved to public/data/openai-embeddings/text-embedding-3-large.json\n');
  
  // Cohere embeddings
  console.log('Generating Cohere embed-english-v3.0 (1024d)...');
  const cohereData = {
    hs_codes: hsCodes.map(code => ({
      ...code,
      embedding: generateRandomEmbedding(1024, parseInt(code.code)),
      provider: 'cohere',
      model: 'embed-english-v3.0'
    })),
    metadata: {
      provider: 'cohere',
      model: 'embed-english-v3.0',
      total_codes: hsCodes.length,
      embedding_dim: 1024,
      note: 'Sample embeddings for testing'
    }
  };
  
  fs.mkdirSync('public/data/cohere-embeddings', { recursive: true });
  fs.writeFileSync('public/data/cohere-embeddings/embed-english-v3-0.json', JSON.stringify(cohereData));
  console.log('✓ Saved to public/data/cohere-embeddings/embed-english-v3-0.json\n');
  
  // HuggingFace embeddings
  console.log('Generating HuggingFace all-MiniLM-L6-v2 (384d)...');
  const hfData = {
    hs_codes: hsCodes.map(code => ({
      ...code,
      embedding: generateRandomEmbedding(384, parseInt(code.code)),
      provider: 'huggingface',
      model: 'sentence-transformers/all-MiniLM-L6-v2'
    })),
    metadata: {
      provider: 'huggingface',
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      total_codes: hsCodes.length,
      embedding_dim: 384,
      note: 'Sample embeddings for testing'
    }
  };
  
  fs.mkdirSync('public/data/huggingface-embeddings', { recursive: true });
  fs.writeFileSync('public/data/huggingface-embeddings/sentence-transformers-all-MiniLM-L6-v2.json', JSON.stringify(hfData));
  console.log('✓ Saved to public/data/huggingface-embeddings/sentence-transformers-all-MiniLM-L6-v2.json\n');
  
  console.log('=' .repeat(60));
  console.log('✓ All sample embeddings generated successfully!');
  console.log('=' .repeat(60));
  console.log('\n⚠️  IMPORTANT NOTES:');
  console.log('1. These are SAMPLE embeddings with pseudo-random vectors');
  console.log('2. Do NOT use in production');
  console.log('3. Search results will NOT be meaningful');
  console.log('4. Replace with real embeddings from API providers\n');
}

generateEmbeddings();