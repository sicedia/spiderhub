# 🌍 Translations - Quick Guide

> **Current Status:** 2 active languages (EN, ES) + 1 ready (PT disabled)

## 📖 Quick Navigation

- **New feature?** → Follow the [Quick Process](#-quick-commands) below
- **Enable Portuguese?** → Go to [Portuguese Disabled](#-portuguese-temporarily-disabled)
- **Need details?** → Check [docs/TRANSLATION_WORKFLOW.md](docs/TRANSLATION_WORKFLOW.md)
- **Commands only?** → Check [docs/TRANSLATION_QUICK_REFERENCE.md](docs/TRANSLATION_QUICK_REFERENCE.md)
- **File structure?** → Check [docs/TRANSLATION_FILES_REFERENCE.md](docs/TRANSLATION_FILES_REFERENCE.md)

---

## ⚡ Quick Commands

### Option 1: Using the Script (Recommended)

```bash
# 1. Develop your feature with {% trans %} and _()

# 2. Extract strings
.\scripts\update_translations.ps1 -Extract

# 3. Edit .po files to add translations

# 4. Compile
.\scripts\update_translations.ps1 -Compile

# 5. Restart server
```

### Option 2: Manual - When adding a new feature:

```bash
# 1. Activate virtual environment
.\pyspider\Scripts\activate

# 2. Extract new strings
python manage.py makemessages -l es -l pt --ignore=pyspider
python manage.py makemessages -l es -l pt -d djangojs --ignore=pyspider

# 3. Edit .po files (add translations):
#    - locale/es/LC_MESSAGES/django.po
#    - locale/es/LC_MESSAGES/djangojs.po
#    - locale/pt/LC_MESSAGES/django.po
#    - locale/pt/LC_MESSAGES/djangojs.po

# 4. Compile
python manage.py compilemessages

# 5. Restart server
python manage.py runserver 8001
```

---

## 📍 Where to Add Translations

### HTML Templates → `locale/{lang}/LC_MESSAGES/django.po`

**Spanish:** `locale/es/LC_MESSAGES/django.po`
```po
msgid "View Details"
msgstr "Ver Detalles"
```

**Portuguese:** `locale/pt/LC_MESSAGES/django.po`
```po
msgid "View Details"
msgstr "Ver Detalhes"
```

### JavaScript → `locale/{lang}/LC_MESSAGES/djangojs.po`

**Spanish:** `locale/es/LC_MESSAGES/djangojs.po`
```po
msgid "Loading..."
msgstr "Cargando..."
```

**Portuguese:** `locale/pt/LC_MESSAGES/djangojs.po`
```po
msgid "Loading..."
msgstr "Carregando..."
```

---

## 💡 Code Syntax

### In Templates
```django
{% load i18n %}
<h1>{% trans "My Title" %}</h1>
```

### In JavaScript
```javascript
import { gettext as _ } from '../../core/i18n/i18n.js';
const text = _('View Details');
```

---

## 🐛 If compilemessages fails

**On Windows:**
```bash
# Use msgfmt directly
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\es\LC_MESSAGES\django.mo locale\es\LC_MESSAGES\django.po
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\pt\LC_MESSAGES\django.mo locale\pt\LC_MESSAGES\django.po
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\es\LC_MESSAGES\djangojs.mo locale\es\LC_MESSAGES\djangojs.po
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\pt\LC_MESSAGES\djangojs.mo locale\pt\LC_MESSAGES\djangojs.po
```

---

## ✅ Quick Checklist

```
[ ] Used {% trans %} or _() in code
[ ] Ran makemessages
[ ] Translated in locale/es/ (Spanish)
[ ] Translated in locale/pt/ (Portuguese)
[ ] Compiled with compilemessages
[ ] Restarted server
[ ] Tested /es/ and /pt/
```

---

## 📚 Complete Documentation

- **Complete Guide:** [docs/TRANSLATION_WORKFLOW.md](docs/TRANSLATION_WORKFLOW.md)
- **Quick Reference:** [docs/TRANSLATION_QUICK_REFERENCE.md](docs/TRANSLATION_QUICK_REFERENCE.md)
- **Deployment Checklist:** [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)

---

## 🌐 Testing URLs

- English: `http://localhost:8001/en/`
- Spanish: `http://localhost:8001/es/`

---

## 🇵🇹 Portuguese (Temporarily Disabled)

Portuguese support is **ready but disabled**.

**Ready files:**
- ✅ `locale/pt/LC_MESSAGES/django.po` (translated)
- ✅ `locale/pt/LC_MESSAGES/django.mo` (compiled)
- ✅ `locale/pt/LC_MESSAGES/djangojs.po` (translated)
- ✅ `locale/pt/LC_MESSAGES/djangojs.mo` (compiled)

**To enable it:**
1. Edit `config/settings/base.py`
2. Uncomment the line:
   ```python
   LANGUAGES = [
       ('en', 'English'),
       ('es', 'Español'),
       ('pt', 'Português'),  # ← Uncomment this line
   ]
   ```
3. Restart server
4. Access: `http://localhost:8001/pt/`
