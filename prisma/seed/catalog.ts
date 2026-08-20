/** Catalog: categories (tree), products, variants, product_suppliers, inventory. */

import { bulkInsertBatched, bulkInsertReturningIds, query } from "./db";
import {
  faker,
  money,
  pick,
  pickMany,
  REFERENCE_DATE,
  scaledCount,
} from "./faker";

const PRODUCT_COLORS = [
  "red",
  "blue",
  "green",
  "black",
  "white",
  "yellow",
  "purple",
  "orange",
  "gray",
  "brown",
];
const PRODUCT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const MATERIALS = [
  "cotton",
  "polyester",
  "wool",
  "leather",
  "plastic",
  "metal",
  "wood",
  "glass",
  "ceramic",
  "bamboo",
];
const _TAGS_POOL = [
  "vip",
  "newsletter",
  "wholesale",
  "returns-often",
  "high-value",
  "frequent-buyer",
  "new",
  "international",
];

/** Category tree: 3-4 levels, ~80 nodes. */
export async function seedCategories(): Promise<{ ids: number[] }> {
  const roots = [
    "Electronics",
    "Fashion",
    "Home & Garden",
    "Sports & Outdoors",
    "Books & Media",
    "Health & Beauty",
    "Toys & Games",
    "Food & Beverage",
  ];
  const subcats: Record<string, string[]> = {
    Electronics: ["Computers", "Phones", "Audio", "Cameras", "Accessories"],
    Fashion: ["Men's Clothing", "Women's Clothing", "Shoes", "Bags", "Jewelry"],
    "Home & Garden": [
      "Furniture",
      "Kitchen",
      "Decor",
      "Garden Tools",
      "Lighting",
    ],
    "Sports & Outdoors": [
      "Fitness",
      "Cycling",
      "Camping",
      "Water Sports",
      "Winter Sports",
    ],
    "Books & Media": ["Fiction", "Non-Fiction", "Textbooks", "Movies", "Music"],
    "Health & Beauty": [
      "Skincare",
      "Haircare",
      "Supplements",
      "Makeup",
      "Fragrance",
    ],
    "Toys & Games": [
      "Board Games",
      "Action Figures",
      "Puzzles",
      "Educational",
      "Outdoor Toys",
    ],
    "Food & Beverage": [
      "Coffee & Tea",
      "Snacks",
      "Beverages",
      "Pantry",
      "Organic",
    ],
  };
  const leafcats: string[] = [
    "Budget",
    "Standard",
    "Premium",
    "Eco",
    "Refurbished",
  ];

  const rows: (string | number | boolean | null | Date | string[])[][] = [];
  // Level 0: roots (parent_id = null)
  for (const name of roots) {
    rows.push([name, faker.helpers.slugify(name).toLowerCase(), null]);
  }
  // Insert roots and get IDs
  const rootIds = await bulkInsertReturningIds(
    "categories",
    ["name", "slug", "parent_id"],
    rows,
    100,
  );

  // Level 1: subcategories
  const level1Rows: (string | number | boolean | null | Date | string[])[][] =
    [];
  for (let i = 0; i < roots.length; i++) {
    const subs = subcats[roots[i]] ?? [];
    for (const sub of subs) {
      level1Rows.push([
        sub,
        faker.helpers.slugify(sub).toLowerCase(),
        rootIds[i],
      ]);
    }
  }
  const level1Ids = await bulkInsertReturningIds(
    "categories",
    ["name", "slug", "parent_id"],
    level1Rows,
    100,
  );

  // Level 2: leaf categories (some, not all level1 have children)
  const level2Rows: (string | number | boolean | null | Date | string[])[][] =
    [];
  for (let i = 0; i < level1Ids.length; i++) {
    // ~60% of level1 categories get leaf children
    if (faker.datatype.boolean({ probability: 0.6 })) {
      const numLeaves = faker.number.int({ min: 1, max: 3 });
      const chosen = pickMany(leafcats, numLeaves);
      for (const leaf of chosen) {
        const fullName = `${leaf}`;
        level2Rows.push([
          fullName,
          faker.helpers.slugify(`${leaf}-${i}`).toLowerCase(),
          level1Ids[i],
        ]);
      }
    }
  }
  const level2Ids = await bulkInsertReturningIds(
    "categories",
    ["name", "slug", "parent_id"],
    level2Rows,
    100,
  );

  // Level 3: a few level2 categories get children (rare, for deeper recursion)
  const level3Rows: (string | number | boolean | null | Date | string[])[][] =
    [];
  for (let i = 0; i < level2Ids.length; i++) {
    if (faker.datatype.boolean({ probability: 0.3 })) {
      level3Rows.push([
        "Special Edition",
        faker.helpers.slugify(`special-${i}`).toLowerCase(),
        level2Ids[i],
      ]);
    }
  }
  await bulkInsertBatched(
    "categories",
    ["name", "slug", "parent_id"],
    level3Rows,
    100,
  );

  const allIds = [...rootIds, ...level1Ids, ...level2Ids];
  console.log(
    `  categories: ${allIds.length + level3Rows.length} rows (3-4 level tree)`,
  );
  return { ids: allIds };
}

/** Products + variants + suppliers + inventory. Needs seller IDs and category IDs. */
export async function seedCatalog(
  sellerIds: number[],
  categoryIds: number[],
  supplierIds: number[],
  warehouseIds: number[],
): Promise<{
  productIds: number[];
  variantIds: number[];
}> {
  const productCount = scaledCount(1500);
  const productRows: (string | number | boolean | null | Date | string[])[][] =
    [];

  for (let i = 0; i < productCount; i++) {
    const name = faker.commerce.productName();
    // Pareto: most products from a small subset of sellers
    const sellerIdx = faker.number.int({
      min: 0,
      max: Math.max(0, sellerIds.length - 1),
    });
    const catIdx = faker.number.int({
      min: 0,
      max: Math.max(0, categoryIds.length - 1),
    });
    const basePrice = faker.number.float({
      min: 5,
      max: 500,
      fractionDigits: 2,
    });
    // Some products have NULL description (~15%) and NULL weight (~20%)
    const description = faker.datatype.boolean({ probability: 0.85 })
      ? faker.commerce.productDescription()
      : null;
    const weightGrams = faker.datatype.boolean({ probability: 0.8 })
      ? faker.number.int({ min: 50, max: 5000 })
      : null;
    const isPublished = faker.datatype.boolean({ probability: 0.88 });
    const discontinuedAt = faker.datatype.boolean({ probability: 0.08 })
      ? faker.date.between({ from: new Date("2024-01-01"), to: REFERENCE_DATE })
      : null;
    const createdAt = faker.date.between({
      from: new Date("2022-01-01"),
      to: REFERENCE_DATE,
    });

    // jsonb attributes — stable-ish keys per product
    const attributes: Record<string, unknown> = {
      color: pick(PRODUCT_COLORS),
      material: pick(MATERIALS),
      warranty_months: faker.number.int({ min: 0, max: 36 }),
    };
    // Some products have extra attributes
    if (faker.datatype.boolean({ probability: 0.4 })) {
      attributes.size = pick(PRODUCT_SIZES);
    }
    if (faker.datatype.boolean({ probability: 0.3 })) {
      attributes.brand = faker.company.name();
    }

    productRows.push([
      sellerIds[sellerIdx],
      categoryIds[catIdx],
      name,
      description,
      money(basePrice),
      JSON.stringify(attributes),
      isPublished,
      createdAt,
      discontinuedAt,
      weightGrams,
    ]);
  }

  const productIds = await bulkInsertReturningIds(
    "products",
    [
      "seller_id",
      "category_id",
      "name",
      "description",
      "base_price",
      "attributes",
      "is_published",
      "created_at",
      "discontinued_at",
      "weight_grams",
    ],
    productRows,
    200,
  );
  console.log(`  products: ${productIds.length} rows`);

  // Variants: ~2.5 per product on average
  const variantCount = scaledCount(4000);
  const variantRows: (string | number | boolean | null | Date | string[])[][] =
    [];
  let skuCounter = 1;
  for (let i = 0; i < variantCount; i++) {
    const productIdx = faker.number.int({ min: 0, max: productIds.length - 1 });
    const productId = productIds[productIdx];
    const optionName = pick(["size", "color", "capacity", "bundle", "edition"]);
    const optionValue =
      optionName === "size"
        ? pick(PRODUCT_SIZES)
        : optionName === "color"
          ? pick(PRODUCT_COLORS)
          : optionName === "capacity"
            ? pick(["16GB", "32GB", "64GB", "128GB", "256GB"])
            : faker.commerce.productAdjective();
    const priceAdj = faker.number.float({
      min: -20,
      max: 50,
      fractionDigits: 2,
    });
    const basePrice = faker.number.float({
      min: 5,
      max: 500,
      fractionDigits: 2,
    });
    const price = Math.max(1, basePrice + priceAdj);
    const barcode = faker.datatype.boolean({ probability: 0.7 })
      ? faker.string.numeric(13)
      : null;

    variantRows.push([
      productId,
      `SKU-${skuCounter.toString().padStart(6, "0")}`,
      optionName,
      optionValue,
      money(price),
      barcode,
      new Date(),
    ]);
    skuCounter++;
  }

  const variantIds = await bulkInsertReturningIds(
    "product_variants",
    [
      "product_id",
      "sku",
      "option_name",
      "option_value",
      "price",
      "barcode",
      "created_at",
    ],
    variantRows,
    200,
  );
  console.log(`  product_variants: ${variantIds.length} rows`);

  // Product suppliers: M:N with payload
  const psCount = scaledCount(3000);
  const psRows: (string | number | boolean | null | Date | string[])[][] = [];
  for (let i = 0; i < psCount; i++) {
    const productId =
      productIds[faker.number.int({ min: 0, max: productIds.length - 1 })];
    const supplierId =
      supplierIds[faker.number.int({ min: 0, max: supplierIds.length - 1 })];
    const unitCost = faker.number.float({
      min: 2,
      max: 200,
      fractionDigits: 2,
    });
    psRows.push([
      productId,
      supplierId,
      money(unitCost),
      faker.datatype.boolean({ probability: 0.3 }),
      new Date(),
    ]);
  }
  // Use ON CONFLICT to handle composite PK duplicates
  await bulkInsertWithConflict(
    "product_suppliers",
    ["product_id", "supplier_id", "unit_cost", "is_primary", "created_at"],
    psRows,
    ["product_id", "supplier_id"],
  );
  console.log(`  product_suppliers: ${psCount} rows`);

  // Inventory: stock per variant per warehouse
  const invCount = scaledCount(12000);
  const invRows: (string | number | boolean | null | Date | string[])[][] = [];
  for (let i = 0; i < invCount; i++) {
    const variantId =
      variantIds[faker.number.int({ min: 0, max: variantIds.length - 1 })];
    const warehouseId =
      warehouseIds[faker.number.int({ min: 0, max: warehouseIds.length - 1 })];
    const onHand = faker.number.int({ min: 0, max: 500 });
    const reserved = faker.number.int({ min: 0, max: Math.min(50, onHand) });
    const restockedAt = faker.datatype.boolean({ probability: 0.7 })
      ? faker.date.between({ from: new Date("2024-06-01"), to: REFERENCE_DATE })
      : null;
    invRows.push([
      variantId,
      warehouseId,
      onHand,
      reserved,
      restockedAt,
      new Date(),
    ]);
  }
  await bulkInsertWithConflict(
    "inventory",
    [
      "variant_id",
      "warehouse_id",
      "quantity_on_hand",
      "quantity_reserved",
      "restocked_at",
      "updated_at",
    ],
    invRows,
    ["variant_id", "warehouse_id"],
  );
  console.log(`  inventory: ${invCount} rows`);

  return { productIds, variantIds };
}

/** Bulk insert with ON CONFLICT DO NOTHING for composite-PK tables. */
async function bulkInsertWithConflict(
  table: string,
  columns: string[],
  rows: (string | number | boolean | null | Date | string[])[][],
  conflictCols: string[],
  batchSize = 500,
): Promise<void> {
  const { bulkInsert } = await import("./db");
  const conflictTarget = conflictCols.map((c) => `"${c}"`).join(", ");
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { text, values } = bulkInsert(table, columns, batch);
    await (await import("./db")).pool.query(
      `${text} ON CONFLICT (${conflictTarget}) DO NOTHING`,
      values,
    );
  }
}

/** Fetch all IDs of a table (ordered by id). */
export async function fetchIds(table: string): Promise<number[]> {
  const rows = await query<{ id: number }>(
    `SELECT id FROM "${table}" ORDER BY id`,
  );
  return rows.map((r) => r.id);
}
