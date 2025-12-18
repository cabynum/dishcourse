import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  HomePage,
  AddDishPage,
  EditDishPage,
  SuggestionPage,
  PlanPage,
  DayAssignmentPage,
  SettingsPage,
} from '@/pages';

/**
 * App - Root component with routing configuration.
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
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
