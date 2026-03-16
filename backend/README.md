# DAI App Backend

FastAPI backend for Mosque Financial Administration and Congregation Management System.

## Features

- **Authentication**: Google SSO via Supabase
- **Financial Management**: Income/expense tracking, budgets, reports
- **Congregation Management**: Member registry, families, attendance
- **Event Management**: Prayer schedules, Islamic events, classes
- **RESTful API**: Full CRUD operations with FastAPI

## Tech Stack

- Python 3.12+
- FastAPI
- SQLAlchemy + PostgreSQL (Supabase)
- Alembic for migrations
- uv for package management
- Supabase for auth and database

## Setup

### 1. Install uv

```bash
# On Windows
pip install uv

# On Linux/Mac
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Install dependencies

```bash
uv sync
```

### 3. Configure environment

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

Update the following in `.env`:
- `DATABASE_URL`: Your Supabase PostgreSQL connection string
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon key
- `SUPABASE_JWT_SECRET`: Your Supabase JWT secret
- `SECRET_KEY`: Generate a secure random key

### 4. Run database migrations

```bash
# Create initial migration
uv run alembic revision --autogenerate -m "Initial migration"

# Apply migrations
uv run alembic upgrade head
```

### 5. Run the application

#### Development mode (with auto-reload):

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Using Docker:

```bash
# Build and run
docker-compose up --build

# Run in background
docker-compose up -d
```

## API Documentation

Once running, access the API documentation at:

- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

## API Endpoints

### Authentication
- `POST /api/v1/auth/google` - Google SSO login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout

### Jamaah (Congregation)
- `GET /api/v1/jamaah` - List all jamaah
- `POST /api/v1/jamaah` - Create jamaah
- `GET /api/v1/jamaah/{id}` - Get jamaah details
- `PUT /api/v1/jamaah/{id}` - Update jamaah
- `DELETE /api/v1/jamaah/{id}` - Delete jamaah

### Families
- `GET /api/v1/families` - List all families
- `POST /api/v1/families` - Create family
- `GET /api/v1/families/{id}/members` - Get family members

### Finance
- `GET /api/v1/transactions` - List transactions
- `POST /api/v1/transactions/income` - Create income
- `POST /api/v1/transactions/expense` - Create expense
- `GET /api/v1/finance/summary` - Get financial summary
- `GET /api/v1/budgets` - List budgets
- `POST /api/v1/budgets` - Create budget

### Events
- `GET /api/v1/events` - List events
- `POST /api/v1/events` - Create event
- `POST /api/v1/events/{id}/attendance` - Record attendance
- `GET /api/v1/events/{id}/attendance` - Get event attendance

## Database Models

### User
- Authentication and authorization
- Roles: admin, pengurus, bendahara, imam, muadzin, member

### Jamaah
- Personal information
- Address details
- Family relationships

### Family
- Household grouping
- Family members

### Transaction
- Income and expense tracking
- Categories (infaq, zakat, sadaqah, etc.)
- Payment methods
- Approval workflow

### Budget
- Budget planning
- Monthly/yearly budgets

### Event
- Event management
- Prayer schedules
- Islamic events

### Attendance
- Event attendance tracking
- Member participation

## Development

### Create new migration

```bash
uv run alembic revision --autogenerate -m "Description of changes"
uv run alembic upgrade head
```

### Run tests

```bash
uv run pytest
```

### Code formatting

```bash
uv run black app/
uv run ruff check app/
```

## Production Deployment

### Using Docker

```bash
docker build -t dai-app-backend .
docker run -p 8000:8000 --env-file .env dai-app-backend
```

### Environment Variables for Production

Ensure these are set in production:
- `DEBUG=false`
- `SECRET_KEY=<strong-random-key>`
- `ALLOWED_ORIGINS=<your-frontend-domain>`
- All Supabase credentials

## License

MIT
