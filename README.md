  
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=flat&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)

[Español](#espanol) | [English](#english)


# IdentityMap

<a id="espanol"></a>

## Español

### 1. Descripción del Proyecto
**IdentityMap** es una herramienta científica de modelado de identidad y análisis relacional. Este repositorio es un "monorepo" que contiene dos herramientas complementarias pero independientes para mapear tu identidad:
- **[Frontend](./frontend)**: Una interfaz visual e interactiva en React donde puedes hacer bocetos y explorar tu grafo de identidad en el navegador.
- **[Backend (CLI)](./backend)**: Una potente herramienta de línea de comandos en Python que permite guardar tu grafo en SQLite, aplicar algoritmos avanzados de NetworkX y exportar gráficos vectoriales precisos con Graphviz.

*Nota: El frontend no realiza llamadas API al backend; ambas son herramientas separadas que comparten la misma filosofía para la construcción de tu mapa de identidad.*

### 2. Tecnologías Utilizadas
- **Frontend:** React 19, TypeScript, Vite, TailwindCSS 4, Framer Motion.
- **Backend:** Python 3.11+, Typer, SQLModel, NetworkX.

### 3. Instrucciones para Ejecutar en Local
Ve a las carpetas correspondientes para ver las instrucciones específicas:
- 👉 [Instrucciones del Frontend](./frontend/README.md)
- 👉 [Instrucciones del Backend](./backend/README.md)

---

<a id="english"></a>

## English

### 1. Project Description
**IdentityMap** is a scientific tool for identity modeling and relational analysis. This repository is a monorepo containing two complementary but independent tools to map your identity:
- **[Frontend](./frontend)**: An interactive visual interface built in React where you can sketch and explore your identity graph in the browser.
- **[Backend (CLI)](./backend)**: A powerful command-line tool in Python that allows you to store your graph in SQLite, apply advanced NetworkX algorithms, and export precise vector graphics using Graphviz.

*Note: The frontend does not make API calls to the backend; they are separate standalone tools that share the same philosophy for building your identity map.*

### 2. Technologies Used
- **Frontend:** React 19, TypeScript, Vite, TailwindCSS 4, Framer Motion.
- **Backend:** Python 3.11+, Typer, SQLModel, NetworkX.

### 3. Local Setup Instructions
Navigate to the respective folders for specific setup instructions:
- 👉 [Frontend Setup Instructions](./frontend/README.md)
- 👉 [Backend Setup Instructions](./backend/README.md)
