# SDG Relevance Services

This package provides services for calculating SDG relevance scores using Large Language Models (LLMs).

## Overview

The SDG Relevance module analyzes documents and calculates how relevant they are to each linked Sustainable Development Goal (SDG). It uses AI/LLM analysis to generate:
- **Relevance Score** (0.0-1.0): Quantitative measure of alignment
- **Justification**: 2-3 sentence explanation of the score

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                          │
│  • Django Admin Action                                      │
│  • Management Command (CLI)                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              sdg_relevance_service.py                       │
│  • Orchestrates the entire process                          │
│  • Validates configuration                                  │
│  • Coordinates text extraction + LLM calls                  │
│  • Updates database                                         │
└─────┬────────────┬────────────┬────────────┬───────────────┘
      │            │            │            │
┌─────▼──────┐ ┌──▼──────┐ ┌───▼─────┐ ┌───▼──────┐
│   text_    │ │  llm_   │ │ logger  │ │  utils   │
│ extraction │ │ service │ │         │ │          │
│            │ │         │ │         │ │          │
│ PDF/DOCX   │ │LangChain│ │  Logs   │ │Validation│
│    TXT     │ │ OpenAI  │ │ Failures│ │ Helpers  │
│   HTML     │ │Anthropic│ │         │ │          │
│            │ │ Ollama  │ │         │ │          │
└────────────┘ └─────────┘ └─────────┘ └──────────┘
```

## Service Descriptions

### `text_extraction.py`
**Purpose**: Extract text from various document formats

**Key Functions**:
- `extract_text_from_pdf(file_path)` - Uses PyMuPDF (fitz)
- `extract_text_from_docx(file_path)` - Uses python-docx
- `extract_text_from_txt(file_path)` - Multi-encoding support
- `extract_all_document_text(document)` - **Main entry point**

**Error Handling**: Each file extraction is independent. If one file fails, others continue processing.

**Example**:
```python
from apps.documents.services import extract_all_document_text

success, text, errors = extract_all_document_text(document)
if success:
    print(f"Extracted {len(text)} characters")
```

### `llm_service.py`
**Purpose**: Provider-agnostic LLM interface using LangChain

**Key Components**:
- `LLMService` - Main service class
- `get_llm_service()` - Singleton accessor
- `call_llm(prompt)` - Robust LLM calls with retry logic

**Supported Providers**:
- **OpenAI**: GPT-4o, GPT-4-turbo, GPT-3.5-turbo
- **Anthropic**: Claude-3.5-Sonnet, Claude-3-Opus
- **Ollama**: llama3, mistral, mixtral (local)

**Retry Logic**:
- 3 attempts with exponential backoff (2s, 4s, 8s)
- Handles timeout, connection errors, rate limits
- Logs each attempt

**Example**:
```python
from apps.documents.services import LLMService

llm = LLMService()
prompt = llm.generate_sdg_relevance_prompt(
    document_title="Digital Strategy 2024",
    document_text="...",
    sdg_number=9,
    sdg_label="Industry, Innovation and Infrastructure"
)
result = llm.call_llm(prompt)
# result = {"score": 0.85, "justification": "..."}
```

### `sdg_relevance_service.py`
**Purpose**: Main orchestration and business logic

**Key Functions**:
- `calculate_sdg_relevance(document, sdg, doc_sdg_instance)` - Analyze single SDG
- `process_document_sdgs(document, force=False)` - Process all SDG links for a document
- `process_batch_documents(queryset)` - Batch processing
- `validate_configuration()` - Pre-flight checks

**Important**: This service ONLY processes SDGs that are already linked to each document. It does NOT analyze all 17 SDGs.

**Workflow**:
1. Validate LLM configuration
2. Extract document text
3. For each existing DocumentSDG link:
   - Generate SDG-specific prompt
   - Call LLM with retry logic
   - Parse response (score + justification)
   - Update DocumentSDG record
4. Mark document as AI-checked

**Example**:
```python
from apps.documents.services import process_document_sdgs
from apps.documents.models import Document

document = Document.objects.get(id=42)
stats = process_document_sdgs(document, force=False)
# stats = {'processed': 3, 'success': 3, 'failed': 0, 'skipped': 0}
```

### `logger.py`
**Purpose**: Centralized logging configuration

**Log Files**:
- `logs/sdg_ingestion.log` - All processing events (INFO, ERROR, DEBUG)
- `logs/failed_sdg_scores.log` - Failed analyses in CSV format

**Key Functions**:
- `get_logger(name)` - Get configured logger
- `log_failure(document_id, sdg_id, error)` - Log failed analysis

**Log Format**:
```
[2024-10-21 10:30:15] INFO - sdg_ingestion - Processing Document 42: Digital Strategy
[2024-10-21 10:30:20] ERROR - sdg_ingestion - LLM call failed: Connection timeout
```

**Failure Log Format** (CSV):
```
2024-10-21 10:30:20,42,9,Connection timeout after 3 retries
```

### `utils.py`
**Purpose**: Helper functions and validators

**Key Functions**:
- `validate_llm_config()` - Check environment variables
- `truncate_text(text, max_chars)` - Smart text truncation
- `parse_llm_json_response(text)` - Extract JSON from LLM output
- `validate_score(score)` - Ensure 0.0-1.0 range
- `clean_text_for_analysis(text)` - Normalize text
- `format_processing_stats(stats)` - Pretty print statistics

**Example**:
```python
from apps.documents.services.utils import validate_llm_config, truncate_text

# Check config before processing
is_valid, error = validate_llm_config()
if not is_valid:
    print(f"Configuration error: {error}")

# Truncate long text
short_text = truncate_text(long_text, max_chars=4000, strategy='smart')
```

## Usage Examples

### Basic Usage (Single Document)
```python
from apps.documents.models import Document
from apps.documents.services import process_document_sdgs

# Get a document
document = Document.objects.get(id=42)

# Process all its SDG links
stats = process_document_sdgs(document)

print(f"Processed: {stats['success']} SDG links")
print(f"Failed: {stats['failed']} SDG links")
```

### Batch Processing
```python
from apps.documents.models import Document
from apps.documents.services import process_batch_documents

# Get documents needing processing
documents = Document.objects.filter(
    sdgs__isnull=False,
    documentsdg__relevance_score__isnull=True
).distinct()[:10]

# Process batch
stats = process_batch_documents(documents)

print(f"Documents: {stats['documents_processed']}")
print(f"Success: {stats['success']}")
print(f"Time: {stats['total_time']:.2f}s")
```

### Custom LLM Call
```python
from apps.documents.services import get_llm_service

llm = get_llm_service()

custom_prompt = """
Analyze this document for SDG 13 (Climate Action) relevance.
Document: [Your text here]
Return JSON: {"score": 0.0-1.0, "justification": "..."}
"""

result = llm.call_llm(custom_prompt)
print(f"Score: {result['score']}")
print(f"Reason: {result['justification']}")
```

## Configuration

Required environment variables (in `.env`):

```bash
# Provider selection
LLM_PROVIDER=openai  # or: anthropic, ollama

# Credentials (only one needed based on provider)
OPENAI_API_KEY=sk-proj-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
OLLAMA_BASE_URL=http://localhost:11434

# Model settings
LLM_MODEL=gpt-4o
LLM_TEMPERATURE=0.1
LLM_MAX_TOKENS=500
LLM_TIMEOUT=60
LLM_MAX_RETRIES=3
```

## Error Handling

### Text Extraction Errors
- **Behavior**: Continue processing other files
- **Logging**: Error logged, added to `errors` list
- **Recovery**: Partial text from successful files is still used

### LLM Call Errors
- **Behavior**: Retry 3 times with exponential backoff
- **Logging**: Each attempt logged, final failure to `failed_sdg_scores.log`
- **Recovery**: Process continues to next SDG

### Configuration Errors
- **Behavior**: Fail fast before processing
- **Logging**: Clear error message with setup instructions
- **Recovery**: User must fix configuration

## Performance

### Typical Processing Times
- **Text extraction**: 1-3 seconds per document
- **LLM call**: 3-10 seconds per SDG (depends on model)
- **Total per document** (3 SDGs): ~15-35 seconds

### Optimization Tips
1. Use `gpt-4o-mini` for faster/cheaper processing
2. Process in batches during off-peak hours
3. Set `LLM_TEMPERATURE=0.0` for deterministic results
4. Use Ollama for free local processing (slower but no API costs)

## Testing

### Unit Tests
```bash
poetry run python manage.py test apps.documents.tests.test_services
```

### Integration Test
```bash
# Test with a real document
poetry run python manage.py ingest_sdg_relevance --doc 1
```

### Configuration Test
```python
from apps.documents.services.utils import validate_llm_config

is_valid, error = validate_llm_config()
assert is_valid, f"Config error: {error}"
```

## Extending the Module

### Add New File Format
In `text_extraction.py`:
```python
def extract_text_from_xml(file_path):
    # Your implementation
    return success, text, error

# Update extract_all_document_text() to handle 'xml' type
```

### Add New LLM Provider
In `llm_service.py`:
```python
def _initialize_google(self):
    from langchain_google_genai import ChatGoogleGenerativeAI
    self.llm = ChatGoogleGenerativeAI(
        model=self.model,
        temperature=self.temperature,
        # ...
    )

# Update _initialize_llm() to handle 'google' provider
```

### Extend to Themes/Actors
Copy `sdg_relevance_service.py` and:
1. Replace `DocumentSDG` with `DocumentTheme` or `DocumentActor`
2. Update prompt template for theme/actor analysis
3. Create new management command

## Troubleshooting

### "PyMuPDF not found"
```bash
poetry add PyMuPDF
```

### "langchain_openai not found"
```bash
poetry add langchain-openai
```

### "No module named 'apps.documents.services'"
Ensure `__init__.py` exists in the services directory.

### Logs not appearing
Check that `logs/` directory exists at project root. It's created automatically, but permissions may prevent it.

## Best Practices

1. **Always validate config first**:
   ```python
   is_valid, error = validate_configuration()
   if not is_valid:
       raise ValueError(error)
   ```

2. **Use force=False by default**:
   - Avoids reprocessing and wasting API credits
   - Only use `force=True` when intentionally recalculating

3. **Monitor logs**:
   - Check `sdg_ingestion.log` after batch processing
   - Review `failed_sdg_scores.log` for failures

4. **Start small**:
   - Test with 1-2 documents first
   - Then small batches (5-10)
   - Finally, process all

5. **Handle failures gracefully**:
   - Failed analyses don't stop the process
   - Review failures manually or retry later

## Maintenance

### Updating Dependencies
```bash
poetry update langchain langchain-openai
```

### Cleaning Logs
```bash
# Archive old logs
mv logs/sdg_ingestion.log logs/sdg_ingestion.log.$(date +%Y%m%d)
mv logs/failed_sdg_scores.log logs/failed_sdg_scores.log.$(date +%Y%m%d)
```

### Monitoring Costs
Review OpenAI usage: https://platform.openai.com/usage

## Related Documentation

- **Quick Start**: `docs/SDG_RELEVANCE_QUICKSTART.md`
- **Setup Guide**: `docs/SDG_RELEVANCE_SETUP.md`
- **Implementation Summary**: `docs/SDG_RELEVANCE_IMPLEMENTATION_SUMMARY.md`

---

**Version**: 1.0  
**Last Updated**: October 21, 2025  
**Maintainer**: SPIDERHUB Development Team

