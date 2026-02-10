# Sprint 2 - Architecture Guidelines

**Author:** TL (Tech Lead)
**Sprint:** 2 - Project Setup & Authentication
**Date:** 2026-02-06
**For:** BE, FE, QA

---

## Table of Contents

1. [Project Structure Overview](#1-project-structure-overview)
2. [Backend: Express.js Folder Structure](#2-backend-expressjs-folder-structure)
3. [JWT Authentication Strategy](#3-jwt-authentication-strategy)
4. [Prisma Schema](#4-prisma-schema)
5. [Error Handling Pattern](#5-error-handling-pattern)
6. [API Contract (BE ↔ FE)](#6-api-contract-be--fe)
7. [Frontend Guidelines](#7-frontend-guidelines)
8. [Coding Standards](#8-coding-standards)

---

## 1. Project Structure Overview

### Monorepo Layout

```
webphim/
├── webphim-fe/          # Next.js 14+ frontend
├── webphim-be/          # Express.js backend
├── docs/                # Documentation (shared)
└── README.md
```

- **Two separate apps**, not a monorepo tool (no Turborepo/Nx for simplicity)
- Each app has its own `package.json`, `tsconfig.json`, ESLint, Prettier
- Each app is independently deployable (Vercel for FE, Railway/Render for BE)

### Ports

| App | Dev Port | Notes |
|-----|----------|-------|
| `webphim-fe` | `3000` | Next.js default |
| `webphim-be` | `5000` | Express API |
| PostgreSQL | `5432` | Local database |

---

## 2. Backend: Express.js Folder Structure

```
webphim-be/
├── src/
│   ├── index.ts                  # Entry point: create app, start server
│   ├── app.ts                    # Express app setup (middleware, routes)
│   │
│   ├── config/
│   │   ├── index.ts              # Centralized config (env vars, defaults)
│   │   ├── database.ts           # Prisma client singleton
│   │   └── cors.ts               # CORS configuration
│   │
│   ├── routes/
│   │   ├── index.ts              # Route aggregator (/api/auth, /api/content, etc.)
│   │   └── auth.routes.ts        # Auth route definitions
│   │
│   ├── controllers/
│   │   └── auth.controller.ts    # Request handling, input extraction, response
│   │
│   ├── services/
│   │   └── auth.service.ts       # Business logic (hash password, verify, tokens)
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts     # JWT verification middleware
│   │   ├── validate.middleware.ts # Request validation (zod)
│   │   └── error.middleware.ts   # Global error handler
│   │
│   ├── utils/
│   │   ├── jwt.ts                # JWT sign/verify helpers
│   │   ├── password.ts           # bcrypt hash/compare helpers
│   │   └── ApiError.ts           # Custom error class
│   │
│   ├── validations/
│   │   └── auth.validation.ts    # Zod schemas for auth inputs
│   │
│   └── types/
│       └── index.ts              # Shared TypeScript types/interfaces
│
├── prisma/
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Auto-generated migrations
│   └── seed.ts                   # Seed data script
│
├── tests/
│   ├── setup.ts                  # Test setup (test DB, cleanup)
│   ├── auth.test.ts              # Auth API tests
│   └── helpers/                  # Test utilities
│
├── .env                          # Environment variables (git-ignored)
├── .env.example                  # Env template (committed)
├── package.json
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
└── nodemon.json
```

### Layer Responsibilities

```
Request → Route → Controller → Service → Database
                                  ↓
                              Utils/Helpers
```

| Layer | Responsibility | Rules |
|-------|---------------|-------|
| **Routes** | Define endpoints, attach middleware + controller | No business logic. Only `router.post('/register', validate(schema), controller.register)` |
| **Controllers** | Extract request data, call service, send response | No direct DB access. No business logic. Thin layer. |
| **Services** | Business logic, orchestration | No `req`/`res` objects. Pure functions where possible. Can call other services. |
| **Middleware** | Cross-cutting concerns (auth, validation, errors) | Reusable across routes. |
| **Utils** | Pure helper functions | Stateless, no side effects. |
| **Config** | Environment variables, constants | Single source of truth for all config. |
| **Validations** | Zod schemas for request validation | Colocated with routes they serve. |

### Key Design Decisions

**Why Zod for validation (not Joi)?**
- First-class TypeScript inference (`z.infer<typeof schema>`)
- Smaller bundle, faster
- Better DX with TypeScript strict mode

**Why separate Controllers and Services?**
- Controllers are Express-specific (req, res)
- Services are framework-agnostic (testable without HTTP)
- If we ever swap Express for Fastify, only controllers change

### Example Flow: POST /api/auth/register

```typescript
// routes/auth.routes.ts
router.post('/register', validate(registerSchema), authController.register);

// controllers/auth.controller.ts
async register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error); // → error middleware
  }
}

// services/auth.service.ts
async register(data: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ApiError(409, 'Email already registered');

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({ data: { ...data, passwordHash } });
  const tokens = generateTokens(user.id);

  return { user: sanitizeUser(user), ...tokens };
}
```

---

## 3. JWT Authentication Strategy

### Token Architecture

```
┌─────────────────────────────────────────────────┐
│                  Token Strategy                  │
├─────────────────┬───────────────────────────────┤
│  Access Token   │  Refresh Token                │
├─────────────────┼───────────────────────────────┤
│  Short-lived    │  Long-lived                   │
│  15 minutes     │  7 days                       │
│  In memory/     │  httpOnly cookie              │
│  Authorization  │                               │
│  header         │                               │
│  Stateless      │  Stored in DB (revocable)     │
└─────────────────┴───────────────────────────────┘
```

### Token Details

| Property | Access Token | Refresh Token |
|----------|-------------|---------------|
| **Expiry** | 15 minutes | 7 days |
| **Storage (FE)** | In-memory (JS variable) | `httpOnly` secure cookie |
| **Transport** | `Authorization: Bearer <token>` header | Auto-sent via cookie |
| **Payload** | `{ userId, email }` | `{ userId, tokenId }` |
| **Revocable?** | No (stateless, short-lived) | Yes (stored in DB, can delete) |
| **Algorithm** | HS256 | HS256 |

### Why This Strategy?

**Access token in memory (NOT localStorage):**
- localStorage is vulnerable to XSS attacks (any injected script can read it)
- In-memory variable is not accessible from XSS
- Trade-off: lost on page refresh → use refresh token to get new one

**Refresh token in httpOnly cookie:**
- `httpOnly`: JavaScript cannot access it (XSS-proof)
- `secure`: Only sent over HTTPS (in production)
- `sameSite: 'lax'`: CSRF protection
- `path: '/api/auth'`: Only sent to auth endpoints (minimizes exposure)

**Refresh token in database:**
- Enables logout (delete from DB → token invalid)
- Enables "logout from all devices" (delete all user's tokens)
- Enables token rotation (issue new refresh token on each refresh)

### Token Flow

```
Registration/Login:
  1. Client sends credentials
  2. Server validates, generates access + refresh tokens
  3. Access token → JSON response body
  4. Refresh token → httpOnly cookie (Set-Cookie header)
  5. FE stores access token in memory (Zustand/Context)

API Request:
  1. FE attaches access token: Authorization: Bearer <accessToken>
  2. Server middleware verifies JWT
  3. If valid → proceed
  4. If expired → return 401

Token Refresh:
  1. FE gets 401 → calls POST /api/auth/refresh
  2. Browser auto-sends refresh cookie
  3. Server verifies refresh token (check DB)
  4. If valid → new access token (response) + new refresh token (cookie)
  5. Old refresh token deleted from DB (rotation)
  6. FE retries original request with new access token

Logout:
  1. FE calls POST /api/auth/logout
  2. Server deletes refresh token from DB
  3. Server clears refresh cookie
  4. FE clears access token from memory
```

### Refresh Token DB Schema

```sql
-- Part of the Prisma schema (see Section 4)
-- refresh_tokens table stores active refresh tokens
-- On logout: delete the token row
-- On refresh: delete old, create new (rotation)
```

### Security Considerations

| Threat | Mitigation |
|--------|-----------|
| **XSS steals access token** | Access token in memory, not localStorage. Short 15min expiry. |
| **XSS steals refresh token** | httpOnly cookie, JavaScript cannot access |
| **CSRF** | `sameSite: 'lax'` cookie + refresh endpoint only accepts POST |
| **Token theft** | Refresh token rotation (old token invalidated on use) |
| **Compromised refresh token** | Stored in DB, revocable. Logout clears all tokens. |

### Environment Variables (.env)

```env
# JWT
JWT_ACCESS_SECRET=<random-64-char-string>
JWT_REFRESH_SECRET=<different-random-64-char-string>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/webphim

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## 4. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  passwordHash  String         @map("password_hash")
  name          String
  avatar        String?
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")

  refreshTokens RefreshToken[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String   @map("user_id")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}
```

### Schema Design Decisions

| Decision | Reasoning |
|----------|-----------|
| **UUID for IDs** | No sequential guessing, safe to expose in URLs/tokens |
| **`@@map` for table/column names** | TypeScript uses camelCase, DB uses snake_case |
| **Separate RefreshToken model** | Enables revocation, multi-device logout, token rotation |
| **`onDelete: Cascade`** | Delete user → auto-delete all their refresh tokens |
| **`@updatedAt`** | Prisma auto-updates this field on every save |
| **`avatar` is optional** | Users can set it later, null by default |
| **Index on `token`** | Fast lookup when verifying refresh tokens |

### Sanitized User Response

Never return `passwordHash` to the client. Create a helper:

```typescript
// utils/sanitize.ts
function sanitizeUser(user: User) {
  const { passwordHash, ...safe } = user;
  return safe;
}
```

---

## 5. Error Handling Pattern

### Custom ApiError Class

```typescript
// utils/ApiError.ts
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: Record<string, string>[]
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, errors?: Record<string, string>[]) {
    return new ApiError(400, message, errors);
  }
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }
  static notFound(message = 'Not found') {
    return new ApiError(404, message);
  }
  static conflict(message: string) {
    return new ApiError(409, message);
  }
}
```

### Global Error Handler Middleware

```typescript
// middleware/error.middleware.ts
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  // Known operational errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || undefined,
    });
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A record with this value already exists',
      });
    }
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Unknown errors (bugs) - don't leak internals
  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}
```

### Standard API Response Format

All API responses follow this structure:

```typescript
// Success responses
{
  "success": true,
  "data": { ... },        // or array
  "meta": {               // optional, for paginated lists
    "page": 1,
    "limit": 20,
    "total": 100
  }
}

// Error responses
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [             // optional, for validation errors
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### Usage Pattern in Controllers

```typescript
// Controllers use try/catch → next(error) pattern
async login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    // Set refresh token cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.json({ success: true, data: { user: result.user, accessToken: result.accessToken } });
  } catch (error) {
    next(error);
  }
}

// Services throw ApiError for expected failures
async login(data: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const valid = await comparePassword(data.password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  // ... generate tokens
}
```

### Error Handling Rules

1. **Controllers**: Always wrap in try/catch, pass errors to `next(error)`
2. **Services**: Throw `ApiError` for business logic failures
3. **Never expose**: Stack traces, internal errors, or DB details to client
4. **Same message for auth failures**: "Invalid email or password" (don't reveal which is wrong)
5. **Log unknown errors**: Console.error in dev, structured logging in production

---

## 6. API Contract (BE ↔ FE)

### Auth Endpoints

#### POST /api/auth/register

```
Request:
  Body: { name: string, email: string, password: string }

Response 201:
  Body: { success: true, data: { user: UserResponse, accessToken: string } }
  Cookie: refreshToken (httpOnly)

Errors:
  400: Validation failed (invalid email, weak password)
  409: Email already registered
```

#### POST /api/auth/login

```
Request:
  Body: { email: string, password: string }

Response 200:
  Body: { success: true, data: { user: UserResponse, accessToken: string } }
  Cookie: refreshToken (httpOnly)

Errors:
  401: Invalid email or password
```

#### POST /api/auth/refresh

```
Request:
  Cookie: refreshToken (auto-sent)

Response 200:
  Body: { success: true, data: { accessToken: string } }
  Cookie: refreshToken (new, httpOnly)

Errors:
  401: Invalid or expired refresh token
```

#### POST /api/auth/logout

```
Request:
  Cookie: refreshToken (auto-sent)

Response 200:
  Body: { success: true, data: { message: "Logged out" } }
  Cookie: refreshToken cleared

Errors:
  (none - logout always succeeds even if token invalid)
```

#### GET /api/auth/me

```
Request:
  Header: Authorization: Bearer <accessToken>

Response 200:
  Body: { success: true, data: { user: UserResponse } }

Errors:
  401: Missing or invalid access token
```

### UserResponse Type

```typescript
interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: string;     // ISO 8601
}
// Note: passwordHash is NEVER included
```

### Validation Rules

| Field | Rules |
|-------|-------|
| `email` | Valid email format, lowercase trimmed |
| `password` | Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number |
| `name` | Min 2 chars, max 50 chars, trimmed |

---

## 7. Frontend Guidelines

### Auth State Management (Zustand recommended)

```typescript
// FE stores auth state in Zustand (lightweight, simple)
interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: UserResponse, accessToken: string) => void;
  clearAuth: () => void;
  setAccessToken: (token: string) => void;
}
```

### API Client Setup

```typescript
// Axios interceptor pattern:
// 1. Request interceptor: attach accessToken from Zustand store
// 2. Response interceptor: on 401, call /api/auth/refresh, retry original request
// 3. If refresh fails → clearAuth, redirect to /login

// Important: Use a flag to prevent multiple simultaneous refresh calls
```

### Token Refresh Flow (FE)

```
┌──────────┐    401     ┌──────────┐    POST /refresh    ┌──────────┐
│ API Call  │ ────────► │Interceptor│ ─────────────────► │ Server   │
└──────────┘            └──────────┘                     └──────────┘
                              │                                │
                              │         New accessToken        │
                              │ ◄─────────────────────────────│
                              │
                              │   Retry original request
                              │   with new token
                              ▼
                        ┌──────────┐
                        │ Success  │
                        └──────────┘
```

### Protected Routes (Next.js Middleware)

```typescript
// middleware.ts (Next.js root)
// Check for auth cookie/state
// Redirect unauthenticated users to /login
// Redirect authenticated users away from /login, /signup
```

### Page Structure

```
webphim-fe/
├── src/
│   ├── app/
│   │   ├── (auth)/            # Auth group (no layout)
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (main)/            # Authenticated group (with navbar layout)
│   │   │   ├── layout.tsx     # Navbar + footer wrapper
│   │   │   └── page.tsx       # Home (placeholder for Sprint 2)
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing/redirect
│   │
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   └── auth/              # Auth-specific components (LoginForm, SignupForm)
│   │
│   ├── lib/
│   │   ├── api.ts             # Axios instance + interceptors
│   │   └── utils.ts           # Helper functions
│   │
│   ├── store/
│   │   └── auth.store.ts      # Zustand auth store
│   │
│   └── types/
│       └── index.ts           # Shared types (UserResponse, etc.)
```

---

## 8. Coding Standards

### TypeScript

- **Strict mode**: `"strict": true` in tsconfig
- **No `any`**: Use proper types or `unknown`
- **Interfaces for objects**: Use `interface` for object shapes, `type` for unions/intersections

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `auth.controller.ts`, `auth.routes.ts` |
| React Components | PascalCase | `LoginForm.tsx`, `AuthProvider.tsx` |
| Variables/Functions | camelCase | `generateTokens()`, `passwordHash` |
| Constants | UPPER_SNAKE_CASE | `JWT_ACCESS_SECRET`, `BCRYPT_ROUNDS` |
| Database tables | snake_case (via @@map) | `users`, `refresh_tokens` |
| API paths | kebab-case | `/api/auth/refresh` |

### Git

- **Branch**: `feature/sprint2-auth`
- **Commits**: Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- **Examples**:
  - `feat: add register endpoint with JWT`
  - `fix: handle duplicate email on registration`
  - `chore: setup ESLint and Prettier`

### Dependencies (Recommended)

**Backend (`webphim-be`)**:
```json
{
  "express": "^4.18",
  "typescript": "^5.3",
  "prisma": "^5.x",
  "@prisma/client": "^5.x",
  "bcryptjs": "^2.4",
  "jsonwebtoken": "^9.0",
  "zod": "^3.22",
  "cookie-parser": "^1.4",
  "cors": "^2.8",
  "dotenv": "^16.x",
  "helmet": "^7.x"
}
```

**Dev Dependencies (BE)**:
```json
{
  "tsx": "^4.x",
  "nodemon": "^3.x",
  "vitest": "^1.x",
  "supertest": "^6.x",
  "eslint": "^9.x",
  "prettier": "^3.x",
  "@types/express": "^4.x",
  "@types/bcryptjs": "^2.x",
  "@types/jsonwebtoken": "^9.x",
  "@types/cookie-parser": "^1.x",
  "@types/cors": "^2.x"
}
```

**Frontend (`webphim-fe`)**:
```json
{
  "next": "^14.x",
  "react": "^18.x",
  "tailwindcss": "^3.x",
  "framer-motion": "^11.x",
  "zustand": "^4.x",
  "axios": "^1.6",
  "zod": "^3.22"
}
```

### Bcrypt

- **Salt rounds**: 12 (good balance of security vs speed)
- **Library**: `bcryptjs` (pure JS, no native dependency issues)

---

## Quick Reference for Team

### BE Developer Checklist

- [ ] Init Express + TypeScript project
- [ ] Setup folder structure as defined above
- [ ] Configure Prisma + PostgreSQL
- [ ] Run `prisma migrate dev` to create tables
- [ ] Implement auth endpoints following the layer pattern
- [ ] Use `ApiError` for all error throwing
- [ ] Set refresh token as httpOnly cookie
- [ ] Write tests with Vitest + Supertest

### FE Developer Checklist

- [ ] Init Next.js 14+ App Router project
- [ ] Setup Tailwind CSS + Framer Motion
- [ ] Create Zustand auth store
- [ ] Setup Axios with interceptors (auto-refresh on 401)
- [ ] Build Login + Signup pages (dark theme, Netflix-style)
- [ ] Implement Next.js middleware for protected routes
- [ ] Store access token in memory only (not localStorage)

### QA Checklist

- [ ] Test all auth endpoints (register, login, refresh, logout, me)
- [ ] Test validation errors (invalid email, weak password, missing fields)
- [ ] Test token expiry and refresh flow
- [ ] Test CORS (FE origin allowed, others blocked)
- [ ] E2E: Signup → Login → Access protected → Logout
