import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/context/UserContext";
import { BookProvider } from "@/context/BookContext";
import { EnterpriseProvider } from "@/context/EnterpriseContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Index from "./pages/Index";
import Library from "./pages/Library";
import Reader from "./pages/Reader";
import AdminUpload from "./pages/AdminUpload";
import EnterpriseDashboard from "./pages/EnterpriseDashboard";
import ComplianceCollections from "./pages/ComplianceCollections";
import CollectionDetail from "./pages/CollectionDetail";
import AuditLogs from "./pages/AuditLogs";
import CounterReporting from "./pages/CounterReporting";
import Auth from "./pages/Auth";
import Accessibility from "./pages/Accessibility";
import RepositoryOverview from "./pages/RepositoryOverview";
import InstitutionalPricing from "./pages/InstitutionalPricing";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BookProvider>
      <EnterpriseProvider>
        <UserProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1" id="main-content">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="/reader" element={<Reader />} />
                    <Route path="/admin/upload" element={<ProtectedRoute><AdminUpload /></ProtectedRoute>} />
                    <Route path="/admin/repository" element={<ProtectedRoute><RepositoryOverview /></ProtectedRoute>} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/enterprise" element={<EnterpriseDashboard />} />
                    <Route path="/collections" element={<ComplianceCollections />} />
                    <Route path="/collections/:collectionId" element={<CollectionDetail />} />
                    <Route path="/audit-logs" element={<AuditLogs />} />
                    <Route path="/counter-reports" element={<CounterReporting />} />
                    <Route path="/accessibility" element={<Accessibility />} />
                    <Route path="/subscribe" element={<InstitutionalPricing />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </UserProvider>
      </EnterpriseProvider>
    </BookProvider>
  </QueryClientProvider>
);

export default App;
