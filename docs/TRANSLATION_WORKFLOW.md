# Guía de Flujo de Trabajo para Traducciones

Esta guía explica paso a paso cómo trabajar con traducciones cada vez que agregues una nueva feature o modifiques el contenido de la aplicación.

## 📋 Tabla de Contenidos

1. [Idiomas Soportados](#idiomas-soportados)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Agregar Traducciones a Templates HTML](#agregar-traducciones-a-templates-html)
4. [Agregar Traducciones a JavaScript](#agregar-traducciones-a-javascript)
5. [Proceso Completo: Nueva Feature](#proceso-completo-nueva-feature)
6. [Comandos Importantes](#comandos-importantes)
7. [Solución de Problemas](#solución-de-problemas)

---

## 🌍 Idiomas Soportados

El proyecto actualmente tiene 2 idiomas activos + 1 preparado:

- **EN** (English) - Idioma por defecto ✅ Activo
- **ES** (Español) - ✅ Activo
- **PT** (Português) - 🔶 Preparado pero desactivado

### Estado del Portugués

Los archivos de traducción al portugués están **completos y compilados** en `locale/pt/`, pero el idioma está temporalmente desactivado en la configuración.

**Para activar el portugués:**
1. Edita `config/settings/base.py`
2. Descomenta la línea de portugués:
   ```python
   LANGUAGES = [
       ('en', 'English'),
       ('es', 'Español'),
       ('pt', 'Português'),  # ← Descomentar
   ]
   ```
3. Reinicia el servidor Django

Configuración actual en: `config/settings/base.py`

---

## 📁 Estructura de Archivos

```
locale/
├── en/
│   └── LC_MESSAGES/
├── es/
│   └── LC_MESSAGES/
│       ├── django.po      # Traducciones de templates HTML
│       ├── django.mo      # Archivo compilado (NO editar)
│       ├── djangojs.po    # Traducciones de JavaScript
│       └── djangojs.mo    # Archivo compilado (NO editar)
└── pt/
    └── LC_MESSAGES/
        ├── django.po
        ├── django.mo
        ├── djangojs.po
        └── djangojs.mo
```

**IMPORTANTE:**
- ✅ Edita archivos `.po`
- ❌ NUNCA edites archivos `.mo` (son archivos compilados binarios)

---

## 🔤 Agregar Traducciones a Templates HTML

### 1. Cargar el tag de i18n

Al inicio de tu template:

```django
{% load i18n %}
```

### 2. Marcar texto para traducción

**Texto simple:**
```django
{% trans "Hello World" %}
```

**Texto con variables:**
```django
{% blocktrans %}Welcome {{ username }}{% endblocktrans %}
```

**Texto multilínea:**
```django
{% blocktrans %}
This is a longer text that spans
multiple lines and will be translated.
{% endblocktrans %}
```

**Atributos HTML:**
```django
<img alt="{% trans 'Logo image' %}" src="...">
<button aria-label="{% trans 'Close dialog' %}">X</button>
```

### 3. Ejemplo completo

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

## 💻 Agregar Traducciones a JavaScript

### 1. Importar el módulo de i18n

```javascript
import { gettext as _ } from '../../core/i18n/i18n.js';
```

### 2. Usar en tu código

**Texto simple:**
```javascript
const message = _('View Details');
```

**Con interpolación:**
```javascript
const title = `${_('View details for')} ${documentTitle}`;
```

### 3. Ejemplo completo

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

## 🔄 Proceso Completo: Nueva Feature

Sigue estos pasos **CADA VEZ** que agregues una nueva feature con texto visible:

### Paso 1: Desarrollar con traducciones desde el inicio

✅ **Mientras desarrollas:**
```django
<!-- CORRECTO -->
<h1>{% trans "New Feature Title" %}</h1>

<!-- INCORRECTO -->
<h1>New Feature Title</h1>
```

### Paso 2: Extraer nuevas cadenas de traducción

Después de terminar tu feature, extrae las cadenas:

```bash
# Activar entorno virtual
.\pyspider\Scripts\activate

# Extraer cadenas de templates HTML
python manage.py makemessages -l es -l pt --ignore=pyspider

# Extraer cadenas de JavaScript
python manage.py makemessages -l es -l pt -d djangojs --ignore=pyspider
```

### Paso 3: Agregar traducciones a los archivos .po

Abre los archivos y agrega las traducciones:

**Para Español:** `locale/es/LC_MESSAGES/django.po`
```po
#: .\apps\core\templates\core\nueva_pagina.html:10
msgid "New Feature Title"
msgstr "Título de Nueva Funcionalidad"
```

**Para Português:** `locale/pt/LC_MESSAGES/django.po`
```po
#: .\apps\core\templates\core\nueva_pagina.html:10
msgid "New Feature Title"
msgstr "Título da Nova Funcionalidade"
```

### Paso 4: Compilar las traducciones

**En Windows (con gettext instalado):**

```bash
# Compilar TODOS los idiomas
python manage.py compilemessages

# O usar msgfmt directamente:
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\es\LC_MESSAGES\django.mo locale\es\LC_MESSAGES\django.po
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\pt\LC_MESSAGES\django.mo locale\pt\LC_MESSAGES\django.po
```

**En Linux/Mac:**
```bash
python manage.py compilemessages
```

### Paso 5: Reiniciar el servidor

```bash
# Detener el servidor (Ctrl+C)
# Iniciar de nuevo
python manage.py runserver 8001
```

### Paso 6: Verificar en el navegador

- Accede a `http://localhost:8001/es/` (Español)
- Accede a `http://localhost:8001/pt/` (Português)
- Usa el selector de idioma en el header

---

## 📝 Comandos Importantes

### Extraer nuevas cadenas

```bash
# HTML/Templates - Español y Portugués
python manage.py makemessages -l es -l pt --ignore=pyspider

# JavaScript - Español y Portugués
python manage.py makemessages -l es -l pt -d djangojs --ignore=pyspider

# Actualizar solo un idioma
python manage.py makemessages -l es
```

### Compilar traducciones

```bash
# Compilar todos los idiomas
python manage.py compilemessages

# Windows - Compilar manualmente con msgfmt
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\es\LC_MESSAGES\django.mo locale\es\LC_MESSAGES\django.po
& "C:\Program Files\gettext-iconv\bin\msgfmt.exe" -o locale\pt\LC_MESSAGES\django.mo locale\pt\LC_MESSAGES\django.po
```

### Verificar archivos compilados

```bash
# Windows PowerShell
Get-ChildItem -Path locale -Recurse -Filter "*.mo" | Select-Object FullName, Length, LastWriteTime

# Linux/Mac
find locale -name "*.mo" -exec ls -lh {} \;
```

---

## 🔍 Dónde Agregar las Traducciones

### Templates HTML → `locale/{lang}/LC_MESSAGES/django.po`

Busca la cadena en inglés y agrega la traducción:

```po
#: .\apps\core\templates\core\about.html:25
msgid "Our Platform"
msgstr "Nossa Plataforma"  # Portugués
```

### JavaScript → `locale/{lang}/LC_MESSAGES/djangojs.po`

Busca la cadena en inglés y agrega la traducción:

```po
#: .\apps\core\static\core\js\components\search\DocumentResults.js:261
msgid "View Details"
msgstr "Ver Detalhes"  # Portugués
```

### Encontrar rápidamente una cadena

```bash
# En PowerShell
Select-String -Path "locale\es\LC_MESSAGES\django.po" -Pattern "Our Platform"

# En Linux/Mac
grep -n "Our Platform" locale/es/LC_MESSAGES/django.po
```

---

## 🐛 Solución de Problemas

### Problema: Las traducciones no aparecen

**Solución:**
1. ✅ Verifica que compilaste los archivos `.mo`
2. ✅ Reinicia el servidor Django
3. ✅ Limpia caché del navegador (Ctrl+Shift+R)
4. ✅ Verifica la URL: `http://localhost:8001/es/` o `/pt/`

### Problema: Error "Can't find msgfmt"

**Solución en Windows:**
1. Instala gettext desde: https://mlocati.github.io/articles/gettext-iconv-windows.html
2. O usa la guía en: `docs/INSTALL_GETTEXT_WINDOWS.md`

### Problema: Archivo .mo no se actualiza

**Solución:**
```bash
# Elimina archivos .mo
Remove-Item locale\es\LC_MESSAGES\*.mo
Remove-Item locale\pt\LC_MESSAGES\*.mo

# Recompila
python manage.py compilemessages
```

### Problema: Traducciones vacías después de makemessages

**Solución:**
```po
# Busca esta línea en el .po
#, fuzzy

# ELIMÍNALA para que Django use las traducciones
```

### Problema: El selector de idioma no aparece

**Solución:**
Verifica que `{% load i18n %}` esté en el template header:

```django
{% load i18n %}
{% get_current_language as CURRENT_LANGUAGE %}
{% get_available_languages as AVAILABLE_LANGUAGES %}
```

---

## ✅ Checklist para Nueva Feature

Usa este checklist cada vez que agregues una nueva feature:

- [ ] Todos los textos visibles usan `{% trans %}` o `_()` 
- [ ] Ejecuté `makemessages` para extraer las cadenas
- [ ] Agregué traducciones al español en `locale/es/LC_MESSAGES/django.po`
- [ ] Agregué traducciones al portugués en `locale/pt/LC_MESSAGES/django.po`
- [ ] Si hay JavaScript, traduje en `djangojs.po`
- [ ] Compilé con `compilemessages` o `msgfmt`
- [ ] Reinicié el servidor Django
- [ ] Probé en español: `http://localhost:8001/es/`
- [ ] Probé en portugués: `http://localhost:8001/pt/`
- [ ] Probé el selector de idioma

---

## 📚 Recursos Adicionales

- [Documentación oficial de Django i18n](https://docs.djangoproject.com/en/stable/topics/i18n/)
- [GNU gettext Manual](https://www.gnu.org/software/gettext/manual/)
- Ver también: `docs/MULTILINGUAL_IMPLEMENTATION_PROGRESS.md`

---

## 🎯 Ejemplo Completo: Agregando una Nueva Página

### 1. Crear el template con traducciones

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

### 2. Extraer cadenas

```bash
python manage.py makemessages -l es -l pt
```

### 3. Traducir en `locale/es/LC_MESSAGES/django.po`

```po
msgid "New Page Title"
msgstr "Título de Nueva Página"

msgid "Welcome to New Feature"
msgstr "Bienvenido a la Nueva Funcionalidad"

msgid "This is a description of the new feature."
msgstr "Esta es una descripción de la nueva funcionalidad."
```

### 4. Traducir en `locale/pt/LC_MESSAGES/django.po`

```po
msgid "New Page Title"
msgstr "Título da Nova Página"

msgid "Welcome to New Feature"
msgstr "Bem-vindo à Nova Funcionalidade"

msgid "This is a description of the new feature."
msgstr "Esta é uma descrição da nova funcionalidade."
```

### 5. Compilar y probar

```bash
python manage.py compilemessages
python manage.py runserver 8001
```

Visita:
- `http://localhost:8001/es/nueva-pagina/`
- `http://localhost:8001/pt/nova-pagina/`

---

## 📞 Contacto

Si tienes problemas con las traducciones, contacta al equipo de desarrollo o revisa la documentación en `docs/`.

---

**Última actualización:** 14 de Octubre, 2025

