
# MailForge - Email Job Scheduler

MailForge is a full-stack email scheduling application built for managing scheduled and bulk email jobs.

Users can log in with Google, compose emails, upload recipient lists, schedule emails for a later time, and track scheduled and sent emails from the dashboard.

The backend uses BullMQ and Redis to handle delayed jobs and distributed worker processing. PostgreSQL stores the application data, while Ethereal SMTP is used for email delivery during development and testing.

## Features

- Google OAuth login and logout
- Single and bulk email scheduling
- CSV/TXT recipient upload
- Recipient validation and duplicate removal
- Configurable delay between emails
- Configurable hourly email limit
- BullMQ delayed jobs
- Configurable worker concurrency
- PostgreSQL persistence
- Idempotent email job processing
- Distributed minimum-delay control using Redis
- Distributed hourly rate limiting using Redis/Lua
- Automatic rescheduling when the hourly limit is reached
- Slack OAuth connection
- Slack notification when the hourly email limit is reached
- Scheduled and Sent email views
- Email search and refresh
- Email detail view
- Send Later date/time picker
- Loading, empty, and error states

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- React Router
- Lucide Icons

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM

### Infrastructure

- PostgreSQL
- Redis
- BullMQ

### Email

- Nodemailer
- Ethereal SMTP

### Integrations

- Google OAuth 2.0
- Slack OAuth 2.0

## How It Works

The application is split into a frontend, API layer, database, queue, and workers.

                    +------------------+
                    |  React Frontend  |
                    +--------+---------+
                             |
                             v
                    +------------------+
                    |   Express API    |
                    +--------+---------+
                             |
                 +-----------+-----------+
                 |                       |
                 v                       v
        +----------------+       +----------------+
        |   PostgreSQL   |       | BullMQ / Redis |
        +----------------+       +-------+--------+
                                         |
                                         v
                                +------------------+
                                | BullMQ Worker(s) |
                                +--------+---------+
                                         |
                              +----------+----------+
                              |                     |
                              v                     v
                       +-------------+       +-------------+
                       |  Ethereal   |       | Slack API  |
                       |    SMTP     |       +-------------+
                       +---------

### Scheduling flow

1. The user creates an email schedule from the frontend.
2. The API validates the request and creates the required records in PostgreSQL.
3. A BullMQ delayed job is created for each recipient.
4. When the scheduled time is reached, a worker picks up the job.
5. The worker atomically claims the database job before sending it.
6. Redis is used to enforce the configured send delay and hourly limit.
7. If the hourly limit has been reached, the job is rescheduled for the next UTC hour instead of being dropped.
8. If the job can be sent, Nodemailer sends it through Ethereal SMTP.
9. The email job is updated with its final status and send time.
10. When a rate limit is reached, the connected Slack account receives a notification.


## Reliability

A major part of the implementation is making scheduled jobs safe when multiple workers are running or when the application is restarted.

### Job Idempotency

Before processing an email, the worker performs an atomic database update to claim the job.

This prevents two workers from successfully claiming the same scheduled email at the same time.

The database remains the source of truth for the email job state.

### Restart Persistence

Scheduled emails are stored in PostgreSQL and represented as delayed BullMQ jobs.

Because the scheduling information is not kept only in Node.js memory, jobs remain available when the backend or worker process is restarted.

This was tested by scheduling jobs, stopping the backend/worker process, restarting it, and verifying that the jobs were processed after the restart.

### Minimum Delay Between Emails

The delay between individual sends is configurable through:


MIN_EMAIL_DELAY_MS=2000

Redis is used to coordinate the delay across workers instead of storing the last-send timestamp only in a local Node.js variable.

This allows multiple worker processes to follow the same delay rule.

### Hourly Rate Limiting

The hourly email limit can be configured through:


MAX_EMAILS_PER_HOUR=200


The rate limit uses Redis with an atomic Lua script so that concurrent workers can safely update the same counter.

When the limit is reached:

* The current email is not dropped.
* The job is returned to the scheduled state.
* It is moved to the next available UTC hour.
* A Slack notification is triggered for the connected user.
* The notification is deduplicated so multiple workers do not repeatedly send the same alert.



## Authentication

Google OAuth 2.0 is used for user authentication.

After signing in, the user can access the MailForge dashboard and manage their scheduled emails.

The application also supports logout and session handling on the backend.



## Slack Integration

MailForge supports connecting a Slack workspace through Slack OAuth 2.0.

The connection is stored for the authenticated user and can be disconnected and reconnected without changing the application deployment.

When an hourly email limit is reached, MailForge sends a Slack DM to the connected Slack user.

If Slack is not connected, email processing continues normally and the missing Slack connection does not cause the email job to fail.



## Email Delivery

MailForge uses [Ethereal](https://ethereal.email/) as the SMTP test service during development.

Ethereal allows the application to generate and inspect test email deliveries without sending real emails to external recipients.

Nodemailer is used to communicate with the SMTP server.



## Environment Variables

Create a `backend/.env` file:


PORT=5000
NODE_ENV=development

DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database>?schema=public"
REDIS_URL="redis://localhost:6379"

WORKER_CONCURRENCY=5
MIN_EMAIL_DELAY_MS=2000
MAX_EMAILS_PER_HOUR=200

ETHEREAL_HOST="smtp.ethereal.email"
ETHEREAL_PORT=587
ETHEREAL_USER=""
ETHEREAL_PASSWORD=""

SLACK_CLIENT_ID=""
SLACK_CLIENT_SECRET=""
SLACK_REDIRECT_URI="http://localhost:5000/api/slack/callback"

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"

SESSION_SECRET="replace_with_a_random_secret"

CLIENT_URL="http://localhost:5173"

Create a `frontend/.env` file:


VITE_API_BASE_URL="http://localhost:5000/api"

Replace the placeholder values with your local PostgreSQL credentials and OAuth/Ethereal credentials.

**Do not commit `.env` files or application secrets to GitHub.**


## Running Locally

### Prerequisites

Make sure the following are installed:

* Node.js 20+
* npm
* Docker
* Docker Compose

You will also need:

* Google OAuth credentials
* Slack OAuth credentials
* Ethereal SMTP credentials

### 1. Start PostgreSQL and Redis

From the project root:


docker-compose up -d

### 2. Configure the backend

Create `backend/.env` using the environment variables above.

Then:

cd backend
npm install
npx prisma db push
npx prisma generate
npm run dev

The backend runs on:

http://localhost:5000

### 3. Configure the frontend

In another terminal:


cd frontend
npm install
npm run dev

The frontend runs on:


http://localhost:5173


Open the frontend URL in a browser and sign in with Google.


## Testing and Verification

The project contains targeted scripts for checking important reliability features.

From the backend directory:


npx tsx src/test_delay.ts
npx tsx src/test_idempotency.ts
npx tsx src/test_rate_limit.ts
npx tsx src/test_slack.ts


The implementation was also manually verified for:

* Delayed BullMQ job execution
* Persistence across backend/worker restart
* Atomic job claiming
* Duplicate-send prevention
* Minimum delay between sends
* Hourly rate limiting
* Rescheduling jobs into the next UTC hour
* Slack notification on rate-limit hit
* Ethereal email delivery
* Google OAuth login
* Dashboard scheduling flow

## Project Structure

mailforge/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── queues/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── workers/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── prisma/
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   │
│   └── package.json
│
├── docker-compose.yml
├── README.md
└── .gitignore


## Design Decisions

### PostgreSQL as the source of truth

Email jobs, campaigns, users, and integration information are persisted in PostgreSQL.

Redis and BullMQ are used for queue processing and distributed coordination rather than being the only place where job state is stored.

### BullMQ delayed jobs instead of cron

Future email execution is handled using BullMQ delayed jobs.

The project does not use:

* `cron`
* `node-cron`
* Agenda
* A separate polling scheduler

### Atomic job claiming

Workers claim jobs using an atomic database update before processing them.

This is important when multiple workers are processing jobs at the same time.

### Redis-based coordination

Redis is used for distributed coordination of:

* minimum send delay
* hourly rate-limit counters
* Slack notification deduplication

This avoids relying on process-local variables when multiple workers are running.

### Rescheduling instead of dropping jobs

When the hourly limit is reached, jobs remain in the system and are moved to the next available UTC hour.

This keeps scheduled emails from being permanently lost because of the rate limit.


## Assignment Requirement Mapping

| Requirement                | Implementation                  |
| -------------------------- | ------------------------------- |
| TypeScript Backend         | `backend/src/`                  |
| Express.js                 | Express API and routes          |
| PostgreSQL/MySQL           | PostgreSQL + Prisma             |
| BullMQ + Redis             | Queue and worker implementation |
| Delayed Jobs               | BullMQ delayed jobs             |
| Restart Persistence        | PostgreSQL + BullMQ             |
| Idempotency                | Atomic database job claim       |
| Configurable Concurrency   | `WORKER_CONCURRENCY`            |
| Minimum Send Delay         | Redis distributed delay logic   |
| Hourly Rate Limit          | Redis/Lua rate-limit logic      |
| Rate-Limit Rescheduling    | Email worker                    |
| Slack OAuth                | Slack OAuth routes/service      |
| Slack Notification         | Slack service + email worker    |
| Google Login               | Passport Google OAuth           |
| Dashboard                  | `DashboardPage.tsx`             |
| Scheduled Emails           | Scheduled email view            |
| Sent Emails                | Sent email view                 |
| Compose                    | `ComposePage.tsx`               |
| CSV/TXT Upload             | Recipient upload logic          |
| Send Later                 | Date/time scheduling UI         |
| Email Details              | `EmailDetailsPage.tsx`          |
| Loading/Error/Empty States | Frontend pages/components       |
| Responsive UI              | TailwindCSS frontend            |


## Notes

* Ethereal is used for test email delivery; this project does not send production emails.
* OAuth credentials and other secrets must be supplied through environment variables.
* The hourly rate-limit window is handled using UTC hour boundaries.
* The minimum send delay is configurable and coordinated through Redis.
* The application is designed for local development and assignment demonstration rather than production email delivery.


## Author

Built as a full-stack hiring assignment demonstrating email scheduling, distributed job processing, rate limiting, OAuth integrations, and a React-based dashboard.


