/** Sellers, suppliers, warehouses — independent entities. */

import { bulkInsertBatched } from "./db";
import { faker, money, pick, REFERENCE_DATE, scaledCount } from "./faker";

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Germany",
  "Brazil",
  "Japan",
  "Canada",
  "Australia",
  "France",
];

export async function seedSellers(): Promise<{ ids: number[] }> {
  const count = scaledCount(60);
  const rows: (string | number | boolean | null | Date | string[])[][] = [];

  for (let i = 0; i < count; i++) {
    const name = faker.company.name();
    const slug = faker.helpers.slugify(name).toLowerCase().slice(0, 50);
    const joinedAt = faker.date.between({
      from: new Date("2020-01-01"),
      to: REFERENCE_DATE,
    });
    // Pareto: most sellers have low-mid rating, a few have high.
    const rating = weightedRating();
    rows.push([
      name,
      slug,
      pick(COUNTRIES),
      joinedAt,
      money(rating),
      faker.datatype.boolean({ probability: 0.9 }),
      money(faker.number.float({ min: 0.05, max: 0.25, fractionDigits: 4 })),
      new Date(),
      new Date(),
    ]);
  }

  await bulkInsertBatched(
    "sellers",
    [
      "name",
      "slug",
      "country",
      "joined_at",
      "rating",
      "is_active",
      "commission_rate",
      "created_at",
      "updated_at",
    ],
    rows,
  );
  console.log(`  sellers: ${count} rows`);
  return { ids: [] };
}

function weightedRating(): number {
  const r = faker.number.float({ min: 0, max: 1, fractionDigits: 6 });
  if (r < 0.6)
    return faker.number.float({ min: 3.0, max: 4.2, fractionDigits: 1 });
  if (r < 0.9)
    return faker.number.float({ min: 4.0, max: 4.7, fractionDigits: 1 });
  return faker.number.float({ min: 4.5, max: 5.0, fractionDigits: 1 });
}

export async function seedSuppliers(): Promise<void> {
  const count = scaledCount(40);
  const rows: (string | number | boolean | null | Date | string[])[][] = [];
  for (let i = 0; i < count; i++) {
    rows.push([
      faker.company.name(),
      pick(COUNTRIES),
      faker.number.int({ min: 3, max: 30 }),
      new Date(),
    ]);
  }
  await bulkInsertBatched(
    "suppliers",
    ["name", "country", "lead_time_days", "created_at"],
    rows,
  );
  console.log(`  suppliers: ${count} rows`);
}

export async function seedWarehouses(): Promise<{ ids: number[] }> {
  const count = scaledCount(8);
  const rows: (string | number | boolean | null | Date | string[])[][] = [];
  const cities = [
    { code: "NYC", city: "New York", country: "United States" },
    { code: "LON", city: "London", country: "United Kingdom" },
    { code: "BER", city: "Berlin", country: "Germany" },
    { code: "SAO", city: "São Paulo", country: "Brazil" },
    { code: "TYO", city: "Tokyo", country: "Japan" },
    { code: "TOR", city: "Toronto", country: "Canada" },
    { code: "SYD", city: "Sydney", country: "Australia" },
    { code: "PAR", city: "Paris", country: "France" },
  ];
  for (let i = 0; i < count; i++) {
    const c = cities[i % cities.length];
    rows.push([
      `${c.code}-${i + 1}`,
      c.city,
      c.country,
      faker.number.int({ min: 5000, max: 50000 }),
      new Date(),
    ]);
  }
  await bulkInsertBatched(
    "warehouses",
    ["code", "city", "country", "capacity", "created_at"],
    rows,
  );
  console.log(`  warehouses: ${count} rows`);
  return { ids: [] };
}
