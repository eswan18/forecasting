"use client";

import { PropWithUserForecast } from "@/types/db_types";
import { ForecastablePropCardMobile } from "./forecastable-prop-card-mobile";
import { ForecastablePropCardDesktop } from "./forecastable-prop-card-desktop";

interface ForecastablePropCardProps {
  prop: PropWithUserForecast;
  onForecastUpdate?: () => void;
}

export function ForecastablePropCard({
  prop,
  onForecastUpdate,
}: ForecastablePropCardProps) {
  return (
    <>
      {/* Mobile version - visible on small screens, hidden on desktop */}
      <div className="md:hidden w-full">
        <ForecastablePropCardMobile
          prop={prop}
          onForecastUpdate={onForecastUpdate}
        />
      </div>
      {/* Desktop version - hidden on mobile, visible on desktop */}
      <div className="hidden md:block w-full">
        <ForecastablePropCardDesktop
          prop={prop}
          onForecastUpdate={onForecastUpdate}
        />
      </div>
    </>
  );
}
