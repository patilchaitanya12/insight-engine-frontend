import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
} from "@mui/material";
import api from "../services/api";
import type { QueryResponse } from "../types/query";

interface Props {
  datasetId: string;
  onResult: (data: QueryResponse) => void;
}

export default function QueryPanel({ datasetId, onResult }: Props) {
  const [question, setQuestion] = useState("");

  const handleQuery = async () => {
    const response = await api.post<QueryResponse>("/query/", {
      dataset_id: datasetId,
      question,
    });

    onResult(response.data);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Ask a Question
      </Typography>

      <Box display="flex" gap={2}>
        <TextField
          fullWidth
          label="Enter your question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Button variant="contained" onClick={handleQuery}>
          Run
        </Button>
      </Box>
    </Paper>
  );
}