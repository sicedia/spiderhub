# 📂 Translation Files Reference

## Directory Structure

```
locale/
├── en/
│   └── LC_MESSAGES/          # English (structure only, no .po/.mo files)
├── es/
│   └── LC_MESSAGES/
│       ├── django.po         # ✏️ EDIT: HTML template translations
│       ├── django.mo         # ⚠️ DO NOT EDIT: Compiled file
│       ├── djangojs.po       # ✏️ EDIT: JavaScript translations
│       └── djangojs.mo       # ⚠️ DO NOT EDIT: Compiled file
└── pt/
    └── LC_MESSAGES/
        ├── django.po         # ✏️ EDIT: HTML template translations
        ├── django.mo         # ⚠️ DO NOT EDIT: Compiled file
        ├── djangojs.po       # ✏️ EDIT: JavaScript translations
        └── djangojs.mo       # ⚠️ DO NOT EDIT: Compiled file
```

---

## 📋 Which File to Edit

|| I need to translate... | File to edit |
||------------------------|--------------|
|| HTML template text (`.html`) | `locale/{lang}/LC_MESSAGES/django.po` |
|| JavaScript text (`.js`) | `locale/{lang}/LC_MESSAGES/djangojs.po` |
|| Django admin text | `locale/{lang}/LC_MESSAGES/django.po` |
|| Django error messages | `locale/{lang}/LC_MESSAGES/django.po` |

---

## 🔍 How to Find What to Translate

### After running `makemessages`:

1. **Open the corresponding `.po` file**
2. **Search for strings with `msgstr ""`** (empty)
3. **Search for the `#, fuzzy` marker** (translations needing review)

### Example:

```po
# NEW - Needs translation
#: .\apps\core\templates\core\nueva_pagina.html:10
msgid "New Feature Title"
msgstr ""                    # ← EMPTY: add translation here

# ALREADY TRANSLATED
#: .\apps\core\templates\core\about.html:25
msgid "Our Platform"
msgstr "Nossa Plataforma"    # ← Already has translation
```

---

## 📝 .po File Format

### Basic structure:

```po
# Comment (location of original text)
#: .\apps\core\templates\core\about.html:25
msgid "Original English text"
msgstr "Translated text"
```

### Multiline text:

```po
#: .\apps\core\templates\core\about.html:28
msgid ""
"This is a long text that spans "
"multiple lines in the source."
msgstr ""
"Este es un texto largo que se extiende "
"en múltiples líneas en la fuente."
```

### Plural forms:

```po
#: .\apps\core\templates\core\results.html:15
msgid "%(count)d document"
msgid_plural "%(count)d documents"
msgstr[0] "%(count)d documento"
msgstr[1] "%(count)d documentos"
```

---

## 🛠️ Available Scripts

### Windows PowerShell

```powershell
# Extract and compile everything
.\scripts\update_translations.ps1

# Extract only
.\scripts\update_translations.ps1 -Extract

# Compile only
.\scripts\update_translations.ps1 -Compile
```

### Linux/Mac

```bash
# Extract and compile everything
./scripts/update_translations.sh --all

# Extract only
./scripts/update_translations.sh --extract

# Compile only
./scripts/update_translations.sh --compile
```

---

## 🔄 Typical Workflow

```
1. Develop feature with {% trans %} and _()
   ↓
2. Run: update_translations.ps1 -Extract
   ↓
3. Edit .po files (add translations)
   ↓
4. Run: update_translations.ps1 -Compile
   ↓
5. Restart Django server
   ↓
6. Test in /es/ and /pt/
```

---

## 📊 Check Translation Status

### View untranslated strings:

```bash
# PowerShell
Select-String -Path "locale\es\LC_MESSAGES\django.po" -Pattern 'msgstr ""' | Measure-Object

# Linux/Mac
grep -c 'msgstr ""' locale/es/LC_MESSAGES/django.po
```

### View last compilation:

```bash
# PowerShell
Get-ChildItem locale\*\LC_MESSAGES\*.mo | Select-Object FullName, LastWriteTime

# Linux/Mac
find locale -name "*.mo" -exec ls -lh {} \;
```

---

## ⚠️ Common Errors

### Error: "Can't find msgfmt"

**Solution:**
- Windows: Install gettext from https://mlocati.github.io/articles/gettext-iconv-windows.html
- Linux: `sudo apt-get install gettext`
- Mac: `brew install gettext`

### Error: Translations not appearing

**Checklist:**
1. ✅ Did you compile .po files to .mo?
2. ✅ Did you restart the Django server?
3. ✅ Are you accessing the correct URL? (`/es/` or `/pt/`)
4. ✅ Did you clear browser cache?

### Error: Partial translations

**Cause:** Some .po files have the `#, fuzzy` flag

**Solution:** Edit the .po and remove the `#, fuzzy` lines

---

## 🌐 Project Languages

|| Code | Name | Folder | Status |
||------|------|--------|--------|
|| `en` | English | `locale/en/` | ✅ Default |
|| `es` | Spanish | `locale/es/` | ✅ Complete |
|| `pt` | Portuguese | `locale/pt/` | ✅ Active |

---

See also:
- [TRANSLATIONS.md](../TRANSLATIONS.md) - Quick guide
- [TRANSLATION_WORKFLOW.md](TRANSLATION_WORKFLOW.md) - Complete guide
- [TRANSLATION_QUICK_REFERENCE.md](TRANSLATION_QUICK_REFERENCE.md) - Commands

---

**Document Version:** v1.0  
**Created:** October 13, 2025  
**Last Updated:** October 13, 2025  
**Category:** Internationalization (i18n) - Reference  
**Related:** TRANSLATIONS.md, TRANSLATION_WORKFLOW.md
