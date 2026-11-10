# 🚨 ResQ – Emergency Response & Disaster Management Platform

[![Platform](https://img.shields.io/badge/Platform-Web%20SPA-rose)](https://github.com)
[![Framework](https://img.shields.io/badge/Framework-React%2019%20%2B%20TypeScript-blue)](https://react.dev/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38bdf8)](https://tailwindcss.com/)
[![Storage](https://img.shields.io/badge/Storage-IndexedDB%20%2B%20LocalStorage-emerald)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![Code Clash](https://img.shields.io/badge/Hackathon-Code%20Clash%202026%20Round%202-amber)](https://github.com)

**ResQ** is an intelligent emergency coordination and disaster response platform designed for rapid incident intake, one-tap citizen SOS distress beacons, browser-based video evidence capture, algorithmic triage prioritization, proximity-based response fleet dispatch, and automated incident verification.

---

## 🌟 Executive Summary & Highlights

- **⚡ Zero-Delay One-Tap SOS**: Instantly triggers emergency beacons with live browser GPS coordinate fixes and initial status *“Unverified – Awaiting Review”* without forcing citizens through lengthy registration forms.
- **🎥 Browser-Based Emergency Video Capture**: Records up to 30 seconds of live field video evidence via the HTML5 `MediaDevices` and `MediaRecorder` APIs.
- **💾 High-Capacity IndexedDB Storage**: Saves video blobs in client-side IndexedDB (`ResQ_EvidenceDB_v1`) to prevent localStorage quota overflows while surviving page refreshes and browser restarts.
- **🧠 Intelligent Prioritization Engine (Code Clash Round 2)**: Dynamically recalculates a 0–100 priority score based on severity weights, casualty counts, time elapsed, and category multipliers.
- **📍 Haversine Proximity Dispatch Engine**: Calculates exact Euclidean/Haversine distances between available response teams and incident coordinates to recommend nearest suitable units.
- **🛡️ Forensic Duplicate & Suspicious Report Verification**: Flags potential duplicates using spatio-temporal proximity and textual similarity heuristics.
- **🗺️ Tactical Situational Map**: Visualizes live incident pins, radar SOS beacon rings, emergency fleet locations, and vector dispatch lines.

---

## 🚀 Key Modules & Capabilities

### 1. One-Tap SOS Emergency Activation System
- **Hero & Global Navbar Triggers**: Prominent, pulsing crimson **"TAP FOR EMERGENCY HELP"** circular trigger on the dashboard and persistent **"🚨 SOS HELP"** button in navigation.
- **Real-Time GPS Coordinates**: Interrogates the browser Geolocation API (`navigator.geolocation.getCurrentPosition`) for latitude, longitude, and precision radius (e.g., `±12m`).
- **Graceful Fallbacks**: If GPS permissions are declined or unavailable, offers instant manual address entry and quick sector buttons.
- **Quick Emergency Categories**: Large single-tap tiles for:
  - 🩺 *Medical Emergency*
  - 🔥 *Fire Emergency*
  - 🚗 *Road Accident*
  - 🌊 *Flood*
  - 🏢 *Building Collapse*
  - ⚠️ *Other Emergencies*
- **Progressive Enrichment**: Allows optional updates to casualty headcounts, contact phone, and situational notes without delaying initial dispatch.

---

### 2. Emergency Video Capture & Evidence Management
- **MediaDevices & MediaRecorder Integration**: Live camera feed preview with microphone audio detection and automatic fallback to video-only if audio hardware is restricted.
- **30-Second Hard Ceiling**: Visual progress bar, live timer (`REC 00:14 / 00:30`), and automatic recording stop at 30 seconds.
- **Review Studio**: Play, pause, replay, **Retake Video**, and **Delete Video** controls before final attachment.
- **IndexedDB Evidence Database**: 
  - Preserves full binary video blobs and metadata (`durationSeconds`, `mimeType`, `sizeBytes`, `recordedAt`, `fileName`) under database `ResQ_EvidenceDB_v1`.
  - Stored records remain fully playable across reloads via dynamically generated `URL.createObjectURL()`.
- **Admin Evidence Theater (`IncidentDetailModal.tsx`)**:
  - Displays video player with timestamp, incident ID, duration, and encoding info.
  - One-click **Download Full Evidence** button for forensic authorities.
  - Integrated option to record or attach supplemental field footage for incidents reported without video.
- **Zero-Hardware Simulation Stream**: Built-in HTML5 canvas capture generator creating animated tactical HUD test footage for headless or camera-less environments.

---

### 3. Intelligent Incident Prioritization Engine (Code Clash Round 2)
Every incident receives an automated, dynamically updating priority score between 0 and 100 based on an open algorithmic model:

$$\text{Priority Score} = \text{Severity Points} + \text{Casualty Points} + \text{Elapsed Time Points} + \text{Category Weight}$$

| Dimension | Criteria | Points |
| :--- | :--- | :--- |
| **Severity Level** | Critical / High / Medium / Low | 40 / 30 / 20 / 10 pts |
| **People Impacted** | 10+ / 5–9 / 2–4 / 1 person | 25 / 20 / 10 / 5 pts |
| **Time Elapsed** | >60m / 30–60m / 10–29m / <10m | 20 / 15 / 10 / 5 pts |
| **Hazard Weight** | Fire / Collapse / Accident / Flood / Medical | 8 to 15 multiplier pts |

- **30-Second Recalculation Loop**: A background interval updates elapsed time points in real-time, elevating aging unanswered incidents automatically.
- **Dispatcher Override**: Authorized personnel can manually adjust scores with mandatory audit logging and reason capture.

---

### 4. Fleet Management & Haversine Proximity Dispatch
- **Specialized Response Teams**:
  - 🚒 *Fire Response Teams* (Heavy Pumpers, Ladders, Hazmat)
  - 🚑 *Medical Response Teams* (ALS Ambulances, Trauma Units)
  - 🦺 *Rescue Teams* (USAR Extrication, Structural Collapse Squads)
  - 🌊 *Disaster Management Teams* (Flood Evacuation, High-Water Craft)
  - 🚨 *General Emergency Teams* (Traffic Control, Rapid Patrol)
- **Status Lifecycle**: `Available` ➔ `Busy (Assigned)` ➔ `Unavailable`.
- **Haversine Distance Matching**:
  Computes the great-circle distance between team coordinates and incident GPS fixes:
  $$d = 2r \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$
- **Conflict Prevention**: Prevents double-booking by locking assigned units to active incidents until released upon resolution.

---

### 5. Intelligent Verification & Duplicate Detection
- **4-Stage Verification Lifecycle**:
  - `Unverified` (Neutral slate grey)
  - `Under Review` (Operational amber)
  - `Verified` (Tactical emerald green)
  - `Unable to Verify` (Slate muted red)
- **Duplicate Detection Engine**: Compares incoming reports against existing active emergencies using:
  1. Geographic proximity ($\le 500\text{ meters}$)
  2. Category matching
  3. Textual narrative similarity
  4. Time-window correlation ($\le 30\text{ minutes}$)
- **Suspicious Incident Flags**: Highlights unusual reporting patterns, conflicting addresses, or repeated submissions for human verification.
- **Audit Timeline**: Maintains an unalterable history log documenting who updated status, timestamps, and justification notes.

---

### 6. Interactive Tactical Situational Map
- Interactive Leaflet-powered GIS mapping interface.
- Custom colored SVG incident markers with glowing radar rings for active SOS beacons.
- Response team fleet position icons color-coded by category.
- Dashed tactical vector lines connecting assigned units directly to their target incident coordinates.
- Filter layers to isolate specific categories, active beacons, or available units.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 (SPA) | Functional components with Hooks, React Context API |
| **Language** | TypeScript | Strict type safety, interfaces, and enums |
| **Bundler & Tooling** | Vite | Lightning-fast HMR and ESM bundling |
| **Styling** | Tailwind CSS v4 | Dark navy theme (`#020617`), emergency crimson accents (`#ef4444`) |
| **Icons** | Lucide React | High-contrast emergency, vehicle, and operational iconography |
| **Mapping** | Leaflet | Tactical geospatial visualization with custom markers |
| **Video Storage** | IndexedDB API | High-capacity client-side object store (`ResQ_EvidenceDB_v1`) |
| **Relational Storage** | LocalStorage API | Incidents, fleet teams, assignments, and audit logs |
| **Media APIs** | MediaDevices & MediaRecorder | Camera/mic streaming, VP8/Opus recording |

---

## 📁 Project Architecture & File Tree

```
├── index.html                           # HTML5 entry point & metadata
├── metadata.json                        # App manifest & frame permissions (camera, mic, geolocation)
├── package.json                         # Project dependencies and npm scripts
├── tsconfig.json                        # TypeScript configuration
├── vite.config.ts                       # Vite configuration
└── src/
    ├── main.tsx                         # React root DOM renderer
    ├── App.tsx                          # Core application shell & sub-view router
    ├── index.css                        # Tailwind CSS global styles
    ├── types/
    │   └── index.ts                     # TypeScript definitions (Incident, VideoEvidence, Teams, etc.)
    ├── services/
    │   └── videoStorage.ts              # IndexedDB video evidence database service
    ├── context/
    │   └── IncidentContext.tsx          # Central state management, dispatch logic, and metrics
    ├── utils/
    │   ├── geoUtils.ts                  # Haversine distance & coordinate math
    │   ├── prioritizationEngine.ts      # 0–100 dynamic triage scoring algorithm
    │   ├── severityClassifier.ts        # NLP hazard keyword severity detection
    │   └── verificationEngine.ts        # Duplicate detection & suspicious report heuristics
    ├── data/
    │   ├── sampleIncidents.ts           # Pre-seeded emergency incidents
    │   └── sampleTeams.ts               # Pre-seeded emergency response units
    └── components/
        ├── common/                      # Reusable badges (Severity, Priority, Verification, Teams)
        ├── layout/                      # Navbar, Sidebar, and operational navigation
        ├── dashboard/                   # Stat cards, critical alerts, category charts, stream tables
        ├── sos/                         # One-Tap SOS emergency hero and modal dialog
        ├── video/                       # Emergency Video Recorder modal (live camera + MediaRecorder)
        ├── incidents/                   # Incident management table, grid cards, and detail modal
        ├── report/                      # Standard emergency report form with video attachment
        ├── dispatch/                    # Haversine recommendation and unit assignment center
        ├── map/                         # Interactive Leaflet tactical situational map
        ├── units/                       # Response fleet resource roster manager
        ├── verification/                # Admin verification and duplicate triage panel
        └── analytics/                   # Operational response analytics & SLA graphs
```

---

## 💻 Installation & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Steps

1. **Clone or Navigate to the Workspace**:
   ```bash
   cd /path/to/resq
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The application will boot on `http://localhost:3000`.

4. **Type Check & Lint**:
   ```bash
   npm run lint
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🔒 Privacy & Safety Disclaimers

1. **Demonstration & Hackathon Platform**:
   - ResQ is a prototype system developed for demonstration and hackathon evaluation.
   - Activating the SOS beacon **does not contact local 911 services, municipal police, fire, or ambulance call centers**.
2. **Citizen Safety First**:
   - Citizens are instructed never to enter burning structures, approach rising floodwaters, or put themselves in physical jeopardy to capture video footage.
   - Video evidence is strictly optional; emergency calls can be submitted with zero delay.
3. **Camera & Microphone Permissions**:
   - The camera and microphone are never engaged in the background or without explicit user permission.
   - Recording only commences when the user clicks **"Start Recording"**.

---

## 👥 Authors & Acknowledgments

- **Team**: ResQ Emergency Coordination Systems
- **Competition**: Code Clash 2026 – Round 2
- Built with Google AI Studio Build platform.
