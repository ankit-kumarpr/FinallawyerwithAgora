import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
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
  Chat as ChatIcon,
  Person as PersonIcon,
  FilterList,
  CalendarToday,
  Download,
} from "@mui/icons-material";

const LawyerHistory = () => {
  const token = sessionStorage.getItem("token");
  const [lawyers, setLawyers] = useState([]);
  const [selectedLawyer, setSelectedLawyer] = useState("");
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const rowsPerPage = 10;

  // Fetch all lawyers
  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          "https://lawyerwork.onrender.com/lawapi/common/lwayerlist",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setLawyers(response.data?.data || []);
      } catch (err) {
        console.error("Error fetching lawyers:", err);
        setError("Failed to load lawyer list");
      } finally {
        setLoading(false);
      }
    };
    fetchLawyers();
  }, [token]);

  // Fetch transaction history when lawyer is selected
  const fetchTransactionHistory = async (lawyerId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `https://lawyerwork.onrender.com/lawapi/common/lawyertransectionhistoty/${lawyerId}`,
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
      setPage(1);
    } catch (err) {
      console.error("Error fetching transaction history:", err);
      setError("Failed to load transaction history");
      setHistory([]);
      setFilteredHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply date filter
  const applyDateFilter = () => {
    if (!startDate && !endDate) {
      setFilteredHistory(history);
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
    setPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilteredHistory(history);
    setPage(1);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (filteredHistory.length === 0) {
      alert("No data to export");
      return;
    }

    // Prepare data for Excel
    const excelData = filteredHistory.map((item) => ({
      Date: formatDateTime(item.createdAt),
      "User Name": item.user?.name || "N/A",
      "User ID": item.userId || "N/A",
      "Lawyer Name": item.lawyer?.name || "N/A",
      "Lawyer ID": item.lawyerId || "N/A",
      Amount: item.amount || 0,
      Mode: item.mode || "N/A",
      "Payment Status": item.paymentStatus || "N/A",
      Status: item.status || "N/A",
      "Payment ID": item.paymentId || "N/A",
      "Transaction ID": item.transaction?.transactionId || "N/A",
      Purpose: item.user?.purpose || "N/A",
      "User Email": item.user?.email || "N/A",
      "User Phone": item.user?.phone || "N/A",
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    // Generate file name
    const fileName = `Lawyer_${selectedLawyer}_Transactions_${
      startDate || "all"
    }_to_${endDate || "all"}.xlsx`;

    // Download the file
    XLSX.writeFile(wb, fileName);
  };

  // Handle lawyer selection change
  const handleLawyerChange = (event) => {
    const lawyerId = event.target.value;
    setSelectedLawyer(lawyerId);
    fetchTransactionHistory(lawyerId);
  };

  // Get status chip component
  const getStatusChip = (status) => {
    let icon, color;

    switch (status?.toLowerCase()) {
      case "success":
        icon = <CheckCircleIcon fontSize="small" />;
        color = "success";
        break;
      case "failed":
        icon = <CancelIcon fontSize="small" />;
        color = "error";
        break;
      case "pending":
      case "requested":
        icon = <PendingIcon fontSize="small" />;
        color = "warning";
        break;
      default:
        icon = <CheckCircleIcon fontSize="small" />;
        color = "success";
    }

    return (
      <Chip icon={icon} label={status || "N/A"} size="small" color={color} />
    );
  };

  // Get transaction mode icon and name
  const getTransactionMode = (mode) => {
    switch (mode?.toLowerCase()) {
      case "chat":
        return {
          icon: <ChatIcon color="primary" fontSize="small" />,
          name: "Chat",
        };
      case "consultation":
        return {
          icon: <PersonIcon color="primary" fontSize="small" />,
          name: "Consultation",
        };
      case "payment":
        return {
          icon: <PaymentIcon color="primary" fontSize="small" />,
          name: "Payment",
        };
      default:
        return {
          icon: <PaymentIcon color="primary" fontSize="small" />,
          name: mode || "N/A",
        };
    }
  };

  // Format date to readable format
  const formatDateTime = (dateString) => {
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

  // Pagination logic
  const paginatedHistory = filteredHistory.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Toggle row expansion
  const toggleRowExpansion = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
        Lawyer Transaction History
      </Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Lawyer Selection Card */}
      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="lawyer-select-label">Select Lawyer</InputLabel>
                <Select
                  labelId="lawyer-select-label"
                  id="lawyer-select"
                  value={selectedLawyer}
                  onChange={handleLawyerChange}
                  label="Select Lawyer"
                  disabled={loading}
                >
                  {lawyers.map((lawyer) => (
                    <MenuItem key={lawyer._id} value={lawyer.lawyerId}>
                      {lawyer.name} ({lawyer.lawyerId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {selectedLawyer && (
              <Grid item xs={12} md={6}>
                <Box
                  display="flex"
                  justifyContent="flex-end"
                  alignItems="center"
                  gap={2}
                >
                  <Typography variant="subtitle1">
                    <strong>Transactions:</strong> {filteredHistory.length} |
                    <strong> Amount:</strong> ₹
                    {filteredHistory.reduce(
                      (sum, item) => sum + (item.amount || 0),
                      0
                    )}
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Download />}
                    onClick={exportToExcel}
                    disabled={filteredHistory.length === 0}
                  >
                    Export Excel
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Date Filter Card */}
      {selectedLawyer && (
        <Card sx={{ mb: 4, boxShadow: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <FilterList color="primary" />
              Filter by Date Range
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <CalendarToday color="action" sx={{ mr: 1 }} />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <CalendarToday color="action" sx={{ mr: 1 }} />
                    ),
                  }}
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

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Transaction History */}
      {selectedLawyer && !loading && (
        <Box>
          {/* Transactions Table */}
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell width="10%">
                    <b>Mode</b>
                  </TableCell>
                  <TableCell>
                    <b>User Details</b>
                  </TableCell>
                  <TableCell align="right">
                    <b>Amount</b>
                  </TableCell>
                  <TableCell>
                    <b>Payment</b>
                  </TableCell>
                  <TableCell>
                    <b>Status</b>
                  </TableCell>
                  <TableCell>
                    <b>Date</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedHistory.length > 0 ? (
                  paginatedHistory.map((item) => (
                    <React.Fragment key={item._id}>
                      <TableRow
                        hover
                        onClick={() => toggleRowExpansion(item._id)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getTransactionMode(item.mode).icon}
                            <Typography variant="body2">
                              {getTransactionMode(item.mode).name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                mr: 1.5,
                                bgcolor: "primary.main",
                                fontSize: 14,
                              }}
                            >
                              {item.user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </Avatar>
                            <Box>
                              <Typography>
                                {item.user?.name || "User"}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {item.userId || "N/A"}
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
                          {getStatusChip(item.paymentStatus)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.status || "N/A"}
                            size="small"
                            color={
                              item.status === "requested"
                                ? "warning"
                                : item.status === "success"
                                ? "success"
                                : "default"
                            }
                          />
                        </TableCell>
                        <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                      </TableRow>
                      {expandedRow === item._id && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            sx={{ py: 2, backgroundColor: "#fafafa" }}
                          >
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">
                                  Transaction Details
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                                <Box>
                                  <Typography variant="body2">
                                    <strong>Payment ID:</strong>{" "}
                                    {item.paymentId || "N/A"}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Transaction ID:</strong>{" "}
                                    {item.transaction?.transactionId || "N/A"}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Purpose:</strong>{" "}
                                    {item.user?.purpose || "N/A"}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2">
                                  User Contact
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                                <Box>
                                  <Typography variant="body2">
                                    <strong>Email:</strong>{" "}
                                    {item.user?.email || "N/A"}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Phone:</strong>{" "}
                                    {item.user?.phone || "N/A"}
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="textSecondary" py={2}>
                        No transactions found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredHistory.length > rowsPerPage && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={Math.ceil(filteredHistory.length / rowsPerPage)}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </Box>
      )}

      {/* Empty State - No Lawyer Selected */}
      {!selectedLawyer && !loading && (
        <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="textSecondary">
            Please select a lawyer to view transaction history
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default LawyerHistory;
