# Corporate LLM Proxy Configuration

This guide explains how to configure the SDG Relevance module with a corporate LLM proxy/gateway (such as CEDIA's).

---

## 🏢 What is an LLM Proxy?

An LLM proxy is a corporate service that:
- Centralizes access to multiple LLM providers (OpenAI, Anthropic, Google, etc.)
- Provides a unified OpenAI-compatible API
- Manages authentication, costs, and corporate policies
- Allows model switching without code changes

### Example: CEDIA Proxy
```
Base URL: https://api.example.org.ec/v1
API Key: <corporate-key>
Available models:
  - openai/gpt-4o-mini
  - openai/gpt-4.1-nano
  - gemini/gemini-2.5-flash-lite-preview-09-2025
  - ... other models
```

---

## ⚙️ Configuration

### Option 1: Using LLM Proxy (Recommended for enterprises)

Add these variables to your `.env`:

```bash
# ============================================================================
# CORPORATE LLM PROXY CONFIGURATION
# ============================================================================

# Provider (always 'openai' for OpenAI-compatible proxies)
LLM_PROVIDER=openai

# Corporate proxy API key
OPENAI_API_KEY=<your-proxy-api-key>

# Proxy base URL (IMPORTANT: this is the key difference)
LLM_BASE_URL=<proxy-base-url>

# Model (use provider prefix as required by proxy)
# Examples:
#   - openai/gpt-4o-mini        (OpenAI via proxy)
#   - openai/gpt-4.1-nano       (OpenAI via proxy)
#   - gemini/gemini-2.5-flash   (Google via proxy)
LLM_MODEL=openai/gpt-4o-mini

# Model parameters
LLM_TEMPERATURE=0.1
LLM_MAX_TOKENS=500
LLM_TIMEOUT=60
LLM_MAX_RETRIES=3
```

### Option 2: Using Direct OpenAI (No proxy)

If you prefer to use OpenAI directly:

```bash
# Provider
LLM_PROVIDER=openai

# Direct OpenAI API key
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# DO NOT configure LLM_BASE_URL (or leave it empty)
# LLM_BASE_URL=

# Model (no prefix when using direct OpenAI)
LLM_MODEL=gpt-4o

# Parameters
LLM_TEMPERATURE=0.1
LLM_MAX_TOKENS=500
LLM_TIMEOUT=60
LLM_MAX_RETRIES=3
```

---

## 🔍 Key Differences

| Aspect | LLM Proxy | Direct OpenAI |
|---------|-----------|----------------|
| **LLM_BASE_URL** | `https://api.example.org.ec/v1` | (empty) |
| **LLM_MODEL** | `openai/gpt-4o-mini` | `gpt-4o` |
| **OPENAI_API_KEY** | Proxy key | OpenAI key |
| **Costs** | Managed by company | Billed to you |
| **Models** | Multiple providers | OpenAI only |

---

## 🚀 Usage Examples

### Example 1: OpenAI via CEDIA Proxy

```bash
# .env
LLM_PROVIDER=openai
OPENAI_API_KEY=<your-proxy-key>
LLM_BASE_URL=https://api.example.org.ec/v1
LLM_MODEL=openai/gpt-4o-mini
LLM_TEMPERATURE=0.1
```

**Result**: Uses GPT-4o-mini through CEDIA proxy

### Example 2: Gemini via CEDIA Proxy

```bash
# .env
LLM_PROVIDER=openai  # Yes, 'openai' because proxy is OpenAI-compatible
OPENAI_API_KEY=<your-proxy-key>
LLM_BASE_URL=https://api.example.org.ec/v1
LLM_MODEL=gemini/gemini-2.5-flash-lite-preview-09-2025
LLM_TEMPERATURE=0.1
```

**Result**: Uses Gemini through CEDIA proxy (OpenAI-compatible API)

### Example 3: Direct OpenAI (no proxy)

```bash
# .env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxx
# LLM_BASE_URL=  (do not configure)
LLM_MODEL=gpt-4o
LLM_TEMPERATURE=0.1
```

**Result**: Uses OpenAI directly

---

## 🧪 Verify Configuration

### Step 1: Verify environment variables

```python
# In Django shell
python manage.py shell

>>> import os
>>> from dotenv import load_dotenv
>>> load_dotenv()
>>> 
>>> print("Provider:", os.getenv('LLM_PROVIDER'))
>>> print("API Key:", os.getenv('OPENAI_API_KEY')[:15] + "...")
>>> print("Base URL:", os.getenv('LLM_BASE_URL'))
>>> print("Model:", os.getenv('LLM_MODEL'))
```

**Expected output** (with CEDIA proxy):
```
Provider: openai
API Key: sk-SuGVigyKh-E...
Base URL: https://api.example.org.ec/v1
Model: openai/gpt-4o-mini
```

### Step 2: Configuration test

```python
# In Django shell
from apps.documents.services.utils import validate_llm_config

is_valid, error = validate_llm_config()
if is_valid:
    print("✅ Valid configuration")
else:
    print(f"❌ Error: {error}")
```

### Step 3: LLM connection test

```python
# In Django shell
from apps.documents.services.llm_service import get_llm_service

llm = get_llm_service()
print(f"LLM initialized: {llm.provider} / {llm.model}")

# Simple test
result = llm.call_llm("""
Analyze SDG 4 relevance for this text: "Education program for schools"
Return JSON: {"score": 0.0-1.0, "justification": "brief reason"}
""")

print(f"Score: {result['score']}")
print(f"Justification: {result['justification']}")
```

---

## 🔧 Technical Implementation

### How It Works Internally

The module automatically detects if you're using a proxy:

```python
# In llm_service.py (_initialize_openai)

api_key = os.getenv('OPENAI_API_KEY')
base_url = os.getenv('LLM_BASE_URL')  # <-- Detects proxy

config = {
    'model': self.model,
    'temperature': self.temperature,
    'max_tokens': self.max_tokens,
    'timeout': self.timeout,
    'max_retries': self.max_retries,
    'api_key': api_key
}

# If there's a base_url, add it to config
if base_url:
    config['base_url'] = base_url
    logger.info(f"Using custom LLM base URL: {base_url}")

self.llm = ChatOpenAI(**config)
```

### Compatibility

This configuration works with any proxy that is **OpenAI API compatible**:
- ✅ CEDIA Proxy
- ✅ Azure OpenAI
- ✅ LiteLLM Gateway
- ✅ OpenRouter
- ✅ Any OpenAI-compatible proxy

---

## 💡 Switching Models

To switch models, just modify `LLM_MODEL` in `.env`:

```bash
# From OpenAI to Gemini
LLM_MODEL=gemini/gemini-2.5-flash-lite-preview-09-2025

# Or to another OpenAI model
LLM_MODEL=openai/gpt-4.1-nano
```

No code changes needed, just restart the application:

```bash
# If using Django dev server
# Ctrl+C and run again
python manage.py runserver

# If using Gunicorn
sudo systemctl restart spiderhub
```

---

## 🐛 Troubleshooting

### Error: "base_url must start with http://"

**Cause**: Malformed `LLM_BASE_URL`

**Solution**:
```bash
# ❌ Incorrect
LLM_BASE_URL=api.cedia.org.ec/v1

# ✅ Correct
LLM_BASE_URL=https://api.example.org.ec/v1
```

### Error: "Invalid API Key"

**Cause**: Incorrect or expired API key

**Solution**: 
1. Verify API key in proxy portal
2. Contact corporate proxy administrator
3. Regenerate API key if necessary

### Error: "Model not found: openai/gpt-4o-mini"

**Cause**: Model not available in proxy

**Solution**:
1. Check available models in your proxy
2. Update `LLM_MODEL` with a valid model
3. Contact proxy administrator

### Logs show "Using custom LLM base URL: https://api.example.org.ec/v1"

**Status**: ✅ **Correct**

This confirms the module detected the proxy and is using it.

### Very slow responses

**Possible cause**: High-latency proxy

**Solutions**:
1. Increase `LLM_TIMEOUT`:
   ```bash
   LLM_TIMEOUT=120  # 2 minutes
   ```

2. Reduce `max_tokens` for faster responses:
   ```bash
   LLM_MAX_TOKENS=300
   ```

3. Use a faster model:
   ```bash
   LLM_MODEL=openai/gpt-4o-mini  # Faster than gpt-4
   ```

---

## 📊 Recommended Models

### For SDG Analysis (Speed/Quality balance)

| Model | Speed | Quality | Cost | Recommended |
|--------|-----------|---------|-------|-------------|
| `openai/gpt-4o-mini` | ⚡⚡⚡ | ⭐⭐⭐ | 💰 | ✅ Yes |
| `openai/gpt-4o` | ⚡⚡ | ⭐⭐⭐⭐ | 💰💰 | Yes |
| `openai/gpt-4.1-nano` | ⚡⚡⚡⚡ | ⭐⭐ | 💰 | Large batch |
| `gemini/gemini-2.5-flash` | ⚡⚡⚡ | ⭐⭐⭐ | 💰 | Alternative |

**General recommendation**: `openai/gpt-4o-mini` - Excellent balance

---

## 🔐 Security

### Protect API Keys

**NEVER** commit the `.env` file:

```bash
# In .gitignore (should already be there)
.env
.env.local
.env.*.local
```

### Verify `.env` is ignored:

```bash
git status
# .env should NOT appear in the list
```

### Rotate API Keys

If an API key is exposed:
1. Revoke the key immediately in proxy portal
2. Generate a new key
3. Update `.env` with new key
4. Restart application

---

## 📚 Additional Resources

- **General Documentation**: `docs/SDG_RELEVANCE_SETUP_v1.0.md`
- **Quick Start**: `docs/SDG_RELEVANCE_QUICKSTART_v1.0.md`
- **Implementation**: Available in documentation index

---

## ✅ Configuration Checklist

- [ ] Obtain API key from corporate proxy
- [ ] Obtain proxy base URL
- [ ] Check available models
- [ ] Add variables to `.env`:
  - [ ] `LLM_PROVIDER=openai`
  - [ ] `OPENAI_API_KEY=your-key`
  - [ ] `LLM_BASE_URL=https://...`
  - [ ] `LLM_MODEL=openai/...` or `gemini/...`
- [ ] Verify configuration (Step 1 above)
- [ ] Connection test (Step 3 above)
- [ ] Process test document:
  ```bash
  python manage.py ingest_sdg_relevance --doc 1
  ```
- [ ] Review logs: `logs/sdg_ingestion.log`

---

**Ready for production?** 🚀

Once the test works, you can process all your documents:

```bash
python manage.py ingest_sdg_relevance --all
```

---

**Document Version:** v1.1  
**Created:** October 21, 2025  
**Last Updated:** October 21, 2025  
**Category:** AI & LLM Configuration  
**Status:** Production Ready ✅  
**Related:** SDG_RELEVANCE_SETUP_v1.0.md, SDG_RELEVANCE_QUICKSTART_v1.0.md
