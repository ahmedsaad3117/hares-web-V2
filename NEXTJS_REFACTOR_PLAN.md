# Q1KEY Frontend Refactor Plan: Vanilla HTML/CSS/JS to Next.js

This document is the migration plan for refactoring the current `hares-web-V2` frontend into a maintainable Next.js application.

The current frontend is a static multi-page app built with:

- HTML pages in `pages/`
- Shared JavaScript in `js/`
- Shared injected components in `components/`
- Global styles in `css/styles.css`, `css/rtl.css`, and `css/homepage.css`
- Translation JSON files in `i18n/ar.json` and `i18n/en.json`
- Backend API calls through `js/api.js`

The goal is not to rewrite everything blindly. The safest path is to migrate in phases, keeping the backend API unchanged at first, preserving behavior, and improving structure step by step.

---

## 1. Migration Goals

### Main goals

- Move the frontend to Next.js with App Router.
- Convert each HTML page into a real route.
- Replace inline page scripts with React components and hooks.
- Replace manually injected `sidebar.js` and `header.js` with reusable layout components.
- Centralize API access, authentication, permissions, theme, language, and error handling.
- Keep the existing Q1KEY colors, landing-page style, dark/light mode behavior, RTL support, and Arabic/English translations.
- Preserve all existing backend API endpoints initially.
- Make the UI responsive across all internal screens.
- Reduce repeated code across pages.
- Make future changes safer and easier.

### Non-goals for the first migration

- Do not rewrite the backend.
- Do not change database structure.
- Do not redesign every screen at once.
- Do not introduce server-side rendering for authenticated dashboards until auth is stable.
- Do not replace every style with Tailwind immediately unless the team chooses that direction.

---

## 2. Recommended Target Stack

Use this stack unless there is a strong reason to choose otherwise:

- Next.js App Router
- TypeScript
- React
- CSS Modules or Tailwind CSS
- React Hook Form for forms
- Zod for validation
- TanStack Query for API fetching/caching
- next-intl or a small custom i18n layer
- Zustand or React Context for lightweight UI/auth state
- ESLint + Prettier
- Playwright for end-to-end smoke tests

Recommended styling path:

1. Start by importing existing CSS variables and visual language.
2. Convert repeated UI patterns into components.
3. Later decide whether to keep CSS Modules or fully adopt Tailwind.

---

## 3. Current App Inventory

### Main public page

| Current file | Target route | Notes |
|---|---|---|
| `index.html` | `/` | Landing page + login/register/subscription modals |

### Authenticated pages

| Current file | Target route |
|---|---|
| `pages/dashboard.html` | `/dashboard` |
| `pages/my-subscription.html` | `/my-subscription` |
| `pages/branches.html` | `/branches` |
| `pages/branches-new.html` | `/branches/new` |
| `pages/branches-edit.html` | `/branches/[id]/edit` |
| `pages/branches-view.html` | `/branches/[id]` |
| `pages/customers.html` | `/customers` |
| `pages/customers-new.html` | `/customers/new` |
| `pages/customers-edit.html` | `/customers/[id]/edit` |
| `pages/customers-view.html` | `/customers/[id]` |
| `pages/customers-deleted.html` | `/customers/deleted` |
| `pages/loans.html` | `/loans` |
| `pages/loans-new.html` | `/loans/new` |
| `pages/loans-edit.html` | `/loans/[id]/edit` |
| `pages/loans-view.html` | `/loans/[id]` |
| `pages/installments.html` | `/installments` |
| `pages/installments-view.html` | `/installments/[id]` |
| `pages/cashbox.html` | `/cashbox` |
| `pages/reports.html` | `/reports` |
| `pages/comparisons.html` | `/comparisons` |
| `pages/products.html` | `/products` |
| `pages/products-new.html` | `/products/new` |
| `pages/products-edit.html` | `/products/[id]/edit` |
| `pages/products-view.html` | `/products/[id]` |
| `pages/institutions.html` | `/institutions` |
| `pages/institutions-new.html` | `/institutions/new` |
| `pages/institutions-edit.html` | `/institutions/[id]/edit` |
| `pages/institutions-view.html` | `/institutions/[id]` |
| `pages/users.html` | `/users` |
| `pages/users-new.html` | `/users/new` |
| `pages/users-edit.html` | `/users/[id]/edit` |
| `pages/users-view.html` | `/users/[id]` |
| `pages/subscriptions.html` | `/subscriptions` |
| `pages/requests.html` | `/requests` |
| `pages/search-logs.html` | `/search-logs` |
| `pages/tools.html` | `/tools` |

### Review before migrating

These look like old or alternate dashboard experiments and should be reviewed before migration:

| Current file | Recommendation |
|---|---|
| `pages/dashboard-advanced.html` | Decide whether to delete, archive, or merge |
| `pages/dashboard-new.html` | Decide whether to delete, archive, or merge |
| `pages/dashboard-simple.html` | Decide whether to delete, archive, or merge |
| `backups_before_flicker_fix/` | Keep outside the Next.js app or move to documentation/archive |
| `tools/` | Keep as migration utilities, not runtime code |

---

## 4. Proposed Next.js Folder Structure

```txt
q1key-next/
  app/
    layout.tsx
    page.tsx
    globals.css

    (public)/
      layout.tsx

    (auth)/
      layout.tsx
      dashboard/
        page.tsx
      my-subscription/
        page.tsx
      customers/
        page.tsx
        new/
          page.tsx
        deleted/
          page.tsx
        [id]/
          page.tsx
          edit/
            page.tsx
      loans/
        page.tsx
        new/
          page.tsx
        [id]/
          page.tsx
          edit/
            page.tsx
      installments/
        page.tsx
        [id]/
          page.tsx
      branches/
        page.tsx
        new/
          page.tsx
        [id]/
          page.tsx
          edit/
            page.tsx
      institutions/
        page.tsx
        new/
          page.tsx
        [id]/
          page.tsx
          edit/
            page.tsx
      products/
        page.tsx
        new/
          page.tsx
        [id]/
          page.tsx
          edit/
            page.tsx
      users/
        page.tsx
        new/
          page.tsx
        [id]/
          page.tsx
          edit/
            page.tsx
      cashbox/
        page.tsx
      reports/
        page.tsx
      comparisons/
        page.tsx
      subscriptions/
        page.tsx
      requests/
        page.tsx
      search-logs/
        page.tsx
      tools/
        page.tsx

  components/
    layout/
      AppShell.tsx
      Sidebar.tsx
      Header.tsx
      MobileNav.tsx
    ui/
      Button.tsx
      Card.tsx
      Modal.tsx
      ConfirmDialog.tsx
      ToastProvider.tsx
      Input.tsx
      Select.tsx
      DateInput.tsx
      Badge.tsx
      Table.tsx
      Pagination.tsx
      EmptyState.tsx
      Skeleton.tsx
    landing/
      LandingHeader.tsx
      HeroSection.tsx
      AudienceSection.tsx
      WorkflowSection.tsx
      FeaturesSection.tsx
      PlansSection.tsx
      Footer.tsx
    dashboard/
      StatsGrid.tsx
      InstallmentsReportCard.tsx
      QuickActions.tsx
      RecentActivity.tsx

  features/
    auth/
      api.ts
      hooks.ts
      types.ts
      AuthProvider.tsx
    customers/
      api.ts
      components/
      hooks.ts
      schemas.ts
      types.ts
    loans/
      api.ts
      components/
      hooks.ts
      schemas.ts
      types.ts
    installments/
    branches/
    institutions/
    products/
    users/
    reports/
    subscriptions/
    announcements/
    homepage/

  lib/
    api/
      client.ts
      errors.ts
      endpoints.ts
    auth/
      storage.ts
      permissions.ts
      guards.ts
    i18n/
      dictionaries.ts
      useTranslations.ts
    theme/
      ThemeProvider.tsx
    utils/
      currency.ts
      dates.ts
      numbers.ts
      query.ts

  messages/
    ar.json
    en.json

  public/
    logo.png
    logo2.png
    logo3.png
    rayal.svg
    img/

  middleware.ts
  next.config.ts
  package.json
  tsconfig.json
```

---

## 5. Migration Strategy

Use an incremental migration. Do not attempt all pages in one large rewrite.

### Phase 0: Preparation

1. Create a new branch:

   ```bash
   git checkout -b refactor/nextjs-frontend
   ```

2. Freeze current behavior:

   - List all pages.
   - Record key user flows.
   - Capture screenshots for light mode and dark mode.
   - Capture Arabic and English layouts.
   - Capture Super Admin, Institution, and Branch user flows.

3. Define acceptance criteria:

   - Login works.
   - Logout works.
   - Sidebar appears for all roles.
   - Expired subscription restrictions work.
   - Theme toggle works on all pages.
   - Arabic RTL and English LTR both work.
   - All migrated routes call the same backend endpoints.
   - No raw JavaScript errors in console.

4. Decide migration mode:

   Preferred mode: create the Next.js app beside the current static app, then replace the old app when stable.

---

## 6. Phase 1: Scaffold Next.js

1. Create a new Next.js app folder:

   ```bash
   npx create-next-app@latest q1key-next
   ```

2. Recommended setup answers:

   - TypeScript: yes
   - App Router: yes
   - ESLint: yes
   - Tailwind: optional
   - `src/` directory: optional, but recommended if the team prefers it

3. Copy static assets:

   - `logo.png`
   - `logo2.png`
   - `logo3.png`
   - `rayal.svg`
   - `img/`

   Target:

   ```txt
   q1key-next/public/
   ```

4. Copy translation JSON files:

   ```txt
   i18n/ar.json -> q1key-next/messages/ar.json
   i18n/en.json -> q1key-next/messages/en.json
   ```

5. Copy CSS variables and base styles:

   - Start from `css/styles.css`
   - Move design tokens into `app/globals.css`
   - Move landing styles gradually into components or CSS modules

---

## 7. Phase 2: Core Infrastructure

### 7.1 Environment configuration

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

Create `lib/api/client.ts`:

- Base URL from `NEXT_PUBLIC_API_BASE_URL`
- Request timeout
- Bearer token support
- JSON parsing
- API error normalization
- 401 handling
- Request deduplication if still needed

### 7.2 Auth storage

Current app uses:

- `localStorage.token`
- `localStorage.refresh_token`
- `localStorage.user`

Initial Next.js migration can keep this on the client side to avoid backend changes.

Create:

```txt
lib/auth/storage.ts
lib/auth/permissions.ts
features/auth/AuthProvider.tsx
```

The provider should expose:

- `user`
- `token`
- `isAuthenticated`
- `login()`
- `logout()`
- `refreshProfile()`
- `isLoading`

### 7.3 Route protection

Start with client-side protection:

- `(auth)/layout.tsx` checks auth state.
- If no token, redirect to `/`.
- If subscription expired and user is not Super Admin, redirect or restrict links based on current rules.

Later improvement:

- Move auth token to secure HTTP-only cookies.
- Add `middleware.ts` route protection.

### 7.4 Role and permission helpers

Move current role normalization from `js/api.js` and `components/sidebar.js` into:

```txt
lib/auth/permissions.ts
```

Required helpers:

- `getUserRoleName(user)`
- `isSuperAdminUser(user)`
- `isInstitutionUser(user)`
- `isBranchUser(user)`
- `isSubscriptionExpired(date)`
- `canAccessRoute(user, route)`
- `getAllowedNavigationItems(user)`

This is critical because the current code has duplicated role checks in multiple files.

---

## 8. Phase 3: Layout Components

### 8.1 App shell

Create:

```txt
components/layout/AppShell.tsx
components/layout/Sidebar.tsx
components/layout/Header.tsx
```

`AppShell` should wrap all authenticated pages:

```tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="page-content">{children}</div>
      </main>
    </>
  );
}
```

### 8.2 Sidebar migration

Replace `components/sidebar.js` with a React component.

Must preserve:

- Q1KEY logo
- Role-based navigation
- Super Admin links
- Institution links
- Branch links
- Subscription expired lock state
- My subscription link
- Help/support link
- Mobile close/open behavior
- Better visible font and hover styles from the current CSS

### 8.3 Header migration

Replace `components/header.js` with:

- Page title
- User avatar/name
- Institution/branch context
- Language switcher
- Theme toggle
- Logout button
- Mobile sidebar toggle

Important:

- `toggleTheme` should no longer be a global function.
- Use React state through `ThemeProvider`.

---

## 9. Phase 4: Design System

Create reusable UI components before migrating all pages.

Minimum components:

- `Button`
- `Input`
- `Select`
- `DateInput`
- `Card`
- `Modal`
- `ConfirmDialog`
- `ToastProvider`
- `Badge`
- `Table`
- `Pagination`
- `Skeleton`
- `EmptyState`
- `PageHeader`
- `StatCard`

### Styling approach

Recommended first step:

- Keep global CSS variables.
- Convert repeated classes into component classes.
- Use CSS Modules for new components.

Example design tokens to preserve:

- Primary blue: current Q1KEY landing blue
- Navy sidebar background
- White/light card background
- Soft blue surfaces
- Green success
- Red danger
- Amber warning
- Dark-mode surface/text tokens

### Theme requirements

Both modes must be checked for:

- Sidebar
- Header
- Tables
- Modals
- Confirm dialogs
- Toasts
- Forms
- Dropdown menus
- Date inputs
- Cards
- Empty states
- Locked/expired subscription UI

---

## 10. Phase 5: i18n and RTL

### Current state

Current app uses:

- `js/i18n.js`
- `i18n/ar.json`
- `i18n/en.json`
- `data-i18n-key` attributes
- `localStorage.locale`
- `html dir="rtl"` for Arabic

### Target state

Create:

```txt
lib/i18n/dictionaries.ts
lib/i18n/useTranslations.ts
components/providers/I18nProvider.tsx
```

Requirements:

- Arabic default.
- English supported.
- Persist locale in localStorage.
- Set `<html lang>` and `<html dir>` correctly.
- Avoid RTL/LTR flicker.
- Replace `data-i18n-key` with `t('key.path')`.
- Support dynamic translation values.

Example:

```tsx
const t = useTranslations();

return <h1>{t('navigation.dashboard')}</h1>;
```

Migration rule:

- Do not translate strings manually inside components.
- Every visible label should use translation keys.

---

## 11. Phase 6: API Layer Migration

Split `js/api.js` into feature-specific API modules.

### Current API areas

From `js/api.js`, migrate these into separate modules:

```txt
features/auth/api.ts
features/users/api.ts
features/institutions/api.ts
features/branches/api.ts
features/customers/api.ts
features/products/api.ts
features/loans/api.ts
features/installments/api.ts
features/searchLogs/api.ts
features/customerNotes/api.ts
features/cashbox/api.ts
features/reports/api.ts
features/settings/api.ts
features/subscriptions/api.ts
features/announcements/api.ts
features/homepage/api.ts
features/quickLinks/api.ts
```

### API client rules

Every API function should:

- Return typed data.
- Throw normalized errors.
- Not manipulate DOM.
- Not show toast directly unless explicitly handled by UI layer.
- Not redirect directly except auth layer on 401.

### Recommended hook pattern

Use TanStack Query:

```tsx
export function useCustomers(params: CustomerFilters) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customersApi.getAll(params),
  });
}
```

Use mutations:

```tsx
export function useDeleteLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loansApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });
}
```

---

## 12. Phase 7: Landing Page Migration

Target route:

```txt
app/page.tsx
```

Break current `index.html`, `css/homepage.css`, and `js/homepage.js` into:

```txt
components/landing/LandingHeader.tsx
components/landing/HeroSection.tsx
components/landing/AudienceSection.tsx
components/landing/WorkflowSection.tsx
components/landing/FeaturesSection.tsx
components/landing/PlansSection.tsx
components/landing/AboutSection.tsx
components/landing/ComparisonSection.tsx
components/landing/ClosingCta.tsx
components/landing/Footer.tsx
features/homepage/api.ts
features/subscriptions/api.ts
```

Keep:

- Same main colors.
- Same Q1KEY logo.
- Same two-column card grids recently requested.
- Login modal.
- Subscribe modal.
- Bank transfer/WhatsApp flow.
- Dynamic homepage settings from API.
- Dynamic active subscription plans.

Migration order:

1. Static landing markup.
2. Styling.
3. Language switcher.
4. Login modal.
5. Subscription plans.
6. Subscribe request flow.
7. Final responsive review.

---

## 13. Phase 8: Dashboard Migration

Target route:

```txt
app/(auth)/dashboard/page.tsx
```

Break current `pages/dashboard.html` into:

```txt
features/dashboard/api.ts
components/dashboard/StatsGrid.tsx
components/dashboard/InstallmentsReportCard.tsx
components/dashboard/QuickActions.tsx
components/dashboard/RecentActivity.tsx
components/dashboard/PrintDashboardButton.tsx
```

Must preserve:

- Super Admin global stats.
- Institution stats.
- Branch stats.
- Installments report filters.
- Quick actions by role.
- Recent activity.
- Print dashboard.

Important improvement:

- Remove inline script print logic.
- Implement print using React-safe window/document logic or CSS `@media print`.

Acceptance test:

- Login as Super Admin and sidebar appears.
- Dashboard stats appear.
- No skeleton cards remain after API response.
- No visible raw JavaScript text appears at page bottom.

---

## 14. Phase 9: CRUD Module Migration

Migrate modules in this order:

### 9.1 Customers

Routes:

- `/customers`
- `/customers/new`
- `/customers/[id]`
- `/customers/[id]/edit`
- `/customers/deleted`

Components:

- `CustomerTable`
- `CustomerForm`
- `CustomerDetails`
- `CustomerFilters`
- `CustomerLoansHistory`
- `CustomerNotes`

Important behavior:

- Deleted loans should remain in customer loan history with status `Deleted`.
- Do not remove historical records from the customer page.

### 9.2 Loans

Routes:

- `/loans`
- `/loans/new`
- `/loans/[id]`
- `/loans/[id]/edit`

Components:

- `LoanTable`
- `LoanForm`
- `LoanDetails`
- `LoanStatusBadge`
- `InstallmentSchedule`

Important behavior:

- Loan delete should be soft-delete if backend supports it.
- Deleted status should display clearly.
- Loan filters should include active/deleted/late/completed where needed.

### 9.3 Installments

Routes:

- `/installments`
- `/installments/[id]`

Components:

- `InstallmentsTable`
- `InstallmentPaymentModal`
- `InstallmentStatusBadge`
- `InstallmentFilters`

### 9.4 Branches

Routes:

- `/branches`
- `/branches/new`
- `/branches/[id]`
- `/branches/[id]/edit`

### 9.5 Institutions

Routes:

- `/institutions`
- `/institutions/new`
- `/institutions/[id]`
- `/institutions/[id]/edit`

Super Admin only.

### 9.6 Products

Routes:

- `/products`
- `/products/new`
- `/products/[id]`
- `/products/[id]/edit`

Super Admin only unless current business rules allow more roles.

### 9.7 Users

Routes:

- `/users`
- `/users/new`
- `/users/[id]`
- `/users/[id]/edit`

Super Admin only.

### 9.8 Remaining modules

Routes:

- `/cashbox`
- `/reports`
- `/comparisons`
- `/subscriptions`
- `/requests`
- `/search-logs`
- `/tools`
- `/my-subscription`

Migrate after the main CRUD flows are stable.

---

## 15. Phase 10: Forms and Validation

Replace manual form handling with:

- React Hook Form
- Zod schemas
- Shared form components
- API mutation hooks

For every form:

- Validate required fields.
- Validate numbers.
- Validate dates.
- Show API errors clearly.
- Disable submit while saving.
- Preserve Arabic/English labels.
- Preserve dark/light readability.

Suggested files:

```txt
features/customers/schemas.ts
features/loans/schemas.ts
features/branches/schemas.ts
features/institutions/schemas.ts
features/products/schemas.ts
features/users/schemas.ts
```

---

## 16. Phase 11: Tables, Filters, and Pagination

Create one shared table system.

Components:

- `DataTable`
- `TableToolbar`
- `SearchInput`
- `FilterSelect`
- `DateRangeFilter`
- `Pagination`
- `TableSkeleton`
- `EmptyTableState`

Requirements:

- Mobile responsive.
- RTL friendly.
- Loading states.
- Empty states.
- Error states.
- Consistent action buttons.
- Consistent delete/restore confirmations.

---

## 17. Phase 12: Modals, Toasts, and Dialogs

Current issue history shows color problems in dark mode dialogs. In Next.js, centralize all overlay UI.

Create:

```txt
components/ui/Modal.tsx
components/ui/ConfirmDialog.tsx
components/ui/ToastProvider.tsx
components/ui/Alert.tsx
```

Rules:

- Never hard-code modal text color inline.
- Use design tokens.
- Test in light and dark modes.
- Support Arabic RTL and English LTR.
- Trap focus inside modal.
- Close with Escape.
- Confirm destructive actions clearly.

---

## 18. Phase 13: Theme System

Create:

```txt
lib/theme/ThemeProvider.tsx
```

Requirements:

- Theme values: `light`, `dark`
- Persist in localStorage.
- Apply theme to `document.documentElement`.
- No global `toggleTheme()` function.
- Header button calls React state.
- All pages use shared CSS tokens.

Example:

```tsx
const { theme, toggleTheme } = useTheme();
```

Dark mode audit checklist:

- Sidebar links
- Locked sidebar items
- Header dropdown
- Logout popup
- Cards
- Tables
- Inputs
- Date inputs
- Select menus
- Modals
- Toasts
- Empty states

---

## 19. Phase 14: Routing and Navigation

Replace direct `.html` links:

```html
customers-view.html?id=62
```

with Next.js routes:

```txt
/customers/62
```

Replace:

```html
loans-edit.html?id=12
```

with:

```txt
/loans/12/edit
```

Use:

```tsx
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
```

Route conversion examples:

| Current pattern | Next.js pattern |
|---|---|
| `customers-view.html?id=62` | `/customers/62` |
| `customers-edit.html?id=62` | `/customers/62/edit` |
| `loans-view.html?id=15` | `/loans/15` |
| `loans-edit.html?id=15` | `/loans/15/edit` |
| `branches-view.html?id=4` | `/branches/4` |
| `institutions-edit.html?id=2` | `/institutions/2/edit` |

---

## 20. Phase 15: Error Handling

Create a standard error system:

```txt
lib/api/errors.ts
components/ui/ErrorState.tsx
app/error.tsx
app/not-found.tsx
```

Handle:

- 400 validation errors
- 401 unauthorized
- 403 forbidden
- 404 not found
- 409 conflict
- 422 validation errors
- 500 server errors
- Network unavailable
- Timeout

Rules:

- API client normalizes errors.
- Pages display user-friendly messages.
- Console logs are for development only.
- Toasts are used for quick action feedback.
- Full-page error states are used for route-level failures.

---

## 21. Phase 16: Testing Plan

### Unit tests

Test helpers:

- Role normalization
- Subscription expiration logic
- Currency formatting
- Date formatting
- API error parsing
- Translation fallback

### Component tests

Test:

- Sidebar renders correct links by role.
- Header theme toggle works.
- Confirm dialog text is visible in both modes.
- Tables render loading/empty/error states.
- Forms show validation errors.

### End-to-end tests

Use Playwright.

Critical flows:

1. Login as Super Admin.
2. See dashboard/sidebar/stats.
3. Switch Arabic/English.
4. Switch dark/light mode.
5. Create customer.
6. Create loan.
7. Delete loan and verify customer history shows loan as `Deleted`.
8. Filter installments report.
9. Logout and confirm popup is readable in dark mode.
10. Expired subscription user sees locked navigation correctly.

---

## 22. Phase 17: Performance and UX

Improve:

- Route-level loading states.
- Skeletons only where useful.
- Query caching.
- Avoid duplicate API requests.
- Lazy-load heavy pages like reports.
- Use `next/image` for images where helpful.
- Avoid large global CSS where possible.
- Remove unused old scripts after migration.

---

## 23. Phase 18: Deployment Plan

### Development

Run backend:

```bash
cd ../hares-api-V2
npm run dev
```

Run Next.js:

```bash
cd ../q1key-next
npm run dev
```

### Production

Options:

1. Deploy Next.js as a separate frontend app.
2. Serve Next.js build behind the same domain as backend.
3. Proxy `/api` requests to the backend.

Required environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com/api
```

If moving auth to cookies later:

```env
AUTH_COOKIE_NAME=q1key_session
```

---

## 24. Suggested Migration Order

Use this exact order to reduce risk:

1. Scaffold Next.js.
2. Add global CSS variables and assets.
3. Build i18n provider.
4. Build theme provider.
5. Build API client.
6. Build auth provider.
7. Build protected app layout.
8. Build Sidebar and Header.
9. Migrate landing page.
10. Migrate login flow.
11. Migrate dashboard.
12. Migrate customers.
13. Migrate loans.
14. Migrate installments.
15. Migrate branches.
16. Migrate institutions.
17. Migrate products.
18. Migrate users.
19. Migrate reports/cashbox/comparisons.
20. Migrate subscriptions/requests/search logs/tools.
21. Add tests.
22. Run full light/dark + Arabic/English audit.
23. Remove old static files only after the Next.js app is accepted.

---

## 25. Page-by-Page Acceptance Checklist

For every migrated page:

- Page route works directly in browser refresh.
- Page route works through sidebar navigation.
- Loading state appears.
- Empty state appears.
- API error state appears.
- Arabic layout is RTL.
- English layout is LTR.
- Dark mode text is readable.
- Light mode text is readable.
- Mobile layout is usable.
- Role restrictions are correct.
- Expired subscription restrictions are correct.
- No console errors.
- No raw script text appears in UI.

---

## 26. Risk List

### Risk: Auth behavior changes

Mitigation:

- Keep localStorage token flow first.
- Move to cookies only after full migration.

### Risk: RTL bugs

Mitigation:

- Build RTL into layout from the start.
- Test every migrated page in Arabic.

### Risk: Sidebar role bugs

Mitigation:

- Centralize role normalization.
- Add tests for Super Admin, Institution, Branch.

### Risk: Dark mode text bugs

Mitigation:

- No inline hard-coded text colors in components.
- Use CSS variables.
- Add dark-mode visual checklist.

### Risk: Too much rewrite at once

Mitigation:

- Migrate one route group at a time.
- Keep backend unchanged.
- Keep old app available until Next.js app is ready.

---

## 27. Cleanup After Migration

After the Next.js app is stable:

- Remove old `pages/*.html`.
- Remove old `js/*.js` runtime scripts.
- Remove old `components/*.js` injected components.
- Keep migration tools only if useful.
- Move old static frontend to `archive/` if needed.
- Update README.
- Update start scripts.
- Update deployment documentation.

---

## 28. Definition of Done

The Next.js refactor is complete when:

- All current user-facing pages exist as Next.js routes.
- Login/logout works.
- Sidebar/header are React components.
- All role permissions match current behavior.
- Subscription expired behavior matches current behavior.
- Arabic and English work on all pages.
- Light and dark modes are readable on all components.
- Customer loan history keeps deleted loans with status `Deleted`.
- Dashboard works for Super Admin, Institution, and Branch accounts.
- Landing page matches the current approved Q1KEY style.
- No major console errors.
- Playwright smoke tests pass.
- Old static frontend can be retired safely.

