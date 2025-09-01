import React from "react";
import { Box, Typography, Grid, Divider, Button, Chip } from "@mui/material";
import {
  AccountCircle as AccountCircleIcon,
  Badge as BadgeIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
} from "@mui/icons-material";

// ProfileCard component to display lawyer's personal and professional details
const ProfileCard = ({ lawyer }) => {
  return (
    <Box sx={{ padding: 3, borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <AccountCircleIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
          <Typography variant="h6" fontWeight="bold">Your Profile</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          color="primary"
          size="small"
          href="/profile/edit"
        >
          Edit
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Box display="flex" alignItems="center" mb={2}>
            <BadgeIcon color="primary" sx={{ mr: 1 }} />
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Lawyer ID</Typography>
              <Typography variant="body1">{lawyer.lawyerId}</Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" mb={2}>
            <EmailIcon color="primary" sx={{ mr: 1 }} />
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Email</Typography>
              <Typography variant="body1">{lawyer.email}</Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" mb={2}>
            <WorkIcon color="primary" sx={{ mr: 1 }} />
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Specialization</Typography>
              <Typography variant="body1">{lawyer.specialization}</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box display="flex" alignItems="center" mb={2}>
            <PhoneIcon color="primary" sx={{ mr: 1 }} />
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Contact</Typography>
              <Typography variant="body1">{lawyer.phone}</Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" mb={2}>
            <WorkIcon color="primary" sx={{ mr: 1 }} />
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Experience</Typography>
              <Typography variant="body1">{lawyer.experience} years</Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center">
            <LocationIcon color="primary" sx={{ mr: 1 }} />
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Location</Typography>
              <Typography variant="body1">{lawyer.city}</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="subtitle2" color="textSecondary">Consultation Fees</Typography>
          <Typography variant="h6" color="primary">
            ₹{lawyer.consultation_fees}
          </Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="textSecondary">License Number</Typography>
          <Typography variant="body1">{lawyer.licenseNumber}</Typography>
        </Box>
        <Box>
         
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileCard;