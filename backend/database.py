import os
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
            # Clear ID to let DB autogenerate, or keep it to restore exactly
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

