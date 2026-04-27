import { createTheme } from "@mui/material/styles";

export const sleekTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#3b82f6", // Bright modern blue
    },
    background: {
      default: "#020617", // Deepest navy/black
      paper: "rgba(30, 41, 59, 0.7)", // Translucent slate for cards
    },
    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
    },
  },
  shape: {
    borderRadius: 16, // Softer, modern edges
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          padding: "10px 24px",
        },
      },
    },
  },
});