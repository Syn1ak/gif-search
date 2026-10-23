/** Page size, rating and language come from GIPHY_CONFIG, so callers only choose the page. */
export interface IGifPageCriteria {
  offset: number;
}

export interface IGifSearchCriteria extends IGifPageCriteria {
  q: string;
}
