"""
Groq LLM wrapper.

All prompts live here so the RAG behaviour (strict grounding, page
citations, refusal when the answer isn't in the document) is defined
in one place and easy to explain in a viva.

GROQ_MODEL is read from Config (which reads it from .env) and is never
hardcoded -- Groq periodically retires model names, so a bad/old model
id must surface as a clean, actionable error instead of a 500.
"""
import json

from groq import Groq

from app.config import Config

_client = None

SYSTEM_PROMPT_QA = (
    "You are a document analysis assistant. Answer ONLY using the provided "
    "context from the user's PDF. Cite the page number for every factual "
    "claim using the format (p. X). If the context does not contain the "
    "answer, say clearly: \"I could not find this information in the "
    "document.\" Never use outside knowledge. Never invent page numbers."
)

SYSTEM_PROMPT_SUMMARY = (
    "You are a document analysis assistant. Using ONLY the provided excerpts "
    "from a PDF, write a structured markdown summary with exactly these "
    "headings: '## Overview', '## Key Points', '## Conclusion'. Key Points "
    "must be a bullet list. Be concise and factual, do not invent content "
    "outside the excerpts."
)

SYSTEM_PROMPT_KEYWORDS = (
    "You are a document analysis assistant. Using ONLY the provided excerpts "
    "from a PDF, identify 12 to 15 key terms or concepts central to the "
    "document. Respond with ONLY a JSON array, no markdown, no prose, in "
    "this exact shape: "
    '[{"term": "...", "definition": "one line definition based on the document"}]'
)

SYSTEM_PROMPT_NOTES = (
    "You are a document analysis assistant. Using ONLY the provided excerpts "
    "from a PDF, write exam-style study notes in markdown with clear "
    "headings (##) and concise bullet points a student could revise from. "
    "Do not invent content outside the excerpts."
)


class GroqModelError(Exception):
    """Raised when GROQ_MODEL is invalid, decommissioned, or not found."""


def get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=Config.GROQ_API_KEY)
    return _client


def _looks_like_model_error(message):
    message = (message or "").lower()
    return any(
        keyword in message
        for keyword in ["model", "decommission", "does not exist", "not found"]
    )


def chat_completion(messages, temperature=0.2, max_tokens=1500, json_mode=False):
    """messages: list of {role, content}. Returns the assistant's text."""
    client = get_client()
    try:
        kwargs = {}
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        response = client.chat.completions.create(
            model=Config.GROQ_MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )
        return response.choices[0].message.content
    except Exception as exc:  # groq SDK raises various APIStatusError subclasses
        status_code = getattr(exc, "status_code", None)
        message = str(exc)
        if status_code in (400, 404) and _looks_like_model_error(message):
            raise GroqModelError(
                f"The Groq model '{Config.GROQ_MODEL}' is invalid or has been "
                "decommissioned. Update GROQ_MODEL in backend/.env to a "
                "currently supported model name."
            ) from exc
        raise


def answer_question(question, context_chunks, history_messages):
    """context_chunks: [{text, page}]. history_messages: [{role, content}] (last 4).
    Returns {answer, sources: [{page, snippet}]}."""
    context_block = "\n\n".join(
        f"[Page {c['page']}] {c['text']}" for c in context_chunks
    )

    messages = [{"role": "system", "content": SYSTEM_PROMPT_QA}]
    messages.extend(history_messages)
    messages.append(
        {
            "role": "user",
            "content": f"Context from the document:\n\n{context_block}\n\nQuestion: {question}",
        }
    )

    answer = chat_completion(messages, temperature=0.2, max_tokens=800)

    sources = [
        {"page": c["page"], "snippet": c["text"][:180]} for c in context_chunks
    ]
    return {"answer": answer, "sources": sources}


def _sample_chunks_for_artifact(chunks, budget=45):
    """Sample evenly across the document (first, middle, last) instead of
    stuffing every chunk into the prompt, to stay within a safe token
    budget for long documents."""
    if len(chunks) <= budget:
        return chunks

    third = budget // 3
    first = chunks[:third]
    last = chunks[-third:]
    middle_start = len(chunks) // 2 - third // 2
    middle = chunks[middle_start : middle_start + (budget - 2 * third)]
    return first + middle + last


def generate_summary(chunks):
    sampled = _sample_chunks_for_artifact(chunks)
    context_block = "\n\n".join(f"[Page {c['page']}] {c['text']}" for c in sampled)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT_SUMMARY},
        {"role": "user", "content": f"Document excerpts:\n\n{context_block}"},
    ]
    return chat_completion(messages, temperature=0.3, max_tokens=900)


def generate_keywords(chunks):
    sampled = _sample_chunks_for_artifact(chunks)
    context_block = "\n\n".join(f"[Page {c['page']}] {c['text']}" for c in sampled)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT_KEYWORDS},
        {"role": "user", "content": f"Document excerpts:\n\n{context_block}"},
    ]
    raw = chat_completion(messages, temperature=0.2, max_tokens=900, json_mode=True)
    try:
        parsed = json.loads(raw)
        # Groq's json_object mode may wrap the array under a key; handle both.
        if isinstance(parsed, dict):
            for value in parsed.values():
                if isinstance(value, list):
                    return value
            return []
        return parsed
    except (json.JSONDecodeError, TypeError):
        return []


def generate_notes(chunks):
    sampled = _sample_chunks_for_artifact(chunks)
    context_block = "\n\n".join(f"[Page {c['page']}] {c['text']}" for c in sampled)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT_NOTES},
        {"role": "user", "content": f"Document excerpts:\n\n{context_block}"},
    ]
    return chat_completion(messages, temperature=0.3, max_tokens=1200)
