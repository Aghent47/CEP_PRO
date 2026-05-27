# 📊 SPC Dashboard - Quality Core

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-97.6%25-3178c6)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![License](https://img.shields.io/badge/license-MIT-green)
![Deploy](https://img.shields.io/badge/deploy-Netlify-00c7b7)

**Control Estadístico de Procesos (CEP) Profesional**

[🌐 **DEMO EN VIVO**](https://cepcontrolestadistico.netlify.app) | [📖 Documentación](#) | [🐛 Reportar Error](https://github.com/Aghent47/CEP_PRO/issues)

</div>

---

## 📋 Descripción

**SPC Dashboard - Quality Core** es una aplicación web profesional para **Control Estadístico de Procesos (CEP)** que automatiza por completo todos los cálculos, gráficos y diagnósticos. Diseñada para que cualquier usuario (sin ser experto en estadística) pueda cargar sus datos y obtener inmediatamente un análisis completo de su proceso.

### 🎯 ¿Qué problema resuelve?

Actualmente, muchas empresas realizan estos cálculos manualmente en hojas de cálculo, lo cual es:
- **Lento** - Pierden tiempo copiando fórmulas
- **Propenso a errores** - Una fórmula mal copiada arruina todo
- **Difícil de repetir** - Cada vez hay que rehacer el trabajo

**Quality Core automatiza todo el proceso**, desde la carga de datos hasta la generación de reportes ejecutivos.

---

## ✨ Funcionalidades Principales

| Módulo | Funcionalidad | Estado |
|--------|---------------|--------|
| **📂 Datos** | Carga de archivos Excel/CSV (máx 50MB) | ✅ |
| **📊 Variables** | Gráficos X̄-R (n≤9) y X̄-s (n≥10) | ✅ |
| **🔢 Atributos** | Gráficos p, np, c, u | ✅ |
| **⚠️ Reglas de Nelson** | 8 reglas de Western Electric | ✅ |
| **🧹 Limpieza** | Fase I - Estabilización iterativa | ✅ |
| **📈 Capacidad** | Cp, Cpk, Cpl, Cpu, PPM, Nivel Sigma | ✅ |
| **📋 Reportes** | Exportación a PDF, CSV, TXT | ✅ |
| **📐 Normalidad** | Shapiro-Wilk + Gráfico Q-Q | ✅ |
| **⚡ Métricas** | ARL, ATS, Potencia, Curvas OC | ✅ |

---

## 🚀 Acceso Rápido

### 🌐 Versión en Línea (Recomendada)

La forma más rápida de usar la aplicación es a través de la versión desplegada:

👉 **[https://cepcontrolestadistico.netlify.app](https://cepcontrolestadistico.netlify.app)**

No requiere instalación, solo un navegador web moderno.

### 💻 Ejecutar en Local

Si prefieres ejecutar la aplicación en tu máquina local:

#### Requisitos previos

| Requisito | Versión |
|-----------|---------|
| Node.js | ≥ 18.0 |
| npm | ≥ 9.0 |

#### Pasos de instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Aghent47/CEP_PRO.git
cd CEP_PRO

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir navegador en http://localhost:5173
