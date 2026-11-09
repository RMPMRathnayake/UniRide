<p align="center">
  <img src="frontend/public/logo-1.PNG" alt="UniRide logo" width="440" />
</p>

<h1 align="center">UniRide</h1>

<p align="center">
  <strong>University Mobility & Delivery Platform</strong><br />
  One platform connecting students, drivers, and campus administrators.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232A" alt="React 19" />
  <img src="https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 20 or newer" />
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" alt="Express 4" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white" alt="MongoDB and Mongoose" />
  <img src="https://img.shields.io/badge/Maps-OpenStreetMap-7EBC6F?logo=openstreetmap&logoColor=white" alt="OpenStreetMap" />
</p>

---

## About the project

UniRide is a university-focused mobility and delivery web application. It brings student ride bookings, food and product orders, driver job management, and platform administration together in one place.

The project uses a single React frontend and a shared Node.js/Express API connected to MongoDB. Students and drivers work through their own dashboards, while administrators manage activity across the platform.

## A look at UniRide

<h3 align="center">Welcome / role selection page</h3>
<p align="center">
  <img src="screenshots/01-homepage.png" alt="UniRide welcome page" width="80%" />
</p>

<h3 align="center">Student dashboard</h3>
<p align="center">
  <img src="screenshots/02-student-dashboard.png" alt="Student dashboard" width="80%" />
</p>

<h3 align="center">Book a ride and route map</h3>
<p align="center">
  <img src="screenshots/03-book-a-ride.png" alt="Book a ride page with route map" width="80%" />
</p>

<h3 align="center">Food and product catalogue</h3>
<p align="center">
  <img src="screenshots/04-ordering-catalogue.png" alt="Food and product catalogue" width="80%" />
</p>

<h3 align="center">Driver dashboard and available jobs</h3>
<p align="center">
  <img src="screenshots/05-driver-dashboard.png" alt="Driver dashboard" width="80%" />
</p>

<h3 align="center">Administrator dashboard</h3>
<p align="center">
  <img src="screenshots/06-admin-dashboard.png" alt="Administrator dashboard" width="80%" />
</p>

## What you can do with UniRide

### Student portal

- Create an account and manage a student profile.
- Book a ride by selecting pickup and destination locations on the map.
- View route information for a ride before booking.
- Browse food and product catalogues and place delivery orders.
- Follow active bookings and review completed rides or deliveries.
- View booking history, spending information, and receipts.
- Manage account details and settings.

### Driver portal

- Register and submit details for administrator review.
- View available ride and delivery jobs after approval.
- Accept jobs and manage active and completed work.
- View pickup and drop-off routes on the map.
- Review earnings, customer feedback, profile details, and settings.

### Administrator portal

- View platform activity from a central dashboard.
- Manage students, drivers, vehicles, rides, and deliveries.
- Review driver verification and account status.
- Manage pricing settings and review customer feedback.
- Access reports, notifications, role management, and audit logs.

## Technology

| Area | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Authentication | JSON Web Tokens and bcryptjs |
| Maps | Leaflet, React Leaflet, OpenStreetMap |
| Geocoding | Public Nominatim service |
| Route calculation | OSRM routing service |
| API protection | Helmet, CORS, and express-rate-limit |

## Project structure

```text
UniRide/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection
│   │   ├── controllers/     # API request handlers
│   │   ├── data/            # Catalogue data
│   │   ├── middleware/      # Authentication and authorization
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── scripts/         # Demo data and admin setup
│   │   └── server.js        # Express application entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/              # Static assets and UniRide logo
│   ├── src/
│   │   ├── admin/           # Administrator portal
│   │   ├── auth/            # Registration and password recovery
│   │   ├── components/      # Shared student UI components
│   │   ├── context/         # Student authentication state
│   │   ├── driver/          # Driver portal
│   │   ├── pages/           # Student portal pages
│   │   └── services/        # API client
│   ├── .env.example
│   └── package.json
├── docs/
│   └── screenshots/        # Add your project screenshots here
├── .gitignore
└── README.md
```

## Getting started

Follow these steps to run UniRide on your computer. You will need **Node.js 20 or newer**, **npm**, and access to a MongoDB database (MongoDB Atlas or a local MongoDB server).

### 1. Get the project

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd UniRide
```

Or download the repository as a ZIP and extract it.

### 2. Configure the backend

Open a terminal in the project folder and run:

```bash
cd backend
npm install
```

Create your local environment file from the example:

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

Open `backend/.env` and set at least your MongoDB connection string, a strong JWT secret, and the administrator credentials. Use your existing MongoDB connection string if you already have a UniRide database.

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/uniride
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
NOMINATIM_USER_AGENT=UniRide/1.0 (campus project)
OSRM_BASE_URL=https://router.project-osrm.org
DEMO_MODE=false
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-unique-password-at-least-12-characters
ADMIN_NAME=UniRide Administrator
```

The backend requires `MONGODB_URI` and `JWT_SECRET`. The administrator setup script also requires a valid `ADMIN_EMAIL` and an `ADMIN_PASSWORD` of at least 12 characters.

### 3. Create the administrator account

Keep the backend terminal open in the `backend` directory and run:

```bash
npm run seed:admin
```

This creates or updates the administrator account using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `backend/.env`. It will not convert an existing student or driver account into an administrator. Use a separate email address for the administrator account.

### 4. Configure the frontend

Open a second terminal in the project root:

```bash
cd frontend
npm install
```

Create the frontend environment file:

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

The local frontend configuration should look like this:

```env
VITE_API_URL=http://localhost:5000/api
VITE_OSM_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_OSRM_BASE_URL=https://router.project-osrm.org
```

### 5. Start the application

Start the backend from the `backend` folder:

```bash
npm run dev
```

Start the frontend from the `frontend` folder in a second terminal:

```bash
npm run dev
```

Then open **http://localhost:5173** in your browser. The backend API runs at **http://localhost:5000**.

You can check the API health endpoint at:

```text
http://localhost:5000/api/health
```

## Demo data for local testing

To create sample student, driver, ride, delivery, and review records, run this from the `backend` folder:

```bash
npm run seed
```

The seed script provides these demo accounts:

| Role | Email | Password |
|---|---|---|
| Student | `net@uni.com` | `net@192` |
| Driver | `kavi@uni.com` | `kavi@192` |

These credentials are for local demonstration only. Do not use them on a public or production deployment. Do not run the demo seed script against a live database unless you intend to add its sample records.

## Main pages

| Portal | Page | URL |
|---|---|---|
| Public | Welcome / role selection | `/` |
| Student | Sign in | `/rider/login` |
| Student | Registration | `/register/student` |
| Student | Dashboard | `/rider` |
| Student | Book a ride | `/rider/book-ride` |
| Student | Food catalogue | `/rider/food` |
| Student | Product catalogue | `/rider/products` |
| Driver | Sign in | `/driver/login` |
| Driver | Registration | `/register/driver` |
| Driver | Dashboard | `/driver` |
| Administrator | Sign in | `/admin/login` |
| Administrator | Dashboard | `/admin` |

## API overview

All API routes are mounted under `/api`.

| Area | Base endpoint |
|---|---|
| Authentication | `/api/auth` |
| Administrator authentication | `/api/auth/admin` |
| Administrator operations | `/api/admin` |
| Student profile | `/api/rider` |
| Driver profile and jobs | `/api/driver` |
| Ride bookings | `/api/rides` |
| Student food and product orders | `/api/orders` |
| Driver delivery jobs | `/api/deliveries` |
| Catalogue | `/api/catalog` |
| Reviews | `/api/reviews` |
| Geocoding | `/api/geocoding` |
| Pricing | `/api/pricing` |
| Health check | `/api/health` |

## A few things worth knowing

- **One shared database:** the student, driver, and administrator portals use the same backend and MongoDB database. A ride or delivery created by a student can therefore appear in the relevant driver and administrator views.
- **Driver approval:** newly registered drivers need administrator approval before they can accept jobs.
- **Pricing:** administrators can manage the ride base fare, per-kilometre rate, and delivery surcharge. The backend calculates booking charges using the saved pricing settings.
- **Maps:** the app uses OpenStreetMap tiles with public geocoding and routing services. Public services have fair-use limits and are not a guaranteed production service; check their usage policies before a large or commercial deployment.
- **Payments:** the payment area is currently for displaying booking-linked payment information. The project does not integrate a payment gateway or provide authoritative payment settlement records.
- **Password recovery:** recovery is demo-oriented. When `DEMO_MODE=true`, the verification code is fixed to `123456`; no email is sent. Connect a real email and one-time-password provider before using this flow in production.

## Before deploying

1. Use a production MongoDB database and restrict its network access.
2. Set a strong, unique `JWT_SECRET` and secure administrator credentials.
3. Set `NODE_ENV=production`, `CLIENT_ORIGIN` to your deployed frontend origin, and `VITE_API_URL` to your deployed API URL.
4. Keep `.env` files and real credentials out of GitHub. The repository `.gitignore` is configured to ignore them.
5. Replace demo authentication/recovery behaviour and add a payment provider if live payments are required.
6. Review the usage policies and capacity limits of the public map, geocoding, and routing services.

## Push this project to GitHub

Create an empty repository on GitHub, then run these commands from the UniRide project root:

```bash
git init
git add .
git status
git commit -m "Initial commit: UniRide platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Before committing, confirm that your local environment files are ignored:

```bash
git check-ignore backend/.env frontend/.env
```

If either `.env` file was already added to Git's index, remove it from tracking before you push:

```bash
git rm --cached backend/.env frontend/.env
git add .gitignore
```

If a real password, token, or database URI has already been pushed to a public repository, changing `.gitignore` is not enough: rotate the exposed credentials and remove the secret from the repository history.

---

<p align="center">
  Built with ❤️ as a university project to make campus mobility and everyday deliveries easier.
</p>
