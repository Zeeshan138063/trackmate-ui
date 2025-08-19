import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import Trackers from "./pages/Trackers";
import ResumeBuilder from "./pages/ResumeBuilder";
import InterviewPractice from "./pages/InterviewPractice";
import WorkStyles from "./pages/WorkStyles";
import JobSearch from "./pages/JobSearch";
import Support from "./pages/Support";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            <main className="flex-1 bg-background">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/trackers" element={<Trackers />} />
                <Route path="/resume" element={<ResumeBuilder />} />
                <Route path="/interview" element={<InterviewPractice />} />
                <Route path="/work-styles" element={<WorkStyles />} />
                <Route path="/job-search" element={<JobSearch />} />
                <Route path="/support" element={<Support />} />
                <Route path="/settings" element={<Settings />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
