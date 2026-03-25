# TeamBDC — Competitive Cycling Platform

A full-stack MERN (MongoDB, Express, React, Node.js) platform for the amateur cycling community in Bangladesh.

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ recommended.
- **MongoDB**: You can use a local MongoDB or the provided MongoDB Atlas string in `.env`.

### 2. Initial Setup
Run this command from the root directory to install all dependencies for both frontend and backend:
```bash
npm run install-all
```

### 3. Database Seeding
To populate the database with default roles and sample data (Admin: `admin@teambdc.com`, SuperAdmin: `teambdc.com`):
```bash
npm run seed
```

### 4. Running the Application
To start both the backend and frontend concurrently:
```bash
npm run dev
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## 🛠️ Project Structure
- `client/`: React + Vite frontend.
- `server/`: Express backend API with Mongoose schemas and points engine.
- `.env`: Environment variables.

## 🚴 Key Features
- **Rider Dashboard**: Performance graphs (CTL/ATL/TSB), Strava sync, and monthly points.
- **Admin Dashboard**: Rider approvals, OCR leaderboard screenshot parser, and announcements.
- **Leaderboard**: Real-time ranking based on distance, elevation, and intensity.
- **Announcements**: Flyer-style team updates.

---

## ☁️ Deployment
See the [Deployment Guide](C:/Users/farha/.gemini/antigravity/brain/a864e304-860b-4f1b-b406-f85b017c25bc/deployment_guide.md) for instructions on hosting with Vercel and MongoDB Atlas.
