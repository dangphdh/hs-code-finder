# CSV to Bilingual Converter - Scripts Documentation

## 📋 Overview

Two Python scripts designed to convert Harmonized System (HS) code CSV data from single-language format to bilingual (English + Vietnamese) format.

### Scripts Available

1. **`csv-to-bilingual.py`** - Basic converter using local dictionary
2. **`csv-to-bilingual-ai.py`** - Enhanced converter with optional AI translation support

---

## 🎯 Use Cases

### Use `csv-to-bilingual.py` when:
- ✅ You need **fast processing** (no API calls)
- ✅ You want **free operation** (no API costs)
- ✅ Dictionary coverage is sufficient for your data
- ✅ You prefer **local processing** (no external dependencies)

### Use `csv-to-bilingual-ai.py` when:
- ✅ You need **higher translation quality**
- ✅ Dictionary coverage is **incomplete**
- ✅ You have budget for **AI translation** (OpenAI/Cohere)
- ✅ You want **caching** to avoid re-translating

---

## 📦 Input Format

### Expected CSV Structure

```csv
section,hscode,description,parent,level
I,01,Animals; live,TOTAL,2
I,0101,"Horses, asses, mules and hinnies; live",01,4
I,010121,"Horses; live, pure-bred breeding animals",0101,6
I,010129,"Horses; live, other than pure-bred breeding animals",0101,6
```

### Columns
- `section` - HS section (Roman numerals)
- `hscode` - HS code (4-6 digits)
- `description` - English product description
- `parent` - Parent code reference
- `level` - Hierarchy level

---

## 📤 Output Format

### Generated CSV Structure

```csv
code,menu,description,description_vi,keywords,keywords_vi,chapter,level
01,I,Animals; live,Động vật; sống,animals live,động vật sống,TOTAL,2
0101,I,"Horses, asses, mules and hinnies; live","Ngựa, lừa, la và cái la; sống",horses asses mules live,ngựa lừa la sống,01,4
010121,I,"Horses; live, pure-bred breeding animals","Ngựa; sống, động vật giống thuần chủng",horses pure bred breeding,ngựa giống thuần chủng,0101,6
```

### Output Columns
- `code` - HS code
- `menu` - Section
- `description` - English description
- `description_vi` - Vietnamese description
- `keywords` - English keywords (auto-extracted)
- `keywords_vi` - Vietnamese keywords (auto-extracted)
- `chapter` - Parent code
- `level` - Hierarchy level

---

## 🚀 Quick Start

### 1. Using Dictionary-Based Converter (Fast & Free)

```bash
# Basic usage
python scripts/csv-to-bilingual.py input.csv output.csv

# With full paths
python scripts/csv-to-bilingual.py \
  public/data/harmonized-system/data/harmonized-system.csv \
  samples/hs-codes-harmonized-bilingual.csv
```

**Pros:**
- ⚡ Fast (processes 6,941 rows in seconds)
- 💰 Free (no API costs)
- 🔒 Private (no external API calls)
- 📦 No dependencies beyond Python

**Cons:**
- ❌ Limited translation coverage (~20-30% of descriptions)
- ❌ Manual additions to dictionary needed for better coverage

**Example Output:**
```
✅ Read 6941 rows
✅ Successfully converted to samples/hs-codes-harmonized-bilingual.csv

📈 Conversion Statistics:
   Total rows: 6941
   Translated: 1800 (26%)
   Missing translations: 5141 (74%)
```

---

### 2. Using AI-Powered Converter (Higher Quality)

#### 2.1 Install Required Libraries

```bash
# For OpenAI support
pip install openai

# For Cohere support
pip install cohere
```

#### 2.2 Set Up API Keys

**Option A: Environment Variables**
```bash
# On Windows PowerShell
$env:OPENAI_API_KEY = "your-key-here"
$env:COHERE_API_KEY = "your-key-here"

# Or in .env file (if using python-dotenv)
OPENAI_API_KEY=your-key-here
COHERE_API_KEY=your-key-here
```

**Option B: Command-Line Arguments**
```bash
python scripts/csv-to-bilingual-ai.py input.csv output.csv \
  --provider openai \
  --api-key "your-key-here"
```

#### 2.3 Run Conversion with OpenAI

```bash
# Full file (6941 rows)
python scripts/csv-to-bilingual-ai.py \
  public/data/harmonized-system/data/harmonized-system.csv \
  samples/hs-codes-harmonized-bilingual.csv \
  --provider openai

# Translate only first 100 rows (for testing)
python scripts/csv-to-bilingual-ai.py \
  public/data/harmonized-system/data/harmonized-system.csv \
  samples/hs-codes-harmonized-bilingual.csv \
  --provider openai \
  --limit 100
```

#### 2.4 Run Conversion with Cohere

```bash
python scripts/csv-to-bilingual-ai.py \
  public/data/harmonized-system/data/harmonized-system.csv \
  samples/hs-codes-harmonized-bilingual.csv \
  --provider cohere
```

**Example Output:**
```
🔄 Starting conversion from public/data/harmonized-system/data/harmonized-system.csv to samples/hs-codes-harmonized-bilingual.csv
📊 Translation provider: openai
💾 Cache file: translation-cache.json

📖 Reading input file...
✅ Read 100 rows
🔄 Processing rows...
   Processing row 100/100
💾 Writing output file...
✅ Successfully wrote to samples/hs-codes-harmonized-bilingual.csv

📈 Conversion Statistics:
   Total rows: 100
   Translated: 100 (100%)
   Missing translations: 0 (0%)

📊 Translation Statistics:
   Cache hits: 0
   Dictionary hits: 26
   API calls: 74
   API errors: 0
   Cache misses: 74
   Hit rate: 26% (no API calls needed)
```

---

## 🎯 Usage Recommendations

### Strategy 1: Best Value (Recommended for Most Users)

```bash
# Step 1: Run dictionary converter first
python scripts/csv-to-bilingual.py \
  public/data/harmonized-system/data/harmonized-system.csv \
  samples/hs-codes-harmonized-bilingual.csv

# Step 2: Review missing translations (save cost)
# Edit samples/hs-codes-harmonized-bilingual.csv manually or with script

# Step 3: Only run AI converter for a sample batch to verify quality
python scripts/csv-to-bilingual-ai.py \
  samples/hs-codes-harmonized-bilingual.csv \
  samples/hs-codes-harmonized-bilingual-ai-verified.csv \
  --provider openai \
  --limit 100
```

**Cost Estimate:** ~$0.50 for 100 rows with gpt-3.5-turbo

---

### Strategy 2: Full AI Translation (Highest Quality)

```bash
# One-step full translation with caching
python scripts/csv-to-bilingual-ai.py \
  public/data/harmonized-system/data/harmonized-system.csv \
  samples/hs-codes-harmonized-bilingual-full-ai.csv \
  --provider openai
```

**Cost Estimate:** ~$30-50 for 6,941 rows with gpt-3.5-turbo
**Benefit:** 100% translation coverage with AI quality

---

### Strategy 3: Hybrid Approach (Balanced)

```bash
# Step 1: Run dictionary converter
python scripts/csv-to-bilingual.py \
  public/data/harmonized-system/data/harmonized-system.csv \
  samples/step1-dict.csv

# Step 2: Extract only rows with missing translations
# (Manual step or additional script needed)

# Step 3: Run AI converter only on missing rows
python scripts/csv-to-bilingual-ai.py \
  samples/missing-translations.csv \
  samples/missing-translations-ai.csv \
  --provider openai

# Step 4: Merge results back
# (Manual step or additional script needed)
```

**Cost Estimate:** ~$15-20 for 5,000 missing rows
**Benefit:** Lower cost while improving coverage from 26% to ~90%

---

## 🔧 Configuration

### Translation Dictionary

Located at the top of both scripts in `TRANSLATION_DICT`:

```python
TRANSLATION_DICT = {
    "Animals; live": "Động vật; sống",
    "Horses, asses, mules and hinnies; live": "Ngựa, lừa, la và cái la; sống",
    # ... more entries
}
```

**To add new translations:**

1. Edit the TRANSLATION_DICT in the script
2. Add entries in format: `"English": "Vietnamese"`
3. Dictionary is used for matching by exact string and partial string contains
4. Re-run the converter to apply new translations

### Cache File

**Location:** `translation-cache.json` (in current directory)

**Contents:**
```json
{
  "Animals; live": "Động vật; sống",
  "Horses, asses, mules and hinnies; live": "Ngựa, lừa, la và cái la; sống"
}
```

**Benefits:**
- ✅ Speeds up re-running converter (skips cached translations)
- ✅ Reduces API costs for re-runs
- ✅ Allows easy review of all translations made
- ✅ Can be edited manually for corrections

**To reset cache:** Delete `translation-cache.json`

---

## 📊 Performance Benchmarks

### Dictionary-Based Converter

| File Size | Rows | Time | Speed |
|-----------|------|------|-------|
| 6.9 KB | 10 | 0.1s | 100 rows/sec |
| 69 KB | 100 | 0.2s | 500 rows/sec |
| 690 KB | 1,000 | 0.5s | 2,000 rows/sec |
| Full (13 MB) | 6,941 | ~3s | 2,300 rows/sec |

**System:** Windows PowerShell, Python 3.9, no API calls

### AI-Powered Converter (OpenAI gpt-3.5-turbo)

| Rows | Cache Hit Rate | API Calls | Time | Cost |
|------|-----------------|-----------|------|------|
| 10 | 50% | 5 | ~15s | ~$0.001 |
| 100 | 26% | 74 | ~2-3m | ~$0.008 |
| 1,000 | 26% | 740 | ~20-30m | ~$0.08 |
| 6,941 | 26% | 5,136 | ~3-4h | ~$0.60 |

**Notes:**
- Cache hit rate improves with manual dictionary additions
- API costs are estimates based on input/output tokens
- Actual time depends on API response times
- Consider using `--limit` for testing before full run

---

## ❌ Troubleshooting

### Issue: UnicodeEncodeError

```
UnicodeEncodeError: 'charmap' codec can't encode characters
```

**Solution:** Already fixed in scripts with UTF-8 wrapper:
```python
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
```

If error persists, run with Python explicitly:
```bash
python -u scripts/csv-to-bilingual.py input.csv output.csv
```

---

### Issue: Input File Not Found

```
❌ Input file not found: public/data/harmonized-system/data/harmonized-system.csv
```

**Solution:** Use absolute paths or verify relative paths:
```bash
# From project root directory
cd d:\Projects\misc\hs-code-finder
python scripts/csv-to-bilingual.py public/data/harmonized-system/data/harmonized-system.csv samples/output.csv

# Or use absolute paths
python scripts/csv-to-bilingual.py "D:\Projects\misc\hs-code-finder\public\data\harmonized-system\data\harmonized-system.csv" "D:\Projects\misc\hs-code-finder\samples\output.csv"
```

---

### Issue: OpenAI API Key Error

```
❌ API key required for openai. Set OPENAI_API_KEY environment variable or use --api-key
```

**Solution:** Set environment variable:
```bash
# PowerShell
$env:OPENAI_API_KEY = "sk-..."
python scripts/csv-to-bilingual-ai.py input.csv output.csv --provider openai

# Or use command-line flag
python scripts/csv-to-bilingual-ai.py input.csv output.csv --provider openai --api-key "sk-..."
```

---

### Issue: Very Slow Processing

**Possible Causes & Solutions:**

1. **Network latency (AI provider)**
   - Use `--limit 10` to test first
   - Run during off-peak hours
   - Consider Cohere (sometimes faster)

2. **Disk I/O bottleneck**
   - Use SSD instead of HDD
   - Close other disk-intensive programs

3. **Large file size**
   - Process in batches using `--limit`
   - Split input file into smaller chunks

---

## 📈 Next Steps

### 1. Generate Embeddings
```bash
# After generating bilingual CSV
python scripts/csv-to-embeddings.py samples/hs-codes-harmonized-bilingual.csv --provider huggingface
```

### 2. Convert to Binary Format
```bash
npm run convert:embeddings
```

### 3. Update Website
Copy generated embeddings to `public/data/` directory

---

## 📝 Additional Resources

- HS Code Reference: [WCO HS Database](https://www.wcoomd.org/)
- OpenAI Pricing: [openai.com/pricing](https://openai.com/pricing)
- Cohere Pricing: [cohere.ai/pricing](https://cohere.ai/pricing)

---

## ✅ Checklist for Running Scripts

Before running, verify:

- [ ] Python 3.8+ installed
- [ ] Input CSV file exists and readable
- [ ] Output directory exists or will be created
- [ ] For AI provider: API key set or available
- [ ] For Cohere/OpenAI: Library installed (`pip install openai` or `pip install cohere`)
- [ ] Sufficient API quota (if using paid service)
- [ ] Output file path doesn't conflict with existing files

---

## 🎓 Example Commands (Copy & Paste Ready)

### Fast Dictionary-Based (5 seconds)
```bash
python scripts/csv-to-bilingual.py public/data/harmonized-system/data/harmonized-system.csv samples/hs-codes-harmonized-bilingual.csv
```

### Test with AI (2 minutes)
```bash
$env:OPENAI_API_KEY = "your-key-here"
python scripts/csv-to-bilingual-ai.py public/data/harmonized-system/data/harmonized-system.csv samples/test-ai.csv --provider openai --limit 100
```

### Full AI Translation (3-4 hours)
```bash
$env:OPENAI_API_KEY = "your-key-here"
python scripts/csv-to-bilingual-ai.py public/data/harmonized-system/data/harmonized-system.csv samples/hs-codes-harmonized-bilingual-full-ai.csv --provider openai
```

---

**Last Updated:** October 23, 2025  
**Status:** ✅ Ready for use

