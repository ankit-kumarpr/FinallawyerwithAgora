import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AuthAnimation.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

import WebNav from "../components/Web-nav/WebNav";
const AuthPage = () => {
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [isRegisterVisible, setIsRegisterVisible] = useState(true);
  const [animationDirection, setAnimationDirection] = useState("left");
  const navigate = useNavigate();

  // Registration state
  const [userRole, setUserRole] = useState("user");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false);

  const [formData, setFormData] = useState({
    role: "user",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // addressline: '',
    // city: '',
    // purpose: '',
    licenseNumber: "",
    experience: "",
    specialization: "",
  });

  // Login state
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const API_URL1 = "https://lawyerwork.onrender.com/lawapi/auth";
  const API_URL = "https://lawyerwork.onrender.com/lawapi/auth/register";
  const redirect = new URLSearchParams(location.search).get("redirect");

  // Toggle between login and registration with animation
  const toggleAuthForms = (direction) => {
    setAnimationDirection(direction);

    if (direction === "left") {
      setIsLoginVisible(true);
      setTimeout(() => setIsRegisterVisible(false), 300);
    } else {
      setIsRegisterVisible(true);
      setTimeout(() => setIsLoginVisible(false), 300);
    }
  };

  // Registration handlers (keep the same logic)
  const handleRoleChange = (e) => {
    const role = e.target.value;
    setUserRole(role);
    setFormData({
      ...formData,
      role: role,
      licenseNumber: role === "lawyer" ? formData.licenseNumber : "",
      experience: role === "lawyer" ? formData.experience : "",
      specialization: role === "lawyer" ? formData.specialization : "",
      // purpose: role === 'user' ? formData.purpose : '',
      addressline: role !== "admin" ? formData.addressline : "",
      city: role !== "admin" ? formData.city : "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateRegistrationForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return false;
    }

    if (userRole === "lawyer") {
      if (
        !formData.licenseNumber ||
        !formData.experience ||
        !formData.specialization
      ) {
        toast.error("Please fill all required fields for lawyer registration");
        return false;
      }
    }

    // if (userRole === 'user' && !formData.purpose) {
    //   toast.error('Please specify your purpose');
    //   return false;
    // }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateRegistrationForm()) return;
    setIsSubmitting(true);

    try {
      let submissionData;

      if (userRole === "admin") {
        submissionData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
        };
      } else if (userRole === "lawyer") {
        submissionData = {
          role: formData.role,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone.toString(), // 🔧 FIXED
          licenseNumber: formData.licenseNumber,
          experience: formData.experience,
          specialization: formData.specialization,
        };
      } else {
        // user
        submissionData = {
          role: formData.role,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          // addressline: formData.addressline,
          // city: formData.city,
          // purpose: formData.purpose
        };
      }

      const response = await axios.post(API_URL, submissionData);

      if (response.data.success) {
        toast.success(
          "Registration successful! Please login with your credentials."
        );

        // Reset form but keep email and role for auto-fill
        setFormData({
          role: "user",
          name: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          // addressline: '',
          // city: '',
          // purpose: '',
          licenseNumber: "",
          experience: "",
          specialization: "",
        });

        // Auto-fill login form and switch
        setCredentials({
          email: submissionData.email, // Pre-fill registered email
          password: "", // Clear password field
          role: submissionData.role, // Pre-fill registered role
        });

        // Automatically switch to login form
        setIsLoginVisible(true);
        setIsRegisterVisible(false);
        setAnimationDirection("left");
      } else {
        toast.error(response.data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error.response?.data?.message || "An error occurred during registration"
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  // Login handlers
  const handleLoginChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_URL1}/login`, credentials);

      if (
        response.data.message &&
        response.data.message.includes("successful")
      ) {
        sessionStorage.setItem("token", response.data.accessToken);
        sessionStorage.setItem(
          "role",
          response.data.user?.role || credentials.role
        );
        sessionStorage.setItem("userData", JSON.stringify(response.data.user));
        console.log("Logged in user:", response.data.user);

        toast.success("Login successful!");
        const userRole = response.data.user?.role || credentials.role;

        // Check if there's a redirect path in the URL
        const redirectPath = new URLSearchParams(window.location.search).get(
          "redirect"
        );

        // Define default role-based paths
        const targetPath =
          {
            admin: "/admin/lawyerManagement",
            lawyer: "/lawyer/dashboard",
            user: "/user/FindLawyer",
          }[userRole.toLowerCase()] || "/";

        // Redirect to saved redirectPath or default dashboard
        navigate(redirectPath || targetPath);
      } else {
        setError(response.data.message || "Login failed.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="auth-page"
      style={{
        background: "white",
        minHeight: "100vh",
        padding: "1rem 0",
        overflow: "hidden",
        marginTop: "17px",
      }}
    >
      <WebNav />
      <ToastContainer position="top-center" autoClose={5000} />
      <div className="container">
        <div className="row align-items-center">
          {/* Image Section (Left Column) */}
          <div className="col-lg-6 d-none d-lg-block h-100">
            <div className="h-100 d-flex flex-column justify-content-center p-4">
              <div
                className="position-relative h-100"
                style={{ minHeight: "80vh" }}
              >
                <img
                  src="images/law1.jpg"
                  alt="Legal Services Illustration"
                  className="img-fluid rounded shadow h-100 w-100"
                  style={{
                    objectFit: "cover",
                    opacity: 0.9,
                    filter: "brightness(0.95)",
                  }}
                />
                <div
                  className="position-absolute bottom-0 start-0 end-0 p-4 text-white"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
                    borderBottomLeftRadius: "15px",
                    borderBottomRightRadius: "15px",
                  }}
                >
                  <h3 className="fw-bold">
                    Find Your Legal Solution with Lawyer10On10
                  </h3>
                  <p className="mb-0">
                    Connect with expert lawyers for your legal needs
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Auth Form Section (Right Column) */}
          <div className="col-lg-6 col-md-12">
            {/* Registration Form */}
            <div
              className={`auth-form-container ${
                isRegisterVisible ? "active" : ""
              } ${
                animationDirection === "right"
                  ? "slide-out-right"
                  : "slide-in-right"
              }`}
              style={{ display: isRegisterVisible ? "block" : "none" }}
            >
              <div
                className="card shadow-lg border-0"
                style={{
                  borderRadius: "15px",
                  overflow: "hidden",
                  border: "none",
                }}
              >
                <div
                  className="card-header py-3"
                  style={{
                    background: "#1c1c84",
                    color: "white",
                  }}
                >
                  <h3
                    className="text-center mb-0"
                    style={{ fontWeight: "600", fontSize: "1.5rem" }}
                  >
                    <i className="fas fa-user-plus me-2"></i>
                    Create Account
                  </h3>
                </div>
                <div
                  className="card-body p-4"
                  style={{ backgroundColor: "#f8f9fa" }}
                >
                  <form onSubmit={handleRegister}>
                    {/* Role Selection */}
                    <div className="form-group mb-3">
                      <label
                        className="d-block mb-2 fw-bold"
                        style={{ fontSize: "0.9rem" }}
                      >
                        I am registering as:
                      </label>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={`btn ${
                            userRole === "user"
                              ? "btn-dark"
                              : "btn-outline-dark"
                          } btn-sm rounded-pill px-3`}
                          onClick={() =>
                            handleRoleChange({ target: { value: "user" } })
                          }
                        >
                          <i className="fas fa-user me-1"></i> Customer
                        </button>
                        {/* <button
                          type="button"
                          className={`btn ${userRole === 'admin' ? 'btn-dark' : 'btn-outline-dark'} btn-sm rounded-pill px-3`}
                          onClick={() => handleRoleChange({ target: { value: 'admin' } })}
                        >
                          <i className="fas fa-user-shield me-1"></i> Admin
                        </button> */}
                        <button
                          type="button"
                          className={`btn ${
                            userRole === "lawyer"
                              ? "btn-dark"
                              : "btn-outline-dark"
                          } btn-sm rounded-pill px-3`}
                          onClick={() =>
                            handleRoleChange({ target: { value: "lawyer" } })
                          }
                        >
                          <i className="fas fa-gavel me-1"></i> Lawyer
                        </button>
                      </div>
                    </div>

                    {/* Basic Information - 3 columns */}
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group mb-2">
                          <label
                            className="fw-bold"
                            style={{ fontSize: "0.9rem" }}
                          >
                            Full Name <span className="text-danger">*</span>
                          </label>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-white">
                              <i
                                className="fas fa-user text-primary"
                                style={{ fontSize: "0.8rem" }}
                              ></i>
                            </span>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              required={userRole !== "admin"}
                              placeholder="John Doe"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group mb-2">
                          <label
                            className="fw-bold"
                            style={{ fontSize: "0.9rem" }}
                          >
                            Email <span className="text-danger">*</span>
                          </label>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-white">
                              <i
                                className="fas fa-envelope text-primary"
                                style={{ fontSize: "0.8rem" }}
                              ></i>
                            </span>
                            <input
                              type="email"
                              className="form-control form-control-sm"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                              placeholder="example@domain.com"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group mb-2">
                          <label
                            className="fw-bold"
                            style={{ fontSize: "0.9rem" }}
                          >
                            Phone <span className="text-danger">*</span>
                          </label>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-white">
                              <i
                                className="fas fa-phone text-primary"
                                style={{ fontSize: "0.8rem" }}
                              ></i>
                            </span>
                            <input
                              type="tel"
                              className="form-control form-control-sm"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              required
                              placeholder="+1 234 567 890"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Password Section - 3 columns */}
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group mb-2">
                          <label
                            className="fw-bold"
                            style={{ fontSize: "0.9rem" }}
                          >
                            Password <span className="text-danger">*</span>
                          </label>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-white">
                              <i
                                className="fas fa-lock text-primary"
                                style={{ fontSize: "0.8rem" }}
                              ></i>
                            </span>
                            <input
                              type={showRegisterPassword ? "text" : "password"}
                              className="form-control form-control-sm"
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              required
                              minLength="6"
                              placeholder="••••••"
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() =>
                                setShowRegisterPassword(!showRegisterPassword)
                              }
                            >
                              {showRegisterPassword ? (
                                <FaEyeSlash size={14} />
                              ) : (
                                <FaEye size={14} />
                              )}
                            </button>
                          </div>
                          <small
                            className="text-muted"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Min 6 characters
                          </small>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group mb-2">
                          <label
                            className="fw-bold"
                            style={{ fontSize: "0.9rem" }}
                          >
                            Confirm Password{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-white">
                              <i
                                className="fas fa-lock text-primary"
                                style={{ fontSize: "0.8rem" }}
                              ></i>
                            </span>
                            <input
                              type={
                                showRegisterConfirmPassword
                                  ? "text"
                                  : "password"
                              }
                              className="form-control form-control-sm"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              required
                              placeholder="••••••"
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() =>
                                setShowRegisterConfirmPassword(
                                  !showRegisterConfirmPassword
                                )
                              }
                            >
                              {showRegisterConfirmPassword ? (
                                <FaEyeSlash size={14} />
                              ) : (
                                <FaEye size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* {(userRole === 'user' || userRole === 'lawyer') && (
                        <div className="col-md-4">
                          <div className="form-group mb-2">
                            <label className="fw-bold" style={{ fontSize: '0.9rem' }}>City <span className="text-danger">*</span></label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text bg-white">
                                <i className="fas fa-city text-primary" style={{ fontSize: '0.8rem' }}></i>
                              </span>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                name="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                required={userRole === 'lawyer'}
                                placeholder="New York"
                              />
                            </div>
                          </div>
                        </div>
                      )} */}
                    </div>

                    {/* Address Section - Full width */}
                    {/* {(userRole === 'user' || userRole === 'lawyer') && (
                      <div className="form-group mb-2">
                        <label className="fw-bold" style={{ fontSize: '0.9rem' }}>Address</label>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-white">
                            <i className="fas fa-map-marker-alt text-primary" style={{ fontSize: '0.8rem' }}></i>
                          </span>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            name="addressline"
                            value={formData.addressline}
                            onChange={handleInputChange}
                            required={userRole === 'lawyer'}
                            placeholder="123 Main St"
                          />
                        </div>
                      </div>
                    )} */}

                    {/* Purpose Section - Full width */}
                    {/* {userRole === 'user' && (
                      <div className="form-group mb-2">
                        <label className="fw-bold" style={{ fontSize: '0.9rem' }}>Purpose <span className="text-danger">*</span></label>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-white">
                            <i className="fas fa-comment-dots text-primary" style={{ fontSize: '0.8rem' }}></i>
                          </span>
                          <textarea
                            className="form-control form-control-sm"
                            name="purpose"
                            value={formData.purpose}
                            onChange={handleInputChange}
                            rows="2"
                            required
                            placeholder="Briefly describe your purpose..."
                            style={{ fontSize: '0.9rem' }}
                          />
                        </div>
                      </div>
                    )} */}

                    {/* Lawyer-specific Fields - 3 columns */}
                    {userRole === "lawyer" && (
                      <div className="row">
                        <div className="col-md-4">
                          <div className="form-group mb-2">
                            <label
                              className="fw-bold"
                              style={{ fontSize: "0.9rem" }}
                            >
                              License No. <span className="text-danger">*</span>
                            </label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text bg-white">
                                <i
                                  className="fas fa-id-card text-primary"
                                  style={{ fontSize: "0.8rem" }}
                                ></i>
                              </span>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                name="licenseNumber"
                                value={formData.licenseNumber}
                                onChange={handleInputChange}
                                required
                                placeholder="LAW-123456"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="form-group mb-2">
                            <label
                              className="fw-bold"
                              style={{ fontSize: "0.9rem" }}
                            >
                              Experience <span className="text-danger">*</span>
                            </label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text bg-white">
                                <i
                                  className="fas fa-briefcase text-primary"
                                  style={{ fontSize: "0.8rem" }}
                                ></i>
                              </span>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                name="experience"
                                value={formData.experience}
                                onChange={handleInputChange}
                                required
                                placeholder="5 years"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="form-group mb-2">
                            <label
                              className="fw-bold"
                              style={{ fontSize: "0.9rem" }}
                            >
                              Specialization{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text bg-white">
                                <i
                                  className="fas fa-star text-primary"
                                  style={{ fontSize: "0.8rem" }}
                                ></i>
                              </span>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                name="specialization"
                                value={formData.specialization}
                                onChange={handleInputChange}
                                required
                                placeholder="Criminal Law"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="form-group mt-3">
                      <button
                        type="submit"
                        className="btn btn-primary w-100 py-2 fw-bold"
                        disabled={isSubmitting}
                        style={{
                          background: "#1c1c84",
                          border: "none",
                          borderRadius: "5px",
                          fontSize: "0.9rem",
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Registering...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-user-plus me-2"></i> Register
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-center mt-2">
                      <p className="mb-0" style={{ fontSize: "0.9rem" }}>
                        Already have an account?{" "}
                        <button
                          type="button"
                          className="text-primary fw-bold ms-1 btn btn-link p-0 border-0"
                          onClick={() => toggleAuthForms("left")}
                          style={{ fontSize: "0.9rem" }}
                        >
                          Sign In
                        </button>
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <div
              className={`auth-form-container ${
                isLoginVisible ? "active" : ""
              } ${
                animationDirection === "left"
                  ? "slide-out-left"
                  : "slide-in-left"
              }`}
              style={{ display: isLoginVisible ? "block" : "none" }}
            >
              <div
                className="card shadow-lg border-0"
                style={{
                  borderRadius: "15px",
                  overflow: "hidden",
                  border: "none",
                }}
              >
                <div
                  className="card-header py-3"
                  style={{
                    background: "#1c1c84",
                    color: "white",
                  }}
                >
                  <h3
                    className="text-center mb-0"
                    style={{ fontWeight: "600", fontSize: "1.5rem" }}
                  >
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Welcome Back
                  </h3>
                </div>
                <div
                  className="card-body p-4"
                  style={{ backgroundColor: "#f8f9fa" }}
                >
                  <form onSubmit={handleLogin}>
                    {error && (
                      <div
                        className="alert alert-danger py-2"
                        style={{ fontSize: "0.9rem" }}
                      >
                        {error}
                      </div>
                    )}

                    <div className="form-group mb-2">
                      <label className="fw-bold" style={{ fontSize: "0.9rem" }}>
                        Role <span className="text-danger">*</span>
                      </label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white">
                          <i
                            className="fas fa-user-tag text-primary"
                            style={{ fontSize: "0.8rem" }}
                          ></i>
                        </span>
                        <select
                          className="form-control form-control-sm"
                          name="role"
                          value={credentials.role || ""}
                          onChange={handleLoginChange}
                          required
                        >
                          <option value="">Select role</option>
                          <option value="user">Customer</option>
                          <option value="admin">Admin</option>
                          <option value="lawyer">Lawyer</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group mb-2">
                      <label className="fw-bold" style={{ fontSize: "0.9rem" }}>
                        Email <span className="text-danger">*</span>
                      </label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white">
                          <i
                            className="fas fa-envelope text-primary"
                            style={{ fontSize: "0.8rem" }}
                          ></i>
                        </span>
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          name="email"
                          value={credentials.email}
                          onChange={handleLoginChange}
                          required
                          placeholder="example@domain.com"
                        />
                      </div>
                    </div>

                    <div className="form-group mb-2">
                      <label className="fw-bold" style={{ fontSize: "0.9rem" }}>
                        Password <span className="text-danger">*</span>
                      </label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white">
                          <i
                            className="fas fa-lock text-primary"
                            style={{ fontSize: "0.8rem" }}
                          ></i>
                        </span>
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          className="form-control form-control-sm"
                          name="password"
                          value={credentials.password}
                          onChange={handleLoginChange}
                          required
                          placeholder="••••••"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() =>
                            setShowLoginPassword(!showLoginPassword)
                          }
                        >
                          {showLoginPassword ? (
                            <FaEyeSlash size={14} />
                          ) : (
                            <FaEye size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="form-group mt-3">
                      <button
                        type="submit"
                        className="btn btn-primary w-100 py-2 fw-bold"
                        disabled={loading}
                        style={{
                          background: "#1c1c84",
                          border: "none",
                          borderRadius: "5px",
                          fontSize: "0.9rem",
                        }}
                      >
                        {loading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Logging in...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-sign-in-alt me-2"></i> Login
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-center mt-2">
                      <p className="mb-0" style={{ fontSize: "0.9rem" }}>
                        Don't have an account?{" "}
                        <button
                          type="button"
                          className="text-primary fw-bold ms-1 btn btn-link p-0 border-0"
                          onClick={() => toggleAuthForms("right")}
                          style={{ fontSize: "0.9rem" }}
                        >
                          Register
                        </button>
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
