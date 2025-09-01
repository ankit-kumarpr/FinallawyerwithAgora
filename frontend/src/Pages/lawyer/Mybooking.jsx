import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Mybooking.css";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  VideoCall as VideoCallIcon,
  Message as MessageIcon,
  Call as CallIcon,
} from "@mui/icons-material";

function Mybooking() {
  const [actionedBookings, setActionedBookings] = useState({});

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const token = sessionStorage.getItem("token");

  const fetchLawyerBooking = async () => {
    try {
      const url = `http://localhost:4000/lawapi/common/lawyerbooking`;
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get(url, { headers });
      setData(response.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLawyerBooking();
  }, []);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

  const getModeBadge = (mode) => {
    if (mode === "call") {
      return (
        <span className="badge badge-call">
          <CallIcon fontSize="small" style={{ marginRight: 4 }} />
          Call
        </span>
      );
    }
    if (mode === "chat") {
      return (
        <span className="badge badge-chat">
          <MessageIcon fontSize="small" style={{ marginRight: 4 }} />
          Chat
        </span>
      );
    }
    if (mode === "video") {
      return (
        <span className="badge badge-video">
          <VideoCallIcon fontSize="small" style={{ marginRight: 4 }} />
          Video Call
        </span>
      );
    }
    return <span className="badge badge-other">{mode}</span>;
  };

  const handleStatusUpdate = async (_id, status) => {
    try {
      const url = `http://localhost:4000/lawapi/common/bookings/${_id}`;
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const body = { status: status };

      const response = await axios.put(url, body, { headers });

      if (response.data) {
        if (status === "accepted") {
          toast.success(`Booking ${status} successfully!`, {
            position: "top-right",
            autoClose: 3000,
            theme: "colored",
          });
        } else if (status === "rejected") {
          toast.error(`Booking ${status} successfully!`, {
            position: "top-right",
            autoClose: 3000,
            theme: "colored",
          });
        }
        fetchLawyerBooking();
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error(`Failed to update booking status: ${error.message}`, {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });
    }
  };

  return (
    <div>
      <h2>My Booking Data</h2>
      <motion.div
        className="table-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        {currentItems.length > 0 ? (
          <>
            <div className="table-responsive">
              <table className="booking-table">
                <thead className="haeding">
                  <tr>
                    <th>S.No.</th>
                    <th>User Name</th>
                    <th>User ID</th>
                    <th>Booking Id</th>
                    <th>Mode</th>
                    {/* <th>Action</th> */}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((booking, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <td>{indexOfFirstItem + index + 1}</td>
                      <td>{booking.user?.name || "N/A"}</td>
                      <td>{booking.userId}</td>
                      <td>{booking._id}</td>
                      <td>{getModeBadge(booking.mode)}</td>
                      <td>
                        {/* <div className="action-buttons">
                          <button
                            className="accept-button"
                            onClick={() => handleStatusUpdate(booking._id, 'accepted')}
                          >
                            Accept
                          </button>
                          <button
                            className="reject-button"
                            onClick={() => handleStatusUpdate(booking._id, 'rejected')}
                          >
                            Reject
                          </button>
                        </div> */}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button
                onClick={() => setCurrentPage((prev) => prev - 1)}
                disabled={currentPage === 1}
              >
                <FaChevronLeft />
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage === totalPages}
              >
                <FaChevronRight />
              </button>
            </div>
          </>
        ) : (
          !loading && <p>No bookings found.</p>
        )}
      </motion.div>

      {/* Toast Container for showing notifications */}
      <ToastContainer />
    </div>
  );
}

export default Mybooking;
