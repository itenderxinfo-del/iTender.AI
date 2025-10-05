# 📘 Project Best Practices

## 1. Project Purpose
An Angular 20 single-page application for internal project and company management (iPMS.iClick). It manages customers, companies, projects, tasks, steps, locations, authorities, industries, and activity logs. The app currently uses in-memory data via Angular Signals and does not persist to a backend. The UI supports light/dark themes via CSS variables and a theme service.

## 2. Project Structure
- High-level
  - src/main.ts: Bootstraps the standalone AppComponent with HttpClient provider
  - src/app/app.component.ts: Root shell, top navigation, and view switching via NavigationService
  - src/app/components/*: Standalone feature components (mostly inline templates/styles)
  - src/app/services/*: Core services (auth, data/state, navigation, theming)
  - src/app/models/*: TypeScript interfaces for domain entities
  - src/styles.css: Global styles, design tokens, light/dark theme variables
  - angular.json, tsconfig*.json: Angular build and TypeScript configuration (strict mode enabled)
- Architecture
  - Standalone Components (no NgModules): each feature is a self-contained component
  - Navigation is implemented via a reactive NavigationService (signals) instead of the Angular Router
  - State Management is service-based using Angular Signals (signal, computed, effect)
  - Domain is captured in models/* and CRUD orchestration occurs in DataService, including cascading deletes and activity logging

## 3. Test Strategy
No test framework is configured yet.
- Recommended setup
  - Use Jest for unit tests (fast, watch mode). Co-locate specs with source files: x.component.spec.ts, x.service.spec.ts
  - For Angular 20, use the latest jest-preset-angular and TestBed for components/services
- What to test
  - Services: CRUD logic, permission gating, cascading operations (e.g., deleteCompany deletes projects, tasks, steps)
  - Components: Template control flow, interactions (click handlers), form validation logic
  - Navigation: That state transitions are correct for each action
  - ThemeService: Light/dark toggling behavior and DOM class changes
  - DataService signals: updates are immutable and computed values reflect changes
- Guidelines
  - Prefer unit tests; add integration tests for cross-entity workflows (e.g., project/task/step chains)
  - Mock services via TestBed providers or spies; avoid real async, use fakeAsync/tick when applicable
  - Keep tests deterministic and isolated; avoid depending on module-global singleton state
  - Aim for meaningful coverage (e.g., 80%+ on services and critical UI paths)

## 4. Code Style
- TypeScript/Angular
  - Strict mode is enabled; maintain full typing on public APIs and internal helpers
  - Prefer interfaces for models and explicit Partial<T> for patch operations
  - Use inject() in components/services instead of constructor injection for consistency
  - Manage state via Signals:
    - Use signal() for writable state, computed() for derived read-only state
    - Avoid direct mutation of array/object references; prefer update() with immutable operations
  - Templates use Angular block syntax (@if, @for, @switch) for clarity and performance; always provide track expressions in @for
  - Forms: Template-driven with ngModel in this repo; validate required fields and edge cases in submit handlers
- Naming Conventions
  - Files: kebab-case (e.g., company-list.component.ts)
  - Classes/Interfaces: PascalCase (CompanyListComponent, DataService, Company)
  - Functions/variables: lowerCamelCase (createCompany, isActive, newCompany)
  - Booleans: is*/has*/can* (isActive, hasLoadingError, canCreateProject)
  - Signals/computed: nouns for signals (companies), allX pattern for public read-only computed (allCompanies)
  - Services: Suffix with Service (NavigationService)
- Comments & Docs
  - Keep code self-explanatory; document non-obvious side effects (e.g., cascading deletes, logging)
  - Use short JSDoc where helpful for service methods and domain nuances
- Error Handling
  - Current pattern: console.error and alert placeholders
  - Best practice: centralize user notifications (e.g., toast service); ensure errors are surfaced and typed
  - Guard permissions with explicit checks; fail fast with descriptive errors

## 5. Common Patterns
- State and Domain
  - DataService is an in-memory repository using Signals: CRUD methods create*/update*/delete* with cascade handling and activity logging
  - Computed getters (allX) expose read-only state to consumers
  - Permission enforcement lives in AuthService and is called from DataService before mutations
  - Activity logging funnels through AuthService.logActivity; entity types are union-limited in ActivityLog
- Navigation
  - NavigationService holds a currentView union and related selected IDs; components trigger navigation by calling service methods
  - Root app uses @switch on currentView to render the active standalone component
- Theming & Design System
  - ThemeService orchestrates light/dark via documentElement class and CSS custom properties
  - styles.css defines tokens: colors, shadows, typography, utilities, a11y, responsive
- UI & Templates
  - Template control flow (@if/@for/@switch) and co-located component styles promote cohesion
  - Components commonly expose service instances as public for template binding
  - Use of track expressions in @for and lightweight state in components
- Adding a new entity (recommended steps)
  1) Define interfaces in models/*
  2) Add state signals and CRUD API in DataService (and logging where appropriate)
  3) Extend ActivityLog['entityType'] if logging the new entity
  4) Add permissions to AuthService and related can* helpers if gated
  5) Create standalone components; wire to NavigationService; expose in app.component navigation if user-facing
  6) Keep updates immutable and logged; respect permissions in service methods

## 6. Do's and Don'ts
- Do
  - Keep services cohesive; put domain logic in services, not components
  - Maintain strict typing and avoid any
  - Use Signals correctly: set/update/compute; avoid shared mutable references
  - Use track expressions in @for for performance
  - Wrap async behaviors in try/catch and surface user-facing errors via a centralized mechanism (to be introduced)
  - Keep templates accessible and responsive; leverage global design tokens
  - Co-locate specs with implementation when tests are added
- Don't
  - Mutate arrays/objects in place within signals (avoid push/splice on existing references)
  - Use alert/confirm in production code paths (replace with UI notifications and modal services)
  - Hardcode strings that belong in models/enums or constants
  - Bypass permission checks in services
  - Mix Router-based navigation ad hoc with the custom NavigationService without a clear migration plan

## 7. Tools & Dependencies
- Core
  - Angular 20 (standalone components, Signals), RxJS 7, TypeScript 5.8, zone.js
- Dev
  - @angular/cli, @angular/build; concurrently and json-server are available for potential local API mocking
- Running locally
  - npm install
  - npm run start (or npm run dev) -> ng serve
- Notes
  - HttpClient is provided but not used for persistence yet; DataService is in-memory
  - If adopting json-server for mock APIs, add scripts to start both dev server and mock API concurrently

## 8. Other Notes
- Architectural
  - No Angular Router: view orchestration uses NavigationService + @switch; if adding deep links or browser history, introduce Router and incrementally migrate
  - Signals are the primary state mechanism; if introducing Observables, interop carefully and avoid manual subscription leaks
  - Keep ActivityLog entityType union in sync when adding new domain entities
- Implementation
  - Favor small, focused components; keep domain operations in services
  - Reuse design tokens and utility classes from styles.css; respect dark/light themes
  - Maintain ID generation consistency (currently time + random base36)
  - When introducing persistence, replace mock initializers with Http calls and derive read-only state from server data; handle loading/error states explicitly
