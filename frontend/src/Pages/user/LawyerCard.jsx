import React, { useState } from "react";
import axios from "axios";
import { FaStar, FaUserTie, FaCircle } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styled, { keyframes } from "styled-components";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

// Pulse animation for online status
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(40, 167, 69, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
  }
`;

const OnlineIndicator = styled(FaCircle)`
  color: #28a745;
  font-size: 0.8rem;
  margin-right: 5px;
  animation: ${pulse} 2s infinite;
`;

const OfflineIndicator = styled(FaCircle)`
  color: #6c757d;
  font-size: 0.8rem;
  margin-right: 5px;
`;

const LawyerCard = ({ lawyer, onViewProfile }) => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({ message: "" });

  // Safely handle potentially undefined arrays
  const specializations = Array.isArray(lawyer.specializations)
    ? lawyer.specializations
    : [];
  const languages = Array.isArray(lawyer.languages) ? lawyer.languages : [];

  const isOnline = lawyer.status === "online";

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    const userData = JSON.parse(sessionStorage.getItem("userData") || "{}");
    const userId = userData.userId;

    if (!userId) {
      toast.error("User is not logged in. Please log in first.");
      return;
    }

    const payload = {
      lawyerId: lawyer.lawyerId || lawyer._id,
      userId,
      message: requestForm.message.trim(),
    };

    try {
      await axios.post(
        "http://localhost:4000/lawapi/common/sendlawyerrequest",
        payload
      );
      toast.success("Your request has been submitted successfully!");
      setShowRequestModal(false);
      setRequestForm({ message: "" });
    } catch (error) {
      console.error("Request submission error:", error);
      toast.error(error.response?.data?.message || "Failed to submit request.");
    }
  };

  const handleInputChange = (e) => {
    setRequestForm({ message: e.target.value });
  };

  return (
    <CardContainer>
      <StatusContainer>
        {isOnline ? (
          <>
            <OnlineIndicator />
            <StatusText>Online</StatusText>
          </>
        ) : (
          <>
            <OfflineIndicator />
            <StatusText>Offline</StatusText>
          </>
        )}
      </StatusContainer>

      <ProfileImageContainer>
        {lawyer.profileImage ? (
          <ProfileImage src={lawyer.profileImage} alt={lawyer.name} />
        ) : (
          <FaUserTie size={40} color="#1c1c84" />
        )}
      </ProfileImageContainer>

      <TopSection>
        <Name>{lawyer.name || "Legal Professional"}</Name>
        <Specializations>
          {specializations.length > 0
            ? specializations.join(", ")
            : "General Practice"}
        </Specializations>
        <Languages>
          {languages.length > 0 ? languages.join(", ") : "English"}
        </Languages>
      </TopSection>

      <MiddleSection>
        <Rating>
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} color="#E8B63A" size={14} />
          ))}
        </Rating>
        <Experience>Exp: {lawyer.experience || 0} Years</Experience>
        {lawyer.isNew && <NewBadge>New!</NewBadge>}
        {lawyer.orderCount && <Orders>{lawyer.orderCount} orders</Orders>}
      </MiddleSection>

      <BottomSection>
        <Duration>{lawyer.duration || 30}min</Duration>

        <ActionButtons>
          {isOnline ? (
            // If lawyer is online, show only "View Profile"
            <ViewProfileButton onClick={() => onViewProfile(lawyer)}>
              <FaUserTie /> Call/ chat Now
            </ViewProfileButton>
          ) : (
            // If lawyer is offline, show only "Send Request"
            <RequestButton onClick={() => setShowRequestModal(true)}>
              Send Request
            </RequestButton>
          )}
        </ActionButtons>
      </BottomSection>

      {/* Request Modal */}
      <Modal
        show={showRequestModal}
        onHide={() => setShowRequestModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {isOnline ? "Start Chat" : "Request Consultation"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRequestSubmit}>
          <Modal.Body>
            <p>
              You're{" "}
              {isOnline ? "starting a chat with" : "sending a request to"}{" "}
              <strong>{lawyer.name || "the lawyer"}</strong>.
            </p>
            <Form.Group className="mb-3">
              <Form.Label>Your Message *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="message"
                required
                value={requestForm.message}
                onChange={handleInputChange}
                placeholder={
                  isOnline
                    ? "Type your message here..."
                    : "Describe your legal issue..."
                }
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowRequestModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {isOnline ? "Start Chat" : "Submit Request"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ToastContainer position="top-center" />
    </CardContainer>
  );
};

// Styled components

const CardContainer = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid #eaeaea;
  max-width: 300px;
  position: relative;
`;

const StatusContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
`;

const StatusText = styled.span`
  margin-left: 4px;
`;

const ProfileImageContainer = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border: 2px solid #1c1c84;
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const TopSection = styled.div`
  margin-bottom: 12px;
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
  text-align: center;
`;

const Name = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1c1c84;
`;

const Specializations = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0 0 4px 0;
`;

const Languages = styled.p`
  font-size: 12px;
  color: #888;
  margin: 0;
`;

const MiddleSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
`;

const Rating = styled.div`
  display: flex;
  gap: 2px;
`;

const Experience = styled.span`
  font-size: 12px;
  color: #666;
`;

const NewBadge = styled.span`
  font-size: 12px;
  color: #28a745;
  font-weight: 600;
`;

const Orders = styled.span`
  font-size: 12px;
  color: #666;
`;

const BottomSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Duration = styled.span`
  font-size: 14px;
  color: #666;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ViewProfileButton = styled.button`
  background: #1c1c84;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background 0.2s;

  &:hover {
    background: #2a5f8f;
  }
`;

const ChatButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #218838;
  }
`;

const RequestButton = styled.button`
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #5a6268;
  }
`;

export default LawyerCard;
