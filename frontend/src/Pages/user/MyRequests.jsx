import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Table,
  Badge,
  Button,
  Modal,
  Card,
  Stack,
  Dropdown,
  Form,
  Pagination,
} from "react-bootstrap";

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(10);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const userData = JSON.parse(sessionStorage.getItem("userData"));
        const userId = userData?.userId || userData?._id;

        const res = await axios.get(
          `https://lawyerwork.onrender.com/lawapi/common/userrequest/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Fetched requests:", res.data);

        if (res.data?.success && Array.isArray(res.data.requests)) {
          setRequests(res.data.requests);
          setFilteredRequests(res.data.requests);
        } else {
          toast.error("Invalid response format from server");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Error fetching your requests");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = requests.filter((r) =>
      statusFilter === "all" ? true : r.status === statusFilter
    );

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          (r.lawyerName && r.lawyerName.toLowerCase().includes(query)) ||
          (r.lawyerEmail && r.lawyerEmail.toLowerCase().includes(query)) ||
          (r.message && r.message.toLowerCase().includes(query))
      );
    }

    setFilteredRequests(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [requests, statusFilter, searchQuery]);

  // Pagination logic
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = filteredRequests.slice(
    indexOfFirstRequest,
    indexOfLastRequest
  );
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge bg="warning">Pending</Badge>;
      case "accepted":
        return <Badge bg="success">Accepted</Badge>;
      case "rejected":
        return <Badge bg="danger">Rejected</Badge>;
      case "completed":
        return <Badge bg="info">Completed</Badge>;
      default:
      // return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "300px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3 px-3 px-md-4">
      <ToastContainer position="top-center" />

      <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
        <h1 className="h4 mb-2 mb-md-0">Your Requests to Lawyers</h1>
        <div className="d-flex align-items-center">
          <span className="me-2 d-none d-md-inline">Total:</span>
          <Badge bg="info" pill>
            {filteredRequests.length}
          </Badge>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-3">
        <div className="row g-2">
          <div className="col-md-6">
            <Form.Control
              type="text"
              placeholder="Search by lawyer name or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <div className="d-flex flex-wrap">
              <Dropdown className="me-2 mb-2 mb-md-0">
                <Dropdown.Toggle
                  variant={
                    statusFilter === "all" ? "primary" : "outline-primary"
                  }
                  size="sm"
                >
                  {statusFilter === "all"
                    ? "All Statuses"
                    : statusFilter.charAt(0).toUpperCase() +
                      statusFilter.slice(1)}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {["all", "pending", "accepted", "rejected", "completed"].map(
                    (filter) => (
                      <Dropdown.Item
                        key={filter}
                        active={statusFilter === filter}
                        onClick={() => setStatusFilter(filter)}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </Dropdown.Item>
                    )
                  )}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="d-none d-md-block">
        {currentRequests.length > 0 ? (
          <>
            <Table striped bordered hover responsive className="mb-3">
              <thead className="table-light">
                <tr>
                  <th>Lawyer</th>
                  {/* <th>Status</th> */}
                  <th>Message Preview</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRequests.map((req) => (
                  <tr key={req._id}>
                    <td>{req.lawyerName || "N/A"}</td>
                    {/* <td>{getStatusBadge(req.status)}</td> */}
                    <td>
                      {req.message.length > 50
                        ? `${req.message.substring(0, 50)}...`
                        : req.message}
                    </td>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => handleViewDetails(req)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center">
                <Pagination>
                  <Pagination.First
                    onClick={() => paginate(1)}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Prev
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  />

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <Pagination.Item
                        key={pageNumber}
                        active={pageNumber === currentPage}
                        onClick={() => paginate(pageNumber)}
                      >
                        {pageNumber}
                      </Pagination.Item>
                    );
                  })}

                  <Pagination.Next
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  />
                  <Pagination.Last
                    onClick={() => paginate(totalPages)}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <div className="alert alert-info">No requests found.</div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="d-md-none">
        {currentRequests.length > 0 ? (
          <>
            {currentRequests.map((req) => (
              <Card key={req._id} className="mb-3 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="h6 mb-0">
                      {req.lawyerName || "N/A"}
                    </Card.Title>
                    {getStatusBadge(req.status)}
                  </div>
                  <Card.Subtitle className="mb-2 text-muted small">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </Card.Subtitle>
                  <Card.Text className="mb-3">
                    {req.message.length > 100
                      ? `${req.message.substring(0, 100)}...`
                      : req.message}
                  </Card.Text>
                  <div className="d-grid">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleViewDetails(req)}
                    >
                      View Details
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}

            {/* Pagination for mobile */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <Pagination size="sm">
                  <Pagination.First
                    onClick={() => paginate(1)}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Prev
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  />

                  {currentPage > 1 && (
                    <Pagination.Item onClick={() => paginate(currentPage - 1)}>
                      {currentPage - 1}
                    </Pagination.Item>
                  )}

                  <Pagination.Item active>{currentPage}</Pagination.Item>

                  {currentPage < totalPages && (
                    <Pagination.Item onClick={() => paginate(currentPage + 1)}>
                      {currentPage + 1}
                    </Pagination.Item>
                  )}

                  <Pagination.Next
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  />
                  <Pagination.Last
                    onClick={() => paginate(totalPages)}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <div className="alert alert-info">No requests found.</div>
        )}
      </div>

      {/* Request Details Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Request Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div>
              <div className="mb-3">
                <h6 className="text-muted">Lawyer Information</h6>
                <p>
                  <strong>Name:</strong> {selectedRequest.lawyerName || "N/A"}
                </p>
                {/* <p><strong>Status:</strong> {getStatusBadge(selectedRequest.status)}</p> */}
                <p>
                  <strong>Date Sent:</strong>{" "}
                  {new Date(selectedRequest.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="mb-3">
                <h6 className="text-muted">Your Message</h6>
                <div className="p-3 bg-light rounded">
                  {selectedRequest.message}
                </div>
              </div>

              {selectedRequest.response && (
                <div className="mb-3">
                  <h6 className="text-muted">Lawyer's Response</h6>
                  <div className="p-3 bg-light rounded">
                    {selectedRequest.response}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowModal(false)}
            className="flex-grow-1"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MyRequests;
