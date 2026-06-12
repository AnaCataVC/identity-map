from backend.models import Node, Snapshot, Edge

def test_node_creation_defaults():
    n = Node(type="persona", label="Alice", description="Friend")
    assert n.type == "persona"
    assert n.label == "Alice"
    assert not hasattr(n, "weight") # Node doesn't have weight

def test_node_tags_serialization():
    n = Node(type="valor", label="Test", description="")
    n.tags = ["a", "b"]
    assert n.tags == ["a", "b"]
    assert "a" in n.tags_raw

def test_node_tags_empty():
    n = Node(type="otro", label="Test2", description="")
    n.tags = []
    assert n.tags == []
    assert n.tags_raw == "[]"

def test_edge_creation_defaults():
    e = Edge(source_id="1", target_id="2", relation="influye")
    assert e.weight == 1.0
    assert e.relation == "influye"

def test_snapshot_active_nodes_serialization():
    s = Snapshot(notes="test")
    s.active_nodes = ["n1", "n2"]
    assert s.active_nodes == ["n1", "n2"]
    assert "n1" in s.active_nodes_raw

def test_snapshot_active_nodes_empty():
    s = Snapshot(notes="empty")
    s.active_nodes = []
    assert s.active_nodes == []
    assert s.active_nodes_raw == "[]"
