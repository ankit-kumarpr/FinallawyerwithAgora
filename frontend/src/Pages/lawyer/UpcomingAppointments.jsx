import React from "react";
import { Box, Typography, Paper, Stack, Button } from "@mui/material";
import { Event as EventIcon } from "@mui/icons-material";
import moment from "moment";

// UpcomingAppointments component to display scheduled appointments and scheduling option
const UpcomingAppointments = ({ appointments, consultationFees }) => {
  const formatDisplayDate = (dateString) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = new Date(dateString);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return moment(date).format("MMM D");
  };

  const formatTime = (timeString) => {
    return moment(timeString, "HH:mm").format("h:mm A");
  };

  return (
    <Box sx={{ padding: 3, borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <EventIcon color="primary" sx={{ mr: 2 }} />
          <Typography variant="h6" fontWeight="bold">Upcoming Appointments</Typography>
        </Box>
        <Button variant="text" color="primary" size="small">View All</Button>
      </Box>

      <Stack spacing={2}>
        {appointments.length > 0 ? (
          appointments.map((app) => (
            <Paper
              key={app._id}
              sx={{
                p: 2,
                borderRadius: "12px",
                borderLeft: `4px solid #1976d2`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {app.user?.name || "Client"}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {app.mode} Consultation • ₹{consultationFees}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="subtitle2" fontWeight="bold">
                  {formatTime(app.time)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {formatDisplayDate(app.date)}
                </Typography>
              </Box>
            </Paper>
          ))
        ) : (
          <Typography variant="body1" textAlign="center" py={2}>
            No upcoming appointments
          </Typography>
        )}
      </Stack>

      <Box mt={3} textAlign="center">
        <Button variant="contained" color="primary" fullWidth>
          Schedule New Appointment
        </Button>
      </Box>
    </Box>
  );
};

export default UpcomingAppointments;