import axios from "axios";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaUser,
  FaBell,
  FaPhone,
  FaEnvelope,
  FaBriefcase,
  FaCertificate,
  FaCheckCircle,
  FaGraduationCap,
  FaInfoCircle,
  FaCamera,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import io from "socket.io-client";
import "./profile.css";

const LawyerProfile = () => {
  const token = sessionStorage.getItem("token");
  const [data, setData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (!token) {
      toast.error("No authentication token found.");
      return;
    }

    const newSocket = io("http://localhost:4000", {
      auth: { token },
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("connect", () => setIsOnline(true));
    newSocket.on("disconnect", () => setIsOnline(false));
    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast.error("Failed to connect to notification service");
    });

    const fetchData = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
        const response = await axios.get(
          "http://localhost:4000/lawapi/auth/profile",
          { headers }
        );
        setData(response.data.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.error(
          "Failed to load profile: " +
            (error.response?.data?.message || "Network Error")
        );
      }
    };
    fetchData();

    return () => {
      newSocket.off("connect");
      newSocket.off("disconnect");
      newSocket.off("connect_error");
      newSocket.close();
    };
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (event, type) => (data) => {
      setNotifications((prev) => [
        ...prev,
        { ...data, id: Date.now(), type, read: false },
      ]);
      toast.info(
        type === "booking"
          ? `New booking request from user ${data.userName || "a client"}`
          : `New chat request for booking ${data.bookingId}`
      );
    };

    socket.on("booking-notification", handleNotification("booking", "booking"));
    socket.on(
      "incoming-session-request",
      handleNotification("chat-request", "chat-request")
    );

    if (data?.lawyerId) socket.emit("join-lawyer", data.lawyerId);

    return () => {
      socket.off("booking-notification");
      socket.off("incoming-session-request");
    };
  }, [socket, data?.lawyerId]);

  const handleEditClick = () => {
    if (!data) return;
    setEditedData({
      name: data.name || "",
      phone: data.phone || "",
      email: data.email || "",
      city: data.city || "",
      experience: data.experience || "",
      specialization: data.specialization || "",
      consultation_fees: data.consultation_fees || "",
      licenseNumber: data.licenseNumber || "",
      addressline: data.addressline || "",
      practiceArea: data.practiceArea || "",
      profileDescription: data.profileDescription || "",
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    setEditedData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApiCall = async (url, body, successMsg, errorMsg) => {
    if (!data?.lawyerId || !token) return;

    try {
      const response = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.data?.success) {
        setData((prev) => ({ ...prev, ...body }));
        toast.success(successMsg);
        if (body.status && socket)
          socket.emit("lawyer-status-change", {
            lawyerId: data.lawyerId,
            status: body.status,
          });
        if (url.includes("updatelawyer")) setShowModal(false);
      } else {
        toast.error(response.data?.message || errorMsg);
      }
    } catch (error) {
      console.error(`Error ${errorMsg.toLowerCase()}:`, error);
      toast.error(
        `${errorMsg}: ${error.response?.data?.message || "Network Error"}`
      );
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    handleApiCall(
      `http://localhost:4000/lawapi/common/updatelawyer/${data.lawyerId}`,
      editedData,
      "Profile updated successfully",
      "Update failed"
    );
  };

  const handleStatusUpdate = (newStatus) => {
    handleApiCall(
      `http://localhost:4000/lawapi/common/updatelawyer/${data.lawyerId}`,
      { status: newStatus },
      "Status updated successfully!",
      "Failed to update status"
    );
  };

  const handleRequestAction = (notification, event, successMsg) => {
    if (!socket) return;
    socket.emit(event, {
      bookingId: notification.bookingId,
      lawyerId: data.lawyerId,
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );
    toast.success(successMsg);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size should be less than 2MB");
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage || !data?.lawyerId) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("lawyerImage", selectedImage);

    try {
      const response = await axios.post(
        `http://localhost:4000/lawapi/common/updatelawyer/${data.lawyerId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setData({ ...data, lawyerImage: response.data.imagePath });
        toast.success("Profile picture updated successfully!");
        setImagePreview(null);
        setSelectedImage(null);
      } else {
        toast.error(
          response.data.message || "Failed to update profile picture"
        );
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(
        "Error uploading image: " +
          (error.response?.data?.message || "Network Error")
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAcceptRequest = (notification) =>
    handleRequestAction(
      notification,
      "accept-session-request",
      "Session request accepted"
    );
  const handleRejectRequest = (notification) =>
    handleRequestAction(
      notification,
      "reject-session-request",
      "Session request rejected"
    );

  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => setNotifications([]);

  if (!data) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="notification-wrapper">
        <div
          className="notification-bell"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <FaBell size={20} />
          {notifications.filter((n) => !n.read).length > 0 && (
            <span className="notification-badge">
              {notifications.filter((n) => !n.read).length}
            </span>
          )}
          <span className="connection-status" data-online={isOnline}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
        {showNotifications && (
          <div className="notification-dropdown">
            <div className="notification-header">
              <h4>Notifications</h4>
              <button
                className="clear-btn"
                onClick={clearNotifications}
                disabled={!notifications.length}
              >
                Clear All
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="notification-empty">No new notifications</div>
            ) : (
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${
                      notification.read ? "read" : "unread"
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {notification.type === "chat-request" ? (
                      <>
                        <div className="notification-content">
                          <FaUser className="notification-icon" />
                          <div>
                            <p className="notification-title">
                              New Chat Request
                            </p>
                            <p className="notification-message">
                              Booking #{notification.bookingId}
                            </p>
                            <p className="notification-time">
                              {new Date(
                                notification.timestamp || Date.now()
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="notification-actions">
                          <button
                            className="accept-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptRequest(notification);
                            }}
                          >
                            Accept
                          </button>
                          <button
                            className="reject-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectRequest(notification);
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="notification-content">
                        <FaUser className="notification-icon" />
                        <div>
                          <p className="notification-title">New Booking</p>
                          <p className="notification-message">
                            From {notification.userName || "a client"}
                          </p>
                          <p className="notification-time">
                            {new Date(
                              notification.timestamp || Date.now()
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <motion.div
        className="profile-card left"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="profile-header">
          <div className="profile-avatar-container">
            <div className="profile-avatar">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="profile-picture"
                />
              ) : data?.lawyerImage ? (
                <img
                  src={`http://localhost:4000${data.lawyerImage}`}
                  alt={data.name}
                  className="profile-picture"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <FaUser size={40} className="profile-icon" />
              )}
            </div>
            <label htmlFor="profile-upload" className="profile-upload-btn">
              <FaCamera />
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </label>
            {selectedImage && (
              <div className="upload-actions">
                <button
                  onClick={handleImageUpload}
                  disabled={uploadingImage}
                  className="save-image-btn"
                >
                  {uploadingImage ? "Uploading..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  className="cancel-image-btn"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div>
            <h3 className="profile-name">{data.name}</h3>
            <p className="profile-role">{data.role}</p>
            <p className={`profile-status ${data.status.toLowerCase()}`}>
              {data.status}
            </p>
          </div>
        </div>
        <div className="profile-details">
          <MiniRow
            icon={<FaEnvelope />}
            label={data.email || "Not specified"}
          />
          <MiniRow icon={<FaPhone />} label={data.phone || "Not specified"} />
          <MiniRow
            icon={<FaBriefcase />}
            label={`${data.experience || 0} years experience`}
          />
          <MiniRow
            icon={<FaCertificate />}
            label={data.specialization || "Not specified"}
          />
          <MiniRow
            icon={<FaCheckCircle />}
            label={`License: ${data.licenseNumber || "N/A"}`}
          />
          <MiniRow
            icon={<FaCheckCircle />}
            label={`Verified: ${data.isverified ? "Yes" : "No"}`}
          />
          <MiniRow
            icon={<FaInfoCircle />}
            label={`Practice Area: ${data.practiceArea || "Not specified"}`}
          />
        </div>
      </motion.div>

      <motion.div
        className="profile-card right"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="right-header">
          <h2>Professional Profile</h2>
          <div className="status-controls">
            <div className="status-indicator">
              <span
                className={`status-dot ${data.status.toLowerCase()}`}
              ></span>
              <strong>Status: {data.status}</strong>
            </div>
            <select
              value={data.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              className="status-dropdown"
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="busy">Busy</option>
              <option value="in-call">In Call</option>
            </select>
          </div>
        </div>
        <div className="section">
          <h4>Contact Information</h4>
          <InfoRow label="Email" value={data.email || "Not specified"} />
          <InfoRow label="Phone" value={data.phone || "Not specified"} />
          <InfoRow label="City" value={data.city || "Not specified"} />
          <InfoRow
            label="Address"
            value={data.addressline || "Not specified"}
          />
          <button className="edit-btn" onClick={handleEditClick}>
            Edit Profile
          </button>
        </div>
        <div className="section">
          <h4>Professional Details</h4>
          <InfoRow label="Experience" value={`${data.experience || 0} years`} />
          <InfoRow
            label="Specialization"
            value={data.specialization || "Not specified"}
          />
          <InfoRow
            label="Practice Area"
            value={data.practiceArea || "Not specified"}
          />
          <InfoRow
            label="Consultation Fees"
            value={`₹${data.consultation_fees || 0}`}
          />
          <InfoRow label="License Number" value={data.licenseNumber || "N/A"} />
        </div>
        <div className="section">
          <h4>Education</h4>
          {data.education && data.education.length > 0 ? (
            <ul className="education-list">
              {data.education.map((edu, index) => (
                <li key={index} className="education-item">
                  <FaGraduationCap className="education-icon" />
                  <span>{edu}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-education">No education information provided</p>
          )}
        </div>
        <div className="section">
          <h4>Profile Description</h4>
          <div className="profile-description">
            {data.profileDescription || "No description provided"}
          </div>
        </div>
        <div className="section">
          <h4>Account Information</h4>
          <InfoRow label="Lawyer ID" value={data.lawyerId || "N/A"} />
          <InfoRow
            label="Member Since"
            value={new Date(data.created_at || Date.now()).toLocaleDateString()}
          />
          <InfoRow
            label="Account Status"
            value={data.isverified ? "Verified" : "Pending Verification"}
          />
        </div>
      </motion.div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content11">
            <h2>Edit Profile</h2>
            <button className="modal-close" onClick={() => setShowModal(false)}>
              ×
            </button>
            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  name="name"
                  value={editedData.name || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editedData.phone || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editedData.email || ""}
                    onChange={handleInputChange}
                    required
                    disabled
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    name="city"
                    value={editedData.city || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Experience (years)</label>
                  <input
                    type="number"
                    name="experience"
                    value={editedData.experience || ""}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Specialization</label>
                <input
                  name="specialization"
                  value={editedData.specialization || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Practice Area</label>
                  <select
                    name="practiceArea"
                    value={editedData.practiceArea || ""}
                    onChange={handleInputChange}
                    className="form-control"
                  >
                    <option value="">-- Select Practice Area --</option>
                    <option value="Tax Law">Tax Law</option>
                    <option value="Labour & Employment Law">
                      Labour & Employment Law
                    </option>
                    <option value="Banking & Finance Law">
                      Banking & Finance Law
                    </option>
                    <option value="Cyber & IT Law">Cyber & IT Law</option>
                    <option value="Environmental Law">Environmental Law</option>
                    <option value="Immigration Law">Immigration Law</option>
                    <option value="Insurance Law">Insurance Law</option>
                    <option value="Constitutional Law">
                      Constitutional Law
                    </option>
                    <option value="Education Law">Education Law</option>
                    <option value="Health & Medical Law">
                      Health & Medical Law
                    </option>
                    <option value="Election Law">Election Law</option>
                    <option value="Human Rights Law">Human Rights Law</option>
                    <option value="International Law">International Law</option>
                    <option value="Documentary Drafting & Legal Documentation">
                      Documentary Drafting & Legal Documentation
                    </option>
                  </select>
                </div>

                {/* <div className="form-group">
                  <label>Consultation Fees (₹)</label>
                  <input type="number" name="consultation_fees" value={editedData.consultation_fees || ""} onChange={handleInputChange} min="0" />
                </div> */}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>License Number</label>
                  <input
                    name="licenseNumber"
                    value={editedData.licenseNumber || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="addressline"
                  value={editedData.addressline || ""}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Profile Description</label>
                <textarea
                  name="profileDescription"
                  value={editedData.profileDescription || ""}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

const MiniRow = ({ icon, label }) => (
  <div className="mini-row">
    <span className="mini-row-icon">{icon}</span>
    <span className="mini-row-label">{label}</span>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="info-row">
    <span className="info-label">{label}</span>
    <span className="info-value">{value}</span>
  </div>
);

export default LawyerProfile;
