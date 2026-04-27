import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import type { TableData } from "../types/query";

interface Props {
  table: TableData;
}

export default function DataTable({ table }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 6,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: isDark 
          ? "0 4px 20px rgba(0, 0, 0, 0.4)" 
          : "0 2px 12px rgba(0, 0, 0, 0.05)",
        overflow: "hidden"
      }}
    >
      <Typography variant="h6" sx={{ color: "text.primary", mb: 2, fontWeight: 700 }}>
        Raw Data Explorer
      </Typography>

      <TableContainer sx={{ maxHeight: 440, borderRadius: 3 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {table.columns.map((col) => (
                <TableCell 
                  key={col} 
                  sx={{ 
                    fontWeight: 700,
                    // Use a slightly different shade for the sticky header
                    bgcolor: isDark ? "#1e293b" : "#f1f5f9", 
                    color: "text.secondary",
                    borderBottom: "2px solid",
                    borderColor: "divider",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                    letterSpacing: 1.2
                  }}
                >
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {table.data.map((row, index) => (
              <TableRow 
                key={index}
                sx={{ 
                  transition: "background-color 0.2s",
                  "&:hover": { 
                    bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" 
                  },
                  "& td": { 
                    borderBottom: "1px solid",
                    borderColor: "divider" 
                  }
                }}
              >
                {table.columns.map((col) => (
                  <TableCell key={col} sx={{ color: "text.primary" }}>
                    {row[col]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}