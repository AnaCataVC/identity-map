import json
from datetime import datetime
from typer.testing import CliRunner
from backend.cli import app

runner = CliRunner()

def test_cli_init_db(mocker):
    # Mock to prevent creating actual file
    mock_init = mocker.patch("backend.cli.init_db")
    result = runner.invoke(app, ["init"])
    assert result.exit_code == 0
    mock_init.assert_called_once()

def test_cli_add_node(mocker):
    mocker.patch("backend.cli.init_db")
    mock_add = mocker.patch("backend.cli.add_node_db")
    
    # Mock the return value of the DB operation
    from backend.models import Node
    mock_add.return_value = Node(id="123", type="valor", label="Amor", description="")
    
    result = runner.invoke(app, ["add-node", "--type", "valor", "--label", "Amor"])
    assert result.exit_code == 0
    assert "Amor" in result.stdout
    mock_add.assert_called_once()

def test_load_graph_cli_tags_fix(mocker, tmp_path):
    data = {
        "nodes": [
            {
                "id": "1", "type": "valor", "label": "test", "description": "",
                "created_at": datetime.utcnow().isoformat() + "Z",
                "tags": ["t1", "t2"]
            }
        ],
        "edges": [],
        "snapshots": [
            {
                "id": "s1", "date": datetime.utcnow().isoformat() + "Z",
                "notes": "snap", "active_nodes": ["1"]
            }
        ]
    }
    file_path = tmp_path / "backup.json"
    file_path.write_text(json.dumps(data))
    
    mock_save = mocker.patch("backend.cli.save_graph")
    mocker.patch("backend.cli.init_db")
    
    result = runner.invoke(app, ["load-graph", str(file_path)])
    
    assert result.exit_code == 0
    args, _ = mock_save.call_args
    nodes = args[0]
    snapshots = args[2]
    
    assert len(nodes) == 1
    assert nodes[0].tags == ["t1", "t2"]
    
    assert len(snapshots) == 1
    assert snapshots[0].active_nodes == ["1"]
