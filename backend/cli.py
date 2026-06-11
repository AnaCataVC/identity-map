import typer
from datetime import datetime
from typing import List, Optional
import json
from uuid import uuid4

# Import database, models & core modules
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

# Attempt to import rich for beautiful tabular terminal outputs
try:
    from rich.console import Console
    from rich.table import Table
    from rich import print as rprint
    console = Console()
    HAS_RICH = True
except ImportError:
    HAS_RICH = False

def show_table(headers: List[str], rows: List[List[str]], title: str = "Tabla") -> None:
    """Helper to display visual tables, falling back to simple format if 'rich' is missing."""
    if HAS_RICH:
        table = Table(title=title, show_header=True, header_style="bold cyan")
        for h in headers:
            table.add_column(h)
        for r in rows:
            table.add_row(*r)
        console.print(table)
    else:
        print(f"\n=== {title} ===")
        # Basic formatting
        col_widths = [max(len(str(val)) for val in col) for col in zip(*( [headers] + rows ))]
        header_line = " | ".join(f"{h:<{w}}" for h, w in zip(headers, col_widths))
        print(header_line)
        print("-" * len(header_line))
        for r in rows:
            print(" | ".join(f"{str(cell):<{w}}" for cell, w in zip(r, col_widths)))
        print()

@app.command("init")
def database_init() -> None:
    """Inicializa la base de datos local SQLite."""
    init_db()
    msg = "Base de datos inicializada correctamente (identity_map.db)."
    if HAS_RICH:
        rprint(f"[green]✓[/green] {msg}")
    else:
        print(f"✓ {msg}")

@app.command("add-node")
def add_node(
    type: str = typer.Option(
        ..., "--type", "-t", 
        help="Tipo de elemento: valor, interes, proyecto, persona, etapa, otro"
    ),
    label: str = typer.Option(..., "--label", "-l", help="Contenido/etiqueta corta del elemento de identidad"),
    description: str = typer.Option("", "--description", "-d", help="Descripción larga o notas explicativas"),
    tags_csv: str = typer.Option("", "--tags", help="Tags o etiquetas adicionales separadas por comas")
) -> None:
    """Agrega un nuevo elemento de identidad (nodo) al grafo."""
    # Ensure database is initialized
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
    node.tags = tags  # uses setter to serialize tags_raw
    
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
    relation: str = typer.Option(
        ..., "--relation", "-r",
        help="Tipo de relación: influye, contrasta, nacio_de, alimenta, bloquea"
    ),
    weight: float = typer.Option(1.0, "--weight", "-w", help="Fuerza o peso asignado a la relación (por defecto 1.0)")
) -> None:
    """Establece una relación dirigida (arista) entre dos elementos de identidad."""
    init_db()
    
    valid_relations = {"influye", "contrasta", "nacio_de", "alimenta", "bloquea"}
    if relation.lower() not in valid_relations:
        typer.echo(f"Error: Relación '{relation}' inválida. Debe ser una de {list(valid_relations)}")
        raise typer.Exit(code=1)
        
    node_source = get_node_by_id_or_label(source)
    node_target = get_node_by_id_or_label(target)
    
    if not node_source:
        typer.echo(f"Error: Nodo de origen '{source}' no encontrado.")
        raise typer.Exit(code=1)
    if not node_target:
        typer.echo(f"Error: Nodo de destino '{target}' no encontrado.")
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
    """Muestra la lista de todos los nodos en la base de datos."""
    init_db()
    nodes = get_nodes_db()
    if not nodes:
        typer.echo("No hay nodos creados aún. Usa 'add-node' para crear uno.")
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
    """Muestra la lista de todas las relaciones de identidad."""
    init_db()
    edges = get_edges_db()
    nodes = get_nodes_db()
    if not edges:
        typer.echo("No hay relaciones creadas aún. Usa 'add-edge' para establecer una.")
        return
        
    nodes_map = {n.id: n.label for n in nodes}
    
    headers = ["ID", "Origen (Source)", "Relación", "Destino (Target)", "Peso (Weight)"]
    rows = []
    for e in edges:
        src_label = nodes_map.get(e.source_id, f"Desconocido ({e.source_id[:6]})")
        tgt_label = nodes_map.get(e.target_id, f"Desconocido ({e.target_id[:6]})")
        rows.append([e.id[:8] + "..", src_label, e.relation.upper(), tgt_label, str(e.weight)])
        
    show_table(headers, rows, "Vínculos de Identidad (Relaciones)")

@app.command("create-snapshot")
def create_snapshot(
    notes: str = typer.Option(..., "--notes", "-n", help="Notas explicativas del estado actual de tu identidad"),
    active_nodes_csv: str = typer.Option("", "--nodes", help="IDs o etiquetas de nodos activos separados por comas. Vacío incluye todos.")
) -> None:
    """Captura el estado actual de tu identidad como un snapshot temporal."""
    init_db()
    all_nodes = get_nodes_db()
    if not all_nodes:
        typer.echo("Error: No puedes crear un snapshot sin nodos de identidad en la base de datos.")
        raise typer.Exit(code=1)
        
    active_ids = []
    if active_nodes_csv:
        identifiers = [i.strip() for i in active_nodes_csv.split(",") if i.strip()]
        for ident in identifiers:
            node = get_node_by_id_or_label(ident)
            if node:
                active_ids.append(node.id)
            else:
                typer.echo(f"Warning: Nodo '{ident}' no encontrado, omitiendo.")
    else:
        # Defaults to all nodes active
        active_ids = [n.id for n in all_nodes]
        
    snapshot = Snapshot(
        id=str(uuid4()),
        date=datetime.utcnow(),
        notes=notes
    )
    snapshot.active_nodes = active_ids  # setter handles serialization
    
    added_snap = add_snapshot_db(snapshot)
    
    msg = f"Snapshot creado correctamente [ID: {added_snap.id}] con {len(active_ids)} nodos activos."
    if HAS_RICH:
        rprint(f"[green]✓[/green] {msg}")
    else:
        print(f"✓ {msg}")

@app.command("list-snapshots")
def list_snapshots() -> None:
    """Muesta la lista cronológica de snapshots grabados."""
    init_db()
    snapshots = get_snapshots_db()
    if not snapshots:
        typer.echo("No hay snapshots grabados. Usa 'create-snapshot' para generar uno.")
        return
        
    headers = ["ID", "Fecha", "Nodos Activos", "Notas"]
    rows = []
    for s in snapshots:
        date_str = s.date.strftime("%Y-%m-%d %H:%M") if s.date else "-"
        rows.append([s.id[:8] + "..", date_str, str(len(s.active_nodes)), s.notes])
        
    show_table(headers, rows, "Snapshots Históricos de Identidad")

@app.command("compare-snapshots")
def compare_snapshots(
    snap1: str = typer.Argument(..., help="ID del primer snapshot temporal"),
    snap2: str = typer.Argument(..., help="ID del segundo snapshot temporal para comparar")
) -> None:
    """Compara dos snapshots revelando transiciones, nodos aparecidos, desaparecidos, retenidos y cambios en sus centralidades/pesos."""
    init_db()
    s1 = get_snapshot_by_id(snap1) or (get_snapshots_db()[0] if snap1.isdigit() else None) # simple fallback
    s2 = get_snapshot_by_id(snap2)
    
    # Try finding by prefixes
    all_snaps = get_snapshots_db()
    if not s1:
        s1 = next((s for s in all_snaps if s.id.startswith(snap1)), None)
    if not s2:
        s2 = next((s for s in all_snaps if s.id.startswith(snap2)), None)
        
    if not s1 or not s2:
        typer.echo("Error: Uno o ambos de los snapshots especificados no pudieron encontrarse.")
        raise typer.Exit(code=1)
        
    all_nodes = get_nodes_db()
    edges = get_edges_db()
    comp = run_snapshot_comparison(s1, s2, all_nodes, edges)
    
    print(f"\n================ COMPARACIÓN ENTRE SNAPSHOTS ================")
    print(f"Snapshot 1: {comp['snapshot1_date']} | Notas: {comp['snapshot1_notes']}")
    print(f"Snapshot 2: {comp['snapshot2_date']} | Notas: {comp['snapshot2_notes']}")
    print("-" * 65)
    
    # Show appeared
    appeared_labels = [item["label"] for item in comp["appeared"]]
    print(f"▲ Nodos Añadidos / Activados ({len(appeared_labels)}): {', '.join(appeared_labels) if appeared_labels else 'Ninguno'}")
    
    # Show disappeared
    disappeared_labels = [item["label"] for item in comp["disappeared"]]
    print(f"▼ Nodos Eliminados / Desactivados ({len(disappeared_labels)}): {', '.join(disappeared_labels) if disappeared_labels else 'Ninguno'}")
    
    # Show remained
    remained_labels = [item["label"] for item in comp["remained"]]
    print(f"● Nodos Retenidos ({len(remained_labels)}): {', '.join(remained_labels) if remained_labels else 'Ninguno'}")
    
    # Show significant node weight changes
    node_changes = comp.get("significant_node_changes", [])
    print(f"\n⚡ Cambios Significativos en Pesos de Nodos (Centralidad) ({len(node_changes)}):")
    if node_changes:
        for nc in node_changes:
            print(f"  • {nc['label']}: Grado {nc['old_degree']:.3f} -> {nc['new_degree']:.3f} | Intermediación {nc['old_betweenness']:.3f} -> {nc['new_betweenness']:.3f}")
    else:
        print("  Ninguno")
        
    # Show significant edge weight/active status changes
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
    snapshot_id: Optional[str] = typer.Option(None, "--snapshot", "-s", help="Exportar solo el subgrafo activo de un snapshot específico"),
    palette: str = typer.Option("original", "--palette", "-p", help="Paleta pastel: original, nordic, sunset, vintage"),
    node_penwidth: float = typer.Option(1.2, "--node-penwidth", help="Grosor de línea para el contorno de nodos"),
    edge_penwidth: float = typer.Option(1.2, "--edge-penwidth", help="Grosor de línea para relaciones (aristas)"),
    node_opacity: float = typer.Option(1.0, "--node-opacity", help="Opacidad de nodos (0.0 a 1.0)"),
    edge_opacity: float = typer.Option(0.8, "--edge-opacity", help="Opacidad de relaciones (0.0 a 1.0)"),
    save_style: bool = typer.Option(False, "--save-style", help="Guardar esta configuración estilística como la predeterminada")
) -> None:
    """Calcula métricas de centralidad, detecta comunidades, y exporta el grafo a .dot y .svg estilo pastel técnico personalizable."""
    init_db()
    nodes = get_nodes_db()
    edges = get_edges_db()
    
    if not nodes:
        typer.echo("Error: Grafo vacío. Crea algunos nodos primero.")
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
            typer.echo(f"Error: Snapshot '{snapshot_id}' no encontrado.")
            raise typer.Exit(code=1)
        active_nodes_filter = set(snap.active_nodes)
        print(f"Filtrando grafo utilizando el Snapshot: '{snap.notes}' ({len(active_nodes_filter)} nodos activos)")
        
    # Build networkx model for advanced computation
    G = build_networkx_graph(nodes, edges, active_nodes_filter=active_nodes_filter)
    
    # 1. Calculate centralities
    centralities = calculate_centralities(G)
    
    # 2. Detect communities
    communities = detect_communities(G)
    
    # 3. Export DOT and Render SVG
    # We export only the active nodes in the actual visual graph as well
    nodes_to_export = [n for n in nodes if n.id in G.nodes] if active_nodes_filter else nodes
    
    dot_path, svg_path = export_graph_to_files(nodes_to_export, edges, output, style_attrs=style_attrs)
    
    # Display analytics
    print(f"\n⚡ ANÁLISIS DE GRAFO DE IDENTIDAD (Total Nodos: {len(G.nodes)}, Relaciones: {len(G.edges)})")
    
    # Order nodes by Degree Centrality
    sorted_by_degree = sorted(
        G.nodes(data=True), 
        key=lambda x: centralities.get(x[0], {}).get("degree", 0.0), 
        reverse=True
    )
    
    headers_ana = ["Elemento de Identidad", "Tipo", "Centralidad Grado", "Centralidad Intermediación (Betweenness)"]
    rows_ana = []
    # Show top 6 central nodes
    for nid, data in sorted_by_degree[:6]:
        deg = f"{centralities[nid]['degree']:.3f}"
        btwn = f"{centralities[nid]['betweenness']:.3f}"
        rows_ana.append([data.get("label", nid), data.get("type", "").upper(), deg, btwn])
    show_table(headers_ana, rows_ana, "Elementos Centrales de tu Identidad")
    
    # Show communities
    print("👥 COMUNIDADES DETECTADAS (Dimensiones cohesivas de tu Yo):")
    for idx, c_nodes in enumerate(communities):
        labels = [G.nodes[nid].get("label", nid) for nid in c_nodes]
        print(f" Comunidad #{idx+1}: {', '.join(labels)}")
    print()
    
    print(f"📄 Archivo DOT exportado en: {dot_path}")
    if svg_path:
        print(f"🎨 Visualización SVG renderizada exitosamente en: {svg_path} (Aesthetic Pastel Technical)")
    else:
        print("⚠️  Advertencia: Graphviz no inicializado o biblioteca 'graphviz' de Python ausente.")
        print("   Se generó el archivo .dot perfectamente. Puedes visualizarlo en https://dreampuf.github.io/GraphvizOnline/")

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
    
    # Custom datetime encoder
    class DateTimeEncoder(json.JSONEncoder):
        def default(self, obj):
            if hasattr(obj, "isoformat"):
                return obj.isoformat()
            return super().default(obj)
            
    try:
        import os
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
    import os
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

if __name__ == "__main__":
    app()
