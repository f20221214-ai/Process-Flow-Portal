import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Page Imports
import Dashboard from "./pages/dashboard";
import RequestList from "./pages/request-list";
import RequestForm from "./pages/request-form";
import RequestDetail from "./pages/request-detail";
import SessionsPage from "./pages/sessions";
import OutcomesPage from "./pages/outcomes";
import JiraInitiatives from "./pages/jira-initiatives";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  }
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/requests" component={RequestList} />
      <Route path="/requests/new" component={RequestForm} />
      <Route path="/requests/:id" component={RequestDetail} />
      <Route path="/jira" component={JiraInitiatives} />
      <Route path="/sessions" component={SessionsPage} />
      <Route path="/outcomes" component={OutcomesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;