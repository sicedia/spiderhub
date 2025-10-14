# 📂 Referencia de Archivos de Traducción

## Estructura de Directorios

```
locale/
├── en/
│   └── LC_MESSAGES/          # Inglés (solo estructura, sin archivos .po/.mo)
├── es/
│   └── LC_MESSAGES/
│       ├── django.po         # ✏️ EDITAR: Traducciones de templates HTML
│       ├── django.mo         # ⚠️ NO EDITAR: Archivo compilado
│       ├── djangojs.po       # ✏️ EDITAR: Traducciones de JavaScript
│       └── djangojs.mo       # ⚠️ NO EDITAR: Archivo compilado
└── pt/
    └── LC_MESSAGES/
        ├── django.po         # ✏️ EDITAR: Traducciones de templates HTML
        ├── django.mo         # ⚠️ NO EDITAR: Archivo compilado
        ├── djangojs.po       # ✏️ EDITAR: Traducciones de JavaScript
        └── djangojs.mo       # ⚠️ NO EDITAR: Archivo compilado
```

---

## 📋 Qué Archivo Editar

| Necesito traducir... | Archivo a editar |
|---------------------|------------------|
| Texto de template HTML (`.html`) | `locale/{lang}/LC_MESSAGES/django.po` |
| Texto de JavaScript (`.js`) | `locale/{lang}/LC_MESSAGES/djangojs.po` |
| Texto del admin de Django | `locale/{lang}/LC_MESSAGES/django.po` |
| Mensajes de error de Django | `locale/{lang}/LC_MESSAGES/django.po` |

---

## 🔍 Cómo Encontrar Qué Traducir

### Después de ejecutar `makemessages`:

1. **Abre el archivo `.po` correspondiente**
2. **Busca cadenas con `msgstr ""`** (vacías)
3. **Busca el marcador `#, fuzzy`** (traducciones que necesitan revisión)

### Ejemplo:

```po
# NUEVO - Necesita traducción
#: .\apps\core\templates\core\nueva_pagina.html:10
msgid "New Feature Title"
msgstr ""                    # ← VACÍO: agregar traducción aquí

# YA TRADUCIDO
#: .\apps\core\templates\core\about.html:25
msgid "Our Platform"
msgstr "Nossa Plataforma"    # ← Ya tiene traducción
```

---

## 📝 Formato de Archivos .po

### Estructura básica:

```po
# Comentario (ubicación del texto original)
#: .\apps\core\templates\core\about.html:25
msgid "Original English text"
msgstr "Texto traducido"
```

### Texto multilínea:

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

## 🛠️ Scripts Disponibles

### Windows PowerShell

```powershell
# Extraer y compilar todo
.\scripts\update_translations.ps1

# Solo extraer
.\scripts\update_translations.ps1 -Extract

# Solo compilar
.\scripts\update_translations.ps1 -Compile
```

### Linux/Mac

```bash
# Extraer y compilar todo
./scripts/update_translations.sh --all

# Solo extraer
./scripts/update_translations.sh --extract

# Solo compilar
./scripts/update_translations.sh --compile
```

---

## 🔄 Flujo de Trabajo Típico

```
1. Desarrollar feature con {% trans %} y _()
   ↓
2. Ejecutar: update_translations.ps1 -Extract
   ↓
3. Editar archivos .po (agregar traducciones)
   ↓
4. Ejecutar: update_translations.ps1 -Compile
   ↓
5. Reiniciar servidor Django
   ↓
6. Probar en /es/ y /pt/
```

---

## 📊 Verificar Estado de Traducciones

### Ver cadenas sin traducir:

```bash
# PowerShell
Select-String -Path "locale\es\LC_MESSAGES\django.po" -Pattern 'msgstr ""' | Measure-Object

# Linux/Mac
grep -c 'msgstr ""' locale/es/LC_MESSAGES/django.po
```

### Ver última compilación:

```bash
# PowerShell
Get-ChildItem locale\*\LC_MESSAGES\*.mo | Select-Object FullName, LastWriteTime

# Linux/Mac
find locale -name "*.mo" -exec ls -lh {} \;
```

---

## ⚠️ Errores Comunes

### Error: "Can't find msgfmt"

**Solución:**
- Windows: Instala gettext desde https://mlocati.github.io/articles/gettext-iconv-windows.html
- Linux: `sudo apt-get install gettext`
- Mac: `brew install gettext`

### Error: Las traducciones no aparecen

**Checklist:**
1. ✅ ¿Compilaste los archivos .po a .mo?
2. ✅ ¿Reiniciaste el servidor Django?
3. ✅ ¿Estás accediendo a la URL correcta? (`/es/` o `/pt/`)
4. ✅ ¿Limpiaste la caché del navegador?

### Error: Traducciones parciales

**Causa:** Algunos archivos .po tienen el flag `#, fuzzy`

**Solución:** Edita el .po y elimina las líneas `#, fuzzy`

---

## 🌐 Idiomas del Proyecto

| Código | Nombre | Carpeta | Estado |
|--------|--------|---------|--------|
| `en` | English | `locale/en/` | ✅ Por defecto |
| `es` | Español | `locale/es/` | ✅ Completo |
| `pt` | Português | `locale/pt/` | ✅ Activo |

---

Ver también:
- [TRANSLATIONS.md](../TRANSLATIONS.md) - Guía rápida
- [TRANSLATION_WORKFLOW.md](TRANSLATION_WORKFLOW.md) - Guía completa
- [TRANSLATION_QUICK_REFERENCE.md](TRANSLATION_QUICK_REFERENCE.md) - Comandos

