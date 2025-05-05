# Patient ID Card System

A Next.js 15 + React 19 + TypeScript application for managing pre-printed PVC patient ID cards.

## Features

- Card inventory management
- CSV import for bulk card creation
- Barcode generation and scanning
- PDF generation for card printing
- Role-based access control
- Audit logging
- Real-time inventory dashboard

## Tech Stack

- Frontend: Next.js 15 (App Router), React 19, Tailwind CSS
- Backend: Next.js API routes
- Database: PostgreSQL 15 with Prisma ORM
- Barcode: JsBarcode
- PDF Generation: Puppeteer
- Testing: Jest + React Testing Library

## Prerequisites

- Node.js 20
- PostgreSQL 15
- npm or yarn

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd client-barcode-scanner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your database credentials and other settings.

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Development

- Run tests: `npm test`
- Generate Prisma client: `npm run prisma:generate`
- Run migrations: `npm run prisma:migrate`

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── api/              # API routes
├── components/       # React components
├── lib/              # Utilities and helpers
└── tests/            # Test files
```

## License

MIT