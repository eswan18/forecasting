import { useState, useMemo } from "react";
import { VProp } from "@/types/db_types";
import { ResolutionFilterValue } from "@/components/filters";

interface UsePropsFilterProps {
  props: VProp[];
}

export function usePropsFilter({ props }: UsePropsFilterProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedResolution, setSelectedResolution] =
    useState<ResolutionFilterValue>("all");
  const [searchText, setSearchText] = useState<string>("");

  // Get unique categories from props
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        props
          .map((prop) => prop.category_name)
          .filter((name): name is string => Boolean(name)),
      ),
    );
    return uniqueCategories.sort();
  }, [props]);

  // Filter props based on selected filters
  const filteredProps = useMemo(() => {
    return props.filter((prop) => {
      // Category filter
      const categoryMatch =
        selectedCategories.length === 0 ||
        (prop.category_name && selectedCategories.includes(prop.category_name));

      // Resolution filter
      const resolutionMatch =
        selectedResolution === "all" ||
        (selectedResolution === "resolved" && prop.resolution !== null) ||
        (selectedResolution === "unresolved" && prop.resolution === null);

      // Search filter
      const searchMatch =
        searchText === "" ||
        prop.prop_text.toLowerCase().includes(searchText.toLowerCase());

      return categoryMatch && resolutionMatch && searchMatch;
    });
  }, [props, selectedCategories, selectedResolution, searchText]);

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedResolution("all");
    setSearchText("");
  };

  return {
    categories,
    selectedCategories,
    setSelectedCategories,
    selectedResolution,
    setSelectedResolution,
    searchText,
    setSearchText,
    filteredProps,
    handleClearFilters,
  };
}
