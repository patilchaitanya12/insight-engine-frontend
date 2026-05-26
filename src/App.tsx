import { ThemeProvider } from "./context/ThemeContext";
import Dashboard from "./pages/Dashboard";
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  return (
    <ThemeProvider>
      <Dashboard />
      <Analytics />
    </ThemeProvider>
  );
}