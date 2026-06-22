import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ToastProvider } from './components/shared/Toast';
import { CommandCenterScreen } from './screens/CommandCenter';
import { CreateAgentScreen } from './screens/CreateAgent';
import { RunsScreen } from './screens/Runs';
import { DecisionsScreen } from './screens/Decisions';
import { PeopleScreen } from './screens/People';
import { OutcomesScreen } from './screens/Outcomes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10_000 },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<CommandCenterScreen />} />
              <Route path="create" element={<CreateAgentScreen />} />
              <Route path="runs" element={<RunsScreen />} />
              <Route path="decisions" element={<DecisionsScreen />} />
              <Route path="people" element={<PeopleScreen />} />
              <Route path="outcomes" element={<Navigate to="/outcomes/latest" replace />} />
              <Route path="outcomes/:runId" element={<OutcomesScreen />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
