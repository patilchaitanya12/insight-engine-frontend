import { Paper, Typography, Box, useTheme } from "@mui/material";
import LightbulbIcon from '@mui/icons-material/Lightbulb'; // Optional: for a premium look

interface Props {
  insights: string;
}

export default function InsightCard({ insights }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 6,
        mb: 4,
        // Theme-aware colors
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        position: "relative",
        overflow: "hidden",
        // Subtle glow effect in dark mode
        boxShadow: isDark 
          ? "0 4px 20px rgba(0, 0, 0, 0.4)" 
          : "0 2px 12px rgba(0, 0, 0, 0.05)",
        // Accent "glow" bar on the left
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          background: "linear-gradient(to bottom, #60a5fa, #c084fc)",
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
        <LightbulbIcon sx={{ color: "#fbbf24" }} /> {/* Gold bulb icon */}
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ color: "text.primary" }}
        >
          AI Insights
        </Typography>
      </Box>

      <Typography 
        variant="body1" 
        sx={{ 
          color: "text.secondary", 
          lineHeight: 1.7,
          whiteSpace: "pre-line" // Preserves line breaks if insights have them
        }}
      >
        {insights}
      </Typography>
    </Paper>
  );
}