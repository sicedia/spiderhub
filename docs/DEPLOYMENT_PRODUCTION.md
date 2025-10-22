# 🚀 Guía Rápida de Deployment a Producción

**Imagen actual:** `sicedia/spiderhub:0.1.0-rc.12`  
**Fecha:** 21 de Octubre, 2025

---

## 📋 Cambios en esta versión

### ✅ Problemas Resueltos

1. **Migración de base de datos** (`documents_document_sdgs`)
   - Migración resiliente que maneja tablas existentes
   - Agrega columnas faltantes automáticamente
   - Compatible con bases de datos nuevas y existentes

2. **Dependencias faltantes**
   - ✅ PyMuPDF (extracción de texto de PDFs)
   - ✅ langchain-openai (integración con LLM)
   - ✅ langchain-core (funcionalidad core)
   - ✅ langchain-anthropic (soporte para Claude)
   - ✅ httpx (requests asíncronos)

### 🔧 Configuración actualizada

- Tmpfs para `/app/locale` (compilación de traducciones)
- Volúmenes externos para persistencia de datos
- Imagen optimizada con todas las dependencias

---

## 🚢 Método 1: Transferir Imagen (Sin Registry)

### En tu máquina Windows (donde construiste la imagen):

```powershell
# 1. Exportar la imagen a un archivo comprimido
cd C:\Projects\spiderhub_web
docker save sicedia/spiderhub:0.1.0-rc.12 | gzip > spiderhub-0.1.0-rc.12.tar.gz
```

### Transferir a producción:

```powershell
# Usar SCP, WinSCP, o el método que prefieras
scp spiderhub-0.1.0-rc.12.tar.gz cedia@ubuntu24:~/spiderhub/
```

### En el servidor de producción (ubuntu24):

```bash
# 1. Navegar al directorio
cd ~/spiderhub

# 2. Cargar la imagen
docker load < spiderhub-0.1.0-rc.12.tar.gz

# 3. Actualizar docker-compose.yml
# Editar y cambiar la versión de la imagen a: sicedia/spiderhub:0.1.0-rc.12

# 4. Detener servicios
docker-compose down

# 5. Levantar con la nueva imagen
docker-compose up -d

# 6. Verificar el estado
docker-compose ps

# 7. Ver logs si es necesario
docker logs spider_web --tail=100
```

---

## 🌐 Método 2: Usar Docker Hub (Con Registry)

### En tu máquina Windows:

```powershell
# 1. Login en Docker Hub (si no lo has hecho)
docker login

# 2. Push la imagen
docker push sicedia/spiderhub:0.1.0-rc.12
docker push sicedia/spiderhub:latest
```

### En el servidor de producción (ubuntu24):

```bash
# 1. Navegar al directorio
cd ~/spiderhub

# 2. Actualizar docker-compose.yml para usar la nueva versión
# image: sicedia/spiderhub:0.1.0-rc.12

# 3. Pull la nueva imagen
docker-compose pull web

# 4. Reiniciar servicios
docker-compose down
docker-compose up -d

# 5. Verificar
docker-compose ps
```

---

## ✅ Verificación Post-Deployment

### 1. Verificar que los contenedores estén funcionando

```bash
docker-compose ps
```

**Esperado:**
```
spider_db      Up (healthy)
spider_web     Up (healthy)
spider_nginx   Up
```

### 2. Verificar migraciones

```bash
docker exec spider_web python manage.py showmigrations documents
```

**Esperado:** Todas con `[X]`

### 3. Probar extracción de texto (PyMuPDF)

```bash
docker exec -it spider_web python manage.py ingest_sdg_relevance --doc 377
```

**Esperado:**
- ✅ Text extraction complete: `1/1 files successful, 58141 characters extracted`
- ✅ Sin errores de PyMuPDF
- ✅ LLM procesa correctamente (si las API keys están configuradas)

### 4. Verificar que la aplicación responde

```bash
curl http://localhost/health/
```

---

## 📝 Archivo `docker-compose.yml` actualizado

Asegúrate de que tu `docker-compose.yml` en producción tenga:

```yaml
web:
  container_name: "spider_web"
  image: sicedia/spiderhub:0.1.0-rc.12  # <-- Versión actualizada
  tmpfs:
    - /tmp:noexec,nosuid,size=100m
    - /app/tmp:noexec,nosuid,size=100m
    - /app/locale:size=50m  # <-- Importante para compilemessages
```

---

## 🔑 Variables de entorno requeridas

Verifica que tu `.env.production` tenga configuradas las API keys:

```bash
# LLM Configuration
LLM_PROVIDER=openai  # o 'anthropic'
OPENAI_API_KEY=sk-...
# O para Anthropic:
# ANTHROPIC_API_KEY=sk-ant-...

# CSP Report URI (IMPORTANTE: debe ser URL completa)
CSP_REPORT_URI=https://spiderhub.cedia.edu.ec/csp-report/
```

---

## 🆘 Troubleshooting

### Si el contenedor no inicia:

```bash
# Ver logs detallados
docker logs spider_web --tail=200

# Ver logs en tiempo real
docker logs -f spider_web
```

### Si las migraciones fallan:

```bash
# Ejecutar el script de sincronización
docker exec -it spider_web python manage.py shell < scripts/fix_production_migrations.py
```

### Si la base de datos tiene problemas:

```bash
# Conectar a PostgreSQL
docker exec -it spider_db psql -U spider_user -d spider

# Verificar tabla documents_document_sdgs
\d documents_document_sdgs
```

---

## 📦 Archivos modificados en este deployment

```
✏️  Modificados:
    - apps/documents/migrations/0010_documentsdg_alter_document_sdgs_and_more.py
    - requirements/production.txt
    - docker-compose.yml
    - apps/core/views.py (agregado endpoint CSP report)
    - config/urls.py (registrado endpoint /csp-report/)
    - config/settings/production.py (CSP_ADMIN_POLICY)
    - config/settings/base.py (AdminCSPMiddleware)
    - apps/core/middleware.py (AdminCSPMiddleware)

📄 Creados:
    - scripts/fix_production_migrations.py
    - scripts/fix_production_migrations.ps1
    - scripts/fix_production_migrations.sh
    - docs/MIGRATION_FIX_GUIDE_v1.0.md
    
💾 Backups:
    - apps/documents/migrations/0010_*.py.backup
    - apps/documents/migrations/0011_*.py.backup
```

### 🔧 Nuevas funcionalidades implementadas

1. **Endpoint CSP Report**: `/csp-report/` para recibir y loggear violaciones CSP
2. **CSP Admin Middleware**: Política CSP relajada específicamente para Django Admin
3. **Configuración CSP mejorada**: Separación entre política principal y admin
4. **Sistema de limpieza de logs**: Comando automático para gestionar logs antiguos

---

## 🎯 Comando Rápido (Todo en uno)

Para desplegar rápidamente en producción después de transferir la imagen:

```bash
cd ~/spiderhub && \
docker-compose down && \
docker-compose up -d && \
sleep 10 && \
docker-compose ps && \
docker logs spider_web --tail=30
```

---

## Log Management

### Automatic log cleanup configuration

To configure automatic log cleanup in production:

```bash
# On the production server
chmod +x scripts/setup_log_rotation.sh
sudo ./scripts/setup_log_rotation.sh
```

### Manual cleanup commands

```bash
# Basic cleanup (last 14 days, keep 5 files)
docker exec spider_web python manage.py cleanup_logs --days=14 --keep=5

# Simulate cleanup without deleting files
docker exec spider_web python manage.py cleanup_logs --days=14 --keep=5 --dry-run

# More aggressive cleanup (last 7 days, keep 3 files)
docker exec spider_web python manage.py cleanup_logs --days=7 --keep=3
```

### Automatic configuration

The system will automatically configure:
- **Logrotate**: Daily log rotation with compression
- **Cron job**: Automatic cleanup every Sunday at 2:00 AM
- **Retention**: 14 days for normal logs, 30 days for CSP logs

---

**Ready for deployment!**

