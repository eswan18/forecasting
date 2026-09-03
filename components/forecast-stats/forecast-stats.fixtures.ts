import type { BinaryForecast } from "@/lib/binary-forecast";

const PROPS = [
  { id: 1, text: "A European country wins the 2026 FIFA Men's World Cup." },
  { id: 2, text: "Keir Starmer is the prime minister of the UK at the end of 2026." },
  { id: 3, text: "Bitcoin closes the year above $150,000." },
  { id: 4, text: "A US government shutdown before April." },
  { id: 5, text: "The S&P 500 closes the year higher than it began." },
];

const PEOPLE = [
  { id: 1, name: "Akshay Rangesh" },
  { id: 2, name: "Carly Fiorina" },
  { id: 3, name: "Greg Moore" },
  { id: 9, name: "Ethan Swan" },
  { id: 5, name: "T. Mbeki" },
];

/**
 * Deliberately shaped: prop 3 splits the room wide open, prop 5 is near
 * unanimous, and Greg holds one extreme opinion that should top the boldest
 * takes.
 */
const VALUES: Record<number, number[]> = {
  // Akshay, Carly, Greg, Ethan, Mbeki
  1: [0.72, 0.64, 0.7, 0.68, 0.6],
  2: [0.45, 0.58, 0.5, 0.44, 0.52],
  3: [0.12, 0.44, 0.85, 0.31, 0.6],
  4: [0.3, 0.44, 0.25, 0.3, 0.38],
  5: [0.82, 0.8, 0.78, 0.8, 0.84],
};

export const CURRENT_USER_ID = 9;

export const forecastsFixture: BinaryForecast[] = PROPS.flatMap((prop) =>
  PEOPLE.map(
    (person, i) =>
      ({
        forecast_id: prop.id * 100 + person.id,
        prop_id: prop.id,
        prop_text: prop.text,
        prop_kind: "binary",
        user_id: person.id,
        user_name: person.name,
        forecast: VALUES[prop.id][i],
      }) as BinaryForecast,
  ),
);

export const emptyForecastsFixture: BinaryForecast[] = [];
