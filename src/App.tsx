import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ScholarshipForm from "./pages/ScholarshipForm";
import SuccessPage from "./pages/SuccessPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import CheckStatus from "./pages/CheckStatus";
import ShortlinkRedirect from "./pages/ShortlinkRedirect";
import NotFound from "./pages/NotFound";
import PeraihBeasiswa from "./pages/PeraihBeasiswa";
import RegistrationForm from "./pages/RegistrationForm";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/beasiswa/:category" element={<ScholarshipForm />} />
          <Route path="/sukses" element={<SuccessPage />} />
          <Route path="/sukses/:category" element={<SuccessPage />} />
          <Route path="/cek-status" element={<CheckStatus />} />
          <Route path="/go/:slug" element={<ShortlinkRedirect />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/peraih-beasiswa" element={<PeraihBeasiswa />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
