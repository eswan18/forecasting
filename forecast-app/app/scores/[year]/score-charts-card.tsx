"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UserScoresChart from "@/components/charts/user-scores-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Category, VForecast } from "@/types/db_types";

interface ScoreChartsCardProps {
  categories: Category[];
  forecasts: VForecast[];
}

export function ScoreChartsCard(
  { categories, forecasts }: ScoreChartsCardProps,
) {
  categories = [{ id: -1, name: "Overall" }, ...categories];
  const defaultCategory = categories[0];
  const [selectedTabValue, setSelectedTabValue] = useState(
    defaultCategory.name,
  );
  return (
    <Card className="w-full max-w-lg flex flex-col">
      <Tabs value={selectedTabValue} onValueChange={setSelectedTabValue}>
        <CardHeader title="Scores">
          {/* TabsList for larger screens */}
          <TabsList className="hidden lg:inline-flex">
            {categories.map((category) => (
              <TabsTrigger
                key={category.name}
                value={category.name}
                className="text-xs px-2"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {/* Dropdown picker for smaller screens */}
          <div className="lg:hidden">
            <Select
              value={selectedTabValue}
              onValueChange={setSelectedTabValue}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.name} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {categories.map((category) => {
            const forecastsInScope = category.id === -1
              ? forecasts // This is the "Overall" category
              : forecasts.filter((forecast) => forecast.category_id === category.id);
            return (
              <TabsContent
                key={category.name}
                value={category.name}
                className="h-[28rem] lg:h-[32rem]"
              >
                <UserScoresChart forecasts={forecastsInScope} />
              </TabsContent>
            );
          })}
        </CardContent>
      </Tabs>
    </Card>
  );
}
