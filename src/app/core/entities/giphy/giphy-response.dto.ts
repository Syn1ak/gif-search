export interface IGiphyMeta {
  status: number;
  msg: string;
  /** Empty in Giphy "synthetic" responses that signal a downstream failure. */
  response_id: string;
}

export interface IGiphyPagination {
  offset: number;
  count: number;
  /** Not returned by every endpoint. */
  total_count?: number;
}

export interface IGiphyListResponse<T> {
  data: T[];
  pagination: IGiphyPagination;
  meta: IGiphyMeta;
}

export interface IGiphySingleResponse<T> {
  data: T;
  meta: IGiphyMeta;
}
