"""
Entrypoint for the Identity Map CLI tool.
Simply imports the Typer application and executes it.
"""
from .cli import app

if __name__ == "__main__":
    app()
