/** Customers (with self-referencing referrals), addresses, employees (manager chain). */

import { bulkInsertBatched, bulkInsertReturningIds } from "./db";
import { faker, pick, pickMany, REFERENCE_DATE, scaledCount } from "./faker";

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
const CITIES: Record<string, string[]> = {
  "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"],
  "United Kingdom": ["London", "Manchester", "Birmingham", "Leeds", "Glasgow"],
  Germany: ["Berlin", "Munich", "Hamburg", "Cologne", "Frankfurt"],
  Brazil: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza"],
  Japan: ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya"],
  Canada: ["Toronto", "Montreal", "Vancouver", "Calgary", "Ottawa"],
  Australia: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  France: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice"],
};
const TAGS_POOL = [
  "vip",
  "newsletter",
  "wholesale",
  "returns-often",
  "high-value",
  "frequent-buyer",
  "new",
  "international",
  "seasonal",
  "loyal",
];
const LOYALTY = ["BRONZE", "SILVER", "GOLD", "PLATINUM"] as const;
const DEPARTMENTS = [
  "WAREHOUSE",
  "LOGISTICS",
  "CUSTOMER_SERVICE",
  "SALES",
  "FINANCE",
  "IT",
  "HR",
  "MARKETING",
] as const;

export async function seedCustomers(): Promise<{ ids: number[] }> {
  const count = scaledCount(2000);
  const rows: (string | number | boolean | null | Date | string[])[][] = [];
  const customerIds: number[] = [];

  // First batch: no referrals (referred_by = null)
  const firstBatchSize = Math.ceil(count * 0.3);
  for (let i = 0; i < firstBatchSize; i++) {
    const country = pick(COUNTRIES);
    const city = pick(CITIES[country] ?? ["Unknown"]);
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    // Some near-duplicate names for DISTINCT lessons
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const birthDate = faker.datatype.boolean({ probability: 0.75 })
      ? faker.date.birthdate({ mode: 'age', min: 18, max: 85 })
      : null;
    const loyaltyTier = pick([...LOYALTY]);
    const tags = pickMany(TAGS_POOL, faker.number.int({ min: 0, max: 4 }));
    const preferences = {
      newsletter: faker.datatype.boolean(),
      preferred_language: "en",
      shipping_method: pick(["standard", "express", "pickup"]),
      categories: pickMany(
        ["Electronics", "Fashion", "Home", "Sports"],
        faker.number.int({ min: 1, max: 3 }),
      ),
    };
    const deletedAt = faker.datatype.boolean({ probability: 0.05 })
      ? faker.date.between({ from: new Date("2024-01-01"), to: REFERENCE_DATE })
      : null;
    const createdAt = faker.date.between({
      from: new Date("2022-01-01"),
      to: REFERENCE_DATE,
    });

    rows.push([
      firstName,
      lastName,
      email,
      birthDate,
      country,
      city,
      createdAt,
      loyaltyTier,
      JSON.stringify(preferences),
      tags,
      deletedAt,
      null, // referred_by_id
    ]);
  }

  const firstIds = await bulkInsertReturningIds(
    "customers",
    [
      "first_name",
      "last_name",
      "email",
      "birth_date",
      "country",
      "city",
      "created_at",
      "loyalty_tier",
      "preferences",
      "tags",
      "deleted_at",
      "referred_by_id",
    ],
    rows,
    200,
  );
  customerIds.push(...firstIds);

  // Second batch: with referrals (referred_by = existing customer)
  const secondRows: (string | number | boolean | null | Date | string[])[][] =
    [];
  const remaining = count - firstBatchSize;
  for (let i = 0; i < remaining; i++) {
    const country = pick(COUNTRIES);
    const city = pick(CITIES[country] ?? ["Unknown"]);
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const birthDate = faker.datatype.boolean({ probability: 0.75 })
      ? faker.date.birthdate({ mode: 'age', min: 18, max: 85 })
      : null;
    const loyaltyTier = pick([...LOYALTY]);
    const tags = pickMany(TAGS_POOL, faker.number.int({ min: 0, max: 4 }));
    const preferences = {
      newsletter: faker.datatype.boolean(),
      preferred_language: "en",
      shipping_method: pick(["standard", "express", "pickup"]),
      categories: pickMany(
        ["Electronics", "Fashion", "Home", "Sports"],
        faker.number.int({ min: 1, max: 3 }),
      ),
    };
    const deletedAt = faker.datatype.boolean({ probability: 0.05 })
      ? faker.date.between({ from: new Date("2024-01-01"), to: REFERENCE_DATE })
      : null;
    const createdAt = faker.date.between({
      from: new Date("2022-06-01"),
      to: REFERENCE_DATE,
    });
    const referrerId =
      customerIds[faker.number.int({ min: 0, max: customerIds.length - 1 })];

    secondRows.push([
      firstName,
      lastName,
      email,
      birthDate,
      country,
      city,
      createdAt,
      loyaltyTier,
      JSON.stringify(preferences),
      tags,
      deletedAt,
      referrerId,
    ]);
  }

  const secondIds = await bulkInsertReturningIds(
    "customers",
    [
      "first_name",
      "last_name",
      "email",
      "birth_date",
      "country",
      "city",
      "created_at",
      "loyalty_tier",
      "preferences",
      "tags",
      "deleted_at",
      "referred_by_id",
    ],
    secondRows,
    200,
  );
  customerIds.push(...secondIds);

  console.log(`  customers: ${customerIds.length} rows`);
  return { ids: customerIds };
}

export async function seedAddresses(customerIds: number[]): Promise<void> {
  const count = scaledCount(3500);
  const rows: (string | number | boolean | null | Date | string[])[][] = [];

  for (let i = 0; i < count; i++) {
    const customerId =
      customerIds[faker.number.int({ min: 0, max: customerIds.length - 1 })];
    const country = pick(COUNTRIES);
    const city = pick(CITIES[country] ?? ["Unknown"]);
    const type = pick(["BILLING", "SHIPPING"]);
    const isDefault = faker.datatype.boolean({ probability: 0.3 });
    rows.push([
      customerId,
      type,
      faker.location.streetAddress(),
      city,
      faker.location.state(),
      faker.location.zipCode(),
      country,
      isDefault,
      new Date(),
    ]);
  }

  await bulkInsertBatched(
    "addresses",
    [
      "customer_id",
      "type",
      "street",
      "city",
      "state",
      "postal_code",
      "country",
      "is_default",
      "created_at",
    ],
    rows,
    200,
  );
  console.log(`  addresses: ${count} rows`);
}

export async function seedEmployees(
  warehouseIds: number[],
): Promise<{ ids: number[] }> {
  const count = scaledCount(250);
  // Build a 4-5 level manager chain:
  // Level 0: CEO (no manager) — 1 person
  // Level 1: VPs — ~5 people, report to CEO
  // Level 2: Directors — ~15 people, report to VPs
  // Level 3: Managers — ~50 people, report to Directors
  // Level 4: Individual contributors — rest, report to Managers

  const allIds: number[] = [];

  // Level 0: CEO
  const ceoRows = [
    [
      faker.person.fullName(),
      `ceo@marketplace.com`,
      "SALES",
      null,
      money(faker.number.float({ min: 200000, max: 400000 })),
      new Date("2020-01-01"),
      null,
      null,
    ],
  ];
  const ceoIds = await bulkInsertReturningIds(
    "employees",
    [
      "name",
      "email",
      "department",
      "manager_id",
      "salary",
      "hired_at",
      "terminated_at",
      "warehouse_id",
    ],
    ceoRows,
  );
  allIds.push(...ceoIds);

  // Level 1: VPs (department heads)
  const vpRows: (string | number | boolean | null | Date | string[])[][] = [];
  for (const dept of DEPARTMENTS) {
    vpRows.push([
      faker.person.fullName(),
      `vp.${dept.toLowerCase()}@marketplace.com`,
      dept,
      ceoIds[0],
      money(faker.number.float({ min: 120000, max: 200000 })),
      faker.date.between({
        from: new Date("2020-01-01"),
        to: new Date("2022-01-01"),
      }),
      null,
      null,
    ]);
  }
  const vpIds = await bulkInsertReturningIds(
    "employees",
    [
      "name",
      "email",
      "department",
      "manager_id",
      "salary",
      "hired_at",
      "terminated_at",
      "warehouse_id",
    ],
    vpRows,
  );
  allIds.push(...vpIds);

  // Level 2: Directors (3 per VP)
  const dirRows: (string | number | boolean | null | Date | string[])[][] = [];
  for (const vpId of vpIds) {
    for (let i = 0; i < 3; i++) {
      const dept = pick([...DEPARTMENTS]);
      dirRows.push([
        faker.person.fullName(),
        `dir.${vpId}.${i}@marketplace.com`,
        dept,
        vpId,
        money(faker.number.float({ min: 80000, max: 130000 })),
        faker.date.between({
          from: new Date("2020-06-01"),
          to: new Date("2023-01-01"),
        }),
        null,
        null,
      ]);
    }
  }
  const dirIds = await bulkInsertReturningIds(
    "employees",
    [
      "name",
      "email",
      "department",
      "manager_id",
      "salary",
      "hired_at",
      "terminated_at",
      "warehouse_id",
    ],
    dirRows,
  );
  allIds.push(...dirIds);

  // Level 3: Managers (3-4 per director)
  const mgrRows: (string | number | boolean | null | Date | string[])[][] = [];
  for (const dirId of dirIds) {
    const num = faker.number.int({ min: 2, max: 4 });
    for (let i = 0; i < num; i++) {
      const dept = pick([...DEPARTMENTS]);
      const whId = faker.datatype.boolean({ probability: 0.4 })
        ? warehouseIds[
            faker.number.int({ min: 0, max: warehouseIds.length - 1 })
          ]
        : null;
      mgrRows.push([
        faker.person.fullName(),
        `mgr.${dirId}.${i}@marketplace.com`,
        dept,
        dirId,
        money(faker.number.float({ min: 60000, max: 95000 })),
        faker.date.between({
          from: new Date("2021-01-01"),
          to: new Date("2023-06-01"),
        }),
        null,
        whId,
      ]);
    }
  }
  const mgrIds = await bulkInsertReturningIds(
    "employees",
    [
      "name",
      "email",
      "department",
      "manager_id",
      "salary",
      "hired_at",
      "terminated_at",
      "warehouse_id",
    ],
    mgrRows,
  );
  allIds.push(...mgrIds);

  // Level 4: ICs (rest, report to managers)
  const icCount = count - allIds.length;
  const icRows: (string | number | boolean | null | Date | string[])[][] = [];
  for (let i = 0; i < icCount; i++) {
    const mgrId = mgrIds[faker.number.int({ min: 0, max: mgrIds.length - 1 })];
    const dept = pick([...DEPARTMENTS]);
    const whId = faker.datatype.boolean({ probability: 0.5 })
      ? warehouseIds[faker.number.int({ min: 0, max: warehouseIds.length - 1 })]
      : null;
    const terminated = faker.datatype.boolean({ probability: 0.1 })
      ? faker.date.between({ from: new Date("2023-01-01"), to: REFERENCE_DATE })
      : null;
    icRows.push([
      faker.person.fullName(),
      `emp.${i}@marketplace.com`,
      dept,
      mgrId,
      money(faker.number.float({ min: 35000, max: 75000 })),
      faker.date.between({ from: new Date("2021-01-01"), to: REFERENCE_DATE }),
      terminated,
      whId,
    ]);
  }
  const icIds = await bulkInsertReturningIds(
    "employees",
    [
      "name",
      "email",
      "department",
      "manager_id",
      "salary",
      "hired_at",
      "terminated_at",
      "warehouse_id",
    ],
    icRows,
    200,
  );
  allIds.push(...icIds);

  console.log(`  employees: ${allIds.length} rows (5-level hierarchy)`);
  return { ids: allIds };
}

function money(n: number): string {
  return n.toFixed(2);
}
