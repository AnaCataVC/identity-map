from sqlmodel import SQLModel, Field
from datetime import datetime
from uuid import uuid4
import json
from typing import List

class Node(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    type: str
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

n_data = {
    "id": "123",
    "type": "valor",
    "label": "Test",
    "description": "desc",
    "created_at": datetime.utcnow(),
    "tags": ["a", "b"]
}

try:
    node = Node(**n_data)
    print("Node created successfully!")
    print("Tags raw:", node.tags_raw)
    print("Tags:", node.tags)
except Exception as e:
    print("Error:", e)
