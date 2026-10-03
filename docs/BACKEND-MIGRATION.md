# Backend review and integration

Source reviewed: [anshu51379/ecommerce-backend](https://github.com/anshu51379/ecommerce-backend), `main` at commit `e5f964a53d5b10966b9d155982f3fa800964f561` (27 November 2023). All four controllers, four schemas, routes, authentication middleware, JWT helper, startup and dependency manifest were inspected.

## Why the deployed frontend had no working backend

The Vercel project built only `frontend`, while the Express server lived outside that Root Directory. Its catch-all SPA rewrite returned HTML for `/api` requests. Vite's development proxy does not run on a static production deployment. A successful storefront build therefore could not establish a MongoDB connection or process authentication/orders.

The canonical backend now lives in `frontend/server`, which is an npm workspace and a local dependency of the web package. `frontend/api/index.js` deploys it within the existing Vercel root; `api/index.js` provides the repository-root alternative. Both send `/api/*` to Express before the SPA fallback. Integrated builds use `/api` even if old public API environment variables remain configured.

## Findings and resulting behavior

| Original implementation | Integrated implementation |
| --- | --- |
| Express 4 / Mongoose 7, nodemon as the start command, obsolete MongoDB connection options | Express 5 / Mongoose 9, Node 24, production Node entrypoint and Vercel request handler |
| Server started regardless of database connection failure | Node startup validates configuration and waits for MongoDB; Vercel returns a safe JSON 503 on failure |
| No authenticated middleware attached to most write/private routes | Bearer JWT authentication plus customer/seller and ownership checks |
| JWT payload `{ userId }`, HS256, 10-day expiry | Existing format remains valid when the same secret is retained; permissions come from the account collection |
| Registration accepted arbitrary fields, including role | Registration allowlists identity fields and fixes the role; legacy role values cannot grant customer accounts seller access |
| Email stored with original case | New emails normalized; existing mixed-case emails matched case-insensitively without rewriting records |
| Client supplied buyer, prices, totals and successful payment claims | Server reads current products, supplies identities/totals and records cash-on-delivery as Pending |
| Broad account/product updates | Updates limited to allowed fields and owned records |
| Public cart, order and seller/customer-interest reads | Self/ownership checks guard private data |
| Seller history could include another seller's lines in a mixed order | Seller history and metrics use only that seller's products |
| Product bulk deletion looked up deleted IDs after deleting them | Capture product IDs before deletion and remove those items from saved carts |
| Review author and purchase supplied/trusted by client | Reviewer comes from authentication; a stored purchase is required |
| Search interpolated input as a regular expression | Search escapes user input and limits its length |
| Permissive CORS, no limits or security headers | Helmet, configurable allowed origins, bounded bodies, request limits and uncached API responses |
| No AI service boundary | Public-catalogue shortlist plus optional server-only provider adapter with fallback |

## Data compatibility

The existing model names still map to **`customers`, `sellers`, `products`, `orders`**. Connect `MONGO_URL` to the original database name to reuse your existing records. There is no automatic data import, destructive migration or default admin account.

- Customer records retain names, emails, bcrypt password hashes, `cartDetails` product snapshots and `shippingData`.
- Seller records retain names, emails, bcrypt password hashes and unique `shopName`. Legacy `Shopcart` sellers sign in as Seller; authorization derives from the sellers collection.
- Products retain `price.mrp`, `price.cost`, `price.discountPercent`, image/category/subcategory fields, seller references, reviews and timestamps. `quantity` was historically a purchase default, not an inventory counter.
- Orders retain buyer/shipping details, `orderedProducts` snapshots, quantities, totals, statuses and historic timestamps. Old payment claims are not changed or treated as independently verified payments. New cash-on-delivery orders add `paymentInfo.method`, use Pending, and omit `paidAt` until payment is actually received.
- Old raw JWTs should be sent as `Authorization: Bearer <token>` by updated clients. Token signatures stay compatible if `SECRET_KEY` stays the same. A new secret deliberately invalidates old sessions.

## API contract

The following routes are prefixed with **`/api`** for the integrated Vercel deployment and production storefront. The persistent Node server also supports their original root URLs.

| Method | Route | Access |
| --- | --- | --- |
| POST | `/CustomerRegister`, `/CustomerLogin`, `/SellerRegister`, `/SellerLogin` | Public, rate limited |
| GET | `/health`, `/getProducts`, `/getProductDetail/:id` | Public |
| GET | `/searchProduct/:key`, `/searchProductbyCategory/:key`, `/searchProductbySubCategory/:key` | Public |
| POST | `/ProductCreate` | Seller; server supplies seller identity |
| GET | `/getSellerProducts/:id`, `/getAddedToCartProducts/:id` | Seller's own account |
| GET | `/getInterestedCustomers/:id` | Product owner |
| PUT | `/ProductUpdate/:id` | Product owner |
| DELETE | `/DeleteProduct/:id`, `/DeleteProducts/:id` | Product owner / seller's own account |
| PUT | `/addReview/:id` | Customer who purchased the product |
| PUT | `/deleteProductReview/:id` | Review author or product owner |
| DELETE | `/deleteAllProductReviews/:id` | Product owner |
| GET / PUT | `/getCartDetail/:id` / `/CustomerUpdate/:id` | Customer's own account |
| POST | `/newOrder` | Customer; database prices and authenticated buyer |
| GET | `/getOrderedProductsByCustomer/:id` | Customer's own account |
| GET | `/getOrderedProductsBySeller/:id`, `/seller/metrics` | Seller's own account |
| POST | `/ai/recommend` | Public, rate limited; public catalogue only |

Checkout accepts `orderedProducts` containing product `_id` and integer `quantity` (1–99), plus a complete shipping address. Buyer IDs, client prices/totals and client payment status are ignored. The response is the persisted order. The existing frontend response shapes are preserved, including empty catalogue arrays and legacy message responses where its dashboards expect them.

## Runtime configuration and verification

Only the hosting/database owner can supply the private MongoDB connection string and `SECRET_KEY`; neither repository contains them. The API and seed command accept `MONGO_URL` or the `MONGODB_URI` supplied by Vercel's MongoDB integration. An explicit `MONGO_URL` takes priority, so remove a stale value when deliberately switching to a fresh integration database. Set the variables in the Vercel project for the deployment environment, ensure database network access, and redeploy. A separate preview database avoids test orders in the live store. `/api/health` must return HTTP 200 and `status: "ok"` before treating deployed commerce as ready.

The Vercel handler shares a MongoDB connection promise across concurrent requests, limits the connection pool, avoids disconnecting after each request, and retries after failed connection attempts. Configuration/connection errors return JSON 503 without leaking connection strings or driver messages. The persistent Node server waits for the database and shuts down gracefully.

Automated verification includes raw records using the old schema shapes, mixed-case logins, old JWT payloads, Shopcart sellers, protected customer roles, historical orders, current catalogue matching, server-authoritative order totals, API routing and database failure/recovery. Browser checkout and seller product creation exercise the built React frontend and real HTTP API on desktop and mobile. No production database is contacted by these checks.
