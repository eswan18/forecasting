'use client';

import { useState } from 'react';
import { UserScore } from "@/lib/db_actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserScoresChart from "@/components/charts/user-scores-chart";

export interface CategoryAndUserScores {
  category: string;
  userScores: UserScore[];
}

interface ScoreChartsProps {
  categories: CategoryAndUserScores[];
}

export function ScoreCharts({ categories }: ScoreChartsProps) {
  const defaultCategory = categories[0].category;
  const [selectedTabValue, setSelectedTabValue] = useState<string>(defaultCategory);
  return (
    <Tabs value={selectedTabValue} onValueChange={setSelectedTabValue}>
      {/* TabsList for larger screens */}
      <TabsList className="mt-3 hidden lg:inline-flex">
        {categories.map((category) => (
          <TabsTrigger key={category.category} value={category.category} className="flex-shrink">{category.category}</TabsTrigger>
        ))}
      </TabsList>
      {/* Dropdown picker for smaller screens */}
      <div className="mt-3 lg:hidden px-3">
        <Select value={selectedTabValue} onValueChange={setSelectedTabValue}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.category} value={category.category}>
                {category.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {
        categories.map((category, index) => (
          <TabsContent key={category.category} value={category.category} className="h-[28rem] lg:h-[32rem]">
            <UserScoresChart userScores={category.userScores} />
          </TabsContent>
        ))
      }
    </Tabs >
  )
}