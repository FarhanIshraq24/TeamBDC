# TeamBDC — Full MERN Stack Website

TeamBDC (Team Bangladesh Cyclist) is an amateur competitive cycling team. This plan covers building a full-featured MERN stack website with public pages, multi-role dashboards, Strava integration, an OCR-powered leaderboard screenshot parser, a rigorous points engine, and monthly performance tracking.

---

## User Review Required

> [!IMPORTANT]
> **Strava API Access**: To integrate live Strava data, a Strava API app must be registered at https://www.strava.com/settings/api. You'll receive a `Client ID` and `Client Secret`. These go in a `.env` file. For now, I'll build the full OAuth flow and API integration — you just need to provide the keys.

> [!IMPORTANT]
> **Screenshot OCR for Leaderboard**: When admins upload a Strava leaderboard screenshot, the system will use `Tesseract.js` (in-browser OCR) to parse rider names and distances, then auto-update their profiles. OCR accuracy depends on screenshot quality. I'll also build a manual correction UI for admins.

> [!WARNING]
> **MongoDB**: You need MongoDB installed and running locally (`mongod`) or a MongoDB Atlas connection string. I'll use `mongodb://localhost:27017/teambdc` by default with a `.env` override.

> [!NOTE]
> **Organizational Roles**: The system supports 4 role tiers:
> - `superadmin` — full control, approves admins
> - `admin` — approves riders, uploads screenshots, manages content
> - `rider` — regular team member with personal dashboard
> - `org_member` — advisors/leader shown on the public org page (not login users)

---

## Proposed Changes

### Project Structure

```
H:\TeamBDC website\
├── client/          ← React (Vite) frontend
├── server/          ← Express + MongoDB backend
├── .env             ← Shared env vars
└── package.json     ← Root workspace scripts
```

---

### Backend — `server/`

#### [NEW] `server/index.js`
Entry point. Connects MongoDB, sets up Express with CORS, helmet, body-parser, routes.

#### [NEW] `server/config/db.js`
Mongoose connection helper.

#### [NEW] `server/models/User.js`
Schema: `name, email, password (hashed), role (rider|admin|superadmin), stravaId, stravaToken, refreshToken, isApproved, profilePhoto, bio, joinDate, stravaAthleteData`.

#### [NEW] `server/models/Ride.js`
Schema: `userId, stravaActivityId, distance, movingTime, elevationGain, avgSpeed, maxSpeed, avgHeartRate, avgWatts, tss, intensityFactor, date, type`.

#### [NEW] `server/models/Points.js`
Schema: `userId, month, year, distancePoints, elevationPoints, speedPoints, tssPoints, raceBonus, consistencyBonus, totalPoints`.

#### [NEW] `server/models/OrgMember.js`
Schema: `name, role (advisor|leader|admin), bio, photo, order`.

#### [NEW] `server/models/Announcement.js`
Schema: `title, content, author, createdAt`.

#### [NEW] `server/models/Achievement.js`
Schema: `title, description, date, riderIds[]`.

#### [NEW] `server/middleware/auth.js`
JWT verification, role-checking middleware (`requireRole`).

#### [NEW] `server/routes/auth.js`
- `POST /api/auth/register` — register rider (pending approval)
- `POST /api/auth/login` — JWT login
- `GET /api/auth/me` — get current user

#### [NEW] `server/routes/users.js`
- `GET /api/users` — list all approved riders (public)
- `GET /api/users/:id` — rider profile
- `PATCH /api/users/:id/approve` — admin approves rider
- `PATCH /api/users/:id/approve-admin` — superadmin approves admin
- `POST /api/users/:id/photo` — upload profile photo

#### [NEW] `server/routes/strava.js`
- `GET /api/strava/auth` — redirect to Strava OAuth
- `GET /api/strava/callback` — handle callback, store tokens
- `POST /api/strava/sync` — fetch latest activities from Strava API
- `POST /api/strava/webhook` — Strava push webhook receiver

#### [NEW] `server/routes/rides.js`
- `GET /api/rides/:userId` — get all rides for user
- `GET /api/rides/:userId/stats` — aggregated stats (weekly/monthly)

#### [NEW] `server/routes/points.js`
- `GET /api/points/leaderboard` — ranked points leaderboard
- `GET /api/points/:userId` — user points history
- `POST /api/points/recalculate` — admin triggers recalculation

#### [NEW] `server/routes/leaderboard.js`
- `POST /api/leaderboard/screenshot` — admin uploads screenshot, OCR parsed server-side with `tesseract.js`
- `GET /api/leaderboard/monthly-top` — top 3 riders this month

#### [NEW] `server/routes/org.js`
- `GET /api/org` — list org members (advisors/leader/admins)
- `POST /api/org` — superadmin adds org member
- `PUT /api/org/:id` — update org member
- `DELETE /api/org/:id` — delete org member

#### [NEW] `server/routes/announcements.js`
CRUD for announcements (admin-only write, public read).

#### [NEW] `server/services/pointsEngine.js`
Points formula:
```
distancePoints = distance_km * 2
elevationPoints = elevation_m * 0.5
speedPoints = (avgSpeed_kmh - 20) * 3  (only if > 20)
tssPoints = TSS * 0.8
raceBonus = +50 per race participation
consistencyBonus = rides_per_week >= 4 ? +20 : 0

TSS = (duration_sec * NP * IF) / (FTP * 3600) * 100
IF = NP / FTP
```
Monthly aggregation runs via cron (node-cron) at month end.

#### [NEW] `server/services/stravaService.js`
Axios-based Strava API wrapper: token refresh, activity fetch, athlete data.

---

### Frontend — `client/`

Built with **Vite + React**, **React Router v6**, **Chart.js** for graphs, **Axios** for API calls.

**Color theme**: Dark mode with cycling-green (`#00e676`) accent, red/green Bangladesh flag nods.

#### [NEW] `client/src/main.jsx` + `client/src/App.jsx`
Router setup with protected routes per role.

#### [NEW] `client/src/index.css`
Full design system: CSS variables, typography (Google Fonts: Barlow Condensed + Inter), animations.

#### [NEW] Pages:
| Page | Route | Access |
|------|--------|--------|
| Landing | `/` | Public |
| About / Org | `/team` | Public |
| Leaderboard | `/leaderboard` | Public |
| Gallery | `/gallery` | Public |
| Login | `/login` | Public |
| Register | `/register` | Public |
| Rider Dashboard | `/dashboard` | Rider |
| Admin Dashboard | `/admin` | Admin |
| Super Admin | `/superadmin` | Superadmin |

#### Landing Page sections:
- Hero with animated cycling background, logo, tagline "Shut Up Legs"
- About TeamBDC
- Monthly Top 3 Riders (dynamic, from API)
- Achievements ticker
- Team gallery (the 4 provided photos)
- Call-to-action: Join the Team

#### Rider Dashboard sections:
- Profile card (photo, bio, Strava stats)
- Performance graphs: Distance over time, TSS, ATL/CTL/TSB (fitness/fatigue/form)
- Training load calendar heatmap
- Points breakdown
- Personal best records
- Strava Connect button

#### Admin Dashboard sections:
- Pending rider approvals (approve/reject)
- Upload Strava screenshot → OCR parse → confirm/edit parsed data → save
- Announcements management
- Org member management

#### Super Admin Dashboard sections:
- Pending admin approvals
- All users management
- Points system config
- Full leaderboard override

---

## Verification Plan

### Automated
- Backend: Run `node server/index.js` → verify server starts on port 5000
- `GET /api/org` → returns empty array (seeded later)
- `POST /api/auth/register` + `POST /api/auth/login` → returns JWT

### Browser Testing (via browser subagent)
1. Navigate to `http://localhost:5173` → landing page renders with logo
2. Register a new rider → see "pending approval" message
3. Login as admin → see approval queue
4. Approve rider → rider can now login and see dashboard
5. Rider connects Strava → profile populates with stats
6. Admin uploads screenshot → OCR parses distances → leaderboard updates
7. Leaderboard page → shows ranked riders

### Manual Testing (user performs)
- Verify Strava OAuth flow with real Strava credentials
- Upload a real Strava leaderboard screenshot and confirm OCR accuracy
