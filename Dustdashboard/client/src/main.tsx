import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import App from './App';
import Layout from './layouts/dashboard';
import OverviewPage from './pages/OverviewPage';
import AllPointPage from './pages/AllPointPage';
import ListViewPage from './pages/ListViewPage';
import MonthlyViewPage from './pages/MonthlyViewPage';
import RepeatPointPage from './pages/RepeatPointPage';
import NotFoundPage from './pages/NotFoundPage';
import RobotCommandPage from './pages/RobotCommandPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',
        element: <Layout />,
        children: [
          {
            path: 'RobotCommandPage',
            element: <RobotCommandPage />,
          },
          {
            path: '',
            element: <OverviewPage />,
          },
          {
            path: 'AllPointPage',
            element: <AllPointPage />,
          },
          {
            path: 'MonthlyViewPage',
            element: <MonthlyViewPage />,
          },
          {
            path: 'RepeatPointPage',
            element: <RepeatPointPage />,
          },
          {
            path: 'ListViewPage',
            element: <ListViewPage />,
          },
          {
            path: '*',
            element: <NotFoundPage />
          }
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
      <RouterProvider router={router} />
    </SnackbarProvider>
  </React.StrictMode>
);
