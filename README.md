# Budget Manager Front-end

A modern budget management web application inspired by Google Sheets, built with **React**, **Next.js 15**, **TypeScript**, **Tailwind CSS**, and **Turbopack**.

## Features

- 🌍 **Internationalization** - Support for English and Portuguese via `next-intl`
- 📊 **Transaction Manager** - CRUD operations for transactions with advanced filtering
- 🏷️ **Category Manager** - Two-panel layout for managing categories and subcategories
- 📈 **Budget Spreadsheet** - Google Sheets-style editable grid for monthly budgets
- 📉 **Annual Review** - Comprehensive dashboard with charts and performance metrics
- 🔐 **JWT Authentication** - Secure authentication with token-based auth
- 🎨 **Modern UI** - Clean, responsive design inspired by Google Sheets
- ⚡ **Fast Development** - Powered by Turbopack for lightning-fast HMR

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand + React Query
- **Charts**: Recharts
- **Icons**: Lucide React
- **i18n**: next-intl

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8080/api/v1` (configurable)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd money-manager-front
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your API endpoint:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── [locale]/          # Internationalized routes
│   │   ├── (app)/        # Protected app routes
│   │   │   ├── transactions/
│   │   │   ├── categories/
│   │   │   ├── budget/
│   │   │   └── annual-review/
│   │   └── auth/         # Authentication pages
│   └── globals.css       # Global styles
├── components/            # Reusable React components
├── contexts/             # React contexts (Auth)
├── hooks/                # Custom React hooks
├── i18n/                 # Internationalization config
├── lib/                  # Utilities and stores
├── services/             # API service layer
└── types/                # TypeScript type definitions
```

## API Endpoints

The application expects the following API endpoints:

- `POST /api/v1/users/login` - User authentication
- `GET/POST/PUT/DELETE /api/v1/categories` - Category management
- `GET/POST/PUT/DELETE /api/v1/subcategories` - Subcategory management
- `GET/POST/PUT/DELETE /api/v1/expenses` - Budget/expense management
- `GET /api/v1/expenses/comparison` - Budget vs actual comparison
- `GET/POST/PUT/DELETE /api/v1/transactions` - Transaction management
- `GET /api/v1/transactions/aggregated` - Aggregated transaction data

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Features in Detail

### Transaction Manager
- View all transactions with filtering by date range, type, and subcategory
- Inline editing and sorting
- Create, edit, and delete transactions
- Color-coded transaction types (income/expense)

### Category Manager
- Two-panel interface with categories on the left, subcategories on the right
- Separate tabs for expenses and income
- Easy creation and management of hierarchical categories

### Budget Spreadsheet
- Google Sheets-inspired editable grid
- Rows represent categories/subcategories
- Columns represent months (Jan-Dec)
- Color indicators for budget status (green=within, yellow=near limit, red=over)
- Click to edit individual cells with auto-save on blur
- Real-time budget vs. actual comparison

### Annual Review
- Summary cards showing total income, expenses, and net savings
- Line chart for monthly trends
- Pie chart for category breakdown
- Bar chart for income vs. expense comparison
- Performance table showing budgeted vs. actual by category

## Internationalization

The app supports English (en) and Portuguese (pt). To switch languages, change the locale in the URL:
- English: `http://localhost:3000/en/transactions`
- Portuguese: `http://localhost:3000/pt/transactions`

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [next-intl](https://next-intl-docs.vercel.app/)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Query](https://tanstack.com/query/latest)

## License

This project is licensed under the MIT License.
