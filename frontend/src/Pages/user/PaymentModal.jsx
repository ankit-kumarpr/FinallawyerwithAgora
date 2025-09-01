import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import ChatBox from "../../components/ChatBox";
import { initSocket, getSocket } from "../../components/socket";
import { useAuth } from "../../components/AuthContext";
import AgoraRTC from "agora-rtc-sdk-ng";

const PaymentModal = ({
  show,
  handleClose,
  serviceType,
  lawyer,
  onPaymentSuccess,
}) => {
  const [duration, setDuration] = useState(15);
  const [pricePerMinute, setPricePerMinute] = useState(10);
  const [total, setTotal] = useState(150);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [internalShow, setInternalShow] = useState(show);
  const [bookingAccepted, setBookingAccepted] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [chatReady, setChatReady] = useState(false);
  const [agoraClient, setAgoraClient] = useState(null);
  const [localTracks, setLocalTracks] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState({});
  const [isInCall, setIsInCall] = useState(false);
  const [callStatus, setCallStatus] = useState("Connecting...");

  const auth = useAuth();
  const currentUser = auth?.currentUser;

  const serviceDetails = {
    call: {
      price: lawyer?.consultation_fees || 10,
      icon: "fa-phone",
      color: "#0d6efd",
      name: "Phone Call",
    },
    chat: {
      price: lawyer?.consultation_fees || 10,
      icon: "fa-comment-dots",
      color: "#198754",
      name: "Chat",
    },
    video: {
      price: lawyer?.consultation_fees || 10,
      icon: "fa-video",
      color: "#dc3545",
      name: "Video Call",
    },
  };

  // Initialize Agora client
  useEffect(() => {
    try {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setAgoraClient(client);
      console.log("✅ Agora client initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Agora client:", error);
    }

    return () => {
      if (agoraClient && isInCall) {
        leaveChannel();
      }
    };
  }, []);

  // Setup Agora event listeners
  useEffect(() => {
    if (!agoraClient) return;

    const handleUserPublished = async (user, mediaType) => {
      await agoraClient.subscribe(user, mediaType);

      if (mediaType === "video") {
        const remoteVideoContainer = document.getElementById(
          "remote-video-container"
        );
        if (remoteVideoContainer) {
          user.videoTrack.play("remote-video-container");
        }
      }

      if (mediaType === "audio") {
        user.audioTrack.play();
        setCallStatus("Connected");
      }

      setRemoteUsers((prev) => ({ ...prev, [user.uid]: user }));
    };

    const handleUserUnpublished = (user) => {
      setRemoteUsers((prev) => {
        const newUsers = { ...prev };
        delete newUsers[user.uid];
        return newUsers;
      });
    };

    const handleUserJoined = (user) => {
      console.log("User joined:", user);
      setRemoteUsers((prev) => ({ ...prev, [user.uid]: user }));
      setCallStatus("Connected");
    };

    const handleUserLeft = (user) => {
      console.log("User left:", user);
      setRemoteUsers((prev) => {
        const newUsers = { ...prev };
        delete newUsers[user.uid];
        return newUsers;
      });
      setCallStatus("Call ended");
    };

    agoraClient.on("user-published", handleUserPublished);
    agoraClient.on("user-unpublished", handleUserUnpublished);
    agoraClient.on("user-joined", handleUserJoined);
    agoraClient.on("user-left", handleUserLeft);

    return () => {
      agoraClient.off("user-published", handleUserPublished);
      agoraClient.off("user-unpublished", handleUserUnpublished);
      agoraClient.off("user-joined", handleUserJoined);
      agoraClient.off("user-left", handleUserLeft);
    };
  }, [agoraClient]);

  useEffect(() => {
    const perMinute = serviceDetails[serviceType]?.price || 10;
    setPricePerMinute(perMinute);
    setTotal(duration * perMinute);
  }, [serviceType, duration]);

  useEffect(() => {
    setInternalShow(show);
  }, [show]);

  const handleHide = () => {
    setInternalShow(false);
    handleClose();
  };

  const generateSessionToken = () =>
    `session_${Math.random().toString(36).substring(2)}_${Date.now()}`;

  // Join Agora channel
  const joinChannel = async (agoraData) => {
    if (!agoraClient || !agoraData || !agoraData.token) {
      console.error("❌ Agora client, data, or token not available", agoraData);
      return;
    }

    try {
      // Create local tracks based on call type
      let localAudioTrack = null;
      let localVideoTrack = null;

      // Always create audio track for both call and video
      localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();

      // Create video track only for video calls
      if (serviceType === "video") {
        localVideoTrack = await AgoraRTC.createCameraVideoTrack();
      }

      // Join the channel
      await agoraClient.join(
        agoraData.appId,
        agoraData.channelName,
        agoraData.token,
        agoraData.uid
      );

      console.log("✅ User joined Agora channel");
      setIsInCall(true);
      setCallStatus("Connecting to lawyer...");

      // Publish tracks based on call type
      if (serviceType === "video" && localVideoTrack) {
        await agoraClient.publish([localAudioTrack, localVideoTrack]);

        // Play local video
        const localVideoElement = document.getElementById("local-video");
        if (localVideoElement) {
          localVideoTrack.play("local-video");
        }
      } else {
        // For audio calls, publish only audio
        await agoraClient.publish([localAudioTrack]);
      }

      // Store local tracks for cleanup
      setLocalTracks(
        [localAudioTrack, localVideoTrack].filter((track) => track !== null)
      );

      console.log("✅ User published tracks");
    } catch (error) {
      console.error("❌ User failed to join channel:", error);
      setCallStatus("Connection failed");
    }
  };

  // Leave Agora channel
  const leaveChannel = async () => {
    try {
      // Stop and close all local tracks
      localTracks.forEach((track) => {
        track.stop();
        track.close();
      });

      setLocalTracks([]);

      if (agoraClient) {
        await agoraClient.leave();
      }

      setIsInCall(false);
      setRemoteUsers({});

      console.log("✅ User left Agora channel");
    } catch (error) {
      console.error("❌ User failed to leave channel:", error);
    }
  };

  const handlePaymentSuccess = async (response) => {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      bookingId,
    } = response;

    const token = generateSessionToken();
    setSessionToken(token);
    setPaymentSuccess(true);
    setBookingId(bookingId);

    const authToken = sessionStorage.getItem("token");

    try {
      const verifyRes = await fetch(
        "https://finallawyerwithagora.onrender.com/lawapi/common/paymentverify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            bookingId,
          }),
        }
      );

      const verifyData = await verifyRes.json();

      console.log("✅ Payment Verification API Response:", verifyData);

      if (!verifyData.error) {
        const userData = JSON.parse(sessionStorage.getItem("userData"));
        const socket = initSocket(token, userData._id, "client");

        if (socket && userData) {
          // Store Agora tokens if available (for call/video)
          if (verifyData.agora) {
            sessionStorage.setItem(
              `agora_${bookingId}`,
              JSON.stringify(verifyData.agora.user)
            );
            console.log(
              "🎯 Agora tokens received from API:",
              verifyData.agora.user
            );

            // Join Agora channel if it's a call/video
            if (serviceType === "call" || serviceType === "video") {
              setTimeout(() => {
                joinChannel(verifyData.agora.user);
              }, 1000);
            }
          }

          // Register listener for session start
          socket.on("session-started", (data) => {
            if (data.bookingId === bookingId) {
              console.log("✅ session-started confirmed by server:", data);
              setBookingAccepted(true);
              if (serviceType === "chat") {
                setChatReady(true);
              }
            }
          });

          // Listen for Agora credentials from server (fallback)
          socket.on("agora-credentials", (data) => {
            console.log("🔑 Agora credentials received via socket:", data);
            sessionStorage.setItem(
              `agora_socket_${bookingId}`,
              JSON.stringify(data)
            );

            // If we haven't joined yet, join now
            if (
              !isInCall &&
              (serviceType === "call" || serviceType === "video")
            ) {
              joinChannel(data);
            }
          });

          // Emit join events
          socket.emit("join-user", userData._id);
          socket.emit("join-lawyer", verifyData.booking.lawyerId);
          socket.emit("join-booking", bookingId);

          // Send booking notification
          socket.emit("new-booking-notification", {
            lawyerId: verifyData.booking.lawyerId,
            bookingId: bookingId,
            userId: userData._id,
            userName: userData.name || "User",
            mode: serviceType,
            amount: verifyData.booking.amount,
          });

          // Optional fallback
          socket.emit(
            "check-session-status",
            { bookingId: bookingId },
            (resp) => {
              if (resp?.active) {
                setBookingAccepted(true);
                if (serviceType === "chat") {
                  setChatReady(true);
                }
              }
            }
          );
        }

        if (onPaymentSuccess) {
          onPaymentSuccess({
            sessionToken: token,
            durationMinutes: duration,
            paymentId: razorpay_payment_id,
            bookingId,
            agora: verifyData.agora || null,
          });
        }
      } else {
        alert(`Payment verification failed: ${verifyData.message}`);
      }
    } catch (err) {
      console.error("Verification Error:", err);
      alert("Payment succeeded but verification failed.");
    }
  };

  const handlePayNow = async () => {
    setLoading(true);
    const authToken = sessionStorage.getItem("token");
    const service = serviceDetails[serviceType] || serviceDetails.call;

    try {
      const orderRes = await fetch(
        "https://finallawyerwithagora.onrender.com/lawapi/common/createorder",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            lawyerId: lawyer?.lawyerId,
            mode: serviceType,
            amount: total * 100,
          }),
        }
      );

      const orderData = await orderRes.json();
      const razorpayOrderId = orderData?.order?.id;
      const bookingId = orderData?.booking?._id;

      if (!razorpayOrderId || !bookingId) {
        alert("Failed to create order.");
        return;
      }

      const options = {
        key: "rzp_test_mcwl3oaRQerrOW",
        amount: total * 100,
        currency: "INR",
        name: `${service.name} with ${lawyer?.name}`,
        description: `${service.name} consultation (${duration} mins)`,
        image: "/logo.png",
        order_id: razorpayOrderId,
        handler: (response) => handlePaymentSuccess({ ...response, bookingId }),
        prefill: {
          name: currentUser?.name || "User",
          email: currentUser?.email || "user@example.com",
          contact: currentUser?.phone || "9999999999",
        },
        notes: {
          lawyerId: lawyer?.lawyerId || "Unknown",
          service: serviceType,
          duration,
          lawyerName: lawyer?.name || "Unknown",
        },
        theme: { color: service.color },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment initialization failed.");
    } finally {
      setLoading(false);
    }
  };

  // Render video call UI
  const renderVideoCallUI = () => {
    return (
      <Modal show={internalShow} onHide={handleHide} centered fullscreen>
        <Modal.Header
          closeButton
          style={{ background: "#dc3545", color: "white" }}
        >
          <Modal.Title>
            <i className="fas fa-video me-2"></i>
            Video Call with {lawyer?.name}
            <span className="badge bg-light text-dark ms-2">{callStatus}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0, position: "relative" }}>
          <div
            style={{
              display: "flex",
              height: "100vh",
              backgroundColor: "#000",
            }}
          >
            {/* Remote video */}
            <div
              style={{
                flex: 1,
                position: "relative",
              }}
            >
              <div
                id="remote-video-container"
                style={{ width: "100%", height: "100%" }}
              >
                {Object.keys(remoteUsers).length === 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      color: "white",
                    }}
                  >
                    <div>
                      <i className="fas fa-user fa-5x mb-3"></i>
                      <p>{callStatus}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Local video preview */}
            {serviceType === "video" && (
              <div
                style={{
                  position: "absolute",
                  bottom: 20,
                  right: 20,
                  width: 150,
                  height: 100,
                  borderRadius: 8,
                  overflow: "hidden",
                  zIndex: 10,
                  border: "2px solid white",
                }}
              >
                <div
                  id="local-video"
                  style={{ width: "100%", height: "100%" }}
                ></div>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer style={{ background: "#f8f9fa" }}>
          <Button variant="danger" onClick={leaveChannel}>
            <i className="fas fa-phone-slash me-2"></i> End Call
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // Render audio call UI
  const renderAudioCallUI = () => {
    return (
      <Modal show={internalShow} onHide={handleHide} centered>
        <Modal.Header
          closeButton
          style={{ background: "#0d6efd", color: "white" }}
        >
          <Modal.Title>
            <i className="fas fa-phone me-2"></i>
            Audio Call with {lawyer?.name}
            <span className="badge bg-light text-dark ms-2">{callStatus}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-5">
          <div className="mb-4">
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                backgroundColor: "#f8f9fa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                border: "4px solid #0d6efd",
              }}
            >
              <i className="fas fa-user fa-3x text-secondary"></i>
            </div>
          </div>

          <h4>{lawyer?.name}</h4>
          <p className="text-muted">{callStatus}</p>

          {callStatus === "Connecting..." && (
            <div className="mt-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Connecting to lawyer...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="danger" onClick={leaveChannel}>
            <i className="fas fa-phone-slash me-2"></i> End Call
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // ⏳ Waiting screen for chat
  if (paymentSuccess && serviceType === "chat" && !bookingAccepted) {
    return (
      <Modal show={internalShow} onHide={handleHide} centered>
        <Modal.Body className="text-center py-5">
          <div className="spinner-border text-primary mb-3"></div>
          <h5>Waiting for lawyer to accept the session...</h5>
        </Modal.Body>
      </Modal>
    );
  }

  // ✅ Chat ready
  if (
    paymentSuccess &&
    serviceType === "chat" &&
    bookingAccepted &&
    chatReady
  ) {
    return (
      <Modal show={internalShow} onHide={handleHide} centered fullscreen>
        <Modal.Header
          closeButton
          style={{ background: "#1c1c84", color: "white" }}
        >
          <Modal.Title>
            <i className={`fas ${serviceDetails[serviceType]?.icon} me-2`}></i>
            Chat Session with {lawyer?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0, height: "100vh", overflow: "hidden" }}>
          {sessionToken &&
          bookingId &&
          lawyer &&
          duration &&
          currentUser?._id ? (
            <ChatBox
              sessionToken={sessionToken}
              chatDuration={duration}
              lawyer={lawyer}
              bookingId={bookingId}
              role="client"
              currentUser={currentUser}
              authToken={sessionStorage.getItem("token")}
            />
          ) : (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-muted">🔄 Setting up secure chat...</div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    );
  }

  // Render call UI for call/video
  if (paymentSuccess && (serviceType === "call" || serviceType === "video")) {
    return serviceType === "video" ? renderVideoCallUI() : renderAudioCallUI();
  }

  // Payment UI
  return (
    <Modal show={internalShow} onHide={handleHide} centered>
      <Modal.Header
        closeButton
        style={{ background: "#1c1c84", color: "white" }}
      >
        <Modal.Title>
          <i className={`fas ${serviceDetails[serviceType]?.icon} me-2`}></i>
          {serviceDetails[serviceType]?.name || "Consultation"} Payment
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <div className="d-flex justify-content-center mb-3">
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: `${serviceDetails[serviceType]?.color}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i
                className={`fas ${serviceDetails[serviceType]?.icon} fa-2x`}
                style={{ color: serviceDetails[serviceType]?.color }}
              ></i>
            </div>
          </div>
          <h5>Consultation with {lawyer?.name}</h5>
          <p className="text-muted">{lawyer?.specialization}</p>
        </div>

        <Form>
          <Form.Group controlId="duration" className="mb-4">
            <Form.Label>Duration</Form.Label>
            <Form.Select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={{ borderRadius: "20px", padding: "10px" }}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </Form.Select>
          </Form.Group>

          <div
            className="p-4 mb-3"
            style={{
              background: "#f8f9fa",
              borderRadius: "10px",
              borderLeft: `4px solid ${serviceDetails[serviceType]?.color}`,
            }}
          >
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Rate:</span>
              <span>₹{pricePerMinute} per minute</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Duration:</span>
              <span>{duration} minutes</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between">
              <strong>Total Amount:</strong>
              <strong
                className="h5"
                style={{ color: serviceDetails[serviceType]?.color }}
              >
                ₹{total}
              </strong>
            </div>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="outline-secondary"
          onClick={handleHide}
          style={{ borderRadius: "20px", padding: "8px 20px" }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handlePayNow}
          disabled={loading}
          style={{
            background: serviceDetails[serviceType]?.color,
            border: "none",
            borderRadius: "20px",
            padding: "8px 20px",
            minWidth: "100px",
          }}
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Processing...
            </>
          ) : (
            "Pay Now"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentModal;
