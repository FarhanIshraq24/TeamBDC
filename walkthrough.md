# TeamBDC Website Walkthrough

We have successfully built and verified the full-stack MERN application for **TeamBDC (Team Bangladesh Cyclist)**. The platform is ready for deployment with a premium dark-themed UI, role-based dashboards, and a robust performance tracking system.

## 🚀 Core Accomplishments

- **Premium UI/UX**: A high-performance, dark-themed design using Barlow Condensed and Inter typography, optimized for the cycling aesthetic.
- **Role-Based Access**: Specialized dashboards for **Riders**, **Admins**, and **SuperAdmins** with a secure approval workflow.
- **Points Engine**: A complex backend service that calculates monthly points based on distance, elevation, average speed, and **Training Stress Score (TSS)**.
- **Strava Integration**: Full OAuth2 synchronization, real-time activity fetching, and fitness metric tracking (ATL/CTL/TSB).
- **OCR Leaderboard Parser**: Automated leaderboard updates from Strava screenshots using `Tesseract.js` on the server.

---

## 📸 Visual Showcase

````carousel
![Landing Page](file:///C:/Users/farha/.gemini/antigravity/brain/a864e304-860b-4f1b-b406-f85b017c25bc/landing_page_1774401949708.png)
<!-- slide -->
![Leaderboard & Points](file:///C:/Users/farha/.gemini/antigravity/brain/a864e304-860b-4f1b-b406-f85b017c25bc/leaderboard_page_1774401967447.png)
<!-- slide -->
![Team Structure](file:///C:/Users/farha/.gemini/antigravity/brain/a864e304-860b-4f1b-b406-f85b017c25bc/team_page_1774401973681.png)
<!-- slide -->
![Admin Dashboard](file:///C:/Users/farha/.gemini/antigravity/brain/a864e304-860b-4f1b-b406-f85b017c25bc/admin_dashboard_1774402014396.png)
````

---

## 🛠️ Verification Results

### 1. Registration & Approval Workflow
- **Test**: Registered a new rider "John Doe" and attempted login.
- **Result**: Successfully caught in the "Pending Approval" state. After Admin approval, the full dashboard became accessible.

### 2. Points Engine & Leaderboard
- **Test**: Injected mock ride data for John Doe (120.5km, 1200m elevation).
- **Result**: Points correctly calculated (~1143 pts) and John Doe automatically moved to **Rank #1** on the monthly leaderboard.

### 3. OCR Parser (Backend)
- **Test**: Uploaded a generated Strava leaderboard screenshot.
- **Result**: Server successfully parsed names and distances, allowing the Admin to match them to existing riders with one click.

### 4. Fitness Metrics
- **Test**: Verified calculation of **CTL (Fitness)**, **ATL (Fatigue)**, and **TSB (Form)** based on ride TSS.
- **Result**: Dashboards correctly display trends and color-coded stress balances.

---

## 📝 Implementation Details

- **Backend**: [index.js](file:///H:/TeamBDC%20website/server/index.js), [pointsEngine.js](file:///H:/TeamBDC%20website/server/services/pointsEngine.js)
- **Frontend**: [App.jsx](file:///H:/TeamBDC%20website/client/src/App.jsx), [Landing.jsx](file:///H:/TeamBDC%20website/client/src/pages/Landing.jsx)
- **Models**: [User.js](file:///H:/TeamBDC%20website/server/models/User.js), [Ride.js](file:///H:/TeamBDC%20website/server/models/Ride.js)

> [!TIP]
> **Next Steps**: To go live, simply update the [.env](file:///H:/TeamBDC%20website/.env) file with your production **Strava API** credentials and **MongoDB Atlas** URI.

---

### 🎥 Development Recording
![Verification Flow](file:///C:/Users/farha/.gemini/antigravity/brain/a864e304-860b-4f1b-b406-f85b017c25bc/final_ui_showcase_gallery_1774401929275.webp)
