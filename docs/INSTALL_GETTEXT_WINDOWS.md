# Instalación de GNU Gettext en Windows

## Problema

Los archivos de traducción de Django (`.po`) necesitan ser compilados a formato binario (`.mo`) para que las traducciones funcionen. El comando `python manage.py compilemessages` requiere **GNU gettext tools** instalados en el sistema.

## Error Actual

```
CommandError: Can't find msgfmt. Make sure you have GNU gettext tools 0.19 or newer installed.
```

O si se compila con script personalizado:
```
UnicodeDecodeError: 'ascii' codec can't decode byte 0xc3 in position 13
```

## Soluciones

### Opción 1: Instalación con Chocolatey (Recomendado)

Si tienes [Chocolatey](https://chocolatey.org/) instalado:

```powershell
# Como administrador
choco install gettext -y
```

Después de instalar, cierra y vuelve a abrir el terminal, luego:

```powershell
# Activar entorno virtual
.\pyspider\Scripts\Activate.ps1

# Compilar mensajes
python manage.py compilemessages

# Reiniciar servidor
python manage.py runserver 8001
```

### Opción 2: Descarga Manual (Más Simple)

1. **Descargar gettext para Windows**:
   - Ir a: https://mlocati.github.io/articles/gettext-iconv-windows.html
   - Descargar la versión "static" (64-bit)
   - O usar este link directo: https://github.com/mlocati/gettext-iconv-windows/releases

2. **Extraer los archivos**:
   - Descomprimir el archivo ZIP
   - Copiar todo el contenido a una carpeta, ej: `C:\gettext`

3. **Agregar al PATH**:
   - Buscar "Edit the system environment variables" en Windows
   - Click "Environment Variables"
   - En "System variables", seleccionar "Path" y click "Edit"
   - Click "New" y agregar: `C:\gettext\bin` (o la ruta donde copiaste)
   - Click "OK" en todas las ventanas

4. **Verificar instalación**:
   ```powershell
   # Abrir un NUEVO terminal
   msgfmt --version
   
   # Deberías ver algo como:
   # msgfmt (GNU gettext-tools) 0.21
   ```

5. **Compilar mensajes**:
   ```powershell
   cd C:\Projects\spiderhub_web
   .\pyspider\Scripts\Activate.ps1
   python manage.py compilemessages
   ```

### Opción 3: Usar Scripts Personalizados (Temporal)

Si no puedes instalar gettext, puedes usar nuestros scripts Python:

```powershell
# Este script NO funciona actualmente debido a problemas con Python 3.13
# python scripts\compile_po.py
```

**⚠️ Problema**: Los scripts personalizados generan archivos .mo que Python 3.13 no puede leer correctamente debido a un bug de encoding en Windows.

### Opción 4: WSL (Windows Subsystem for Linux)

Si tienes WSL instalado:

```bash
# En WSL
cd /mnt/c/Projects/spiderhub_web
source pyspider/bin/activate  # o el path correcto de tu venv
python manage.py compilemessages
```

## Verificación

Después de compilar exitosamente, deberías ver:

```
processing file locale\es\LC_MESSAGES\django.po
processing file locale\pt\LC_MESSAGES\django.po
```

Y los archivos `.mo` creados:
```
locale/
├── es/
│   └── LC_MESSAGES/
│       ├── django.po
│       └── django.mo  ← Archivo compilado
├── pt/
│   └── LC_MESSAGES/
│       ├── django.po
│       └── django.mo  ← Archivo compilado
```

## Estado Actual del Proyecto

**Sin archivos .mo compilados:**
- ✅ El sistema multilenguaje está configurado
- ✅ Los templates tienen marcas de traducción ({% trans %})
- ✅ Los modelos usan gettext_lazy
- ✅ El selector de idioma funciona
- ⚠️ Los textos aparecen en inglés porque faltan los .mo

**Con archivos .mo compilados:**
- ✅ Todos los textos se traducen automáticamente
- ✅ 219+ mensajes en español disponibles
- ✅ Sistema 100% funcional en ES, EN, PT

## Testing Rápido

Una vez compilados los mensajes:

```powershell
# Iniciar servidor
python manage.py runserver 8001

# Abrir en navegador:
# http://localhost:8001/es/   ← Debería mostrar todo en español
# http://localhost:8001/en/   ← Todo en inglés
# http://localhost:8001/pt/   ← Português (cuando esté traducido)
```

## Troubleshooting

### Error: "Can't find msgfmt"
- gettext no está instalado o no está en el PATH
- Solución: Seguir Opción 1 o 2 arriba

### Error: "UnicodeDecodeError"
- Archivo .mo tiene problemas de codificación
- Solución: Eliminar .mo y recompilar con gettext oficial
```powershell
Remove-Item locale\es\LC_MESSAGES\django.mo -Force
python manage.py compilemessages
```

### Traducciones no aparecen
1. Verificar que existe `locale/es/LC_MESSAGES/django.mo`
2. Reiniciar el servidor Django
3. Limpiar caché del navegador (Ctrl+F5)
4. Verificar que la URL tiene el prefijo correcto: `/es/`

## Recursos

- **Django i18n docs**: https://docs.djangoproject.com/en/5.2/topics/i18n/
- **Gettext Windows**: https://mlocati.github.io/articles/gettext-iconv-windows.html
- **Chocolatey**: https://chocolatey.org/

## Contacto

Para soporte con la instalación, contacta al equipo de desarrollo.

