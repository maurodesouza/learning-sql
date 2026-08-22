/** Orders, order_items, payments, shipments, returns, coupons, order_coupons. */

import { bulkInsertBatched, bulkInsertReturningIds, query } from "./db";
import {
  faker,
  money,
  pick,
  REFERENCE_DATE,
  scaledCount,
  weightedPick,
} from "./faker";

const CURRENCIES = ["USD", "EUR", "GBP", "BRL", "JPY"];
const CURRENCY_WEIGHTS = [0.5, 0.2, 0.12, 0.1, 0.08];
const CHANNELS = ["WEB", "MOBILE", "MARKETPLACE_APP"] as const;
const CHANNEL_WEIGHTS = [0.6, 0.25, 0.15];
const STATUSES = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;
// Most orders are delivered, some cancelled/refunded
const STATUS_WEIGHTS = [0.03, 0.05, 0.07, 0.75, 0.07, 0.03];
const PAYMENT_METHODS = [
  "CREDIT_CARD",
  "PIX",
  "BOLETO",
  "PAYPAL",
  "WALLET",
] as const;
const PAYMENT_WEIGHTS = [0.55, 0.15, 0.1, 0.12, 0.08];
const CARRIERS = ["DHL", "FedEx", "UPS", "USPS", "LocalPost", "DPD"];

/** Seasonality factor for a date — Q4 peak, weekend dip. */
function seasonalityFactor(date: Date): number {
  const month = date.getUTCMonth(); // 0-11
  // Q4 (Oct-Dec) peak: 1.5-2.0x, Q1 dip: 0.7x
  const monthFactor = [
    0.7, 0.65, 0.75, 0.85, 0.9, 1.0, 1.05, 1.0, 1.1, 1.4, 1.8, 2.0,
  ][month];
  const dayOfWeek = date.getUTCDay();
  // Weekend dip: Sat/Sun ~0.7x
  const dayFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.0;
  return monthFactor * dayFactor;
}

/** Generate order dates with seasonality over 3 years. */
function generateOrderDates(count: number): Date[] {
  const start = new Date("2022-01-15");
  const end = REFERENCE_DATE;
  const totalDays = Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  const dates: Date[] = [];

  // Distribute orders across days with seasonality
  for (let day = 0; day <= totalDays; day++) {
    const date = new Date(start.getTime() + day * 24 * 60 * 60 * 1000);
    const factor = seasonalityFactor(date);
    const basePerDay = count / totalDays;
    const ordersToday = Math.round(
      basePerDay *
        factor *
        faker.number.float({ min: 0.7, max: 1.3, fractionDigits: 2 }),
    );
    for (let i = 0; i < ordersToday; i++) {
      // Intraday distribution: more during business hours
      const hour = weightedPick([
        0.02, 0.01, 0.01, 0.01, 0.01, 0.02, 0.03, 0.05, 0.07, 0.08, 0.08, 0.07,
        0.06, 0.07, 0.08, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02, 0.02, 0.01,
      ]);
      const minute = faker.number.int({ min: 0, max: 59 });
      const second = faker.number.int({ min: 0, max: 59 });
      dates.push(
        new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            hour,
            minute,
            second,
          ),
        ),
      );
    }
  }
  // Trim or pad to exact count
  while (dates.length > count) dates.pop();
  while (dates.length < count) {
    dates.push(faker.date.between({ from: start, to: end }));
  }
  // Sort chronologically
  dates.sort((a, b) => a.getTime() - b.getTime());
  return dates;
}

export async function seedOrders(
  customerIds: number[],
  variantIds: number[],
  sellerIds: number[],
  warehouseIds: number[],
  addressIds: number[],
  couponIds: number[],
): Promise<{ orderIds: number[] }> {
  const orderCount = scaledCount(40000);
  const orderDates = generateOrderDates(orderCount);
  const orderRows: (string | number | boolean | null | Date | string[])[][] =
    [];

  for (let i = 0; i < orderCount; i++) {
    const placedAt = orderDates[i];
    const customerId =
      customerIds[faker.number.int({ min: 0, max: customerIds.length - 1 })];
    const statusIdx = weightedPick([...STATUS_WEIGHTS]);
    const status = STATUSES[statusIdx];
    const currencyIdx = weightedPick([...CURRENCY_WEIGHTS]);
    const currency = CURRENCIES[currencyIdx];
    const channelIdx = weightedPick([...CHANNEL_WEIGHTS]);
    const channel = CHANNELS[channelIdx];
    const shippingAddressId = faker.datatype.boolean({ probability: 0.9 })
      ? addressIds[faker.number.int({ min: 0, max: addressIds.length - 1 })]
      : null;
    const cancelledAt =
      status === "CANCELLED"
        ? faker.date.between({
            from: placedAt,
            to: new Date(placedAt.getTime() + 3 * 24 * 60 * 60 * 1000),
          })
        : null;
    const notes = faker.datatype.boolean({ probability: 0.1 })
      ? faker.lorem.sentence()
      : null;

    orderRows.push([
      customerId,
      placedAt,
      status,
      currency,
      channel,
      shippingAddressId,
      cancelledAt,
      notes,
      new Date(),
    ]);
  }

  const orderIds = await bulkInsertReturningIds(
    "orders",
    [
      "customer_id",
      "placed_at",
      "status",
      "currency",
      "channel",
      "shipping_address_id",
      "cancelled_at",
      "notes",
      "created_at",
    ],
    orderRows,
    200,
  );
  console.log(`  orders: ${orderIds.length} rows`);

  // Order items: 1-5 items per order (Pareto: most have 1-2)
  const orderItemRows: (
    | string
    | number
    | boolean
    | null
    | Date
    | string[]
  )[][] = [];
  for (const orderId of orderIds) {
    const numItems = weightedPick([0.45, 0.3, 0.12, 0.08, 0.05]) + 1; // 1-5 items
    const usedVariants = new Set<number>();
    for (let j = 0; j < numItems; j++) {
      let variantId =
        variantIds[faker.number.int({ min: 0, max: variantIds.length - 1 })];
      // Avoid duplicate variants in same order
      let attempts = 0;
      while (usedVariants.has(variantId) && attempts < 5) {
        variantId =
          variantIds[faker.number.int({ min: 0, max: variantIds.length - 1 })];
        attempts++;
      }
      usedVariants.add(variantId);

      const quantity = faker.number.int({ min: 1, max: 5 });
      const unitPrice = faker.number.float({
        min: 5,
        max: 500,
        fractionDigits: 2,
      });
      const discountAmount = faker.datatype.boolean({ probability: 0.2 })
        ? faker.number.float({
            min: 1,
            max: unitPrice * 0.3,
            fractionDigits: 2,
          })
        : 0;

      // Get seller_id from the variant's product
      // We'll resolve this after insert via a JOIN, or store it now
      // For performance, we'll fetch seller_ids for variants in bulk later
      orderItemRows.push([
        orderId,
        variantId,
        0,
        quantity,
        money(unitPrice),
        money(discountAmount),
        new Date(),
      ]);
    }
  }

  // We need seller_id for each order item. Fetch variant -> product -> seller mapping.
  const variantSellerMap = await query<{
    variant_id: number;
    seller_id: number;
  }>(
    `SELECT pv.id AS variant_id, p.seller_id FROM product_variants pv JOIN products p ON pv.product_id = p.id`,
  );
  const sellerMap = new Map<number, number>();
  for (const row of variantSellerMap) {
    sellerMap.set(row.variant_id, row.seller_id);
  }

  // Fill in seller_id
  for (const row of orderItemRows) {
    const variantId = row[1] as number; // row[1] = variant_id; row[2] is the seller_id placeholder
    row[2] = sellerMap.get(variantId) ?? sellerIds[0];
  }

  const orderItemIds = await bulkInsertReturningIds(
    "order_items",
    [
      "order_id",
      "variant_id",
      "seller_id",
      "quantity",
      "unit_price",
      "discount_amount",
      "created_at",
    ],
    orderItemRows,
    200,
  );
  console.log(`  order_items: ${orderItemIds.length} rows`);

  // Payments: 1 per order, ~15% have 2+ (split payments)
  const paymentRows: (string | number | boolean | null | Date | string[])[][] =
    [];
  for (let i = 0; i < orderIds.length; i++) {
    const orderId = orderIds[i];
    const _orderStatus = STATUSES[weightedPick([...STATUS_WEIGHTS])];
    const numPayments = faker.datatype.boolean({ probability: 0.15 })
      ? faker.number.int({ min: 2, max: 3 })
      : 1;
    for (let p = 0; p < numPayments; p++) {
      const method = PAYMENT_METHODS[weightedPick([...PAYMENT_WEIGHTS])];
      const amount = faker.number.float({
        min: 10,
        max: 500,
        fractionDigits: 2,
      });
      const paidAt = faker.datatype.boolean({ probability: 0.85 })
        ? faker.date.between({
            from: orderDates[i],
            to: new Date(orderDates[i].getTime() + 2 * 24 * 60 * 60 * 1000),
          })
        : null;
      const status = paidAt ? "CAPTURED" : "PENDING";
      const installments =
        method === "CREDIT_CARD" ? faker.number.int({ min: 1, max: 12 }) : 1;
      paymentRows.push([
        orderId,
        method,
        status,
        money(amount),
        paidAt,
        installments,
        new Date(),
      ]);
    }
  }
  await bulkInsertBatched(
    "payments",
    [
      "order_id",
      "method",
      "status",
      "amount",
      "paid_at",
      "installments",
      "created_at",
    ],
    paymentRows,
    200,
  );
  console.log(`  payments: ${paymentRows.length} rows`);

  // Shipments: for SHIPPED/DELIVERED orders only
  const shipmentRows: (string | number | boolean | null | Date | string[])[][] =
    [];
  for (let i = 0; i < orderIds.length; i++) {
    const _orderId = orderIds[i];
    const _orderDate = orderDates[i];
    // Need to check status — we'll fetch it
  }

  // Fetch order statuses to decide shipments
  const orderStatusRows = await query<{
    id: number;
    status: string;
    placed_at: Date;
  }>(`SELECT id, status, placed_at FROM orders ORDER BY id`);
  const orderStatusMap = new Map<number, { status: string; placedAt: Date }>();
  for (const row of orderStatusRows) {
    orderStatusMap.set(row.id, { status: row.status, placedAt: row.placed_at });
  }

  for (const orderId of orderIds) {
    const info = orderStatusMap.get(orderId);
    if (!info) continue;
    if (info.status === "SHIPPED" || info.status === "DELIVERED") {
      const warehouseId =
        warehouseIds[
          faker.number.int({ min: 0, max: warehouseIds.length - 1 })
        ];
      const shippedAt = new Date(
        info.placedAt.getTime() +
          faker.number.int({ min: 1, max: 48 }) * 60 * 60 * 1000,
      );
      // Delivery lead time varies by carrier/warehouse
      const leadTimeDays = faker.number.int({ min: 1, max: 14 });
      const deliveredAt =
        info.status === "DELIVERED"
          ? new Date(shippedAt.getTime() + leadTimeDays * 24 * 60 * 60 * 1000)
          : null;
      const shippingCost = faker.number.float({
        min: 5,
        max: 50,
        fractionDigits: 2,
      });
      shipmentRows.push([
        orderId,
        warehouseId,
        pick(CARRIERS),
        shippedAt,
        deliveredAt,
        faker.string.alphanumeric(12),
        money(shippingCost),
        new Date(),
      ]);
    }
  }
  await bulkInsertBatched(
    "shipments",
    [
      "order_id",
      "warehouse_id",
      "carrier",
      "shipped_at",
      "delivered_at",
      "tracking_code",
      "shipping_cost",
      "created_at",
    ],
    shipmentRows,
    200,
  );
  console.log(`  shipments: ${shipmentRows.length} rows`);

  // Returns: for ~3% of order items, mostly on REFUNDED orders
  const returnRows: (string | number | boolean | null | Date | string[])[][] =
    [];
  const reasons = [
    "DEFECTIVE",
    "WRONG_ITEM",
    "NOT_AS_DESCRIBED",
    "CHANGED_MIND",
    "DAMAGED_IN_TRANSIT",
    "LATE_DELIVERY",
  ] as const;
  const returnStatuses = [
    "REQUESTED",
    "APPROVED",
    "REJECTED",
    "REFUNDED",
    "EXCHANGED",
  ] as const;

  for (let i = 0; i < orderItemIds.length; i++) {
    if (faker.datatype.boolean({ probability: 0.03 })) {
      const orderItemId = orderItemIds[i];
      const requestedAt = faker.date.between({
        from: new Date("2022-06-01"),
        to: REFERENCE_DATE,
      });
      const reason = pick([...reasons]);
      const quantity = faker.number.int({ min: 1, max: 3 });
      const refundAmount = faker.number.float({
        min: 5,
        max: 200,
        fractionDigits: 2,
      });
      const status = pick([...returnStatuses]);
      const resolvedAt =
        status !== "REQUESTED"
          ? faker.date.between({
              from: requestedAt,
              to: new Date(requestedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
            })
          : null;
      returnRows.push([
        orderItemId,
        requestedAt,
        reason,
        quantity,
        money(refundAmount),
        status,
        resolvedAt,
        new Date(),
      ]);
    }
  }
  await bulkInsertBatched(
    "returns",
    [
      "order_item_id",
      "requested_at",
      "reason",
      "quantity",
      "refund_amount",
      "status",
      "resolved_at",
      "created_at",
    ],
    returnRows,
    200,
  );
  console.log(`  returns: ${returnRows.length} rows`);

  // Order coupons: ~15% of orders have a coupon applied
  const orderCouponRows: (
    | string
    | number
    | boolean
    | null
    | Date
    | string[]
  )[][] = [];
  for (const orderId of orderIds) {
    if (faker.datatype.boolean({ probability: 0.15 }) && couponIds.length > 0) {
      const couponId =
        couponIds[faker.number.int({ min: 0, max: couponIds.length - 1 })];
      const discountApplied = faker.number.float({
        min: 1,
        max: 50,
        fractionDigits: 2,
      });
      orderCouponRows.push([
        orderId,
        couponId,
        money(discountApplied),
        new Date(),
      ]);
    }
  }
  await bulkInsertBatched(
    "order_coupons",
    ["order_id", "coupon_id", "discount_applied", "created_at"],
    orderCouponRows,
    200,
  );
  console.log(`  order_coupons: ${orderCouponRows.length} rows`);

  return { orderIds };
}

/** Coupons — independent of orders. */
export async function seedCoupons(): Promise<{ ids: number[] }> {
  const count = scaledCount(50);
  const rows: (string | number | boolean | null | Date | string[])[][] = [];
  const discountTypes = ["PERCENT", "FIXED"] as const;

  for (let i = 0; i < count; i++) {
    const code = faker.string.alphanumeric(8).toUpperCase();
    const discountType = pick([...discountTypes]);
    const value =
      discountType === "PERCENT"
        ? faker.number.float({ min: 5, max: 50, fractionDigits: 2 })
        : faker.number.float({ min: 5, max: 100, fractionDigits: 2 });
    const validFrom = faker.date.between({
      from: new Date("2022-01-01"),
      to: new Date("2024-06-01"),
    });
    const validTo = new Date(
      validFrom.getTime() +
        faker.number.int({ min: 30, max: 365 }) * 24 * 60 * 60 * 1000,
    );
    const maxUses = faker.number.int({ min: 50, max: 10000 });
    const minOrderAmount = faker.number.float({
      min: 0,
      max: 100,
      fractionDigits: 2,
    });

    rows.push([
      code,
      discountType,
      money(value),
      validFrom,
      validTo,
      maxUses,
      money(minOrderAmount),
      new Date(),
    ]);
  }

  const ids = await bulkInsertReturningIds(
    "coupons",
    [
      "code",
      "discount_type",
      "value",
      "valid_from",
      "valid_to",
      "max_uses",
      "min_order_amount",
      "created_at",
    ],
    rows,
  );
  console.log(`  coupons: ${ids.length} rows`);
  return { ids };
}
