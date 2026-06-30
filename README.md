# Puvi Backend

Small Express API for the Puvi website: playground compilation simulation, contact form, newsletter signups, and stats.

## Run it

```bash
cd backend
npm install
npm start
```

Server starts on `http://localhost:4000`.

## Endpoints

| Method | Path                   | Body                              | Notes                              |
|--------|------------------------|------------------------------------|-------------------------------------|
| GET    | `/api/health`          | —                                   | Health check                        |
| GET    | `/api/team`             | —                                   | Team roster                         |
| POST   | `/api/playground/run`  | `{ "source": "..." }`              | Lexes + resolves Puvi keywords      |
| POST   | `/api/contact`         | `{ name, email, message }`         | Saves to `data/contacts.json`       |
| POST   | `/api/newsletter`      | `{ email }`                        | Saves to `data/subscribers.json`    |
| GET    | `/api/stats`           | —                                   | Counts of contacts/subscribers      |

Data is stored as flat JSON files in `backend/data/` (created automatically). Swap this out for a real database before going to production.

## Connecting the frontend

`index.html` already has an `API_BASE` constant near the bottom of the `<script>` block. By default it's empty, so the Playground falls back to the local in-browser simulation. Point it at your running backend, e.g.:

```js
const API_BASE = 'http://localhost:4000';
```

and the **Run** button in the Playground will call `/api/playground/run` first, falling back to the local simulator if the request fails (e.g. backend not running, or deployed as a static site).
