import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Network, 
  GitBranch, 
  Clock, 
  Plus, 
  Trash2, 
  Share2, 
  Copy, 
  Check, 
  Sliders, 
  Filter, 
  GitCompare, 
  Activity, 
  Layers, 
  Download,
  BookOpen,
  User,
  Zap,
  Info,
  Settings,
  X,
  Globe,
  Sparkles,
  Upload,
  FileJson,
  Github,
  Palette
} from "lucide-react";
import { IdentityNode, IdentityEdge, IdentitySnapshot, NodeType, RelationType } from "./types";
import { defaultNodes, defaultEdges, defaultSnapshots } from "./defaultData";

// Type palettes matching Python exporter pastel styling
const TYPE_COLORS: Record<NodeType, { bg: string; border: string; text: string; lightBg: string }> = {
  valor: { bg: "bg-[#D1E8E2]", border: "border-[#A8CFC5]", text: "text-[#1E564F]", lightBg: "#D1E8E2" },
  interes: { bg: "bg-[#FFD8CC]", border: "border-[#FFB29E]", text: "text-[#B83E1D]", lightBg: "#FFD8CC" },
  proyecto: { bg: "bg-[#D1F9D1]", border: "border-[#A9DFBF]", text: "text-[#1E8449]", lightBg: "#D1F9D1" },
  persona: { bg: "bg-[#E2D1F9]", border: "border-[#BB8FCE]", text: "text-[#6C5CE7]", lightBg: "#E2D1F9" },
  etapa: { bg: "bg-[#F7E1AD]", border: "border-[#F4D03F]", text: "text-[#7D6608]", lightBg: "#F7E1AD" },
  otro: { bg: "bg-[#F5F4F0]", border: "border-[#DCDAD4]", text: "text-[#4A5568]", lightBg: "#F5F4F0" }
};

const PALETTES = {
  original: {
    valor: { bg: "#D1E8E2", border: "#A8CFC5", text: "#1E564F", lightBg: "#D1E8E2" },
    interes: { bg: "#FFD8CC", border: "#FFB29E", text: "#B83E1D", lightBg: "#FFD8CC" },
    proyecto: { bg: "#D1F9D1", border: "#A9DFBF", text: "#1E8449", lightBg: "#D1F9D1" },
    persona: { bg: "#E2D1F9", border: "#BB8FCE", text: "#6C5CE7", lightBg: "#E2D1F9" },
    etapa: { bg: "#F7E1AD", border: "#F4D03F", text: "#7D6608", lightBg: "#F7E1AD" },
    otro: { bg: "#F5F4F0", border: "#DCDAD4", text: "#4A5568", lightBg: "#F5F4F0" }
  },
  nordic: {
    valor: { bg: "#E3EFF2", border: "#ADC3C7", text: "#2C3E50", lightBg: "#E3EFF2" },
    interes: { bg: "#F5E6E8", border: "#D6A3A4", text: "#C0392B", lightBg: "#F5E6E8" },
    proyecto: { bg: "#E4F0EC", border: "#A9BCB6", text: "#27AE60", lightBg: "#E4F0EC" },
    persona: { bg: "#ECE5F0", border: "#B9A3B5", text: "#8E44AD", lightBg: "#ECE5F0" },
    etapa: { bg: "#F5ECE1", border: "#D1B292", text: "#D35400", lightBg: "#F5ECE1" },
    otro: { bg: "#F1F1F1", border: "#CCCCCC", text: "#7F8C8D", lightBg: "#F1F1F1" }
  },
  sunset: {
    valor: { bg: "#FFEFEB", border: "#FFA07A", text: "#8B0000", lightBg: "#FFEFEB" },
    interes: { bg: "#FFF5EB", border: "#FFD700", text: "#D2691E", lightBg: "#FFF5EB" },
    proyecto: { bg: "#EBFDF9", border: "#20B2AA", text: "#008080", lightBg: "#EBFDF9" },
    persona: { bg: "#F6EBFF", border: "#DA70D6", text: "#4B0082", lightBg: "#F6EBFF" },
    etapa: { bg: "#FFFCEB", border: "#F0E68C", text: "#8B8000", lightBg: "#FFFCEB" },
    otro: { bg: "#FBFBF9", border: "#D3D3D3", text: "#555555", lightBg: "#FBFBF9" }
  },
  vintage: {
    valor: { bg: "#DCE2C8", border: "#AFB993", text: "#3B4F2A", lightBg: "#DCE2C8" },
    interes: { bg: "#F5DEC3", border: "#DEB887", text: "#5C4033", lightBg: "#F5DEC3" },
    proyecto: { bg: "#E9D2C4", border: "#CD853F", text: "#4A2E1B", lightBg: "#E9D2C4" },
    persona: { bg: "#D1C3C0", border: "#BC8F8F", text: "#4A3B32", lightBg: "#D1C3C0" },
    etapa: { bg: "#E7E2CE", border: "#C2B280", text: "#4C4A3A", lightBg: "#E7E2CE" },
    otro: { bg: "#E5E5E5", border: "#BEBEBE", text: "#404040", lightBg: "#E5E5E5" }
  }
};

const EDGE_COLORS: Record<RelationType, string> = {
  influye: "#64748B",
  contrasta: "#94A3B8",
  nacio_de: "#64748B",
  alimenta: "#3B82F6",
  bloquea: "#EF4444"
};

const EDGE_STYLES: Record<RelationType, string> = {
  influye: "none",
  contrasta: "4,4",
  nacio_de: "2,2",
  alimenta: "none",
  bloquea: "none"
};

// Physics type for live graph simulation
interface NodePos {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const TRANSLATIONS = {
  es: {
    appTitle: "IdentityMap",
    appSubtitle: "Herramienta científica de modelado de identidad y análisis relacional. Nodos como pilares vitales, vínculos estructurados y transiciones con snapshots temporales descritos mediante grafos.",
    configBtn: "Configuración",
    configTitle: "Configuración del Sistema y Exportación",
    configModalTitle: "Configuración del Sistema y Exportación",
    paletteTitle: "Paleta Visual de Identidad",
    paletteAdvice: "Cambiar la paleta actualizará tanto el lienzo interactivo del navegador como la generación de código DOT de Graphviz.",
    sliderTitle: "Ajustes de Renderizado y Filtro Técnico",
    sliderNodePenwidth: "Grosor contorno de Nodos:",
    sliderEdgePenwidth: "Grosor líneas de Aristas:",
    sliderNodeOpacity: "Opacidad de Nodos:",
    exportsTitle: "Exportaciones y Análisis",
    howRenderLocal: "Motor Analítico Avanzado (Python)",
    githubBtn: "Ver Backend en GitHub",
    renderLocalLabel1: "¿Quieres calcular métricas matemáticas sobre tus datos (NetworkX)? Usa nuestro backend local en Python. Descárgalo de GitHub, instala 'requirements.txt', y carga tu archivo JSON:",
    renderLocalLabel2: "El JSON que exportas aquí sirve tanto para respaldar tus datos como para introducirlos al motor analítico de Python.",
    dangerZoneTitle: "Zona de Peligro",
    dangerZoneAdvice: "Las siguientes acciones son destructivas y no se pueden deshacer. Puedes restaurar el conjunto original de ejemplo o bien vaciar por completo todo el mapa para empezar desde cero.",
    dangerZoneResetBtn: "Restaurar Ejemplo (Datos Semilla)",
    dangerZoneClearBtn: "Vaciar Todo (Lienzo en Blanco)",
    alertCleared: "Se ha limpiado todo el lienzo correctamente. ¡Ahora puedes empezar a crear desde cero!",
    clearConfirm: "¿Estás seguro de que deseas vaciar todo el mapa? Esto borrará permanentemente todos tus nodos, relaciones y snapshots actuales.",
    saveConfigBtn: "Guardar Configuración",
    interactiveCanvas: "Lienzo de Grafo Interactivo",
    filterSnapshot: "Filtrar Snapshot:",
    fullNoFilter: "-- Completo (Sin filtro) --",
    clear: "Limpiar",
    dragOrder: "Arrastra para ordenar. Toca un nodo para inspeccionarlo.",
    degree: "Grado",
    betweenness: "Intermediación",
    delete: "Borrar",
    close: "Cerrar",
    noDescription: "Sin descripción asignada.",
    addTab: "Añadir",
    snapshotsTab: "Snapshots",
    analysisTab: "Análisis",
    createNodeTitle: "Crear Elemento de Identidad (Nodo)",
    elementType: "Tipo de Elemento",
    nodeLabel: "Etiqueta (Label cortos)",
    nodeLabelPlaceholder: "Ej. Estoicismo, Libertad",
    nodeDesc: "Descripción de Relevancia",
    nodeDescPlaceholder: "¿Por qué o cómo influye este pilar en tu identidad hoy?",
    tagsLabel: "Tags (separados por comas)",
    tagsPlaceholder: "Ej. esencia, tecnologia, crecimiento",
    createNodeBtn: "Crear Elemento",
    linkTitle: "Vincular Elementos (Relaciones semánticas)",
    sourceNode: "Origen (Source)",
    targetNode: "Destino (Target)",
    chooseNode: "-- Elige nodo --",
    relationType: "Tipo de Relación",
    weightLabel: "Peso / Fuerza",
    linkBtn: "Establecer Vínculo",
    recordStateTitle: "Grabar Estado de Identidad",
    recordStateDesc: "Guarda un registro de qué elementos están prioritariamente activos e influyendo en tu vida hoy.",
    explanNotes: "Notas explicativas",
    explanNotesPlaceholder: "Ej. Q2 del año, enfocado intensamente en estudiar tecnología y perfeccionar proyectos...",
    includeAllNodes: "Incluir todos los nodos actuales como activos",
    chooseNodesToActivate: "Elige nodos a activar:",
    captureSnapshotBtn: "Capturar Snapshot",
    chronoComparator: "Comparador Cronológico",
    transitionAnalysis: "Análisis de Transición",
    snapAPast: "Snapshot A (Pasado)",
    snapBFuture: "Snapshot B (Futuro)",
    appearedNodes: "Han emergido o se han activado:",
    disappearedNodes: "Han desaparecido o se han desactivado:",
    remainedNodes: "Se mantienen constantes:",
    none: "Ninguno",
    historicLog: "Registro Histórico",
    deleteSnapshot: "Borrar snapshot",
    noSnapshotsRecorded: "No hay ningún snapshot de identidad registrado todavía.",
    analysisTitle: "Análisis Avanzado con NetworkX (Emulado)",
    metricsTitle: "Métricas de Centralidad de Nodos",
    nodesSortedByDegree: "Nodos Ordenados por Grado",
    tableElement: "Elemento",
    tableCategory: "Categoría",
    tableDegree: "Grado",
    tableBetweenness: "Intermediación",
    noNodesLoaded: "No hay nodos cargados en este subgrafo.",
    degreeLabel: "Centralidad de Grado:",
    degreeDesc: "Determina la concentración relacional física. Un nodo con alto grado funciona como anclaje cotidiano principal.",
    betweennessLabel: "Centralidad de Intermediación:",
    betweennessDesc: "Mide los nodos puente. Si lo eliminas, desconectas conceptualmente múltiples facetas de tu identidad.",
    cohesiveDimensions: "Dimensiones Cohesivas (Comunidades)",
    cohesiveDimensionsDesc: "Agrupaciones unidas que emergen de la teoría relacional de tu red vital. El algoritmo de NetworkX encuentra estas 'facciones identitarias'.",
    dimensionOfSelf: "Dimensiones del Yo",
    elementsSuf: "elementos",
    noCommunitiesDetected: "No se han detectado comunidades todavía.",
    systemLang: "Idioma del Sistema",
    alertRestored: "Se restauró el grafo semilla de identidad exitosamente.",
    alertBackupSuccess: "¡Copia de seguridad local JSON importada exitosamente!",
    alertBackupError: "Error al importar el archivo. El JSON no tiene un formato de respaldo válido de IdentityMap.",
    dataPortabilityTitle: "Copia de Seguridad e Importación JSON",
    dataPortabilityDesc: "Exporta todo tu mapa actual de identidad (nodos, relaciones y snapshots temporales) en un archivo JSON estructurado. Este JSON es el mejor y único formato que necesitas tanto para resguardar tus datos como para cargarlos en el backend CLI de Python para el análisis avanzado local.",
    exportJsonBtn: "Exportar Copia de Seguridad JSON",
    importJsonBtn: "Importar Copia de Seguridad JSON",
    importJsonSelect: "Seleccionar Archivo JSON de Resguardo",
    resetConfirm: "¿Restaurar conjunto predefinido de identidad y snapshots de ejemplo? Esto borrará tus cambios actuales de forma irreversible.",
    downloadZipAlert: "Para descargar el proyecto: pulsa el menú superior de AI Studio y exporta el ZIP completo que incluye todos los archivos de Python estructurados listos para usar en la carpeta local `/identity_map` con su base de datos y comandos.",
    nodeTypeValor: "Valor (Core)",
    nodeTypeInteres: "Interés",
    nodeTypeProyecto: "Proyecto",
    nodeTypePersona: "Persona",
    nodeTypeEtapa: "Etapa Vital",
    nodeTypeOtro: "Otro",
    edgeRelationInfluye: "Influye",
    edgeRelationContrasta: "Contrasta",
    edgeRelationNacioDe: "Nació De",
    edgeRelationAlimenta: "Alimenta",
    edgeRelationBloquea: "Bloquea",
    activeNodesPrefix: "Nodos activos:",
    footerProd: "Producido con rigurosidad matemática • NetworkX + SQLModel + Typer",
    footerAuthor: "Hecho a medida para el autoconocimiento."
  },
  en: {
    appTitle: "IdentityMap",
    appSubtitle: "Scientific tool for identity modeling and relational analysis. Nodes as vital pillars, structured relationships, and transitions with temporal snapshots described through graphs.",
    configBtn: "Settings",
    configTitle: "System Settings & Export",
    configModalTitle: "System Settings and Export",
    paletteTitle: "Identity Visual Palette",
    paletteAdvice: "Changing the palette will update both the browser interactive canvas and the generated Graphviz DOT code.",
    sliderTitle: "Rendering and Technical Filter Settings",
    sliderNodePenwidth: "Node border thickness:",
    sliderEdgePenwidth: "Edge line weight:",
    sliderNodeOpacity: "Node Opacity:",
    exportsTitle: "Exports & Analysis",
    howRenderLocal: "Advanced Analysis Engine (Python)",
    githubBtn: "Get Backend on GitHub",
    renderLocalLabel1: "Want to calculate mathematical metrics on your data (NetworkX)? Use our local Python backend. Download it from GitHub, install 'requirements.txt', and load your JSON:",
    renderLocalLabel2: "The JSON you export here serves both as a backup of your data and as the input for the Python analytical engine.",
    dangerZoneTitle: "Danger Zone",
    dangerZoneAdvice: "The following actions are destructive and cannot be undone. You can restore the original sandbox template or fully wipe the map clean to design your own identity nodes from scratch.",
    dangerZoneResetBtn: "Restore Example Set (Seed Data)",
    dangerZoneClearBtn: "Clear Everything (Blank Canvas)",
    alertCleared: "The canvas has been cleared successfully. You can now start creating from scratch!",
    clearConfirm: "Are you sure you want to clear the entire map? This will permanently delete all your current nodes, relationships, and snapshots.",
    saveConfigBtn: "Save Settings",
    interactiveCanvas: "Interactive Graph Stage",
    filterSnapshot: "Filter Snapshot:",
    fullNoFilter: "-- Full Graph (No filter) --",
    clear: "Clear",
    dragOrder: "Drag to rearrange. Tap a node to inspect.",
    degree: "Degree",
    betweenness: "Betweenness",
    delete: "Delete",
    close: "Close",
    noDescription: "No description assigned.",
    addTab: "Add",
    snapshotsTab: "Snapshots",
    analysisTab: "Analysis",
    createNodeTitle: "Create Identity Element (Node)",
    elementType: "Element Type",
    nodeLabel: "Label (Short keyword)",
    nodeLabelPlaceholder: "e.g. Stoic Philosophy, Freedom",
    nodeDesc: "Description of Relevance",
    nodeDescPlaceholder: "Why or how does this pillar shape your identity today?",
    tagsLabel: "Tags (comma-separated)",
    tagsPlaceholder: "e.g. essence, tech, growth",
    createNodeBtn: "Create Element",
    linkTitle: "Link Elements (Semantic Relations)",
    sourceNode: "Source Node",
    targetNode: "Target Node",
    chooseNode: "-- Choose node --",
    relationType: "Relation Type",
    weightLabel: "Weight / Strength",
    linkBtn: "Establish Relation",
    recordStateTitle: "Record Identity State",
    recordStateDesc: "Save a snapshot of which elements are active and prioritarily shaping your life today.",
    explanNotes: "Explanatory Notes",
    explanNotesPlaceholder: "e.g. Q2 of the year, deeply focused on studying engineering and refining projects...",
    includeAllNodes: "Include all current nodes as active",
    chooseNodesToActivate: "Choose active nodes:",
    captureSnapshotBtn: "Capture Snapshot",
    chronoComparator: "Chronological Comparer",
    transitionAnalysis: "Transition Analysis",
    snapAPast: "Snapshot A (Past)",
    snapBFuture: "Snapshot B (Future)",
    appearedNodes: "Emerged / Became Active:",
    disappearedNodes: "Disappeared / Became Inactive:",
    remainedNodes: "Remained Constant:",
    none: "None",
    historicLog: "Historical Log",
    deleteSnapshot: "Delete snapshot",
    noSnapshotsRecorded: "No registered identity snapshot yet.",
    analysisTitle: "Advanced Analysis with NetworkX (Emulated)",
    metricsTitle: "Node Centrality Metrics",
    nodesSortedByDegree: "Nodes Sorted by Degree",
    tableElement: "Element",
    tableCategory: "Category",
    tableDegree: "Degree",
    tableBetweenness: "Betweenness",
    noNodesLoaded: "No nodes available in this subgraph.",
    degreeLabel: "Degree Centrality:",
    degreeDesc: "Determines physical relational concentration. A node with a high degree behaves as a primary daily anchor.",
    betweennessLabel: "Betweenness Centrality:",
    betweennessDesc: "Measures bridge nodes. If you remove it, you conceptually disconnect multiple facets of your identity.",
    cohesiveDimensions: "Cohesive Dimensions (Communities)",
    cohesiveDimensionsDesc: "Tightly-knit groups that emerge from the relational theory of your vital network. NetworkX's algorithm detects these 'identity factions'.",
    dimensionOfSelf: "Dimensions of Self",
    elementsSuf: "elements",
    noCommunitiesDetected: "No communities detected yet.",
    systemLang: "System Language",
    alertRestored: "Seed identity graph restored successfully.",
    alertBackupSuccess: "Local JSON backup imported successfully!",
    alertBackupError: "Error importing file. The JSON does not have a valid IdentityMap backup format.",
    dataPortabilityTitle: "JSON Backup & Import",
    dataPortabilityDesc: "Export all your current identity map (nodes, relationships, and temporal snapshots) to a structured JSON file. This JSON is the best and only format you need to both backup your data and load it into the local Python CLI backend for advanced analysis.",
    exportJsonBtn: "Export JSON Backup",
    importJsonBtn: "Import JSON Backup",
    importJsonSelect: "Select JSON Backup File",
    resetConfirm: "Restore default identity set and example snapshots? This will wipe your current changes permanently.",
    downloadZipAlert: "To download the project: click the top menu in AI Studio and export the complete ZIP which contains all the structured Python files ready to use locally under `/identity_map` with its database and commands.",
    nodeTypeValor: "Value (Core)",
    nodeTypeInteres: "Interest",
    nodeTypeProyecto: "Project",
    nodeTypePersona: "Person",
    nodeTypeEtapa: "Life Stage",
    nodeTypeOtro: "Other",
    edgeRelationInfluye: "Influences",
    edgeRelationContrasta: "Contrasts",
    edgeRelationNacioDe: "Born From",
    edgeRelationAlimenta: "Feeds",
    edgeRelationBloquea: "Blocks",
    activeNodesPrefix: "Active nodes:",
    footerProd: "Produced with mathematical rigor • NetworkX + SQLModel + Typer",
    footerAuthor: "Tailored for self-knowledge."
  }
};

const getNodeTypeLabel = (type: NodeType, lang: "es" | "en") => {
  const mapping: Record<NodeType, { es: string; en: string }> = {
    valor: { es: "Valor (Core)", en: "Value (Core)" },
    interes: { es: "Interés", en: "Interest" },
    proyecto: { es: "Proyecto", en: "Project" },
    persona: { es: "Persona", en: "Person" },
    etapa: { es: "Etapa Vital", en: "Life Stage" },
    otro: { es: "Otro", en: "Other" }
  };
  return mapping[type] ? mapping[type][lang] : type;
};

const getRelationLabel = (relation: RelationType, lang: "es" | "en") => {
  const mapping: Record<RelationType, { es: string; en: string }> = {
    influye: { es: "Influye", en: "Influences" },
    contrasta: { es: "Contrasta", en: "Contrasts" },
    nacio_de: { es: "Nació De", en: "Born From" },
    alimenta: { es: "Alimenta", en: "Feeds" },
    bloquea: { es: "Bloquea", en: "Blocks" }
  };
  return mapping[relation] ? mapping[relation][lang] : relation;
};

export default function App() {
  // ----------------------------------------------------
  // Page core state
  // ----------------------------------------------------
  const [nodes, setNodes] = useState<IdentityNode[]>(() => {
    const local = localStorage.getItem("id_map_nodes");
    return local ? JSON.parse(local) : [];
  });

  const [edges, setEdges] = useState<IdentityEdge[]>(() => {
    const local = localStorage.getItem("id_map_edges");
    return local ? JSON.parse(local) : [];
  });

  const [snapshots, setSnapshots] = useState<IdentitySnapshot[]>(() => {
    const local = localStorage.getItem("id_map_snapshots");
    return local ? JSON.parse(local) : [];
  });

  // Active tab selection
  const [activeTab, setActiveTab] = useState<"visual" | "snapshots" | "analysis">("visual");
  const tabSectionRef = useRef<HTMLElement>(null);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleTabClick = (tab: "visual" | "snapshots" | "analysis") => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        tabSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  };
  // Language configuration state
  const [language, setLanguage] = useState<"es" | "en">(() => {
    const saved = localStorage.getItem("id_map_language");
    return (saved === "es" || saved === "en") ? saved : "es";
  });

  useEffect(() => {
    localStorage.setItem("id_map_language", language);
  }, [language]);

  const t = TRANSLATIONS[language];

  // Configuration drawer state and customizable export multipliers
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [exportPalette, setExportPalette] = useState<"original" | "nordic" | "sunset" | "vintage">("original");
  const [nodePenwidth, setNodePenwidth] = useState<number>(1.2);
  const [edgePenwidth, setEdgePenwidth] = useState<number>(1.2);
  const [nodeOpacity, setNodeOpacity] = useState<number>(1.0);
  const [edgeOpacity, setEdgeOpacity] = useState<number>(0.8);

  useEffect(() => {
    if (!isConfigOpen) {
      setShowResetConfirm(false);
      setShowClearConfirm(false);
    }
  }, [isConfigOpen]);

  // Active temporal filter (selected snapshot to dim/filter nodes)
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
  
  // Selected visual nodes / detail modal
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Forms & state
  const [nodeForm, setNodeForm] = useState<{
    label: string;
    type: NodeType;
    description: string;
    tags: string;
  }>({
    label: "",
    type: "valor",
    description: "",
    tags: ""
  });

  const [edgeForm, setEdgeForm] = useState<{
    source_id: string;
    target_id: string;
    relation: RelationType;
    weight: number;
  }>({
    source_id: "",
    target_id: "",
    relation: "influye",
    weight: 1.0
  });

  const [snapshotForm, setSnapshotForm] = useState<{
    notes: string;
    useAll: boolean;
    customActiveIds: string[];
  }>({
    notes: "",
    useAll: true,
    customActiveIds: []
  });

  // Snapshot Comparator Selectors
  const [compSnapA, setCompSnapA] = useState<string>("");
  const [compSnapB, setCompSnapB] = useState<string>("");

  // Alert banner states
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ----------------------------------------------------
  // Sync state to LocalStorage
  // ----------------------------------------------------
  useEffect(() => {
    localStorage.setItem("id_map_nodes", JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem("id_map_edges", JSON.stringify(edges));
  }, [edges]);

  useEffect(() => {
    localStorage.setItem("id_map_snapshots", JSON.stringify(snapshots));
  }, [snapshots]);

  // Set default snapshot compare selection on load
  useEffect(() => {
    if (snapshots.length >= 2) {
      setCompSnapA(snapshots[0].id);
      setCompSnapB(snapshots[1].id);
    } else if (snapshots.length === 1) {
      setCompSnapA(snapshots[0].id);
      setCompSnapB(snapshots[0].id);
    }
  }, [snapshots]);

  // ----------------------------------------------------
  // Real Force-Directed Layout Physics Loop
  // ----------------------------------------------------
  const canvasRef = useRef<SVGSVGElement | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, NodePos>>({});
  const nodePositionsRef = useRef<Record<string, NodePos>>({});
  const dragNodeIdRef = useRef<string | null>(null);

  // Initialize node coordinate hashes when node list changes
  useEffect(() => {
    const current = { ...nodePositionsRef.current };
    let changed = false;

    nodes.forEach((node, idx) => {
      if (!current[node.id]) {
        // Distribute nicely along an elegant concentric pattern first
        const angle = (idx / nodes.length) * 2 * Math.PI;
        const radius = 180 + Math.random() * 20;
        current[node.id] = {
          id: node.id,
          x: 400 + Math.cos(angle) * radius,
          y: 250 + Math.sin(angle) * radius,
          vx: 0,
          vy: 0
        };
        changed = true;
      }
    });

    // Cleanup stale nodes
    Object.keys(current).forEach(id => {
      if (!nodes.some(n => n.id === id)) {
        delete current[id];
        changed = true;
      }
    });

    if (changed || Object.keys(nodePositions).length === 0) {
      nodePositionsRef.current = current;
      setNodePositions({ ...current });
    }
  }, [nodes]);

  // Physics animation frames
  useEffect(() => {
    let animId: number;
    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;

    const tick = () => {
      const pos = { ...nodePositionsRef.current };
      const nodeIds = Object.keys(pos);
      if (nodeIds.length === 0) return;

      // 1. Repulsion between nodes (Coulomb force)
      for (let i = 0; i < nodeIds.length; i++) {
        const u = pos[nodeIds[i]];
        for (let j = i + 1; j < nodeIds.length; j++) {
          const v = pos[nodeIds[j]];
          const dx = v.x - u.x;
          const dy = v.y - u.y;
          const distSq = dx * dx + dy * dy + 1; // avoid divide by zero
          const dist = Math.sqrt(distSq);

          if (dist < 300) {
            // Strong push forces when too close
            const force = (16000) / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (u.id !== dragNodeIdRef.current) {
              u.vx -= fx;
              u.vy -= fy;
            }
            if (v.id !== dragNodeIdRef.current) {
              v.vx += fx;
              v.vy += fy;
            }
          }
        }
      }

      // 2. Spring pulls along registered edges (Hooke's constraint law)
      edges.forEach(edge => {
        const u = pos[edge.source_id];
        const v = pos[edge.target_id];
        if (u && v) {
          const dx = v.x - u.x;
          const dy = v.y - u.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 160; // resting edge length
          const springK = 0.04 * (edge.weight || 1); // stronger weights pull tighter
          const force = (dist - targetDist) * springK;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (u.id !== dragNodeIdRef.current) {
            u.vx += fx;
            u.vy += fy;
          }
          if (v.id !== dragNodeIdRef.current) {
            v.vx -= fx;
            v.vy -= fy;
          }
        }
      });

      // 3. Keep anchored to the page center and apply friction
      nodeIds.forEach(id => {
        const node = pos[id];
        if (id === dragNodeIdRef.current) return;

        // Subtle gravity pull to center
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        node.vx += dx * 0.005;
        node.vy += dy * 0.005;

        // Apply friction damping
        node.vx *= 0.85;
        node.vy *= 0.85;

        // Update positions
        node.x += node.vx;
        node.y += node.vy;

        // Boundary constraints
        node.x = Math.max(80, Math.min(width - 80, node.x));
        node.y = Math.max(50, Math.min(height - 50, node.y));
      });

      nodePositionsRef.current = pos;
      setNodePositions({ ...pos });
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [edges, nodes]);

  // Mouse drag handling controls
  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    dragNodeIdRef.current = id;
    handleMouseMove(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragNodeIdRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const viewBoxX = isMobileView ? 150 : 0;
    const viewBoxY = isMobileView ? 50 : 0;
    const viewBoxW = isMobileView ? 500 : 800;
    const viewBoxH = isMobileView ? 400 : 500;
    const x = ((e.clientX - rect.left) / rect.width) * viewBoxW + viewBoxX;
    const y = ((e.clientY - rect.top) / rect.height) * viewBoxH + viewBoxY;

    const pos = { ...nodePositionsRef.current };
    if (pos[dragNodeIdRef.current]) {
      pos[dragNodeIdRef.current].x = x;
      pos[dragNodeIdRef.current].y = y;
      pos[dragNodeIdRef.current].vx = 0;
      pos[dragNodeIdRef.current].vy = 0;
      nodePositionsRef.current = pos;
      setNodePositions(pos);
    }
  };

  // Touch event handlers for mobile gesture support
  const handleNodeTouchStart = (e: React.TouchEvent, id: string) => {
    if (e.cancelable) e.preventDefault();
    dragNodeIdRef.current = id;
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragNodeIdRef.current || !canvasRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const viewBoxX = isMobileView ? 150 : 0;
    const viewBoxY = isMobileView ? 50 : 0;
    const viewBoxW = isMobileView ? 500 : 800;
    const viewBoxH = isMobileView ? 400 : 500;
    const x = ((touch.clientX - rect.left) / rect.width) * viewBoxW + viewBoxX;
    const y = ((touch.clientY - rect.top) / rect.height) * viewBoxH + viewBoxY;

    const pos = { ...nodePositionsRef.current };
    if (pos[dragNodeIdRef.current]) {
      pos[dragNodeIdRef.current].x = x;
      pos[dragNodeIdRef.current].y = y;
      pos[dragNodeIdRef.current].vx = 0;
      pos[dragNodeIdRef.current].vy = 0;
      nodePositionsRef.current = pos;
      setNodePositions(pos);
    }
  };

  const handleMouseUpOrLeave = () => {
    dragNodeIdRef.current = null;
  };

  // ----------------------------------------------------
  // Node and relationship CRUD commands
  // ----------------------------------------------------
  const triggerSuccessMsg = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeForm.label.trim()) return;

    const tagsArr = nodeForm.tags
      ? nodeForm.tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean)
      : [];

    const newNode: IdentityNode = {
      id: "node-" + Date.now(),
      type: nodeForm.type,
      label: nodeForm.label.trim(),
      description: nodeForm.description.trim(),
      created_at: new Date().toISOString(),
      tags: tagsArr
    };

    setNodes(prev => [...prev, newNode]);
    setNodeForm({ label: "", type: "valor", description: "", tags: "" });
    triggerSuccessMsg(`Elemento "${newNode.label}" agregado exitosamente.`);
  };

  const handleDeleteNode = (id: string) => {
    const label = nodes.find(n => n.id === id)?.label || "";
    setNodes(prev => prev.filter(n => n.id !== id));
    // Cascade delete any incoming or outgoing edges
    setEdges(prev => prev.filter(e => e.source_id !== id && e.target_id !== id));
    // Remove from snapshot selections
    setSnapshots(prev => 
      prev.map(snap => ({
        ...snap,
        active_nodes: snap.active_nodes.filter(nid => nid !== id)
      }))
    );
    if (selectedNodeId === id) setSelectedNodeId(null);
    triggerSuccessMsg(`Elemento "${label}" borrado junto con sus relaciones.`);
  };

  const handleAddEdge = (e: React.FormEvent) => {
    e.preventDefault();
    const { source_id, target_id, relation, weight } = edgeForm;
    if (!source_id || !target_id) return;
    if (source_id === target_id) {
      alert("No se puede conectar un nodo consigo mismo de manera directa.");
      return;
    }

    // Prevent duplicate relations between same direction
    const exists = edges.some(edge => edge.source_id === source_id && edge.target_id === target_id && edge.relation === relation);
    if (exists) {
      alert("Esta relación ya existe entre los elementos.");
      return;
    }

    const newEdge: IdentityEdge = {
      id: "edge-" + Date.now(),
      source_id,
      target_id,
      relation,
      weight: Number(weight)
    };

    setEdges(prev => [...prev, newEdge]);
    setEdgeForm(prev => ({ ...prev, source_id: "", target_id: "" }));
    triggerSuccessMsg("Relación creada exitosamente.");
  };

  const handleDeleteEdge = (id: string) => {
    setEdges(prev => prev.filter(e => e.id !== id));
    triggerSuccessMsg("Relación borrada exitosamente.");
  };

  // ----------------------------------------------------
  // Snapshots operations
  // ----------------------------------------------------
  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotForm.notes.trim()) return;

    const activeIds = snapshotForm.useAll 
      ? nodes.map(n => n.id) 
      : snapshotForm.customActiveIds;

    if (activeIds.length === 0) {
      alert("Un snapshot debe incluir al menos un nodo activo.");
      return;
    }

    const newSnapshot: IdentitySnapshot = {
      id: "snap-" + Date.now(),
      date: new Date().toISOString(),
      active_nodes: activeIds,
      notes: snapshotForm.notes.trim()
    };

    setSnapshots(prev => [...prev, newSnapshot]);
    setSnapshotForm({ notes: "", useAll: true, customActiveIds: [] });
    triggerSuccessMsg("Snapshot temporal capturado en histórico.");
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
    if (activeSnapshotId === id) setActiveSnapshotId(null);
    triggerSuccessMsg("Snapshot borrado.");
  };

  const toggleNodeInSnapshotCustom = (id: string) => {
    setSnapshotForm(prev => {
      const exists = prev.customActiveIds.includes(id);
      return {
        ...prev,
        customActiveIds: exists 
          ? prev.customActiveIds.filter(nid => nid !== id)
          : [...prev.customActiveIds, id]
      };
    });
  };

  // ----------------------------------------------------
  // NetworkX Analyser emulator (Brandes Centrality + Communities)
  // ----------------------------------------------------
  const activeNodesSet = useMemo(() => {
    if (!activeSnapshotId) return null;
    const snap = snapshots.find(s => s.id === activeSnapshotId);
    return snap ? new Set<string>(snap.active_nodes) : null;
  }, [activeSnapshotId, snapshots]);

  const filteredNodesList = useMemo(() => {
    if (!activeNodesSet) return nodes;
    return nodes.filter(n => activeNodesSet.has(n.id));
  }, [nodes, activeNodesSet]);

  const filteredEdgesList = useMemo(() => {
    if (!activeNodesSet) return edges;
    return edges.filter(e => activeNodesSet.has(e.source_id) && activeNodesSet.has(e.target_id));
  }, [edges, activeNodesSet]);

  // 1. Degree Centrality
  const degreeCentralities = useMemo(() => {
    const totalNodesCount = filteredNodesList.length;
    const cent: Record<string, number> = {};
    filteredNodesList.forEach(n => { cent[n.id] = 0; });

    if (totalNodesCount <= 1) return cent;

    // Count in and out connections
    filteredEdgesList.forEach(e => {
      if (cent[e.source_id] !== undefined) cent[e.source_id]++;
      if (cent[e.target_id] !== undefined) cent[e.target_id]++;
    });

    // Normalize: dev / (N - 1)
    filteredNodesList.forEach(n => {
      cent[n.id] = cent[n.id] / (totalNodesCount - 1);
    });

    return cent;
  }, [filteredNodesList, filteredEdgesList]);

  // 2. Unbiased Betweenness Centrality (Brandes Algorithm)
  const betweennessCentralities = useMemo(() => {
    const list_nodes = filteredNodesList;
    const list_edges = filteredEdgesList;
    const n = list_nodes.length;
    const centralities: Record<string, number> = {};
    list_nodes.forEach(node => { centralities[node.id] = 0; });

    if (n <= 2) return centralities;

    // Construct directed adjacency list
    const adj: Record<string, string[]> = {};
    list_nodes.forEach(node => { adj[node.id] = []; });
    list_edges.forEach(edge => {
      if (adj[edge.source_id] && adj[edge.target_id]) {
        adj[edge.source_id].push(edge.target_id);
      }
    });

    list_nodes.forEach(sNode => {
      const s = sNode.id;
      const S: string[] = [];
      const P: Record<string, string[]> = {};
      const sigma: Record<string, number> = {};
      const d: Record<string, number> = {};
      
      list_nodes.forEach(node => {
        P[node.id] = [];
        sigma[node.id] = 0;
        d[node.id] = -1;
      });

      sigma[s] = 1;
      d[s] = 0;

      const Q: string[] = [s];

      while (Q.length > 0) {
        const v = Q.shift()!;
        S.push(v);
        for (const w of adj[v] || []) {
          if (d[w] < 0) {
            Q.push(w);
            d[w] = d[v] + 1;
          }
          if (d[w] === d[v] + 1) {
            sigma[w] += sigma[v];
            P[w].push(v);
          }
        }
      }

      const delta: Record<string, number> = {};
      list_nodes.forEach(node => { delta[node.id] = 0; });

      while (S.length > 0) {
        const w = S.pop()!;
        for (const v of P[w] || []) {
          delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
        }
        if (w !== s) {
          centralities[w] += delta[w];
        }
      }
    });

    // Normalize for directed graphs
    const norm = (n - 1) * (n - 2);
    list_nodes.forEach(node => {
      centralities[node.id] = norm > 0 ? centralities[node.id] / norm : 0;
    });

    return centralities;
  }, [filteredNodesList, filteredEdgesList]);

  // 3. Modularity Cohesive Communities Emulation (Connected groups refined)
  const communities = useMemo(() => {
    const list_nodes = filteredNodesList;
    const list_edges = filteredEdgesList;
    if (list_nodes.length === 0) return [];

    const visited = new Set<string>();
    const adj: Record<string, string[]> = {};
    list_nodes.forEach(node => { adj[node.id] = []; });
    
    list_edges.forEach(edge => {
      if (adj[edge.source_id] && adj[edge.target_id]) {
        adj[edge.source_id].push(edge.target_id);
        adj[edge.target_id].push(edge.source_id); // Undirected view for communities
      }
    });

    const groups: string[][] = [];

    list_nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const component: string[] = [];
        const queue = [node.id];
        visited.add(node.id);

        while (queue.length > 0) {
          const u = queue.shift()!;
          component.push(u);
          for (const v of adj[u] || []) {
            if (!visited.has(v)) {
              visited.add(v);
              queue.push(v);
            }
          }
        }
        groups.push(component);
      }
    });

    return groups;
  }, [filteredNodesList, filteredEdgesList]);

  // 4. Comparison analysis between two selected snapshots
  const comparisonResults = useMemo(() => {
    if (!compSnapA || !compSnapB) return null;
    const s1 = snapshots.find(s => s.id === compSnapA);
    const s2 = snapshots.find(s => s.id === compSnapB);
    if (!s1 || !s2) return null;

    const set1 = new Set(s1.active_nodes);
    const set2 = new Set(s2.active_nodes);

    const appearedIds = [...set2].filter(x => !set1.has(x));
    const disappearedIds = [...set1].filter(x => !set2.has(x));
    const remainedIds = [...set1].filter(x => set2.has(x));

    const nodesMap = new Map(nodes.map(n => [n.id, n]));

    return {
      appeared: appearedIds.map(id => nodesMap.get(id)).filter(Boolean) as IdentityNode[],
      disappeared: disappearedIds.map(id => nodesMap.get(id)).filter(Boolean) as IdentityNode[],
      remained: remainedIds.map(id => nodesMap.get(id)).filter(Boolean) as IdentityNode[],
      notesA: s1.notes,
      notesB: s2.notes
    };
  }, [compSnapA, compSnapB, snapshots, nodes]);

  // Helper to append custom alpha opacity hex values
  const applyOpacityToHex = (hexColor: string, opacity: number) => {
    const cleanHex = hexColor.trim();
    if (!cleanHex.startsWith("#")) return cleanHex;
    const clampedOpacity = Math.max(0.0, Math.min(1.0, opacity));
    const alphaInt = Math.round(clampedOpacity * 255);
    const alphaHex = alphaInt.toString(16).toUpperCase().padStart(2, "0");
    return `${cleanHex.substring(0, 7)}${alphaHex}`;
  };



  // JSON Backup Import / Export Utilities
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const exportBackupJson = () => {
    try {
      const backupData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        nodes: nodes,
        edges: edges,
        snapshots: snapshots
      };
      const text = JSON.stringify(backupData, null, 2);
      const blob = new Blob([text], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `identity_map_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerSuccessMsg(language === "es" ? "Copia de seguridad local JSON descargada correctamente." : "Local JSON backup downloaded successfully.");
    } catch (err) {
      console.error("Error exporting backup:", err);
      alert(language === "es" ? "Error al exportar los datos" : "Error exporting data");
    }
  };

  const importBackupJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.nodes)) {
          throw new Error("Invalid backup format");
        }

        const importedNodes = parsed.nodes;
        const importedEdges = Array.isArray(parsed.edges) ? parsed.edges : [];
        const importedSnapshots = Array.isArray(parsed.snapshots) ? parsed.snapshots : [];

        setNodes(importedNodes);
        setEdges(importedEdges);
        setSnapshots(importedSnapshots);

        triggerSuccessMsg(t.alertBackupSuccess);
        setIsConfigOpen(false);
      } catch (err) {
        console.error("Error importing JSON backup:", err);
        alert(t.alertBackupError);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2D3436] font-sans antialiased flex flex-col selection:bg-[#6C5CE7]/15 selection:text-[#6C5CE7]">
      
      {/* Visual top notification bar */}
      {successMsg && (
        <div className="bg-[#EAFCEB] border-b border-[#BCEFB1] text-[#15803D] px-4 py-2.5 text-center text-sm font-medium animate-fade-in flex items-center justify-center gap-2">
          <Check className="h-4 w-4 text-[#1E8449]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Styled App Header in style of top-bar and modern technical studio */}
      <header className="border-b border-[#F0F0F0] bg-white px-6 py-5 flex flex-row items-center justify-between gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2.5">
            <h1 className="text-xl font-bold tracking-tighter text-[#6C5CE7]">
              {t.appTitle}
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1.5 max-w-xl font-sans leading-relaxed hidden sm:block">
            {t.appSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-[#F8F9FA] border border-[#EDEDED] hover:border-[#6C5CE7] hover:text-[#6C5CE7] rounded-lg shadow-sm transition-all cursor-pointer"
            id="cfg-header-btn"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{t.configBtn}</span>
          </button>
        </div>
      </header>

      {/* Primary Studio Body Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-5 lg:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6">
        
        {/* LEFT COLUMN: The Interactive Graph Stage (Canvas) */}
        <section className="md:col-span-7 bg-white border border-[#EDEDED] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col overflow-hidden h-[calc(100svh-155px)] min-h-[440px] md:h-[560px] lg:h-[630px]">
          
          {/* Canvas Sub-Header Controls */}
          <div className="p-4 border-b border-[#F0F0F0] bg-[#F8F9FA] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-[#6C5CE7]" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 font-sans">
                {t.interactiveCanvas}
              </h2>
            </div>

            {/* Snapshot quick-filter dropdown */}
            <div className="flex items-center gap-2 min-w-0 max-w-full">
              <span className="text-xs text-gray-500 flex items-center gap-1 font-sans shrink-0">
                <Filter className="h-3 w-3 text-[#6C5CE7]" />
                <span className="hidden sm:inline">{t.filterSnapshot}</span>
                <span className="inline sm:hidden">{language === "es" ? "Filtra:" : "Filter:"}</span>
              </span>
              <select 
                value={activeSnapshotId || ""} 
                onChange={(e) => setActiveSnapshotId(e.target.value || null)}
                className="text-xs bg-white border border-[#EDEDED] py-1 px-2.5 pr-6 rounded-lg focus:outline-none focus:border-[#6C5CE7] max-w-[130px] sm:max-w-none min-w-0"
              >
                <option value="">{t.fullNoFilter}</option>
                {snapshots.map(snap => (
                  <option key={snap.id} value={snap.id}>
                    {snap.notes.length > 28 ? snap.notes.substring(0, 28) + "..." : snap.notes}
                  </option>
                ))}
              </select>
              {activeSnapshotId && (
                <button 
                  onClick={() => setActiveSnapshotId(null)}
                  className="px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-[10px] uppercase font-bold shrink-0"
                  title={language === "es" ? "Quitar filtro temporal" : "Remove temporal filter"}
                >
                  {t.clear}
                </button>
              )}
            </div>
          </div>

          {/* Interactive SVG Render Canvas with Artistic Gradient */}
          <div className="relative flex-1 artistic-gradient h-full sm:h-[400px] lg:h-[480px] select-none overflow-hidden">
            {nodes.length === 0 && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-slate-50/40 backdrop-blur-[1px] text-center">
                <div className="p-5 bg-white/95 border border-slate-200/80 rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)] max-w-sm space-y-4">
                  <div className="mx-auto w-11 h-11 bg-[#6C5CE7]/15 rounded-full flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-[#6C5CE7]" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">
                      {language === "es" ? "Lienzo de Identidad Vacío" : "Empty Identity Canvas"}
                    </h5>
                    <p className="text-[11px] text-slate-500 font-sans mt-1.5 leading-relaxed">
                      {language === "es"
                        ? "Tu mapa local se encuentra vacío. Diseña tus propios pilares de identidad o carga instantáneamente el conjunto de datos semilla."
                        : "Your local map is empty. Design your own identity pillars or instantly load the pre-configured seed template."}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setNodes(defaultNodes);
                      setEdges(defaultEdges);
                      setSnapshots(defaultSnapshots);
                      triggerSuccessMsg(t.alertRestored);
                    }}
                    className="w-full py-2 px-3.5 bg-[#6C5CE7] hover:bg-[#5b4dbd] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    {language === "es" ? "Cargar Ejemplo (Datos Semilla)" : "Load Seed Example Data"}
                  </button>
                </div>
              </div>
            )}
            <svg 
              ref={canvasRef}
              viewBox={isMobileView ? "150 50 500 400" : "0 0 800 500"} 
              className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUpOrLeave}
              onTouchCancel={handleMouseUpOrLeave}
            >
              {/* Defs block for vector marker arrows with theme colors */}
              <defs>
                <marker id="arrow-vee" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#A0A0A0" />
                </marker>
                <marker id="arrow-normal" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#6C5CE7" />
                </marker>
                <marker id="arrow-tee" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 5 0 L 5 10 M 0 5 L 5 5" stroke="#ef4444" strokeWidth="2" />
                </marker>
              </defs>

              {/* Grid backdrop indicating technical style */}
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.015)" strokeWidth="1" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Render relationship lines */}
              {edges.map(edge => {
                const sourcePos = nodePositions[edge.source_id];
                const targetPos = nodePositions[edge.target_id];

                if (!sourcePos || !targetPos) return null;

                // Determine transparency when inactive in snapshots
                const isSourceActive = !activeSnapshotId || activeNodesSet?.has(edge.source_id);
                const isTargetActive = !activeSnapshotId || activeNodesSet?.has(edge.target_id);
                const isActive = isSourceActive && isTargetActive;

                const color = edge.relation === "alimenta" ? "#6C5CE7" : (EDGE_COLORS[edge.relation] || "#A0A0A0");
                const strokeStyle = EDGE_STYLES[edge.relation] || "none";
                const marker = edge.relation === "bloquea" ? "url(#arrow-tee)" : edge.relation === "alimenta" ? "url(#arrow-normal)" : "url(#arrow-vee)";

                return (
                  <g key={edge.id} className="transition-opacity duration-300" opacity={isActive ? edgeOpacity : 0.15}>
                    <line 
                      x1={sourcePos.x} 
                      y1={sourcePos.y} 
                      x2={targetPos.x} 
                      y2={targetPos.y} 
                      stroke={color} 
                      strokeWidth={(1.2 + (edge.weight - 1) * 0.4) * edgePenwidth} 
                      strokeDasharray={strokeStyle}
                      markerEnd={marker}
                    />
                    {/* Artistic Flair Georgia/serif italic style relationship label text */}
                    <g transform={`translate(${(sourcePos.x + targetPos.x) / 2}, ${(sourcePos.y + targetPos.y) / 2})`}>
                      <rect 
                        x="-34" 
                        y="-8" 
                        width="68" 
                        height="16" 
                        rx="8" 
                        fill="#FDFCF8" 
                        stroke="#EDEDED" 
                        strokeWidth="1" 
                      />
                      <text 
                        className="text-[9px] font-serif italic fill-[#A0A0A0] text-center" 
                        dominantBaseline="central" 
                        textAnchor="middle"
                      >
                        {edge.relation}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Render Node Boxes */}
              {nodes.map(node => {
                const pos = nodePositions[node.id];
                if (!pos) return null;

                const isActive = !activeSnapshotId || activeNodesSet?.has(node.id);
                const isSelected = selectedNodeId === node.id;
                const activePaletteConfig = PALETTES[exportPalette] || PALETTES.original;
                const colors = activePaletteConfig[node.type] || activePaletteConfig.otro;

                const displayLabel = node.label.length > 20 ? node.label.substring(0, 18) + ".." : node.label;
                // Standard font size is text-[11px] font-semibold tracking-wider in Montserrat/Roboto Mono.
                // Let's assume each character takes ~7.5px. Minimum width is 136px.
                const textWidth = displayLabel.length * 7.5;
                const cardWidth = Math.max(136, Math.ceil(textWidth + 28)); // 28px safety padding
                const cardHeight = 46;
                const halfWidth = cardWidth / 2;
                const halfHeight = cardHeight / 2;

                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer transition-opacity duration-300"
                    opacity={isActive ? nodeOpacity : 0.2}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    onTouchStart={(e) => handleNodeTouchStart(e, node.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(node.id);
                    }}
                  >
                    {/* Shadow / selection border */}
                    <rect 
                      x={-halfWidth - 2} 
                      y={-halfHeight - 2} 
                      width={cardWidth + 4} 
                      height={cardHeight + 4} 
                      rx="8" 
                      fill="transparent" 
                      stroke={isSelected ? "#6C5CE7" : "transparent"} 
                      strokeWidth="2.5" 
                      className="transition-all"
                    />

                    {/* Standard rounded box matching Graphviz pastel specification with Artistic Flair shadows */}
                    <rect 
                      x={-halfWidth} 
                      y={-halfHeight} 
                      width={cardWidth} 
                      height={cardHeight} 
                      rx="7" 
                      fill={colors.lightBg} 
                      stroke={isSelected ? "#6C5CE7" : colors.border} 
                      strokeWidth={isSelected ? Math.max(1.5, nodePenwidth + 0.5) : nodePenwidth}
                      className="shadow-sm filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.03)]"
                    />

                    {/* Label strings in Courier New technical styling */}
                    <text 
                      x="0" 
                      y="-3" 
                      textAnchor="middle" 
                      className="text-[11px] font-mono font-semibold tracking-wider fill-[#2D3436] uppercase pointer-events-none"
                    >
                      {displayLabel}
                    </text>

                    {/* Node categorical sub-label */}
                    <text 
                      x="0" 
                      y="11" 
                      textAnchor="middle" 
                      fill={colors.text}
                      className="text-[8px] font-mono tracking-widest font-bold uppercase pointer-events-none opacity-90"
                    >
                      {getNodeTypeLabel(node.type, language)}
                    </text>

                    {/* Indicator dots if pinned drag node */}
                    {dragNodeIdRef.current === node.id && (
                      <circle cx={halfWidth - 8} cy={-halfHeight + 5} r="3" fill="#6C5CE7" />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Instruction overlay badge */}
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-white/90 backdrop-blur px-2.5 py-1.5 border border-[#EDEDED] rounded-lg text-[10px] text-gray-500 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-[#6C5CE7] shrink-0" />
              <span className="font-sans">{t.dragOrder}</span>
            </div>
          </div>

          {/* Quick Node Details / Inspector Drawer */}
          {selectedNodeId && (
            <div className="border-t border-gray-200 bg-white p-4 animate-slide-up">
              {(() => {
                const node = nodes.find(n => n.id === selectedNodeId);
                if (!node) return null;
                const colors = TYPE_COLORS[node.type];
                
                // Centrality stats for this node in the current active graph
                const deg = degreeCentralities[node.id] || 0;
                const btwn = betweennessCentralities[node.id] || 0;

                return (
                  <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-mono tracking-wider font-bold px-2 py-0.5 rounded border border-current ${colors?.border} ${colors?.text} ${colors?.bg}`}>
                          {getNodeTypeLabel(node.type, language).toUpperCase()}
                        </span>
                        <h4 className="text-sm font-semibold text-gray-900 font-sans">{node.label}</h4>
                        <span className="text-[10px] text-gray-400 font-mono">ID: {node.id.substring(0, 8)}..</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed bg-[#F8F9FA] p-2.5 rounded-lg border border-[#EDEDED] font-sans">
                        {node.description || t.noDescription}
                      </p>
                      
                      {/* Tags in Artistic style */}
                      {node.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {node.tags.map(t => (
                            <span key={t} className="text-[10px] font-mono font-medium bg-[#E0E0E0] text-gray-700 uppercase px-2 py-0.5 rounded border border-gray-300/30">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Centrality Stats Columns with Artistic font styling */}
                    <div className="w-full md:w-auto flex flex-row md:flex-col gap-3 min-w-[160px] bg-[#F8F9FA] p-3 rounded-lg border border-[#F0F0F0]">
                      <div>
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block">{t.degree}</span>
                        <span className="text-sm font-bold font-mono text-[#6C5CE7]">{deg.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block">{t.betweenness}</span>
                        <span className="text-sm font-bold font-mono text-[#6C5CE7]">{btwn.toFixed(3)}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-row md:flex-col gap-2 self-stretch md:self-auto justify-end">
                      <button 
                        onClick={() => handleDeleteNode(node.id)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-2 border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t.delete}
                      </button>
                      <button 
                        onClick={() => setSelectedNodeId(null)}
                        className="flex-1 md:flex-none px-3 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider rounded-lg text-center"
                      >
                        {t.close}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Tabbed Workspace */}
        <section ref={tabSectionRef} className="md:col-span-5 flex flex-col gap-6 scroll-mt-6">
          
          {/* Navigation Tab strip matching Artistic Flair aesthetic */}
          <div className="bg-white border border-[#EDEDED] rounded-xl p-1.5 flex flex-wrap gap-1 shadow-[0_2px_10px_rgba(0,0,0,0.015)] font-sans">
            <button 
              onClick={() => handleTabClick("visual")}
              className={`flex-1 min-w-[70px] text-[11px] font-bold uppercase tracking-wider py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === "visual" ? "bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/10" : "text-gray-500 hover:text-slate-800 hover:bg-[#F8F9FA]"}`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{t.addTab}</span>
            </button>
            <button 
              onClick={() => handleTabClick("snapshots")}
              className={`flex-1 min-w-[70px] text-[11px] font-bold uppercase tracking-wider py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === "snapshots" ? "bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/10" : "text-gray-500 hover:text-slate-800 hover:bg-[#F8F9FA]"}`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{t.snapshotsTab}</span>
            </button>
            <button 
              onClick={() => handleTabClick("analysis")}
              className={`flex-1 min-w-[70px] text-[11px] font-bold uppercase tracking-wider py-2 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === "analysis" ? "bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/10" : "text-gray-500 hover:text-slate-800 hover:bg-[#F8F9FA]"}`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>{t.analysisTab}</span>
            </button>
          </div>

          {/* TAB CONTENT: 1. FORMS & ELEMENT ADDITION */}
          {activeTab === "visual" && (
            <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-5 space-y-6 animate-fade-in">
              
              {/* Form 1: Add Node */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5 mb-3 border-b border-[#F0F0F0] pb-2">
                  <span className="p-1 bg-[#6C5CE7]/10 text-[#6C5CE7] rounded">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                  {t.createNodeTitle}
                </h3>
                
                <form onSubmit={handleAddNode} className="space-y-3 font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="col-span-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">{t.elementType}</label>
                      <select 
                        value={nodeForm.type}
                        onChange={(e) => setNodeForm(prev => ({ ...prev, type: e.target.value as NodeType }))}
                        className="w-full text-xs bg-white border border-[#EDEDED] py-1.5 px-2 rounded-lg focus:outline-none focus:border-[#6C5CE7]"
                      >
                        <option value="valor">{t.nodeTypeValor}</option>
                        <option value="interes">{t.nodeTypeInteres}</option>
                        <option value="proyecto">{t.nodeTypeProyecto}</option>
                        <option value="persona">{t.nodeTypePersona}</option>
                        <option value="etapa">{t.nodeTypeEtapa}</option>
                        <option value="otro">{t.nodeTypeOtro}</option>
                      </select>
                    </div>

                    <div className="col-span-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">{t.nodeLabel}</label>
                      <input 
                        type="text" 
                        placeholder={t.nodeLabelPlaceholder}
                        value={nodeForm.label}
                        onChange={(e) => setNodeForm(prev => ({ ...prev, label: e.target.value }))}
                        className="w-full text-xs border border-[#EDEDED] py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-[#6C5CE7]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">{t.nodeDesc}</label>
                    <textarea 
                      placeholder={t.nodeDescPlaceholder}
                      rows={2}
                      value={nodeForm.description}
                      onChange={(e) => setNodeForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full text-xs border border-[#EDEDED] py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-[#6C5CE7] resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">{t.tagsLabel}</label>
                    <input 
                      type="text" 
                      placeholder={t.tagsPlaceholder}
                      value={nodeForm.tags}
                      onChange={(e) => setNodeForm(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full text-xs border border-[#EDEDED] py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-[#6C5CE7]"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-[11px] font-bold uppercase tracking-wider py-2.5 rounded-lg transition-all shadow-md shadow-[#6C5CE7]/10"
                  >
                    {t.createNodeBtn}
                  </button>
                </form>
              </div>

              {/* Form 2: Add Edge */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5 mb-3 border-b border-[#F0F0F0] pb-2">
                  <span className="p-1 bg-[#6C5CE7]/10 text-[#6C5CE7] rounded">
                    <GitBranch className="h-3.5 w-3.5" />
                  </span>
                  {t.linkTitle}
                </h3>

                <form onSubmit={handleAddEdge} className="space-y-3 font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">{t.sourceNode}</label>
                      <select 
                        value={edgeForm.source_id}
                        onChange={(e) => setEdgeForm(prev => ({ ...prev, source_id: e.target.value }))}
                        className="w-full text-xs bg-white border border-[#EDEDED] py-1.5 px-2 rounded-lg focus:outline-none focus:border-[#6C5CE7]"
                        required
                      >
                        <option value="">{t.chooseNode}</option>
                        {nodes.map(n => (
                          <option key={n.id} value={n.id}>{n.label} ({getNodeTypeLabel(n.type, language).toUpperCase()})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">{t.targetNode}</label>
                      <select 
                        value={edgeForm.target_id}
                        onChange={(e) => setEdgeForm(prev => ({ ...prev, target_id: e.target.value }))}
                        className="w-full text-xs bg-white border border-[#EDEDED] py-1.5 px-2 rounded-lg focus:outline-none focus:border-[#6C5CE7]"
                        required
                      >
                        <option value="">{t.chooseNode}</option>
                        {nodes.map(n => (
                          <option key={n.id} value={n.id}>{n.label} ({getNodeTypeLabel(n.type, language).toUpperCase()})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">{t.relationType}</label>
                      <select 
                        value={edgeForm.relation}
                        onChange={(e) => setEdgeForm(prev => ({ ...prev, relation: e.target.value as RelationType }))}
                        className="w-full text-xs bg-white border border-[#EDEDED] py-1.5 px-2 rounded-lg focus:outline-none focus:border-[#6C5CE7]"
                      >
                        <option value="influye">{t.edgeRelationInfluye}</option>
                        <option value="contrasta">{t.edgeRelationContrasta}</option>
                        <option value="nacio_de">{t.edgeRelationNacioDe}</option>
                        <option value="alimenta">{t.edgeRelationAlimenta}</option>
                        <option value="bloquea">{t.edgeRelationBloquea}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500 block mb-1">{t.weightLabel} ({edgeForm.weight})</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" 
                          min="0.5" 
                          max="3.0" 
                          step="0.1" 
                          value={edgeForm.weight}
                          onChange={(e) => setEdgeForm(prev => ({ ...prev, weight: parseFloat(e.target.value) }))}
                          className="flex-1 h-1 bg-[#6C5CE7]/20 rounded-lg appearance-none cursor-pointer accent-[#6C5CE7]"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-[11px] font-bold uppercase tracking-wider py-2.5 rounded-lg transition-all shadow-md shadow-[#6C5CE7]/10"
                  >
                    {t.linkBtn}
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB CONTENT: 2. TIMELINE SNAPSHOTS COMPARATOR */}
          {activeTab === "snapshots" && (
            <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-5 space-y-6 animate-fade-in font-sans">
              
              {/* Snapshot Capturer */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5 mb-2 border-b border-[#F0F0F0] pb-2">
                  <Layers className="h-4 w-4 text-[#6C5CE7]" />
                  {t.recordStateTitle}
                </h3>
                <p className="text-[11px] text-gray-500 mb-3 font-sans">
                  {t.recordStateDesc}
                </p>

                <form onSubmit={handleCreateSnapshot} className="space-y-3 font-sans">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block mb-1">{t.explanNotes}</label>
                    <textarea 
                      placeholder={t.explanNotesPlaceholder}
                      rows={2}
                      value={snapshotForm.notes}
                      onChange={(e) => setSnapshotForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full text-xs border border-[#EDEDED] py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-[#6C5CE7] resize-none"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <input 
                        type="checkbox"
                        id="useAllNodesSnap"
                        checked={snapshotForm.useAll}
                        onChange={(e) => setSnapshotForm(prev => ({ ...prev, useAll: e.target.checked }))}
                        className="rounded accent-[#6C5CE7]"
                      />
                      <label htmlFor="useAllNodesSnap" className="text-xs text-gray-600 select-none">
                        {t.includeAllNodes}
                      </label>
                    </div>

                    {!snapshotForm.useAll && (
                      <div className="p-3 bg-[#F8F9FA] border border-[#EDEDED] rounded-lg max-h-[140px] overflow-y-auto">
                        <span className="text-[9px] font-mono uppercase text-gray-400 block mb-1.5">{t.chooseNodesToActivate}</span>
                        <div className="space-y-1.5">
                          {nodes.map(n => {
                            const isChecked = snapshotForm.customActiveIds.includes(n.id);
                            return (
                              <div 
                                key={n.id} 
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={() => toggleNodeInSnapshotCustom(n.id)}
                              >
                                <span className={`w-3.5 h-3.5 border rounded flex items-center justify-center text-[8px] text-white ${isChecked ? "bg-[#6C5CE7] border-[#6C5CE7]" : "bg-white border-gray-300"}`}>
                                  {isChecked && "✓"}
                                </span>
                                <span className="text-xs text-slate-700">{n.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-[11px] font-bold uppercase tracking-wider py-2.5 rounded-lg transition-all shadow-md shadow-[#6C5CE7]/10"
                  >
                    {t.captureSnapshotBtn}
                  </button>
                </form>
              </div>

              {/* Snapshot Comparator Panel */}
              {snapshots.length >= 2 && (
                <div className="bg-[#F8F9FA] p-4 border border-[#EDEDED] rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-2">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <GitCompare className="h-4 w-4 text-[#6C5CE7]" />
                      {t.chronoComparator}
                    </h4>
                    <span className="text-[10px] text-[#6C5CE7] px-2 py-0.5 bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 rounded font-medium">
                      {t.transitionAnalysis}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-1">{t.snapAPast}</label>
                      <select 
                        value={compSnapA}
                        onChange={(e) => setCompSnapA(e.target.value)}
                        className="w-full text-xs bg-white border border-[#EDEDED] py-1.5 px-2 rounded focus:outline-none"
                      >
                        {snapshots.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.notes.substring(0, 30)}...
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-1">{t.snapBFuture}</label>
                      <select 
                        value={compSnapB}
                        onChange={(e) => setCompSnapB(e.target.value)}
                        className="w-full text-xs bg-white border border-[#EDEDED] py-1.5 px-2 rounded focus:outline-none"
                      >
                        {snapshots.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.notes.substring(0, 30)}...
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {comparisonResults && (
                    <div className="space-y-2.5 text-xs text-slate-700">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 block mb-1">{t.appearedNodes}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {comparisonResults.appeared.length === 0 ? (
                            <span className="text-gray-400 italic text-[11px]">{t.none}</span>
                          ) : (
                            comparisonResults.appeared.map(n => (
                              <span key={n.id} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium">
                                {n.label}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-red-600 block mb-1">{t.disappearedNodes}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {comparisonResults.disappeared.length === 0 ? (
                            <span className="text-gray-400 italic text-[11px]">{t.none}</span>
                          ) : (
                            comparisonResults.disappeared.map(n => (
                              <span key={n.id} className="bg-red-50 text-red-600 border border-red-150 px-2 py-0.5 rounded text-[11px] font-medium">
                                {n.label}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-[#6C5CE7] block mb-1">{t.remainedNodes}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {comparisonResults.remained.length === 0 ? (
                            <span className="text-gray-400 italic text-[11px]">{t.none}</span>
                          ) : (
                            comparisonResults.remained.map(n => (
                              <span key={n.id} className="bg-[#6C5CE7]/10 text-[#6C5CE7] border border-[#6C5CE7]/20 px-2 py-0.5 rounded text-[11px] font-medium font-sans">
                                {n.label}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Snapshots collection list */}
              <div>
                <h4 className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-widest mb-3 border-b border-[#F0F0F0] pb-2">
                  {t.historicLog} ({snapshots.length})
                </h4>
                <div className="space-y-2">
                  {snapshots.map(snap => (
                    <div key={snap.id} className="p-3 bg-white border border-[#EDEDED] rounded-xl flex items-start gap-2 text-xs shadow-sm">
                      <Clock className="h-4 w-4 text-gray-450 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-mono text-[10px] text-gray-500">
                            {new Date(snap.date).toLocaleString(language === "es" ? "es-ES" : "en-US")}
                          </span>
                          <button 
                            onClick={() => handleDeleteSnapshot(snap.id)}
                            className="text-gray-400 hover:text-red-600"
                            title={language === "es" ? "Borrar snapshot" : "Delete snapshot"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-slate-700 font-medium mt-1 leading-relaxed">
                          {snap.notes}
                        </p>
                        <div className="mt-2 text-[10px] text-slate-500">
                          {t.activeNodesPrefix} <span className="font-semibold text-[#6C5CE7]">{snap.active_nodes.length}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {snapshots.length === 0 && (
                    <div className="text-center p-4 bg-[#F8F9FA] border border-dashed border-[#EDEDED] rounded-xl text-xs text-gray-400 italic">
                      {t.noSnapshotsRecorded}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT: 3. CENTRALITY & COMMUNITIES ANALYSIS */}
          {activeTab === "analysis" && (
            <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-5 space-y-6 animate-fade-in font-sans">
              <div className="flex items-center gap-1.5 border-b border-[#F0F0F0] pb-2">
                <Activity className="h-4 w-4 text-[#6C5CE7]" />
                <h3 className="text-sm font-semibold text-gray-800">
                  {t.analysisTitle}
                </h3>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center justify-between font-sans">
                  <span>{t.metricsTitle}</span>
                  <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wide normal-case">{t.nodesSortedByDegree}</span>
                </h4>

                <div className="overflow-x-auto rounded-xl border border-[#EDEDED]">
                  <table className="w-full text-left border-collapse text-xs font-sans">
                    <thead>
                      <tr className="border-b border-[#EDEDED] bg-[#F8F9FA] text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">{t.tableElement}</th>
                        <th className="py-2.5 px-3">{t.tableCategory}</th>
                        <th className="py-2.5 px-3 font-mono text-center">{t.tableDegree}</th>
                        <th className="py-2.5 px-3 font-mono text-center">{t.tableBetweenness}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0F0] bg-white">
                      {filteredNodesList
                        .map(n => ({
                          ...n,
                          deg: degreeCentralities[n.id] || 0,
                          btwn: betweennessCentralities[n.id] || 0
                        }))
                        .sort((a, b) => b.deg - a.deg)
                        .map(item => {
                          const colors = TYPE_COLORS[item.type];
                          return (
                            <tr key={item.id} className="hover:bg-[#F8F9FA]">
                              <td className="py-2.5 px-3 font-medium text-slate-800">{item.label}</td>
                              <td className="py-2.5 px-2">
                                <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${colors?.bg} ${colors?.border} ${colors?.text}`}>
                                  {getNodeTypeLabel(item.type, language)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[#6C5CE7] font-semibold text-center">{item.deg.toFixed(3)}</td>
                              <td className="py-2.5 px-3 font-mono text-[#6C5CE7] font-semibold text-center">{item.btwn.toFixed(3)}</td>
                            </tr>
                          );
                        })}
                      {filteredNodesList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-gray-400 italic">{t.noNodesLoaded}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Informative explanation matching readme */}
              <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-[#EDEDED] text-xs text-slate-600 leading-relaxed grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-bold text-gray-800 text-[11px] block font-sans uppercase tracking-wide mb-1 text-[#6C5CE7]">{t.degreeLabel}</span>
                  <p className="text-gray-500 text-[11px]">
                    {t.degreeDesc}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-gray-800 text-[11px] block font-sans uppercase tracking-wide mb-1 text-[#6C5CE7]">{t.betweennessLabel}</span>
                  <p className="text-gray-500 text-[11px]">
                    {t.betweennessDesc}
                  </p>
                </div>
              </div>

              {/* Communities list */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                  {t.cohesiveDimensions}
                </h4>
                <p className="text-[11px] text-gray-400 mb-3 leading-relaxed font-sans">
                  {t.cohesiveDimensionsDesc}
                </p>

                <div className="space-y-2">
                  {communities.map((c, idx) => {
                    // Match node labels for display
                    const labels = c.map(nid => nodes.find(n => n.id === nid)?.label).filter(Boolean);
                    
                    return (
                      <div key={idx} className="p-3 bg-white border border-[#EDEDED] rounded-xl space-y-1.5 shadow-sm">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 border-b border-[#F0F0F0] pb-1.5">
                          <Layers className="h-3.5 w-3.5 text-[#6C5CE7]" />
                          <span className="font-sans uppercase tracking-wider text-[11px]">{t.dimensionOfSelf} #{idx + 1}</span>
                          <span className="text-[10px] font-mono font-normal text-slate-400 ml-auto">{c.length} {language === "es" ? "elementos" : "items"}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {labels.map((label, lidx) => (
                            <span key={lidx} className="bg-[#F8F9FA] text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium border border-[#EDEDED]">
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {communities.length === 0 && (
                    <div className="text-center py-6 bg-[#F8F9FA] border border-[#EDEDED] rounded-xl text-xs text-gray-400 italic">{t.noCommunitiesDetected}</div>
                  )}
                </div>
              </div>

            </div>
          )}

        </section>

      </main>

      {/* ---------------------------------------------------- */}
      {/* Configuration & Export Modal Popover */}
      {/* ---------------------------------------------------- */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-[#EDEDED] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-[#F0F0F0] flex items-center justify-between bg-[#F8F9FA]">
              <div className="flex items-center gap-2">
                <Settings className="h-4.5 w-4.5 text-[#6C5CE7]" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide font-sans">
                  {t.configModalTitle}
                </h3>
              </div>
              <button 
                onClick={() => setIsConfigOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
              
              {/* SECTION: IDIOMA / LANGUAGE SELECTOR */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-[#F0F0F0] pb-1.5 flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-[#6C5CE7]" />
                  <span>Idioma / Language</span>
                </h4>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setLanguage("es")}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      language === "es" 
                        ? "bg-[#6C5CE7]/10 text-[#6C5CE7] border-[#6C5CE7] font-bold shadow-sm" 
                        : "bg-white hover:bg-[#F8F9FA] text-gray-600 border-[#E5E7EB]"
                    }`}
                  >
                    <span>Español</span>
                  </button>
                  <button
                    onClick={() => setLanguage("en")}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      language === "en" 
                        ? "bg-[#6C5CE7]/10 text-[#6C5CE7] border-[#6C5CE7] font-bold shadow-sm" 
                        : "bg-white hover:bg-[#F8F9FA] text-gray-600 border-[#E5E7EB]"
                    }`}
                  >
                    <span>English</span>
                  </button>
                </div>
              </div>

               {/* SECTION 1: ESTILOS Y PALETAS */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-[#F0F0F0] pb-1.5 flex items-center gap-1.5">
                  <Palette className="h-4 w-4 text-[#6C5CE7]" />
                  <span>{t.paletteTitle}</span>
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(["original", "nordic", "sunset", "vintage"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setExportPalette(p)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border capitalize transition-all cursor-pointer ${
                        exportPalette === p 
                          ? "bg-[#6C5CE7]/10 text-[#6C5CE7] border-[#6C5CE7] font-bold shadow-sm" 
                          : "bg-white hover:bg-[#F8F9FA] text-gray-600 border-[#E5E7EB]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                
                <p className="text-[11px] text-gray-400 italic">
                  * {t.paletteAdvice}
                </p>
              </div>

              {/* SECTION 2: VARIABLE MULTIPLIERS */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-[#F0F0F0] pb-1.5 flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-[#6C5CE7]" />
                  <span>{t.sliderTitle}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Slider 1: Node border penwidth */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">{t.sliderNodePenwidth}</span>
                      <span className="font-mono font-semibold text-[#6C5CE7]">{nodePenwidth.toFixed(1)}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="3.5" 
                      step="0.1" 
                      value={nodePenwidth} 
                      onChange={(e) => setNodePenwidth(parseFloat(e.target.value))}
                      className="w-full accent-[#6C5CE7] h-1 bg-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Slider 2: Edge penwidth */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">{t.sliderEdgePenwidth}</span>
                      <span className="font-mono font-semibold text-[#6C5CE7]">{edgePenwidth.toFixed(1)}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="3.5" 
                      step="0.1" 
                      value={edgePenwidth} 
                      onChange={(e) => setEdgePenwidth(parseFloat(e.target.value))}
                      className="w-full accent-[#6C5CE7] h-1 bg-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Slider 3: Node opacity */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">{t.sliderNodeOpacity}</span>
                      <span className="font-mono font-semibold text-[#6C5CE7]">{Math.round(nodeOpacity * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1.0" 
                      step="0.1" 
                      value={nodeOpacity} 
                      onChange={(e) => setNodeOpacity(parseFloat(e.target.value))}
                      className="w-full accent-[#6C5CE7] h-1 bg-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Slider 4: Edge opacity */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">{t.sliderEdgeOpacity}</span>
                      <span className="font-mono font-semibold text-[#6C5CE7]">{Math.round(edgeOpacity * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1.0" 
                      step="0.1" 
                      value={edgeOpacity} 
                      onChange={(e) => setEdgeOpacity(parseFloat(e.target.value))}
                      className="w-full accent-[#6C5CE7] h-1 bg-gray-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: EXPORTACIONES Y ANALISIS */}
              <div className="pt-4 border-t border-[#F0F0F0] space-y-4">
                <div className="flex flex-col gap-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-[#F0F0F0] pb-1.5 flex items-center gap-1.5">
                    <FileJson className="h-4 w-4 text-[#6C5CE7]" />
                    <span>{t.exportsTitle}</span>
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-sans pt-1">
                    {t.dataPortabilityDesc}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
                  {/* Export Button */}
                  <button
                    onClick={exportBackupJson}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#6C5CE7] hover:bg-[#5b4dbd] rounded-xl shadow-sm transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                    <span>{t.exportJsonBtn}</span>
                  </button>

                  {/* Import Button with Hidden File Input */}
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={importBackupJson}
                      accept=".json"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-sm transition-all cursor-pointer uppercase tracking-wider"
                    >
                      <Upload className="h-4 w-4 text-slate-500 shrink-0" />
                      <span>{t.importJsonBtn}</span>
                    </button>
                  </div>
                </div>

                {/* Informative advice for Python */}
                <div className="mt-4 bg-amber-50/85 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-amber-950 leading-relaxed font-sans">
                  <Zap className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-950 block text-[11px]">{t.howRenderLocal}</span>
                    <span className="text-[11px]">{t.renderLocalLabel1}</span>
                    <code className="block bg-amber-100 font-mono text-[10px] p-1.5 rounded text-amber-950 my-1">
                      python main.py load-graph mi_archivo.json
                    </code>
                    <span className="text-[11px]">{t.renderLocalLabel2}</span>
                    <div className="mt-2.5">
                      <a href="https://github.com/AnaCataVC/identity-map" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-[10px] font-bold tracking-wide uppercase">
                        <Github className="h-3.5 w-3.5" />
                        {t.githubBtn}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: DANGER ZONE (RESET DATA IN RED) */}
              <div className="pt-4 border-t border-[#F0F0F0]">
                <div className="p-4 bg-red-50/80 border border-red-150 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-red-800">
                    <Trash2 className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider font-sans">{t.dangerZoneTitle}</span>
                  </div>
                  <p className="text-[11px] text-red-700 font-sans leading-relaxed">
                    {t.dangerZoneAdvice}
                  </p>
                  
                  {showResetConfirm ? (
                    <div className="space-y-3 pt-1">
                      <p className="text-xs font-semibold text-red-700 font-sans">
                        {t.resetConfirm}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => {
                            setNodes(defaultNodes);
                            setEdges(defaultEdges);
                            setSnapshots(defaultSnapshots);
                            setIsConfigOpen(false);
                            setShowResetConfirm(false);
                            triggerSuccessMsg(t.alertRestored);
                          }}
                          className="flex-1 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 border border-red-600 rounded-lg shadow-sm transition-all text-center cursor-pointer uppercase tracking-wider"
                        >
                          {language === "es" ? "Sí, restaurar plantilla" : "Yes, restore template"}
                        </button>
                        <button
                          onClick={() => setShowResetConfirm(false)}
                          className="flex-1 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-sm transition-all text-center cursor-pointer uppercase tracking-wider"
                        >
                          {language === "es" ? "Cancelar" : "Cancel"}
                        </button>
                      </div>
                    </div>
                  ) : showClearConfirm ? (
                    <div className="space-y-3 pt-1">
                      <p className="text-xs font-semibold text-red-700 font-sans">
                        {t.clearConfirm}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => {
                            setNodes([]);
                            setEdges([]);
                            setSnapshots([]);
                            setIsConfigOpen(false);
                            setShowClearConfirm(false);
                            triggerSuccessMsg(t.alertCleared);
                          }}
                          className="flex-1 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 border border-red-600 rounded-lg shadow-sm transition-all text-center cursor-pointer uppercase tracking-wider"
                        >
                          {language === "es" ? "Sí, vaciar todo" : "Yes, clear everything"}
                        </button>
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          className="flex-1 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-sm transition-all text-center cursor-pointer uppercase tracking-wider"
                        >
                          {language === "es" ? "Cancelar" : "Cancel"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <button 
                        onClick={() => {
                          setShowResetConfirm(true);
                          setShowClearConfirm(false);
                        }}
                        className="flex-1 px-4 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-lg shadow-sm transition-all text-center cursor-pointer uppercase tracking-wider"
                      >
                        {t.dangerZoneResetBtn}
                      </button>
                      <button 
                        onClick={() => {
                          setShowClearConfirm(true);
                          setShowResetConfirm(false);
                        }}
                        className="flex-1 px-4 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-lg shadow-sm transition-all text-center cursor-pointer uppercase tracking-wider"
                      >
                        {t.dangerZoneClearBtn}
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#F8F9FA] border-t border-[#F0F0F0] flex justify-end">
              <button 
                onClick={() => setIsConfigOpen(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-[#6C5CE7] hover:bg-[#5B4BC4] border border-[#6C5CE7] rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {t.saveConfigBtn}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Styled Footer */}
      <footer className="bg-white border-t border-[#EDEDED] py-6 px-6 mt-12 text-center text-[10px] text-gray-400 font-mono tracking-wider">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="uppercase tracking-widest text-[#2D3436]/60">
            {t.footerProd}
          </div>
          <div className="text-gray-400">
            {t.footerAuthor}
          </div>
        </div>
      </footer>

    </div>
  );
}
