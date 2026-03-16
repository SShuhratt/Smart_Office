# 🚀 SBAMS Launch Guide

Step-by-step instructions to run the Smart Banking Asset Management System locally or with Docker.

---

## Option A — Docker (Recommended)

The fastest way to get everything running. Requires only Docker Desktop.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Steps

**1. Clone the repository**

```bash
git clone https://github.com/your-org/sbams.git
cd sbams
```

**2. Create your environment file**

```bash
cp .env.example .env
```

Open `.env` and set your values:

```env
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=your-256-bit-secret-key-here
```

> ⚠️ Use a strong random string for `JWT_SECRET` in any environment beyond local testing.  
> You can generate one with: `openssl rand -hex 32`

**3. Start all services**

```bash
docker compose up --build
```

This will start three containers:
| Container  | Port | Description              |
|------------|------|--------------------------|
| `db`       | 5432 | PostgreSQL 16            |
| `backend`  | 8080 | Spring Boot API          |
| `frontend` | 80   | React app served by Nginx |

**4. Open the app**

```
http://localhost
```

**Default login credentials:**

| Username | Password   | Role    |
|----------|------------|---------|
| admin    | admin123   | ADMIN   |
| auditor  | auditor123 | AUDITOR |

> Credentials are seeded automatically on first startup.

**5. Stop the app**

```bash
docker compose down
```

To also delete the database volume:

```bash
docker compose down -v
```

---

## Option B — Manual (Local Development)

Run the backend and frontend separately for a faster development workflow.

### Prerequisites

| Tool        | Version  | Download |
|-------------|----------|----------|
| Java        | 17+      | https://adoptium.net |
| Maven       | 3.9+     | https://maven.apache.org |
| Node.js     | 18+      | https://nodejs.org |
| PostgreSQL  | 14+      | https://www.postgresql.org/download |

---

### Step 1 — Set up the Database

Open a terminal and connect to PostgreSQL:

```bash
psql -U postgres
```

Create the database:

```sql
CREATE DATABASE bank_assets;
\q
```

---

### Step 2 — Configure the Backend

```bash
cd backend
cp src/main/resources/application.example.yml src/main/resources/application.yml
```

Edit `application.yml` and fill in your database credentials:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/bank_assets
    username: YOUR_DB_USERNAME
    password: YOUR_DB_PASSWORD

app:
  jwt:
    secret: YOUR_SECRET_KEY
```

---

### Step 3 — Start the Backend

```bash
cd backend
./mvnw spring-boot:run
```

> On Windows use: `mvnw.cmd spring-boot:run`

The API will be available at `http://localhost:8080/api`

Wait for the log line:
```
Started SbamsApplication in X.XXX seconds
```

---

### Step 4 — Start the Frontend

Open a **new terminal tab**:

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

Vite automatically proxies all `/api` requests to `http://localhost:8080`.

---

### Step 5 — Log in

Open `http://localhost:5173` in your browser.

| Username | Password   | Role    |
|----------|------------|---------|
| admin    | admin123   | ADMIN   |
| auditor  | auditor123 | AUDITOR |

---

## Running Tests

### Backend unit tests

```bash
cd backend
./mvnw test
```

### Frontend build check

```bash
cd frontend
npm run build
```

---

## API Quick Reference

Base URL: `http://localhost:8080/api`

All endpoints except `/auth/login` require a Bearer token in the `Authorization` header.

### Authentication

```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Returns a JWT token. Use it in subsequent requests:

```http
Authorization: Bearer <token>
```

### Key Endpoints

| Method | Endpoint                       | Description                  |
|--------|--------------------------------|------------------------------|
| POST   | `/auth/login`                  | Get JWT token                |
| GET    | `/assets`                      | List assets (filter by status/category/search) |
| POST   | `/assets`                      | Register new asset           |
| GET    | `/assets/{id}`                 | Asset detail + QR + history  |
| PUT    | `/assets/{id}/status`          | Update asset status          |
| DELETE | `/assets/{id}`                 | Delete asset                 |
| POST   | `/assignments`                 | Assign asset to employee     |
| PUT    | `/assignments/{id}/return`     | Return asset                 |
| GET    | `/employees`                   | List employees               |
| POST   | `/employees`                   | Add employee                 |
| GET    | `/qr/{assetId}`                | QR code asset lookup         |
| GET    | `/reports/summary`             | Asset statistics             |
| GET    | `/audit`                       | Audit log (paginated)        |

---

## Project Structure

```
sbams/
├── backend/                        # Spring Boot application
│   ├── src/main/java/com/sbams/
│   │   ├── config/                 # JWT, Security, CORS, exception handler
│   │   ├── controller/             # REST controllers
│   │   ├── service/                # Business logic
│   │   ├── repository/             # JPA repositories
│   │   ├── model/                  # JPA entities + enums
│   │   ├── dto/                    # Request / response objects
│   │   └── audit/                  # Audit logging
│   ├── src/main/resources/
│   │   └── application.yml         # App configuration
│   ├── src/test/                   # Unit tests
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                       # React 18 + Vite application
│   ├── src/
│   │   ├── api/                    # Axios API client
│   │   ├── components/             # Shared UI components
│   │   ├── context/                # Auth context
│   │   └── pages/                  # Route-level pages
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── .github/workflows/ci.yml        # GitHub Actions CI pipeline
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Troubleshooting

**Port already in use**

```bash
# Find and kill the process using port 8080
lsof -ti:8080 | xargs kill -9

# Or change the port in application.yml:
server:
  port: 8081
```

**Database connection refused**

- Make sure PostgreSQL is running: `pg_isready`
- Check that `bank_assets` database exists
- Verify credentials in `application.yml` match your PostgreSQL setup

**Docker: containers not starting**

```bash
# View logs for a specific service
docker compose logs backend
docker compose logs db

# Rebuild from scratch
docker compose down -v
docker compose up --build
```

**Frontend shows blank page after build**

- Clear browser cache and hard reload (`Ctrl + Shift + R`)
- Check the browser console for errors
- Ensure the backend is running and accessible

---

## CI/CD

The GitHub Actions pipeline (`.github/workflows/ci.yml`) automatically runs on every push to `main` or `develop`:

1. **Backend job** — compiles the project and runs all unit tests against a temporary PostgreSQL instance
2. **Frontend job** — installs dependencies and runs `npm run build`
3. **Docker job** — builds both Docker images to verify the `Dockerfile`s are valid (runs on `main` only)
