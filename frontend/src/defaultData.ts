import { IdentityNode, IdentityEdge, IdentitySnapshot } from "./types";

export const defaultNodes: IdentityNode[] = [
  {
    id: "node-1",
    type: "valor",
    label: "Libertad Creativa",
    description: "La necesidad vital de autodeterminar mi propio espacio de pensamiento, horarios de diseño e iteraciones libres.",
    created_at: "2026-01-10T12:00:00Z",
    tags: ["esencia", "filosofia"]
  },
  {
    id: "node-2",
    type: "valor",
    label: "Autenticidad Coherente",
    description: "Vivir bajo mis propios principios éticos y estéticos sin diluirme por presiones externas.",
    created_at: "2026-01-10T12:00:00Z",
    tags: ["esencia"]
  },
  {
    id: "node-3",
    type: "interes",
    label: "Python & Teoría de Grafos",
    description: "Interés profundo en mapear redes complejas, relaciones semánticas y estructuras matemáticas elegantes con NetworkX.",
    created_at: "2026-02-15T15:30:00Z",
    tags: ["tecnologia", "craft"]
  },
  {
    id: "node-4",
    type: "interes",
    label: "Filosofía Estoica",
    description: "Estudio diario y aplicación de marcos de control mental, dicotomía del control y fortaleza reflexiva.",
    created_at: "2026-01-20T09:00:00Z",
    tags: ["filosofia", "bienestar"]
  },
  {
    id: "node-5",
    type: "proyecto",
    label: "Identity Map Tool",
    description: "Esta herramienta de modelado e inventario temporal de mis propios pilares identitarios.",
    created_at: "2026-03-01T10:00:00Z",
    tags: ["tecnologia", "personal"]
  },
  {
    id: "node-6",
    type: "persona",
    label: "Mentor Creativo",
    description: "Inspiración constructiva y guía que me empuja a refinar mis ideas de software y estructuración mental.",
    created_at: "2026-02-10T14:00:00Z",
    tags: ["crecimiento", "relacion"]
  },
  {
    id: "node-7",
    type: "etapa",
    label: "Transición de Carrera 2026",
    description: "Fase de pivotar activamente hacia roles más independientes, centrados en el craft de código refinado y arquitectura.",
    created_at: "2026-01-05T08:00:00Z",
    tags: ["etapa", "profesional"]
  }
];

export const defaultEdges: IdentityEdge[] = [
  {
    id: "edge-1",
    source_id: "node-1", // Libertad Creativa
    target_id: "node-7", // Transición de Carrera 2026
    relation: "influye",
    weight: 1.5
  },
  {
    id: "edge-2",
    source_id: "node-4", // Filosofía Estoica
    target_id: "node-7", // Transición de Carrera 2026
    relation: "alimenta",
    weight: 1.2
  },
  {
    id: "edge-3",
    source_id: "node-6", // Mentor Creativo
    target_id: "node-3", // Python & Teoría de Grafos
    relation: "influye",
    weight: 1.1
  },
  {
    id: "edge-4",
    source_id: "node-3", // Python & Teoría de Grafos
    target_id: "node-5", // Identity Map Tool
    relation: "nacio_de",
    weight: 1.0
  },
  {
    id: "edge-5",
    source_id: "node-7", // Transición de Carrera 2026
    target_id: "node-5", // Identity Map Tool
    relation: "alimenta",
    weight: 1.4
  },
  {
    id: "edge-6",
    source_id: "node-7", // Transición de Carrera 2026
    target_id: "node-2", // Autenticidad Coherente
    relation: "contrasta",
    weight: 0.8
  },
  {
    id: "edge-7",
    source_id: "node-5", // Identity Map Tool
    target_id: "node-1", // Libertad Creativa
    relation: "alimenta",
    weight: 1.3
  }
];

export const defaultSnapshots: IdentitySnapshot[] = [
  {
    id: "snap-1",
    date: "2026-01-15T10:00:00Z",
    active_nodes: ["node-1", "node-2", "node-4", "node-7"],
    notes: "Fase inicial del año: centrado en la introspección estoica, asentando los valores de autenticidad y libertad frente al cambio de rumbo laboral."
  },
  {
    id: "snap-2",
    date: "2026-03-10T15:00:00Z",
    active_nodes: ["node-1", "node-2", "node-3", "node-4", "node-5", "node-6", "node-7"],
    notes: "Consolidación de proyectos. Aparece la herramienta Identity Map para orquestar mis intereses en teoría de grafos y software tras los consejos de mi mentor."
  }
];
