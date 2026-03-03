# Translation Workflow Guide

This guide explains step-by-step how to work with translations every time you add a new feature or modify application content.

## 📋 Table of Contents

1. [Supported Languages](#supported-languages)
2. [File Structure](#file-structure)
3. [Adding Translations to HTML Templates](#adding-translations-to-html-templates)
4. [Adding Translations to JavaScript](#adding-translations-to-javascript)
5. [Complete Process: New Feature](#complete-process-new-feature)
6. [Important Commands](#important-commands)
7. [Troubleshooting](#troubleshooting)

---

## 🌍 Supported Languages

The project currently has 2 active languages + 1 prepared:

- **EN** (English) - Default language ✅ Active
- **ES** (Spanish) - ✅ Active
- **PT** (Portuguese) - 🔶 Prepared but disabled

### Portuguese Status

Portuguese translation files are **complete and compiled** in `locale/pt/`, but the language is temporarily disabled in configuration.

**To enable Portuguese:**
1. Edit `config/settings/base.py`
2. Uncomment the Portuguese line:
   ```python
   LANGUAGES = [
       ('en', 'English'),
       ('es', 'Español'),
       ('pt', 'Português'),  # ← Uncomment
   ]
   ```
3. Restart Django server

Current configuration in: `config/settings/base.py`

---

## 📁 File Structure

```
locale/
├── en/
│   └── LC_MESSAGES/
├── es/
│   └── LC_MESSAGES/
│       ├── django.po      # HTML template translations
│       ├── django.mo      # Compiled file (DO NOT EDIT)
│       ├── djangojs.po    # JavaScript translations
│       └── djangojs.mo    # Compiled file (DO NOT EDIT)
└── pt/
    └── LC_MESSAGES/
        ├── django.po
        ├── django.mo
        ├── djangojs.po
        └── djangojs.mo
```

**IMPORTANT:**
- ✅ Edit `.po` files
- ❌ NEVER edit `.mo` files (they are binary compiled files)

---

## 🔤 Adding Translations to HTML Templates

### 1. Load the i18n tag

At the beginning of your template:

```django
{% load i18n %}
```

### 2. Mark text for translation

**Simple text:**
```django
{% trans "Hello World" %}
```

**Text with variables:**
```django
{% blocktrans %}Welcome {{ username }}{% endblocktrans %}
```

**Multiline text:**
```django
{% blocktrans %}
This is a longer text that spans
multiple lines and will be translated.
{% endblocktrans %}
```

**HTML attributes:**
```django
<img alt="{% trans 'Logo image' %}" src="...">
<button aria-label="{% trans 'Close dialog' %}">X</button>
```

### 3. Complete example

```django
{% load i18n %}

<div class="about-section">
  <h2>{% trans "About Us" %}</h2>
  <p>{% trans "Learn about our platform and methodology." %}</p>
  
  {% blocktrans %}
  SPIDERHUB is a platform designed to analyze and visualize
  digital transformation agreements.
  {% endblocktrans %}
</div>
```

---

## 💻 Adding Translations to JavaScript

### 1. Import the i18n module

```javascript
import { gettext as _ } from '../../core/i18n/i18n.js';
```

### 2. Use in your code

**Simple text:**
```javascript
const message = _('View Details');
```

**With interpolation:**
```javascript
const title = `${_('View details for')} ${documentTitle}`;
```

### 3. Complete example

```javascript
import { gettext as _ } from '../../core/i18n/i18n.js';

export class DocumentCard {
  render(doc) {
    return `
      <div class="card">
        <h3>${doc.title}</h3>
        <button>${_('View Details')}</button>
        <span>${_('Loading...')}</span>
      </div>
    `;
  }
}
```

---

## 🔄 Complete Process: New Feature

Follow these steps **EVERY TIME** you add a new feature with visible text:

### Step 1: Develop with translations from the start

✅ **While developing:**
```django
<!-- CORRECT -->
<h1>{% trans "New Feature Title" %}</h1>

<!-- INCORRECT -->
<h1>New Feature Title</h1>
```

### Step 2: Extract new translation strings

After finishing your feature, extract the strings:

```bash
# Extract strings from HTML templates (con Poetry)
poetry run python manage.py makemessages -l es -l pt --ignore=*.venv

# Extract strings from JavaScript
poetry run python manage.py makemessages -l es -l pt -d djangojs --ignore=*.venv
```

### Step 3: Add translations to .po files

Open the files and add the translations:

**For Spanish:** `locale/es/LC_MESSAGES/django.po`
```po
#: .\apps\core\templates\core\nueva_pagina.html:10
msgid "New Feature Title"
msgstr "Título de Nueva Funcionalidad"
```

**For Portuguese:** `locale/pt/LC_MESSAGES/django.po`
```po
#: .\apps\core\templates\core\nueva_pagina.html:10
msgid "New Feature Title"
msgstr "Título da Nova Funcionalidade"
```

### Step 4: Compile translations

**On Windows (with gettext installed):**

```bash
# Compile ALL languages
poetry run python manage.py compilemessages

# Or use msgfmt directly:
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\es\LC_MESSAGES\django.mo locale\es\LC_MESSAGES\django.po
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\pt\LC_MESSAGES\django.mo locale\pt\LC_MESSAGES\django.po
```

**On Linux/Mac:**
```bash
poetry run python manage.py compilemessages
```

### Step 5: Restart the server

```bash
# Stop the server (Ctrl+C)
# Start again
poetry run python manage.py runserver 8001
```

### Step 6: Verify in browser

- Access `http://localhost:8001/es/` (Spanish)
- Access `http://localhost:8001/pt/` (Portuguese)
- Use the language selector in the header

---

## 📝 Important Commands

### Extract new strings

```bash
# HTML/Templates - Spanish and Portuguese
poetry run python manage.py makemessages -l es -l pt --ignore=*.venv

# JavaScript - Spanish and Portuguese
poetry run python manage.py makemessages -l es -l pt -d djangojs --ignore=*.venv

# Update only one language
poetry run python manage.py makemessages -l es
```

### Compile translations

```bash
# Compile all languages
poetry run python manage.py compilemessages

# Windows - Compile manually with msgfmt
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\es\LC_MESSAGES\django.mo locale\es\LC_MESSAGES\django.po
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\pt\LC_MESSAGES\django.mo locale\pt\LC_MESSAGES\django.po
```

### Verify compiled files

```bash
# Windows PowerShell
Get-ChildItem -Path locale -Recurse -Filter "*.mo" | Select-Object FullName, Length, LastWriteTime

# Linux/Mac
find locale -name "*.mo" -exec ls -lh {} \;
```

---

## 🔍 Where to Add Translations

### HTML Templates → `locale/{lang}/LC_MESSAGES/django.po`

Find the English string and add the translation:

```po
#: .\apps\core\templates\core\about.html:25
msgid "Our Platform"
msgstr "Nossa Plataforma"  # Portuguese
```

### JavaScript → `locale/{lang}/LC_MESSAGES/djangojs.po`

Find the English string and add the translation:

```po
#: .\apps\core\static\core\js\components\search\DocumentResults.js:261
msgid "View Details"
msgstr "Ver Detalhes"  # Portuguese
```

### Quickly find a string

```bash
# In PowerShell
Select-String -Path "locale\es\LC_MESSAGES\django.po" -Pattern "Our Platform"

# In Linux/Mac
grep -n "Our Platform" locale/es/LC_MESSAGES/django.po
```

---

## 🐛 Troubleshooting

### Problem: Translations don't appear

**Solution:**
1. ✅ Verify you compiled the `.mo` files
2. ✅ Restart the Django server
3. ✅ Clear browser cache (Ctrl+Shift+R)
4. ✅ Verify the URL: `http://localhost:8001/es/` or `/pt/`

### Problem: Error "Can't find msgfmt"

**Solution on Windows:**
1. Install gettext from: https://mlocati.github.io/articles/gettext-iconv-windows.html
2. Or use the guide in: `docs/INSTALL_GETTEXT_WINDOWS.md`

### Problem: .mo file doesn't update

**Solution:**
```bash
# Delete .mo files
Remove-Item locale\es\LC_MESSAGES\*.mo
Remove-Item locale\pt\LC_MESSAGES\*.mo

# Recompile
poetry run python manage.py compilemessages
```

### Problem: Empty translations after makemessages

**Solution:**
```po
# Find this line in the .po
#, fuzzy

# DELETE IT so Django uses the translations
```

### Problem: Language selector doesn't appear

**Solution:**
Verify that `{% load i18n %}` is in the header template:

```django
{% load i18n %}
{% get_current_language as CURRENT_LANGUAGE %}
{% get_available_languages as AVAILABLE_LANGUAGES %}
```

---

## ✅ New Feature Checklist

Use this checklist every time you add a new feature:

- [ ] All visible texts use `{% trans %}` or `_()` 
- [ ] Ran `makemessages` to extract strings
- [ ] Added Spanish translations in `locale/es/LC_MESSAGES/django.po`
- [ ] Added Portuguese translations in `locale/pt/LC_MESSAGES/django.po`
- [ ] If there's JavaScript, translated in `djangojs.po`
- [ ] Compiled with `compilemessages` or `msgfmt`
- [ ] Restarted Django server
- [ ] Tested in Spanish: `http://localhost:8001/es/`
- [ ] Tested in Portuguese: `http://localhost:8001/pt/`
- [ ] Tested the language selector

---

## 📚 Additional Resources

- [Official Django i18n Documentation](https://docs.djangoproject.com/en/stable/topics/i18n/)
- [GNU gettext Manual](https://www.gnu.org/software/gettext/manual/)
- See also: `docs/MULTILINGUAL_IMPLEMENTATION_PROGRESS.md`

---

## 🎯 Complete Example: Adding a New Page

### 1. Create template with translations

`apps/core/templates/core/nueva_pagina.html`:
```django
{% extends "core/base.html" %}
{% load i18n %}

{% block title %}{% trans "New Page Title" %}{% endblock %}

{% block content %}
<div class="page-container">
  <h1>{% trans "Welcome to New Feature" %}</h1>
  <p>{% trans "This is a description of the new feature." %}</p>
</div>
{% endblock %}
```

### 2. Extract strings

```bash
poetry run python manage.py makemessages -l es -l pt
```

### 3. Translate in `locale/es/LC_MESSAGES/django.po`

```po
msgid "New Page Title"
msgstr "Título de Nueva Página"

msgid "Welcome to New Feature"
msgstr "Bienvenido a la Nueva Funcionalidad"

msgid "This is a description of the new feature."
msgstr "Esta es una descripción de la nueva funcionalidad."
```

### 4. Translate in `locale/pt/LC_MESSAGES/django.po`

```po
msgid "New Page Title"
msgstr "Título da Nova Página"

msgid "Welcome to New Feature"
msgstr "Bem-vindo à Nova Funcionalidade"

msgid "This is a description of the new feature."
msgstr "Esta é uma descrição da nova funcionalidade."
```

### 5. Compile and test

```bash
poetry run python manage.py compilemessages
poetry run python manage.py runserver 8001
```

Visit:
- `http://localhost:8001/es/nueva-pagina/`
- `http://localhost:8001/pt/nova-pagina/`

---

## 📞 Contact

If you have problems with translations, contact the development team or review the documentation in `docs/`.

---

**Document Version:** v1.1  
**Created:** September 2025  
**Last Updated:** October 14, 2025  
**Category:** Internationalization (i18n)  
**Related:** TRANSLATIONS.md, TRANSLATION_QUICK_REFERENCE.md, TRANSLATION_FILES_REFERENCE.md
