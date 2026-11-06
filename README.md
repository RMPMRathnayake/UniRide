# UniRide Admin Panel — Frontend + Backend

A starter full-stack UniRide administration system with separate React and Express applications.

## Requirements
- Node.js 20+ recommended
- npm
- MongoDB Community Server or MongoDB Atlas
- Git optional

## Project structure
- `uniride-frontend/` — React + Vite UI
- `uniride-backend/` — Express REST API + Mongoose models

## 1. Configure MongoDB and backend
1. Install/start MongoDB locally, or create a MongoDB Atlas cluster.
2. Open a terminal in `uniride-backend`.
3. Copy `.env.example` to `.env`.
4. Set `MONGODB_URI`, `JWT_SECRET`, and `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
5. Install packages and start the API:

```bash
npm install
npm run seed:admin
npm run dev
```

The API runs at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

`seed:admin` creates the initial administrator account from the `.env` values if it does not already exist. Change the starter password before using this outside local development.

## 2. Start the frontend
Open another terminal:

```bash
cd uniride-frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

Create `uniride-frontend/.env` if needed:
`VITE_API_URL=http://localhost:5000/api`

Put your team's original logo at `uniride-frontend/public/logo.PNG`. The UI uses `/logo.PNG`; if the file is absent, it shows a simple text fallback.

## 3. Login
Use the email and password configured in the backend `.env`. The frontend calls the backend login endpoint and uses a bearer token for API requests.

## Included starter functionality
- Admin login
- Dashboard summary
- Users list and user account status update
- Driver verification queue and approve/reject workflow
- Vehicle list
- Ride and delivery lists
- Payment list
- Pricing configuration
- Feedback list
- Reports summary
- Notifications
- Audit logs
- Basic administrator profile and role listing
- Responsive sidebar and official UniRide navy/orange styling

Some advanced features (document uploads, downloadable reports, multi-admin permission editing, email/SMS delivery, live ride GPS tracking and payment gateway integration) are not included in this starter. They need agreed business rules and integration with the rest of the group project.

## API overview
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/status`
- `GET /api/admin/drivers`
- `PATCH /api/admin/drivers/:id/verification`
- `GET /api/admin/vehicles`
- `GET /api/admin/rides`
- `GET /api/admin/deliveries`
- `GET /api/admin/payments`
- `GET /api/admin/pricing`
- `PATCH /api/admin/pricing`
- `GET /api/admin/feedback`
- `GET /api/admin/reports`
- `GET /api/admin/notifications`
- `PATCH /api/admin/notifications/:id/read`
- `GET /api/admin/audit-logs`
- `GET /api/admin/roles`

All `/api/admin/*` endpoints require an authenticated admin token.

## Integration notes
The schemas are starter schemas. Coordinate field names and status values with teammates before merging. Never trust client-side role checks alone; the backend middleware enforces the admin role. Passwords are hashed with bcrypt. Keep `.env` private and do not commit it.
