import React, { useState } from "react";
import { Modal, Button, Tab, Tabs } from "react-bootstrap";
import PaymentModal from "./PaymentModal";
import ChatBox from "../../components/ChatBox";
import Swal from "sweetalert2";

import {
  FaUserTie,
  FaStar,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaLanguage,
  FaMoneyBillWave,
  FaClock,
  FaPhone,
  FaCommentDots,
  FaVideo,
  FaCheckCircle,
  FaTimesCircle,
  FaCertificate,
} from "react-icons/fa";

const LawyerProfileModal = ({ show, handleClose, lawyer }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  console.log(
    "🔐 sessionToken (inside LawyerProfileModal):",
    sessionStorage.getItem("token")
  );
  const handleOpenPayment = (serviceType) => {
    setSelectedService(serviceType);
    setShowPaymentModal(true);
  };
  const handlevideoCall = () => {
    setSelectedService("video");
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentResult) => {
    // For video calls, don't close the modal - let it show the video call UI
    if (selectedService === "video" || selectedService === "call") {
      console.log(
        "🎉 Video call payment successful! Modal will stay open for video call UI."
      );
      return; // Don't close modal for video calls
    }

    // For other services, close the modal
    setShowPaymentModal(false);

    if (selectedService === "chat") {
      setActiveSession({
        sessionToken: paymentResult.sessionToken,
        duration: paymentResult.durationMinutes,
        lawyer: lawyer,
        bookingId: paymentResult.bookingId,
      });
      setShowChatModal(true);
    } else if (selectedService === "call") {
      // Open phone dialer on mobile
      Swal.fire({
        toast: true,
        icon: "success",
        title: "Connecting call...",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
      });

      if (lawyer?.phone) {
        window.location.href = `tel:${lawyer.phone}`;
      } else {
        Swal.fire({
          icon: "error",
          title: "Phone Number Not Available",
          text: "The lawyer does not have a phone number listed.",
          confirmButtonColor: "#1c1c84",
        });
      }
    } else {
      Swal.fire({
        icon: "success",
        title: "Session Scheduled",
        text: `${
          selectedService.charAt(0).toUpperCase() + selectedService.slice(1)
        } session scheduled successfully!`,
        confirmButtonColor: "#1c1c84",
      }).then(() => {
        handleClose();
      });
    }
  };

  const handleChatClose = () => {
    setShowChatModal(false);
    handleClose();
  };

  const lawyerImageUrl = lawyer?.lawyerImage
    ? `https://lawyerwork.onrender.com${lawyer.lawyerImage}`
    : null;

  return (
    <>
      <Modal
        show={show && !showChatModal}
        onHide={handleClose}
        size="lg"
        centered
        backdrop={showChatModal ? "static" : true}
      >
        <Modal.Header
          closeButton
          style={{ background: "#1c1c84", color: "white" }}
        >
          <Modal.Title>Lawyer Profile</Modal.Title>
        </Modal.Header>

        <Modal.Body
          style={{ maxHeight: "70vh", overflowY: "auto", padding: "0" }}
        >
          <div className="row m-0">
            <div
              className="col-12 col-md-4 text-center p-4"
              style={{ background: "#ff9fa" }}
            >
              <div className="lawyer-avatar">
                {lawyerImageUrl ? (
                  <img
                    src={lawyerImageUrl}
                    alt={lawyer?.name || "Lawyer"}
                    className="img-fluid rounded-circle"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    <FaUserTie size={50} color="#1c1c84" />
                  </div>
                )}
              </div>
              <h4 className="lawyer-name">{lawyer?.name}</h4>
              <p className="lawyer-title">{lawyer?.specialization}</p>

              <div className="rating-experience">
                <div className="rating">
                  <div className="stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FaStar
                        key={i}
                        color={
                          i < (lawyer?.rating || 0) ? "#E8B63A" : "#6c757d"
                        }
                      />
                    ))}
                  </div>
                  {/* <div className="rating-text">{lawyer?.reviews?.length || 0} reviews</div> */}
                </div>

                <div className="experience">
                  <div className="years">{lawyer?.experience || "0"}+</div>
                  <div className="label">Years Exp.</div>
                </div>
              </div>

              <div className="d-flex justify-content-center gap-2 mb-3">
                <span
                  className={`verified-badge badge ${
                    lawyer?.isverified ? "bg-success" : "bg-secondary"
                  } d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill text-white`}
                >
                  {lawyer?.isverified ? <FaCheckCircle /> : <FaTimesCircle />}{" "}
                  {lawyer?.isverified ? "Verified" : "Not Verified"}
                </span>

                <span className="specialization-badge badge bg-primary d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill text-white">
                  <FaCertificate /> {lawyer?.licenseNumber}
                </span>
              </div>

              <div className="lawyer-location">
                <FaMapMarkerAlt className="me-2" /> {lawyer?.city},{" "}
                {lawyer?.state}
              </div>
            </div>

            <div className="col-12 col-md-8 p-4">
              <Tabs defaultActiveKey="profile" className="mb-3" fill>
                <Tab eventKey="profile" title="Profile">
                  <div className="mt-3">
                    <h5 style={{ color: "#1c1c84" }}>About</h5>
                    <p style={{ color: "#444" }}>
                      {lawyer?.profileDescription ||
                        "No profile description available"}
                    </p>

                    <div className="lawyer-details">
                      <h5 style={{ color: "#1c1c84", marginBottom: "15px" }}>
                        Details
                      </h5>
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <FaGraduationCap className="text-primary me-2" />
                          <strong>Education:</strong>{" "}
                          {lawyer?.education?.join(", ") || "Not specified"}
                        </li>
                        <li className="mb-2">
                          <FaLanguage className="text-primary me-2" />
                          <strong>Languages:</strong> English
                        </li>
                        <li className="mb-2">
                          <FaMoneyBillWave className="text-primary me-2" />
                          <strong>Consultation Fee:</strong> ₹
                          {lawyer?.consultation_fees || "500"}/hr
                        </li>
                        <li className="mb-2">
                          <FaClock className="text-primary me-2" />
                          <strong>Availability:</strong>{" "}
                          {lawyer?.status || "Not specified"}
                        </li>
                      </ul>
                    </div>
                  </div>
                </Tab>

                {/* <Tab eventKey="reviews" title="Reviews">
                  <div className="mt-3">
                    {lawyer?.reviews?.length > 0 ? lawyer.reviews.map((review, index) => (
                      <div key={index} className="mb-3 p-3 border rounded" style={{ background: '#f8f9fa' }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <strong style={{ color: '#1c1c84' }}>{review.user}</strong>
                          <small className="text-muted">{new Date(review.date).toLocaleDateString()}</small>
                        </div>
                        <div className="my-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FaStar key={i} color={i < review.rating ? '#E8B63A' : '#6c757d'} />
                          ))}
                        </div>
                        <p className="mb-0" style={{ color: '#444' }}>{review.comment}</p>
                      </div>
                    )) : (
                      <div className="text-center py-4">
                        <FaCommentDots size={48} className="text-muted mb-3" />
                        <p style={{ color: '#666' }}>No reviews yet</p>
                      </div>
                    )}
                  </div>
                </Tab> */}

                <Tab eventKey="services" title="Services">
                  <div className="mt-3">
                    {["chat", "call", "video"].map((service) => (
                      <div
                        key={service}
                        className="service-card mb-3 p-3 border rounded"
                      >
                        <div className="d-flex align-items-center mb-2">
                          {service === "chat" && (
                            <FaCommentDots
                              className="text-success me-3"
                              size={24}
                            />
                          )}
                          {service === "call" && (
                            <FaPhone className="text-primary me-3" size={24} />
                          )}
                          {service === "video" && (
                            <FaVideo className="text-danger me-3" size={24} />
                          )}
                          <div>
                            <h5
                              style={{ color: "#1c1c84", marginBottom: "5px" }}
                            >{`${
                              service.charAt(0).toUpperCase() + service.slice(1)
                            } Consultation`}</h5>
                            <p
                              style={{ color: "#666", marginBottom: "0" }}
                            >{`Discuss via ${service} with ${
                              lawyer?.name?.split(" ")[0]
                            }`}</p>
                          </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <span className="text-muted">
                            Starting at ₹
                            {(lawyer?.consultation_fees || 500) +
                              (service === "call"
                                ? 300
                                : service === "video"
                                ? 500
                                : 0)}
                            /30 min
                          </span>
                          <Button
                            variant={`outline-${
                              service === "chat"
                                ? "success"
                                : service === "call"
                                ? "primary"
                                : "danger"
                            }`}
                            size="sm"
                            onClick={() => handleOpenPayment(service)}
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Tab>
              </Tabs>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer
          className="flex-column flex-md-row justify-content-between align-items-center"
          style={{ borderTop: "none" }}
        >
          <div className="d-flex flex-wrap gap-2 mb-2 mb-md-0">
            <Button
              variant="outline-primary"
              onClick={() => handleOpenPayment("call")}
              className="d-flex align-items-center"
            >
              <FaPhone className="me-2" /> Call
            </Button>
            <Button
              variant="outline-success"
              onClick={() => handleOpenPayment("chat")}
              className="d-flex align-items-center"
            >
              <FaCommentDots className="me-2" /> Chat
            </Button>
            <Button
              variant="outline-danger"
              onClick={() => handlevideoCall("video")}
              className="d-flex align-items-center"
            >
              <FaVideo className="me-2" /> Video
            </Button>
          </div>
          <Button
            variant="primary"
            onClick={handleClose}
            style={{ background: "#1c1c84", border: "none" }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <PaymentModal
        show={showPaymentModal}
        handleClose={() => setShowPaymentModal(false)}
        serviceType={selectedService}
        lawyer={lawyer}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {showChatModal && activeSession && (
        <Modal
          show={showChatModal}
          onHide={handleChatClose}
          size="lg"
          centered
          fullscreen="md-down"
        >
          <Modal.Header
            closeButton
            style={{ background: "#1c1c84", color: "white" }}
          >
            <Modal.Title>
              <FaCommentDots className="me-2" /> Chat with {lawyer?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body
            style={{
              padding: 0,
              height: "100vh",
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {activeSession?.sessionToken && activeSession?.bookingId ? (
              <ChatBox
                sessionToken={activeSession.sessionToken}
                chatDuration={activeSession.duration}
                lawyer={lawyer}
                bookingId={activeSession.bookingId}
              />
            ) : (
              <div className="text-center py-5">
                🔄 Setting up secure chat...
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleChatClose}>
              End Chat
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};

export default LawyerProfileModal;
