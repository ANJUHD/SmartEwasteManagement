Smart E-Waste Collection Management System - Minimal Fullstack Starter

Folders:
- backend : Node.js + Express + Mongoose API
- admin-dashboard-web : React admin UI (minimal)
- mobile-app : Flutter mobile app (minimal)

### Quick start (backend)
1. Install Node.js and MongoDB.
2. Copy backend/.env.example -> backend/.env and set MONGO_URI.
3. Run:
   ```
   cd backend
   npm install
   npm run dev
   ```
4. Seed admin/user using the snippet in database/schema.sql (or register via /api/auth/register).

### Admin UI
```
cd admin-dashboard-web
npm install
npm start
```
Open http://localhost:3000

### Flutter App
Open mobile-app in your Flutter environment/emulator. Note: API URL for Android emulator is set to http://10.0.2.2:4000

