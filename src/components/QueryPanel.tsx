import { Box, Button, TextField, Paper, InputAdornment, useTheme } from "@mui/material";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import api from "../services/api";

export default function QueryPanel({ datasetId, query, setQuery, onResult }: any) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleQuery = async () => {
    if (!query || !datasetId) return;
    try {
      const response = await api.post("/query/", {
        dataset_id: datasetId,
        question: query
      });
      onResult(response.data, query);
    } catch (error) {
      console.error("Query execution failed", error);
    }
  };

  return (
    <Paper elevation={0} sx={{
      p: 1, 
      borderRadius: 4,
      bgcolor: "background.paper",
      border: "1px solid",
      borderColor: "divider",
      boxShadow: isDark 
        ? "0 4px 20px rgba(0, 0, 0, 0.4)" 
        : "0 2px 12px rgba(0, 0, 0, 0.05)",
    }}>
      <Box display="flex" gap={1}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask a question about your data..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AutoAwesomeIcon sx={{ color: "primary.main" }} />
              </InputAdornment>
            ),
            sx: {
              color: "text.primary",
              borderRadius: 3,
              "& fieldset": { border: "none" },
              "& input::placeholder": { 
                color: "text.secondary", 
                opacity: 0.7 
              }
            }
          }}
        />
        <Button
          onClick={handleQuery}
          variant="contained"
          sx={{
            borderRadius: 3, 
            px: 4,
            background: isDark
              ? "linear-gradient(45deg, #3b82f6, #8b5cf6)"
              : "linear-gradient(45deg, #2563eb, #7c3aed)",
            textTransform: "none",
            fontWeight: 600,
            boxShadow: isDark ? "0 4px 15px rgba(59, 130, 246, 0.4)" : "none",
            "&:hover": { 
              background: isDark
                ? "linear-gradient(45deg, #60a5fa, #a78bfa)"
                : "linear-gradient(45deg, #1d4ed8, #6d28d9)",
            }
          }}
        >
          Run
        </Button>
      </Box>
    </Paper>
  );
}