# Lumora

Lumora is a role-based karaoke restaurant operations platform. It includes room management, waiter POS, independent Bar and Kitchen fulfillment, menu and inventory management, staff attendance, and daily reporting.

## Project structure

- `frontend/` — React and Vite web application
- `backend/` — Express API, Prisma ORM, and PostgreSQL schema

## Local development

Start the API:

```bash
cd backend
npm install
npx prisma migrate deploy
npm run seed:rbac
npm run dev
```

Start the web application in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Environment values belong in `backend/.env`. The file is excluded from version control.

## Quality checks

```bash
cd frontend && npm run lint && npm run build
cd backend && npx prisma validate
```
