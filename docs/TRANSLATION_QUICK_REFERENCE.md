# 🌍 Referencia Rápida de Traducciones

## Comandos Esenciales

### 1. Extraer cadenas nuevas
```bash
# Activar entorno virtual
.\pyspider\Scripts\activate

# Extraer de templates HTML
python manage.py makemessages -l es -l pt --ignore=pyspider

# Extraer de JavaScript
python manage.py makemessages -l es -l pt -d djangojs --ignore=pyspider
```

### 2. Compilar traducciones
```bash
# Opción 1: Usando Django (requiere gettext en PATH)
python manage.py compilemessages

# Opción 2: Windows - msgfmt directo
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\es\LC_MESSAGES\django.mo locale\es\LC_MESSAGES\django.po
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\pt\LC_MESSAGES\django.mo locale\pt\LC_MESSAGES\django.po
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\es\LC_MESSAGES\djangojs.mo locale\es\LC_MESSAGES\djangojs.po
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\pt\LC_MESSAGES\djangojs.mo locale\pt\LC_MESSAGES\djangojs.po
```

### 3. Reiniciar servidor
```bash
# Detener (Ctrl+C) y reiniciar
python manage.py runserver 8001
```

---

## 📝 Sintaxis Rápida

### En Templates HTML

```django
{% load i18n %}

{# Texto simple #}
<h1>{% trans "Title" %}</h1>

{# Con variables #}
{% blocktrans %}Hello {{ name }}{% endblocktrans %}

{# Atributos #}
<img alt="{% trans 'Logo' %}">
```

### En JavaScript

```javascript
import { gettext as _ } from '../../core/i18n/i18n.js';

// Uso básico
const text = _('View Details');

// Con interpolación
const msg = `${_('Welcome')} ${userName}`;
```

---

## 📂 Archivos a Editar

| Tipo | Archivo Español | Archivo Português |
|------|----------------|-------------------|
| Templates HTML | `locale/es/LC_MESSAGES/django.po` | `locale/pt/LC_MESSAGES/django.po` |
| JavaScript | `locale/es/LC_MESSAGES/djangojs.po` | `locale/pt/LC_MESSAGES/djangojs.po` |

---

## ✅ Checklist Nueva Feature

```
[ ] Agregué {% trans %} en todos los textos del template
[ ] Agregué _() en todos los textos de JavaScript
[ ] Ejecuté makemessages para extraer cadenas
[ ] Traduje al español en locale/es/LC_MESSAGES/
[ ] Traduje al portugués en locale/pt/LC_MESSAGES/
[ ] Compilé con compilemessages o msgfmt
[ ] Reinicié el servidor
[ ] Probé /es/ en el navegador
[ ] Probé /pt/ en el navegador
```

---

## 🔧 Editar Archivos .po

### Formato:
```po
#: .\apps\core\templates\core\about.html:25
msgid "Our Platform"
msgstr "Nossa Plataforma"
```

### Reglas:
- ✅ `msgid` = texto en inglés (NO EDITAR)
- ✅ `msgstr` = tu traducción
- ✅ Mantén comillas y formato
- ❌ NO edites las líneas que empiezan con `#:`

---

## 🚀 URLs para Probar

- **Inglés:** `http://localhost:8001/en/`
- **Español:** `http://localhost:8001/es/`
- **Português:** `http://localhost:8001/pt/` (desactivado - ver TRANSLATIONS.md para activar)

O usa el selector de idioma (icono de globo) en el header.

**Nota:** Actualmente solo EN y ES están activos. PT está preparado pero desactivado en `config/settings/base.py`.

---

Ver guía completa: [TRANSLATION_WORKFLOW.md](TRANSLATION_WORKFLOW.md)

