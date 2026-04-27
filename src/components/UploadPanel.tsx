import { useState } from "react";
import { Box, Button, Typography, Paper, CircularProgress, Alert, useTheme } from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from "../services/api";

export default function UploadPanel({ onUploadSuccess }: any) {
  const [file, setFile] = useState<File | null>(null);
  const theme = useTheme();
  const mode = theme.palette.mode;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/upload/", formData);
      onUploadSuccess(response.data.dataset_id, response.data.suggested_questions || []);
    } catch (err) {
      setError("Analysis failed. Please check your file format.");
    } finally {
      setLoading(false);
    }
  };

  // Inside UploadPanel.tsx
  return (
    <Paper
      elevation={mode === 'dark' ? 0 : 2}
      sx={{
        p: 5,
        borderRadius: 8,
        textAlign: "center",
        width: 450,
        mx: "auto",
        bgcolor: "background.paper", // Automatically switches
        border: "1px solid",
        borderColor: "divider",     // Soft border that changes per theme
        backdropFilter: "blur(10px)", // Subtle glass effect
      }}
    >
      <Box sx={{ mb: 3, color: "primary.main" }}>
        <CloudUploadIcon sx={{ fontSize: 60 }} />
      </Box>
      
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: "text.primary" }}>
        Import Dataset
      </Typography>
      
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
        Upload your CSV or Excel file to start generating insights.
      </Typography>
  
      <Box sx={{ mb: 4 }}>
        {/* FIXED: Added display: "none" to remove that vertical line and default text */}
        <input
          type="file"
          id="file-upload"
          style={{ display: "none" }} 
          accept=".csv,.xlsx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <label htmlFor="file-upload">
          <Button 
            component="span" 
            variant="outlined" 
            sx={{ 
              color: file ? "primary.main" : "text.primary", // Blue text if file selected
              borderColor: file ? "primary.main" : "divider",
              bgcolor: file 
                ? (mode === 'dark' ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)") 
                : "transparent",
              textTransform: "none", 
              width: "100%", 
              py: 1.5, 
              borderRadius: 3,
            }}
          >
            {file ? file.name : "Select File"}
          </Button>
        </label>
      </Box>
  
      <Button
        fullWidth
        variant="contained"
        disabled={!file || loading}
        onClick={handleUpload}
        sx={{
          py: 2, 
          borderRadius: 3, 
          fontWeight: 600, 
          textTransform: "none",
          // Use slightly brighter colors for the gradient in dark mode
          background: mode === 'dark' 
            ? "linear-gradient(45deg, #3b82f6, #8b5cf6)" 
            : "linear-gradient(45deg, #2563eb, #7c3aed)",
          color: "white",
          boxShadow: mode === 'dark' ? "0 4px 20px rgba(59, 130, 246, 0.4)" : "none",
          '&:hover': {
            background: mode === 'dark' 
              ? "linear-gradient(45deg, #60a5fa, #a78bfa)" 
              : "linear-gradient(45deg, #1d4ed8, #6d28d9)",
          }
        }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Analyze Data"}
      </Button>
      
      {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
    </Paper>
  );
}