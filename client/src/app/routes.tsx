import { createBrowserRouter } from 'react-router-dom';
import { Home } from '../pages/Home';
import { TaskPage } from '../pages/Task';
import { Report } from '../pages/Report';
import ProvenancePage from '../provenance/ProvenancePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/task/:id',
    element: <TaskPage />,
  },
  {
    path: '/task/:id/report',
    element: <Report />,
  },
  {
    path: '/provenance',
    element: <ProvenancePage />,
  },
]);
