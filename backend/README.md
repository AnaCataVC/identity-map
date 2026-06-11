# IdentityMap - Backend (CLI)

[🇪🇸 Español](#espanol) | [🇬🇧 English](#english)

<a id="espanol"></a>
## 🇪🇸 Español

### 1. Descripción del Proyecto
El "backend" es en realidad una herramienta de línea de comandos (CLI) en Python. Sirve para almacenar mapas de identidad en una base de datos local SQLite, analizarlos en profundidad usando teoría de grafos (NetworkX) y exportar resultados visuales en alta calidad usando Graphviz (DOT a SVG). No es un servidor HTTP, sino una herramienta analítica local.

### 2. Tecnologías Utilizadas
- Python 3.11+
- Typer (CLI)
- SQLModel / SQLite
- NetworkX
- Graphviz

### 3. Instrucciones para Ejecutar en Local

1. Crea y activa un entorno virtual:
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Linux/macOS
   # En Windows: venv\Scripts\activate
   ```
2. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Inicializa la base de datos e interactúa:
   ```bash
   python main.py init
   python main.py --help
   ```

---

<a id="english"></a>
## 🇬🇧 English

### 1. Project Description
The "backend" is actually a Command Line Interface (CLI) tool in Python. It is used to store identity maps in a local SQLite database, analyze them deeply using graph theory (NetworkX), and export high-quality visual results using Graphviz (DOT to SVG). It is not an HTTP server, but rather a local analytical tool.

### 2. Technologies Used
- Python 3.11+
- Typer (CLI)
- SQLModel / SQLite
- NetworkX
- Graphviz

### 3. Local Setup Instructions

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Linux/macOS
   # On Windows: venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Initialize the database and interact:
   ```bash
   python main.py init
   python main.py --help
   ```
