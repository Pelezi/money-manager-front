# Budget Manager - Vue 3 + Nuxt 3 Application

A comprehensive budget management application inspired by Google Sheets Monthly/Annual Budget templates, built with Vue 3, Nuxt 3, TypeScript, Tailwind CSS, and Vuetify.

## Features

### 1. Transaction Manager
- Complete CRUD operations for transactions
- Advanced filtering by date range, type (EXPENSE/INCOME), and subcategory
- Inline table editing with real-time updates
- Responsive data table with sorting and pagination

### 2. Category Manager
- Two-panel view: Categories on left, Subcategories on right
- Separate tabs for Expenses and Income
- Quick add/edit/delete operations
- Hierarchical relationship management

### 3. Budget Spreadsheet
- Google Sheets-style grid interface
- Categories as rows, months (Jan-Dec) as columns
- Click-to-edit cells with auto-save on blur
- Real-time budget vs actual comparison
- Color coding: green (good), yellow (warning), red (over budget)
- Hover tooltips showing budget details
- Annual Budget Tool: Distribute amounts across 12 months with equal or custom distribution

### 4. Annual Review
- Summary cards: Total Income, Total Expenses, Net, Savings Rate
- Interactive charts:
  - Line chart: Monthly budget vs actual trends
  - Pie chart: Expense category breakdown
  - Bar chart: Budget vs actual comparison by category
- Performance table with usage percentages and color-coded indicators

## Tech Stack

- **Framework**: Nuxt 3 (Vue 3)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Vuetify 3
- **State Management**: Pinia
- **Charts**: ApexCharts (vue3-apexcharts)
- **Date Handling**: date-fns
- **Icons**: Material Design Icons (@mdi/font)

## API Endpoints

Base URL: `/api/v1`

### Authentication
- `POST /users/login` - User login

### Categories
- `GET /categories` - List all categories (supports `?type=EXPENSE|INCOME`)
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Subcategories
- `GET /subcategories` - List all subcategories (supports `?type=EXPENSE|INCOME&categoryId=xxx`)
- `POST /subcategories` - Create subcategory
- `PUT /subcategories/:id` - Update subcategory
- `DELETE /subcategories/:id` - Delete subcategory

### Budgets
- `GET /budgets` - List budgets (supports `?year=2024&month=1&type=EXPENSE|INCOME&subcategoryId=xxx`)
- `POST /budgets` - Create budget
- `PUT /budgets/:id` - Update budget
- `DELETE /budgets/:id` - Delete budget
- `GET /budgets/comparison` - Get budget vs actual comparison (requires `?year=2024&month=1`)

### Transactions
- `GET /transactions` - List transactions (supports `?startDate=2024-01-01&endDate=2024-12-31&type=EXPENSE|INCOME&subcategoryId=xxx`)
- `POST /transactions` - Create transaction
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction
- `GET /transactions/aggregated` - Get aggregated transactions (requires `?startDate=2024-01-01&endDate=2024-12-31`)

## Data Model

### Entities
- **Category**: Basic categorization (type: EXPENSE|INCOME)
- **Subcategory**: Detailed categorization under a category (type: EXPENSE|INCOME)
- **Budget**: Monthly budget amounts (requires subcategory, month, year)
- **Transaction**: Actual spending/income records (tracks against budgets)

All entities include `type: EXPENSE|INCOME` for proper segregation.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
Create a `.env` file or set environment variables:
```
VITE_API_HOST=http://localhost:3001/api/v1
VITE_API_HOST_NODE=http://localhost:3001/api/v1
VITE_ENV=DEV
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

5. Start production server:
```bash
npm start
```

## Project Structure

```
src/
├── composables/          # API composables and shared logic
│   ├── useApiClient.ts   # Base API client with auth
│   ├── useAuth.ts        # Authentication
│   ├── useCategories.ts  # Category operations
│   ├── useSubcategories.ts
│   ├── useBudgets.ts
│   ├── useTransactions.ts
│   └── useAppState.ts    # Global state (year, filters)
├── layouts/
│   ├── default.vue       # Basic layout
│   └── dashboard.vue     # Layout with navigation
├── pages/
│   ├── index.vue         # Landing page
│   ├── login.vue         # Login page
│   ├── dashboard.vue     # Dashboard home
│   ├── transactions.vue  # Transaction manager
│   ├── categories.vue    # Category manager
│   ├── budget-spreadsheet.vue  # Budget spreadsheet
│   └── annual-review.vue # Annual review dashboard
├── stores/
│   ├── useUserStore.ts   # User authentication state
│   └── root.store.ts     # Root store
├── types/
│   └── api.ts            # TypeScript type definitions
└── middleware/
    └── auth.global.ts    # Global auth middleware
```

## Authentication

- JWT tokens stored in `sessionStorage`
- Automatic token refresh on page reload
- Global middleware protects routes
- Public routes: `/`, `/login`

## Composables Pattern

All API calls are made through composables following Nuxt 3 best practices:
- Auto-imported in components
- Use `useFetch` with bearer token authentication
- Handle loading states and errors
- Type-safe with TypeScript

## Usage

1. **Login**: Use the login page to authenticate
2. **Categories**: Set up your expense and income categories
3. **Subcategories**: Create detailed subcategories under each category
4. **Budget Spreadsheet**: Plan your monthly budgets for the year
5. **Transactions**: Record your actual income and expenses
6. **Annual Review**: Analyze your financial performance

## Color Coding in Budget Spreadsheet

- **Green**: Spending is within budget (< 90% used)
- **Yellow**: Warning zone (90-100% used)
- **Red**: Over budget (> 100% used)

## License

ISC

