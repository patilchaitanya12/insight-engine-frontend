import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
} from "@mui/material";
import api from "../services/api";

interface UploadResponse {
  dataset_id: string;
  columns: { column_name: string; dtype: string }[];
  message: string;
}

interface Props {
  onUploadSuccess: (datasetId: string) => void;
}

export default function UploadPanel({ onUploadSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post<UploadResponse>(
        "/upload/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess("Dataset uploaded successfully!");
      setError(null);

      onUploadSuccess(response.data.dataset_id);
    } catch (err: any) {
      setError("Upload failed. Please try again.");
      setSuccess(null);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload Dataset (CSV)
      </Typography>

      <Box mt={2}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </Box>

      <Box mt={2}>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file}
        >
          Upload
        </Button>
      </Box>

      {success && (
        <Box mt={2}>
          <Alert severity="success">{success}</Alert>
        </Box>
      )}

      {error && (
        <Box mt={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
    </Paper>
  );
}