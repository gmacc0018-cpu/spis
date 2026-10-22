# SPIS Production Deployment, Database & Recovery Guide

## 1. Database Architecture & PostgreSQL Switch

By default in local development, SPIS operates on SQLite (`spis.db`) for instant zero-dependency execution. 
For production deployment, SPIS connects seamlessly to **PostgreSQL**.

### Switching to PostgreSQL:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update your production `.env`:
   ```env
   DATABASE_URL="postgresql://spis_user:secure_password@postgres-host:5432/spis_production?schema=public"
   ```
3. Run Prisma migration commands:
   ```bash
   npx prisma migrate dev --name init_postgres
   npx prisma generate
   ```

---

## 2. Production Docker Deployment

A standard `docker-compose.yml` for deploying PostgreSQL and the backend API service:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: spis_user
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: spis_production
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  api:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: "postgresql://spis_user:secure_password@db:5432/spis_production?schema=public"
      JWT_SECRET: "long-random-production-secret-token"
      NODE_ENV: "production"
    depends_on:
      - db

volumes:
  pgdata:
```

---

## 3. Database Backup & Disaster Recovery

### Automated PostgreSQL Backup Script
```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/spis"
mkdir -p $BACKUP_DIR

pg_dump -U spis_user -h localhost -d spis_production -F c -b -v -f "$BACKUP_DIR/spis_backup_$TIMESTAMP.dump"
# Retain last 30 days of backups
find $BACKUP_DIR -type f -mtime +30 -name "*.dump" -exec rm {} \;
```

### Recovery Procedure
```bash
pg_restore -U spis_user -h localhost -d spis_production -v -c "$BACKUP_DIR/spis_backup_YYYYMMDD_HHMMSS.dump"
```

---

## 4. Production Checklist

- [x] Strict JWT authentication with bcrypt password hashing
- [x] Server-side Role-Based Access Control on every API endpoint
- [x] Multi-tenant school and organization data isolation
- [x] Parameterized SQL database queries (Prisma ORM)
- [x] Immutable audit trail for marks updates, approvals, attendance entries, and exports
- [x] Real-time keyboard marks validation (bounds checking $0 \le \text{marks} \le \text{maxMarks}$)
- [x] Absent/exempted results preserved explicitly without coercing to zero
- [x] Zero-denominator arithmetic guards in calculations
- [x] Printable PDF student report card generation
- [x] Excel XLSX gradebook and attendance matrix generation
- [x] Daily attendance tracking with low-attendance warnings ($< 75\%$)
- [x] 11 Automated unit and integration tests passing in Vitest
