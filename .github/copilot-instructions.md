# Workspace Custom Instructions

## Project Status

- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements - Completed: Next.js + Tailwind UI + Node.js Backend.
- [x] Scaffold the Project - Completed: Frontend and Backend setup.
- [x] Customize the Project - Completed: Homepage, Dashboard, Chart, Table, Backend API implemented.
- [x] Install Required Extensions - Completed: No additional extensions needed.
- [x] Compile the Project - Completed: Production build verified.
- [x] Create and Run Task - Completed: `tasks.json` created and `npm run dev` running.
- [x] Launch the Project - Completed: Frontend running on port 3000.
- [x] Backend Development - Completed: REST API with H2 database implemented.
- [x] Ensure Documentation is Complete - Completed: All documentation files created.

## Backend API

The backend server is built with Node.js, Express, and H2 in-memory database.

**Start Backend:**
```bash
npm run backend:dev
```

**API Documentation:** See [BACKEND_API.md](../BACKEND_API.md)

**API Base URL:** `http://localhost:3000/api`

**Endpoints:**
- POST `/api/add-product` - Add new product
- GET `/api/get-prices` - Get latest prices
- GET `/api/get-history` - Get price history
- POST `/api/scrape` - Receive scraped data
- GET `/api/ai-summary` - AI integration endpoint (reserved)
- GET `/api/products` - Get all products
