"use client";
import { Input } from "@/components/ui/input";
import CreateNewPropButton from "@/components/tables/prop-table/create-new-prop-button";
import { VForecast, VProp, VUser } from "@/types/db_types";
import ForecastCard from "@/components/forecast-card";
import { useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";

export default function ForecastGridListing({
  records,
  user,
}: {
  records: (VProp | VForecast)[];
  user: VUser;
}) {
  const [propFilter, setPropFilter] = useState("");
  records = records.filter((record) => {
    if (record.prop_text.toLowerCase().includes(propFilter.toLowerCase())) {
      return true;
    }
    if (record.prop_notes?.toLowerCase().includes(propFilter.toLowerCase())) {
      return true;
    }
    return false;
  });
  return (
    <div className="flex flex-col gap-y-4">
      <div className="grid grid-cols-3 gap-1">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="Search props..."
            className="pl-9"
            value={propFilter}
            onChange={(e) => setPropFilter(e.target.value)}
          />
        </div>
        <div className="text-muted-foreground flex flex-row justify-center items-center gap-x-1">
          <ArrowUpDown />
          <span className="text-foreground">recency</span>
        </div>
        <CreateNewPropButton defaultUserId={user?.id} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 justify-between gap-4 items-start">
        {records.map((record) => (
          <ForecastCard
            key={
              isForecast(record)
                ? `fcast-${record.forecast_id}`
                : `prop-${record.prop_id}`
            }
            record={record}
            userId={user.id}
          />
        ))}
      </div>
    </div>
  );
}

// type guard to check if a record is a forecast
function isForecast(record: VProp | VForecast): record is VForecast {
  return (record as VForecast).forecast_id !== undefined;
}
