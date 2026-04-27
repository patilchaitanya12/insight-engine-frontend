import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Chip, 
  Stack, 
  Button, 
  Fade, 
  useTheme 
} from "@mui/material";
import { useState } from "react";
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import UploadPanel from "../components/UploadPanel";
import QueryPanel from "../components/QueryPanel";
import ChartRenderer from "../components/chartRenderer";
import DataTable from "../components/DataTable";
import InsightCard from "../components/InsightCard";
import MetricCards from "../components/MetricCards";
import QueryHistory from "../components/QueryHistory";

import type { QueryResponse } from "../types/query";

export default function Dashboard() {
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [query, setQuery] = useState<string>("");

  // FIX: Access the theme mode to prevent ReferenceError
  const theme = useTheme();
  const mode = theme.palette.mode;

  const handleUploadSuccess = (id: string, suggested: string[]) => {
    setDatasetId(id);
    setSuggestions(suggested);
    setResult(null);
    setHistory([]);
    setQuery("");
  };

  const handleResult = (res: QueryResponse, q?: string) => {
    setResult(res);
    if (q) {
      setHistory((prev) => [q, ...prev.slice(0, 5)]);
    }
  };

  const handleSuggestionClick = (q: string) => {
    setQuery(q);
  };

  const handleReset = () => {
    setDatasetId(null);
    setResult(null);
    setHistory([]);
    setSuggestions([]);
    setQuery("");
  };

  return (
    <Box sx={{ 
      width: "100%", 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column",
      bgcolor: "background.default",
      transition: "background-color 0.3s ease",
      overflowX: "hidden" 
    }}>
      <Container 
        maxWidth={false} 
        disableGutters 
        sx={{ 
          flexGrow: 1, 
          display: "flex", 
          flexDirection: "column",
          width: "100%"
        }}
      >
        {!datasetId ? (
          /* --- LANDING STATE (NO DATA) --- */
          <Box sx={{ 
            flexGrow: 1, 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "center", 
            alignItems: "center",
            width: "100%",
            px: 3 
          }}>
            <Box sx={{ textAlign: "center", mb: 6, width: "100%" }}>
              <Typography variant="h2" fontWeight={800} sx={{ 
                background: mode === 'dark' 
                  ? "linear-gradient(90deg, #60a5fa, #c084fc)" 
                  : "linear-gradient(90deg, #2563eb, #9333ea)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 1,
              }}>
                Insight Engine
              </Typography>
              <Typography variant="body1" sx={{ 
                color: "text.secondary", 
                fontSize: "1.1rem",
                fontWeight: 500 
              }}>
                Transform raw data into visual intelligence.
              </Typography>
            </Box>

            <Fade in timeout={800}>
              <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
                <UploadPanel onUploadSuccess={handleUploadSuccess} />
              </Box>
            </Fade>

            <Box sx={{ flexGrow: 0.3 }} /> 
          </Box>
        ) : (
          /* --- DASHBOARD STATE (DATA LOADED) --- */
          <Container maxWidth="xl" sx={{ py: 6 }}>
            <Stack spacing={4} sx={{ width: "100%" }}>
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography 
                  variant="h3" 
                  fontWeight={800} 
                  sx={{ 
                    background: mode === 'dark' 
                      ? "linear-gradient(90deg, #60a5fa, #c084fc)" 
                      : "linear-gradient(90deg, #2563eb, #9333ea)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Insight Engine
                </Typography>
                <Button 
                  startIcon={<RestartAltIcon />} 
                  onClick={handleReset}
                  sx={{ mt: 1, textTransform: "none", color: "text.secondary" }}
                >
                  Upload Different Dataset
                </Button>
              </Box>

              <QueryPanel 
                datasetId={datasetId} 
                onResult={handleResult} 
                query={query} 
                setQuery={setQuery} 
              />
              
              {suggestions.length > 0 && (
                <Paper elevation={0} sx={{ 
                  p: 3, 
                  borderRadius: 4, 
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider"
                }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: "text.primary" }}>
                    Suggested Questions
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {suggestions.map((q, i) => (
                      <Chip
                        key={i}
                        label={q}
                        clickable
                        onClick={() => handleSuggestionClick(q)}
                        sx={{ borderRadius: 2 }}
                      />
                    ))}
                  </Box>
                </Paper>
              )}

              {result && (
                <Grid container spacing={4}>
                  <Grid item xs={12} md={9}>
                    <MetricCards 
                      rows={result.table.data} 
                      xColumn={result.chart.x_column} 
                      yColumn={result.chart.y_column} 
                    />
                    <ChartRenderer table={result.table} chart={result.chart} />
                    <InsightCard insights={result.insights} />
                    <DataTable table={result.table} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <QueryHistory history={history} />
                  </Grid>
                </Grid>
              )}
            </Stack>
          </Container>
        )}
      </Container>
    </Box>
  );
}