# Brisk - Online Bike & Ski Rentals

A full-stack web application for renting bikes and skis, built with Node.js, Express, React, and SQLite.

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

### 1. Clone/Create the project

```bash
cd /Users/ahmedkareem/brisk
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

- 1 admin user
- 1 customer user
- 6 products (bikes and skis)
- 1 sample reservation

### 5. Run the application

```bash
npm run dev
```

This starts both the API server (port 4000) and the web dev server (port 3000) concurrently.

The app will be available at:

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000

## Accessing from Another Machine (Kali Linux)

To access the app from another machine on your network:

### 1. Find your Mac's IP address

```bash
ipconfig getifaddr en0  # or en1 for WiFi
# Example output: 192.168.1.100
```

### 2. Update the frontend environment (if needed)

The app uses relative `/api` paths which will work across the network. However, if you need explicit URLs:

- Frontend: http://[YOUR_MAC_IP]:3000
- API: http://[YOUR_MAC_IP]:4000

### 3. Access from Kali

```bash
# From your Kali machine
curl http://192.168.1.100:3000  # Replace with your Mac IP
```

Or open in browser:

```
http://192.168.1.100:3000
```

## Default Credentials

After seeding, you can log in with:

### Admin Account

- **Email**: `admin@brisk.com`
- **Password**: `admin123`

### Customer Account

- **Email**: `customer@brisk.com`
- **Password**: `customer123`

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
│   │       └── admin.ts     # Admin endpoints
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── package.json
│   └── tsconfig.json
├── web/                      # Frontend (React + Vite)
│   ├── src/
│   │   ├── main.tsx         # Entry point
│   │   ├── App.tsx          # Router setup
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # Auth context provider
│   │   ├── components/
│   │   │   └── Header.tsx   # Header component
│   │   └── pages/
│   │       ├── Home.tsx     # Product catalog
│   │       ├── ProductDetail.tsx  # Product details & reservation
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

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
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

### Admin

- `GET /api/admin/users` - List all users
- `GET /api/admin/reservations` - List all reservations

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

## Validation

Input validation is performed using Zod on all API requests:

- User registration (email, password strength, name)
- Product creation/updates
- Reservation creation (date validation, availability)

## Error Handling

- User-friendly error messages returned in API responses
- Input validation errors with detailed field information
- 404 page for non-existent routes
- Proper HTTP status codes (400, 401, 403, 404, 500)

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
- Sessions use httpOnly cookies for security
- Session timeout: 30 days
- CORS is configured to allow the web origin only
- All database operations use Prisma ORM for type safety

## Production Deployment

For production:

1. Set `NODE_ENV=production`
2. Use a persistent session store (currently in-memory)
3. Enable HTTPS/SSL
4. Use environment variables from a secure `.env` file
5. Run database migrations: `npm run db:migrate:prod`
6. Start with: `npm start` (in api directory)

## License

MIT
