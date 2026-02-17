# Brisk - Online Bike & Ski Rentals

A full-stack web application for renting bikes and skis, built with Node.js, Express, React, and SQLite.

> 🤖 **Built with AI Assistance**: This project was developed using GitHub Copilot AI agent in Visual Studio Code, demonstrating rapid full-stack application development.

⚠️ **SECURITY WARNING**: This project is designed as a vulnerable application for educational purposes and security testing with Kali Linux and similar penetration testing tools. **DO NOT USE IN PRODUCTION**. This application contains intentional vulnerabilities for learning and testing purposes.

## Features

- 🚴 Browse and search bike & ski rentals
- 👤 User authentication (register, login, logout)
- 📅 Make and manage reservations with date selection
- 🛡️ Role-based access control (customer, admin)
- 🎯 Admin dashboard to manage products and reservations
- 💾 SQLite database with Prisma ORM
- 🔐 Secure session-based authentication with bcrypt

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: Session-cookie based with bcrypt
- **Validation**: Zod
- **CORS**: Configured for cross-origin requests

## Prerequisites

- Node.js 18+ (installed via Homebrew on macOS)
- npm (comes with Node.js)

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/grep-kareem/MSSE642_Spring2026.git
cd MSSE642_Spring2026
```

Or if you want to use a different directory name:

```bash
git clone https://github.com/grep-kareem/MSSE642_Spring2026.git your-directory-name
cd your-directory-name
```

### 2. Install dependencies

```bash
npm install
```

This will install dependencies for both the API and web directories using npm workspaces.

### 3. Set up the database

```bash
npm run db:migrate
```

This creates the SQLite database and runs Prisma migrations.

### 4. Seed the database

```bash
npm run db:seed
```

This creates the initial data including:

- 2 admin users, 1 staff, 6 customers (with weak/common passwords)
- 10 products (bikes and skis)
- 5 sample reservations
- 5 product reviews
- 4 user notes (some with fake sensitive data)

### 5. Run the application

```bash
npm run dev
```

This starts both the API server (port 4000) and the web dev server (port 3000) concurrently.

The app will be available at:

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000

## Accessing from Another Machine on Your Network

To access the app from another machine (such as Kali Linux for security testing):

### 1. Find your host machine's IP address

**On macOS:**

```bash
ipconfig getifaddr en0  # Ethernet
ipconfig getifaddr en1  # WiFi
# Example output: 192.168.1.100
```

**On Linux:**

```bash
hostname -I
# or
ip addr show
```

### 2. Use the correct IP address

When accessing from another machine on the same network:

- Frontend: http://[YOUR_MACHINE_IP]:3000
- API: http://[YOUR_MACHINE_IP]:4000

Replace `[YOUR_MACHINE_IP]` with the actual IP address you found above.

### 3. Example: Accessing from Kali Linux

```bash
# From your Kali machine, replace with your actual host IP
curl http://192.168.1.100:3000
firefox http://192.168.1.100:3000  # Open in browser
```

The app uses `/api` proxy paths internally, which work seamlessly across the network.

## Security Testing with Kali Linux

This application is intentionally designed with vulnerabilities for educational security testing purposes. Use this project to practice:

### Vulnerability Categories

| #   | Category                         | Endpoints / Areas                                                                                                |
| --- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | **SQL Injection**                | `GET /api/users?search=`, `GET /api/debug/db?query=`, `GET /api/admin/export?table=`                             |
| 2   | **Stored XSS**                   | `POST /api/reviews` → body rendered as raw HTML on product pages                                                 |
| 3   | **Reflected XSS**                | `GET /api/search?q=` returns HTML with unsanitized query                                                         |
| 4   | **Command Injection**            | `POST /api/debug/exec` executes shell commands                                                                   |
| 5   | **Path Traversal**               | `GET /api/debug/file?path=`, `GET /api/uploads/files/:filename`                                                  |
| 6   | **IDOR**                         | `GET /api/users/:id`, `GET /api/notes/:id`, `DELETE /api/reviews/:id`, `PUT /api/notes/:id`                      |
| 7   | **Privilege Escalation**         | `PUT /api/users/profile` (mass assignment, set role=admin), `POST /api/auth/register` (role field accepted)      |
| 8   | **Broken Authentication**        | Weak passwords, user enumeration on login, no rate limiting, no account lockout                                  |
| 9   | **Insecure Password Reset**      | `POST /api/users/reset-password` (token leaked in response, base64 predictable tokens)                           |
| 10  | **Information Disclosure**       | `GET /api/debug/config`, `GET /api/debug/users`, `GET /api/debug/logs`, verbose error messages with stack traces |
| 11  | **SSRF**                         | `GET /api/fetch?url=` fetches arbitrary URLs from the server                                                     |
| 12  | **Open Redirect**                | `GET /api/redirect?url=` redirects to any URL                                                                    |
| 13  | **Arbitrary Code Execution**     | `POST /api/debug/eval` runs JavaScript via eval()                                                                |
| 14  | **Unrestricted File Upload**     | `POST /api/uploads` accepts any file type, no size limit, filename path traversal                                |
| 15  | **Insecure Session Config**      | httpOnly=false, sameSite=none, 1-year expiry, accessible via JavaScript                                          |
| 16  | **Missing Security Headers**     | No CSP, X-Frame-Options, X-Content-Type-Options — clickjacking possible                                          |
| 17  | **CORS Misconfiguration**        | Wildcard origin with credentials allowed                                                                         |
| 18  | **Sensitive Data in Notes**      | Private notes accessible via IDOR; seed data contains fake credentials/keys                                      |
| 19  | **Technology Fingerprinting**    | `X-Powered-By` and `Server` headers reveal stack; `/api/health` exposes version info                             |
| 20  | **Directory/Endpoint Discovery** | `robots.txt` and `sitemap.xml` reveal hidden API paths                                                           |

### Suggested Kali Tools

- **Nikto** — Web server scanner (headers, fingerprinting, common paths)
- **SQLmap** — Automated SQL injection (`sqlmap -u "http://target:4000/api/users?search=test" --dbs`)
- **Burp Suite** — Intercepting proxy for manual testing (XSS, IDOR, CSRF)
- **OWASP ZAP** — Automated web app scanner
- **DirBuster / Gobuster** — Directory/endpoint enumeration
- **Hydra** — Brute-force login (`hydra -l admin@brisk.com -P /usr/share/wordlists/rockyou.txt target http-post-form`)
- **curl** — Manual API testing
- **wfuzz** — Web fuzzer for parameter testing
- **nmap** — Port scanning and service detection
- **XSSer** — Automated XSS detection

**Always test responsibly and only on systems you own or have permission to test.**

## Default Credentials

After seeding, you can log in with:

| Role     | Email                | Password      |
| -------- | -------------------- | ------------- |
| Admin    | `admin@brisk.com`    | `admin123`    |
| Admin    | `manager@brisk.com`  | `manager1`    |
| Staff    | `staff@brisk.com`    | `staff2024`   |
| Customer | `customer@brisk.com` | `customer123` |
| Customer | `jane@brisk.com`     | `password`    |
| Customer | `bob@brisk.com`      | `123456`      |
| Customer | `alice@brisk.com`    | `qwerty`      |
| Customer | `charlie@brisk.com`  | `letmein`     |
| Customer | `test@test.com`      | `test`        |

## Project Structure

```
brisk/
├── api/                      # Backend (Node.js + Express)
│   ├── src/
│   │   ├── index.ts         # Express server setup
│   │   ├── middleware.ts    # Auth middleware
│   │   ├── seed.ts          # Database seed script
│   │   └── routes/
│   │       ├── auth.ts      # Auth endpoints (register, login, logout)
│   │       ├── products.ts  # Product endpoints (CRUD)
│   │       ├── reservations.ts  # Reservation endpoints
│   │       ├── admin.ts     # Admin endpoints
│   │       ├── reviews.ts   # Product reviews (stored XSS)
│   │       ├── users.ts     # User profiles (IDOR, SQLi, mass assignment)
│   │       ├── notes.ts     # User notes (IDOR)
│   │       ├── uploads.ts   # File uploads (unrestricted upload, path traversal)
│   │       └── debug.ts     # Debug endpoints (RCE, info disclosure, SSRF)
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── package.json
│   └── tsconfig.json
├── web/                      # Frontend (React + Vite)
│   ├── public/
│   │   ├── robots.txt       # Reveals hidden paths
│   │   └── sitemap.xml      # Reveals hidden endpoints
│   ├── src/
│   │   ├── main.tsx         # Entry point
│   │   ├── App.tsx          # Router setup
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # Auth context provider
│   │   ├── components/
│   │   │   └── Header.tsx   # Header component
│   │   └── pages/
│   │       ├── Home.tsx     # Product catalog
│   │       ├── ProductDetail.tsx  # Product details, reservation & reviews (XSS)
│   │       ├── Login.tsx    # Login page
│   │       ├── Register.tsx # Registration page
│   │       ├── Dashboard.tsx # Customer dashboard
│   │       ├── Admin.tsx    # Admin panel
│   │       └── NotFound.tsx # 404 page
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
├── package.json             # Root package.json with workspaces
└── README.md
```

## Available NPM Scripts

### Root level (runs both API and web)

```bash
npm run dev          # Run both API and frontend concurrently
npm run build        # Build both API and frontend
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed the database
npm run db:studio    # Open Prisma Studio (database GUI)
```

### API only

```bash
cd api
npm run dev          # Start API in watch mode
npm run build        # Build TypeScript
npm start            # Run compiled API
npm run migrate      # Run migrations
npm run seed         # Seed database
npm run studio       # Open Prisma Studio
```

### Web only

```bash
cd web
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user (accepts role field — privilege escalation)
- `POST /api/auth/login` - Login user (user enumeration via error messages)
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Products (Public)

- `GET /api/products` - List products (with filters: category, minPrice, maxPrice, search)
- `GET /api/products/:id` - Get product details

### Products (Admin only)

- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Reservations

- `POST /api/reservations` - Create reservation
- `GET /api/reservations` - List user's reservations
- `GET /api/reservations/:id` - Get reservation details
- `PUT /api/reservations/:id` - Update reservation status

### Reviews

- `GET /api/reviews/product/:productId` - Get reviews for a product
- `POST /api/reviews` - Create review (stored XSS via body field)
- `DELETE /api/reviews/:id` - Delete review (IDOR — no ownership check)

### Users

- `GET /api/users` - List all users (leaks emails)
- `GET /api/users?search=` - Search users (SQL injection)
- `GET /api/users/:id` - Get user profile (IDOR — leaks password hash and private data)
- `PUT /api/users/profile` - Update profile (mass assignment — can set role)
- `POST /api/users/reset-password` - Request password reset (user enumeration, token leaked)
- `POST /api/users/reset-password/confirm` - Confirm reset (weak token validation)

### Notes

- `GET /api/notes` - List current user's notes
- `GET /api/notes/public` - List public notes
- `GET /api/notes/:id` - Get note (IDOR — any auth user can read any note)
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note (IDOR)
- `DELETE /api/notes/:id` - Delete note (IDOR)

### File Uploads

- `POST /api/uploads` - Upload file (unrestricted type, path traversal in filename)
- `GET /api/uploads` - List all uploads (shows all users' files)
- `GET /api/uploads/files/:filename` - Download file (path traversal)
- `DELETE /api/uploads/:id` - Delete upload (IDOR)

### Search

- `GET /api/search?q=` - HTML search results (reflected XSS)

### Admin

- `GET /api/admin/users` - List all users (includes password hashes)
- `GET /api/admin/reservations` - List all reservations
- `GET /api/admin/export?table=&format=` - Export data (SQL injection via table name)
- `PUT /api/admin/users/:id/role` - Change user role
- `DELETE /api/admin/users/:id` - Delete user

### Debug (No Authentication Required!)

- `GET /api/debug/config` - Application config & environment variables
- `GET /api/debug/users` - All users with password hashes
- `GET /api/debug/db?query=` - Arbitrary SQL query execution
- `POST /api/debug/exec` - System command execution (RCE)
- `GET /api/debug/file?path=` - Read arbitrary files (path traversal)
- `POST /api/debug/eval` - JavaScript eval() execution
- `GET /api/debug/logs` - Application logs & environment
- `GET /api/debug/sessions` - All active sessions

### Miscellaneous

- `GET /api/health` - Health check (leaks version info)
- `GET /api/redirect?url=` - Open redirect
- `GET /api/fetch?url=` - SSRF — fetch arbitrary URLs from server

## Features & Usage

### 1. Browse Products

- Home page displays all available bikes and skis
- Filter by category (bikes/skis), price range, or search by name

### 2. Make a Reservation

- Click on any product to view details
- Select start and end dates
- See estimated cost for your reservation
- Create reservation (requires login)

### 3. View Reservations

- Dashboard shows your upcoming and past reservations
- Cancel upcoming reservations anytime

### 4. Admin Functions

- Manage products: create, edit, delete
- View all reservations across the system
- Change reservation status (active → completed/cancelled)
- View all users

## Database Schema

### Users

- id, email (unique), name, password (bcrypt hash), role (customer/admin/staff), timestamps

### Products

- id, name, category (bike/ski), size, dailyPrice, description, imageUrl, timestamps

### Reservations

- id, userId, productId, startDate, endDate, status (active/cancelled/completed), timestamps
- Prevents overlapping reservations for the same product

### Sessions

- id, userId, expiresAt, createdAt

### Reviews

- id, productId, userId, rating, title, body (unsanitized HTML), timestamps

### Notes

- id, userId, title, content, isPublic (boolean), timestamps

### UploadedFiles

- id, userId, filename, originalName, mimetype, size, path, createdAt

## Validation

Input validation is intentionally weakened for security testing:

- User registration accepts 1-character passwords and an optional `role` field (privilege escalation)
- Reviews and notes accept raw HTML/JavaScript (no sanitization)
- File uploads accept any file type with no size or content validation
- Several endpoints use raw SQL with string interpolation (SQL injection)
- User profile update accepts any fields via mass assignment

## Error Handling

- **Intentionally verbose error messages** — stack traces, SQL errors, and internal paths are leaked in responses
- Login errors reveal whether an email exists or not (user enumeration)
- 404 responses include the attempted path and HTTP method
- Debug endpoints expose full environment variables and configuration

## Environment Variables

### API (.env)

```
DATABASE_URL=file:./dev.db
API_PORT=4000
NODE_ENV=development
```

### Web

The web app connects to API via relative `/api` paths (Vite proxy in dev mode).

## Troubleshooting

### Port already in use

If port 3000 or 4000 is already in use:

```bash
# Find process using port
lsof -i :3000  # or :4000

# Kill process
kill -9 <PID>
```

### Database issues

```bash
# Reset database (deletes all data)
rm api/prisma/dev.db
npm run db:migrate
npm run db:seed
```

### CORS errors when accessing from Kali

- Make sure you're using the correct IP address
- Check that both services are running
- Verify the frontend is connecting to the correct API URL

## Development Notes

- The API binds to `0.0.0.0` (all interfaces) for network access
- Session cookies have `httpOnly=false` (accessible via JavaScript), `sameSite=none`, and 1-year expiry
- CORS is configured with wildcard origin + credentials (any site can make authenticated requests)
- `X-Powered-By` and `Server` headers expose the technology stack
- No security headers (CSP, X-Frame-Options, X-Content-Type-Options) are set
- Debug routes are exposed without authentication
- Several routes use `$queryRawUnsafe` with string interpolation

## Production Deployment

⚠️ **THIS APPLICATION IS NOT SUITABLE FOR PRODUCTION USE**

This project intentionally contains security vulnerabilities for educational purposes. Before deploying any application to production:

1. Remove all test/dummy data and credentials
2. Implement proper security measures (HTTPS, CSRF protection, input sanitization)
3. Use a proper session store (Redis, database-backed)
4. Enable security headers and middleware
5. Audit code for vulnerabilities
6. Use a reverse proxy (nginx, Apache)
7. Set `NODE_ENV=production`
8. Use environment variables from a secure `.env` file
9. Run database migrations: `npm run db:migrate:prod`

**If you're interested in security hardening, use this project as a learning tool to identify and understand common vulnerabilities.**

## License

MIT
