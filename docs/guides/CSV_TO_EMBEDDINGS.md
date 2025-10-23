# CSV to Embeddings Transformation Guide

Complete guide for transforming HS code data from CSV format to embedding data.

## Overview

This guide covers the transformation pipeline:

```
CSV File → JSON Format → Embeddings Generation → (Optional) Binary Format
```

Three main scripts work together:
1. **csv-to-json.py/mjs** - Converts CSV to normalized JSON
2. **generate-embeddings.py** - Generates embeddings from JSON
3. **csv-to-embeddings.py** - Orchestrates the complete pipeline

---

## Quick Start

### Using the Pipeline Script (Recommended)

The easiest way to transform HS codes from CSV to embeddings:

```bash
# Basic example with OpenAI
python scripts/csv-to-embeddings.py hs-codes.csv --provider openai

# With Hugging Face (local, no API key needed)
python scripts/csv-to-embeddings.py hs-codes.csv --provider huggingface

# Bilingual data with Cohere
python scripts/csv-to-embeddings.py data-bilingual.csv --format bilingual --provider cohere

# Convert to binary format automatically
python scripts/csv-to-embeddings.py hs-codes.csv --provider openai --to-binary
```

---

## CSV Format Requirements

### Format 1: Basic (Default)

**Columns required:**
- `code` - 6-digit HS code (e.g., "010121")
- `description` - Product description
- `chapter` - HS chapter (e.g., "01")
- `section` - HS section (e.g., "I")

**Example:**
```csv
code,description,chapter,section
010121,Pure-bred breeding horses,01,I
020110,Beef cattle meat fresh or chilled,02,I
030111,Fish salmon fresh or chilled,03,I
```

### Format 2: Extended

**Columns required:**
- `code` - 6-digit HS code
- `menu` - Product category/menu name
- `description` - Detailed description
- `chapter` - HS chapter
- `section` - HS section
- `keywords` - Comma-separated keywords (optional)

**Example:**
```csv
code,menu,description,chapter,section,keywords
010121,Live Horses,Pure-bred breeding horses,01,I,horse,breeding,pure-bred
020110,Beef,Beef cattle meat fresh or chilled,02,I,beef,cattle,meat,fresh
030111,Fish,Fish salmon fresh or chilled,03,I,fish,salmon,seafood,fresh
```

### Format 3: Bilingual

**Columns required:**
- `code` - 6-digit HS code
- `menu` - Product category (English)
- `menu_vi` - Product category (Vietnamese)
- `description` - Description (English)
- `description_vi` - Description (Vietnamese)
- `chapter` - HS chapter
- `section` - HS section
- `keywords` - Keywords (English, optional)
- `keywords_vi` - Keywords (Vietnamese, optional)

**Example:**
```csv
code,menu,menu_vi,description,description_vi,chapter,section,keywords,keywords_vi
010121,Live Horses,Ngựa Sống,Pure-bred breeding horses,Ngựa giống thuần chủng,01,I,horse;breeding,ngựa;giống
020110,Beef,Thịt Bò,Beef cattle meat fresh or chilled,Thịt bò tươi hoặc lạnh,02,I,beef;cattle;meat,thịt;bò;gia súc
```

---

## Step-by-Step Transformation

### Step 1: CSV to JSON

Convert your CSV file to normalized JSON format:

**Using Python:**
```bash
python scripts/csv-to-json.py hs-codes.csv --format basic --output hs-codes.json
```

**Using Node.js:**
```bash
node scripts/csv-to-json.mjs hs-codes.csv --format basic --output hs-codes.json
```

**Output:** `hs-codes.json`
```json
{
  "hs_codes": [
    {
      "code": "010121",
      "menu": "Pure-bred breeding horses",
      "description": "Pure-bred breeding horses",
      "chapter": "01",
      "section": "I",
      "keywords": ["horse", "breeding", "pure-bred", "animal"]
    }
  ],
  "metadata": {
    "total_codes": 50000,
    "format": "basic",
    "created_from": "hs-codes.csv"
  }
}
```

**Validation:**
- ✓ HS codes must be 6 digits
- ✓ Required fields must not be empty
- ✓ Keywords auto-generated if not provided
- ✓ Invalid rows are skipped with warnings

---

### Step 2: Generate Embeddings

Convert JSON to embeddings using your chosen provider:

#### Option A: OpenAI

Requires `OPENAI_API_KEY` environment variable:

```bash
# Using text-embedding-3-small (1536 dims, cheaper)
python scripts/generate-embeddings.py hs-codes.json --provider openai

# Using text-embedding-3-large (3072 dims, more accurate)
python scripts/generate-embeddings.py hs-codes.json --provider openai --model text-embedding-3-large
```

**Cost estimate:**
- text-embedding-3-small: ~$0.02 per 1M tokens (~$1 per 50k codes)
- text-embedding-3-large: ~$0.13 per 1M tokens (~$6.50 per 50k codes)

#### Option B: Cohere

Requires `COHERE_API_KEY` environment variable:

```bash
python scripts/generate-embeddings.py hs-codes.json --provider cohere
```

**Features:**
- Embedding dimension: 1024
- Cost: Free tier available, ~$1 per 1M embeds

#### Option C: Hugging Face (Local)

No API key needed! Runs locally on your machine:

```bash
# Using recommended model (768 dims, good quality)
python scripts/generate-embeddings.py hs-codes.json --provider huggingface

# Using smaller model (384 dims, faster)
python scripts/generate-embeddings.py hs-codes.json --provider huggingface --model BAAI/bge-small-en-v1.5

# Using lightweight model (384 dims, smallest)
python scripts/generate-embeddings.py hs-codes.json --provider huggingface --model all-MiniLM-L6-v2
```

**Advantages:**
- No API key needed
- Free and unlimited
- Runs on your machine
- Models: 384-768 dimensions

**Output:** `public/data/openai-embeddings/text-embedding-3-small.json`
```json
{
  "hs_codes": [
    {
      "code": "010121",
      "menu": "Pure-bred breeding horses",
      "description": "Pure-bred breeding horses",
      "chapter": "01",
      "section": "I",
      "keywords": ["horse", "breeding", "pure-bred", "animal"],
      "embedding": [0.0123, -0.0456, ..., 0.9876],
      "provider": "openai",
      "model": "text-embedding-3-small"
    }
  ],
  "metadata": {
    "provider": "openai",
    "model": "text-embedding-3-small",
    "total_codes": 50000,
    "embedding_dim": 1536,
    "created_at": "2024-01-15 14:30:00",
    "version": "1.0"
  }
}
```

---

### Step 3: (Optional) Convert to Binary

Reduce file size by 68% using binary format:

```bash
# Automatically during pipeline
python scripts/csv-to-embeddings.py hs-codes.csv --provider openai --to-binary

# Or manually after generation
npm run convert:embeddings
```

**Result:**
```
public/data/openai-embeddings/
├── text-embedding-3-small.json  (2.5 MB)
└── text-embedding-3-small.bin   (0.8 MB - 68% smaller!)
```

---

## Complete Pipeline Example

End-to-end transformation in one command:

```bash
# From CSV directly to embeddings with OpenAI
python scripts/csv-to-embeddings.py hs-codes.csv --provider openai

# With binary conversion
python scripts/csv-to-embeddings.py hs-codes.csv --provider openai --to-binary

# Bilingual data with Hugging Face
python scripts/csv-to-embeddings.py hs-codes-bilingual.csv --format bilingual --provider huggingface

# Custom output location
python scripts/csv-to-embeddings.py hs-codes.csv --provider openai --output custom/path/embeddings.json
```

**What happens:**
1. ✓ Validates CSV format
2. ✓ Converts CSV to JSON
3. ✓ Generates embeddings
4. ✓ Saves to proper directory
5. ✓ (Optional) Converts to binary format
6. ✓ Shows detailed report

---

## Advanced Usage

### Multi-Provider Setup

Generate embeddings with multiple providers for comparison:

```bash
# Step 1: Convert CSV to JSON once
python scripts/csv-to-json.py hs-codes.csv --output hs-codes.json

# Step 2: Generate embeddings with different providers
python scripts/generate-embeddings.py hs-codes.json --provider openai
python scripts/generate-embeddings.py hs-codes.json --provider cohere
python scripts/generate-embeddings.py hs-codes.json --provider huggingface

# Step 3: Convert all to binary
npm run convert:embeddings
```

**Result:**
```
public/data/
├── openai-embeddings/
│   ├── text-embedding-3-small.json
│   ├── text-embedding-3-small.bin
│   ├── text-embedding-3-large.json
│   └── text-embedding-3-large.bin
├── cohere-embeddings/
│   ├── embed-english-v3-0.json
│   └── embed-english-v3-0.bin
└── huggingface-embeddings/
    ├── BAAI-bge-base-en-v1-5.json
    └── BAAI-bge-base-en-v1-5.bin
```

### Batch Processing

Process large CSV files in batches:

```bash
# Split CSV into chunks
split -l 10000 large-hs-codes.csv hs-codes-part-

# Process each chunk
for f in hs-codes-part-*; do
  python scripts/csv-to-embeddings.py "$f" --provider openai --output "public/data/embeddings-$(echo $f | md5sum | cut -d' ' -f1).json"
done

# Merge all embeddings (manually combine JSON arrays)
```

---

## Troubleshooting

### Error: "CSV file not found"
- Check file path is correct
- Use absolute path if relative doesn't work
- Ensure file has .csv extension

### Error: "No API key provided"
Set environment variables:
```bash
# Linux/Mac
export OPENAI_API_KEY="sk-..."
export COHERE_API_KEY="..."

# Windows PowerShell
$env:OPENAI_API_KEY="sk-..."
$env:COHERE_API_KEY="..."
```

### Error: "Invalid HS code format"
- HS codes must be exactly 6 digits
- Valid examples: "010121", "020110", "030111"
- Invalid: "01012" (5 digits), "0101210" (7 digits)

### Error: "Module not found: csv-parse"
Install Node.js dependencies:
```bash
npm install csv-parse
```

### Embeddings generation too slow
- Use smaller Hugging Face model: `BAAI/bge-small-en-v1.5`
- Use OpenAI API (parallel batch processing)
- Increase batch size if memory allows

### File too large
Convert to binary format:
```bash
npm run convert:embeddings
```
Reduces size by 68%.

---

## Data Quality Checklist

Before transforming your CSV:

- [ ] All required columns present
- [ ] No empty cells in required fields
- [ ] HS codes are exactly 6 digits
- [ ] Chapter codes are valid (01-21)
- [ ] Section codes are valid (I, II, III, IV, V)
- [ ] Descriptions are meaningful (50+ characters)
- [ ] No duplicate HS codes
- [ ] No special characters breaking CSV format
- [ ] CSV is UTF-8 encoded
- [ ] Row count matches expected

**Validation command:**
```bash
# Check CSV validity
python -c "import csv; csv.DictReader(open('hs-codes.csv')); print('✓ CSV valid')"
```

---

## API Costs & Recommendations

### OpenAI (text-embedding-3-small)
- **Cost:** $0.02 per 1M tokens
- **Size:** 50,000 HS codes ≈ 50 pages ≈ $1
- **Best for:** Production use, highest quality
- **Setup:** `export OPENAI_API_KEY="sk-..."`

### Cohere
- **Cost:** Free tier available
- **Size:** Unlimited on paid plan
- **Best for:** Budget-friendly, good quality
- **Setup:** `export COHERE_API_KEY="..."`

### Hugging Face (Local)
- **Cost:** Free (100% local)
- **Size:** Limited by RAM (~4GB for 50k codes)
- **Best for:** Development, no API key needed
- **Setup:** `pip install sentence-transformers`

**Recommendation:**
- Development → Hugging Face (free, local)
- Production → OpenAI (best quality, reasonable cost)
- Budget → Cohere (free tier available)

---

## Output Verification

After generation, verify embeddings are correct:

```bash
# Check JSON validity
python -c "import json; json.load(open('embeddings.json')); print('✓ Valid JSON')"

# Check embedding dimensions
python -c "
import json
data = json.load(open('embeddings.json'))
dim = len(data['hs_codes'][0]['embedding'])
print(f'✓ Embedding dimension: {dim}')
"

# Check file size
ls -lh public/data/*/embeddings.json | awk '{print \$5, \$9}'

# Check total codes
python -c "
import json
data = json.load(open('embeddings.json'))
print(f'✓ Total codes: {len(data[\"hs_codes\"])}')"
```

---

## Integration with Vector Search

Once embeddings are generated, they're automatically available in the application:

```typescript
// vectorSearch.ts loads embeddings automatically
const vectorSearch = new ClientVectorSearch();

// Automatically loads from /data/openai-embeddings/text-embedding-3-small.json
// or /data/openai-embeddings/text-embedding-3-small.bin (if converted)
await vectorSearch.loadPrecomputedEmbeddings('openai', 'text-embedding-3-small');

// Search is ready
const results = vectorSearch.search(userQuery, topK);
```

---

## Summary

| Task | Command |
|------|---------|
| CSV → JSON | `python scripts/csv-to-json.py input.csv --format basic` |
| JSON → Embeddings (OpenAI) | `python scripts/generate-embeddings.py input.json --provider openai` |
| JSON → Embeddings (Cohere) | `python scripts/generate-embeddings.py input.json --provider cohere` |
| JSON → Embeddings (Local) | `python scripts/generate-embeddings.py input.json --provider huggingface` |
| CSV → Embeddings (All in one) | `python scripts/csv-to-embeddings.py input.csv --provider openai` |
| Embeddings → Binary | `npm run convert:embeddings` |
| Complete Pipeline | `python scripts/csv-to-embeddings.py input.csv --provider openai --to-binary` |

---

## Next Steps

1. Prepare your CSV file with HS code data
2. Choose embedding provider (OpenAI, Cohere, or Hugging Face)
3. Run: `python scripts/csv-to-embeddings.py your-file.csv --provider openai`
4. Wait for embeddings to generate
5. Embeddings are automatically loaded in the application
6. Start searching!

---

**Questions?** Check the inline documentation in each script or review the example files in `public/data/`.
