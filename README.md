# PV-OpsHub — Quick Start Guide

**No coding experience required.** This guide is written for Pharmacovigilance professionals who want to run and use the app.

---

## What This Platform Does

PV-OpsHub is a **Pharmacovigilance Operations** monitoring and management tool. It tracks **case assignment, workflow stage, and SLA deadlines** across your teams. Think of it as the "air traffic control" layer **on top of** your safety database (e.g. Argus Safety): it does **not** store patient names, clinical narratives, or MedDRA coding—only **operations data** (who is working on what, when it’s due, and whether it’s at risk).

You get real-time visibility into unallocated cases, HA/VAP priorities, SLA heatmaps, and quality corrections—replacing manual Excel tracking and status calls. The app works alongside your existing PV system; it does not replace it.

---

## How to Start the App (Every Time)

1. **Open Docker Desktop**  
   Wait until it shows **"Engine running"**.

2. **Open Cursor** (or your terminal), then open this project folder.

3. **Open the terminal**  
   Press **Ctrl+`** (backtick) to open the integrated terminal.

4. **Start the database and Redis**  
   Type exactly and press Enter:
   ```bash
   docker-compose up -d
   ```
   Wait about 20 seconds.

5. **Run database setup (first time only)**  
   If you have not run this before:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   npx tsx prisma/seed.ts
   ```
   Wait for the seed to finish (you’ll see "✅ PV-OpsHub Seed Complete").

6. **Start the app**  
   Type and press Enter:
   ```bash
   npm run dev
   ```
   Wait until you see **"Ready"** in the terminal.

7. **Open your browser**  
   Go to: **http://localhost:3000**

8. **Log in**  
   Use one of the accounts below. **Password for all users:** `Demo@123456!`

---

## Login Accounts (Demo Data)

After running the seed, use these logins. All passwords: **Demo@123456!**

| Role        | Tenant 1 (India)        | Tenant 2 (EU)           | Tenant 3 (US)             |
|------------|--------------------------|--------------------------|----------------------------|
| **Admin**  | admin@induspv.com        | admin@eurosafe.de        | admin@pharmasafety.us      |
| **PM**     | pm1@induspv.com         | pm1@eurosafe.de          | pm1@pharmasafety.us        |
| **QM**     | qm1@induspv.com         | qm1@eurosafe.de          | qm1@pharmasafety.us        |
| **Ops Mgr**| ops1@induspv.com         | ops1@eurosafe.de         | ops1@pharmasafety.us       |
| **Team Lead** | tl1@induspv.com      | tl1@eurosafe.de          | tl1@pharmasafety.us        |
| **Processor** | proc01@induspv.com   | proc01@eurosafe.de      | proc01@pharmasafety.us     |

---

## What Each Role Can See and Do

| Role          | What they see | What they can do |
|----------------|---------------|-------------------|
| **Processor**  | Project Dashboard + their own cases | View only; names of others anonymized on leaderboard |
| **Team Lead**  | All 6-tab TL dashboard + allocation panel | Allocate cases, escalate, add notes |
| **PM**         | Manager dashboard + allocation + holds | Everything a TL can do, plus Hold/Release allocation |
| **QM**         | Manager dashboard + quality module | Corrections, CAPA, investigations |
| **Admin**      | Everything | Configure report types, SLA rules, users, governance |

---

## Demo Scenarios to Try

1. **"I want to see the most urgent cases right now"**  
   Log in as **Team Lead** (e.g. tl1@induspv.com) → open the **HA/VAP** tab. Cases are sorted by SLA urgency.

2. **"I want to allocate today’s new cases"**  
   Log in as **Team Lead** → go to **Allocation** → filter by Unallocated → select cases → choose a processor → click **Allocate**.

3. **"I want to hold allocations while I finish a batch"**  
   Log in as **PM** (e.g. pm1@induspv.com) → go to **Allocation** → click **Hold All** → confirm. The hold banner appears on the TL dashboard **Hold Status** tab.

4. **"I want to see who has the most corrections this month"**  
   Log in as **QM** → go to **Quality → Corrections**. Use the **Quality heatmap** (User × Category).

5. **"I want to check if we’ll breach any SLAs this week"**  
   Log in as **PM** → go to **SLA** → check the **7-day forecast** chart and the SLA heatmap.

6. **"I want to open a case and see full details"**  
   From **Cases** or any list, **click a case row**. The **Case Drill-Down** panel opens with Overview, Workflow, Corrections, Allocation History, and Audit tabs.

---

## How to Stop the App

1. In the terminal where `npm run dev` is running, press **Ctrl+C** to stop the Next.js server.
2. To stop the database and Redis, run:
   ```bash
   docker-compose down
   ```

---

## Need Help?

If something doesn’t work (e.g. login fails, page doesn’t load, or you see an error message), copy the **exact error message** or a screenshot into the Cursor chat so we can fix it.

---

*PV-OpsHub — Pharmacovigilance Operations Monitoring & Management*
