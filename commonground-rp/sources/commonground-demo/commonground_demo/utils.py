from __future__ import annotations

import math
import re
from collections import Counter
from itertools import combinations


def tokenize(text: str) -> set[str]:
    raw = re.findall(r"[a-zA-Z0-9]+", text.lower())
    stopwords = {
        "and",
        "or",
        "the",
        "a",
        "an",
        "to",
        "of",
        "in",
        "for",
        "with",
        "on",
        "low",
        "medium",
        "high",
    }
    return {token for token in raw if len(token) > 2 and token not in stopwords}


def jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def cosine_from_tags(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    ca = Counter(a)
    cb = Counter(b)
    keys = set(ca) | set(cb)
    dot = sum(ca[k] * cb[k] for k in keys)
    na = math.sqrt(sum(v * v for v in ca.values()))
    nb = math.sqrt(sum(v * v for v in cb.values()))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def average(values: list[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)


def pairwise(items):
    return list(combinations(items, 2))
