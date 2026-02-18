# Game Plan AI — development commands
# Install just: https://github.com/casey/just

set dotenv-load

# List available recipes
default:
    @just --list

# — Setup ——————————————————————————————————————————

# First-time project setup
setup: _env-check
    npm install
    npx prisma generate
    npx prisma db push
    @echo "Done! Run 'just dev' to start."

# Copy .env.example → .env if missing
_env-check:
    @[ -f .env ] || (cp .env.example .env && echo "Created .env from .env.example")

# Seed the database with sample data
seed:
    npm run db:seed

# Reset database (drop + recreate + seed)
db-reset:
    rm -f prisma/dev.db prisma/dev.db-journal
    npx prisma db push
    npm run db:seed

# — Development ————————————————————————————————————

# Start dev server (Turbopack)
dev:
    npm run dev

# Production build
build:
    npm run build

# Start production server
start:
    npm run start

# Open Prisma Studio
studio:
    npm run db:studio

# — Code Quality ———————————————————————————————————

# Run all checks (lint + typecheck + test)
check: lint typecheck test-unit

# Lint
lint:
    npm run lint

# TypeScript type-check
typecheck:
    npm run typecheck

# — Testing —————————————————————————————————————————

# Unit + integration tests (watch mode)
test:
    npm run test

# Unit + integration tests (single run)
test-unit:
    npm run test:unit

# Integration tests only
test-integration:
    npm run test:integration

# E2E tests (Playwright)
test-e2e:
    npm run test:e2e

# Tests with coverage report
test-coverage:
    npm run test:coverage

# — Database ————————————————————————————————————————

# Generate Prisma client
db-generate:
    npm run db:generate

# Push schema changes to dev database
db-push:
    npm run db:push

# Create a new migration
db-migrate:
    npm run db:migrate

# — Docker ——————————————————————————————————————————

# Build and start with Docker Compose
docker-up:
    docker compose up --build

# Stop Docker Compose
docker-down:
    docker compose down
