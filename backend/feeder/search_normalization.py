SEARCH_NORMALIZE_FUNCTION = "yo_norm"


def normalize_search_text(value):
    if value is None:
        return None
    return str(value).casefold().replace("ё", "е")
