# 📚 SPIDERHUB Project Documentation

This folder contains technical documentation and development guides for SPIDERHUB.

## 📖 Document Index

### 🚀 Deployment and Configuration

- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Complete checklist for safe deployments
  - JavaScript changes verification
  - Incognito mode testing
  - Deployment process and post-deployment verification
  
- **[CACHE_BUSTING_V2_SUMMARY.md](CACHE_BUSTING_V2_SUMMARY.md)** - v2.0 cache busting system
  - Automatic content hash
  - Docker and Git integration
  - New deployment workflow

### 🔒 Security

- **[CSP_IMPLEMENTATION.md](CSP_IMPLEMENTATION.md)** - Content Security Policy implementation
  - Nonce-based script execution
  - Security improvements and configuration
  - Template tag usage and best practices

- **[CSP_TESTING_GUIDE.md](CSP_TESTING_GUIDE.md)** - CSP testing procedures
  - Complete testing checklist
  - Browser verification steps
  - Troubleshooting guide

- **[SECURITY_CSP_QUICKSTART.md](SECURITY_CSP_QUICKSTART.md)** - Quick start guide for CSP
  - Essential security configuration
  - Quick setup steps

### 🌍 Translation System

- **[TRANSLATIONS.md](TRANSLATIONS.md)** - ⭐ Quick translations guide (START HERE)
  - Quick commands
  - Code syntax
  - Quick checklist

- **[TRANSLATION_WORKFLOW.md](TRANSLATION_WORKFLOW.md)** - Complete step-by-step guide
  - Complete process for new features
  - Adding translations to HTML templates and JavaScript
  - Troubleshooting

- **[TRANSLATION_QUICK_REFERENCE.md](TRANSLATION_QUICK_REFERENCE.md)** - Commands cheatsheet
  - Important commands
  - Available scripts
  - Quick shortcuts

- **[TRANSLATION_FILES_REFERENCE.md](TRANSLATION_FILES_REFERENCE.md)** - Files reference
  - Directory structure
  - Which file to edit for each case
  - .po files format

### 🛠️ Migration Guides

- **[LOGGER_MIGRATION_GUIDE.md](LOGGER_MIGRATION_GUIDE.md)** - Centralized logging system migration
  - Log levels (debug, info, warn, error)
  - Logger with context (Child Logger)
  - Environment configuration

- **[EVENTBUS_MIGRATION_GUIDE.md](EVENTBUS_MIGRATION_GUIDE.md)** - Event system migration
  - Event centralization
  - Automatic memory leak prevention
  - Debugging with EventBus

- **[LOGGING_CONFIGURATION.md](LOGGING_CONFIGURATION.md)** - Logging configuration
  - Backend configuration (Django)
  - Frontend configuration (JavaScript)
  - Levels per environment

### 🎯 SDG Relevance & AI Analysis

- **[SDG_RELEVANCE_QUICKSTART.md](SDG_RELEVANCE_QUICKSTART.md)** - Quick start guide (5 minutes)
  - Prerequisites and setup
  - Usage instructions
  - Troubleshooting common issues

- **[SDG_RELEVANCE_SETUP.md](SDG_RELEVANCE_SETUP.md)** - Complete setup guide
  - Environment configuration
  - Provider options (OpenAI, Anthropic, Ollama)
  - Command-line usage and examples

- **[PROXY_LLM_SETUP.md](PROXY_LLM_SETUP.md)** - Corporate proxy LLM configuration
  - CEDIA proxy setup
  - Multi-provider support
  - Troubleshooting proxy connections

- **[SDG_CHARTS_STANDARDIZATION_SUMMARY.md](SDG_CHARTS_STANDARDIZATION_SUMMARY.md)** - SDG visualization charts
  - Radar chart dual-dataset configuration
  - Bar chart standardization
  - Official UN colors implementation

### 🔧 Configuration and Setup

- **[INSTALL_GETTEXT_WINDOWS.md](INSTALL_GETTEXT_WINDOWS.md)** - GNU Gettext installation on Windows
  - Installation options (Chocolatey, manual, WSL)
  - Translation files compilation
  - Troubleshooting

### 📊 Backend Documentation

- **[STRATEGIC_CABINET_BACKEND_LOGIC.md](STRATEGIC_CABINET_BACKEND_LOGIC.md)** - Strategic Cabinet backend logic
  - Participation types
  - Endpoints and their logic
  - Filters and data consistency

---

## 🗑️ Cleanup History

### October 21, 2025 - Second Cleanup (19 files removed)

**SDG Relevance Documents (5 files):**
- ❌ `SDG_RELEVANCE_COMPLETE.md` - Overly detailed, info duplicated in other docs
- ❌ `SDG_RELEVANCE_IMPLEMENTATION_SUMMARY.md` - Technical details duplicated
- ❌ `README_SDG_RELEVANCE.md` - Older Spanish version
- ❌ `RESUMEN_FINAL_SDG_RELEVANCE.md` - Older Spanish summary
- ❌ `PROXY_LLM_CHANGES_SUMMARY.md` - Changelog already in setup doc

**SDG Charts & Visualization (5 files):**
- ❌ `SDG_NORMALIZATION_FINAL_SUMMARY.md` - Intermediate process doc
- ❌ `SDG_FINAL_CORRECTED.md` - Intermediate correction doc
- ❌ `SDG_VISUALIZATION_SUMMARY.md` - Older summary version
- ❌ `SDG_TRANSLATIONS_SUMMARY.md` - Translations process, duplicated
- ❌ `SDG_DESCRIPTIONS_TRANSLATION_FIX.md` - Completed fix

**Security & CSP (2 files):**
- ❌ `CSP_IMPLEMENTATION_SUMMARY.md` - Nearly identical to main CSP doc
- ❌ `CSP_VIS_NETWORK_FIX.md` - Specific fix completed

**Cache Busting (1 file):**
- ❌ `CACHE_BUSTING.md` - Mixed v1/v2, kept only V2 summary

**Fixes & Troubleshooting (6 files):**
- ❌ `SECURITY_HEADERS_FIX_SUMMARY.md` - Completed fix
- ❌ `PRODUCTION_ERRORS_FIX.md` - Completed fix
- ❌ `DEPLOY_HSTS_FIX.md` - Completed fix
- ❌ `TROUBLESHOOTING_HSTS.md` - Issue resolved
- ❌ `I18N_URL_FIX.md` - Completed fix
- ❌ `MIGRATION_SAFETY_ANALYSIS.md` - Specific analysis no longer relevant

### October 14, 2025 - Initial Cleanup (14 files removed)

**Translation System (10 files):**
- ❌ `SESSION_SUMMARY_TRANSLATIONS_OCT_2025.md` - Old session summary
- ❌ `RESUMEN_CAMBIOS.md` - Old changes summary
- ❌ `RESUMEN_TRADUCCIONES_COMPLETADO.md` - Completed translations summary
- ❌ `RESUMEN_SISTEMA_MULTILENGUAJE_ES.md` - Spanish summary (duplicate)
- ❌ `MULTILINGUAL_IMPLEMENTATION_PROGRESS.md` - Implementation progress
- ❌ `MULTILINGUAL_SYSTEM_STATUS.md` - System status (obsolete)
- ❌ `SISTEMA_MULTILENGUAJE_FINAL.md` - Final Spanish system (duplicate)
- ❌ `RESPONSIVE_FIX_LANGUAGE_SWITCHER.md` - Specific fix
- ❌ `LANGUAGE_SWITCHER_UX_IMPROVEMENTS.md` - UX improvements
- ❌ `TRANSLATION_COVERAGE_REPORT.md` - Coverage report

**Other (4 files):**
- ❌ `CACHE_BUSTING_CHANGES_SUMMARY.md` - Old summary
- ❌ `REFACTOR_TEST_RESULTS.md` - Test results
- ❌ `EXPLORE_PAGE_REFACTOR.md` - Completed refactor
- ❌ `PROYECTO_REFACTORING_COMPLETADO.md` - Completed refactoring

### Deletion Criteria

Documents were removed if they met one or more of these criteria:
- ✓ Duplicate or redundant information
- ✓ Intermediate progress reports (task completed)
- ✓ Specific fixes that are already implemented
- ✓ Obsolete session summaries
- ✓ Information superseded by newer versions
- ✓ Content consolidated into other documents

---

## 📌 Current Documentation (19 files)

All maintained documents are:
- ✅ Referenced in the index above
- ✅ Current and relevant technical guides
- ✅ Useful development references
- ✅ Active project configurations
- ✅ Regularly updated and maintained

---

## 📋 Document Version Tracking

For complete version history and chronological order of all documentation:
- **[DOCUMENT_VERSION_INDEX.md](DOCUMENT_VERSION_INDEX.md)** - Complete version index with chronological timeline

## 🔗 References

For more information, see:
- [Main README.md](../README.md)
- "Technical Documentation" section in README
- "Internationalization (i18n)" section in README

---

**Document Version:** v3.0  
**Last Updated:** October 21, 2025  
**Change Log:**
- v3.0 (Oct 21, 2025): Major cleanup - Removed 19 obsolete files
- v2.0 (Oct 14, 2025): Initial cleanup - Removed 14 obsolete files
- v1.0 (Initial): Created documentation index
