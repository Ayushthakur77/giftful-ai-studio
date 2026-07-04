/**
 * Portable PostgreSQL schema. No RLS, no vendor-specific extensions.
 * - UUIDv4 PKs via `gen_random_uuid()` (pgcrypto — standard)
 * - Money in `paise` (int)
 * - Timestamps on every business entity
 * - Explicit FK ON DELETE behavior
 * - Indexes on FKs and lookup columns
 *
 * PHASE 4a implements: users, accounts, sessions, verification_tokens,
 * user_roles, audit_logs. Everything else is defined as stubs so 4b/4c
 * add business logic without schema churn.
 */
import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------
export const appRoleEnum = pgEnum("app_role", ["super_admin", "staff", "customer"]);
export const authProviderEnum = pgEnum("auth_provider", ["credentials", "google"]);
export const productStatusEnum = pgEnum("product_status", ["draft", "active", "archived"]);
export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "pending_payment",
  "paid",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refund_requested",
  "refunded",
  "returned",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "created",
  "authorized",
  "captured",
  "failed",
  "refunded",
]);
export const inventoryMovementEnum = pgEnum("inventory_movement", [
  "in",
  "out",
  "reserved",
  "released",
  "damaged",
  "returned",
]);

// ---------- Auth (fully implemented for 4a) ----------
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    email: varchar("email", { length: 320 }).notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    name: varchar("name", { length: 200 }),
    passwordHash: text("password_hash"), // null for OAuth-only users
    avatarUrl: text("avatar_url"),
    phone: varchar("phone", { length: 20 }),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    emailUniq: uniqueIndex("users_email_uniq").on(t.email),
  }),
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: authProviderEnum("provider").notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    providerUniq: uniqueIndex("accounts_provider_uniq").on(t.provider, t.providerAccountId),
    userIdx: index("accounts_user_idx").on(t.userId),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ip: varchar("ip", { length: 64 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tokenUniq: uniqueIndex("sessions_token_uniq").on(t.tokenHash),
    userIdx: index("sessions_user_idx").on(t.userId),
    expIdx: index("sessions_exp_idx").on(t.expiresAt),
  }),
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    purpose: varchar("purpose", { length: 32 }).notNull(), // 'email_verify' | 'password_reset'
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tokenUniq: uniqueIndex("vt_token_uniq").on(t.tokenHash),
    userIdx: index("vt_user_idx").on(t.userId),
  }),
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: appRoleEnum("role").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    grantedBy: uuid("granted_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.role] }),
    roleIdx: index("user_roles_role_idx").on(t.role),
  }),
);

// ---------- Audit ----------
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }),
    entityId: varchar("entity_id", { length: 64 }),
    before: jsonb("before"),
    after: jsonb("after"),
    ip: varchar("ip", { length: 64 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    actorIdx: index("audit_actor_idx").on(t.actorId),
    actionIdx: index("audit_action_idx").on(t.action),
    entityIdx: index("audit_entity_idx").on(t.entityType, t.entityId),
    createdIdx: index("audit_created_idx").on(t.createdAt),
  }),
);

// ---------- Addresses ----------
export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 40 }),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    line1: varchar("line1", { length: 200 }).notNull(),
    line2: varchar("line2", { length: 200 }),
    city: varchar("city", { length: 80 }).notNull(),
    state: varchar("state", { length: 80 }).notNull(),
    pincode: varchar("pincode", { length: 12 }).notNull(),
    country: varchar("country", { length: 2 }).notNull().default("IN"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userIdx: index("addr_user_idx").on(t.userId) }),
);

// ---------- Catalog (stubs, 4b) ----------
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    parentId: uuid("parent_id"),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    iconUrl: text("icon_url"),
    bannerUrl: text("banner_url"),
    displayOrder: integer("display_order").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    seoTitle: varchar("seo_title", { length: 200 }),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    slugUniq: uniqueIndex("categories_slug_uniq").on(t.slug),
    parentIdx: index("categories_parent_idx").on(t.parentId),
  }),
);

export const occasions = pgTable(
  "occasions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    iconUrl: text("icon_url"),
    startsOn: timestamp("starts_on", { withTimezone: true }),
    endsOn: timestamp("ends_on", { withTimezone: true }),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ slugUniq: uniqueIndex("occasions_slug_uniq").on(t.slug) }),
);

export const recipientTypes = pgTable(
  "recipient_types",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    isVisible: boolean("is_visible").notNull().default(true),
  },
  (t) => ({ slugUniq: uniqueIndex("recipients_slug_uniq").on(t.slug) }),
);

// ---------- Products (stubs, 4b) ----------
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sku: varchar("sku", { length: 64 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    shortDescription: text("short_description"),
    description: text("description"),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    brand: varchar("brand", { length: 120 }),
    tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    status: productStatusEnum("status").notNull().default("draft"),
    isVisible: boolean("is_visible").notNull().default(true),
    // prices in paise
    pricePaise: integer("price_paise").notNull(),
    salePricePaise: integer("sale_price_paise"),
    costPricePaise: integer("cost_price_paise"),
    taxPercent: integer("tax_percent").notNull().default(0),
    weightGrams: integer("weight_grams"),
    stock: integer("stock").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
    rating: integer("rating_x100").notNull().default(0), // 0-500 (4.32 → 432)
    reviewCount: integer("review_count").notNull().default(0),
    isFeatured: boolean("is_featured").notNull().default(false),
    isTrending: boolean("is_trending").notNull().default(false),
    isBestSeller: boolean("is_best_seller").notNull().default(false),
    isPersonalizable: boolean("is_personalizable").notNull().default(false),
    isGiftBoxCompatible: boolean("is_gift_box_compatible").notNull().default(false),
    seoTitle: varchar("seo_title", { length: 200 }),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    skuUniq: uniqueIndex("products_sku_uniq").on(t.sku),
    slugUniq: uniqueIndex("products_slug_uniq").on(t.slug),
    catIdx: index("products_cat_idx").on(t.categoryId),
    statusIdx: index("products_status_idx").on(t.status),
  }),
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: varchar("alt", { length: 200 }),
    position: integer("position").notNull().default(0),
  },
  (t) => ({ prodIdx: index("prod_img_prod_idx").on(t.productId) }),
);

export const productOccasions = pgTable(
  "product_occasions",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    occasionId: uuid("occasion_id")
      .notNull()
      .references(() => occasions.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.productId, t.occasionId] }) }),
);

export const productRecipients = pgTable(
  "product_recipients",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => recipientTypes.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.productId, t.recipientId] }) }),
);

export const personalizationFields = pgTable(
  "personalization_fields",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 120 }).notNull(),
    fieldType: varchar("field_type", { length: 32 }).notNull(), // text | image | date | select
    required: boolean("required").notNull().default(false),
    maxLength: integer("max_length"),
    options: jsonb("options").$type<string[]>(),
    priceDeltaPaise: integer("price_delta_paise").notNull().default(0),
    position: integer("position").notNull().default(0),
  },
  (t) => ({ prodIdx: index("pf_prod_idx").on(t.productId) }),
);

// ---------- Gift boxes (stubs) ----------
export const giftBoxes = pgTable("gift_boxes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug", { length: 200 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  kind: varchar("kind", { length: 16 }).notNull(), // 'empty' | 'ready'
  description: text("description"),
  material: varchar("material", { length: 80 }),
  color: varchar("color", { length: 40 }),
  shape: varchar("shape", { length: 40 }),
  capacity: integer("capacity").notNull().default(1),
  maxWeightGrams: integer("max_weight_grams"),
  basePricePaise: integer("base_price_paise").notNull().default(0),
  salePricePaise: integer("sale_price_paise"),
  imageUrl: text("image_url"),
  status: productStatusEnum("status").notNull().default("draft"),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const giftBoxItems = pgTable(
  "gift_box_items",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    boxId: uuid("box_id")
      .notNull()
      .references(() => giftBoxes.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull().default(1),
  },
  (t) => ({ boxIdx: index("gbi_box_idx").on(t.boxId) }),
);

// ---------- Commerce (stubs) ----------
export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userIdx: index("carts_user_idx").on(t.userId) }),
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "restrict" }),
    giftBoxId: uuid("gift_box_id").references(() => giftBoxes.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull().default(1),
    personalization: jsonb("personalization"),
    unitPricePaise: integer("unit_price_paise").notNull(),
  },
  (t) => ({ cartIdx: index("ci_cart_idx").on(t.cartId) }),
);

export const wishlists = pgTable(
  "wishlists",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.productId] }) }),
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orderNumber: varchar("order_number", { length: 32 }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    status: orderStatusEnum("status").notNull().default("draft"),
    subtotalPaise: integer("subtotal_paise").notNull().default(0),
    discountPaise: integer("discount_paise").notNull().default(0),
    shippingPaise: integer("shipping_paise").notNull().default(0),
    taxPaise: integer("tax_paise").notNull().default(0),
    totalPaise: integer("total_paise").notNull().default(0),
    couponCode: varchar("coupon_code", { length: 60 }),
    shippingAddress: jsonb("shipping_address"),
    billingAddress: jsonb("billing_address"),
    notes: text("notes"),
    placedAt: timestamp("placed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    numUniq: uniqueIndex("orders_num_uniq").on(t.orderNumber),
    userIdx: index("orders_user_idx").on(t.userId),
    statusIdx: index("orders_status_idx").on(t.status),
  }),
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    giftBoxId: uuid("gift_box_id").references(() => giftBoxes.id, { onDelete: "set null" }),
    name: varchar("name", { length: 200 }).notNull(),
    quantity: integer("quantity").notNull(),
    unitPricePaise: integer("unit_price_paise").notNull(),
    totalPaise: integer("total_paise").notNull(),
    personalization: jsonb("personalization"),
  },
  (t) => ({ orderIdx: index("oi_order_idx").on(t.orderId) }),
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).notNull(),
    providerOrderId: varchar("provider_order_id", { length: 120 }),
    providerPaymentId: varchar("provider_payment_id", { length: 120 }),
    status: paymentStatusEnum("status").notNull().default("created"),
    amountPaise: integer("amount_paise").notNull(),
    currency: varchar("currency", { length: 8 }).notNull().default("INR"),
    signature: text("signature"),
    raw: jsonb("raw"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orderIdx: index("pay_order_idx").on(t.orderId),
    providerIdx: index("pay_provider_idx").on(t.providerOrderId),
  }),
);

// ---------- Marketing (stubs) ----------
export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    code: varchar("code", { length: 60 }).notNull(),
    description: text("description"),
    discountType: varchar("discount_type", { length: 16 }).notNull(), // 'percent' | 'flat'
    discountValue: integer("discount_value").notNull(), // percent 0-100 OR paise
    minSubtotalPaise: integer("min_subtotal_paise").notNull().default(0),
    maxDiscountPaise: integer("max_discount_paise"),
    usageLimit: integer("usage_limit"),
    perUserLimit: integer("per_user_limit"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ codeUniq: uniqueIndex("coupons_code_uniq").on(t.code) }),
);

export const couponUsage = pgTable(
  "coupon_usage",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ couponIdx: index("cu_coupon_idx").on(t.couponId) }),
);

export const homepageSections = pgTable("homepage_sections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  kind: varchar("kind", { length: 40 }).notNull(),
  title: varchar("title", { length: 200 }),
  subtitle: text("subtitle"),
  config: jsonb("config"),
  position: integer("position").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"),
  headline: varchar("headline", { length: 200 }),
  subheadline: varchar("subheadline", { length: 300 }),
  position: integer("position").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
});

// ---------- Ops (stubs) ----------
export const inventory = pgTable(
  "inventory",
  {
    productId: uuid("product_id")
      .primaryKey()
      .references(() => products.id, { onDelete: "cascade" }),
    onHand: integer("on_hand").notNull().default(0),
    reserved: integer("reserved").notNull().default(0),
    incoming: integer("incoming").notNull().default(0),
    damaged: integer("damaged").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    type: inventoryMovementEnum("type").notNull(),
    delta: integer("delta").notNull(),
    reason: varchar("reason", { length: 200 }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ prodIdx: index("im_prod_idx").on(t.productId) }),
);

export const stockReservations = pgTable(
  "stock_reservations",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => ({ prodIdx: index("sr_prod_idx").on(t.productId) }),
);

export const deliveryZones = pgTable("delivery_zones", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  state: varchar("state", { length: 80 }).notNull(),
  basePaise: integer("base_paise").notNull().default(0),
  expressPaise: integer("express_paise"),
  sameDayAvailable: boolean("same_day_available").notNull().default(false),
});

// ---------- Support (stubs) ----------
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    rating: integer("rating").notNull(), // 1-5
    title: varchar("title", { length: 200 }),
    body: text("body"),
    isApproved: boolean("is_approved").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    prodIdx: index("reviews_prod_idx").on(t.productId),
    userIdx: index("reviews_user_idx").on(t.userId),
  }),
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 40 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userIdx: index("notif_user_idx").on(t.userId) }),
);

// ---------- Config ----------
export const storeSettings = pgTable("store_settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: jsonb("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- AI logs ----------
export const aiLogs = pgTable(
  "ai_logs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    kind: varchar("kind", { length: 40 }).notNull(),
    model: varchar("model", { length: 120 }),
    input: jsonb("input"),
    output: jsonb("output"),
    tokensIn: integer("tokens_in"),
    tokensOut: integer("tokens_out"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ userIdx: index("ai_logs_user_idx").on(t.userId) }),
);
