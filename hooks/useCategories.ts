"use client";

import useSWRImmutable from "swr/immutable";
import type { Category } from "@/types/db_types";
import { fetchJson, HttpError } from "@/lib/http";

type CategoriesResponse = {
  categories: Category[];
};

export function useCategories() {
  return useSWRImmutable<Category[], HttpError>(
    "/api/categories",
    async (url) => {
      const data = await fetchJson<CategoriesResponse>(url);
      return data.categories;
    },
    {
      shouldRetryOnError: false,
    },
  );
}
