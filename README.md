# Virtual Realm

A full-stack MERN marketplace for customers and independent sellers: React 19, Vite 8, Material UI 9, Express 5 and Mongoose 9 on Node 24 LTS. The frontend and API now deploy together from this repository.

The API was reviewed against [anshu51379/ecommerce-backend](https://github.com/anshu51379/ecommerce-backend), including its original controllers, routes, JWT format and MongoDB schemas. Existing customer, seller, product and order collections remain compatible. See [the backend migration notes](docs/BACKEND-MIGRATION.md) for the findings, API contract and migration details.

## Run the full application

Install Node 24, then run from the repository root:

```sh
npm ci
npm run setup
docker compose up -d mongo
npm run dev
```

`npm run setup` creates an ignored `backend/.env` with a unique authentication secret and a local MongoDB connection string. It preserves any existing environment file. Docker is only needed to start a local MongoDB instance; you can instead set `MONGO_URL` in `backend/.env` to your existing MongoDB/Atlas database, including the original database name.

Open http://127.0.0.1:3000. The Express API listens on port 5000 and Vite forwards `/api` requests to it. Register a seller and add products in the seller dashboard. Register a customer, add products to the bag, enter a shipping address and place a cash-on-delivery order. An empty database starts with an empty catalogue; sample accounts and products are not silently created.

The server calculates product prices, buyer identity, seller identity and order totals from the database. Orders persist in MongoDB with payment status **Pending**. Product editing, cart persistence, purchase reviews, order history and seller metrics use authenticated API routes with ownership checks.

Optional sample products can be added to a development database after registering a seller. Set `SEED_SELLER_ID` in `backend/.env`, then run `npm run seed`. Existing products are preserved and no passwords are created.

## Deploy the full stack on Vercel

The checked-in Vercel configuration supports the repository root **or `frontend`** as Root Directory. The existing project can keep its `frontend` setting. It builds the React assets and deploys Express as a Node function at `/api/*` on the same domain. A separate backend repository, API hostname or CORS setup is unnecessary for this deployment.

In the Vercel project's **Settings → Environment Variables**, configure these server variables for the intended Preview and/or Production environments:

| Variable | Value |
| --- | --- |
| `MONGO_URL` or `MONGODB_URI` | Your MongoDB/Atlas connection string, including the correct database name |
| `SECRET_KEY` | A random secret of at least 32 characters; retain the old secret if you want existing JWTs to remain valid |
| `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL` | Optional server-only AI provider settings |

Vercel's MongoDB integration creates `MONGODB_URI`, which the API and optional seed command accept directly. If both variables are set, `MONGO_URL` takes priority. To attach a fresh integration database, remove any stale `MONGO_URL` in that deployment environment. The integration must be connected to this Vercel project and the intended Preview/Production scopes.

Generate a new secret locally if needed:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Use Node 24 and redeploy after setting the environment. MongoDB must permit connections from the deployment; use the network access configuration appropriate to your database and Vercel plan. Use a separate preview database when testing registration, product editing and checkout. Do not commit connection strings, passwords or API keys.

The Vercel build explicitly selects the integrated `/api` endpoint. Old `REACT_APP_BASE_URL` and `VITE_API_URL` settings cannot redirect this build to the retired backend. Leave `DEMO_MODE` unset: deployed commerce never uses the sample preview.

Visit **`https://<your-domain>/api/health`** after deployment. HTTP 200 with `status: "ok"` means the API connected to MongoDB. HTTP 503 with `CONFIGURATION_MISSING` names missing server variables; `DATABASE_UNAVAILABLE` indicates a connection failure. API failures return JSON, never the storefront HTML. Credentials and database error details are omitted from responses and connection logs.

GitHub access alone cannot supply private hosting/database credentials. A Ready frontend deployment is not proof that those runtime settings exist. The PR remains a preview until merged; production requires the production environment settings too.

## Server layout and Node hosting

```text
frontend/src/       React storefront and seller dashboard
frontend/server/    Canonical Express API, models, services and tests
frontend/api/       Vercel function entrypoint for Root Directory = frontend
api/                Vercel function entrypoint for repository-root deployments
backend/index.js    Compatibility startup entrypoint
backend/.env        Ignored local server configuration
```

The API lives inside `frontend/server` so the existing Vercel `frontend` Root Directory includes all source files and runtime dependencies. It is a Node package, never imported into the browser. The frontend's independent lockfile includes this local package and its dependencies, so installing only `frontend` also produces a deployable backend. Root npm workspaces share the same server code.

For a single persistent Node server, configure the backend environment and run:

```sh
npm ci
npm run build
npm start
```

Port 5000 serves the production storefront, deep links and `/api/*`. Original API URLs such as `/getProducts` also work on this Node server. `node backend/index.js` remains a valid startup command. Environment files resolve consistently regardless of the working directory.

For separate frontend/backend hosts, set `VITE_API_URL` before a normal frontend build and allow that frontend origin with `CLIENT_ORIGIN` in the server environment. This option applies to normal Vite builds; the checked-in Vercel build uses the integrated API.

## AI extension

`POST /api/ai/recommend` accepts `{ "query": "headphones under 3000" }`. Without an AI key, it returns matches from the real database with `mode: "catalog-search"`. This deterministic search remains useful without a provider.

Set `AI_API_KEY`, `AI_MODEL` and optionally `AI_BASE_URL` in the server environment to enable model explanations through an HTTPS chat-completions endpoint. Requests contain only the shopper's query and public product names, categories and prices. Provider failures fall back to catalogue search. Suggestions never place orders or change prices.

See [docs/AI-ROADMAP.md](docs/AI-ROADMAP.md). A real AI provider was not called during automated checks.

## Read-only visual preview

```sh
npm ci
npm run demo
```

Open http://127.0.0.1:3000. Browsing and the shopping helper use an explicitly labelled sample collection. Registration, persistent carts and orders require MongoDB. Preview mode cannot run in production or the deployed API.

## Verification

```sh
npm test
npm run build
npm run check:frontend-deploy
npx playwright install --with-deps chromium
npm run test:e2e
npm audit --audit-level=high
```

API tests use ephemeral MongoDB, never your configured database. They cover commerce, access controls, legacy records/JWTs, configuration errors and database reconnection. Desktop/mobile checkout tests serve the actual production React build and a real same-origin Express API without intercepting requests. Deployment checks install only the frontend directory, verify routing with Vercel's routing library, trace function dependencies including native bcrypt, check that secrets stay out of browser bundles and load the isolated API. GitHub Actions runs these checks.

## Production boundaries

Cash-on-delivery is implemented. Online payments require a payment gateway and server-verified webhooks; card details are not collected. Inventory reservation, fulfillment updates, refunds and transactional notifications remain future extensions. The original product `quantity` field is a default purchase quantity, not reliable stock, so it is not decremented as inventory. Historical payment claims are preserved without being reclassified as verified payments.

For multiple API replicas, replace the in-process rate-limit store with a shared store. JWTs retain the existing browser storage approach; cookie sessions with CSRF protection are a future hardening step. Changing the JWT secret requires users to sign in again.

After changing frontend or backend dependencies, refresh both locks:

```sh
npm install --package-lock-only
npm install --package-lock-only --workspaces=false --prefix frontend
npm run check:frontend-deploy
```
