/** Page view events — time-series clickstream with funnel drop-off. */

import { bulkInsertBatched } from "./db";
import {
  faker,
  pick,
  REFERENCE_DATE,
  scaledCount,
  weightedPick,
} from "./faker";

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
const DEVICES = ["DESKTOP", "MOBILE", "TABLET"] as const;
const DEVICE_WEIGHTS = [0.5, 0.4, 0.1];
const _EVENT_TYPES = [
  "PAGE_VIEW",
  "PRODUCT_VIEW",
  "ADD_TO_CART",
  "CHECKOUT_START",
  "PURCHASE",
] as const;

/**
 * Generate events with realistic funnel per session:
 * PAGE_VIEW -> PRODUCT_VIEW -> ADD_TO_CART -> CHECKOUT_START -> PURCHASE
 * with drop-off at each stage.
 */
export async function seedEvents(
  customerIds: number[],
  productIds: number[],
): Promise<void> {
  const totalEvents = scaledCount(300000);
  const eventRows: (string | number | boolean | null | Date | string[])[][] =
    [];

  const start = new Date("2022-06-01");
  const end = REFERENCE_DATE;
  const totalDays = Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Generate sessions: each session produces 1-5 events
  const avgEventsPerSession = 2.5;
  const sessionCount = Math.round(totalEvents / avgEventsPerSession);

  let eventsGenerated = 0;
  for (let s = 0; s < sessionCount && eventsGenerated < totalEvents; s++) {
    // Session start time
    const dayOffset = faker.number.int({ min: 0, max: totalDays });
    const sessionStart = new Date(
      start.getTime() +
        dayOffset * 24 * 60 * 60 * 1000 +
        faker.number.int({ min: 0, max: 23 }) * 60 * 60 * 1000 +
        faker.number.int({ min: 0, max: 59 }) * 60 * 1000,
    );
    const sessionId = faker.string.uuid();
    const customerId = faker.datatype.boolean({ probability: 0.4 })
      ? customerIds[faker.number.int({ min: 0, max: customerIds.length - 1 })]
      : null;
    const device = DEVICES[weightedPick([...DEVICE_WEIGHTS])];
    const country = pick(COUNTRIES);
    const referrer = faker.datatype.boolean({ probability: 0.6 })
      ? faker.internet.url()
      : null;

    // Funnel: each step has a drop-off probability
    const funnelSteps = [
      { type: "PAGE_VIEW", dropOff: 0.0 }, // always
      { type: "PRODUCT_VIEW", dropOff: 0.3 },
      { type: "ADD_TO_CART", dropOff: 0.6 },
      { type: "CHECKOUT_START", dropOff: 0.5 },
      { type: "PURCHASE", dropOff: 0.4 },
    ];

    let eventTime = sessionStart;
    for (const step of funnelSteps) {
      if (faker.datatype.boolean({ probability: 1 - step.dropOff })) {
        const productId =
          step.type !== "PAGE_VIEW"
            ? productIds[
                faker.number.int({ min: 0, max: productIds.length - 1 })
              ]
            : null;
        eventRows.push([
          sessionId,
          customerId,
          productId,
          step.type,
          eventTime,
          device,
          referrer,
          country,
          new Date(),
        ]);
        eventsGenerated++;
        if (eventsGenerated >= totalEvents) break;
        // Next event 30s - 10min later
        eventTime = new Date(
          eventTime.getTime() + faker.number.int({ min: 30, max: 600 }) * 1000,
        );
      } else {
        break; // dropped off at this stage
      }
    }
  }

  // Insert in batches of 1000 for performance
  await bulkInsertBatched(
    "page_view_events",
    [
      "session_id",
      "customer_id",
      "product_id",
      "event_type",
      "occurred_at",
      "device",
      "referrer",
      "country",
      "created_at",
    ],
    eventRows,
    1000,
  );
  console.log(`  page_view_events: ${eventRows.length} rows`);
}
