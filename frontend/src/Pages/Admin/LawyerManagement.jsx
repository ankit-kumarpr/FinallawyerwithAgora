import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  TablePagination,
  Grid,
} from "@mui/material";
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Verified as VerifiedIcon,
  Gavel as GavelIcon,
  Edit as EditIcon,
  AttachMoney as AttachMoneyIcon, // Import money icon
} from "@mui/icons-material";
import { ToastContainer } from "react-toastify"; // make sure this is also imported

const LawyerManagement = () => {
  const [lawyers, setLawyers] = useState([]);
  const [filteredLawyers, setFilteredLawyers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [lawyerToEdit, setLawyerToEdit] = useState(null);
  const [editedLawyerData, setEditedLawyerData] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lawyerToDelete, setLawyerToDelete] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const response = await axios.get(
          "https://lawyerwork.onrender.com/lawapi/common/lwayerlist",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setLawyers(response.data.data);
        setFilteredLawyers(response.data.data);
        setLoading(false);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch lawyers");
        setLoading(false);
      }
    };

    fetchLawyers();
  }, []);

  useEffect(() => {
    const results = lawyers.filter(
      (lawyer) =>
        lawyer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lawyer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lawyer.specialization
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        lawyer.lawyerId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLawyers(results);
    setPage(0); // Reset to first page when search changes
  }, [searchTerm, lawyers]);

  const verifyLawyer = async (lawyer) => {
    try {
      setVerifyingId(lawyer._id);
      const token = sessionStorage.getItem("token");

      await axios.post(
        `https://lawyerwork.onrender.com/lawapi/auth/verify-lawyer/${lawyer.lawyerId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Lawyer verified successfully");

      setLawyers((prev) =>
        prev.map((item) =>
          item._id === lawyer._id ? { ...item, isverified: true } : item
        )
      );
    } catch (error) {
      console.error("Verification error:", error);
      toast.error(error.response?.data?.message || "Failed to verify lawyer");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDeleteClick = (lawyer) => {
    setLawyerToDelete(lawyer);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteLawyer = async () => {
    if (!lawyerToDelete) return;

    try {
      setDeletingId(lawyerToDelete._id);
      const token = sessionStorage.getItem("token");
      const url = `https://lawyerwork.onrender.com/lawapi/common/dellawyer/${lawyerToDelete.lawyerId}`;

      const response = await axios.post(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.data?.is_deleted) {
        toast.success("Lawyer deleted successfully");
        setLawyers((prev) => prev.filter((l) => l._id !== lawyerToDelete._id));
        setDeleteDialogOpen(false);
        setLawyerToDelete(null);
      } else {
        toast.warning("Unexpected response from server.");
      }
    } catch (error) {
      console.error("Error deleting lawyer: ", error);
      toast.error(
        "Delete failed. Status: " + (error.response?.status || "Network Error")
      );
    } finally {
      setDeletingId(null);
    }
  };

  const viewLawyerDetails = (lawyer) => {
    setSelectedLawyer(lawyer);
    setOpenModal(true);
  };

  const handleEditClick = (lawyer) => {
    setLawyerToEdit(lawyer);
    setEditedLawyerData({ ...lawyer });
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setLawyerToEdit(null);
    setEditedLawyerData({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedLawyerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!lawyerToEdit) return;

    try {
      const token = sessionStorage.getItem("token");
      const url = `https://lawyerwork.onrender.com/lawapi/common/updatelawyer/${lawyerToEdit.lawyerId}`;

      // The editedLawyerData already contains all fields including consultation_fees
      await axios.post(url, editedLawyerData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // This success toast will alert the user
      toast.success("Lawyer data updated successfully!");

      setLawyers((prev) =>
        prev.map((l) =>
          l._id === lawyerToEdit._id ? { ...l, ...editedLawyerData } : l
        )
      );
      handleEditDialogClose();
    } catch (error) {
      console.error("Error updating lawyer: ", error);
      toast.error(
        error.response?.data?.message || "Failed to update lawyer data"
      );
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <GavelIcon fontSize="large" /> Lawyer Management
      </Typography>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search lawyers by name, email, or specialization"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "primary.light" }}>
                  <TableCell sx={{ fontWeight: "bold", color: "common.white" }}>
                    #
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "common.white" }}>
                    Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "common.white" }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "common.white" }}>
                    Lawyer ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "common.white" }}>
                    Specialization
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "common.white" }}>
                    Status
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: "bold", color: "common.white" }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLawyers.length > 0 ? (
                  filteredLawyers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((lawyer, index) => (
                      <TableRow key={lawyer._id} hover>
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>{lawyer.name}</TableCell>
                        <TableCell>{lawyer.email}</TableCell>
                        <TableCell>{lawyer.lawyerId}</TableCell>
                        <TableCell>{lawyer.specialization}</TableCell>
                        <TableCell>
                          {lawyer.isverified ? (
                            <Chip
                              icon={<VerifiedIcon />}
                              label="Verified"
                              color="success"
                              variant="outlined"
                            />
                          ) : (
                            <Chip
                              icon={<CancelIcon />}
                              label="Pending"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ minWidth: 240 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              color="primary"
                              onClick={() => viewLawyerDetails(lawyer)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Lawyer">
                            <IconButton
                              color="secondary"
                              onClick={() => handleEditClick(lawyer)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {!lawyer.isverified && (
                            <Tooltip title="Verify Lawyer">
                              <IconButton
                                color="success"
                                onClick={() => verifyLawyer(lawyer)}
                                disabled={verifyingId === lawyer._id}
                              >
                                {verifyingId === lawyer._id ? (
                                  <CircularProgress size={24} />
                                ) : (
                                  <CheckCircleIcon />
                                )}
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete Lawyer">
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteClick(lawyer)}
                              disabled={deletingId === lawyer._id}
                            >
                              {deletingId === lawyer._id ? (
                                <CircularProgress size={24} />
                              ) : (
                                <DeleteIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="textSecondary">
                        No lawyers found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {filteredLawyers.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredLawyers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ mt: 2 }}
            />
          )}
        </>
      )}

      {/* Lawyer Details Dialog */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <GavelIcon /> Lawyer Profile
          </Box>
          <IconButton aria-label="close" onClick={() => setOpenModal(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedLawyer && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 3,
                p: 2,
              }}
            >
              <DetailItem label="Full Name" value={selectedLawyer.name} />
              <DetailItem label="Email Address" value={selectedLawyer.email} />
              <DetailItem
                label="Contact Number"
                value={selectedLawyer.phone || "Not provided"}
              />
              <DetailItem
                label="Specialization"
                value={selectedLawyer.specialization}
              />
              <DetailItem label="Lawyer ID" value={selectedLawyer.lawyerId} />
              <DetailItem
                label="Years of Experience"
                value={`${selectedLawyer.experience || 0} years`}
              />
              <DetailItem
                label="License Number"
                value={selectedLawyer.licenseNumber}
              />
              <DetailItem
                label="Office City"
                value={selectedLawyer.city || "Not provided"}
              />
              <DetailItem
                label="Consultation Fees"
                value={
                  selectedLawyer.consultation_fees
                    ? `₹${selectedLawyer.consultation_fees}`
                    : "Not set"
                }
              />
              <DetailItem
                label="Verification Status"
                value={
                  <Chip
                    icon={
                      selectedLawyer.isverified ? (
                        <VerifiedIcon />
                      ) : (
                        <CancelIcon />
                      )
                    }
                    label={selectedLawyer.isverified ? "Verified" : "Pending"}
                    color={selectedLawyer.isverified ? "success" : "warning"}
                    variant="outlined"
                  />
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenModal(false)}
            variant="contained"
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Lawyer Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Lawyer Details</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={editedLawyerData.name || ""}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={editedLawyerData.email || ""}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={editedLawyerData.phone || ""}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={editedLawyerData.city || ""}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Specialization"
                  name="specialization"
                  value={editedLawyerData.specialization || ""}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Experience (Years)"
                  name="experience"
                  type="number"
                  value={editedLawyerData.experience || 0}
                  onChange={handleInputChange}
                />
              </Grid>
              {/* == NEW FIELD FOR CONSULTATION FEES == */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Consultation Fees (₹/minute)"
                  name="consultation_fees"
                  type="number"
                  value={editedLawyerData.consultation_fees || 0}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Profile Description"
                  name="profileDescription"
                  multiline
                  rows={3}
                  value={editedLawyerData.profileDescription || ""}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleSaveChanges}
            color="primary"
            variant="contained"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DeleteIcon color="error" /> Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete {lawyerToDelete?.name}?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteLawyer}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
            disabled={deletingId === lawyerToDelete?._id}
          >
            {deletingId === lawyerToDelete?._id
              ? "Deleting..."
              : "Confirm Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const DetailItem = ({ label, value }) => (
  <Box sx={{ display: "flex", flexDirection: "column" }}>
    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 500 }}>
      {value}
    </Typography>
  </Box>
);

export default LawyerManagement;
