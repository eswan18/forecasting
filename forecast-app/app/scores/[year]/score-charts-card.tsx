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
import { Toggle } from "@/components/ui/toggle";
import UserScoresChart from "@/components/charts/user-scores-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Category, VForecast } from "@/types/db_types";
import OverallScoresChart from "@/components/charts/overall-scores-chart";

interface ScoreChartsCardProps {
  categories: Category[];
  forecasts: VForecast[];
}

export function ScoreChartsCard(
  { categories, forecasts }: ScoreChartsCardProps,
) {
  const [selectedTabValue, setSelectedTabValue] = useState("Overall");
  const [breakdownTogglePressed, setBreakdownTogglePressed] = useState(false);
  return (
    <Card className="w-full max-w-lg flex flex-col bg-background">
      <Tabs value={selectedTabValue} onValueChange={setSelectedTabValue}>
        <CardHeader title="Scores">
          <div>
            {/* A bit of a hack -- we are using tabs here to display the content but using a select for the trigger */}
            <Select
              value={selectedTabValue}
              onValueChange={setSelectedTabValue}
            >
              <div className="flex flex-row justify-center gap-4">
                <SelectTrigger className="w-[50%]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <Toggle
                  variant="outline"
                  pressed={breakdownTogglePressed}
                  onPressedChange={setBreakdownTogglePressed}
                >
                  {selectedTabValue === "Overall"
                    ? "Breakdown by Category"
                    : "Breakdown by Prop"}
                </Toggle>
              </div>
              <SelectContent>
                <SelectItem value="Overall">Overall</SelectItem>
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
          <TabsContent value="Overall" className="h-[28rem] lg:h-[32rem]">
            <OverallScoresChart forecasts={forecasts} byCategory={breakdownTogglePressed} />
          </TabsContent>
          {categories.map((category) => {
            const forecastsInScope = category.id === -1
              ? forecasts // This is the "Overall" category
              : forecasts.filter((forecast) =>
                forecast.category_id === category.id
              );
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
