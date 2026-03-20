# 📚 SPIDERHUB Project Documentation

This folder contains technical documentation and development guides for SPIDERHUB.

## 📖 Document Index

### 🚀 Deployment and Configuration

- **[DEPLOYMENT_CHECKLIST_v1.3.md](DEPLOYMENT_CHECKLIST_v1.3.md)** - Complete checklist for safe deployments
  - JavaScript changes verification
  - Incognito mode testing
  - Deployment process and post-deployment verification

- **[DEPLOYMENT_PRODUCTION.md](DEPLOYMENT_PRODUCTION.md)** - Docker save/load vs Docker Hub, verificación post-deploy

- **[SERVER_PRODUCTION_ACCESS_v1.0.example.md](SERVER_PRODUCTION_ACCESS_v1.0.example.md)** - SSH, `~/spiderhub`, build, compose, logs (plantilla pública; copia local sin commitear: `SERVER_PRODUCTION_ACCESS_v1.0.md` en `.gitignore`)
  
- **[STATIC_ASSETS_AND_CACHE_v1.0.md](STATIC_ASSETS_AND_CACHE_v1.0.md)** - Static files, HTTP cache, `STORAGES`, `BUILD_ID`, nginx, VersionCheckService

### 🔒 Security

- **[CSP_IMPLEMENTATION_v1.1.md](CSP_IMPLEMENTATION_v1.1.md)** - Content Security Policy implementation
  - Nonce-based script execution
  - Security improvements and configuration
  - Template tag usage and best practices

- **[CSP_TESTING_GUIDE_v1.0.md](CSP_TESTING_GUIDE_v1.0.md)** - CSP testing procedures
  - Complete testing checklist
  - Browser verification steps
  - Troubleshooting guide

- **[SECURITY_CSP_QUICKSTART_v1.0.md](SECURITY_CSP_QUICKSTART_v1.0.md)** - Quick start guide for CSP
  - Essential security configuration
  - Quick setup steps

### 🌍 Translation System

- **[TRANSLATIONS_v1.0.md](TRANSLATIONS_v1.0.md)** - ⭐ Quick translations guide (START HERE)
  - Quick commands
  - Code syntax
  - Quick checklist

- **[TRANSLATION_WORKFLOW_v1.1.md](TRANSLATION_WORKFLOW_v1.1.md)** - Complete step-by-step guide
  - Complete process for new features
  - Adding translations to HTML templates and JavaScript
  - Troubleshooting

- **[TRANSLATION_QUICK_REFERENCE_v1.0.md](TRANSLATION_QUICK_REFERENCE_v1.0.md)** - Commands cheatsheet
  - Important commands
  - Available scripts
  - Quick shortcuts

- **[TRANSLATION_FILES_REFERENCE_v1.0.md](TRANSLATION_FILES_REFERENCE_v1.0.md)** - Files reference
  - Directory structure
  - Which file to edit for each case
  - .po files format

### 🛠️ Migration Guides

- **[LOGGER_MIGRATION_GUIDE_v1.0.md](LOGGER_MIGRATION_GUIDE_v1.0.md)** - Centralized logging system migration
  - Log levels (debug, info, warn, error)
  - Logger with context (Child Logger)
  - Environment configuration

- **[EVENTBUS_MIGRATION_GUIDE_v1.0.md](EVENTBUS_MIGRATION_GUIDE_v1.0.md)** - Event system migration
  - Event centralization
  - Automatic memory leak prevention
  - Debugging with EventBus

- **[LOGGING_CONFIGURATION_v1.0.md](LOGGING_CONFIGURATION_v1.0.md)** - Logging configuration
  - Backend configuration (Django)
  - Frontend configuration (JavaScript)
  - Levels per environment

### 🎯 SDG Relevance & AI Analysis

- **[SDG_RELEVANCE_QUICKSTART_v1.0.md](SDG_RELEVANCE_QUICKSTART_v1.0.md)** - Quick start guide (5 minutes)
  - Prerequisites and setup
  - Usage instructions
  - Troubleshooting common issues

- **[SDG_RELEVANCE_SETUP_v1.0.md](SDG_RELEVANCE_SETUP_v1.0.md)** - Complete setup guide
  - Environment configuration
  - Provider options (OpenAI, Anthropic, Ollama)
  - Command-line usage and examples

- **[PROXY_LLM_SETUP_v1.1.md](PROXY_LLM_SETUP_v1.1.md)** - Corporate proxy LLM configuration
  - CEDIA proxy setup
  - Multi-provider support
  - Troubleshooting proxy connections

- **[SDG_CHARTS_STANDARDIZATION_SUMMARY_v1.0.md](SDG_CHARTS_STANDARDIZATION_SUMMARY_v1.0.md)** - SDG visualization charts
  - Radar chart dual-dataset configuration
  - Bar chart standardization
  - Official UN colors implementation

### 🔧 Configuration and Setup

- **[INSTALL_GETTEXT_WINDOWS_v1.0.md](INSTALL_GETTEXT_WINDOWS_v1.0.md)** - GNU Gettext installation on Windows
  - Installation options (Chocolatey, manual, WSL)
  - Translation files compilation
  - Troubleshooting

### 🧪 Testing

- **[JEST_SETUP_v1.0.md](JEST_SETUP_v1.0.md)** - Jest unit testing configuration
  - Jest and Babel setup
  - Test structure and examples
  - NPM scripts for testing

### 📊 Backend Documentation

- **[STRATEGIC_CABINET_BACKEND_LOGIC_v1.0.md](STRATEGIC_CABINET_BACKEND_LOGIC_v1.0.md)** - Strategic Cabinet backend logic
  - Participation types
  - Endpoints and their logic
  - Filters and data consistency

---

## 🗑️ Cleanup History

### March 20, 2026 - Static assets documentation
- ❌ Removed `CACHE_BUSTING_V2_SUMMARY_v2.0.md` and `STATIC_ASSETS_PIPELINE.md`
- ❌ Removed `DEPLOYMENT_CHECKLIST_v1.2.md` (superseded by v1.3)
- ✅ **[STATIC_ASSETS_AND_CACHE_v1.0.md](STATIC_ASSETS_AND_CACHE_v1.0.md)** — guía canónica de caché y estáticos
- ✅ **[DEPLOYMENT_CHECKLIST_v1.3.md](DEPLOYMENT_CHECKLIST_v1.3.md)** — checklist alineado con manifest / `build_id`

### October 21, 2025 - Third Update: File Versioning
- ✅ **Added version numbers to all filenames** (21 files)
- ✅ Format: `DOCUMENT_NAME_v1.0.md`
- ✅ Easy identification of latest versions
- ✅ Clear historical tracking

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

**Static assets / cache (superseded files):**
- ❌ `CACHE_BUSTING.md` - removed earlier (mixed v1/v2)
- ❌ `CACHE_BUSTING_V2_SUMMARY_v2.0.md` - **March 2026:** replaced by `STATIC_ASSETS_AND_CACHE_v1.0.md`
- ❌ `STATIC_ASSETS_PIPELINE.md` - **March 2026:** merged into `STATIC_ASSETS_AND_CACHE_v1.0.md`

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

## 📌 Current Documentation (21 files)

All maintained documents are:
- ✅ **Versioned filenames** for easy identification
- ✅ Referenced in the index above
- ✅ Current and relevant technical guides
- ✅ Useful development references
- ✅ Active project configurations
- ✅ Regularly updated and maintained

---

## 📋 Document Version Tracking

For complete version history and chronological order of all documentation:
- **[DOCUMENT_VERSION_INDEX_v1.0.md](DOCUMENT_VERSION_INDEX_v1.0.md)** - Complete version index with chronological timeline

## 🔗 References

For more information, see:
- [Main README.md](../README.md)
- "Technical Documentation" section in README
- "Internationalization (i18n)" section in README

---

## 📝 File Naming Convention

**Format:** `DOCUMENT_NAME_v[MAJOR].[MINOR].md`

**Examples:**
- `README_v3.0.md` - Major version 3.0
- `TRANSLATIONS_v1.0.md` - Initial version 1.0
- `CSP_IMPLEMENTATION_v1.1.md` - Minor update to 1.1

**Benefits:**
- 📂 Instant version identification in file explorer
- 🔍 Easy to find latest versions
- 📊 Clear historical tracking
- 🗂️ Sortable by name shows version progression

---

**Document Version:** v3.1  
**Last Updated:** October 21, 2025  
**Change Log:**
- v3.1 (Oct 21, 2025): Added version numbers to filenames
- v3.0 (Oct 21, 2025): Major cleanup - Removed 19 obsolete files
- v2.0 (Oct 14, 2025): Initial cleanup - Removed 14 obsolete files
- v1.0 (Initial): Created documentation index
