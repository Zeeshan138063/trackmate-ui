
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Trackers from "./pages/Trackers";
import ResumeBuilder from "./pages/ResumeBuilder";
import InterviewPractice from "./pages/InterviewPractice";
import InterviewFeedback from "./pages/InterviewFeedback";
import WorkStyles from "./pages/WorkStyles";
import JobSearch from "./pages/JobSearch";
import Support from "./pages/Support";
import Settings from "./pages/Settings";
import Connections from "./pages/Connections";
import GrowthDashboard from "./pages/Growth/Dashboard";
import DreamCompanies from "./pages/DreamCompanies";
import ApplicationCopilot from "./pages/ApplicationCopilot";

import NotFound from "./pages/NotFound";
import PublicJobDiscovery from "./pages/PublicJobDiscovery";
import JobDetails from "./pages/JobDetails";

const queryClient = new QueryClient();

import { ThemeProvider } from "@/components/theme-provider";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme" attribute="class">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Index />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/trackers" element={
              <ProtectedRoute>
                <Layout>
                  <Trackers />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/resume" element={
              <ProtectedRoute>
                <Layout>
                  <ResumeBuilder />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/interview" element={
              <ProtectedRoute>
                <Layout>
                  <InterviewPractice />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/interview-feedback" element={
              <ProtectedRoute>
                <Layout>
                  <InterviewFeedback />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/work-styles" element={
              <ProtectedRoute>
                <Layout>
                  <WorkStyles />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/job-search" element={
              <ProtectedRoute>
                <Layout>
                  <JobSearch />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/support" element={
              <ProtectedRoute>
                <Layout>
                  <Support />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/connections" element={
              <ProtectedRoute>
                <Layout>
                  <Connections />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/growth" element={
              <ProtectedRoute>
                <Layout>
                  <GrowthDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/dream-companies" element={
              <ProtectedRoute>
                <Layout>
                  <DreamCompanies />
                </Layout>
              </ProtectedRoute>
            } />
            {/* Public Job Discovery Routes */}
            <Route path="/jobs" element={<PublicJobDiscovery />} />
            <Route path="/jobs/:keyword" element={<PublicJobDiscovery />} />
            <Route path="/job-view/:jobId" element={<JobDetails />} />
            <Route path="/application-copilot" element={
              <ProtectedRoute>
                <Layout>
                  <ApplicationCopilot />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider >
);

export default App;
