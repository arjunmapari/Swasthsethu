# Swasthsethu 🏥

### Accessible Digital Healthcare & Patient Case Management

Swasthsethu is a web-based healthcare platform designed to simplify patient registration, health interviews, case management, and coordination between administrators, doctors, and patients.

The platform provides a multilingual patient experience, persistent patient records, and role-based dashboards to support a more accessible and organized healthcare workflow.

**Live Demo:** [https://swasthsethu.vercel.app/](https://swasthsethu.vercel.app/)

---

## ✨ Features

- **Patient Registration:** Create an account and receive a unique patient ID.
- **Interactive Health Interview:** Complete a guided health questionnaire and generate a case record.
- **Patient Dashboard:** Access previously submitted cases and visit information.
- **Doctor Dashboard:** Review patient cases and search using patient IDs or case IDs.
- **Admin Dashboard:** Manage doctor accounts and user access.
- **Multilingual Interface:** Includes English, Hindi, and Marathi interface and questionnaire content.
- **Persistent Database:** Store user accounts and case records in PostgreSQL using Neon.
- **Secure Authentication:** Password-based login and session management.
- **Responsive Design:** Designed for use on desktop and mobile screens.
- **Cloud Deployment:** Deploy the application using Vercel.

> Swasthsethu is a healthcare workflow application. It is not a substitute for professional medical diagnosis, emergency services, or clinical judgment.

---

## 🛠️ Technology Stack

| Technology         | Purpose                                 |
| ------------------ | --------------------------------------- |
| Next.js            | Web framework and application routing   |
| React              | User interface                          |
| TypeScript         | Type-safe application development       |
| PostgreSQL         | Database                                |
| Neon               | Managed PostgreSQL hosting              |
| Tailwind CSS / CSS | Interface styling                       |
| Node.js and npm    | Development environment                 |
| Vercel             | Hosting and deployment                  |
| Git and GitHub     | Version control and source code hosting |

## 🚀 Getting Started

### 1. Clone the repository

Open PowerShell or a terminal and run:

```bash
git clone https://github.com/arjunmapari/Swasthsethu.git
cd Swasthsethu-main
```

If you already have the project downloaded, open the `Swasthsethu-main` project directory instead.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the environment

Create a local environment file by copying the example:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env.local
```

Open `.env.local`:

```powershell
notepad .env.local
```

Add your actual Neon database connection string and a securely generated session secret:

```dotenv
DATABASE_URL="your-neon-postgresql-connection-string"
SESSION_SECRET="your-generated-random-secret"
```

Replace the example values with your own values. Preserve any other required variables already documented by the project.

To generate a random session secret using Node.js, run:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated value into `SESSION_SECRET`.

**Important:** Keep \`.env.local private. Never commit it to GitHub or share its contents publicly.

### 4. Configure the Neon database

1. Sign in to [Neon Console](https://console.neon.tech/).
2. Create a PostgreSQL project or open your existing project.
3. Select **Connect**.
4. Copy the connection string for the intended database.
5. Add it to `DATABASE_URL` in `.env.local`.

Make sure the database credentials are correct and the database is accessible from your development environment.

The application is designed to initialize the required database tables automatically when its database initialization logic runs. Confirm that initialization succeeds before testing the application.

### 5. Create the administrator account

Run the following command, replacing the example details with your own:

```bash
npm run create-admin -- admin@example.com "ReplaceWithAStrongPassword" "Administrator"
```

Use a unique, strong password and an email address you control.

Run this command against the database configured in your environment. The administrator account is created in that database, not automatically in every database you use.

Do not publish real administrator credentials in this README or in source control.

### 6. Start the development server

```bash
npm run dev
```

Wait for Next.js to report that the server is ready.

Open:

**[http://localhost:3000](http://localhost:3000)**

Keep the terminal running while using the local website.

---

## 🧪 Testing the Application

Use separate test accounts for the administrator, doctor, and patient.

### Patient workflow

1. Open the website.
2. Navigate to registration.
3. Register using a test email address.
4. Note the generated patient ID, typically in a format such as `PT-XXXX-XXXX`.
5. Open the demo and complete the health interview.
6. Submit the interview and note the generated case ID, typically `SS-XXXX-XXXX`.
7. Sign out and sign in again as the same patient.
8. Verify that the previous case is still available.

### Administrator workflow

1. Sign in using the administrator account created earlier.
2. Open the admin dashboard.
3. Create a doctor account with a unique email and a strong password.
4. Verify that the doctor account is available for sign-in.

### Doctor workflow

1. Sign in using the doctor account.
2. Open the doctor dashboard.
3. Search for the test patient using the patient ID or case ID.
4. Open the matching case and verify the displayed information.

Use synthetic test data during development. Do not use real patient information for public demonstrations.

---

## 🌐 Deployment to Vercel

Swasthsethu can be deployed to [Vercel](https://vercel.com/) using the GitHub repository.

### 1. Add production environment variables

In the Vercel project settings, open **Environment Variables** and configure the variables required by the application:

- `DATABASE_URL` — the production Neon PostgreSQL connection string.
- `SESSION_SECRET` — a strong, securely generated session secret.
- Any other required variables documented in the project configuration.

Use the correct values for the Production environment. Do not assume your local `.env.local` file is automatically available to Vercel.

Use a dedicated production database where possible. Ensure the database permissions and connection settings are appropriate for deployment.

---

## 🗂️ Project Structure

```text
Swasthsethu/
├── public/
│   └── samples/
├── scripts/
│   ├── create-admin.ts
│   ├── audit-script.mjs
│   └── smoke.mjs
├── src/
│   ├── app/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── demo/
│   │   ├── doctor/
│   │   ├── login/
│   │   ├── patient/
│   │   ├── register/
│   │   ├── globals.css
│   │   └── page.tsx
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── lib/
│   ├── server/
│   └── proxy.ts
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

---

## 🧰 Useful Commands

| Command                                                                                           | Description                                    |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `npm install`                                                                                     | Install project dependencies                   |
| `npm run dev`                                                                                     | Start the local development server             |
| `npm run build`                                                                                   | Build the production application               |
| Use the email `you@example.com` and the password `YourStrongPass123`. You land on the admin page. | Create an administrator account                |
| `npm run`                                                                                         | List the npm scripts configured in the project |

Run commands from the project directory. Check `package.json` for the exact scripts supported by your version of the project.

---

##
