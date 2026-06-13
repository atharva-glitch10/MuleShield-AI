# MuleShield AI – Project Handoff

Welcome to the MuleShield AI project! This is an AI/ML-based platform designed to detect mule accounts using Isolation Forest anomaly detection and provide a responsive dashboard for monitoring.

This document contains everything you need to know to get the project running locally without errors.

## 📁 Project Structure

```text
MuleShield_AI/
├── backend/                  # FastAPI Python backend
│   ├── app/                  # Core application code (routes, models, services, etc.)
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Environment variables (automatically ignored by git)
│   └── venv/                 # Virtual environment (automatically ignored by git)
│
├── frontend/                 # React/Vite frontend
│   └── mule-dashboard/       # Dashboard application source
│       ├── src/              # React components and styling
│       ├── package.json      # Node dependencies
│       └── node_modules/     # Installed packages (automatically ignored by git)
│
└── handoff.md                # This document
```

---

## 🛠️ Environment Prerequisites (Crucial)

To avoid compilation errors with `scikit-learn` and `pandas`, **you must use Python 3.11 or Python 3.12**. 
Using experimental versions of Python (like Python 3.14) will cause `pip install` to fail because standard libraries do not have pre-built wheels for experimental Python versions yet.

You also need **Node.js** installed (v18 or higher recommended) to run the frontend dashboard.

---

## 🚀 Setup Instructions

### 1. Backend Setup (FastAPI)

Open a terminal (e.g., PowerShell) and follow these steps to initialize the backend:

```powershell
# 1. Navigate to the backend directory
cd backend

# 2. Create a virtual environment using Python 3.12 
# (If your default `python` is 3.12, you can just use `python -m venv .\venv`)
py -3.12 -m venv .\venv

# 3. Activate the virtual environment
# Windows:
& .\venv\Scripts\Activate.ps1
# Mac/Linux:
source ./venv/bin/activate

# 4. Install dependencies
# NOTE: Make sure the virtual environment is activated BEFORE running this!
pip install -r requirements.txt

# 5. Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend API will now be running at `http://127.0.0.1:8000`. You can visit `http://127.0.0.1:8000/docs` for the interactive API documentation.

### 2. Frontend Setup (React/Vite)

Leave the backend running, open a **new** terminal window, and run:

```powershell
# 1. Navigate to the dashboard directory
cd frontend/mule-dashboard

# 2. Install Node dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

The frontend will run at `http://localhost:5173/`. Open this URL in your browser to view the MuleShield Dashboard.

---

## 🔧 Important Notes for Development

1. **Git Exclusions**: We have updated `.gitignore` at the project root to exclude `venv/`, `node_modules/`, `__pycache__`, and `.env`. Please do not commit these to source control.
2. **Environment Variables**: The backend expects an `.env` file in the `backend/` directory. If it doesn't exist, Pydantic will fall back to safe defaults (e.g., `"CHANGE_ME"` for `API_KEY`). 
3. **ML Model**: The Isolation Forest model (`app/models/isolation_forest.pkl`) trains automatically on startup if it doesn't exist yet, using the dataset located at `app/data/latest.csv`.

Happy coding!
