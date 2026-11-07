<div align="center">
  <img src="frontend/public/logo.png" alt="UniRide logo" width="440" />
  <h1>UniRide — Driver Dashboard</h1>
  <p>A driver portal for managing ride requests, delivery jobs and earnings in one place.</p>
  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 20 or later" />
    <img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" alt="Express 4" />
    <img src="https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white" alt="MongoDB 7" />
    <img src="https://img.shields.io/badge/Maps-OpenStreetMap-7EBC6F?logo=openstreetmap&logoColor=white" alt="OpenStreetMap" />
  </p>
</div>

---

## About the project

UniRide is the driver-side application for a ride-booking and delivery platform. It gives drivers a single dashboard to review incoming work, manage accepted jobs, keep track of completed trips and check their earnings.

This repository contains the **driver portal and its API**. It does not include the passenger booking interface or an admin/dispatcher dashboard.

## What you can do

- **Check the dashboard** — see a quick summary of earnings, jobs and driver activity.
- **Manage ride requests** — view available rides, accept requests and update a ride as it progresses.
- **Handle deliveries** — accept delivery orders and update them through pickup and delivery.
- **Review job history** — revisit completed rides and deliveries, including their route details.
- **Track earnings** — view the earnings summary and transaction history, with CSV export.
- **See customer feedback** — check the driver rating and recent reviews.
- **Manage your account** — update profile details, vehicle information and account settings.
- **Control availability** — switch between Available and Not Available from the dashboard.
- **Print delivery receipts** — open a completed delivery receipt and print it from the browser.

## Screenshots

Add screenshots of the running website to a folder named `screenshots` in the project root. Use the filenames shown below and the images will appear here automatically. Capture the pages at a readable desktop size; you can add mobile screenshots as well.

<table>
  <tr>
    <td width="50%">
      <strong>Driver login</strong><br />
      <img src="screenshots/login.png" alt="UniRide driver login page" width="100%" />
    </td>
    <td width="50%">
      <strong>Dashboard overview</strong><br />
      <img src="screenshots/overview.png" alt="UniRide dashboard overview" width="100%" />
    </td>
  </tr>
  <tr>
    <td>
      <strong>Available rides and deliveries</strong><br />
      <img src="screenshots/available-jobs.png" alt="Available jobs page" width="100%" />
    </td>
    <td>
      <strong>Active jobs</strong><br />
      <img src="screenshots/active-jobs.png" alt="Active jobs page" width="100%" />
    </td>
  </tr>
  <tr>
    <td>
      <strong>Completed jobs</strong><br />
      <img src="screenshots/completed-jobs.png" alt="Completed jobs page" width="100%" />
    </td>
    <td>
      <strong>Earnings</strong><br />
      <img src="screenshots/earnings.png" alt="Earnings page" width="100%" />
    </td>
  </tr>
  <tr>
    <td>
      <strong>Reviews</strong><br />
      <img src="screenshots/reviews.png" alt="Customer reviews page" width="100%" />
    </td>
    <td>
      <strong>Profile</strong><br />
      <img src="screenshots/profile.png" alt="Driver profile page" width="100%" />
    </td>
  </tr>
  <tr>
    <td>
      <strong>Settings</strong><br />
      <img src="screenshots/settings.png" alt="Account settings page" width="100%" />
    </td>
    <td>
      <!-- Optional: add another screenshot here, such as a delivery receipt or mobile layout. -->
    </td>
  </tr>
</table>

## Built with

| Part | Technologies |
|---|---|
| Frontend | React 19, Vite, React Router, Axios |
| Backend | Node.js, Express 4 |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Maps | Leaflet, React Leaflet, OpenStreetMap tiles |
| Route geometry | OSRM Route API |

## Project structure

```text
uniride-driver/
├── frontend/
│   ├── public/                 # Public assets and UniRide logo
│   ├── src/
│   │   ├── components/         # Layout, UI components, maps and receipts
│   │   ├── context/            # Authentication context
│   │   ├── pages/              # Login, overview, jobs, earnings, reviews, profile, settings
│   │   ├── services/           # API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── config/             # MongoDB connection
│   │   ├── controllers/        # API request handlers
│   │   ├── middleware/         # Authentication middleware
│   │   ├── models/              # Driver, ride, delivery and review models
│   │   ├── routes/              # API routes
│   │   ├── scripts/             # Demo data seed script
│   │   └── server.js
│   └── package.json
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Run it locally

### Requirements

- [Node.js](https://nodejs.org/) 20 or later, with npm
- [MongoDB](https://www.mongodb.com/) 7 or a MongoDB Atlas connection string
- Docker Desktop (optional, if you want to run MongoDB with Docker)

### 1. Get the project

```bash
git clone <your-repository-url>
cd uniride-driver
```

Replace `<your-repository-url>` with the URL of your GitHub repository.

### 2. Start MongoDB

You can use your own MongoDB installation or an Atlas database. To start a local MongoDB instance with the included Docker Compose file, run this from the project root:

```bash
docker compose up -d mongodb
```

### 3. Configure and start the backend

Create a file named `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/uniride
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

Use your own MongoDB connection string for `MONGODB_URI` if you are not using the local Docker database. Replace the example `JWT_SECRET` with a private random value.

Open a terminal in the project root and run:

```bash
cd backend
npm install
npm run seed
npm run dev
```

The API will start at `http://localhost:5000`. You can check that it is running at `http://localhost:5000/api/health`.

### 4. Configure and start the frontend

Create a file named `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_OSRM_BASE_URL=https://router.project-osrm.org
VITE_OSM_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

Open a second terminal in the project root and run:

```bash
cd frontend
npm install
npm run dev
```

Vite will show the local development URL in the terminal. The default is `http://localhost:5173`.

## Demo driver account

After running the seed command, use this account to sign in:

| Field | Demo value |
|---|---|
| Email | `driver@uniride.com` |
| Password | `dimuthu@192` |

The seed script creates a sample driver, ride requests, delivery orders and customer reviews. The sample locations are around South Eastern University, Oluvil. These credentials are for local demonstration only; change or remove them before any public deployment.

## API overview

All API routes below, except the health check and login, require a valid bearer token in the `Authorization` header.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Check API status |
| `POST` | `/api/auth/login` | Driver login |
| `GET` | `/api/auth/me` | Get the signed-in driver |
| `GET` | `/api/driver/dashboard` | Dashboard summary |
| `GET`, `PATCH` | `/api/driver/profile` | View or update driver profile |
| `PATCH` | `/api/driver/password` | Change password |
| `PATCH` | `/api/driver/availability` | Update driver availability |
| `GET` | `/api/driver/earnings` | Earnings and transactions |
| `GET` | `/api/driver/reviews` | Driver rating and reviews |
| `GET` | `/api/rides?scope=available\|active\|completed` | List rides by status |
| `POST` | `/api/rides/:id/accept` | Accept a ride |
| `PATCH` | `/api/rides/:id/status` | Update ride status |
| `GET` | `/api/deliveries?scope=available\|active\|completed` | List deliveries by status |
| `POST` | `/api/deliveries/:id/accept` | Accept a delivery |
| `PATCH` | `/api/deliveries/:id/status` | Update delivery status |

## Maps and routing

The dashboard uses Leaflet with OpenStreetMap map tiles. Road routes are requested from the OSRM Route API, so a Google Maps API key is not required.

The public OSRM demo endpoint is useful for development and evaluation, but it is not a production routing service and does not guarantee uptime. For a live service, use a routing provider or self-hosted OSRM setup that suits your traffic and terms of use.

The standard OpenStreetMap tile service is community-funded and subject to its [tile usage policy](https://operations.osmfoundation.org/policies/tiles/). Keep map attribution visible, respect caching requirements and use a suitable tile provider for sustained production traffic.

## A few things to know

- This is an MVP of the **driver side** of the platform. Passenger booking, dispatch/admin tools, live GPS tracking, push notifications, payment settlement and automated payouts are outside this repository's current scope.
- Drivers need to be marked as Available to accept new jobs.
- Job acceptance uses conditional database updates to avoid two drivers accepting the same available job.
- The app includes a fallback map preview when a road route cannot be fetched; it is labelled as a fallback rather than a calculated road route.
- Keep `.env` files and production secrets out of Git. Configure environment variables securely on your deployment platform.

## Production build

Build the frontend:

```bash
cd frontend
npm run build
```

Start the backend in production mode:

```bash
cd backend
npm start
```

For deployment, host the frontend build output from `frontend/dist` and run the Express API on a Node.js host. Set the production API URL, map endpoints, database URI, JWT secret and allowed frontend origin in the deployment environment.

---

<div align="center">
  Made for the UniRide driver experience.
</div>
