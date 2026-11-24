# Transaction Import System

A small Maker / Checker transaction import application built with Node.js, Express, SQLite, and plain HTML, CSS, and JavaScript.



## Run locally

cd backend
npm install
npm run dev
```

Open [http://localhost:5000](http://localhost:5000). The SQLite database is created automatically at `backend/database/database.sqlite` on first start. If SQLite reports database corruption, startup preserves the original as `database.sqlite.corrupt-<timestamp>` and creates a fresh database so the app can run. The preserved file may contain recoverable old data; the new active database will be empty. Uploaded files are held temporarily in `backend/uploads` and removed after processing.

Use `npm start` for a normal server start. Set `PORT` in the environment to change port; the default is `5000`.

## CSV format

The first row must contain these column names (case and surrounding whitespace are ignored):

```csv
transaction_id,customer_name,account_number,amount
TXN-1001,Asha Kumar,001234567890,1250.50
TXN-1002,Rahul Shah,009876543210,499.99
```

All fields are required. Amount must be a finite number greater than zero. Transaction IDs must be unique in the file and across prior uploads. Valid rows are stored with `PENDING` status; invalid rows are reported with their CSV row number and reasons. A batch is recorded even if all of its rows are invalid.

## API

All endpoints are served from `http://localhost:5000`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/upload` | Upload multipart form data with a CSV `file` field; optional `performed_by` field. |
| `GET` | `/batches` | List batches and total, pending, and authorized counts. |
| `GET` | `/batches/:id` | Get a batch and its valid transactions. |
| `POST` | `/batches/:id/approve` | Authorize all pending transactions in a batch; optional JSON `performed_by`. |
| `GET` | `/audit-logs` | List upload and approval audit records. |
| `GET` | `/api/health` | Check server availability. |

Approval requests are atomic and a batch can only be approved once. Repeated approval returns `409 Conflict`. Upload and approval actions are recorded in the audit log. Since this is an interview assignment, Maker and Checker names are supplied as request fields rather than authenticated accounts.

### Example requests

Upload with curl:

```bash
curl -F "file=@sample.csv" -F "performed_by=MAKER" http://localhost:5000/upload
```

Approve a batch:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"performed_by":"CHECKER"}' http://localhost:5000/batches/1/approve
```

## Data model

- `batches` stores filename, upload totals, and creation time.
- `transactions` stores valid rows, globally unique transaction IDs, and `PENDING` / `AUTHORIZED` status.
- `audit_logs` stores who performed each upload or approval and its details.

SQLite enables foreign keys and enforces positive amounts and valid transaction statuses.
