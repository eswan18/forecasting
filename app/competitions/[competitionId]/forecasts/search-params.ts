export interface SearchParams {
  user_id?: string;
  resolution?: string[];
  sort_col?: string;
  sort_asc?: string;
  prop_text?: string;
}

const defaultSearch: SearchState = {
  userId: undefined,
  resolution: [true, false],
  sortColumn: "score",
  sortAsc: false,
  propText: undefined,
};

export function parseSearchParamsAsState({ params }: { params: SearchParams }): SearchState {
  const state: SearchState = { ...defaultSearch };
  if (params.user_id) {
    const userId = parseInt(params.user_id, 10);
    if (!isNaN(userId)) {
      state.userId = userId;
    }
  }
  if (params.resolution) {
    const resolution = params.resolution.map((value) => {
      if (value === "true") {
        return true;
      } else if (value === "false") {
        return false;
      } else if (value === "null") {
        return null;
      } else {
        return undefined;
      }
    }).filter((value) => {
      return value !== undefined;
    });
    state.resolution = resolution;
  }
  if (params.sort_col) {
    state.sortColumn = params.sort_col;
  }
  if (params.sort_asc) {
    if (params.sort_asc === "true") {
      state.sortAsc = true;
    } else if (params.sort_asc === "false") {
      state.sortAsc = false;
    }
  }
  if (params.prop_text) {
    state.propText = params.prop_text;
  }
  return state;
}

export type SearchState = {
  userId?: number | undefined;
  resolution: (boolean | null)[];
  sortColumn: string;
  sortAsc: boolean;
  propText?: string | undefined;
}

export function searchStateAsURLSearchParams({ search }: { search: SearchState }): URLSearchParams {
  const params = new URLSearchParams();
  if (search.userId !== undefined && search.userId !== defaultSearch.userId) {
    params.set("user_id", search.userId.toString());
  }
  // If the values in resolution are the same as the default, we don't want to include them in the URL.
  if (!arraysHaveSameValues(search.resolution, defaultSearch.resolution)) {
    search.resolution.forEach((value) => {
      if (value === true) {
        params.append("resolution", "true");
      } else if (value === false) {
        params.append("resolution", "false");
      } else if (value === null) {
        params.append("resolution", "null");
      }
    });
  }
  if (search.sortColumn !== defaultSearch.sortColumn) {
    params.set("sort_col", search.sortColumn);
  }
  if (search.sortAsc !== defaultSearch.sortAsc) {
    params.set("sort_asc", search.sortAsc.toString());
  }
  if (search.propText && search.propText !== defaultSearch.propText) {
    params.set("prop_text", search.propText);
  }
  return params;
}

function arraysHaveSameValues(a: (boolean | null)[], b: (boolean | null)[]): boolean {
  const aSet = new Set(a);
  const bSet = new Set(b);
  if (aSet.size !== bSet.size) {
    return false;
  }
  for (const value of aSet) {
    if (!bSet.has(value)) {
      return false;
    }
  }
  return true;
}