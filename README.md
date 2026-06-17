# INCxEXP - Personal Finance Dashboard

A modern, full-stack personal finance application built with .NET 8 and React (Vite). Track your income and expenses, manage categories, and generate detailed PDF reports.

## Features

- **Dashboard:** Overview of balance, total income, and total expenses.
- **Entry Management:** Add, amend, and remove income/expense entries with ease.
- **Category Management:** Custom dropdown with inline tools to add, rename, or delete categories.
- **Reports:**
  - **Monthly:** Detailed list of all entries for a specific month.
  - **Yearly:** Grouped monthly summaries for a high-level overview.
- **PDF Export:** Extract your monthly and yearly data into clean PDF documents.
- **Authentication:** Secure JWT-based login and registration system with session persistence.

## Tech Stack

### Backend
- **Framework:** ASP.NET Core 8 Web API
- **Database:** SQLite (Entity Framework Core)
- **Security:** ASP.NET Core Identity + JWT Authentication
- **Documentation:** Swagger/OpenAPI

### Frontend
- **Framework:** React 19 (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **PDF Generation:** jsPDF
- **Routing:** React Router DOM

## Getting Started

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (v20 or higher recommended)

### 1. Setup Backend
1. Navigate to the project root.
2. Run the API:
   ```bash
   dotnet run --project src/INCxEXP.Api
   ```
   The API will start at `http://localhost:5157` (or `5158`).

### 2. Setup Frontend
1. Navigate to the `frontend` directory (or run from root with `--prefix`):
   ```bash
   npm --prefix frontend install
   npm --prefix frontend run dev
   ```
2. Open your browser to `http://localhost:4173`.

## Deployment
To create a production build of the frontend:
```bash
npm --prefix frontend run build
```

## License
MIT
