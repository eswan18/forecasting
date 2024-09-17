'use client';

import { useState } from 'react';
import { UserScore } from "@/lib/db_actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserScoresChart from "@/components/charts/user-scores-chart";
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export interface CategoryAndUserScores {
  category: string;
  userScores: UserScore[];
}

interface ScoreChartsCardProps {
  categories: CategoryAndUserScores[];
}

export function ScoreChartsCard({ categories }: ScoreChartsCardProps) {
  const defaultCategory = categories[0].category;
  const [selectedTabValue, setSelectedTabValue] = useState<string>(defaultCategory);
  return (
    <Card className="w-full max-w-lg flex flex-col">
      <Tabs value={selectedTabValue} onValueChange={setSelectedTabValue}>
        <CardHeader title="Scores" >
          {/* TabsList for larger screens */}
          <TabsList className="hidden lg:inline-flex">
            {categories.map((category) => (
              <TabsTrigger key={category.category} value={category.category} className="text-xs px-2">{category.category}</TabsTrigger>
            ))}
          </TabsList>
          {/* Dropdown picker for smaller screens */}
          <div className="lg:hidden">
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
        </CardHeader>
        <CardContent>
          {
            categories.map((category) => (
              <TabsContent key={category.category} value={category.category} className="h-[28rem] lg:h-[32rem]">
                <UserScoresChart userScores={category.userScores} />
              </TabsContent>
            ))
          }
        </CardContent>
      </Tabs >
    </Card >
  )
}