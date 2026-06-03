import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import HomePage from "./pages/HomePage";
import { SiteFooter } from "./components/SiteFooter";

const TutorialPage = lazy(() => import("./pages/TutorialPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600 dark:border-white/20 dark:border-t-indigo-400" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <div className="flex min-h-screen flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tutorial" element={<TutorialPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
        <SiteFooter />
      </div>
    </Suspense>
  );
}
