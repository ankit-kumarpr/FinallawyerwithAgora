import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ClientProfile = () => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    occupation: "",
    legalNeeds: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const API_BASE = "https://lawyerwork.onrender.com/lawapi";

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const loggedUser = JSON.parse(sessionStorage.getItem("userData"));

        if (!loggedUser?._id) {
          throw new Error("User ID not found in session");
        }

        const response = await axios.get(`${API_BASE}/common/alluser`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const allUsers = response.data.data;
        const currentUser = allUsers.find(
          (user) => user._id === loggedUser._id
        );

        if (currentUser) {
          setUserData({
            ...currentUser,
            legalNeeds: Array.isArray(currentUser.legalNeeds)
              ? currentUser.legalNeeds
              : [currentUser.legalNeeds].filter(Boolean),
          });
        } else {
          toast.error("Profile not found");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error(error.message || "Error loading profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLegalNeedChange = (e) => {
    const { value, checked } = e.target;
    setUserData((prev) => ({
      ...prev,
      legalNeeds: checked
        ? [...prev.legalNeeds, value]
        : prev.legalNeeds.filter((need) => need !== value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem("token");
      const userId = userData._id;
      setIsLoading(true);

      const response = await axios.put(
        `${API_BASE}/user/update/${userId}`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Profile updated successfully");
        setIsEditing(false);
        sessionStorage.setItem("userData", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Error updating profile");
    } finally {
      setIsLoading(false);
    }
  };

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

  const legalNeedsOptions = [
    "Family Law",
    "Real Estate",
    "Business Contracts",
    "Estate Planning",
    "Employment Issues",
    "Consumer Protection",
    "Immigration",
    "Other Legal Matters",
  ];

  return (
    <div className="container-fluid py-4 px-3 px-md-5">
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10 col-xl-8">
          <div className="card shadow-sm border-0">
            <div
              className="card-header  text-white py-3"
              style={{ backgroundColor: "#1c1c84" }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <h2 className="h4 mb-0">
                  <i className="fas fa-user me-2"></i>
                  My Profile
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-light btn-sm"
                  >
                    <i className="fas fa-edit me-1"></i> Edit Profile
                  </button>
                )}
              </div>
            </div>

            <div className="card-body p-0">
              {!isEditing ? (
                <div className="p-4">
                  <div className="text-center mb-4">
                    <div className="avatar-container mx-auto">
                      <div className="avatar-placeholder">
                        <i className="fas fa-user"></i>
                      </div>
                    </div>
                    <h3 className="mt-3 mb-1">{userData.name}</h3>
                    <p className="text-muted mb-3">{userData.email}</p>
                    {userData.occupation && (
                      <p className="text-muted">
                        <i className="fas fa-briefcase me-2"></i>
                        {userData.occupation}
                      </p>
                    )}
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="profile-info-card">
                        <h6 className="info-label">Contact Number</h6>
                        <p className="info-value">
                          <i className="fas fa-phone me-2"></i>
                          {userData.phone || "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="profile-info-card">
                        <h6 className="info-label">Location</h6>
                        <p className="info-value">
                          <i className="fas fa-map-marker-alt me-2"></i>
                          {[userData.city, userData.state]
                            .filter(Boolean)
                            .join(", ") || "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="profile-info-card">
                        <h6 className="info-label">Address</h6>
                        <p className="info-value">
                          <i className="fas fa-home me-2"></i>
                          {userData.address || "Not provided"}
                        </p>
                      </div>
                    </div>
                    {userData.legalNeeds?.length > 0 && (
                      <div className="col-12">
                        <div className="profile-info-card">
                          <h6 className="info-label">Legal Interests</h6>
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {userData.legalNeeds.map((need, index) => (
                              <span key={index} className="badge bg-secondary">
                                {need}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Full Name*</label>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={userData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={userData.email}
                          disabled
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Phone Number*</label>
                        <input
                          type="tel"
                          className="form-control"
                          name="phone"
                          value={userData.phone}
                          onChange={handleInputChange}
                          pattern="[0-9]{10}"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">Occupation</label>
                        <input
                          type="text"
                          className="form-control"
                          name="occupation"
                          value={userData.occupation}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">City*</label>
                        <input
                          type="text"
                          className="form-control"
                          name="city"
                          value={userData.city}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="form-label">State*</label>
                        <input
                          type="text"
                          className="form-control"
                          name="state"
                          value={userData.state}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">Address*</label>
                        <input
                          type="text"
                          className="form-control"
                          name="address"
                          value={userData.address}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    {/* <div className="col-12">
                      <div className="form-group">
                        <label className="form-label">Legal Needs</label>
                        <div className="row g-2">
                          {legalNeedsOptions.map((need) => (
                            <div key={need} className="col-12 col-md-6 col-lg-4">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`need-${need}`}
                                  value={need}
                                  checked={userData.legalNeeds?.includes(need)}
                                  onChange={handleLegalNeedChange}
                                />
                                <label className="form-check-label" htmlFor={`need-${need}`}>
                                  {need}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div> */}
                  </div>

                  <div className="d-flex justify-content-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn btn-outline-secondary px-4"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-outline-secondary px-4"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-2"></i>
                          Save Profile
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .avatar-container {
          width: 120px;
          height: 120px;
          position: relative;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: #f0f8ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          color: #0d6efd;
          border: 3px solid #e0e0e0;
        }

        .profile-info-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          height: 100%;
          border-left: 4px solid #0d6efd;
        }

        .info-label {
          color: #495057;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .info-value {
          color: #212529;
          font-size: 1rem;
          margin-bottom: 0;
          display: flex;
          align-items: center;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          font-weight: 500;
          color: #495057;
          margin-bottom: 8px;
        }

        .form-control,
        .form-select {
          border-radius: 4px;
          padding: 10px 15px;
          border: 1px solid #ced4da;
        }

        .form-control:focus,
        .form-select:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }

        .form-check-input:checked {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }

        @media (max-width: 767.98px) {
          .avatar-container {
            width: 100px;
            height: 100px;
          }

          .avatar-placeholder {
            font-size: 2.5rem;
          }
        }

        @media (max-width: 575.98px) {
          .container-fluid {
            padding-left: 15px;
            padding-right: 15px;
          }

          .card-header h2 {
            font-size: 1.25rem;
          }

          .profile-info-card {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default ClientProfile;
