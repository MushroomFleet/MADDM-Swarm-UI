import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Loader2 } from 'lucide-react';
import { ensureBootstrapApproaches } from '@/core/bootstrap-approaches';

// Lazy load heavy components for better performance
const Chat = lazy(() => import('./pages/Chat'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const Tutorial = lazy(() => import('./pages/Tutorial'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

const App = () => {
  // Initialize bootstrap approaches on mount
  useEffect(() => {
    ensureBootstrapApproaches()
      .then(() => {
        console.log('✅ Bootstrap initialization complete');
      })
      .catch(err => {
        console.error('❌ Failed to initialize bootstrap approaches:', err);
        toast.error('Failed to initialize system', {
          description: err instanceof Error ? err.message : 'Database initialization failed',
          duration: 5000,
        });
      });
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Index />} />
            <Route 
              path="tutorial" 
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <Tutorial />
                </Suspense>
              } 
            />
            <Route 
              path="chat" 
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <Chat />
                </Suspense>
              } 
            />
            <Route 
              path="dashboard" 
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <Dashboard />
                </Suspense>
              } 
            />
            <Route 
              path="settings" 
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <Settings />
                </Suspense>
              } 
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

export default App;
