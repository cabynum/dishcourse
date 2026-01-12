import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import {
  HomePage,
  AddDishPage,
  AuthPage,
  EditDishPage,
  HouseholdCreatePage,
  HouseholdPage,
  JoinPage,
  ProposalsPage,
  SuggestionPage,
  PlanPage,
  DayAssignmentPage,
  SettingsPage,
} from '@/pages';
import { ErrorBoundary, BottomNav } from '@/components/ui';
import { AuthProvider } from '@/components/auth';
import { ConflictResolver } from '@/components/sync';
import { useConflicts } from '@/hooks';

/**
 * Pages where the bottom nav should be hidden (forms, detail views, auth, household)
 */
const HIDE_NAV_PATHS = ['/add', '/edit', '/plan/', '/auth', '/household', '/join'];

/**
 * Global conflict overlay that shows when sync conflicts are detected.
 * Uses the useConflicts hook to automatically respond to conflict changes.
 */
function ConflictOverlay() {
  const { conflicts, hasConflicts, resolveConflict } = useConflicts();

  if (!hasConflicts) return null;

  return (
    <ConflictResolver
      conflicts={conflicts}
      onResolve={resolveConflict}
    />
  );
}

/**
 * Layout wrapper that conditionally shows the bottom navigation
 * and handles global overlays like conflict resolution.
 */
function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  // Hide nav on form pages and detail views
  const showNav = !HIDE_NAV_PATHS.some((path) => 
    location.pathname.startsWith(path) && location.pathname !== '/plan'
  );

  return (
    <>
      {children}
      {showNav && <BottomNav />}
      <ConflictOverlay />
    </>
  );
}

/**
 * App - Root component with routing configuration.
 *
 * Wrapped in ErrorBoundary and AuthProvider for error handling and authentication.
 * Includes bottom navigation on main pages.
 *
 * Routes:
 * - "/" : HomePage (dish list and main actions)
 * - "/add" : AddDishPage (add new dish form)
 * - "/auth" : AuthPage (sign in / sign up)
 * - "/auth/verify" : AuthPage (magic link verification callback)
 * - "/edit/:dishId" : EditDishPage (edit or delete existing dish)
 * - "/household" : HouseholdPage (manage household and members)
 * - "/household/create" : HouseholdCreatePage (create new household)
 * - "/household/:householdId" : HouseholdPage (specific household settings)
 * - "/join/:code" : JoinPage (accept invite and join household)
 * - "/proposals" : ProposalsPage (view and vote on meal proposals)
 * - "/suggest" : SuggestionPage (get meal suggestions)
 * - "/plan" : PlanPage (create new meal plan)
 * - "/plan/:planId" : PlanPage (view/edit existing plan)
 * - "/plan/:planId/:date" : DayAssignmentPage (assign dishes to a day)
 * - "/settings" : SettingsPage (export/import data)
 */
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/add" element={<AddDishPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/verify" element={<AuthPage />} />
              <Route path="/edit/:dishId" element={<EditDishPage />} />
              <Route path="/household" element={<HouseholdPage />} />
              <Route path="/household/create" element={<HouseholdCreatePage />} />
              <Route path="/household/:householdId" element={<HouseholdPage />} />
              <Route path="/join/:code" element={<JoinPage />} />
              <Route path="/proposals" element={<ProposalsPage />} />
              <Route path="/suggest" element={<SuggestionPage />} />
              <Route path="/plan" element={<PlanPage />} />
              <Route path="/plan/:planId" element={<PlanPage />} />
              <Route path="/plan/:planId/:date" element={<DayAssignmentPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </AppLayout>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
