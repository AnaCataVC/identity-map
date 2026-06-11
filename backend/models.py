from datetime import datetime
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
