/** Carts + cart_items — mostly abandoned, some converted to orders. */

import { bulkInsertBatched, bulkInsertReturningIds } from "./db";
import { faker, REFERENCE_DATE, scaledCount } from "./faker";

export async function seedCarts(
  customerIds: number[],
  variantIds: number[],
  orderIds: number[],
): Promise<void> {
  const cartCount = scaledCount(6000);
  const cartRows: (string | number | boolean | null | Date | string[])[][] = [];

  // Shuffle order IDs so each is assigned to at most one cart (order_id is unique).
  const shuffledOrderIds = faker.helpers.shuffle([...orderIds]);
  let orderIdx = 0;
  const convertedCount = Math.floor(cartCount * 0.2);

  for (let i = 0; i < cartCount; i++) {
    const customerId = faker.datatype.boolean({ probability: 0.7 })
      ? customerIds[faker.number.int({ min: 0, max: customerIds.length - 1 })]
      : null;
    const sessionId = faker.string.uuid();
    const createdAt = faker.date.between({
      from: new Date("2022-06-01"),
      to: REFERENCE_DATE,
    });
    // First `convertedCount` carts get an order_id, rest are abandoned
    const orderId =
      i < convertedCount && orderIdx < shuffledOrderIds.length
        ? shuffledOrderIds[orderIdx++]
        : null;
    cartRows.push([customerId, sessionId, createdAt, createdAt, orderId]);
  }

  const cartIds = await bulkInsertReturningIds(
    "carts",
    ["customer_id", "session_id", "created_at", "updated_at", "order_id"],
    cartRows,
    200,
  );
  console.log(`  carts: ${cartIds.length} rows`);

  // Cart items: 1-5 per cart
  const itemCount = scaledCount(15000);
  const itemRows: (string | number | boolean | null | Date | string[])[][] = [];
  for (let i = 0; i < itemCount; i++) {
    const cartId =
      cartIds[faker.number.int({ min: 0, max: cartIds.length - 1 })];
    const variantId =
      variantIds[faker.number.int({ min: 0, max: variantIds.length - 1 })];
    const quantity = faker.number.int({ min: 1, max: 5 });
    itemRows.push([cartId, variantId, quantity, new Date()]);
  }
  await bulkInsertBatched(
    "cart_items",
    ["cart_id", "variant_id", "quantity", "added_at"],
    itemRows,
    200,
  );
  console.log(`  cart_items: ${itemCount} rows`);
}
