import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import {
  HomePage,
  AddDishPage,
  EditDishPage,
  SuggestionPage,
  PlanPage,
  DayAssignmentPage,
  SettingsPage,
} from '@/pages';
import { ErrorBoundary, BottomNav } from '@/components/ui';

/**
 * Pages where the bottom nav should be hidden (forms, detail views)
 */
const HIDE_NAV_PATHS = ['/add', '/edit', '/plan/'];

/**
 * Layout wrapper that conditionally shows the bottom navigation
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
    </>
  );
}

/**
 * App - Root component with routing configuration.
 *
 * Wrapped in ErrorBoundary to catch and display errors gracefully.
 * Includes bottom navigation on main pages.
 *
 * Routes:
 * - "/" : HomePage (dish list and main actions)
 * - "/add" : AddDishPage (add new dish form)
 * - "/edit/:dishId" : EditDishPage (edit or delete existing dish)
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
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/add" element={<AddDishPage />} />
            <Route path="/edit/:dishId" element={<EditDishPage />} />
            <Route path="/suggest" element={<SuggestionPage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/plan/:planId" element={<PlanPage />} />
            <Route path="/plan/:planId/:date" element={<DayAssignmentPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
