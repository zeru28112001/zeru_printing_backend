# Zeru Printing Service — Backend API 👕🚀

Production-grade NestJS backend API for **Zeru Printing Service** (DTF Apparel Customization & Print-on-Demand), built with **NestJS**, **Prisma (MongoDB)**, **Google Drive Storage**, and **Telegram Bot Alerts**.

Follows the **Controller-Service-Repository** pattern with a unified `ApiResponse` envelope, role-based guards, and custom pipes.

---

## ⚡ Tech Stack

* **Framework:** [NestJS](https://nestjs.com/) (Node.js v20+)
* **Database & ORM:** [Prisma](https://www.prisma.io/) with **MongoDB Atlas**
* **Cloud Storage:** [Google Drive API](https://developers.google.com/drive) (Service Account) with local filesystem fallback
* **Notifications:** [Telegram Bot API](https://core.telegram.org/bots/api) for instant order alerts
* **Authentication:** JWT with Master PIN for Admin access
* **Validation:** `class-validator`, `class-transformer`, `zod`
* **Documentation:** Swagger OpenAPI (`/docs`)

---

## 🏗️ Architecture & Modules

```
backend/
├── src/
│   ├── config/              # Zod environment validation
│   ├── shared/
│   │   ├── prisma/          # PrismaService (MongoDB connection)
│   │   └── pagination/      # Pagination metadata builders
│   ├── common/
│   │   ├── decorators/      # @Roles(), @CurrentUser()
│   │   ├── guards/          # JwtAuthGuard, RolesGuard
│   │   ├── http/            # ApiResponse standard envelope
│   │   ├── interceptors/    # Logging, Transform interceptor
│   │   └── pipes/           # Custom validation pipes
│   ├── database/
│   │   └── seed.ts          # Database seeder (Admin, T-shirts, Placements, Settings)
│   └── modules/
│       ├── auth/            # Admin PIN login & customer auth
│       ├── products/        # T-Shirt catalog (GSM, Fabric, Colors, Size Charts)
│       ├── placements/      # DTF Print Placements (Full Front, Full Back, Chest, etc.)
│       ├── orders/          # Customizer Order flow, 1/3 deposit, COD logic, tracking
│       ├── settings/        # KBZPay, WavePay QR, deposit %, contact info
│       ├── storage/         # Google Drive upload service (with local fallback)
│       └── telegram/        # Instant Telegram order notifications
```

---

## ⚙️ Environment Configuration (`.env`)

Create a `.env` file in the `backend/` directory:

```env
PORT=4000
NODE_ENV=development
APP_ORIGIN=http://localhost:3000,http://localhost:3001

# MongoDB Atlas Database URL
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.mongodb.net/zeru_printing?retryWrites=true&w=majority"

# JWT Secret
JWT_SECRET="zeru_printing_super_secret_jwt_key_2026"
JWT_EXPIRES_IN="30d"

# Admin Master PIN Code
ADMIN_DEFAULT_PIN="281120"

# Google Drive Storage (Service Account) - Optional
GOOGLE_DRIVE_CLIENT_EMAIL="your-sa@project.iam.gserviceaccount.com"
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID="your_google_drive_folder_id"

# Telegram Bot Alert - Optional
TELEGRAM_BOT_TOKEN="123456789:ABCdef..."
TELEGRAM_CHAT_ID="987654321"
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npm run prisma:generate
```

### 3. Run Database Seeder
Seeds initial Admin account, 3 base T-shirts (240 GSM, 290 GSM, 350 GSM Air Layer), size charts, and DTF placement zones:
```bash
npm run prisma:seed
```

### 4. Run Development Server
```bash
npm run start:dev
```

* **API Base URL:** `http://localhost:4000`
* **Swagger API Documentation:** `http://localhost:4000/docs`

---

## 📋 API Endpoints Overview

### 🔐 Authentication
* `POST /auth/admin-pin-login` — Quick Admin login with secure PIN
* `POST /auth/login` — Customer email/password login
* `POST /auth/register` — Register customer account

### 👕 Products (Garments & T-Shirts)
* `GET /products` — Public list of customizable & ready-to-wear t-shirts
* `GET /products/:id` — Product detail (with size chart in inches & color mockups)
* `GET /products/slug/:slug` — Product detail by slug
* `POST /products/admin` — Admin create t-shirt
* `PATCH /products/admin/:id` — Admin update t-shirt & size chart
* `PATCH /products/admin/:id/toggle` — Admin toggle active/inactive
* `DELETE /products/admin/:id` — Admin delete product

### 🎯 DTF Print Placements
* `GET /placements` — Public list of active placement zones (Full Front, Full Back, Chest, etc.)
* `GET /placements/admin/all` — Admin list all placements
* `POST /placements/admin` — Admin create placement
* `PATCH /placements/admin/:id` — Admin update pricing (MMK) and dimensions

### 📦 Orders & Customizer Flow
* `POST /orders` — Submit customizer order (with multi-size quantities, 1/3 deposit, KPay/WavePay slip)
* `POST /orders/upload-artwork` — Upload customer high-res DTF sticker image (saves to Google Drive)
* `POST /orders/upload-slip` — Upload KPay/WavePay deposit payment slip (saves to Google Drive)
* `GET /orders/track?orderNumber=...&phone=...` — Track order status
* `GET /orders/admin/list` — Admin list orders (with status and pagination filters)
* `GET /orders/admin/:id` — Admin get complete order details with artwork download links
* `PATCH /orders/admin/:id/status` — Admin update status (`PENDING_DEPOSIT` ➔ `DEPOSIT_CONFIRMED` ➔ `IN_PRODUCTION` ➔ `READY_FOR_DELIVERY` ➔ `COMPLETED`)

### ⚙️ Store Settings
* `GET /settings/payment-info` — Public KPay/WavePay account details & deposit percentage
* `GET /settings/admin` — Admin view full settings
* `PATCH /settings/admin` — Admin update payment accounts, QR codes, and contact info
