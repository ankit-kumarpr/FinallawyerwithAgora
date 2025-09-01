import React, { useState } from "react";
import { Grid, Card, Box, Typography, Avatar, Button } from "@mui/material";
import {
  Event as EventIcon,
  People as PeopleIcon,
  AttachMoney as AttachMoneyIcon,
  Schedule as ScheduleIcon,
  ArrowUpward as ArrowUpwardIcon,
} from "@mui/icons-material";

// Stats component with Revenue toggle and Pending badge style
const Stats = ({ stats, theme }) => {
  const [revenueView, setRevenueView] = useState("monthly"); // 'monthly' or 'daily'

  const handleToggleRevenue = () => {
    setRevenueView((prev) => (prev === "monthly" ? "daily" : "monthly"));
  };

  const statItems = [
    {
      label: "Clients",
      value: stats.clients,
      icon: <PeopleIcon />,
      growth: 8,
      color: "success",
    },
    {
      label: "Revenue",
      value:
        revenueView === "monthly"
          ? `₹${stats.revenue.monthly.toLocaleString()} (Monthly)`
          : `₹${stats.revenue.daily.toLocaleString()} (Daily)`,
      icon: <AttachMoneyIcon />,
      growth: revenueView === "monthly" ? 22 : 5,
      color: "warning",
      isRevenue: true,
    },
    {
      label: "Pending Clients",
      value: stats.pending,
      icon: <ScheduleIcon />,
      growth: 2,
      color: "info",
      isPending: true,
    },
  ];

  return (
    <>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ padding: 2, borderRadius: "12px", height: "100%" }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" color="textSecondary">
                    {item.label}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {item.value}
                  </Typography>
                </Box>

                {item.isPending ? (
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.error.light,
                      color: theme.palette.error.contrastText,
                      width: 40,
                      height: 40,
                      fontSize: "1rem",
                    }}
                  >
                    {item.value}
                  </Avatar>
                ) : (
                  <Avatar sx={{ bgcolor: theme.palette[item.color].light }}>
                    {item.icon}
                  </Avatar>
                )}
              </Box>

              {/* Growth Section */}
              {!item.isPending && (
                <Box display="flex" alignItems="center" mt={1}>
                  <ArrowUpwardIcon
                    fontSize="small"
                    color={item.growth > 0 ? "success" : "error"}
                  />
                  <Typography
                    variant="caption"
                    color={item.growth > 0 ? "success.main" : "error.main"}
                    ml={0.5}
                  >
                    {item.growth}% from last month
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Revenue Toggle Button */}
      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="outlined"
          size="small"
          onClick={handleToggleRevenue}
        >
          Toggle Revenue View
        </Button>
      </Box>
    </>
  );
};

export default Stats;