export type NodeType = "valor" | "interes" | "proyecto" | "persona" | "etapa" | "otro";

export interface IdentityNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  created_at: string; // ISO string
  tags: string[];
}

export type RelationType = "influye" | "contrasta" | "nacio_de" | "alimenta" | "bloquea";

export interface IdentityEdge {
  id: string;
  source_id: string;
  target_id: string;
  relation: RelationType;
  weight: number;
}

export interface IdentitySnapshot {
  id: string;
  date: string; // ISO string
  active_nodes: string[]; // List of node IDs
  notes: string;
}

export interface PythonFile {
  name: string;
  path: string;
  description: string;
  content: string;
}
