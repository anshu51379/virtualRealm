# Virtual Realm

An ecommerce marketplace for customers and independent sellers, built with React, Express, and MongoDB. This modernization keeps the original collections and API route names while replacing the retired Create React App tooling and redesigning the shopping experience.

## What's new

- React 19, Vite 8, React Router 7, Redux Toolkit 2, Material UI 9, Express 5, and Mongoose 9 on Node 24 LTS.
- Responsive storefront, original local product illustrations, category filters, search, sorting, product detail pages, and shopper/seller sign-in.
- Bearer authentication, role and ownership checks, limited account/product updates, validated order lines, and prices calculated from the database.
- Cash-on-delivery checkout; cart contents remain intact when order submission fails. No card numbers or CVVs are collected.
- Seller metrics calculated from actual orders and products, replacing the old sample charts. Order value includes unpaid orders and is not collected revenue.
- A shopping helper with catalogue/budget matching, plus a server-only provider adapter for future AI enhancements.
- Locked workspace dependencies plus an independent frontend deployment lock, production builds, API integration tests, browser tests, and GitHub Actions checks.

## Quick preview (no database required)

Install Node 24, then run from the repository root:

```sh
npm ci
npm run demo
```

Open http://127.0.0.1:3000. The preview uses an explicitly labelled sample collection. Browsing and the shopping helper work; registration, cart persistence, and orders require the database mode. Preview mode cannot start with `NODE_ENV=production`.

## Full application

Copy `backend/.env.example` to `backend/.env`. Set:

- `MONGO_URL`: your MongoDB connection string (MongoDB 8 recommended; back up an existing database before upgrading its server).
- `SECRET_KEY`: a random secret of at least 32 characters. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- `CLIENT_ORIGIN`: permitted frontend origins, separated by commas.

Then run:

```sh
npm ci
npm run dev
```

The web app runs on http://127.0.0.1:3000 and the API on port 5000. Vite proxies `/api` to the API server. `VITE_API_URL` is optional; set it in `frontend/.env` only when using an API on another origin. Only variables beginning with `VITE_` are exposed to the browser; never put an AI key or JWT secret there.

Register a seller and add products using the seller dashboard. Register a shopper, add products to the bag, complete a shipping address, and place a cash-on-delivery order. The server supplies the buyer identity, seller identity, product prices, and pending payment status.

Optional sample products can be inserted into a development database after creating a seller. Set `SEED_SELLER_ID` to that seller's ID and run `npm run seed`. The seed creates no passwords and preserves existing products.

## AI extension

`POST /ai/recommend` accepts `{ "query": "headphones under 3000" }`. Without provider configuration, it returns matching public products with `mode: "catalog-search"`; this is deterministic search, not an LLM. The helper labels this distinction in the UI.

To enable model explanations, set `AI_API_KEY`, `AI_MODEL`, and optionally `AI_BASE_URL` in the **backend environment**. The adapter supports an HTTPS chat-completions endpoint. A provider request receives only the shopper's query and public product names, categories, and prices. Keys remain server-side. Provider failures/timeouts fall back to catalogue search. Suggestions never place orders or change prices.

See [docs/AI-ROADMAP.md](docs/AI-ROADMAP.md) for the extension boundary and next steps. A real provider was not called during automated checks; validate your selected provider/model before enabling it publicly.

## Checks

```sh
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
npm run check:frontend-deploy
npm audit
```

API integration tests use an isolated ephemeral MongoDB instance, never your configured database. Browser checks cover desktop/mobile browsing, category filtering, product details, preview sign-in errors, helper results, and malformed saved sessions. GitHub Actions runs the same checks, including a clean production build using only the frontend folder.

## Production hosting

### Vercel storefront

The checked-in `vercel.json` files explicitly select Vite, install locked dependencies including build tools, build the storefront, and provide client-side route rewrites. They support either the repository root or `frontend` as the Vercel project's Root Directory. Use Node 24. The frontend has its own lockfile and an explicit standalone install command, so deploying from `frontend` does not require the backend or root workspace files. The output is `frontend/dist` from the repository root, or `dist` from `frontend`; the old CRA `build` directory is no longer used.

Set `VITE_API_URL` to the HTTPS URL of the separately deployed backend (without a trailing slash), then redeploy. The previous public `REACT_APP_BASE_URL` is accepted as a migration fallback; `VITE_API_URL` takes precedence. Set the backend's `CLIENT_ORIGIN` to allow the deployed storefront origin. The local Vite `/api` proxy does not run on Vercel: these configurations deploy the frontend only, and MongoDB/authentication/AI credentials stay in the backend environment. A successful frontend build alone does not establish backend readiness.

If a preview fails, inspect its Vercel build log and confirm that the project's Root Directory is the repository root or `frontend`, Node is 24, and the build is using the checked-in configuration. Repository configuration overrides legacy framework/build/output commands, but cannot change an incorrect Root Directory or supply missing environment variables.

For a combined deployment, run `npm ci`, `npm run build`, then `npm start` with the backend environment configured. The server detects `frontend/dist`, serves the storefront and deep links, and exposes the API under `/api` on the same origin. Original API URLs remain available for existing clients. A missing API endpoint or asset returns an error instead of the SPA HTML. This path needs no separate frontend host or cross-origin API URL.

For separate hosting, run `npm run build` and serve `frontend/dist` from a static host. Configure SPA rewrites to `index.html` and route `/api/*` to the backend with the `/api` prefix removed, or set `VITE_API_URL` before building. Start the API with `npm start`, using production environment variables and MongoDB. Terminate HTTPS at the hosting platform. `/health` reports API/database readiness.

This change does not deploy a live store. Before accepting online payments, integrate a payment gateway with server-verified webhooks. Cash-on-delivery orders are deliberately recorded as **Pending**, and no confirmation emails are claimed or sent. Inventory reservation, fulfillment status editing, refunds, and transactional notifications remain future features. Existing product/order schemas remain compatible; historical payment claims are not rewritten.

For multiple API replicas, replace the in-process rate-limit store with a shared store. JWTs use the existing browser storage approach; cookie-based sessions with CSRF protection are a future hardening step. If changing the JWT secret, existing users must sign in again.

## Updating dependencies

After changing frontend dependencies, update both the root workspace lock and the standalone frontend lock:

```sh
npm install --package-lock-only
npm install --package-lock-only --workspaces=false --prefix frontend
npm run check:frontend-deploy
```

The project uses supported stable releases. React 19.3, Vite 8, Material UI 9, Express 5 and Mongoose 9 were checked against current releases on 3 October 2026. Node 24 is the production LTS baseline. Full commerce, server-calculated totals, pending cash-on-delivery orders, actual seller metrics, and the AI provider boundary are covered by automated checks. Hosting accounts and production credentials still need to be configured for a live store.
