# Creova

Creova is a creator and brand collaboration marketplace. Creators can build public profiles, upload profile photos, discover campaigns, apply for opportunities, message brands, receive notifications, and track profile views, applications, messages, and collaborations. Brands can manage their company profile, publish campaigns, discover creators, review applications, communicate directly, and manage active collaborations.

The application combines a React and Vite frontend with an Express and Node.js API backed by MySQL. The interface uses a responsive black, white, and graphite visual system with a video hero, mobile navigation, profile management workspaces, activity views, and role-aware marketplace workflows.

## Features

- Creator and brand registration and login with JWT authentication
- Creator profiles with display name, bio, niche, social handles, and profile photo upload
- Brand profiles with display name, company details, website, and logo upload
- Profile readiness tracking and account activity metrics
- Brand profile-view tracking for creators
- Campaign discovery and campaign creation for brands
- Creator applications and application status management
- Collaboration tracking for creators and brands
- Direct messaging and notification activity views
- Responsive desktop and mobile navigation
- MySQL-backed marketplace data and protected API routes

## Technology

### Frontend

- React 19
- Vite
- JavaScript and JSX
- Lucide React icons
- Plus Jakarta Sans typography

### Backend

- Node.js and Express
- MySQL with `mysql2`
- JWT authentication
- `bcryptjs` password hashing
- CORS and dotenv configuration

## Project Structure

```text
creova/
├── client/                 React and Vite frontend
│   ├── src/
│   │   ├── components/     UI components and profile workspaces
│   │   └── services/       Frontend API client
│   └── index.html
├── server/                 Express backend
│   └── src/
│       ├── controllers/    API request handlers
│       ├── middleware/     Authentication middleware
│       ├── routes/         API route definitions
│       └── db.js           MySQL connection pool
├── .env.example            Environment variable template
└── package.json            Root development scripts
```

## Requirements

- Node.js 18 or newer
- npm
- MySQL 8 or compatible MySQL server
- A MySQL database named `creator_platform`

## Installation

```bash
git clone https://github.com/maleehaaiman/creaova.git
cd creaova
npm run install:all
```

Create `server/.env` using `.env.example`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=creator_app
DB_PASSWORD=your_mysql_password
DB_NAME=creator_platform
JWT_SECRET=replace_with_a_long_random_secret
```

The database should include users, creator profiles, brand profiles, campaigns, applications, collaborations, messages, notifications, payments, and social accounts. The API creates the creator profile-view tracking table when needed.

## Running Locally

Start the backend in one terminal:

```bash
npm run server
```

Start the frontend in another terminal:

```bash
npm run client
```

Default URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend health check: `http://127.0.0.1:5000/api/health`

For a production-style backend start:

```bash
npm start
```

## Client Commands

Run from the `client` directory:

```bash
npm run dev       # Start Vite development server
npm run build     # Create a production build
npm run lint      # Run Oxlint
npm run preview   # Preview the production build
```

## API Areas

The backend exposes these route groups under `/api`:

- `/auth` - registration, login, current account, and display-name updates
- `/creators` - creator discovery, profile reads, profile updates, and view tracking
- `/brands` - brand discovery and profile updates
- `/campaigns` - campaign creation and discovery
- `/applications` - applications and application status updates
- `/collaborations` - active collaboration records
- `/messages` - conversations, chat history, and direct messages
- `/notifications` - notifications and read status
- `/meta` - database table and schema inspection endpoints
- `/health` - backend availability check

Protected routes require a JWT bearer token:

```http
Authorization: Bearer <token>
```

## Validation

```bash
cd client
npm run lint
npm run build
```

Database connectivity can be checked with:

```bash
node server/src/test-db.js
```

## Security Notes

- Do not commit `.env` files or real credentials.
- Use a long, unique `JWT_SECRET` outside local development.
- Passwords are hashed with `bcryptjs` before storage.
- Profile updates and activity data are scoped to authenticated users.
- Creator profile views are restricted to authenticated brand users.

## Current Status

Creova is an active development project. Authentication, profile management, creator discovery, campaigns, messaging, notifications, and collaboration flows are implemented. Some non-blocking Oxlint warnings remain in existing components.
