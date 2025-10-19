import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { TopNav } from '../components/TopNav';
import { ToastContainer } from '../components/ToastContainer';

export function App() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main>
        <RouterProvider router={router} />
      </main>
      <ToastContainer />
    </div>
  );
}
