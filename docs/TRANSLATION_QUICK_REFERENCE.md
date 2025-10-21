# 🌍 Translation Quick Reference

## Essential Commands

### 1. Extract new strings
```bash
# Activate virtual environment
.\pyspider\Scripts\activate

# Extract from HTML templates
python manage.py makemessages -l es -l pt --ignore=pyspider

# Extract from JavaScript
python manage.py makemessages -l es -l pt -d djangojs --ignore=pyspider
```

### 2. Compile translations
```bash
# Option 1: Using Django (requires gettext in PATH)
python manage.py compilemessages

# Option 2: Windows - direct msgfmt
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\es\LC_MESSAGES\django.mo locale\es\LC_MESSAGES\django.po
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\pt\LC_MESSAGES\django.mo locale\pt\LC_MESSAGES\django.po
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\es\LC_MESSAGES\djangojs.mo locale\es\LC_MESSAGES\djangojs.po
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\pt\LC_MESSAGES\djangojs.mo locale\pt\LC_MESSAGES\djangojs.po
```

### 3. Restart server
```bash
# Stop (Ctrl+C) and restart
python manage.py runserver 8001
```

---

## 📝 Quick Syntax

### In HTML Templates

```django
{% load i18n %}

{# Simple text #}
<h1>{% trans "Title" %}</h1>

{# With variables #}
{% blocktrans %}Hello {{ name }}{% endblocktrans %}

{# Attributes #}
<img alt="{% trans 'Logo' %}">
```

### In JavaScript

```javascript
import { gettext as _ } from '../../core/i18n/i18n.js';

// Basic usage
const text = _('View Details');

// With interpolation
const msg = `${_('Welcome')} ${userName}`;
```

---

## 📂 Files to Edit

|| Type | Spanish File | Portuguese File |
||------|-------------|-----------------|
|| HTML Templates | `locale/es/LC_MESSAGES/django.po` | `locale/pt/LC_MESSAGES/django.po` |
|| JavaScript | `locale/es/LC_MESSAGES/djangojs.po` | `locale/pt/LC_MESSAGES/djangojs.po` |

---

## ✅ New Feature Checklist

```
[ ] Added {% trans %} to all template texts
[ ] Added _() to all JavaScript texts
[ ] Ran makemessages to extract strings
[ ] Translated to Spanish in locale/es/LC_MESSAGES/
[ ] Translated to Portuguese in locale/pt/LC_MESSAGES/
[ ] Compiled with compilemessages or msgfmt
[ ] Restarted server
[ ] Tested /es/ in browser
[ ] Tested /pt/ in browser
```

---

## 🔧 Editing .po Files

### Format:
```po
#: .\apps\core\templates\core\about.html:25
msgid "Our Platform"
msgstr "Nossa Plataforma"
```

### Rules:
- ✅ `msgid` = text in English (DO NOT EDIT)
- ✅ `msgstr` = your translation
- ✅ Keep quotes and format
- ❌ DO NOT edit lines starting with `#:`

---

## 🚀 URLs for Testing

- **English:** `http://localhost:8001/en/`
- **Spanish:** `http://localhost:8001/es/`
- **Portuguese:** `http://localhost:8001/pt/` (disabled - see TRANSLATIONS.md to enable)

Or use the language selector (globe icon) in the header.

**Note:** Currently only EN and ES are active. PT is ready but disabled in `config/settings/base.py`.

---

See complete guide: [TRANSLATION_WORKFLOW.md](TRANSLATION_WORKFLOW.md)

---

**Document Version:** v1.0  
**Created:** October 13, 2025  
**Last Updated:** October 13, 2025  
**Category:** Internationalization (i18n) - Reference  
**Related:** TRANSLATIONS.md, TRANSLATION_WORKFLOW.md
