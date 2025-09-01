import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PageTitle from "../../components/PageTitle";

const UserDashboard = () => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    occupation: "",
    legalNeeds: [],
    cases: [],
    appointments: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [meetingCount, setMeetingCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);

  const API_BASE = "http://localhost:4000/lawapi";

  useEffect(() => {
    const fetchMeetingAndRequestCounts = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const loggedUser = JSON.parse(sessionStorage.getItem("userData"));
        if (!loggedUser?.userId) return;

        const meetingRes = await axios.get(
          `${API_BASE}/common/userhistory/${loggedUser.userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const completedMeetings = Array.isArray(meetingRes.data)
          ? meetingRes.data.filter(
              (m) => m.userId === loggedUser.userId && m.status !== "requested"
            )
          : [];

        setMeetingCount(completedMeetings.length);

        const requestRes = await axios.get(
          `${API_BASE}/common/userrequest/${loggedUser.userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const requests = Array.isArray(requestRes.data?.requests)
          ? requestRes.data.requests
          : [];

        setRequestCount(requests.length);
      } catch (err) {
        console.error("❌ Error fetching meeting/request data:", err);
        setMeetingCount(0);
        setRequestCount(0);
      }
    };

    const fetchUserData = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const loggedUser = JSON.parse(sessionStorage.getItem("userData"));

        if (!loggedUser?._id) throw new Error("User ID not found in session");

        const response = await axios.get(`${API_BASE}/common/alluser`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allUsers = response.data.data;
        const currentUser = allUsers.find((u) => u._id === loggedUser._id);

        if (!currentUser) throw new Error("User not found in fetched data");

        setUserData({
          ...currentUser,
          legalNeeds: Array.isArray(currentUser.legalNeeds)
            ? currentUser.legalNeeds
            : [currentUser.legalNeeds].filter(Boolean),
          cases: Array.isArray(currentUser.cases) ? currentUser.cases : [],
          appointments: Array.isArray(currentUser.appointments)
            ? currentUser.appointments
            : [],
        });
      } catch (error) {
        console.error("❌ Error fetching user data:", error);
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Failed to load user data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetingAndRequestCounts();
    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-80">
        <div
          className="spinner-border text-primary"
          style={{ width: "3rem", height: "3rem" }}
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageTitle page="Client Dashboard" />
      <div className="container-fluid py-4 px-3 px-md-5">
        <ToastContainer position="top-center" autoClose={3000} />

        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-0 text-dark font-weight-bold">
              {userData.name}
            </h1>
            <p className="text-muted mb-0">Client Dashboard</p>
          </div>
          <div className="badge  text-blue-700 px-3 py-2 rounded-pill">
            <i className="fas fa-user-tie me-2"></i>
            Client ID: {userData._id?.substring(0, 8) || "N/A"}
          </div>
        </div>

        <div className="row">
          {/* Profile Card */}
          <div className="col-md-4 mb-4">
            <div
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: "12px" }}
            >
              <div
                className="card-header bg-white border-bottom-0 pb-0"
                style={{ borderRadius: "12px 12px 0 0" }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <h3 className="h5 mb-0 text-dark font-weight-bold">
                    Your Profile
                  </h3>
                  {/* <button className="btn btn-sm btn-outline-primary rounded-pill">
                    <i className="fas fa-edit me-1"></i> Edit
                  </button> */}
                </div>
              </div>
              <div className="card-body pt-0">
                {/* Profile Picture */}
                <div className="text-center mb-4">
                  <div className="avatar-container mx-auto mb-3">
                    <div
                      className="avatar-placeholder bg-gradient-[#000080] rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "100px",
                        height: "100px",
                        background:
                          "linear-gradient(135deg, #1c1c84 0%, #3A7CBA 100%)",
                      }}
                    >
                      <i
                        className="fas fa-user text-white"
                        style={{ fontSize: "2.5rem" }}
                      ></i>
                    </div>
                  </div>
                  <h4 className="mb-1 text-dark font-weight-bold">
                    {userData.name}
                  </h4>
                  <p className="text-muted mb-3">{userData.email}</p>
                </div>

                {/* Stats Cards */}
                <div className="row g-2 mb-4">
                  <div className="col-6">
                    <div
                      className="card border-0 rounded-3 p-2 h-100"
                      style={{ background: "rgba(30, 77, 122, 0.1)" }}
                    >
                      <div className="card-body text-center py-2">
                        <div className="fs-4 fw-bold text-[#000080]">
                          {meetingCount + requestCount}
                        </div>
                        <div className="text-muted small">Total Cases</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div
                      className="card border-0 rounded-3 p-2 h-100"
                      style={{ background: "rgba(40, 167, 69, 0.1)" }}
                    >
                      <div className="card-body text-center py-2">
                        <div className="fs-4 fw-bold text-success">
                          {meetingCount}
                        </div>
                        <div className="text-muted small">Meetings</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div
                  className="card border-0 rounded-3"
                  style={{ background: "#f8f9fa" }}
                >
                  <div className="card-body">
                    <h5 className="h6 mb-3 text-dark font-weight-bold">
                      <i className="fas fa-info-circle me-2 text-primary"></i>
                      Contact Information
                    </h5>
                    <ul className="list-unstyled mb-0">
                      <li className="mb-2 d-flex align-items-center">
                        <i
                          className="fas fa-briefcase me-2 text-muted"
                          style={{ width: "20px" }}
                        ></i>
                        <span>{userData.occupation || "Not specified"}</span>
                      </li>
                      <li className="mb-2 d-flex align-items-center">
                        <i
                          className="fas fa-phone me-2 text-muted"
                          style={{ width: "20px" }}
                        ></i>
                        <span>{userData.phone || "Not provided"}</span>
                      </li>
                      <li className="d-flex align-items-center">
                        <i
                          className="fas fa-map-marker-alt me-2 text-muted"
                          style={{ width: "20px" }}
                        ></i>
                        <span>
                          {[userData.city, userData.state]
                            .filter(Boolean)
                            .join(", ") || "Location not specified"}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Legal Needs */}
                {userData.legalNeeds?.length > 0 && (
                  <div className="mt-4">
                    <h5 className="h6 mb-3 text-dark font-weight-bold">
                      <i className="fas fa-gavel me-2 text-primary"></i>
                      Legal Needs
                    </h5>
                    <div className="d-flex flex-wrap gap-2">
                      {userData.legalNeeds.map((need, index) => (
                        <span
                          key={index}
                          className="badge bg-light text-dark border"
                        >
                          {need}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="col-md-8">
            <div
              className="card border-0 shadow-sm h-100"
              style={{ borderRadius: "12px" }}
            >
              <div
                className="card-header bg-white border-bottom-0"
                style={{ borderRadius: "12px 12px 0 0" }}
              >
                <h3 className="h5 mb-0 text-dark font-weight-bold">
                  <i className="fas fa-clock me-2 text-primary"></i>
                  Recent Activity
                </h3>
              </div>
              <div className="card-body">
                {userData.appointments?.length > 0 ? (
                  <div className="timeline">
                    {userData.meetingCount.slice(0, 5).map((appt, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-badge bg-primary"></div>
                        <div className="timeline-panel">
                          <div className="timeline-heading">
                            <h5 className="timeline-title">
                              {appt.title || "Meeting"}
                            </h5>
                            <p className="text-muted small mb-1">
                              <i className="fas fa-calendar-alt me-1"></i>
                              {new Date(appt.date).toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="timeline-body">
                            <p className="mb-0">
                              {appt.description || "No description provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="fas fa-calendar-alt fa-3x text-muted mb-3"></i>
                    <h5 className="text-dark">No Recent Activity</h5>
                    <p className="text-muted">
                      No appointments or meetings scheduled yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        .avatar-placeholder {
          transition: transform 0.3s ease;
        }
        .avatar-placeholder:hover {
          transform: scale(1.05);
        }
        .timeline {
          position: relative;
          padding-left: 30px;
        }
        .timeline-item {
          position: relative;
          margin-bottom: 20px;
        }
        .timeline-badge {
          position: absolute;
          left: -15px;
          top: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #ddd;
        }
        .timeline-panel {
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          position: relative;
        }
        .timeline-panel:before {
          content: "";
          position: absolute;
          left: -8px;
          top: 15px;
          width: 0;
          height: 0;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          border-right: 8px solid #f8f9fa;
        }
        .timeline-title {
          font-weight: 600;
          color: #1c1c84;
        }
        .badge {
          transition: all 0.3s ease;
        }
        .badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </>
  );
};

export default UserDashboard;
