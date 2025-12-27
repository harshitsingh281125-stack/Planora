import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Dashboard from './screens/Dashboard';
import TripPage from './screens/TripPage';

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Dashboard />,
      errorElement: <div>Error</div>,
    },
    {
      path: "/trip/:tripId",
      element: <TripPage/>,
    }
  ]);
  return <RouterProvider router={router} />;
}

export default App;
