# HS Code Data Transformation Scripts

Complete toolset for transforming HS code data from CSV format to embedding vectors.

## Scripts Included

### 1. `csv-to-json.py` - CSV to JSON Converter (Python)

Convert HS code data from CSV format to normalized JSON.

**Supported formats:**
- Basic: code, description, chapter, section
- Extended: code, menu, description, chapter, section, keywords
- Bilingual: code, menu, menu_vi, description, description_vi, chapter, section, keywords, keywords_vi

**Usage:**
```bash
python scripts/csv-to-json.py <csv_file> [--format basic|extended|bilingual] [--output output.json]
```

**Examples:**
```bash
# Basic format
python scripts/csv-to-json.py hs-codes.csv

# Extended format with custom output
python scripts/csv-to-json.py data-extended.csv --format extended --output my-codes.json

# Bilingual format
python scripts/csv-to-json.py data-bilingual.csv --format bilingual
```

---

### 2. `csv-to-json.mjs` - CSV to JSON Converter (Node.js)

Same functionality as the Python version, but using Node.js/JavaScript.

**Usage:**
```bash
node scripts/csv-to-json.mjs <csv_file> [options]
```

**Examples:**
```bash
# Basic usage
node scripts/csv-to-json.mjs hs-codes.csv

# With options
node scripts/csv-to-json.mjs data.csv --format extended --output output.json
```

**Note:** Requires `csv-parse` package:
```bash
npm install csv-parse
```

---

### 3. `generate-embeddings.py` - Embeddings Generator (Python)

Generate embedding vectors for HS codes using various providers.

**Supported providers:**
- **OpenAI** - text-embedding-3-small (1536 dims), text-embedding-3-large (3072 dims)
- **Cohere** - embed-english-v3.0 (1024 dims)
- **Hugging Face** - Local models (384-768 dims)

**Usage:**
```bash
python scripts/generate-embeddings.py <input.json> --provider <openai|cohere|huggingface> [--model <model>] [--output output.json]
```

**Examples:**
```bash
# OpenAI with default model
python scripts/generate-embeddings.py hs-codes.json --provider openai

# OpenAI with large model
python scripts/generate-embeddings.py hs-codes.json --provider openai --model text-embedding-3-large

# Cohere
python scripts/generate-embeddings.py hs-codes.json --provider cohere

# Hugging Face with default model
python scripts/generate-embeddings.py hs-codes.json --provider huggingface

# Hugging Face with smaller model
python scripts/generate-embeddings.py hs-codes.json --provider huggingface --model BAAI/bge-small-en-v1.5
```

**Requirements:**
```bash
# OpenAI
pip install openai
export OPENAI_API_KEY="sk-..."

# Cohere
pip install cohere
export COHERE_API_KEY="..."

# Hugging Face (local)
pip install sentence-transformers
# No API key needed!
```

---

### 4. `csv-to-embeddings.py` - Complete Pipeline (Python)

Orchestrate the entire transformation pipeline from CSV to embeddings in one command.

**Usage:**
```bash
python scripts/csv-to-embeddings.py <csv_file> --provider <openai|cohere|huggingface> [options]
```

**Options:**
- `--format <basic|extended|bilingual>` - CSV format (default: basic)
- `--model <model_name>` - Embedding model (provider-specific)
- `--output <file>` - Output embeddings file (auto-generated if not specified)
- `--to-binary` - Convert embeddings to binary format after generation

**Examples:**
```bash
# Basic pipeline with OpenAI
python scripts/csv-to-embeddings.py hs-codes.csv --provider openai

# Extended format with custom model
python scripts/csv-to-embeddings.py data-extended.csv --format extended --provider openai --model text-embedding-3-large

# Bilingual with Hugging Face and binary conversion
python scripts/csv-to-embeddings.py data-bilingual.csv --format bilingual --provider huggingface --to-binary

# With custom output path
python scripts/csv-to-embeddings.py hs-codes.csv --provider cohere --output custom/embeddings.json
```

**What it does:**
1. ✓ Validates CSV format
2. ✓ Converts CSV to JSON
3. ✓ Generates embeddings using specified provider
4. ✓ Saves embeddings to proper directory structure
5. ✓ (Optional) Converts embeddings to binary format
6. ✓ Displays comprehensive report

---

## Quick Start Guide

### Scenario 1: OpenAI Embeddings (Recommended for Production)

```bash
# 1. Set API key
export OPENAI_API_KEY="sk-your-key-here"

# 2. Run complete pipeline
python scripts/csv-to-embeddings.py your-hs-codes.csv --provider openai

# 3. Optional: Convert to binary (68% size reduction)
npm run convert:embeddings
```

### Scenario 2: Hugging Face (No API Key, Local)

```bash
# 1. Install dependencies
pip install sentence-transformers

# 2. Run complete pipeline
python scripts/csv-to-embeddings.py your-hs-codes.csv --provider huggingface

# 3. Optional: Faster model
python scripts/csv-to-embeddings.py your-hs-codes.csv --provider huggingface --model BAAI/bge-small-en-v1.5
```

### Scenario 3: Step-by-Step (For Advanced Use)

```bash
# Step 1: Convert CSV to JSON
python scripts/csv-to-json.py hs-codes.csv --format extended --output hs-codes.json

# Step 2: Generate embeddings
python scripts/generate-embeddings.py hs-codes.json --provider openai --model text-embedding-3-small

# Step 3: Convert to binary
npm run convert:embeddings

# Step 4: Clean up temporary files
rm hs-codes.json
```

---

## CSV Format Examples

### Format 1: Basic
```csv
code,description,chapter,section
010121,Pure-bred breeding horses,01,I
020110,Beef cattle meat fresh or chilled,02,I
030111,Fish salmon fresh or chilled,03,I
```

### Format 2: Extended
```csv
code,menu,description,chapter,section,keywords
010121,Live Horses,Pure-bred breeding horses,01,I,horse;breeding;pure-bred
020110,Beef,Beef cattle meat fresh or chilled,02,I,beef;cattle;meat
030111,Fish,Fish salmon fresh or chilled,03,I,fish;salmon;seafood
```

### Format 3: Bilingual
```csv
code,menu,menu_vi,description,description_vi,chapter,section,keywords,keywords_vi
010121,Live Horses,Ngựa Sống,Pure-bred breeding horses,Ngựa giống thuần chủng,01,I,horse;breeding,ngựa;giống
020110,Beef,Thịt Bò,Beef cattle meat fresh or chilled,Thịt bò tươi hoặc lạnh,02,I,beef;cattle,thịt;bò
```

---

## Output Directory Structure

After running the scripts, embeddings are organized as:

```
public/data/
├── hs-codes-basic.json                    # Original HS codes reference
├── openai-embeddings/
│   ├── text-embedding-3-small.json        # OpenAI embeddings (JSON)
│   ├── text-embedding-3-small.bin         # OpenAI embeddings (Binary, 68% smaller)
│   ├── text-embedding-3-large.json
│   └── text-embedding-3-large.bin
├── cohere-embeddings/
│   ├── embed-english-v3-0.json
│   └── embed-english-v3-0.bin
└── huggingface-embeddings/
    ├── BAAI-bge-base-en-v1-5.json
    └── BAAI-bge-base-en-v1-5.bin
```

---

## File Size Comparison

### Input CSV
- 50,000 HS codes: ~2-3 MB

### After JSON Conversion
- 50,000 HS codes: ~2.5-3 MB

### After Embedding Generation
| Provider | Model | Size | Dimensions |
|----------|-------|------|------------|
| OpenAI | text-embedding-3-small | 2.5 MB | 1536 |
| OpenAI | text-embedding-3-large | 5.0 MB | 3072 |
| Cohere | embed-english-v3.0 | 1.2 MB | 1024 |
| Hugging Face | BAAI/bge-base-en-v1.5 | 1.5 MB | 768 |
| Hugging Face | BAAI/bge-small-en-v1.5 | 0.8 MB | 384 |

### After Binary Conversion
- **Reduction: 68%** (e.g., 2.5 MB → 0.8 MB)

---

## Performance & Cost

### OpenAI
- **Speed:** ~2-3 seconds per 100 codes (batch processing)
- **Cost:** $0.02 per 1M tokens (~$1 per 50k codes)
- **Quality:** Highest
- **Best for:** Production use

### Cohere
- **Speed:** ~3-5 seconds per 100 codes
- **Cost:** Free tier available, ~$1 per 1M embeds
- **Quality:** High
- **Best for:** Cost-conscious production

### Hugging Face
- **Speed:** ~0.5-1 second per 100 codes (local)
- **Cost:** Free (100% local)
- **Quality:** Good
- **Best for:** Development, no API key needed

---

## Troubleshooting

### "CSV file not found"
```bash
# Use full path
python scripts/csv-to-json.py /full/path/to/hs-codes.csv
```

### "No API key provided"
```bash
# Set environment variable
export OPENAI_API_KEY="sk-..."
export COHERE_API_KEY="..."
```

### "Invalid HS code format"
Ensure HS codes are exactly 6 digits: `010121` (valid), `01012` (invalid)

### "Module not found: csv-parse"
```bash
npm install csv-parse
```

### "Memory error with Hugging Face"
Use smaller model:
```bash
python scripts/generate-embeddings.py hs-codes.json --provider huggingface --model BAAI/bge-small-en-v1.5
```

### Embeddings not loading in app
Check files exist in `public/data/` with correct provider-model naming:
- Expected: `public/data/provider-embeddings/model.json`
- Example: `public/data/openai-embeddings/text-embedding-3-small.json`

---

## Integration with Vector Search

Once embeddings are generated, they're automatically available:

```typescript
// App automatically loads embeddings
const vectorSearch = new ClientVectorSearch();
await vectorSearch.loadPrecomputedEmbeddings('openai', 'text-embedding-3-small');

// Search is ready
const results = vectorSearch.search(userQuery, topK);
```

---

## Advanced Usage

### Multi-Provider Generation
```bash
# Generate with all providers
python scripts/generate-embeddings.py hs-codes.json --provider openai
python scripts/generate-embeddings.py hs-codes.json --provider cohere
python scripts/generate-embeddings.py hs-codes.json --provider huggingface

# Convert all to binary
npm run convert:embeddings
```

### Batch Processing Large Files
```bash
# Split CSV
split -l 10000 huge-file.csv chunk-

# Process each chunk
for f in chunk-*; do
  python scripts/csv-to-embeddings.py "$f" --provider openai
done
```

### Custom Output Location
```bash
python scripts/csv-to-embeddings.py hs-codes.csv --provider openai --output my-custom/path/embeddings.json
```

---

## Summary Table

| Task | Command |
|------|---------|
| CSV → JSON | `python scripts/csv-to-json.py input.csv` |
| JSON → Embeddings | `python scripts/generate-embeddings.py input.json --provider openai` |
| CSV → Embeddings | `python scripts/csv-to-embeddings.py input.csv --provider openai` |
| All + Binary | `python scripts/csv-to-embeddings.py input.csv --provider openai --to-binary` |

---

## Environment Setup

### Python Dependencies
```bash
# CSV conversion
pip install python-csv  # Usually built-in

# Embeddings generation
pip install openai                      # For OpenAI
pip install cohere                      # For Cohere
pip install sentence-transformers       # For Hugging Face
```

### Environment Variables
```bash
# Linux/Mac
export OPENAI_API_KEY="sk-..."
export COHERE_API_KEY="..."

# Windows PowerShell
$env:OPENAI_API_KEY="sk-..."
$env:COHERE_API_KEY="..."
```

### Node.js Dependencies
```bash
npm install csv-parse  # For Node.js CSV conversion
```

---

## Getting Help

1. **Check inline documentation** - Each script has detailed comments
2. **Review examples** - See example CSV files in the documentation
3. **Check logs** - Scripts provide detailed progress and error messages
4. **Verify output** - Check `public/data/` for generated files

---

## Next Steps

1. Prepare your HS code data in CSV format
2. Choose embedding provider (see [comparison](#performance--cost))
3. Run: `python scripts/csv-to-embeddings.py your-file.csv --provider openai`
4. Wait for embeddings to generate (5-10 minutes for 50k codes)
5. Embeddings are automatically available in the search app
6. Search and explore your data!

---

**Happy transforming!** 🚀
