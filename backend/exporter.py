import os
import json
from typing import Dict, List, Optional, Any
from .models import Node, Edge

STYLE_CONFIG_FILE = "identity_map/style_config.json"

# Define colors for pastel palettes
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
    """Loads the style configuration from JSON, with default values if not exists."""
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
                # Merge loaded keys to ensure no missing keys
                for k, v in loaded.items():
                    default_config[k] = v
        except Exception:
            pass
            
    return default_config

def save_style_config(config: Dict[str, Any]) -> None:
    """Saves style configuration in JSON format."""
    os.makedirs(os.path.dirname(STYLE_CONFIG_FILE), exist_ok=True)
    try:
        with open(STYLE_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=4)
    except Exception:
        pass

def apply_opacity_to_hex(hex_color: str, opacity: float) -> str:
    """Combines a base hex color with a given float opacity (0.0 to 1.0) into #RRGGBBAA."""
    opacity = max(0.0, min(1.0, opacity))
    alpha_int = int(opacity * 255)
    alpha_hex = f"{alpha_int:02X}"
    base_hex = hex_color[:7]
    return f"{base_hex}{alpha_hex}"

def generate_dot(nodes: List[Node], edges: List[Edge], style_attrs: Optional[Dict[str, Any]] = None) -> str:
    """Generates a Graphviz DOT representation incorporating customizable pastel aesthetics."""
    # Resolve styling parameters
    config = load_style_config()
    if style_attrs:
        config.update(style_attrs)
        
    palette_name = config.get("active_palette", "original")
    palette = PALETTES.get(palette_name, PALETTES["original"])
    
    # Check if we have dynamic overrides via custom_colors in config
    custom_colors = config.get("custom_colors", {})
    
    node_penwidth = config.get("node_penwidth", 1.2)
    edge_penwidth = config.get("edge_penwidth", 1.2)
    node_opacity = config.get("node_opacity", 1.0)
    edge_opacity = config.get("edge_opacity", 0.8)
    
    lines = [
        "digraph G {",
        "    # General graph attributes for pastel technical aesthetic",
        "    bgcolor=\"#FDFCF8\";",
        "    rankdir=LR;",
        f"    node [fontname=\"Helvetica,Arial,sans-serif\", fontsize=10, shape=box, style=\"filled,rounded\", penwidth={node_penwidth}];",
        f"    edge [fontname=\"Helvetica,Arial,sans-serif\", fontsize=8, penwidth={edge_penwidth}, color=\"#64748b\"];",
        ""
    ]
    
    # Write nodes
    active_ids = {n.id for n in nodes}
    for n in nodes:
        # Determine colors for this type of node
        node_type = n.type
        
        # Pull from custom override if specified physically
        fill_base = custom_colors.get("fill", {}).get(node_type) or palette["fill"].get(node_type, palette["fill"].get("otro", "#F5F4F0"))
        border_base = custom_colors.get("border", {}).get(node_type) or palette["border"].get(node_type, palette["border"].get("otro", "#DCDAD4"))
        text_base = custom_colors.get("text", {}).get(node_type) or palette["text"].get(node_type, palette["text"].get("otro", "#4A5568"))
        
        fillcolor = apply_opacity_to_hex(fill_base, node_opacity)
        color = apply_opacity_to_hex(border_base, node_opacity)
        text_color = apply_opacity_to_hex(text_base, 1.0) # Text looks better opaque
        
        # Format label with label and type
        label_text = f"{n.label}\\n({n.type.upper()})"
        lines.append(f"    \"{n.id}\" [label=\"{label_text}\", fillcolor=\"{fillcolor}\", color=\"{color}\", fontcolor=\"{text_color}\", tooltip=\"{n.description}\"];")
        
    lines.append("")
    
    # Write edges
    for e in edges:
        if e.source_id in active_ids and e.target_id in active_ids:
            edge_style_attrs = RELATION_STYLES.get(e.relation, {"color": "#64748b", "style": "solid", "arrowhead": "vee"})
            color_base = edge_style_attrs["color"]
            style = edge_style_attrs["style"]
            arrowhead = edge_style_attrs["arrowhead"]
            
            color = apply_opacity_to_hex(color_base, edge_opacity)
            label = f"{e.relation} (w={e.weight})" if e.weight != 1.0 else e.relation
            lines.append(f"    \"{e.source_id}\" -> \"{e.target_id}\" [label=\"{label}\", color=\"{color}\", style=\"{style}\", arrowhead=\"{arrowhead}\"];")
            
    lines.append("}")
    return "\n".join(lines)

def export_graph_to_files(nodes: List[Node], edges: List[Edge], base_filepath: str, style_attrs: Optional[Dict[str, Any]] = None) -> tuple[str, Optional[str]]:
    """Exports the graph to a .dot file and renders an SVG using Graphviz programmatically, returning the filepaths."""
    dot_content = generate_dot(nodes, edges, style_attrs)
    
    dot_path = f"{base_filepath}.dot"
    with open(dot_path, "w", encoding="utf-8") as f:
        f.write(dot_content)
        
    svg_path: Optional[str] = f"{base_filepath}.svg"
    try:
        import graphviz
        # Attempt rendering using python-graphviz
        src = graphviz.Source(dot_content)
        src.render(outfile=svg_path, format="svg", cleanup=True)
    except Exception:
        # If Graphviz library is missing or graphviz binary is not installed on path
        svg_path = None
        
    return dot_path, svg_path
