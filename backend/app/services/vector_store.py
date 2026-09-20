"""
Chroma Cloud vector store wrapper.

Uses Chroma's built-in DefaultEmbeddingFunction (a local ONNX MiniLM
model) so no embedding API key or heavyweight ML framework (torch,
sentence-transformers) is required -- it downloads a small ONNX model
once and runs entirely on CPU.

One Chroma collection per document, named `doc_{document_id}`, so
deleting a document is a single `delete_collection` call and queries
never accidentally leak chunks from another document.
"""
import chromadb
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

from app.config import Config

_client = None
_embedding_function = None


def get_client():
    global _client
    if _client is None:
        _client = chromadb.CloudClient(
            api_key=Config.CHROMA_API_KEY,
            tenant=Config.CHROMA_TENANT,
            database=Config.CHROMA_DATABASE,
        )
    return _client


def get_embedding_function():
    global _embedding_function
    if _embedding_function is None:
        _embedding_function = DefaultEmbeddingFunction()
    return _embedding_function


def collection_name_for(document_id):
    return f"doc_{document_id}"


def get_or_create_collection(document_id):
    client = get_client()
    return client.get_or_create_collection(
        name=collection_name_for(document_id),
        embedding_function=get_embedding_function(),
    )


def add_chunks(document_id, chunks):
    """chunks: list of {id, page, chunk_index, text}"""
    if not chunks:
        return
    collection = get_or_create_collection(document_id)
    collection.add(
        ids=[c["id"] for c in chunks],
        documents=[c["text"] for c in chunks],
        metadatas=[
            {
                "document_id": document_id,
                "page": c["page"],
                "chunk_index": c["chunk_index"],
            }
            for c in chunks
        ],
    )


def query_document(document_id, query_text, n_results=5):
    """Return a list of {text, page, distance} for the closest chunks."""
    collection = get_or_create_collection(document_id)
    result = collection.query(query_texts=[query_text], n_results=n_results)

    documents = result.get("documents", [[]])[0]
    metadatas = result.get("metadatas", [[]])[0]
    distances = result.get("distances", [[]])[0] if result.get("distances") else [None] * len(documents)

    return [
        {"text": doc, "page": meta.get("page"), "distance": dist}
        for doc, meta, dist in zip(documents, metadatas, distances)
    ]


def get_all_chunks(document_id, limit=None):
    """Fetch chunks (without embeddings) for artifact generation, ordered
    by chunk_index so callers can sample evenly across the document."""
    collection = get_or_create_collection(document_id)
    result = collection.get(limit=limit) if limit else collection.get()

    items = list(zip(result.get("documents", []), result.get("metadatas", [])))
    items.sort(key=lambda item: item[1].get("chunk_index", 0))
    return [{"text": doc, "page": meta.get("page")} for doc, meta in items]


def delete_collection(document_id):
    client = get_client()
    try:
        client.delete_collection(name=collection_name_for(document_id))
    except Exception:
        # Collection may not exist (e.g. ingestion failed before it was created)
        pass
