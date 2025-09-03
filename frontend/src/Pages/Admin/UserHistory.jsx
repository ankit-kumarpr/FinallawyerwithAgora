import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  CircularProgress,
  Avatar,
  Chip,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  TextField,
  Divider,
  Stack,
  Button,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassTop as PendingIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  FilterList,
  AttachMoney,
} from "@mui/icons-material";

const UserHistory = () => {
  const token = sessionStorage.getItem("token");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalCollection, setTotalCollection] = useState(0);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "https://lawyerwork.onrender.com/lawapi/common/alluser",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUsers(response.data?.data || []);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load user list");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [token]);

  // Fetch user history
  const fetchUserHistory = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `https://lawyerwork.onrender.com/lawapi/common/userhistory/${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = Array.isArray(response.data) ? response.data : [];
      setHistory(data);
      setFilteredHistory(data);
      calculateTotal(data);
      setPage(1);
    } catch (err) {
      console.error("Error fetching user history:", err);
      setError("Failed to load transaction history");
      setHistory([]);
      setFilteredHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total collection
  const calculateTotal = (transactions) => {
    const total = transactions.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
    setTotalCollection(total);
  };

  // Handle user selection
  const handleUserChange = (event) => {
    const userId = event.target.value;
    setSelectedUser(userId);
    fetchUserHistory(userId);
  };

  // Apply date filter
  const applyDateFilter = () => {
    if (!startDate && !endDate) {
      setFilteredHistory(history);
      calculateTotal(history);
      return;
    }

    const filtered = history.filter((item) => {
      const itemDate = new Date(item.createdAt).setHours(0, 0, 0, 0);
      const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
      const end = endDate ? new Date(endDate).setHours(0, 0, 0, 0) : null;

      if (start && end) {
        return itemDate >= start && itemDate <= end;
      } else if (start) {
        return itemDate >= start;
      } else if (end) {
        return itemDate <= end;
      }
      return true;
    });

    setFilteredHistory(filtered);
    calculateTotal(filtered);
    setPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilteredHistory(history);
    calculateTotal(history);
    setPage(1);
  };

  // Get status chip
  const getStatusChip = (status) => {
    switch (status?.toLowerCase()) {
      case "success":
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="Success"
            color="success"
            size="small"
          />
        );
      case "failed":
        return (
          <Chip
            icon={<CancelIcon />}
            label="Failed"
            color="error"
            size="small"
          />
        );
      case "pending":
        return (
          <Chip
            icon={<PendingIcon />}
            label="Pending"
            color="warning"
            size="small"
          />
        );
      default:
        return <Chip label={status || "N/A"} size="small" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return new Date(dateString).toLocaleDateString("en-IN", options);
    } catch {
      return "Invalid date";
    }
  };

  // Pagination
  const paginatedData = filteredHistory.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: "bold",
          color: "primary.main",
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        User Transaction History
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="user-select-label">Select User</InputLabel>
                <Select
                  labelId="user-select-label"
                  value={selectedUser}
                  onChange={handleUserChange}
                  label="Select User"
                  disabled={loading}
                >
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user.userId}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                          {user.name?.charAt(0)}
                        </Avatar>
                        {user.name} ({user.userId})
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {selectedUser && (
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                  <Typography variant="h6" color="primary">
                    Total Collection: ₹{totalCollection.toLocaleString("en-IN")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filteredHistory.length} transactions found
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {selectedUser && (
        <Card sx={{ mb: 4, boxShadow: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <FilterList color="primary" />
              Filter Transactions
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={applyDateFilter}
                    startIcon={<FilterList />}
                  >
                    Apply Filter
                  </Button>
                  <Button variant="outlined" onClick={resetFilters}>
                    Reset
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={60} />
        </Box>
      )}

      {selectedUser && !loading && (
        <Box>
          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead sx={{ bgcolor: "primary.main" }}>
                <TableRow>
                  <TableCell sx={{ color: "white" }}>Date & Time</TableCell>
                  <TableCell sx={{ color: "white" }}>Lawyer</TableCell>
                  <TableCell sx={{ color: "white" }} align="right">
                    Amount
                  </TableCell>
                  <TableCell sx={{ color: "white" }}>Mode</TableCell>
                  <TableCell sx={{ color: "white" }}>Payment Status</TableCell>
                  <TableCell sx={{ color: "white" }}>Transaction ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item) => (
                    <TableRow key={item._id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(item.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                            {item.lawyer?.name?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography>
                              {item.lawyer?.name || "N/A"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {item.lawyerId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">
                          ₹{item.amount || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.mode || "N/A"}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{getStatusChip(item.paymentStatus)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {item.paymentId || "N/A"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No transactions found for the selected filters
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredHistory.length > rowsPerPage && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={Math.ceil(filteredHistory.length / rowsPerPage)}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </Box>
      )}

      {!selectedUser && !loading && (
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="textSecondary">
            Please select a user to view transaction history
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default UserHistory;
