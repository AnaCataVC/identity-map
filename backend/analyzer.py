import networkx as nx
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
        # We explicitly convert tags back from raw list if needed, but our Node class property tags works too
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
    # Directed betweenness centrality incorporating edge weights
    try:
        # networkx uses 1/weight to calculate short paths when weight is specified
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
    # Communities are usually analyzed on the undirected counterpart
    undirected_G = G.to_undirected()
    try:
        from networkx.algorithms.community import greedy_modularity_communities
        communities = greedy_modularity_communities(undirected_G)
        return [list(c) for c in communities]
    except Exception:
        # Fallback to connected components if any error occurs
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
        # Build NetworkX graphs for the active states G1 and G2
        G1 = build_networkx_graph(all_nodes, all_edges, active_nodes_filter=set1)
        G2 = build_networkx_graph(all_nodes, all_edges, active_nodes_filter=set2)
        
        # Calculate centralities (representing node relational weights)
        cent1 = calculate_centralities(G1)
        cent2 = calculate_centralities(G2)
        
        for nid in remained_ids:
            c1 = cent1.get(nid, {"degree": 0.0, "betweenness": 0.0})
            c2 = cent2.get(nid, {"degree": 0.0, "betweenness": 0.0})
            
            diff_deg = abs(c1["degree"] - c2["degree"])
            diff_btwn = abs(c1["betweenness"] - c2["betweenness"])
            
            # An arbitrary threshold of 0.01 for any degree or centrality shift is considered significant
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
        
        # Edge weight changes (edges that went from active to inactive or vice versa, changing effective weight)
        for edge in all_edges:
            active_in_s1 = edge.source_id in set1 and edge.target_id in set1
            active_in_s2 = edge.source_id in set2 and edge.target_id in set2
            
            src_lbl = nodes_dict[edge.source_id].label if edge.source_id in nodes_dict else edge.source_id
            tgt_lbl = nodes_dict[edge.target_id].label if edge.target_id in nodes_dict else edge.target_id
            
            # If its activation status changes, its "effective weight" goes from/to 0.
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

