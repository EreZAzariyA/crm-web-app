# CRM Web Application

## Project Overview

This is a modern Customer Relationship Management (CRM) web application built with **Next.js 15**, **TypeScript**, and **Tailwind CSS**. It leverages **shadcn/ui** for a robust and accessible component library. The application includes features for managing contacts, deals, activities, and a dashboard for analytics.

## Tech Stack

*   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (built on [Radix UI](https://www.radix-ui.com/))
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Charts:** [Recharts](https://recharts.org/)
*   **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
*   **Date Handling:** [date-fns](https://date-fns.org/)
*   **Animation:** [Tailwind Animate](https://github.com/jamiebuilds/tailwindcss-animate)

## Project Structure

```
├── app/                  # Next.js App Router pages and layouts
│   ├── activity/         # Activity page
│   ├── contacts/         # Contacts page
│   ├── deals/            # Deals page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Dashboard (Home) page
│   └── globals.css       # Global styles (Tailwind directives)
├── components/           # React components
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   ├── dashboard/        # Dashboard-specific components (charts, stats)
│   ├── contacts/         # Contacts-related components
│   ├── deals/            # Deals-related components
│   ├── activity/         # Activity-related components
│   ├── app-sidebar.tsx   # Main application sidebar navigation
│   └── ...
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and data
│   ├── utils.ts          # Helper functions (cn, etc.)
│   └── crm-data.ts       # Mock data/Data fetching logic
├── public/               # Static assets (images, icons)
├── styles/               # Additional styles
└── ...config files       # (next.config.mjs, tailwind.config.ts, etc.)
```

## Getting Started

1.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    # or
    bun install
    ```

2.  **Run the development server:**

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    # or
    bun dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

*   `dev`: Runs the development server.
*   `build`: Builds the application for production.
*   `start`: Starts the production server.
*   `lint`: Runs ESLint to check for code quality issues.

## Development Guidelines

### Components

*   **UI Components:** This project uses `shadcn/ui`. Components are located in `components/ui`. When adding new UI elements, check if a shadcn component exists first.
*   **Feature Components:** Place feature-specific components in their respective folders within `components/` (e.g., `components/dashboard`).

### Styling

*   Use **Tailwind CSS** utility classes for styling.
*   Use the `cn()` utility (from `lib/utils.ts`) for conditional class merging.
*   Global styles are defined in `app/globals.css`.

### Data Fetching

*   Currently, the project uses mock data or local data definitions (likely in `lib/crm-data.ts`).
*   Future integrations should follow Next.js data fetching patterns (Server Components, SWR, or React Query).
