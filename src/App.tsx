import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AcademicProvider, useAcademic } from './context/AcademicContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Semesters } from './pages/Semesters';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { isFirebaseConfigured } from './firebase/firebase';
import { ShieldAlert, BookOpen, FileCode, CheckCircle } from 'lucide-react';

const FirebaseConfigOverlay: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 p-6">
      <div className="max-w-xl w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
            Firebase Configuration Required
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
            To enable database syncing, authentication, and calculations, configure your Firebase keys.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-primary" /> Setup Environment variables
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Create a file named <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">.env</code> in the root folder of GradeVault, copy the block below, and fill in your keys:
          </p>

          <pre className="p-4 rounded-xl bg-slate-900 text-slate-300 font-mono text-[10px] overflow-x-auto select-all leading-normal border border-slate-800">
{`VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id`}
          </pre>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Next steps:
          </h4>
          <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Save the <code className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 font-mono rounded">.env</code> file in your workspace directory.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Restart the development server using terminal command: <code className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 font-mono rounded">npm run dev</code>.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Reload this page in your browser.</span>
            </li>
          </ul>
        </div>

        <div className="text-center pt-2">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
            🎓 GradeVault Secure Academic Portal
          </p>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authLoading } = useAcademic();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-darkBg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase animate-pulse">
            Verifying Session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  if (!isFirebaseConfigured) {
    return <FirebaseConfigOverlay />;
  }

  return (
    <AcademicProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/semesters"
            element={
              <ProtectedRoute>
                <Semesters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AcademicProvider>
  );
}

export default App;
