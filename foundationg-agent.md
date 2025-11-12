# Agent Development Guidelines

This document defines the architecture, structure, and development rules for this project.  
Copilot or any AI assistant must follow these conventions when generating or editing code.

---

## 🏗️ Project Overview

This project consists of two main parts:

1. **Frontend App (Vue 3 + Vite)** — The user-facing web application.
2. **Backend-for-Frontend (BFF) (Next.js)** — The intermediary API layer that communicates with external services and provides optimized data for the frontend.

These two parts **must reside in separate directories** for clear separation of concerns.

```
root/
 ├── frontend/   # Vue 3 app
 ├── bff/        # Next.js backend-for-frontend
 ├── agent.md    # This file
 ├── package.json
 └── README.md
```

---

## 🧩 1. Frontend (Vue 3 Application)

### Framework & Tools
- Vue 3 (Composition API)
- TypeScript
- Vite
- Pinia (for state management)
- Vue Router
- Storybook (for UI components)
- Vitest + Vue Test Utils (for testing)

### Folder Structure (Scalable Best Practice)
```
frontend/
 ├── src/
 │    ├── assets/         # Static assets (images, fonts, etc.)
 │    ├── components/     # Reusable UI components
 │    │    ├── ui/        # Atomic components (buttons, modals, etc.)
 │    │    ├── layout/    # Layout components
 │    │    └── ...
 │    ├── composables/    # Reusable logic (useXXX hooks)
 │    ├── stores/         # Pinia stores
 │    ├── views/          # Page-level components (mapped to routes)
 │    ├── router/         # Vue Router configuration
 │    ├── services/       # API services (handled via BFF endpoints)
 │    ├── utils/          # Helper functions
 │    ├── types/          # Global TypeScript definitions
 │    ├── App.vue
 │    └── main.ts
 │
 ├── tests/               # Unit and component tests
 ├── storybook/           # Storybook configuration & stories
 ├── vite.config.ts
 ├── tsconfig.json
 └── package.json
```

### Guidelines
- Use **Composition API** and `<script setup>` syntax.
- Use **TypeScript** for type safety.
- Keep components **small, reusable, and tested**.
- **Do not call external APIs directly** — use the BFF endpoints.
- Write **Storybook stories** for all UI components under `components/ui`.

---

## ⚙️ 2. Backend-for-Frontend (Next.js BFF)

### Framework & Tools
- Next.js (latest)
- TypeScript
- REST API routes (under `/pages/api`)
- Axios or native Fetch for external API calls
- Jest or Vitest for unit tests
- ESLint + Prettier

### Folder Structure
```
bff/
 ├── src/
 │    ├── pages/
 │    │    ├── api/         # API routes exposed to the frontend
 │    │    │    ├── user/
 │    │    │    ├── auth/
 │    │    │    └── ...
 │    ├── services/         # External API integrations
 │    ├── utils/            # Shared utility functions
 │    ├── types/            # Type definitions
 │    └── config/           # Env and app configuration
 │
 ├── tests/                 # Unit tests for API routes and services
 ├── jest.config.ts
 ├── tsconfig.json
 └── package.json
```

### Guidelines
- The BFF **should not contain frontend code**.
- All external API calls go through `services/`.
- Each API route must:
  - Validate request params and body.
  - Handle errors gracefully.
  - Return normalized JSON data for the frontend.

---

## 🧪 3. Testing

### Frontend
- Use **Vitest** with **Vue Test Utils**.
- Unit test all components, stores, and composables.
- Coverage goal: **>80%**.
- Test files must follow this pattern:
  ```
  ComponentName.spec.ts
  ```

### BFF
- Use **Jest** (or Vitest if preferred).
- Mock all external API calls.
- Test API routes, utils, and services.

### Example Command
```bash
# Run all tests
pnpm test

# Run only frontend tests
pnpm --filter frontend test

# Run only BFF tests
pnpm --filter bff test
```

---

## 📚 4. Storybook

### Requirements
- Use **Storybook 8+**.
- Place all stories under:
  ```
  frontend/storybook/stories/
  ```
- Follow component-driven development (CDD).
- Each UI component must have at least one `.stories.ts` file.

### Example
```
frontend/storybook/stories/Button.stories.ts
```

---

## 🧠 5. Coding Conventions

- Follow **ESLint + Prettier** standards.
- Use **TypeScript strict mode**.
- Use meaningful names and modular architecture.
- Prefer **async/await** over `.then()`.
- Commit messages follow **Conventional Commits**:
  ```
  feat: add new button component
  fix: resolve API timeout issue
  test: add unit tests for auth store
  ```

---

## 🚀 6. Setup Commands

```bash
# Install dependencies for both apps
pnpm install

# Run frontend
pnpm --filter frontend dev

# Run BFF
pnpm --filter bff dev

# Run Storybook
pnpm --filter frontend storybook
```

---

## ✅ 7. Copilot Rules

Copilot must:
1. Follow the folder structures defined above.
2. Prefer TypeScript in all files.
3. Avoid mixing frontend and backend logic.
4. Write testable, modular, and maintainable code.
5. Always add Storybook stories for UI components.
6. Follow naming conventions and consistent formatting.
7. Suggest scalable patterns, not shortcuts.

---

**End of agent.md**
