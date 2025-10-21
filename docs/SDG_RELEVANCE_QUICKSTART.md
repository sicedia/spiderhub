# SDG Relevance Module - Quick Start Guide

Get up and running with SDG relevance scoring in 5 minutes!

---

## 📋 Prerequisites Checklist

- [ ] Python 3.10+ installed
- [ ] Django project running
- [ ] At least one LLM provider account (OpenAI recommended)
- [ ] Some documents with SDG links in the database

---

## ⚡ Quick Setup (5 Steps)

### Step 1: Install Dependencies (2 min)

```bash
# Install new packages
pip install -r requirements/base.txt

# This installs:
# - langchain, langchain-openai, langchain-anthropic, langchain-community
# - openai, anthropic
# - PyMuPDF, python-docx
```

### Step 2: Configure Environment (1 min)

Add these lines to your `.env` file:

**Opción A: Con Proxy LLM Corporativo** (Ej: CEDIA):
```bash
# LLM Configuration
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-SuGVigyKh-Ejf0BDMDR5bw  # Key del proxy
LLM_BASE_URL=https://api.cedia.org.ec/v1   # URL del proxy
LLM_MODEL=openai/gpt-4o-mini               # Modelo con prefijo
LLM_TEMPERATURE=0.1
LLM_MAX_TOKENS=500
LLM_TIMEOUT=60
LLM_MAX_RETRIES=3
```

**Opción B: Con OpenAI Directo**:
```bash
# LLM Configuration
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
# LLM_BASE_URL=  (dejar vacío o no configurar)
LLM_MODEL=gpt-4o
LLM_TEMPERATURE=0.1
LLM_MAX_TOKENS=500
LLM_TIMEOUT=60
LLM_MAX_RETRIES=3
```

**Get your OpenAI API key**: https://platform.openai.com/api-keys  
**Configuración Proxy LLM**: Ver `docs/PROXY_LLM_SETUP.md` para detalles

### Step 3: Test Configuration (30 sec)

```bash
# Test with a single document (replace 1 with an actual document ID)
python manage.py ingest_sdg_relevance --doc 1
```

**Expected output**:
```
================================================================================
SDG Relevance Ingestion
================================================================================
Validating LLM configuration...
✓ LLM configuration valid

Mode: Process specific document ID 1

Document: [Your Document Title]
Linked SDGs: 3

Starting processing...
================================================================================
[Processing logs...]
================================================================================
Processing Summary
================================================================================
SDG Links Processed:   3
✓ Successful:          3
✗ Failed:              0
Total Time:            15.42s
================================================================================
Processing complete! ✓
```

### Step 4: Verify Results (30 sec)

Go to **Django Admin → Documents → Your Document**:
- Scroll to "SDG Relationships" section
- Verify `relevance_score` is populated (e.g., 0.85)
- Verify `justification` has AI-generated text
- Document should be marked `AI Check Status: ✓`

### Step 5: Process More Documents (1 min)

```bash
# Option A: Process 10 recent documents
python manage.py ingest_sdg_relevance --batch 10

# Option B: Process all documents needing scores
python manage.py ingest_sdg_relevance --all

# Option C: Use Django Admin
# 1. Go to Documents admin page
# 2. Select documents with SDG links
# 3. Action: "🤖 Calculate SDG relevance scores"
# 4. Click "Go"
```

---

## 🎯 What Just Happened?

For each document, the system:

1. **Extracted text** from all attached files (PDF, DOCX, TXT)
2. **Called GPT-4o** for each linked SDG (not all 17!)
3. **Calculated score** (0.0-1.0) based on document relevance
4. **Generated justification** (2-3 sentence explanation)
5. **Updated database** with results
6. **Marked document** as AI-checked

---

## 📊 Example Results

### Before Processing:
| Document | SDG | Relevance Score | Justification |
|----------|-----|-----------------|---------------|
| Digital Strategy 2024 | SDG 9 | NULL | NULL |

### After Processing:
| Document | SDG | Relevance Score | Justification |
|----------|-----|-----------------|---------------|
| Digital Strategy 2024 | SDG 9 | 0.87 | "This document strongly aligns with SDG 9 (Industry, Innovation and Infrastructure) as it outlines comprehensive plans for digital infrastructure development, innovation hubs, and technology adoption across sectors. The strategy includes specific commitments to broadband expansion and innovation funding." |

---

## 🐛 Troubleshooting

### Error: "OPENAI_API_KEY not set"
**Solution**: Add your API key to `.env`:
```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

### Error: "Document has no SDG links"
**Solution**: Link SDGs to the document first:
1. Go to Django Admin → Documents → [Your Document]
2. Scroll to "SDG Relationships"
3. Add SDG links manually
4. Save, then run the command again

### Error: "No text could be extracted"
**Solution**: 
1. Check that source files are attached to the document
2. Verify files are PDF, DOCX, or TXT format
3. Try opening the files manually to ensure they're not corrupted

### Error: "All retries failed"
**Possible causes**:
- Check your internet connection
- Verify your API key is valid (login to OpenAI)
- Check you have API credits remaining
- Review `logs/sdg_ingestion.log` for details

### Nothing happens / No documents processed
**Reason**: All documents already have scores!

**Solution**: Use `--force` to recalculate:
```bash
python manage.py ingest_sdg_relevance --doc 1 --force
```

---

## 💰 Cost Estimation

### OpenAI GPT-4o Pricing (as of Oct 2024):
- Input: ~$2.50 per 1M tokens
- Output: ~$10 per 1M tokens

### Typical Document:
- Input: ~5,000 tokens (document text + prompt)
- Output: ~200 tokens (score + justification)
- **Cost per SDG**: ~$0.01-0.02

### Example Scenarios:
| Documents | SDGs per Doc | Total SDG Analyses | Estimated Cost |
|-----------|--------------|-------------------|----------------|
| 1 | 3 | 3 | $0.03-0.06 |
| 10 | 3 | 30 | $0.30-0.60 |
| 100 | 3 | 300 | $3.00-6.00 |
| 1,000 | 3 | 3,000 | $30-60 |

💡 **Tip**: Start with small batches (`--batch 5`) to test costs!

---

## 📂 Where to Find Results

### Database
- **Table**: `documents_document_sdgs`
- **Fields**: `relevance_score`, `justification`

### Django Admin
- **Documents** → Select document → Scroll to "SDG Relationships"
- **Document SDG Links** → Direct view of all relationships

### Logs
- **General log**: `logs/sdg_ingestion.log`
- **Failures**: `logs/failed_sdg_scores.log`

---

## 🚀 Next Steps

1. **Process your documents**:
   ```bash
   python manage.py ingest_sdg_relevance --all
   ```

2. **Review results** in Django Admin

3. **Check logs** for any failures:
   ```bash
   cat logs/failed_sdg_scores.log
   ```

4. **Retry failures** manually if needed:
   ```bash
   python manage.py ingest_sdg_relevance --doc <ID> --force
   ```

5. **Automate** (optional):
   - Add to cron job for new documents
   - Or integrate into document upload workflow

---

## 📚 Additional Resources

- **Full Setup Guide**: `docs/SDG_RELEVANCE_SETUP.md`
- **Implementation Details**: `docs/SDG_RELEVANCE_IMPLEMENTATION_SUMMARY.md`
- **LangChain Docs**: https://python.langchain.com/docs/
- **OpenAI Docs**: https://platform.openai.com/docs/

---

## 🎉 You're Ready!

The SDG Relevance module is now configured and ready to use.

**Need help?** Check the logs first:
```bash
tail -50 logs/sdg_ingestion.log
```

**Happy analyzing!** 🕸️

