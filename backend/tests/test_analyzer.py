from backend.models import Node, Edge, Snapshot
from backend.analyzer import build_networkx_graph, calculate_centralities, detect_communities, compare_snapshots
from datetime import datetime

def test_build_graph_and_centralities():
    n1 = Node(id="1", type="valor", label="A", description="")
    n2 = Node(id="2", type="valor", label="B", description="")
    n3 = Node(id="3", type="valor", label="C", description="")
    e1 = Edge(source_id="1", target_id="2", relation="influye", weight=1.0)
    e2 = Edge(source_id="2", target_id="3", relation="influye", weight=1.0)
    
    G = build_networkx_graph([n1, n2, n3], [e1, e2])
    assert G.number_of_nodes() == 3
    assert G.number_of_edges() == 2
    
    centralities = calculate_centralities(G)
    assert centralities["2"]["betweenness"] > centralities["1"]["betweenness"]
    assert centralities["2"]["betweenness"] > centralities["3"]["betweenness"]

def test_build_graph_filtered_by_snapshot():
    n1 = Node(id="1", type="valor", label="A", description="")
    n2 = Node(id="2", type="valor", label="B", description="")
    e1 = Edge(source_id="1", target_id="2", relation="influye", weight=1.0)
    
    # Exclude node 2
    G = build_networkx_graph([n1, n2], [e1], active_nodes_filter={"1"})
    assert G.number_of_nodes() == 1
    assert G.number_of_edges() == 0

def test_detect_communities():
    # Two disconnected pairs
    n1 = Node(id="1", type="valor", label="A", description="")
    n2 = Node(id="2", type="valor", label="B", description="")
    n3 = Node(id="3", type="valor", label="C", description="")
    n4 = Node(id="4", type="valor", label="D", description="")
    e1 = Edge(source_id="1", target_id="2", relation="influye", weight=1.0)
    e2 = Edge(source_id="3", target_id="4", relation="influye", weight=1.0)
    
    G = build_networkx_graph([n1, n2, n3, n4], [e1, e2])
    communities = detect_communities(G)
    assert len(communities) == 2

def test_compare_snapshots():
    n1 = Node(id="1", type="valor", label="A", description="")
    n2 = Node(id="2", type="valor", label="B", description="")
    
    s1 = Snapshot(notes="S1", date=datetime.utcnow())
    s1.active_nodes = ["1"]
    
    s2 = Snapshot(notes="S2", date=datetime.utcnow())
    s2.active_nodes = ["1", "2"] # Node 2 appeared
    
    comp = compare_snapshots(s1, s2, [n1, n2], [])
    assert len(comp["appeared"]) == 1
    assert comp["appeared"][0]["id"] == "2"
    assert len(comp["remained"]) == 1
    assert len(comp["disappeared"]) == 0
