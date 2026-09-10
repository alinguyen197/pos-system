# DevOps — Môi trường & Triển khai

| Hạng mục  | Nội dung                      |
| :-------- | :---------------------------- |
| Hệ thống  | Coffee Shop Management System |
| Phiên bản | 1.0                           |
| Ngày tạo  | 2026-08-28                    |
| Vai trò   | DevOps Lead                   |

### Lịch sử phiên bản

| Ver | Ngày       | Nội dung thay đổi                                    | Người thực hiện |
| :-: | :--------- | :--------------------------------------------------- | :-------------- |
| 1.0 | 2026-08-28 | Tạo mới — chọn hosting free, CI/CD, hướng dẫn deploy | KhoaNA15        |

---

## 1. Tổng quan kiến trúc triển khai

```
                    ┌──────────────────────────────────┐
                    │         Cloudflare Pages          │
                    │    (Frontend — Vue.js 3 SPA)      │
                    │    https://coffee-shop.pages.dev  │
                    └──────────────┬───────────────────┘
                                   │ HTTPS
                                   ▼
                    ┌──────────────────────────────────┐
                    │          Render.com               │
                    │    (Backend — Node.js/Express)    │
                    │  https://coffee-api.onrender.com  │
                    └───────┬──────────────┬───────────┘
                            │              │
                   ┌────────▼──────┐  ┌────▼──────────┐
                   │  Neon.tech    │  │  Upstash.com  │
                   │ (PostgreSQL)  │  │   (Redis)     │
                   │  Free 512MB   │  │  Free 10K/day │
                   └───────────────┘  └───────────────┘
          CI/CD: GitHub Actions (2,000 min/month free)
```

---

## 2. Lựa chọn hosting — Bảng so sánh

### 2.1. Frontend Hosting

| Platform                | Free Tier       | Build            | Bandwidth   | Custom Domain | Đánh giá                                          |
| :---------------------- | :-------------- | :--------------- | :---------- | :-----------: | :------------------------------------------------ |
| **Cloudflare Pages** ✅ | Unlimited sites | 500 builds/month | Unlimited   |      ✅       | **Chọn** — bandwidth không giới hạn, CDN toàn cầu |
| Vercel                  | 100GB bandwidth | 6,000 min/month  | 100GB/month |      ✅       | Tốt nhưng giới hạn bandwidth                      |
| Netlify                 | 1 site          | 300 min/month    | 100GB/month |      ✅       | Ổn định, hơi ít build minutes                     |

**Quyết định: Cloudflare Pages** — Unlimited bandwidth, CDN edge toàn cầu, build nhanh, hỗ trợ SPA routing.

### 2.2. Backend Hosting

| Platform          | Free Tier       | RAM   | CPU     |      Sleep?      | Đánh giá                                             |
| :---------------- | :-------------- | :---- | :------ | :--------------: | :--------------------------------------------------- |
| **Render.com** ✅ | 750 hours/month | 512MB | 0.1 CPU | Sau 15 phút idle | **Chọn** — dễ setup, auto-deploy, có persistent disk |
| Railway.app       | $5 credit/month | 512MB | Shared  |      Không       | Credit hết = dừng                                    |
| Fly.io            | 3 shared VMs    | 256MB | Shared  |      Không       | Cấu hình phức tạp hơn                                |
| Koyeb             | 1 service       | 512MB | Shared  |      Không       | Ít tài liệu                                          |

**Quyết định: Render.com** — Free 750h/month, auto-deploy từ GitHub, có health check, logs, env variables UI. > **Lưu ý:** Free tier sẽ sleep sau 15 phút không có request. Request đầu tiên sau sleep mất ~30-50 giây (cold start). Chấp nhận được cho môi trường dev/staging.

### 2.3. Database (PostgreSQL)

| Platform         | Free Tier  | Storage | Compute | Branching | Đánh giá                                               |
| :--------------- | :--------- | :------ | :------ | :-------: | :----------------------------------------------------- |
| **Neon.tech** ✅ | 1 project  | 512MB   | 0.25 CU |    ✅     | **Chọn** — serverless, auto-suspend, branching cho dev |
| Supabase         | 2 projects | 500MB   | Shared  |    ❌     | Tốt nhưng không có branching                           |
| Aiven            | 1 service  | 5GB     | Shared  |    ❌     | Storage lớn hơn nhưng ít tính năng                     |

**Quyết định: Neon.tech** — Serverless PostgreSQL, auto-suspend khi không dùng (tiết kiệm compute), database branching cho dev/staging, connection pooling built-in.

### 2.4. Redis (Cache/Session)

| Platform       | Free Tier  | Storage | Commands   | Đánh giá                                    |
| :------------- | :--------- | :------ | :--------- | :------------------------------------------ |
| **Upstash** ✅ | 1 database | 256MB   | 10,000/day | **Chọn** — serverless, REST API, đủ cho dev |
| Redis Cloud    | 1 database | 30MB    | Unlimited  | Storage quá nhỏ                             |

## **Quyết định: Upstash** — Serverless Redis, 10K commands/day đủ cho dev, có REST API fallback.

## 3. Cấu hình môi trường

### 3.1. Environments

| Môi trường      | Mục đích           | Branch      | URL                             |
| :-------------- | :----------------- | :---------- | :------------------------------ |
| **Development** | Dev local          | `feature/*` | `localhost`                     |
| **Staging**     | Test trước release | `develop`   | `staging-coffee-shop.pages.dev` |
| **Production**  | Live               | `main`      | `coffee-shop.pages.dev`         |

### 3.2. Environment Variables — Backend (Render.com)

Cấu hình trong Render Dashboard → Service → Environment:

```env
# ─── Server ───
NODE_ENV=production
PORT=3000
# ─── Database (Neon.tech) ───
DATABASE_URL=postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/coffee_shop?sslmode=require
DB_HOST=ep-xxx.ap-southeast-1.aws.neon.tech
DB_PORT=5432
DB_NAME=coffee_shop
DB_USER=coffee_user
DB_PASS=<from_neon_dashboard>
DB_SSL=true
# ─── Redis (Upstash) ───
REDIS_URL=rediss://default:xxx@apn1-xxx.upstash.io:6379
REDIS_HOST=apn1-xxx.upstash.io
REDIS_PORT=6379
REDIS_PASS=<from_upstash_dashboard>
# ─── JWT ───
JWT_SECRET=<generate: openssl rand -hex 32>
JWT_REFRESH_SECRET=<generate: openssl rand -hex 32>
# ─── CORS ───
CORS_ORIGIN=https://coffee-shop.pages.dev
# ─── Email ───
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=<email>
SMTP_PASS=<app_password>
SMTP_FROM="Coffee Shop <noreply@coffeeshop.com>"
ADMIN_EMAIL=admin@coffeeshop.com
```

### 3.3. Environment Variables — Frontend (Cloudflare Pages)

Cấu hình trong Cloudflare Dashboard → Pages → Settings → Environment Variables:

```env
# Staging
VITE_API_BASE_URL=https://coffee-api-staging.onrender.com/api
# Production
VITE_API_BASE_URL=https://coffee-api.onrender.com/api
```

---

## 4. Hướng dẫn setup từng platform

### 4.1. Neon.tech — PostgreSQL

```
1. Đăng ký tại https://neon.tech (dùng GitHub login)
2. Create Project:
   - Name: coffee-shop
   - Region: Asia Pacific (Singapore) — ap-southeast-1
   - PostgreSQL version: 16
3. Tạo database:
   - Default branch: main (production)
   - Create branch: staging (staging environment)
4. Lấy connection string từ Dashboard → Connection Details
5. Enable connection pooling (Transaction mode, port 5432)
```

**Chạy migration:**

```bash
# Set DATABASE_URL từ Neon dashboard
export DATABASE_URL="postgresql://user:pass@ep-xxx.aws.neon.tech/coffee_shop?sslmode=require"
cd coffee-trade-api
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

**Sequelize config cho Neon (SSL required):**

```javascript
// src/config/database.js — bổ sung cho production
production: {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  pool: { max: 5, min: 1, acquire: 30000, idle: 10000 },
  define: { underscored: true, timestamps: true },
},
```

### 4.2. Upstash — Redis

```
1. Đăng ký tại https://upstash.com (dùng GitHub login)
2. Create Database:
   - Name: coffee-shop-cache
   - Region: Asia Pacific (Singapore)
   - Type: Regional
   - Eviction: enabled
3. Lấy connection info từ Dashboard:
   - REDIS_URL (rediss://...)
   - REDIS_HOST, REDIS_PORT, REDIS_PASS
```

**Redis config cho Upstash (TLS required):**

```javascript
// src/config/redis.js — bổ sung cho production
const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL, {
  tls: process.env.NODE_ENV === "production" ? {} : undefined,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});
```

### 4.3. Render.com — Backend Node.js

```
1. Đăng ký tại https://render.com (dùng GitHub login)
2. New → Web Service
3. Connect GitHub repo: coffee-trade-api
4. Cấu hình:
   - Name: coffee-api
   - Region: Singapore
   - Branch: main
   - Runtime: Node
   - Build Command: npm install
   - Start Command: node server.js
   - Instance Type: Free
5. Environment Variables: thêm tất cả biến từ mục 3.2
6. Auto-Deploy: ON (mỗi push vào main sẽ tự deploy)
```

**Tạo thêm staging service:**

```
- New → Web Service → cùng repo
- Name: coffee-api-staging
- Branch: develop
- Env: NODE_ENV=staging, CORS_ORIGIN=https://staging-coffee-shop.pages.dev
```

**Health Check Endpoint:**

```javascript
// src/routes/health.routes.js
const router = require("express").Router();
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});
module.exports = router;
```

Render Health Check URL: `/api/health`

### 4.4. Cloudflare Pages — Frontend Vue.js

```
1. Đăng ký tại https://dash.cloudflare.com (free account)
2. Pages → Create a project → Connect to Git
3. Select repo: coffee-trade-web
4. Build settings:
   - Framework preset: Vue
   - Build command: npm run build
   - Build output directory: dist
   - Root directory: / (hoặc coffee-trade-web nếu monorepo)
5. Environment Variables:
   - Production: VITE_API_BASE_URL = https://coffee-api.onrender.com/api
   - Preview: VITE_API_BASE_URL = https://coffee-api-staging.onrender.com/api
6. Deploy
```

**SPA Routing — `_redirects` file:**

```
# public/_redirects (Cloudflare Pages)
/*  /index.html  200
```

Hoặc dùng `_routes.json`:

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/assets/*"]
}
```

---

## 5. CI/CD Pipeline — GitHub Actions

### 5.1. Backend CI/CD

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI/CD
on:
  push:
    branches: [main, develop]
    paths: ["coffee-trade-api/**"]
  pull_request:
    branches: [main, develop]
    paths: ["coffee-trade-api/**"]
defaults:
  run:
    working-directory: coffee-trade-api
jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
          cache-dependency-path: coffee-trade-api/package-lock.json
      - run: npm ci
      - name: ESLint
        run: npx eslint src/ --ext .js --max-warnings 0
      - name: Prettier check
        run: npx prettier --check "src/**/*.js"
      - name: Unit tests
        run: npm run test:ci
        env:
          JWT_SECRET: test-secret-ci
          JWT_REFRESH_SECRET: test-refresh-secret-ci
      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: coffee-trade-api/coverage/
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm audit --audit-level=high
  # Render.com auto-deploys from GitHub — no deploy step needed
```

### 5.2. Frontend CI/CD

```yaml
# .github/workflows/frontend-ci.yml
name: Frontend CI/CD
on:
  push:
    branches: [main, develop]
    paths: ["coffee-trade-web/**"]
  pull_request:
    branches: [main, develop]
    paths: ["coffee-trade-web/**"]
defaults:
  run:
    working-directory: coffee-trade-web
jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
          cache-dependency-path: coffee-trade-web/package-lock.json
      - run: npm ci
      - name: ESLint
        run: npx eslint src/ --ext .js,.vue --max-warnings 0
      - name: Prettier check
        run: npx prettier --check "src/**/*.{js,vue}"
      - name: Unit tests
        run: npx vitest run --coverage
      - name: Build check
        run: npm run build
        env:
          VITE_API_BASE_URL: https://coffee-api.onrender.com/api
      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: frontend-coverage
          path: coffee-trade-web/coverage/
  # Cloudflare Pages auto-deploys from GitHub — no deploy step needed
```

### 5.3. E2E Tests (Playwright)

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on:
  pull_request:
    branches: [main, develop]
jobs:
  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: coffee_shop_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        ports: ["5432:5432"]
        options: >-

          --health-cmd pg_isready

          --health-interval 10s

          --health-timeout 5s

          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install BE dependencies
        run: cd coffee-trade-api && npm ci
      - name: Run migrations
        run: cd coffee-trade-api && npx sequelize-cli db:migrate
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: coffee_shop_test
          DB_USER: test_user
          DB_PASS: test_pass
      - name: Seed test data
        run: cd coffee-trade-api && npx sequelize-cli db:seed:all
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: coffee_shop_test
          DB_USER: test_user
          DB_PASS: test_pass
      - name: Install FE dependencies
        run: cd coffee-trade-web && npm ci
      - name: Install Playwright
        run: cd e2e && npm ci && npx playwright install --with-deps chromium
      - name: Start servers
        run: |
          cd coffee-trade-api && node server.js &
          cd coffee-trade-web && npm run dev &
          sleep 10
        env:
          NODE_ENV: test
          PORT: 3000
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: coffee_shop_test
          DB_USER: test_user
          DB_PASS: test_pass
          JWT_SECRET: test-secret
          JWT_REFRESH_SECRET: test-refresh-secret
      - name: Run Playwright tests
        run: cd e2e && npx playwright test
        env:
          BASE_URL: http://localhost:5173
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: e2e/playwright-report/
```

---

## 6. Database Branching Strategy (Neon)

```
Neon Project: coffee-shop
├── main branch        ← Production DB (auto từ main code branch)
├── staging branch     ← Staging DB (branch từ main, reset hàng tuần)
└── dev-feature-xxx    ← Dev branch (tạo khi cần, xóa sau khi merge)
```

**Tạo branch cho feature:**

```bash
# Dùng Neon CLI
neonctl branches create --name dev-CT-001-product-list --parent main
# Lấy connection string của branch mới
neonctl connection-string dev-CT-001-product-list
```

**Reset staging hàng tuần (GitHub Action):**

```yaml
# .github/workflows/reset-staging-db.yml
name: Reset Staging DB
on:
  schedule:
    - cron: "0 2 * * 1" # Mỗi thứ 2 lúc 2:00 AM
  workflow_dispatch:
jobs:
  reset:
    runs-on: ubuntu-latest
    steps:
      - name: Reset staging branch
        run: |
          npm install -g neonctl
          neonctl branches delete staging --force || true
          neonctl branches create --name staging --parent main
        env:
          NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
```

---

## 7. Monitoring & Logging

### 7.1. Free Monitoring Tools

| Tool               | Mục đích          | Free Tier                     |
| :----------------- | :---------------- | :---------------------------- |
| **UptimeRobot**    | Uptime monitoring | 50 monitors, check mỗi 5 phút |
| **Render Logs**    | Backend logs      | Built-in, 7 ngày retention    |
| **Sentry** (free)  | Error tracking    | 5K events/month               |
| **Neon Dashboard** | DB metrics        | Built-in                      |

### 7.2. UptimeRobot Setup

```
1. Đăng ký https://uptimerobot.com
2. Thêm monitors:
   - Production API: https://coffee-api.onrender.com/api/health (HTTP, 5 min)
   - Production FE:  https://coffee-shop.pages.dev (HTTP, 5 min)
   - Staging API:    https://coffee-api-staging.onrender.com/api/health (HTTP, 5 min)
3. Alert contacts: email team
```

### 7.3. Sentry Setup (Error Tracking)

```bash
# Backend
npm install @sentry/node
# Frontend
npm install @sentry/vue
```

```javascript
// BE: src/app.js
const Sentry = require("@sentry/node");
if (process.env.NODE_ENV === "production") {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}
// FE: src/main.js
import * as Sentry from "@sentry/vue";
if (import.meta.env.PROD) {
  Sentry.init({ app, dsn: import.meta.env.VITE_SENTRY_DSN });
}
```

---

## 8. Quy trình Deploy

### 8.1. Flow tổng quan

```
Developer push code
       │
       ▼
GitHub Actions CI ──── Lint + Test + Build ──── FAIL → Block merge
       │
       │ PASS
       ▼
Merge to develop ──→ Auto-deploy Staging
       │                 ├── Render (BE staging)
       │                 └── Cloudflare Pages (FE preview)
       ▼
QA test on Staging
       │
       │ PASS
       ▼
Merge to main ──→ Auto-deploy Production
                     ├── Render (BE production)
                     └── Cloudflare Pages (FE production)
```

### 8.2. Rollback

**Backend (Render):**

- Dashboard → Service → Events → chọn deploy trước → "Rollback to this deploy" **Frontend (Cloudflare Pages):**
- Dashboard → Pages → Deployments → chọn deployment trước → "Rollback" **Database (Neon):**
- Point-in-time recovery: Neon hỗ trợ restore đến bất kỳ thời điểm nào trong 7 ngày
- `neonctl branches restore main --to <timestamp>`

---

## 9. Chi phí dự kiến

| Service          | Free Tier                             | Khi nào cần trả phí                   |
| :--------------- | :------------------------------------ | :------------------------------------ |
| Cloudflare Pages | Unlimited bandwidth, 500 builds/month | > 500 builds/month → $20/month        |
| Render.com       | 750h/month, 512MB RAM                 | Cần luôn online (no sleep) → $7/month |
| Neon.tech        | 512MB storage, 0.25 CU                | > 512MB data → $19/month              |
| Upstash          | 10K commands/day, 256MB               | > 10K/day → $10/month                 |
| GitHub Actions   | 2,000 min/month (private)             | > 2,000 min → $4/min                  |
| UptimeRobot      | 50 monitors                           | > 50 → $7/month                       |
| Sentry           | 5K events/month                       | > 5K → $26/month                      |
| **Tổng (free)**  | **$0/month**                          | **Scale: ~$60-90/month**              |

---

## 10. Checklist Setup Dự án Mới

|  #  | Bước                                         | Platform       |  ✓  |
| :-: | :------------------------------------------- | :------------- | :-: |
|  1  | Tạo PostgreSQL project + branch main/staging | Neon.tech      |  ☐  |
|  2  | Tạo Redis database                           | Upstash        |  ☐  |
|  3  | Tạo BE web service (production + staging)    | Render.com     |  ☐  |
|  4  | Cấu hình env variables cho BE                | Render.com     |  ☐  |
|  5  | Chạy migration + seed                        | Terminal       |  ☐  |
|  6  | Tạo FE Pages project                         | Cloudflare     |  ☐  |
|  7  | Cấu hình env variables cho FE                | Cloudflare     |  ☐  |
|  8  | Thêm `_redirects` cho SPA routing            | Repo           |  ☐  |
|  9  | Setup CI workflows (3 files)                 | GitHub Actions |  ☐  |
| 10  | Setup uptime monitoring                      | UptimeRobot    |  ☐  |
| 11  | Generate JWT secrets                         | Terminal       |  ☐  |
| 12  | Test full flow staging                       | Browser        |  ☐  |
| 13  | Verify CORS, SSL, health check               | Terminal       |  ☐  |
