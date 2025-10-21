# Configuración con Proxy LLM Corporativo

Esta guía explica cómo configurar el módulo SDG Relevance con un proxy/gateway LLM corporativo (como el de CEDIA).

---

## 🏢 ¿Qué es un Proxy LLM?

Un proxy LLM es un servicio corporativo que:
- Centraliza el acceso a múltiples proveedores de LLM (OpenAI, Anthropic, Google, etc.)
- Proporciona una API unificada compatible con OpenAI
- Gestiona autenticación, costos y políticas corporativas
- Permite cambiar de modelo sin cambiar código

### Ejemplo: Proxy CEDIA
```
Base URL: https://api.cedia.org.ec/v1
API Key: 
Modelos disponibles:
  - openai/gpt-4o-mini
  - openai/gpt-4.1-nano
  - gemini/gemini-2.5-flash-lite-preview-09-2025
  - ... otros modelos
```

---

## ⚙️ Configuración

### Opción 1: Usando Proxy LLM (Recomendado para empresas)

Agrega estas variables a tu `.env`:

```bash
# ============================================================================
# CONFIGURACIÓN PROXY LLM CORPORATIVO
# ============================================================================

# Provider (siempre 'openai' para proxies compatibles con OpenAI)
LLM_PROVIDER=openai

# API Key del proxy corporativo
OPENAI_API_KEY=

# Base URL del proxy (IMPORTANTE: esta es la diferencia clave)
LLM_BASE_URL=

# Modelo (usar prefijo según proveedor del proxy)
# Ejemplos:
#   - openai/gpt-4o-mini        (OpenAI vía proxy)
#   - openai/gpt-4.1-nano       (OpenAI vía proxy)
#   - gemini/gemini-2.5-flash   (Google vía proxy)
LLM_MODEL=openai/gpt-4o-mini

# Parámetros del modelo
LLM_TEMPERATURE=0.1
LLM_MAX_TOKENS=500
LLM_TIMEOUT=60
LLM_MAX_RETRIES=3
```

### Opción 2: Usando OpenAI Directo (Sin proxy)

Si prefieres usar OpenAI directamente:

```bash
# Provider
LLM_PROVIDER=openai

# API Key de OpenAI directa
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# NO configurar LLM_BASE_URL (o dejarlo vacío)
# LLM_BASE_URL=

# Modelo (sin prefijo cuando es OpenAI directo)
LLM_MODEL=gpt-4o

# Parámetros
LLM_TEMPERATURE=0.1
LLM_MAX_TOKENS=500
LLM_TIMEOUT=60
LLM_MAX_RETRIES=3
```

---

## 🔍 Diferencias Clave

| Aspecto | Proxy LLM | OpenAI Directo |
|---------|-----------|----------------|
| **LLM_BASE_URL** | `https://api.cedia.org.ec/v1` | (vacío) |
| **LLM_MODEL** | `openai/gpt-4o-mini` | `gpt-4o` |
| **OPENAI_API_KEY** | Clave del proxy | Clave de OpenAI |
| **Costos** | Gestionado por empresa | Facturado a ti |
| **Modelos** | Múltiples proveedores | Solo OpenAI |

---

## 🚀 Ejemplos de Uso

### Ejemplo 1: OpenAI vía Proxy CEDIA

```bash
# .env
LLM_PROVIDER=openai
OPENAI_API_KEY=
LLM_BASE_URL=https://api.cedia.org.ec/v1
LLM_MODEL=openai/gpt-4o-mini
LLM_TEMPERATURE=0.1
```

**Resultado**: Usa GPT-4o-mini a través del proxy CEDIA

### Ejemplo 2: Gemini vía Proxy CEDIA

```bash
# .env
LLM_PROVIDER=openai  # Sí, 'openai' porque el proxy es compatible OpenAI
OPENAI_API_KEY=
LLM_BASE_URL=https://api.cedia.org.ec/v1
LLM_MODEL=gemini/gemini-2.5-flash-lite-preview-09-2025
LLM_TEMPERATURE=0.1
```

**Resultado**: Usa Gemini a través del proxy CEDIA (API compatible OpenAI)

### Ejemplo 3: OpenAI Directo (sin proxy)

```bash
# .env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxx
# LLM_BASE_URL=  (no configurar)
LLM_MODEL=gpt-4o
LLM_TEMPERATURE=0.1
```

**Resultado**: Usa OpenAI directamente

---

## 🧪 Verificar Configuración

### Paso 1: Verificar variables de entorno

```python
# En Django shell
python manage.py shell

>>> import os
>>> from dotenv import load_dotenv
>>> load_dotenv()
>>> 
>>> print("Provider:", os.getenv('LLM_PROVIDER'))
>>> print("API Key:", os.getenv('OPENAI_API_KEY')[:15] + "...")
>>> print("Base URL:", os.getenv('LLM_BASE_URL'))
>>> print("Model:", os.getenv('LLM_MODEL'))
```

**Salida esperada** (con proxy CEDIA):
```
Provider: openai
API Key: sk-SuGVigyKh-E...
Base URL: https://api.cedia.org.ec/v1
Model: openai/gpt-4o-mini
```

### Paso 2: Test de configuración

```python
# En Django shell
from apps.documents.services.utils import validate_llm_config

is_valid, error = validate_llm_config()
if is_valid:
    print("✅ Configuración válida")
else:
    print(f"❌ Error: {error}")
```

### Paso 3: Test de conexión LLM

```python
# En Django shell
from apps.documents.services.llm_service import get_llm_service

llm = get_llm_service()
print(f"LLM inicializado: {llm.provider} / {llm.model}")

# Test simple
result = llm.call_llm("""
Analyze SDG 4 relevance for this text: "Education program for schools"
Return JSON: {"score": 0.0-1.0, "justification": "brief reason"}
""")

print(f"Score: {result['score']}")
print(f"Justification: {result['justification']}")
```

---

## 🔧 Implementación Técnica

### Cómo Funciona Internamente

El módulo detecta automáticamente si estás usando un proxy:

```python
# En llm_service.py (_initialize_openai)

api_key = os.getenv('OPENAI_API_KEY')
base_url = os.getenv('LLM_BASE_URL')  # <-- Detecta proxy

config = {
    'model': self.model,
    'temperature': self.temperature,
    'max_tokens': self.max_tokens,
    'timeout': self.timeout,
    'max_retries': self.max_retries,
    'api_key': api_key
}

# Si hay base_url, se agrega a la config
if base_url:
    config['base_url'] = base_url
    logger.info(f"Using custom LLM base URL: {base_url}")

self.llm = ChatOpenAI(**config)
```

### Compatibilidad

Esta configuración funciona con cualquier proxy que sea **compatible con la API de OpenAI**:
- ✅ CEDIA Proxy
- ✅ Azure OpenAI
- ✅ LiteLLM Gateway
- ✅ OpenRouter
- ✅ Cualquier proxy OpenAI-compatible

---

## 💡 Cambiar de Modelo

Para cambiar de modelo, solo modifica `LLM_MODEL` en `.env`:

```bash
# De OpenAI a Gemini
LLM_MODEL=gemini/gemini-2.5-flash-lite-preview-09-2025

# O a otro modelo OpenAI
LLM_MODEL=openai/gpt-4.1-nano
```

No necesitas cambiar código, solo reiniciar la aplicación:

```bash
# Si usas Django dev server
# Ctrl+C y vuelve a ejecutar
python manage.py runserver

# Si usas Gunicorn
sudo systemctl restart spiderhub
```

---

## 🐛 Troubleshooting

### Error: "base_url must start with http://"

**Causa**: `LLM_BASE_URL` mal formateado

**Solución**:
```bash
# ❌ Incorrecto
LLM_BASE_URL=api.cedia.org.ec/v1

# ✅ Correcto
LLM_BASE_URL=https://api.cedia.org.ec/v1
```

### Error: "Invalid API Key"

**Causa**: API key incorrecta o expirada

**Solución**: 
1. Verifica la API key en el portal del proxy
2. Contacta al administrador del proxy corporativo
3. Regenera la API key si es necesario

### Error: "Model not found: openai/gpt-4o-mini"

**Causa**: El modelo no está disponible en el proxy

**Solución**:
1. Consulta los modelos disponibles en tu proxy
2. Actualiza `LLM_MODEL` con un modelo válido
3. Contacta al administrador del proxy

### Logs muestran "Using custom LLM base URL: https://api.cedia.org.ec/v1"

**Estado**: ✅ **Correcto**

Esto confirma que el módulo detectó el proxy y lo está usando.

### Respuestas muy lentas

**Posible causa**: Proxy con latencia alta

**Soluciones**:
1. Aumentar `LLM_TIMEOUT`:
   ```bash
   LLM_TIMEOUT=120  # 2 minutos
   ```

2. Reducir `max_tokens` para respuestas más rápidas:
   ```bash
   LLM_MAX_TOKENS=300
   ```

3. Usar un modelo más rápido:
   ```bash
   LLM_MODEL=openai/gpt-4o-mini  # Más rápido que gpt-4
   ```

---

## 📊 Modelos Recomendados

### Para Análisis SDG (Balance velocidad/calidad)

| Modelo | Velocidad | Calidad | Costo | Recomendado |
|--------|-----------|---------|-------|-------------|
| `openai/gpt-4o-mini` | ⚡⚡⚡ | ⭐⭐⭐ | 💰 | ✅ Sí |
| `openai/gpt-4o` | ⚡⚡ | ⭐⭐⭐⭐ | 💰💰 | Sí |
| `openai/gpt-4.1-nano` | ⚡⚡⚡⚡ | ⭐⭐ | 💰 | Batch grande |
| `gemini/gemini-2.5-flash` | ⚡⚡⚡ | ⭐⭐⭐ | 💰 | Alternativa |

**Recomendación general**: `openai/gpt-4o-mini` - Excelente balance

---

## 🔐 Seguridad

### Proteger API Keys

**NUNCA** commitees el archivo `.env`:

```bash
# En .gitignore (ya debe estar)
.env
.env.local
.env.*.local
```

### Verificar que `.env` está ignorado:

```bash
git status
# NO debe aparecer .env en la lista
```

### Rotar API Keys

Si una API key se expone:
1. Revoca la key inmediatamente en el portal del proxy
2. Genera una nueva key
3. Actualiza `.env` con la nueva key
4. Reinicia la aplicación

---

## 📚 Recursos Adicionales

- **Documentación General**: `docs/SDG_RELEVANCE_SETUP.md`
- **Quick Start**: `docs/SDG_RELEVANCE_QUICKSTART.md`
- **Implementación**: `docs/SDG_RELEVANCE_IMPLEMENTATION_SUMMARY.md`

---

## ✅ Checklist de Configuración

- [ ] Obtener API key del proxy corporativo
- [ ] Obtener base URL del proxy
- [ ] Consultar modelos disponibles
- [ ] Agregar variables a `.env`:
  - [ ] `LLM_PROVIDER=openai`
  - [ ] `OPENAI_API_KEY=tu-key`
  - [ ] `LLM_BASE_URL=https://...`
  - [ ] `LLM_MODEL=openai/...` o `gemini/...`
- [ ] Verificar configuración (Paso 1 arriba)
- [ ] Test de conexión (Paso 3 arriba)
- [ ] Procesar documento de prueba:
  ```bash
  python manage.py ingest_sdg_relevance --doc 1
  ```
- [ ] Revisar logs: `logs/sdg_ingestion.log`

---

**¿Listo para producción?** 🚀

Una vez que el test funcione, puedes procesar todos tus documentos:

```bash
python manage.py ingest_sdg_relevance --all
```

---

**Fecha**: Octubre 21, 2025  
**Versión**: 1.0 con soporte para Proxy LLM

