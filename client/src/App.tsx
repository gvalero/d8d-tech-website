import { Route, Router as WouterRouter, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Keep routes aligned with Vite's asset base on the custom domain.
const routerBase = import.meta.env.BASE_URL.replace(/\/$/, "");

function SiteRouter() {
  return (
    <WouterRouter base={routerBase}>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SiteRouter />
    </ErrorBoundary>
  );
}
