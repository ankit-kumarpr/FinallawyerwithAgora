import React from "react";
import { Box, Typography, Button, IconButton, Tooltip } from "@mui/material";
import { Logout as LogoutIcon, Notifications as NotificationsIcon } from "@mui/icons-material";

// Header component to display welcome message and logout/notification controls
const Header = ({ lawyerName, onLogout }) => {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
      <Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Lawyer Dashboard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Welcome back, {lawyerName}!
        </Typography>
      </Box>
      <Box>
        <Tooltip title="Notifications">
          <IconButton sx={{ mr: 1 }}>
            <NotificationsIcon />
          </IconButton>
        </Tooltip>
        <Button
          variant="contained"
          startIcon={<LogoutIcon />}
          onClick={onLogout}
          sx={{ bgcolor: "error.main", "&:hover": { bgcolor: "error.dark" } }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
};

export default Header;