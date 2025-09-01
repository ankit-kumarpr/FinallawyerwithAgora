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
} from "@mui/material";
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Save as SaveIcon,
} from "@mui/icons-material";

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editedCustomer, setEditedCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    addressline: "",
    city: "",
    purpose: "",
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:4000/lawapi/common/alluser",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCustomers(response.data.data);
        setFilteredCustomers(response.data.data);
        setLoading(false);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to fetch customers"
        );
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    const results = customers.filter(
      (customer) =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toString().includes(searchTerm)
    );
    setFilteredCustomers(results);
    setPage(0);
  }, [searchTerm, customers]);

  const viewCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setEditedCustomer({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      addressline: customer.addressline,
      city: customer.city,
      purpose: customer.purpose,
    });
    setOpenModal(true);
  };

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      setUpdatingId(selectedCustomer._id);
      const token = sessionStorage.getItem("token");

      const response = await axios.post(
        `http://localhost:4000/lawapi/common/updateuser/${selectedCustomer.userId}`,
        editedCustomer,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.success) {
        toast.success("Customer updated successfully");
        setCustomers((prev) =>
          prev.map((c) =>
            c._id === selectedCustomer._id ? { ...c, ...editedCustomer } : c
          )
        );
        setEditMode(false);
      } else {
        toast.error(response.data?.message || "Failed to update customer");
      }
    } catch (error) {
      console.error("Error updating customer: ", error);
      toast.error(
        "Update failed: " + (error.response?.data?.message || "Network Error")
      );
    } finally {
      setUpdatingId(null);
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
        <PersonIcon fontSize="large" /> Customer Management
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search customers by name, email, phone, or user ID"
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
                    User ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", color: "common.white" }}>
                    Phone
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
                {filteredCustomers.length > 0 ? (
                  filteredCustomers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((customer, index) => (
                      <TableRow key={customer._id} hover>
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.userId}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>
                          <Chip
                            label="Active"
                            color="success"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ minWidth: 200 }}>
                          <Tooltip title="View/Edit Details">
                            <IconButton
                              color="primary"
                              onClick={() => viewCustomerDetails(customer)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="textSecondary">
                        No customers found matching your search criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {filteredCustomers.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredCustomers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ mt: 2 }}
            />
          )}
        </>
      )}

      {/* Customer Details/Edit Dialog */}
      <Dialog
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditMode(false);
        }}
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
            <PersonIcon /> {editMode ? "Edit Customer" : "Customer Profile"}
          </Box>
          <IconButton
            aria-label="close"
            onClick={() => {
              setOpenModal(false);
              setEditMode(false);
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCustomer && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 3,
                p: 2,
              }}
            >
              {editMode ? (
                <>
                  <TextField
                    label="Full Name"
                    name="name"
                    value={editedCustomer.name}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Email Address"
                    name="email"
                    value={editedCustomer.email}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    type="email"
                  />
                  <TextField
                    label="Contact Number"
                    name="phone"
                    value={editedCustomer.phone}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    type="tel"
                  />
                  <TextField
                    label="Address Line"
                    name="addressline"
                    value={editedCustomer.addressline}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="City"
                    name="city"
                    value={editedCustomer.city}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Purpose"
                    name="purpose"
                    value={editedCustomer.purpose}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    multiline
                    rows={2}
                  />
                </>
              ) : (
                <>
                  <DetailItem label="Full Name" value={selectedCustomer.name} />
                  <DetailItem
                    label="Email Address"
                    value={selectedCustomer.email}
                  />
                  <DetailItem label="User ID" value={selectedCustomer.userId} />
                  <DetailItem
                    label="Contact Number"
                    value={selectedCustomer.phone || "Not provided"}
                  />
                  <DetailItem
                    label="Address"
                    value={
                      `${selectedCustomer.addressline || ""}, ${
                        selectedCustomer.city || ""
                      }`.trim() || "Not provided"
                    }
                  />
                  <DetailItem
                    label="Purpose"
                    value={selectedCustomer.purpose || "Not specified"}
                  />
                  <DetailItem
                    label="Account Created"
                    value={new Date(
                      selectedCustomer.created_at
                    ).toLocaleString()}
                  />
                  <DetailItem
                    label="Account Status"
                    value={
                      <Chip
                        label="Active"
                        color="success"
                        variant="outlined"
                        sx={{ fontWeight: "bold" }}
                      />
                    }
                  />
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {editMode ? (
            <>
              <Button
                onClick={() => setEditMode(false)}
                variant="outlined"
                color="secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCustomer}
                variant="contained"
                color="primary"
                startIcon={
                  updatingId ? <CircularProgress size={20} /> : <SaveIcon />
                }
                disabled={updatingId}
              >
                {updatingId ? "Updating..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setOpenModal(false)} variant="outlined">
                Close
              </Button>
              <Button
                onClick={handleEditClick}
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
              >
                Edit Details
              </Button>
            </>
          )}
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
      {typeof value === "string" || typeof value === "number" ? value : value}
    </Typography>
  </Box>
);

export default CustomerManagement;
