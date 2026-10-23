/** Giphy rejects longer queries. */
export const MAX_QUERY_LENGTH = 50;
/** Shorter queries are too vague to be worth a call from the 100-per-hour beta budget. */
export const MIN_QUERY_LENGTH = 2;
export const SEARCH_DEBOUNCE_MS = 500;
