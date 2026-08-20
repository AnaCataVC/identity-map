# AGENTS.md — AI Agent Guidelines & Architecture Manual

This document serves as the operational manual, architecture reference, and workflow guide for AI coding agents operating within the **Identity Map** repository.

---

## 1. Project Overview & Architecture

**Identity Map** is a scientific tool for identity modeling and relational analysis. It uses a graph-based approach to represent a person's life pillars (nodes), relationships (edges), and temporal evolution snapshots.

### System Architecture:
- **`frontend/`**:
  - React 19, TypeScript, Vite, Tailwind CSS v4, Motion (Framer Motion), Lucide React.
  - Interactive graph visualizer, matrix view, timeline snapshots, and multi-theme palette (Original, Nordic, Sunset, Vintage).
  - State persistence in `localStorage` with JSON import/export.
- **`backend/`**:
  - Python CLI & analysis engine (`analyzer.py`, `cli.py`, `database.py`, `exporter.py`).
  - SQLite relational storage and graph metrics (centrality, clustering, influence balance).
  - Pytest unit and integration test suite.

### Core Abstractions:
- `IdentityNode`: Represents an entity (`valor`, `interes`, `proyecto`, `persona`, `etapa`, `otro`).
- `IdentityEdge`: Represents directional relationships (`influye`, `contrasta`, `nacio_de`, `alimenta`, `bloquea`).
- `IdentitySnapshot`: Represents states of the identity graph across discrete temporal points.

---

## 2. Directory Structure

```text
identity-map/
├── frontend/                      # React 19 + Vite + TypeScript web application
│   ├── src/                       # Components, App.tsx, types.ts, defaultData.ts
│   ├── package.json               # Frontend dependencies & scripts
│   └── vite.config.ts             # Vite build configuration
├── backend/                       # Python CLI, SQLite database & analytics
│   ├── analyzer.py                # Graph calculation and centrality metrics
│   ├── cli.py                     # Interactive terminal interface
│   ├── database.py                # SQLite ORM / schema management
│   ├── exporter.py                # JSON, Markdown, and graph exporters
│   ├── requirements.txt           # Python dependencies
│   └── tests/                     # Pytest suite
└── README.md                      # Bilingual project documentation (EN/ES)
```

---

## 3. Mandatory Agent Rules & Directives

### 🌐 Language & Communication
- **Source Code**: All code (TypeScript, Python, variables, functions, docstrings) MUST be in **English**.
- **User Chat**: Interact with the user in **Spanish** unless requested otherwise.
- **Git Commits**: Use **Conventional Commits** in **English** (e.g., `feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`).
- **README**: Maintain bilingual documentation (English and Spanish).

### 🔒 Security & Privacy
- **Absolute Paths**: NEVER leak local filesystem paths (e.g., `C:\Users\...`) into code, documentation, or commit messages. Always use relative paths (`frontend/src/...`).
- **Data Privacy**: Local user identity graphs must never be transmitted to external servers without user consent.

### 💻 PowerShell Environment
- **Command Chaining**: NEVER use `&&` or `||` in terminal commands. Use `;` or sequential executions.
- **GitHub CLI Context**: Switch to personal account `AnaCataVC` (`gh auth switch -u AnaCataVC --hostname github.com 2>$null`).

---

## 4. Development & Build Commands (PowerShell)

### Frontend (`frontend/`)
```powershell
# Install frontend dependencies
cd frontend; npm install

# Start Vite dev server
npm run dev

# Run TypeScript type check
npm run lint

# Build production static bundle
npm run build
```

### Backend (`backend/`)
```powershell
# Run Python backend CLI
cd backend; python cli.py

# Run backend unit tests
pytest tests/
```

---

## 5. Engineering Standards & Best Practices

1. **TypeScript Strictness**: Ensure all components and models in `frontend/src/` have strict type definitions. Avoid `any`.
2. **Bilingual UI**: The frontend supports English and Spanish. Ensure new user-facing strings are added to the `TRANSLATIONS` object.
3. **Graph Integrity**: Edge deletions must cleanly clean up references in snapshot histories, and node deletions must cascade to connected edges.
