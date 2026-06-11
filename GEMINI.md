# Identity Map - Gemini Instructions

This document provides context and instructions for AI agents working on the `identity-map` project.

## Project Overview

**IdentityMap** is a scientific tool for identity modeling and relational analysis. It uses a graph-based approach to represent a person's life pillars (nodes) and the relationships between them (edges), along with temporal snapshots.

- **Stack:** React, TypeScript, Vite, TailwindCSS, Framer Motion
- **Core Abstractions:**
  - `IdentityNode`: Represents an entity (valor, interes, proyecto, persona, etapa, otro)
  - `IdentityEdge`: Represents relationships (influye, contrasta, nacio_de, alimenta, bloquea)
  - `IdentitySnapshot`: Represents states of the identity map over time.

## Guidelines for AI Assistants

- **TypeScript First:** Ensure all new components and functions have proper type definitions. Avoid `any`.
- **UI Consistency:** Use TailwindCSS for styling and ensure matching with the existing palette (original, nordic, sunset, vintage) defined in `src/App.tsx`.
- **Lucide Icons:** Use `lucide-react` for any icons.
- **State Management:** The app currently uses React state with localStorage persistence. When adding new state, ensure it is persisted to localStorage appropriately.
- **Language:** The app supports bilingual interfaces (English and Spanish). Ensure new user-facing strings are added to the `TRANSLATIONS` object.
