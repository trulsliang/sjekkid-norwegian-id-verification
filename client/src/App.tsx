import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import LoadingPage from "@/pages/loading";
import SplashPage from "@/pages/splash";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminOrganizations from "@/pages/admin-organizations";
import AdminUsers from "@/pages/admin-users";
import AdminReports from "@/pages/admin-reports";
import Scanning from "@/pages/scanning";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/loading" component={LoadingPage} />
      <Route path="/" component={AdminLogin} />
      <Route path="/demo" component={Home} />
      <Route path="/login" component={AdminLogin} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/organizations" component={AdminOrganizations} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/scanning" component={Scanning} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
