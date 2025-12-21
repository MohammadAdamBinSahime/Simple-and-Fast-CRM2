# CRM Application

A modern Customer Relationship Management application inspired by TwentyCRM with a clean, Notion-inspired interface.

## Overview

This CRM application helps you manage your contacts, companies, deals, and tasks with a beautiful, intuitive interface. Built with React, TypeScript, and PostgreSQL.

## Features

- **Dashboard**: Overview of key metrics including total contacts, companies, active deals, and pipeline value
- **Contacts Management**: Create, edit, and delete contacts with full CRUD operations
- **Companies Management**: Track organizations and link them to contacts
- **Deals Pipeline**: Kanban board and table view for managing sales opportunities with drag-and-drop
- **Tasks**: Task management with priority levels, due dates, and completion tracking
- **Quick Search**: Global search with Cmd+K / Ctrl+K keyboard shortcut
- **Dark/Light Mode**: Theme toggle with system preference support
- **Social Integrations**: Connect WhatsApp, LinkedIn, and Facebook for automatic contact syncing
  - Automatic sync via Zapier/Make.com webhooks
  - Manual CSV import option
  - Webhook URL with security tokens

## Project Architecture

```
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/        # Shadcn UI components
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── command-search.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── kanban-board.tsx
│   │   │   ├── metric-card.tsx
│   │   │   ├── status-badge.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── pages/         # Page components
│   │   │   ├── dashboard.tsx
│   │   │   ├── contacts.tsx
│   │   │   ├── companies.tsx
│   │   │   ├── deals.tsx
│   │   │   ├── tasks.tsx
│   │   │   └── settings.tsx
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and query client
│   │   └── App.tsx        # Main application component
├── server/                # Backend Express application
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database storage layer
│   └── index.ts           # Server entry point
├── shared/                # Shared types and schemas
│   └── schema.ts          # Drizzle ORM schemas and types
└── design_guidelines.md   # Design system documentation
```

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI, TanStack Query
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: Wouter (frontend)

## API Endpoints

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics

### Contacts
- `GET /api/contacts` - List all contacts
- `GET /api/contacts/:id` - Get a contact
- `POST /api/contacts` - Create a contact
- `PATCH /api/contacts/:id` - Update a contact
- `DELETE /api/contacts/:id` - Delete a contact

### Companies
- `GET /api/companies` - List all companies
- `GET /api/companies/:id` - Get a company
- `POST /api/companies` - Create a company
- `PATCH /api/companies/:id` - Update a company
- `DELETE /api/companies/:id` - Delete a company

### Deals
- `GET /api/deals` - List all deals
- `GET /api/deals/:id` - Get a deal
- `POST /api/deals` - Create a deal
- `PATCH /api/deals/:id` - Update a deal
- `DELETE /api/deals/:id` - Delete a deal

### Tasks
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:id` - Get a task
- `POST /api/tasks` - Create a task
- `PATCH /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Notes
- `GET /api/notes` - List all notes
- `GET /api/notes/:id` - Get a note
- `POST /api/notes` - Create a note
- `PATCH /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Delete a note

### Integrations
- `GET /api/integrations` - List user's connected integrations
- `GET /api/integrations/webhook-base-url` - Get the webhook base URL for integrations
- `POST /api/integrations` - Connect a new integration (whatsapp, linkedin, facebook)
- `PATCH /api/integrations/:id` - Update integration settings
- `DELETE /api/integrations/:id` - Disconnect an integration
- `POST /api/webhook/contacts/:platform?webhookSecret=...` - Receive contacts from external services

## Database Schema

- **users**: Application users
- **contacts**: Contact records with name, email, phone, company association, status, and social links
- **companies**: Company/organization records with industry, size, and contact info
- **deals**: Sales opportunities with value, stage, probability, and close date
- **notes**: Notes linked to contacts, companies, or deals
- **tasks**: Tasks with priority, due date, and association to other records
- **integration_accounts**: Social integration connections with webhook secrets for auto-sync

## Planned Features (Deferred)

- **Billing Management**: Stripe integration for subscription and payment management
  - User dismissed Stripe connector setup - can add later if needed
  - When ready: Use Replit's Stripe connector for secure OAuth integration

## Recent Changes

- December 2024: Fixed AI Chatbot authentication
  - Chat routes now correctly extract user ID from session claims
  - Added isAuthenticated middleware for proper route protection

- December 2024: Added AI Chatbot Assistant
  - Conversational AI assistant for CRM help
  - Context-aware with access to contacts, deals, and tasks data
  - Streaming responses for real-time chat experience
  - Conversation history with multiple chat sessions
  - Uses Replit AI Integrations (no API key needed)

- December 2024: Added Google Calendar integration
  - Calendar page with monthly grid view synced to Google Calendar
  - View, create, and delete appointments directly from CRM
  - Automatic connection detection with setup instructions
  - Uses Replit's Google Calendar connector for OAuth

- December 2024: Added social media integrations
  - WhatsApp, LinkedIn, Facebook integration pages
  - Automatic sync via webhook endpoints
  - Manual CSV import with templates
  - Secure webhook tokens for external services

- December 2024: Initial release with core CRM functionality
  - Dashboard with metrics
  - Contact, Company, Deal, Task CRUD operations
  - Kanban board for deals pipeline
  - Dark/light theme support
  - Command search (Cmd+K)

## User Preferences

- Default theme: System preference
- Theme storage key: `crm-theme`
