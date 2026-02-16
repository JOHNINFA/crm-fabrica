"""
Utilities to load shared RAG context for AI services.
"""
from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=1)
def load_shared_rag_context() -> str:
    """
    Loads shared steering context from the repository.
    Returns an empty string if the file is missing or unreadable.
    """
    base_path = Path(__file__).resolve().parent.parent.parent
    rag_path = base_path / ".kiro" / "steering" / "rag-context.md"

    try:
        if rag_path.exists():
            return rag_path.read_text(encoding="utf-8")
    except Exception:
        return ""

    return ""

