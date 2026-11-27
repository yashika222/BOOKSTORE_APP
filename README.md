# FundooBooks / PageTurner Bookstore

A two-application Next.js 14 monorepo:

- `frontend/` — the customer/admin UI, Redux state, Ant Design, and a single centralized Axios API layer.
- `backend/` — independent Next.js App Router Route Handlers, business services, MongoDB models, JWT/Google OAuth, email, and server-only secrets.

The frontend never imports Mongoose, JWT, SMTP, or database code. All API traffic goes through `frontend/src/lib/api/` to the backend origin.

## Architecture

```text
BookStore/
├── frontend/                       # Next.js UI (http://localhost:3000)
│   ├── public/                     # Fonts, illustration, OpenAPI + Postman files
│   └── src/
│       ├── app/                    # Pages and App Router layout
│       │   ├── auth/callback/      # Landing page after backend Google OAuth
│       │   ├── books/[id]/         # Book detail
│       │   ├── docs/               # API reference and live request tester
│       │   └── ...
│       ├── components/             # Presentation and UI components
│       ├── lib/api/                # ONLY place that knows API URLs or uses Axios
│       │   ├── client.ts           # Single Axios instance (withCredentials)
│       │   ├── config.ts           # NEXT_PUBLIC_API_URL and asset URL helpers
│       │   ├── endpoints.ts        # All centralized endpoint constants
│       │   ├── authService.ts
│       │   ├── booksService.ts
│       │   ├── cartService.ts
│       │   ├── wishlistService.ts
│       │   ├── ordersService.ts
│       │   ├── accountService.ts
│       │   ├── addressesService.ts
│       │   ├── libraryService.ts
│       │   ├── docsService.ts
│       │   └── sessionHint.ts      # Non-sensitive page-gate cookies
│       ├── store/                  # Redux Toolkit store and hydration
│       └── middleware.ts           # Page gate using UI-only hint cookies
├── backend/                        # Next.js API (http://localhost:3001)
│   ├── public/openapi.json         # OpenAPI 3 specification
│   └── src/
│       ├── app/api/                # All Route Handlers, including /api/health
│       ├── lib/                    # Auth, database, mail, OAuth, URL, utilities
│       ├── middleware.ts           # Credentialed CORS + preflight handling
│       ├── models/                 # Mongoose schemas
│       ├── services/               # Server-side business services
│       └── scripts/                # Import/verify/environment utilities
├── .gitignore
└── README.md
```

## Sessions and cross-origin auth

- The backend sets a 15-minute JWT in the HTTP-only `bookstore_token` cookie and persists its session in MongoDB. Authenticated requests check the signature, session ID, expiry/revocation state, and password version. Sessions can be continued up to a 7-day absolute limit; extension rotates the session ID. Logout, password changes, and password resets revoke server-side sessions.
- Production uses `SameSite=None; Secure`; local development (`localhost:3000` to `localhost:3001`) uses `SameSite=Lax`.
- The frontend Axios instance sends `withCredentials: true`. Backend CORS echoes `FRONTEND_URL`, enables `Access-Control-Allow-Credentials`, and rejects state-changing requests from unconfigured browser origins.
- The UI warns two minutes before the API session expires and synchronizes continuation, expiration, and logout events across tabs without broadcasting credentials.
- Password reset uses single-use SHA-256-hashed email-link tokens and an expiry configured with `PASSWORD_RESET_LINK_TTL_MINUTES`. The reset flow does not use OTP verification.
- `frontend/src/middleware.ts` reads only non-sensitive `bookstore_session` and `bookstore_role` hint cookies for page redirects. Every API request is still authorized by the backend, so these hints are never trusted for data access.
- Google OAuth starts at `backend/api/auth/google`, uses a backend state cookie, and redirects back to `frontend/auth/callback`. That page calls `/api/auth/me`, establishes the Redux session and hint cookies, then continues to the requested page.

## Local development

Prerequisites: Node.js 18.17+ (or 20+) and a MongoDB Atlas/local MongoDB connection string.

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment variables

Backend — copy `.env.example` to `.env.local`. At minimum set:

```env
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<at-least-32-character-random-secret>
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```

Optional backend services:

```env
JWT_EXPIRES_IN=15m
AUTH_SECRET=<at-least-32-character-random-secret>
PASSWORD_RESET_LINK_TTL_MINUTES=15
EMAIL_PROVIDER=smtp
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
EMAIL_FROM=
RESEND_API_KEY=
```

Frontend — copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Only public values may be placed in `frontend/.env.local`. Backend secrets belong exclusively in `backend/.env.local`. Both `.gitignore` files exclude local env files.

Google OAuth note: register `http://localhost:3001/api/auth/google/callback` as an authorized redirect URI in Google Cloud for local development, and the deployed backend callback URL in production.

### 3. Run both apps

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd frontend && npm run dev
```

Open <http://localhost:3000>. Backend health check: <http://localhost:3001/api/health>. API docs: <http://localhost:3000/docs>.

### 4. Scripts

Run from either application directory:

```bash
npm run dev
npm run build
npm start
npm run lint
npm run type-check
npm test
```

Backend-only utilities:

```bash
npm run import:books     # Import the public-domain demo catalog
npm run verify:books
npm run email:verify
```

## Deployment

Deploy `backend/` and `frontend/` as separate Next.js projects (for example, two Vercel projects). Set the backend environment variables in the backend project and only `NEXT_PUBLIC_*` variables in the frontend project. Set `FRONTEND_URL` on the backend to the deployed frontend origin and set `NEXT_PUBLIC_API_URL` on the frontend to the deployed backend origin. In production, the backend always allows `https://bookstore-app-8m39.vercel.app`; localhost origins are ignored. For multiple frontend origins, set `FRONTEND_URL` to a comma-separated list; configured non-local origins are allowed for CORS, and the first is used for OAuth redirects and email links. Both projects must be HTTPS in production for the cross-site cookie to be accepted.

The built-in rate-limit store is process-local and does not provide protection across multiple backend instances or restarts. The current defaults allow 10 login attempts per account and 30 per IP per 15 minutes, plus 5 password-reset requests per IP and 3 per account per hour. `backend/src/lib/rateLimit.ts` exposes a `RateLimitStore` interface and `configureRateLimitStore` hook; configure a shared Redis-backed adapter before deploying multiple instances. Do not treat the default in-memory store as distributed protection.

## API surface

The backend preserves the original endpoint paths, including auth/OTP/password reset, books and ISBN lookup, Gutendex proxy, covers/ebook streaming, cart, wishlist, addresses, account/recent books, orders, and OpenAPI spec. All frontend calls are made through the service modules in `frontend/src/lib/api/`; pages and components do not hardcode API paths or import Axios directly.

The interactive docs page and `public/bookstore.postman_collection.json` use the backend base URL (`http://localhost:3001` locally).
