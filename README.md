# UniRide & UniEats

React and Vite frontend with an Express and MongoDB backend.

## Project layout

```text
unieats-app/
├── uniride-backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── storage/receipts/
│   ├── tests/
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   ├── seedData.js
│   └── .env.example
├── uniride-frontend/
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── .env.example
├── .gitignore
└── README.md
```

## Requirements

Use Node.js 24 LTS and npm. MongoDB must be running before starting the backend.
The local database defaults to `mongodb://127.0.0.1:27017/uniEatsDB`.
On Windows, an administrator can start an installed MongoDB service with `Start-Service MongoDB`.

## Backend

Run in a terminal from the repository root.

```powershell
cd uniride-backend
npm ci
Copy-Item .env.example .env
npm run dev
```

Copy the example during first-time setup. For an existing checkout, keep your configured `.env`.
Set `MONGO_URI` and `PORT` in `uniride-backend/.env` as needed.
The backend loads this file relative to `server.js` regardless of the terminal directory.
Existing process environment variables take precedence.

`npm run dev` enables Node's file watcher. `npm start` and `node server.js` start the server directly.
The default address is <http://localhost:5000>. Check MongoDB connectivity at <http://localhost:5000/api/health>.
Startup seeds missing sample records. `npm run seed` also runs the seed script.
Receipt files are stored in `uniride-backend/storage/receipts/` and excluded from Git.

## Frontend

Open a second terminal at the repository root.

```powershell
cd uniride-frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` requests to `http://127.0.0.1:5000`.
Set `VITE_API_PROXY_TARGET` in the frontend `.env` if the backend address changes, then restart Vite.
Frontend environment values prefixed with `VITE_` are public configuration.

```powershell
npm run build
npm run preview
```

The build is written to `uniride-frontend/dist`. Preview serves the compiled UI.
Deploy it with `/api` routed to Express when testing API-backed features in production or preview.

Commit both package lockfiles and the `.env.example` files. Local `.env` files, dependencies,
build outputs, and generated receipts are excluded by the root `.gitignore`.
