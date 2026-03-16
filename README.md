# Smart Banking Asset Management System (SBAMS)

A full-stack MVP for tracking the lifecycle, ownership, and status of IT and office assets inside a banking environment.

## Features

- Asset registration with automatic QR code generation
- Asset assignment tracking (one active owner enforced)
- Lifecycle status management (REGISTERED → ASSIGNED → IN_REPAIR → LOST → WRITTEN_OFF)
- QR code scanning and lookup
- Audit logging of all system actions
- Role-based access control (ADMIN / AUDITOR / USER)
- Reporting and analytics dashboard

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Backend    | Java 17, Spring Boot 3, Spring Security + JWT |
| ORM        | Spring Data JPA, Hibernate        |
| Database   | PostgreSQL                        |
| QR Codes   | ZXing                             |
| Frontend   | React 18 + Vite                   |
| Container  | Docker + Docker Compose           |

---

## Getting Started

### Prerequisites

- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Docker (optional)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/sbams.git
cd sbams
```

### 2. Backend

```bash
cd backend
cp src/main/resources/application.example.yml src/main/resources/application.yml
# Edit application.yml with your DB credentials
./mvnw spring-boot:run
```

Backend runs at `http://localhost:8080`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### 4. Docker (all-in-one)

```bash
docker-compose up --build
```

---

## Project Structure

```
sbams/
├── backend/                  # Spring Boot application
│   └── src/main/java/com/sbams/
│       ├── config/           # Security, CORS, app config
│       ├── controller/       # REST controllers
│       ├── service/          # Business logic
│       ├── repository/       # JPA repositories
│       ├── model/            # JPA entities
│       ├── dto/              # Request/response DTOs
│       └── audit/            # Audit logging
├── frontend/                 # React application
│   └── src/
│       ├── pages/            # Route-level components
│       ├── components/       # Reusable UI components
│       ├── api/              # API client (Axios)
│       └── context/          # Auth context
├── docker-compose.yml
└── .github/workflows/        # CI/CD pipeline
```

---

## API Overview

| Method | Endpoint                          | Description                    | Role       |
|--------|-----------------------------------|--------------------------------|------------|
| POST   | `/api/auth/login`                 | Obtain JWT token               | PUBLIC     |
| GET    | `/api/assets`                     | List all assets                | ALL        |
| POST   | `/api/assets`                     | Register new asset             | ADMIN      |
| GET    | `/api/assets/{id}`                | Asset detail + QR              | ALL        |
| PUT    | `/api/assets/{id}/status`         | Update asset status            | ADMIN      |
| POST   | `/api/assignments`                | Assign asset to employee       | ADMIN      |
| PUT    | `/api/assignments/{id}/return`    | Return asset                   | ADMIN      |
| GET    | `/api/qr/{assetId}`               | QR code lookup                 | ALL        |
| GET    | `/api/reports/summary`            | Asset statistics               | ADMIN/AUDITOR |
| GET    | `/api/audit`                      | Audit log                      | AUDITOR    |

---

## Development Timeline

| Week | Focus |
|------|-------|
| 1 | Project init, environment setup |
| 2 | Database schema, backend entities |
| 3 | Asset CRUD APIs, QR generation |
| 4 | Assignment logic, lifecycle management |
| 5 | Frontend, QR lookup |
| 6 | Reporting, audit logging, testing, deployment |

---

## License

MIT
