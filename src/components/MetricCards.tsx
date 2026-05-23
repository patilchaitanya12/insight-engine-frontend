import { Grid, Paper, Typography, Box, useTheme } from "@mui/material";

export default function MetricCards({ rows, xColumn, yColumn }: any) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!rows.length) return null;

  const total = rows.reduce((sum: number, r: any) => sum + Number(r[yColumn] || 0), 0);
  const maxRow = rows.reduce((a: any, b: any) => Number(a[yColumn]) > Number(b[yColumn]) ? a : b);
  const avg = Math.round(total / rows.length);

  const stats = [
    { label: `Total ${yColumn}`, value: total.toLocaleString(), color: "#3b82f6" },
    { label: `Top ${xColumn}`, value: maxRow[xColumn], color: "#a855f7" },
    { label: `Avg ${yColumn}`, value: avg.toLocaleString(), color: "#10b981" }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {stats.map((item, i) => (
        <Grid key={i} size={{ xs: 12, md: 4 }}>
          <Paper sx={{
            p: 3, 
            borderRadius: 6, 
            // Theme-aware background and border
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            backdropFilter: "blur(10px)",
            boxShadow: isDark 
              ? "0 4px 20px rgba(0, 0, 0, 0.4)" 
              : "0 2px 12px rgba(0, 0, 0, 0.05)",
            transition: "transform 0.2s ease-in-out",
            "&:hover": {
              transform: "translateY(-4px)"
            }
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: "text.secondary", 
                textTransform: "uppercase", 
                letterSpacing: 1.5, 
                fontWeight: 700 
              }}
            >
              {item.label}
            </Typography>
            <Typography 
              variant="h4" 
              fontWeight={800} 
              sx={{ mt: 1, color: "text.primary" }}
            >
              {item.value}
            </Typography>
            
            {/* Decorative Accent Bar */}
            <Box sx={{ 
              width: 50, 
              height: 4, 
              bgcolor: item.color, 
              mt: 2, 
              borderRadius: 2,
              // Subtle glow effect
              boxShadow: `0 2px 10px ${item.color}80` 
            }} />
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}