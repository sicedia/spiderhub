# 🌍 Traducciones - Guía Rápida

> **Estado Actual:** 2 idiomas activos (EN, ES) + 1 preparado (PT desactivado)

## 📖 Navegación Rápida

- **Nueva feature?** → Sigue el [Proceso Rápido](#-comandos-rápidos) abajo
- **Activar portugués?** → Ve a [Portugués Desactivado](#-portugués-desactivado-temporalmente)
- **Necesitas detalles?** → Consulta [docs/TRANSLATION_WORKFLOW.md](docs/TRANSLATION_WORKFLOW.md)
- **Solo comandos?** → Consulta [docs/TRANSLATION_QUICK_REFERENCE.md](docs/TRANSLATION_QUICK_REFERENCE.md)
- **Estructura de archivos?** → Consulta [docs/TRANSLATION_FILES_REFERENCE.md](docs/TRANSLATION_FILES_REFERENCE.md)

---

## ⚡ Comandos Rápidos

### Opción 1: Usando el Script (Recomendado)

```bash
# 1. Desarrolla tu feature con {% trans %} y _()

# 2. Extrae cadenas
.\scripts\update_translations.ps1 -Extract

# 3. Edita archivos .po para agregar traducciones

# 4. Compila
.\scripts\update_translations.ps1 -Compile

# 5. Reinicia servidor
```

### Opción 2: Manual - Cuando agregas una nueva feature:

```bash
# 1. Activar entorno virtual
.\pyspider\Scripts\activate

# 2. Extraer cadenas nuevas
python manage.py makemessages -l es -l pt --ignore=pyspider
python manage.py makemessages -l es -l pt -d djangojs --ignore=pyspider

# 3. Editar archivos .po (agregar traducciones):
#    - locale/es/LC_MESSAGES/django.po
#    - locale/es/LC_MESSAGES/djangojs.po
#    - locale/pt/LC_MESSAGES/django.po
#    - locale/pt/LC_MESSAGES/djangojs.po

# 4. Compilar
python manage.py compilemessages

# 5. Reiniciar servidor
python manage.py runserver 8001
```

---

## 📍 Dónde Agregar las Traducciones

### Templates HTML → `locale/{lang}/LC_MESSAGES/django.po`

**Español:** `locale/es/LC_MESSAGES/django.po`
```po
msgid "View Details"
msgstr "Ver Detalles"
```

**Português:** `locale/pt/LC_MESSAGES/django.po`
```po
msgid "View Details"
msgstr "Ver Detalhes"
```

### JavaScript → `locale/{lang}/LC_MESSAGES/djangojs.po`

**Español:** `locale/es/LC_MESSAGES/djangojs.po`
```po
msgid "Loading..."
msgstr "Cargando..."
```

**Português:** `locale/pt/LC_MESSAGES/djangojs.po`
```po
msgid "Loading..."
msgstr "Carregando..."
```

---

## 💡 Sintaxis en el Código

### En Templates
```django
{% load i18n %}
<h1>{% trans "My Title" %}</h1>
```

### En JavaScript
```javascript
import { gettext as _ } from '../../core/i18n/i18n.js';
const text = _('View Details');
```

---

## 🐛 Si compilemessages falla

**En Windows:**
```bash
# Usar msgfmt directo
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\es\LC_MESSAGES\django.mo locale\es\LC_MESSAGES\django.po
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\pt\LC_MESSAGES\django.mo locale\pt\LC_MESSAGES\django.po
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\es\LC_MESSAGES\djangojs.mo locale\es\LC_MESSAGES\djangojs.po
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\pt\LC_MESSAGES\djangojs.mo locale\pt\LC_MESSAGES\djangojs.po
```

---

## ✅ Checklist Rápido

```
[ ] Usé {% trans %} o _() en el código
[ ] Ejecuté makemessages
[ ] Traduje en locale/es/ (español)
[ ] Traduje en locale/pt/ (português)
[ ] Compilé con compilemessages
[ ] Reinicié el servidor
[ ] Probé /es/ y /pt/
```

---

## 📚 Documentación Completa

- **Guía Completa:** [docs/TRANSLATION_WORKFLOW.md](docs/TRANSLATION_WORKFLOW.md)
- **Referencia Rápida:** [docs/TRANSLATION_QUICK_REFERENCE.md](docs/TRANSLATION_QUICK_REFERENCE.md)
- **Checklist de Deployment:** [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)

---

## 🌐 URLs de Prueba

- English: `http://localhost:8001/en/`
- Español: `http://localhost:8001/es/`

---

## 🇵🇹 Portugués (Desactivado Temporalmente)

El soporte para portugués está **preparado pero desactivado**.

**Archivos listos:**
- ✅ `locale/pt/LC_MESSAGES/django.po` (traducido)
- ✅ `locale/pt/LC_MESSAGES/django.mo` (compilado)
- ✅ `locale/pt/LC_MESSAGES/djangojs.po` (traducido)
- ✅ `locale/pt/LC_MESSAGES/djangojs.mo` (compilado)

**Para activarlo:**
1. Edita `config/settings/base.py`
2. Descomenta la línea:
   ```python
   LANGUAGES = [
       ('en', 'English'),
       ('es', 'Español'),
       ('pt', 'Português'),  # ← Descomentar esta línea
   ]
   ```
3. Reinicia el servidor
4. Accede a: `http://localhost:8001/pt/`

