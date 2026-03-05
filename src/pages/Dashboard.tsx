import { Container, Typography, Box } from "@mui/material";
import { useState } from "react";
import UploadPanel from "../components/UploadPanel";
import QueryPanel from "../components/QueryPanel";
import chartRenderer from "../components/chartRenderer";
import DataTable from "../components/DataTable";
import InsightCard from "../components/InsightCard";
import type { QueryResponse } from "../types/query";

export default function Dashboard() {
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResponse | null>(null);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Insight Engine Dashboard
      </Typography>

      <UploadPanel onUploadSuccess={setDatasetId} />

      {datasetId && (
        <Box mt={4}>
          <QueryPanel datasetId={datasetId} onResult={setResult} />
        </Box>
      )}

      {result && (
        <Box mt={4} display="flex" flexDirection="column" gap={4}>
          {chartRenderer({ table: result.table, chart: result.chart })}
          <DataTable table={result.table} />
          <InsightCard insights={result.insights} />
        </Box>
      )}
    </Container>
  );
}