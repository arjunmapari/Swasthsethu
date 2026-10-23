# Swasthsethu

A waiting-room kiosk that takes a patient's history in English, Hindi or Marathi and hands the doctor a clean summary. Patients, doctors and admins sign in with email and password, and everything is stored in **Postgres**, so it runs on **Vercel**.

The conversation is **scripted** (no live LLM or translation) and document "extraction" is mocked. The question script and all UI copy live in `src/data/`.

## How it works

- **Patient:** registers once at `/register` (name, email, password) and gets a permanent **patient ID** like `PT-7K4M-9QXD`. Each visit (`/demo`) is saved to their account with a **case ID** like `SS-7K4M-9QXD`. On any later day they just sign in at `/login` and see every earlier visit at `/patient`, including the doctor's status (Waiting, With the doctor, Completed).
- **Doctor:** signs in at `/login` and lands on `/doctor`: a live queue (urgent first) showing each patient's name and patient ID. They can type a **case ID or a patient ID** to open a case or a patient's whole history, and move a case Waiting, In consultation, Completed.
- **Admin:** `/admin` creates doctor/admin accounts, disables accounts, resets passwords, and lists every registered patient with their ID.

Safety rules in the intake (red flags, urgent notice, emergency wording in typed answers, possible-pregnancy rule) are in `src/lib/summary.ts`. **Have a clinician review them before real use.**

## Run it on your computer

You need Node.js 22 or newer and a Postgres database. The easiest is a free hosted one: create a project at neon.tech and copy its connection string. (A local Postgres works too.)

```bash
npm install
copy .env.example .env.local      # Windows (macOS/Linux: cp)
```

Edit `.env.local`:

```
DATABASE_URL=postgres://user:password@host/dbname?sslmode=require
SESSION_SECRET=<a long random string>
```

Make a secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

The tables are created automatically on first use. Now create the first admin and start the app:

```bash
npm run create-admin -- you@clinic.org "a-strong-password" "Your Name"
npm run dev
```

Open http://localhost:3000. Patients register at `/register`; staff sign in at `/login`.

## Deploy to Vercel

1. Put the project on GitHub (the `.env*` files are git-ignored, so no secrets go up).
2. On vercel.com choose **Add New, Project** and import the repository.
3. Open the project's **Storage** tab and add a **Neon (Postgres)** database from the Marketplace. This sets `POSTGRES_URL` for you. (Or add your own `DATABASE_URL` under Settings, Environment Variables.)
4. Under **Settings, Environment Variables** add `SESSION_SECRET` (the long random string).
5. Click **Deploy**.
6. Create the first admin once from your computer. Copy the database URL from Vercel (Settings, Environment Variables) into `.env.local` as `DATABASE_URL`, then run `npm run create-admin -- you@clinic.org "a-strong-password" "Your Name"`.
7. Open your Vercel URL, go to `/login` and sign in as the admin. Add doctors from `/admin`.

Vercel serves everything over HTTPS, which the secure login cookie needs. Uploaded photos are stored in the database (Vercel's disk is read-only) and are shrunk in the browser to stay under Vercel's 4.5 MB request limit.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
npm run audit    # question script: routing, reachability, EN/HI/MR parity (Node 22.18+)
```

`npm run smoke` tests accounts, permissions and the case API end to end. It needs the app running against a **throwaway** database with an admin you created:

```bash
RATE_LIMIT_OFF=1 npm run dev                       # one terminal (this switch is ignored in production)
ADMIN_EMAIL=you@clinic.org ADMIN_PASSWORD=... npm run smoke   # another
```

## Security notes

- Passwords are hashed (scrypt). Login is rate-limited and an account locks for 15 minutes after 8 wrong passwords.
- Roles are checked on the server for every page and API call. A patient can only read their own visits and photos. Disabling an account or resetting its password signs that person out everywhere immediately.
- There is **no email verification and no "forgot password" email** yet. An admin resets passwords from `/admin`.
- This is health data. Before real patients: check your database provider's encryption and backup settings, write a privacy policy and retention rules, and review what your local laws require. Add audit logging if you need to know which doctor opened which record.
