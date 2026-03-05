import { Paper, Typography } from "@mui/material";

interface Props {
  insights: string;
}

export default function InsightCard({ insights }: Props) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Insights
      </Typography>
      <Typography>{insights}</Typography>
    </Paper>
  );
}