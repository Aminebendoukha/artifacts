# Orbit

Orbit is a B2B client ordering portal with two experiences in one application:

- A **Client** workspace for submitting projects, tracking progress, and reviewing order details.
- An **Admin** workspace for reviewing all orders, switching statuses, and monitoring the pipeline in table or Kanban form.

The application is split into a decoupled React frontend and a Node.js backend that communicate over a REST API. The frontend uses React Query for server state, so dashboards, order details, and mutations always reflect the backend as the source of truth.

## Project Overview & Architecture

Orbit is organized as a full-stack monorepo-style workspace:

- The **frontend** is the Vite + React app at the repository root.
- The **backend** lives in [`backend/`](backend) and exposes the REST API.
- PostgreSQL stores workspaces, users, orders, and attachments through Prisma ORM.

The client app talks to the backend through fetch-based React Query hooks. A small demo role switcher lets you flip between Client and Admin views without authentication, while the backend uses a mock-role header to simulate role-aware responses during local development.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, shadcn/ui-style primitives, React Router, React Query
- **Backend:** Node.js, Express.js, Prisma ORM
- **Database:** PostgreSQL

## Features

- Client Dashboard with order stats and a recent-orders table
- Multi-step New Order wizard with validation and file attachment support
- Admin Dashboard with table and Kanban views
- Order detail view with progress tracking and attachments
- Status updates from the Admin view backed by REST mutations
- Local upload endpoint for storing files in an `uploads/` folder

## Prerequisites

- Node.js 20+ and npm
- Docker Desktop for the PostgreSQL database
- A terminal capable of running PowerShell or your preferred shell

## Environment Variables

Create a frontend `.env` file at the repository root and a backend `.env` file in [`backend/`](backend).

Frontend `.env.example`:

```env
VITE_API_URL=http://localhost:3001/api
```

Backend `.env.example`:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/orbit?schema=public
CORS_ORIGIN=http://localhost:5173
MOCK_WORKSPACE_ID=11111111-1111-1111-1111-111111111111
MOCK_ADMIN_USER_ID=22222222-2222-2222-2222-222222222222
MOCK_CLIENT_USER_ID=33333333-3333-3333-3333-333333333333
```

If you prefer a different frontend variable name, the app also accepts `VITE_API_BASE_URL`.

## Local Setup & Installation

1. Install frontend dependencies from the repository root:

	```powershell
	npm install
	```

2. Install backend dependencies:

	```powershell
	cd backend
	npm install
	```

3. Start PostgreSQL with Docker:

	```powershell
	docker run --name orbit-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=orbit -p 5432:5432 -d postgres
	```

4. Copy the environment templates and confirm the database URL matches your local password:

	- Frontend: set `VITE_API_URL=http://localhost:3001/api`
	- Backend: set `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/orbit?schema=public`

5. Apply the Prisma schema to the database and generate the client:

	```powershell
	cd backend
	npx prisma migrate dev --name init
	```

6. Seed the demo workspace and sample orders:

	```powershell
	node prisma/seed.js
	```

7. Start the backend:

	```powershell
	npm run dev
	```

8. Start the frontend in a second terminal from the repository root:

	```powershell
	npm run dev
	```

This repository does not currently use a root-level `concurrently` script, so the frontend and backend are started in separate terminals.

If `npx prisma generate` fails on Windows with an EPERM rename error, stop any running Node processes that might be holding Prisma files open, then rerun the command. Antivirus software and file-indexing tools can also cause the lock.

## Folder Structure

The current workspace keeps the React app at the repository root. The tree below labels that area as `frontend` for clarity.

```text
orbit/
├─ frontend/                         # Vite + React app (repo root)
│  ├─ App.jsx
│  ├─ AdminDashboard.jsx
│  ├─ ClientDashboard.jsx
│  ├─ Layout.jsx
│  ├─ NewOrder.jsx
│  ├─ OrderDetails.jsx
│  ├─ main.jsx
│  ├─ orbitApi.jsx
│  ├─ orderConstants.jsx
│  ├─ roleContext.jsx
│  └─ ui.jsx
├─ backend/
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ seed.js
│  ├─ src/
│  │  ├─ app.js
│  │  ├─ server.js
│  │  ├─ lib/
│  │  │  ├─ prisma.js
│  │  │  └─ storage.js
│  │  ├─ middleware/
│  │  │  ├─ errorHandler.js
│  │  │  └─ mockAuth.js
│  │  └─ routes/
│  │     ├─ orders.js
│  │     └─ upload.js
│  ├─ uploads/
│  └─ package.json
├─ index.html
├─ package.json
├─ postcss.config.js
└─ tailwind.config.js
```

## API Endpoints Overview

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/orders` | List orders. Admins see all orders; clients are filtered to their workspace. |
| `GET` | `/api/orders/:id` | Fetch a single order with attachments. |
| `POST` | `/api/orders` | Create a new order from the multi-step wizard payload. |
| `PATCH` | `/api/orders/:id/status` | Update the order status from the admin Kanban/table. |
| `POST` | `/api/upload` | Upload a file locally to `backend/uploads/` and return its URL. |

The backend also exposes `GET /health` for a basic liveness check.

## How Orbit Works

### Client flow

The client dashboard reads orders from the API and renders summary cards for active, pending, and completed work. The New Order wizard validates project details, budget, and deadline before sending the payload to `POST /api/orders`. Uploaded attachments are normalized and stored as file metadata linked to the order.

### Admin flow

The admin dashboard fetches the same underlying order dataset and can render it as either a table or Kanban board. The status select in the detail drawer issues a `PATCH /api/orders/:id/status` mutation, and React Query invalidates the cached list so the UI updates immediately.

### Data model

Prisma models the core domain as:

- `Workspace` for tenant-level grouping
- `User` for role-scoped access
- `Order` for project requests and status tracking
- `Attachment` for uploaded files tied to orders

## Development Notes

- The backend currently uses a mock role header to simulate Admin versus Client responses during development.
- The upload endpoint stores files locally under [`backend/uploads/`](backend/uploads).
- The frontend uses shadcn/ui-style primitives in [`ui.jsx`](ui.jsx) so the visual language stays stable even if those components are later replaced.
- If you add real authentication later, the mock role middleware can be removed and replaced with JWT/session middleware without changing the frontend view structure.
