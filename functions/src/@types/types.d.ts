type SearchItem = {
  word: string;
  description: string;
  link: string;
};
type SearchResult = {
  isExactMatch: boolean;
  searchItems: SearchItem[];
};
