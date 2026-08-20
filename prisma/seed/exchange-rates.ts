/** Exchange rates (range/non-equi join practice) + reviews. */

import { bulkInsertBatched } from "./db";
import { faker, REFERENCE_DATE, scaledCount } from "./faker";

const CURRENCIES = ["EUR", "GBP", "BRL", "JPY"]; // USD is the base, others have rates

/** Exchange rates: contiguous date ranges per currency over 3 years. */
export async function seedExchangeRates(): Promise<void> {
  const rows: (string | number | boolean | null | Date | string[])[][] = [];
  const start = new Date("2022-01-01");
  const end = REFERENCE_DATE;

  for (const currency of CURRENCIES) {
    // Each currency has ~300 date ranges (rate changes every ~3-4 days)
    let currentFrom = new Date(start);
    while (currentFrom < end) {
      const rangeDays = faker.number.int({ min: 2, max: 7 });
      const validTo = new Date(
        Math.min(
          currentFrom.getTime() + rangeDays * 24 * 60 * 60 * 1000,
          end.getTime(),
        ),
      );
      // Realistic-ish rates
      const baseRate: Record<string, number> = {
        EUR: 1.08,
        GBP: 1.27,
        BRL: 0.2,
        JPY: 0.0067,
      };
      const rate =
        baseRate[currency] *
        faker.number.float({ min: 0.95, max: 1.05, fractionDigits: 4 });
      rows.push([currency, currentFrom, validTo, rate.toFixed(6), new Date()]);
      currentFrom = new Date(validTo.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  await bulkInsertBatched(
    "exchange_rates",
    ["currency", "valid_from", "valid_to", "rate_to_usd", "created_at"],
    rows,
    500,
  );
  console.log(`  exchange_rates: ${rows.length} rows`);
}

/** Reviews: correlate loosely with product performance. */
export async function seedReviews(
  productIds: number[],
  customerIds: number[],
): Promise<void> {
  const count = scaledCount(18000);
  const rows: (string | number | boolean | null | Date | string[])[][] = [];

  for (let i = 0; i < count; i++) {
    // Pareto: some products get hundreds of reviews, most get few
    const productIdx = faker.number.int({ min: 0, max: productIds.length - 1 });
    const customerId =
      customerIds[faker.number.int({ min: 0, max: customerIds.length - 1 })];
    const rating = weightedRating();
    const title =
      faker.commerce.productAdjective() +
      " " +
      faker.commerce.productMaterial();
    const body = faker.datatype.boolean({ probability: 0.6 })
      ? faker.lorem.sentences({ min: 1, max: 3 })
      : null;
    const isVerified = faker.datatype.boolean({ probability: 0.7 });
    const helpfulVotes = faker.number.int({ min: 0, max: 50 });
    const createdAt = faker.date.between({
      from: new Date("2022-06-01"),
      to: REFERENCE_DATE,
    });

    rows.push([
      productIds[productIdx],
      customerId,
      rating,
      title,
      body,
      isVerified,
      helpfulVotes,
      createdAt,
    ]);
  }

  await bulkInsertBatched(
    "reviews",
    [
      "product_id",
      "customer_id",
      "rating",
      "title",
      "body",
      "is_verified_purchase",
      "helpful_votes",
      "created_at",
    ],
    rows,
    200,
  );
  console.log(`  reviews: ${rows.length} rows`);
}

function weightedRating(): number {
  // Most ratings are 4-5, some 1-3
  const r = faker.number.float({ min: 0, max: 1, fractionDigits: 6 });
  if (r < 0.5) return faker.number.int({ min: 4, max: 5 });
  if (r < 0.8) return 4;
  if (r < 0.9) return 3;
  return faker.number.int({ min: 1, max: 2 });
}
