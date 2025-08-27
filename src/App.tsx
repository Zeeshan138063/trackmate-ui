
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
import Contacts from "./pages/Contacts";
import ResumeBuilder from "./pages/ResumeBuilder";
import ResumeLanding from "./pages/ResumeLanding";
import ResumeEditor from "./pages/ResumeEditor";
import InterviewPractice from "./pages/InterviewPractice";
import InterviewFeedback from "./pages/InterviewFeedback";
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
          <Route path="/contacts" element={
            <ProtectedRoute>
              <Layout>
                <Contacts />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/resume" element={
            <ProtectedRoute>
              <Layout>
                <ResumeLanding />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/resume/:id" element={
            <ProtectedRoute>
              <Layout>
                <ResumeEditor />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
