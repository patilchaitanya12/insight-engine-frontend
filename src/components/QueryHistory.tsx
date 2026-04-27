import { Paper, Typography, List, ListItem, ListItemText, useTheme } from "@mui/material";
import HistoryIcon from '@mui/icons-material/History';

export default function QueryHistory({ history }: { history: string[] }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper sx={{
      p: 3, 
      borderRadius: 6, // Matches the rest of the dashboard
      bgcolor: "background.paper",
      border: "1px solid",
      borderColor: "divider",
      backdropFilter: "blur(10px)",
      boxShadow: isDark 
        ? "0 4px 20px rgba(0, 0, 0, 0.4)" 
        : "0 2px 12px rgba(0, 0, 0, 0.05)",
    }}>
      <Typography 
        variant="subtitle2" 
        sx={{ 
          color: "text.secondary", 
          mb: 2, 
          display: "flex", 
          alignItems: "center", 
          gap: 1,
          fontWeight: 700,
          letterSpacing: 1
        }}
      >
        <HistoryIcon fontSize="small" /> RECENT QUERIES
      </Typography>
      
      <List dense disablePadding>
        {history.length === 0 && (
          <Typography 
            variant="body2" 
            sx={{ color: "text.disabled", fontStyle: "italic", py: 1 }}
          >
            No history yet
          </Typography>
        )}
        {history.map((q, i) => (
          <ListItem 
            key={i} 
            sx={{ 
              px: 0, 
              borderBottom: i === history.length - 1 ? "none" : "1px solid",
              borderColor: "divider"
            }}
          >
            <ListItemText
              primary={q}
              primaryTypographyProps={{
                variant: "body2",
                sx: { 
                  color: "text.primary", 
                  overflow: "hidden", 
                  textOverflow: "ellipsis", 
                  whiteSpace: "nowrap",
                  fontWeight: 500
                }
              }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}