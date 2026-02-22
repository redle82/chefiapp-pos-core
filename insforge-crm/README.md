# InsForge CRM Platform

A lightweight, feature-rich CRM application built with React 18, Vite, and InsForge backend-as-a-service.

## Features

✅ **Contact Management** — Create, search, and organize contacts with tags
✅ **Company Directory** — Track companies and link contacts to them
✅ **Deal Pipeline** — Kanban-style Deals board with drag-and-drop stage updates
✅ **Deal Details** — Notes, associated tasks, follow-up dates, and file attachments
✅ **Activity Timeline** — Auto-logged stage changes with timestamps
✅ **Task Management** — Create tasks/follow-ups tied to deals or contacts with due dates
✅ **File Storage** — Upload and manage file attachments via InsForge storage
✅ **Authentication** — Email/password auth with InsForge-hosted login pages
✅ **Real-time Sync** — Database-driven updates with PostgREST API underneath

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Database Tables

Run these SQL commands in your InsForge dashboard:

```sql
-- Copy table definitions from README or docs folder
```

### 3. Start Development Server

```bash
npm run dev
```

Access at `http://localhost:5173`

## Tech Stack

- React 18 + TypeScript
- Vite build tool
- InsForge backend (PostgreSQL + PostgREST)
- Tailwind CSS 3.4
- File storage via InsForge

## Project Structure

```
src/
├── config/insforge.ts           # SDK initialization
├── services/
│   ├── database.ts              # Database CRUD
│   └── storage.ts               # File operations
├── pages/                       # Main features
├── components/                  # Reusable UI
└── App.tsx                      # Main app
```

## Features

### Deals Pipeline

- Kanban board with stages (Lead → Won)
- Drag-and-drop to update stage
- Auto-log stage changes with timestamp

### Contacts

- Create/search/manage contacts
- Tag-based organization
- Link to companies

### Companies

- Company directory
- Track industry, website, phone
- Link multiple contacts

### Tasks & Follow-ups

- Create tasks tied to deals
- Due date tracking
- Mark complete/delete

### File Management

- Upload files to deals
- Auto-rename on duplicate
- Download when needed

## Learn More

- [InsForge Docs](https://insforge.dev)

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
