# SDG Relevance Ingestion - Setup Guide

This guide explains how to configure and use the SDG Relevance Ingestion module.

## Overview

The SDG Relevance module automatically calculates relevance scores for SDG links using AI/LLM analysis. It processes **existing DocumentSDG relationships** only - it does NOT analyze all 17 SDGs for each document.

## Prerequisites

1. Python packages installed (run after adding to requirements):
   ```bash
   pip install -r requirements/base.txt
   ```

2. At least one LLM provider account:
   - **OpenAI** (recommended): https://platform.openai.com/api-keys
   - **Anthropic**: https://console.anthropic.com/
   - **Ollama** (local): https://ollama.ai

## Environment Configuration

Add these variables to your `.env` file:

```bash
# ==============================================================================
# LLM CONFIGURATION FOR SDG RELEVANCE ANALYSIS
# ==============================================================================

# LLM Provider Selection
# Options: openai, anthropic, ollama
LLM_PROVIDER=openai

# ==============================================================================
# OPTION 1: Corporate Proxy LLM (e.g., CEDIA)
# ==============================================================================
OPENAI_API_KEY=sk-SuGVigyKh-Ejf0BDMDR5bw
LLM_BASE_URL=https://api.cedia.org.ec/v1
LLM_MODEL=openai/gpt-4o-mini  # Use provider prefix (openai/, gemini/, etc.)

# ==============================================================================
# OPTION 2: Direct OpenAI
# ==============================================================================
# OPENAI_API_KEY=sk-proj-xxxxx
# # LLM_BASE_URL=  (leave empty)
# LLM_MODEL=gpt-4o  # No prefix needed

# ==============================================================================
# OPTION 3: Direct Anthropic
# ==============================================================================
# ANTHROPIC_API_KEY=sk-ant-xxxxx
# LLM_MODEL=claude-3-5-sonnet-20241022

# ==============================================================================
# OPTION 4: Local Ollama
# ==============================================================================
# OLLAMA_BASE_URL=http://localhost:11434
# LLM_MODEL=llama3

# ==============================================================================
# LLM Parameters (apply to all options)
# ==============================================================================
LLM_TEMPERATURE=0.1        # 0.0-1.0, lower = more deterministic
LLM_MAX_TOKENS=500         # Maximum response length
LLM_TIMEOUT=60             # Request timeout in seconds
LLM_MAX_RETRIES=3          # Retry attempts on failure
```

## Configuration Examples

### Using Corporate Proxy LLM (Recommended for Organizations)

If your organization has an LLM proxy/gateway (like CEDIA):

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-SuGVigyKh-Ejf0BDMDR5bw  # Proxy API key
LLM_BASE_URL=https://api.cedia.org.ec/v1   # Proxy base URL
LLM_MODEL=openai/gpt-4o-mini               # Model with provider prefix
LLM_TEMPERATURE=0.1
```

**Benefits**: Centralized billing, multiple providers, organizational control.

**See**: `docs/PROXY_LLM_SETUP.md` for detailed proxy configuration.

### Using OpenAI Direct

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
# LLM_BASE_URL=  (leave empty or don't set)
LLM_MODEL=gpt-4o
LLM_TEMPERATURE=0.1
```

### Using Anthropic (Claude)

```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
LLM_MODEL=claude-3-5-sonnet-20241022
LLM_TEMPERATURE=0.1
```

### Using Ollama (Local, Free)

```bash
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=llama3
LLM_TEMPERATURE=0.1
```

**Note**: For Ollama, you must first install and run Ollama locally, then pull the model:
```bash
ollama pull llama3
```

## Usage

### From Django Admin

1. Go to Documents admin page
2. Select one or more documents (that have SDG links)
3. Choose action: **"🤖 Calculate SDG relevance scores (LLM)"**
4. Click "Go"

The system will:
- Validate LLM configuration
- Extract text from document source files
- Analyze each linked SDG
- Update relevance_score and justification
- Show success/failure messages

### From Command Line

#### Process a specific document
```bash
python manage.py ingest_sdg_relevance --doc 42
```

#### Process 10 most recent documents
```bash
python manage.py ingest_sdg_relevance --batch 10
```

#### Process all documents needing scores
```bash
python manage.py ingest_sdg_relevance --all
```

#### Force recalculation (overwrite existing scores)
```bash
python manage.py ingest_sdg_relevance --doc 42 --force
```

## How It Works

### Processing Flow

1. **Validation**: Checks LLM configuration is valid
2. **Document Selection**: Gets documents with existing SDG links
3. **For each DocumentSDG relationship**:
   - Extract text from all source files (PDF, DOCX, TXT)
   - Generate optimized prompt for the specific SDG
   - Call LLM with retry logic (3 attempts, exponential backoff)
   - Parse JSON response (score + justification)
   - Update DocumentSDG record
4. **Results**: Mark document as AI-checked, log statistics

### Important Notes

- **Only processes EXISTING SDG links**: If a document has 3 SDGs linked, it makes 3 LLM calls, not 17
- **Skips already-calculated scores**: Unless you use `--force`
- **Robust error handling**: Failed analyses are logged to `logs/failed_sdg_scores.log`
- **Retry logic**: 3 attempts with exponential backoff (2s, 4s, 8s)

## Logs

### General Processing Log
**Location**: `logs/sdg_ingestion.log`

Contains:
- INFO: Processing progress
- ERROR: Analysis failures
- DEBUG: Detailed LLM interactions

### Failure Log
**Location**: `logs/failed_sdg_scores.log`

Format: `timestamp,document_id,sdg_id,error_message`

Use this to identify and manually review failed analyses.

## Troubleshooting

### "LLM configuration error"
- Check your `.env` file has the correct API key
- Verify `LLM_PROVIDER` matches your credentials
- Ensure API key is not the placeholder value

### "Document has no SDG links"
- Link SDGs to the document first (via Django Admin)
- The module only processes existing relationships

### "No text could be extracted"
- Verify source files are attached to the document
- Check file formats are supported (PDF, DOCX, TXT, HTML)
- Review file extraction logs for specific errors

### "All retries failed"
- Check your internet connection
- Verify API key is valid and has credits/quota
- Check LLM provider status page
- Review `logs/sdg_ingestion.log` for detailed error

### Rate Limiting
If processing many documents:
- Use smaller batches: `--batch 5`
- Add delays between batches manually
- Consider upgrading your API plan

## Cost Estimation

### OpenAI (GPT-4o)
- ~4,000 characters per document
- ~500 tokens response
- Cost: ~$0.01-0.02 per SDG analysis
- Document with 3 SDGs: ~$0.03-0.06

### Anthropic (Claude)
- Similar cost structure to OpenAI
- ~$0.01-0.02 per SDG analysis

### Ollama (Local)
- **FREE** (runs on your hardware)
- Requires decent GPU for fast processing
- No API costs

## Future Extensions

This same architecture can be extended to:
- **Theme relevance**: Calculate relevance for DocumentTheme
- **Actor relevance**: Calculate relevance for DocumentActor
- **Celery integration**: Async processing for large batches
- **Batch optimization**: Process multiple SDGs per LLM call
- **Embedding-based pre-filtering**: Reduce unnecessary LLM calls

## Support

For issues or questions:
1. Check logs: `logs/sdg_ingestion.log`
2. Review failed analyses: `logs/failed_sdg_scores.log`
3. Validate configuration: Run with `--doc ID` on a test document
4. Check LangChain documentation: https://python.langchain.com/docs/

