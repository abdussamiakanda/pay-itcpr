import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Travel from './pages/Travel';
import Scholarships from './pages/Scholarships';
import LoadingOverlay from './components/LoadingOverlay';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-main)',
            color: 'var(--text-dark)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'white',
            },
          },
        }}
      />
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        {!user ? (
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/payment" replace />} />
              <Route path="/payment" element={<Dashboard />} />
              <Route path="/travel" element={<Travel />} />
              <Route path="/scholarships" element={<Scholarships />} />
              <Route path="*" element={<Navigate to="/payment" replace />} />
            </Routes>
          </Layout>
        )}
      </Router>
    </>
  );
}

export default App;
