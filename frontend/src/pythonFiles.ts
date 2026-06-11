import { PythonFile } from "./types";

export const pythonFiles: PythonFile[] = [
  {
    name: "models.py",
    path: "identity_map/models.py",
    description: "Definición de esquemas de datos usando SQLModel para SQLite.",
    content: `from datetime import datetime
import json
from typing import List
from uuid import uuid4
from sqlmodel import SQLModel, Field

class Node(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    type: str  # valor, interes, proyecto, persona, etapa, otro
    label: str
    description: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    tags_raw: str = Field(default="[]", description="JSON list of tags")

    @property
    def tags(self) -> List[str]:
        try:
            return json.loads(self.tags_raw)
        except Exception:
            return []

    @tags.setter
    def tags(self, val: List[str]) -> None:
        self.tags_raw = json.dumps(val)

class Edge(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    source_id: str
    target_id: str
    relation: str  # influye, contrasta, nacio_de, alimenta, bloquea
    weight: float = Field(default=1.0)

class Snapshot(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    date: datetime = Field(default_factory=datetime.utcnow)
    active_nodes_raw: str = Field(default="[]", description="JSON list of active node IDs")
    notes: str

    @property
    def active_nodes(self) -> List[str]:
        try:
            return json.loads(self.active_nodes_raw)
        except Exception:
            return []

    @active_nodes.setter
    def active_nodes(self, val: List[str]) -> None:
        self.active_nodes_raw = json.dumps(val)
`
  },
  {
    name: "database.py",
    path: "identity_map/database.py",
    description: "Conexión a SQLite local, inicialización y operaciones CRUD con funciones de guardado/carga del grafo completo.",
    content: `import os
from typing import List, Optional
from sqlmodel import SQLModel, create_engine, Session, select
from .models import Node, Edge, Snapshot

DATABASE_FILE = "identity_map.db"
DATABASE_URL = f"sqlite:///{DATABASE_FILE}"

engine = create_engine(DATABASE_URL, echo=False)

def init_db() -> None:
    """Initializes the SQLite database using SQLModel."""
    SQLModel.metadata.create_all(engine)

def get_session() -> Session:
    """Returns a new database session."""
    return Session(engine)

# CRUD Helper functions for CLI use
def add_node_db(node: Node) -> Node:
    with get_session() as session:
        session.add(node)
        session.commit()
        session.refresh(node)
        return node

def get_nodes_db() -> List[Node]:
    with get_session() as session:
        statement = select(Node)
        return list(session.exec(statement).all())

def get_node_by_id_or_label(identifier: str) -> Optional[Node]:
    with get_session() as session:
        # Try finding by ID first
        node = session.get(Node, identifier)
        if node:
            return node
        # Try finding by label (case insensitive)
        statement = select(Node).where(Node.label == identifier)
        results = session.exec(statement).all()
        if results:
            return results[0]
        return None

def add_edge_db(edge: Edge) -> Edge:
    with get_session() as session:
        session.add(edge)
        session.commit()
        session.refresh(edge)
        return edge

def get_edges_db() -> List[Edge]:
    with get_session() as session:
        statement = select(Edge)
        return list(session.exec(statement).all())

def add_snapshot_db(snapshot: Snapshot) -> Snapshot:
    with get_session() as session:
        session.add(snapshot)
        session.commit()
        session.refresh(snapshot)
        return snapshot

def get_snapshots_db() -> List[Snapshot]:
    with get_session() as session:
        statement = select(Snapshot).order_by(Snapshot.date.asc())
        return list(session.exec(statement).all())

def get_snapshot_by_id(snapshot_id: str) -> Optional[Snapshot]:
    with get_session() as session:
        return session.get(Snapshot, snapshot_id)

def save_graph(nodes: List[Node], edges: List[Edge], snapshots: List[Snapshot]) -> None:
    """Persists all nodes, edges, and snapshots into the SQLite database, overwriting previous ones."""
    init_db()
    with get_session() as session:
        # Clear existing data safely by query to avoid constraint issues or syntax errors
        for n in session.exec(select(Node)).all():
            session.delete(n)
        for e in session.exec(select(Edge)).all():
            session.delete(e)
        for s in session.exec(select(Snapshot)).all():
            session.delete(s)
        session.commit()
        
        # Insert all new items
        for n in nodes:
            session.add(n)
        for e in edges:
            session.add(e)
        for s in snapshots:
            session.add(s)
        session.commit()

def load_graph() -> tuple[List[Node], List[Edge], List[Snapshot]]:
    """Loads and restores the complete state of the graph from the SQLite database."""
    init_db()
    with get_session() as session:
        nodes = list(session.exec(select(Node)).all())
        edges = list(session.exec(select(Edge)).all())
        snapshots = list(session.exec(select(Snapshot)).all())
        return nodes, edges, snapshots
`
  },
  {
    name: "analyzer.py",
    path: "identity_map/analyzer.py",
    description: "Análisis y cálculo de centralidad (degree, betweenness), comunidades, y comparador mejorado de pesos/aristas entre snapshots temporales.",
    content: `import networkx as nx
from typing import Dict, List, Set, Optional, Any
from .models import Node, Edge, Snapshot

def build_networkx_graph(nodes: List[Node], edges: List[Edge], active_nodes_filter: Optional[Set[str]] = None) -> nx.DiGraph:
    """Builds a NetworkX directed graph from node and edge models, optionally filtering by active nodes."""
    G = nx.DiGraph()
    
    # Filter nodes if a filter is provided
    filtered_nodes = nodes
    if active_nodes_filter is not None:
        filtered_nodes = [n for n in nodes if n.id in active_nodes_filter]
        
    active_ids = {n.id for n in filtered_nodes}
    
    for n in filtered_nodes:
        G.add_node(
            n.id, 
            label=n.label, 
            type=n.type, 
            description=n.description, 
            tags=n.tags
        )
        
    for e in edges:
        # Relational edges are only relevant if both source and target nodes are loaded in the current subgraph
        if e.source_id in active_ids and e.target_id in active_ids:
            G.add_edge(
                e.source_id, 
                e.target_id, 
                id=e.id, 
                relation=e.relation, 
                weight=e.weight
            )
            
    return G

def calculate_centralities(G: nx.DiGraph) -> Dict[str, Dict[str, float]]:
    """Calculates Degree and Betweenness centralities for each node in the network."""
    if len(G) == 0:
        return {}
        
    degree = nx.degree_centrality(G)
    try:
        betweenness = nx.betweenness_centrality(G, weight='weight', normalized=True)
    except Exception:
        betweenness = nx.betweenness_centrality(G, normalized=True)
        
    results = {}
    for node_id in G.nodes():
        results[node_id] = {
            "degree": float(degree.get(node_id, 0.0)),
            "betweenness": float(betweenness.get(node_id, 0.0))
        }
    return results

def detect_communities(G: nx.DiGraph) -> List[List[str]]:
    """Detects modular communities using networkx's greedy modularity community detection."""
    if len(G) == 0:
        return []
    undirected_G = G.to_undirected()
    try:
        from networkx.algorithms.community import greedy_modularity_communities
        communities = greedy_modularity_communities(undirected_G)
        return [list(c) for c in communities]
    except Exception:
        return [list(c) for c in nx.connected_components(undirected_G)]

def filter_subgraph(G: nx.DiGraph, node_type: Optional[str] = None, tag: Optional[str] = None) -> nx.DiGraph:
    """Generates a copied subgraph containing only the nodes matching the type and/or tag."""
    nodes_to_keep = []
    for node_id, data in G.nodes(data=True):
        match_type = True
        match_tag = True
        
        if node_type and data.get("type") != node_type:
            match_type = False
        if tag and tag not in data.get("tags", []):
            match_tag = False
            
        if match_type and match_tag:
            nodes_to_keep.append(node_id)
            
    return G.subgraph(nodes_to_keep).copy()

def compare_snapshots(s1: Snapshot, s2: Snapshot, all_nodes: List[Node], all_edges: Optional[List[Edge]] = None) -> Dict[str, Any]:
    """
    Compares two identity snapshots, mapping active nodes that appeared (added), disappeared (removed),
    and identifying nodes and edges with significant changes in their weights (centrality / importance).
    """
    nodes_dict = {n.id: n for n in all_nodes}
    
    set1 = set(s1.active_nodes)
    set2 = set(s2.active_nodes)
    
    appeared_ids = set2 - set1
    disappeared_ids = set1 - set2
    remained_ids = set1 & set2
    
    appeared = [{"id": nid, "label": nodes_dict[nid].label if nid in nodes_dict else nid} for nid in appeared_ids]
    disappeared = [{"id": nid, "label": nodes_dict[nid].label if nid in nodes_dict else nid} for nid in disappeared_ids]
    remained = [{"id": nid, "label": nodes_dict[nid].label if nid in nodes_dict else nid} for nid in remained_ids]
    
    significant_node_changes = []
    significant_edge_changes = []
    
    if all_edges:
        # Build NetworkX graphs for active states G1 and G2
        G1 = build_networkx_graph(all_nodes, all_edges, active_nodes_filter=set1)
        G2 = build_networkx_graph(all_nodes, all_edges, active_nodes_filter=set2)
        
        cent1 = calculate_centralities(G1)
        cent2 = calculate_centralities(G2)
        
        for nid in remained_ids:
            c1 = cent1.get(nid, {"degree": 0.0, "betweenness": 0.0})
            c2 = cent2.get(nid, {"degree": 0.0, "betweenness": 0.0})
            
            diff_deg = abs(c1["degree"] - c2["degree"])
            diff_btwn = abs(c1["betweenness"] - c2["betweenness"])
            
            if diff_deg > 0.01 or diff_btwn > 0.01:
                significant_node_changes.append({
                    "id": nid,
                    "label": nodes_dict[nid].label if nid in nodes_dict else nid,
                    "old_degree": c1["degree"],
                    "new_degree": c2["degree"],
                    "old_betweenness": c1["betweenness"],
                    "new_betweenness": c2["betweenness"],
                    "diff_degree": diff_deg,
                    "diff_betweenness": diff_btwn
                })
        
        for edge in all_edges:
            active_in_s1 = edge.source_id in set1 and edge.target_id in set1
            active_in_s2 = edge.source_id in set2 and edge.target_id in set2
            
            src_lbl = nodes_dict[edge.source_id].label if edge.source_id in nodes_dict else edge.source_id
            tgt_lbl = nodes_dict[edge.target_id].label if edge.target_id in nodes_dict else edge.target_id
            
            if active_in_s1 != active_in_s2:
                significant_edge_changes.append({
                    "id": edge.id,
                    "source_label": src_lbl,
                    "target_label": tgt_lbl,
                    "relation": edge.relation,
                    "old_weight": edge.weight if active_in_s1 else 0.0,
                    "new_weight": edge.weight if active_in_s2 else 0.0,
                    "change_type": "activada" if active_in_s2 else "desactivada"
                })
                
    return {
        "snapshot1_id": s1.id,
        "snapshot1_date": s1.date.isoformat() if s1.date else "",
        "snapshot1_notes": s1.notes,
        "snapshot2_id": s2.id,
        "snapshot2_date": s2.date.isoformat() if s2.date else "",
        "snapshot2_notes": s2.notes,
        "appeared": appeared,
        "disappeared": disappeared,
        "remained": remained,
        "significant_node_changes": significant_node_changes,
        "significant_edge_changes": significant_edge_changes
    }
`
  },
  {
    name: "exporter.py",
    path: "identity_map/exporter.py",
    description: "Exportador de grafos personalizable con soporte para paletas pastel técnicas, grosor de línea y opacidades.",
    content: `import os
import json
from typing import Dict, List, Optional, Any
from .models import Node, Edge

STYLE_CONFIG_FILE = "identity_map/style_config.json"

PALETTES: Dict[str, Dict[str, Dict[str, str]]] = {
    "original": {
        "fill": {
            "valor": "#D1E8E2",
            "interes": "#FFD8CC",
            "proyecto": "#D1F9D1",
            "persona": "#E2D1F9",
            "etapa": "#F7E1AD",
            "otro": "#F5F4F0"
        },
        "border": {
            "valor": "#A8CFC5",
            "interes": "#FFB29E",
            "proyecto": "#A9DFBF",
            "persona": "#BB8FCE",
            "etapa": "#F4D03F",
            "otro": "#DCDAD4"
        },
        "text": {
            "valor": "#1E564F",
            "interes": "#B83E1D",
            "proyecto": "#1E8449",
            "persona": "#6C5CE7",
            "etapa": "#7D6608",
            "otro": "#4A5568"
        }
    },
    "nordic": {
        "fill": {
            "valor": "#E3EFF2",
            "interes": "#F5E6E8",
            "proyecto": "#E4F0EC",
            "persona": "#ECE5F0",
            "etapa": "#F5ECE1",
            "otro": "#F1F1F1"
        },
        "border": {
            "valor": "#ADC3C7",
            "interes": "#D6A3A4",
            "proyecto": "#A9BCB6",
            "persona": "#B9A3B5",
            "etapa": "#D1B292",
            "otro": "#CCCCCC"
        },
        "text": {
            "valor": "#2C3E50",
            "interes": "#C0392B",
            "proyecto": "#27AE60",
            "persona": "#8E44AD",
            "etapa": "#D35400",
            "otro": "#7F8C8D"
        }
    },
    "sunset": {
        "fill": {
            "valor": "#FFEFEB",
            "interes": "#FFF5EB",
            "proyecto": "#EBFDF9",
            "persona": "#F6EBFF",
            "etapa": "#FFFCEB",
            "otro": "#FBFBF9"
        },
        "border": {
            "valor": "#FFA07A",
            "interes": "#FFD700",
            "proyecto": "#20B2AA",
            "persona": "#DA70D6",
            "etapa": "#F0E68C",
            "otro": "#D3D3D3"
        },
        "text": {
            "valor": "#8B0000",
            "interes": "#D2691E",
            "proyecto": "#008080",
            "persona": "#4B0082",
            "etapa": "#8B8000",
            "otro": "#555555"
        }
    },
    "vintage": {
        "fill": {
            "valor": "#DCE2C8",
            "interes": "#F5DEC3",
            "proyecto": "#E9D2C4",
            "persona": "#D1C3C0",
            "etapa": "#E7E2CE",
            "otro": "#E5E5E5"
        },
        "border": {
            "valor": "#AFB993",
            "interes": "#DEB887",
            "proyecto": "#CD853F",
            "persona": "#BC8F8F",
            "etapa": "#C2B280",
            "otro": "#BEBEBE"
        },
        "text": {
            "valor": "#3B4F2A",
            "interes": "#5C4033",
            "proyecto": "#4A2E1B",
            "persona": "#4A3B32",
            "etapa": "#4C4A3A",
            "otro": "#404040"
        }
    }
}

RELATION_STYLES: Dict[str, dict] = {
    "influye": {"color": "#64748b", "style": "solid", "arrowhead": "vee"},
    "contrasta": {"color": "#94a3b8", "style": "dashed", "arrowhead": "dotvee"},
    "nacio_de": {"color": "#64748b", "style": "dotted", "arrowhead": "empty"},
    "alimenta": {"color": "#6C5CE7", "style": "solid", "arrowhead": "normal"},
    "bloquea": {"color": "#ef4444", "style": "solid", "arrowhead": "tee"}
}

def load_style_config() -> Dict[str, Any]:
    default_config = {
        "node_penwidth": 1.2,
        "edge_penwidth": 1.2,
        "node_opacity": 1.0,
        "edge_opacity": 0.8,
        "active_palette": "original",
        "custom_colors": {}
    }
    if os.path.exists(STYLE_CONFIG_FILE):
        try:
            with open(STYLE_CONFIG_FILE, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                for k, v in loaded.items():
                    default_config[k] = v
        except Exception:
            pass
    return default_config

def save_style_config(config: Dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(STYLE_CONFIG_FILE), exist_ok=True)
    try:
        with open(STYLE_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=4)
    except Exception:
        pass

def apply_opacity_to_hex(hex_color: str, opacity: float) -> str:
    opacity = max(0.0, min(1.0, opacity))
    alpha_int = int(opacity * 255)
    alpha_hex = f"{alpha_int:02X}"
    return f"{hex_color[:7]}{alpha_hex}"

def generate_dot(nodes: List[Node], edges: List[Edge], style_attrs: Optional[Dict[str, Any]] = None) -> str:
    config = load_style_config()
    if style_attrs:
        config.update(style_attrs)
        
    palette_name = config.get("active_palette", "original")
    palette = PALETTES.get(palette_name, PALETTES["original"])
    custom_colors = config.get("custom_colors", {})
    
    node_penwidth = config.get("node_penwidth", 1.2)
    edge_penwidth = config.get("edge_penwidth", 1.2)
    node_opacity = config.get("node_opacity", 1.0)
    edge_opacity = config.get("edge_opacity", 0.8)
    
    lines = [
        "digraph G {",
        "    bgcolor=\\"#FDFCF8\\";",
        "    rankdir=LR;",
        f"    node [fontname=\\"Helvetica,Arial,sans-serif\\", fontsize=10, shape=box, style=\\"filled,rounded\\", penwidth={node_penwidth}];",
        f"    edge [fontname=\\"Helvetica,Arial,sans-serif\\", fontsize=8, penwidth={edge_penwidth}, color=\\"#64748b\\"];",
        ""
    ]
    
    active_ids = {n.id for n in nodes}
    for n in nodes:
        node_type = n.type
        fill_base = custom_colors.get("fill", {}).get(node_type) or palette["fill"].get(node_type, palette["fill"].get("otro", "#F5F4F0"))
        border_base = custom_colors.get("border", {}).get(node_type) or palette["border"].get(node_type, palette["border"].get("otro", "#DCDAD4"))
        text_base = custom_colors.get("text", {}).get(node_type) or palette["text"].get(node_type, palette["text"].get("otro", "#4A5568"))
        
        fillcolor = apply_opacity_to_hex(fill_base, node_opacity)
        color = apply_opacity_to_hex(border_base, node_opacity)
        text_color = apply_opacity_to_hex(text_base, 1.0)
        
        label_text = f"{n.label}\\\\n({n.type.upper()})"
        lines.append(f"    \\"{n.id}\\" [label=\\"{label_text}\\", fillcolor=\\"{fillcolor}\\", color=\\"{color}\\", fontcolor=\\"{text_color}\\", tooltip=\\"{n.description}\\"];")
        
    lines.append("")
    for e in edges:
        if e.source_id in active_ids and e.target_id in active_ids:
            edge_style_attrs = RELATION_STYLES.get(e.relation, {"color": "#64748b", "style": "solid", "arrowhead": "vee"})
            color_base = edge_style_attrs["color"]
            style = edge_style_attrs["style"]
            arrowhead = edge_style_attrs["arrowhead"]
            
            color = apply_opacity_to_hex(color_base, edge_opacity)
            label = f"{e.relation} (w={e.weight})" if e.weight != 1.0 else e.relation
            lines.append(f"    \\"{e.source_id}\\" -> \\"{e.target_id}\\" [label=\\"{label}\\", color=\\"{color}\\", style=\\"{style}\\", arrowhead=\\"{arrowhead}\\"];")
            
    lines.append("}")
    return "\\n".join(lines)

def export_graph_to_files(nodes: List[Node], edges: List[Edge], base_filepath: str, style_attrs: Optional[Dict[str, Any]] = None) -> tuple[str, Optional[str]]:
    dot_content = generate_dot(nodes, edges, style_attrs)
    dot_path = f"{base_filepath}.dot"
    with open(dot_path, "w", encoding="utf-8") as f:
        f.write(dot_content)
        
    svg_path = f"{base_filepath}.svg"
    try:
        import graphviz
        src = graphviz.Source(dot_content)
        src.render(outfile=svg_path, format="svg", cleanup=True)
    except Exception:
        svg_path = None
    return dot_path, svg_path
`
  },
  {
    name: "cli.py",
    path: "identity_map/cli.py",
    description: "Comandos CLI intuitivos e interactivos implementados con Typer con soporte para comparador temporal de snapshots, configuraciones SVG y guardado del grafo completo.",
    content: `import typer
from datetime import datetime
from typing import List, Optional
import json
import os
from uuid import uuid4

from .models import Node, Edge, Snapshot
from .database import (
    init_db, add_node_db, get_nodes_db, get_node_by_id_or_label,
    add_edge_db, get_edges_db, add_snapshot_db, get_snapshots_db,
    get_snapshot_by_id, save_graph, load_graph
)
from .analyzer import (
    build_networkx_graph, calculate_centralities, detect_communities,
    compare_snapshots as run_snapshot_comparison
)
from .exporter import export_graph_to_files

app = typer.Typer(
    help="Identity Map CLI - Herramienta para modelar tu identidad como un grafo temporal con estética pastel técnica."
)

try:
    from rich.console import Console
    from rich.table import Table
    from rich import print as rprint
    console = Console()
    HAS_RICH = True
except ImportError:
    HAS_RICH = False

def show_table(headers: List[str], rows: List[List[str]], title: str = "Tabla") -> None:
    if HAS_RICH:
        table = Table(title=title, show_header=True, header_style="bold cyan")
        for h in headers:
            table.add_column(h)
        for r in rows:
            table.add_row(*r)
        console.print(table)
    else:
        print(f"\\n=== {title} ===")
        col_widths = [max(len(str(val)) for val in col) for col in zip(*( [headers] + rows ))]
        header_line = " | ".join(f"{h:<{w}}" for h, w in zip(headers, col_widths))
        print(header_line)
        print("-" * len(header_line))
        for r in rows:
            print(" | ".join(f"{str(cell):<{w}}" for cell, w in zip(r, col_widths)))
        print()

@app.command("init")
def database_init() -> None:
    init_db()
    msg = "Base de datos inicializada correctamente (identity_map.db)."
    if HAS_RICH:
        rprint(f"[green]✓[/green] {msg}")
    else:
        print(f"✓ {msg}")

@app.command("add-node")
def add_node(
    type: str = typer.Option(..., "--type", "-t", help="Tipo de elemento: valor, interes, proyecto, persona, etapa, otro"),
    label: str = typer.Option(..., "--label", "-l", help="Contenido/etiqueta corta del elemento de identidad"),
    description: str = typer.Option("", "--description", "-d", help="Descripción larga o notas explicativas"),
    tags_csv: str = typer.Option("", "--tags", help="Tags o etiquetas adicionales separadas por comas")
) -> None:
    init_db()
    valid_types = {"valor", "interes", "proyecto", "persona", "etapa", "otro"}
    if type.lower() not in valid_types:
        typer.echo(f"Error: Tipo '{type}' inválido. Debe ser uno de {list(valid_types)}")
        raise typer.Exit(code=1)
        
    tags = [t.strip() for t in tags_csv.split(",") if t.strip()] if tags_csv else []
    node = Node(
        id=str(uuid4()),
        type=type.lower(),
        label=label,
        description=description,
        created_at=datetime.utcnow()
    )
    node.tags = tags
    added_node = add_node_db(node)
    msg = f"Nodo agregado exitosamente: '{added_node.label}' ({added_node.type.upper()}) [ID: {added_node.id}]"
    if HAS_RICH:
        rprint(f"[green]✓[/green] {msg}")
    else:
        print(f"✓ {msg}")

@app.command("add-edge")
def add_edge(
    source: str = typer.Option(..., "--source", "-s", help="ID o label del nodo de origen"),
    target: str = typer.Option(..., "--target", "-t", help="ID o label del nodo de destino"),
    relation: str = typer.Option(..., "--relation", "-r", help="Tipo de relación: influye, contrasta, nacio_de, alimenta, bloquea"),
    weight: float = typer.Option(1.0, "--weight", "-w", help="Fuerza o peso asignado a la relación")
) -> None:
    init_db()
    valid_relations = {"influye", "contrasta", "nacio_de", "alimenta", "bloquea"}
    if relation.lower() not in valid_relations:
        typer.echo(f"Error: Relación '{relation}' inválida. Debe ser una de {list(valid_relations)}")
        raise typer.Exit(code=1)
        
    node_source = get_node_by_id_or_label(source)
    node_target = get_node_by_id_or_label(target)
    
    if not node_source or not node_target:
        typer.echo("Error: Nodos especificados no encontrados.")
        raise typer.Exit(code=1)
        
    edge = Edge(
        id=str(uuid4()),
        source_id=node_source.id,
        target_id=node_target.id,
        relation=relation.lower(),
        weight=weight
    )
    added_edge = add_edge_db(edge)
    msg = f"Relación creada: ({node_source.label}) --[{added_edge.relation} (w={added_edge.weight})]--> ({node_target.label})"
    if HAS_RICH:
        rprint(f"[green]✓[/green] {msg}")
    else:
        print(f"✓ {msg}")

@app.command("list-nodes")
def list_nodes() -> None:
    init_db()
    nodes = get_nodes_db()
    if not nodes:
        typer.echo("No hay nodos creados aún.")
        return
    headers = ["ID", "Tipo", "Etiqueta", "Descripción", "Tags", "Fecha Creación"]
    rows = []
    for n in nodes:
        tags_str = ", ".join(n.tags) if n.tags else "-"
        created_str = n.created_at.strftime("%Y-%m-%d %H:%M") if n.created_at else "-"
        rows.append([n.id[:8] + "..", n.type.upper(), n.label, n.description or "-", tags_str, created_str])
    show_table(headers, rows, "Elementos de Identidad (Nodos)")

@app.command("list-edges")
def list_edges() -> None:
    init_db()
    edges = get_edges_db()
    nodes = get_nodes_db()
    if not edges:
        typer.echo("No hay relaciones creadas aún.")
        return
    nodes_map = {n.id: n.label for n in nodes}
    headers = ["ID", "Origen (Source)", "Relación", "Destino (Target)", "Peso (Weight)"]
    rows = []
    for e in edges:
        src_label = nodes_map.get(e.source_id, e.source_id[:6])
        tgt_label = nodes_map.get(e.target_id, e.target_id[:6])
        rows.append([e.id[:8] + "..", src_label, e.relation.upper(), tgt_label, str(e.weight)])
    show_table(headers, rows, "Vínculos de Identidad (Relaciones)")

@app.command("create-snapshot")
def create_snapshot(
    notes: str = typer.Option(..., "--notes", "-n", help="Notas explicativas de tu identidad hoy"),
    active_nodes_csv: str = typer.Option("", "--nodes", help="Nodes activos separados por comas")
) -> None:
    init_db()
    all_nodes = get_nodes_db()
    active_ids = []
    if active_nodes_csv:
        identifiers = [i.strip() for i in active_nodes_csv.split(",") if i.strip()]
        for ident in identifiers:
            node = get_node_by_id_or_label(ident)
            if node:
                active_ids.append(node.id)
    else:
        active_ids = [n.id for n in all_nodes]
        
    snapshot = Snapshot(id=str(uuid4()), date=datetime.utcnow(), notes=notes)
    snapshot.active_nodes = active_ids
    added_snap = add_snapshot_db(snapshot)
    msg = f"Snapshot creado correctamente [ID: {added_snap.id}] con {len(active_ids)} nodos activos."
    if HAS_RICH:
        rprint(f"[green]✓[/green] {msg}")
    else:
        print(f"✓ {msg}")

@app.command("compare-snapshots")
def compare_snapshots(
    snap1: str = typer.Argument(..., help="ID o prefijo del primer snapshot"),
    snap2: str = typer.Argument(..., help="ID o prefijo del segundo snapshot")
) -> None:
    """Compara dos snapshots revelando transiciones, nodos aparecidos, desaparecidos, retenidos y cambios en sus centralidades/pesos."""
    init_db()
    all_snaps = get_snapshots_db()
    s1 = next((s for s in all_snaps if s.id.startswith(snap1)), None)
    s2 = next((s for s in all_snaps if s.id.startswith(snap2)), None)
    if not s1 or not s2:
        typer.echo("Error: Uno o ambos de los snapshots especificados no pudieron encontrarse.")
        raise typer.Exit(code=1)
    all_nodes = get_nodes_db()
    edges = get_edges_db()
    comp = run_snapshot_comparison(s1, s2, all_nodes, edges)
    
    print(f"\\n================ COMPARACIÓN ENTRE SNAPSHOTS ================")
    print(f"Snapshot 1: {comp['snapshot1_date']} | Notas: {comp['snapshot1_notes']}")
    print(f"Snapshot 2: {comp['snapshot2_date']} | Notas: {comp['snapshot2_notes']}")
    print("-" * 65)
    appeared_labels = [item["label"] for item in comp["appeared"]]
    print(f"▲ Nodos Añadidos / Activados ({len(appeared_labels)}): {', '.join(appeared_labels) if appeared_labels else 'Ninguno'}")
    disappeared_labels = [item["label"] for item in comp["disappeared"]]
    print(f"▼ Nodos Eliminados / Desactivados ({len(disappeared_labels)}): {', '.join(disappeared_labels) if disappeared_labels else 'Ninguno'}")
    remained_labels = [item["label"] for item in comp["remained"]]
    print(f"● Nodos Retenidos ({len(remained_labels)}): {', '.join(remained_labels) if remained_labels else 'Ninguno'}")
    
    node_changes = comp.get("significant_node_changes", [])
    print(f"\\n⚡ Cambios Significativos en Pesos de Nodos (Centralidad) ({len(node_changes)}):")
    if node_changes:
        for nc in node_changes:
            print(f"  • {nc['label']}: Grado {nc['old_degree']:.3f} -> {nc['new_degree']:.3f} | Intermediación {nc['old_betweenness']:.3f} -> {nc['new_betweenness']:.3f}")
    else:
        print("  Ninguno")
        
    edge_changes = comp.get("significant_edge_changes", [])
    print(f"🔗 Cambios en las Relaciones de Identidad (Aristas) ({len(edge_changes)}):")
    if edge_changes:
        for ec in edge_changes:
            print(f"  • ({ec['source_label']}) --[{ec['relation']}]--> ({ec['target_label']}): Peso efectivo {ec['old_weight']:.1f} -> {ec['new_weight']:.1f} ({ec['change_type'].upper()})")
    else:
        print("  Ninguno")
    print("=" * 65)

@app.command("export-graph")
def export_graph(
    output: str = typer.Option("identity_pastel", "--output", "-o", help="Nombre base del archivo de salida (sin extensión)"),
    snapshot_id: Optional[str] = typer.Option(None, "--snapshot", "-s", help="Filtrar por/snapshot específico"),
    palette: str = typer.Option("original", "--palette", "-p", help="Paleta pastel: original, nordic, sunset, vintage"),
    node_penwidth: float = typer.Option(1.2, "--node-penwidth", help="Grosor de línea para el contorno de nodos"),
    edge_penwidth: float = typer.Option(1.2, "--edge-penwidth", help="Grosor de línea para relaciones (aristas)"),
    node_opacity: float = typer.Option(1.0, "--node-opacity", help="Opacidad de nodos (0.0 a 1.0)"),
    edge_opacity: float = typer.Option(0.8, "--edge-opacity", help="Opacidad de relaciones (0.0 a 1.0)"),
    save_style: bool = typer.Option(False, "--save-style", help="Guardar esta configuración estilística como la predeterminada")
) -> None:
    init_db()
    nodes = get_nodes_db()
    edges = get_edges_db()
    if not nodes:
        typer.echo("Error: Grafo vacío.")
        raise typer.Exit(code=1)
        
    style_attrs = {
        "active_palette": palette,
        "node_penwidth": node_penwidth,
        "edge_penwidth": edge_penwidth,
        "node_opacity": node_opacity,
        "edge_opacity": edge_opacity
    }
    if save_style:
        from .exporter import save_style_config
        save_style_config(style_attrs)
        msg_style = "Configuración estática de estilo guardada correctamente como predeterminada."
        if HAS_RICH:
            rprint(f"[green]✓[/green] {msg_style}")
        else:
            print(f"✓ {msg_style}")
        
    active_nodes_filter = None
    if snapshot_id:
        all_snaps = get_snapshots_db()
        snap = next((s for s in all_snaps if s.id.startswith(snapshot_id)), None)
        if not snap:
            typer.echo(f"Error: Snapshot no encontrado.")
            raise typer.Exit(code=1)
        active_nodes_filter = set(snap.active_nodes)
        
    G = build_networkx_graph(nodes, edges, active_nodes_filter=active_nodes_filter)
    centralities = calculate_centralities(G)
    communities = detect_communities(G)
    nodes_to_export = [n for n in nodes if n.id in G.nodes] if active_nodes_filter else nodes
    
    dot_path, svg_path = export_graph_to_files(nodes_to_export, edges, output, style_attrs=style_attrs)
    
    print(f"\\n⚡ ANÁLISIS DE GRAFO DE IDENTIDAD (Total Nodos: {len(G.nodes)}, Relaciones: {len(G.edges)})")
    sorted_by_degree = sorted(G.nodes(data=True), key=lambda x: centralities.get(x[0], {}).get("degree", 0.0), reverse=True)
    headers_ana = ["Elemento de Identidad", "Tipo", "Centralidad Grado", "Centralidad Intermediación"]
    rows_ana = []
    for nid, data in sorted_by_degree[:6]:
        deg = f"{centralities[nid]['degree']:.3f}"
        btwn = f"{centralities[nid]['betweenness']:.3f}"
        rows_ana.append([data.get("label", nid), data.get("type", "").upper(), deg, btwn])
    show_table(headers_ana, rows_ana, "Elementos Centrales de tu Identidad")
    
    print("👥 COMUNIDADES DETECTADAS (Dimensiones cohesivas de tu Yo):")
    for idx, c_nodes in enumerate(communities):
        labels = [G.nodes[nid].get("label", nid) for nid in c_nodes]
        print(f" Comunidad #{idx+1}: {', '.join(labels)}")
        
    print(f"\\n📄 Archivo DOT exportado en: {dot_path}")
    if svg_path:
        print(f"🎨 Visualización SVG renderizada exitosamente en: {svg_path} (Aesthetic Pastel Technical)")

@app.command("save-graph")
def save_graph_cli(
    filepath: str = typer.Argument("identity_backup.json", help="Ruta del archivo JSON donde guardar el grafo completo")
) -> None:
    """Exporta el estado completo de la base de datos (nodos, aristas, snapshots) a un archivo JSON."""
    init_db()
    nodes, edges, snapshots = load_graph()
    data = {
        "nodes": [n.dict() for n in nodes],
        "edges": [e.dict() for e in edges],
        "snapshots": [s.dict() for s in snapshots]
    }
    class DateTimeEncoder(json.JSONEncoder):
        def default(self, obj):
            if hasattr(obj, "isoformat"):
                return obj.isoformat()
            return super().default(obj)
    try:
        os.makedirs(os.path.dirname(os.path.abspath(filepath)) or ".", exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, cls=DateTimeEncoder)
        msg_bk = f"Grafo guardado exitosamente en el archivo JSON: {filepath}"
        if HAS_RICH:
            rprint(f"[green]✓[/green] {msg_bk}")
        else:
            print(f"✓ {msg_bk}")
    except Exception as e:
        typer.echo(f"Error al guardar el grafo en JSON: {str(e)}")

@app.command("load-graph")
def load_graph_cli(
    filepath: str = typer.Argument("identity_backup.json", help="Ruta del archivo JSON desde donde cargar el grafo completo")
) -> None:
    """Restaura el estado completo del grafo (nodos, aristas, snapshots) desde un archivo JSON, sobrescribiendo la BD."""
    init_db()
    if not os.path.exists(filepath):
        typer.echo(f"Error: El archivo '{filepath}' no existe.")
        raise typer.Exit(code=1)
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        nodes = []
        for n_data in data.get("nodes", []):
            if "created_at" in n_data and n_data["created_at"]:
                created_str = n_data["created_at"].replace("Z", "+00:00")
                n_data["created_at"] = datetime.fromisoformat(created_str)
            nodes.append(Node(**n_data))
        edges = []
        for e_data in data.get("edges", []):
            edges.append(Edge(**e_data))
        snapshots = []
        for s_data in data.get("snapshots", []):
            if "date" in s_data and s_data["date"]:
                date_str = s_data["date"].replace("Z", "+00:00")
                s_data["date"] = datetime.fromisoformat(date_str)
            snapshots.append(Snapshot(**s_data))
        save_graph(nodes, edges, snapshots)
        msg_ld = f"Grafo cargado y restaurado exitosamente en la base de datos SQLite desde: {filepath}"
        if HAS_RICH:
            rprint(f"[green]✓[/green] {msg_ld}")
        else:
            print(f"✓ {msg_ld}")
    except Exception as e:
        typer.echo(f"Error al cargar el grafo: {str(e)}")
`
  },
  {
    name: "main.py",
    path: "identity_map/main.py",
    description: "Script de entrada ejecutable.",
    content: `"""
Entrypoint for the Identity Map CLI tool.
Simply imports the Typer application and executes it.
"""
from .cli import app

if __name__ == "__main__":
    app()
`
  },
  {
    name: "requirements.txt",
    path: "identity_map/requirements.txt",
    description: "Lista de dependencias requeridas para ejecutar el proyecto en Python.",
    content: `sqlmodel>=0.0.14
networkx>=3.0
typer[all]>=0.9.0
graphviz>=0.20
rich>=13.0.0
`
  }
];
