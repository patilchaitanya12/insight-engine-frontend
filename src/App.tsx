import { ThemeProvider, createTheme, CssBaseline, Box, IconButton } from "@mui/material";
import { useState, useMemo } from "react";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { 
        main: "#3b82f6", // Vibrant Blue
        light: "#60a5fa",
        dark: "#1d4ed8",
      },
      background: {
        // Deep slate for dark, soft grey-blue for light
        default: mode === 'dark' ? "#020617" : "#f8fafc", 
        // Slightly lighter slate for cards
        paper: mode === 'dark' ? "#0f172a" : "#ffffff",
      },
      text: {
        primary: mode === 'dark' ? "#f8fafc" : "#0f172a",
        secondary: mode === 'dark' ? "#94a3b8" : "#64748b",
      },
      divider: mode === 'dark' ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
    },
    shape: { borderRadius: 16 },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none", // Removes the default MUI grey overlay in dark mode
          },
        },
      },
    },
  }), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* This Box ensures the entire app starts from the very edge of the screen */}
      <Box sx={{ 
        width: "100vw", 
        minHeight: "100vh", 
        m: 0, 
        p: 0, 
        bgcolor: "background.default",
        overflowX: "hidden"
      }}>
        <Box sx={{ 
          position: 'fixed', top: 20, right: 20, zIndex: 2000,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "50%",
          boxShadow: 3
        }}>
          <IconButton onClick={() => setMode(prev => prev === 'light' ? 'dark' : 'light')} color="primary">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
        <Dashboard />
      </Box>
    </ThemeProvider>
  );
}