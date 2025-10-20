# 🔧 Guía de Administración - SDG Relevance Scoring

## 🌐 Acceder al Admin de Django

### Paso 1: Abrir el Admin
```
http://localhost:8000/admin/documents/documentsdg/
```

O desde el menú principal del admin:
```
Django admin → Documents → Document–SDG Links
```

---

## 📋 Funcionalidades del Admin

### 1. Lista de DocumentSDG

**Columnas visibles:**
- **Document** - Título del documento (primeros 50 caracteres)
- **SDG** - Badge con número y nombre del SDG (ej: `SDG 9 Innovation`)
- **Relevance Score** - Badge con color según nivel:
  - 🟢 **Verde (0.8-1.0):** High - Alta relevancia
  - 🟡 **Amarillo (0.6-0.8):** Medium - Relevancia media
  - 🔴 **Rojo (0.0-0.6):** Low - Baja relevancia
- **Justification** - Texto explicativo (preview)
- **Created At** - Fecha de creación

**Ejemplo visual del badge:**
```
🟢 0.850 (85%) High
🟡 0.720 (72%) Medium
🔴 0.550 (55%) Low
```

---

### 2. Filtros Disponibles

**Sidebar derecho:**
- **Por SDG Number:** Filtra por SDG específico (1-17)
- **Por Relevance Score:** Filtra por rango de relevancia
- **Por Created At:** Filtra por fecha de creación

**Búsqueda:**
- Por título de documento
- Por nombre de SDG
- Por texto de justificación

---

### 3. Acciones en Batch (Seleccionar múltiples registros)

Selecciona uno o más registros y aplica:

#### 🟢 Set to HIGH relevance (0.85-1.0)
- Asigna valores aleatorios entre 0.85 y 1.0
- Ideal para SDGs muy relevantes en los documentos seleccionados

#### 🟡 Set to MEDIUM relevance (0.6-0.85)
- Asigna valores aleatorios entre 0.6 y 0.85
- Para SDGs moderadamente relevantes

#### 🔴 Set to LOW relevance (0.3-0.6)
- Asigna valores aleatorios entre 0.3 y 0.6
- Para SDGs mencionados tangencialmente

#### 🎲 Randomize relevance (0.5-1.0)
- Asigna valores completamente aleatorios
- Útil para testing visual del radar chart

---

### 4. Edición Individual

**Click en un registro para editarlo:**

```yaml
🔗 Relationship:
  - Document: [Selector de documento]
  - SDG: [Selector de SDG]

⭐ Relevance:
  - Relevance score: [0.0 - 1.0]
  - Justification: [Texto explicativo]
  
  Descripción: Relevance score from 0.0 (not relevant) to 1.0 (highly relevant)

🏷️ Metadata: (colapsado)
  - Created at
  - Updated at
  - Search fields
```

**Valores recomendados:**
- `1.0` - SDG es tema central del documento
- `0.8-0.9` - SDG es muy relevante
- `0.6-0.7` - SDG es moderadamente relevante
- `0.4-0.5` - SDG es mencionado pero no central
- `0.1-0.3` - SDG apenas mencionado

---

## 🧪 Cómo Probar el Radar Chart

### Flujo de Testing:

1. **Accede al Admin:**
   ```
   http://localhost:8000/admin/documents/documentsdg/
   ```

2. **Filtra por un SDG específico:**
   - Click en "SDG Number" en sidebar
   - Selecciona "SDG 9" (por ejemplo)

3. **Aplica una acción en batch:**
   - Selecciona todos los registros de SDG 9 (checkbox)
   - Elige acción: "Set to HIGH relevance (0.85-1.0)"
   - Click "Go"
   - Verás mensaje: "Set 67 SDG link(s) to HIGH relevance"

4. **Abre la página de análisis:**
   ```
   http://localhost:8000/analysis/
   ```

5. **Observa el cambio en el radar chart:**
   - La línea verde (Avg Importance) para SDG 9 ahora estará más lejos del centro
   - Hover sobre SDG 9 para ver el nuevo promedio (ej: 0.920)

6. **Experimenta con otros SDGs:**
   - Vuelve al admin
   - Selecciona SDG 13
   - Aplica "Set to LOW relevance (0.3-0.6)"
   - Refresca `/analysis/`
   - Verás que SDG 13 en verde ahora está más cerca del centro

---

## 🎯 Experimentos Sugeridos

### Experimento 1: Contraste Extremo
```
1. SDG 9 → Set to HIGH (0.85-1.0)
2. SDG 1 → Set to LOW (0.3-0.6)
3. Ir a /analysis/
4. Observar la diferencia visual entre ambos SDGs
```

### Experimento 2: Todos Iguales
```
1. Seleccionar TODOS los registros
2. Set to HIGH relevance
3. Ir a /analysis/
4. La línea verde será casi circular (todos tienen alta relevancia)
```

### Experimento 3: Randomización
```
1. Seleccionar todos
2. Randomize relevance
3. Ir a /analysis/
4. Ver patrones aleatorios (útil para testing visual)
```

---

## 📊 Ver Cambios en Tiempo Real

### Método Rápido:

1. **Ventana 1:** Admin de Django
   ```
   http://localhost:8000/admin/documents/documentsdg/
   ```

2. **Ventana 2:** Página de Analysis
   ```
   http://localhost:8000/analysis/
   ```

3. **Flujo:**
   - Modifica valores en Admin
   - Guarda cambios
   - Refresca página de Analysis (F5)
   - Observa cambios en el radar chart

---

## 🔍 Filtrar por Documento Específico

Si quieres editar los SDGs de un documento específico:

1. En el admin de DocumentSDG
2. Busca por título: `"Digital Strategy Ecuador"`
3. Verás todos los SDG links de ese documento
4. Edita relevance_score individualmente o en batch

---

## 💡 Tips Útiles

### Para Testing Rápido:
```
1. Filtra por un solo SDG (ej: SDG 17)
2. Selecciona todos
3. Set to HIGH relevance
4. Refresca /analysis/
5. SDG 17 en verde estará al 100%
```

### Para Simular Datos Reales:
```
SDGs tecnológicos (4, 8, 9, 17) → Set HIGH
SDGs sociales (1, 2, 5, 10) → Set MEDIUM  
SDGs ambientales (6, 7, 13, 14, 15) → Set LOW
```

### Para Resetear a Testing:
```
1. Seleccionar TODOS
2. Randomize relevance
3. Vuelves al estado inicial aleatorio
```

---

## 🎨 Admin Actions Explicadas

### Set to HIGH relevance (0.85-1.0)
**Cuándo usar:** 
- SDG es tema central del documento
- Documento trata principalmente de ese SDG
- Alta correlación semántica

**Efecto visual:**
- Línea verde se acerca al borde en ese SDG
- Tooltip muestra ~85-100%

### Set to MEDIUM relevance (0.6-0.85)
**Cuándo usar:**
- SDG es importante pero no central
- Documento toca varios temas
- Relevancia moderada

**Efecto visual:**
- Línea verde en posición intermedia
- Tooltip muestra ~60-85%

### Set to LOW relevance (0.3-0.6)
**Cuándo usar:**
- SDG apenas mencionado
- Referencia tangencial
- No es foco del documento

**Efecto visual:**
- Línea verde cerca del centro
- Tooltip muestra ~30-60%

### Randomize relevance (0.5-1.0)
**Cuándo usar:**
- Testing visual
- Generar patrones variados
- Demostración de funcionalidad

**Efecto visual:**
- Patrón irregular en la línea verde
- Útil para ver diferencias visuales

---

## 🚀 Ejemplo de Uso Completo

### Caso: Analizar SDGs tecnológicos vs ambientales

```bash
# Paso 1: En Admin, filtra y asigna relevancia

SDG 9 (Innovation) → Filtra por "SDG number: 9" → Select all → HIGH
SDG 8 (Decent Work) → Filtra por "SDG number: 8" → Select all → HIGH
SDG 4 (Education) → Filtra por "SDG number: 4" → Select all → HIGH
SDG 17 (Partnerships) → Filtra por "SDG number: 17" → Select all → HIGH

SDG 13 (Climate) → Filtra por "SDG number: 13" → Select all → LOW
SDG 14 (Ocean) → Filtra por "SDG number: 14" → Select all → LOW
SDG 15 (Land) → Filtra por "SDG number: 15" → Select all → LOW

# Paso 2: Ir a /analysis/

# Resultado esperado:
# - Línea verde alta en SDG 4, 8, 9, 17 (tech/cooperation)
# - Línea verde baja en SDG 13, 14, 15 (environment)
# - Visualización clara del foco tecnológico del corpus
```

---

## ✅ Confirmación

Para confirmar que el admin funciona:

1. **Accede a:** `http://localhost:8000/admin/`
2. **Login** con tus credenciales
3. **Busca:** "Document–SDG Links" en la sección "DOCUMENTS"
4. **Verás:** 780 registros con badges de colores
5. **Prueba:** Cambia algunos valores y refresca `/analysis/`

---

## 🎊 Beneficios del Admin

✅ **Testing interactivo** - Cambia valores y ve resultados inmediatamente
✅ **Batch operations** - Modifica muchos registros a la vez
✅ **Filtros potentes** - Encuentra rápido lo que necesitas
✅ **Visual feedback** - Badges de colores indican niveles
✅ **Inline editing** - Edita relevance_score sin entrar al detalle
✅ **Auditable** - Timestamps de cambios

**¡Ahora tienes control total sobre la relevancia de SDGs!** 🚀

