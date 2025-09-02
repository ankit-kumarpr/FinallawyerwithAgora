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

  // Get total amount directly from lawyer's consultation fee
  const total = serviceDetails[serviceType]?.price || lawyer?.consultation_fees || 10;

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
      try {
        await agoraClient.subscribe(user, mediaType);
        console.log("✅ User subscribed to remote media:", mediaType, "from user:", user.uid);

        if (mediaType === "video") {
          const remoteVideoContainer = document.getElementById(
            "remote-video-container"
          );
          if (remoteVideoContainer) {
            // Clear any existing content
            remoteVideoContainer.innerHTML = '';
            
            // Create a new video element for the remote user
            const videoElement = document.createElement('div');
            videoElement.id = `remote-video-${user.uid}`;
            videoElement.style.width = '100%';
            videoElement.style.height = '100%';
            remoteVideoContainer.appendChild(videoElement);
            
            // Play the remote video
            user.videoTrack.play(`remote-video-${user.uid}`);
            console.log("✅ Remote video track playing for user:", user.uid);
          } else {
            console.error("❌ Remote video container not found");
          }
        }

        if (mediaType === "audio") {
          user.audioTrack.play();
          setCallStatus("Connected");
          console.log("✅ Remote audio track playing for user:", user.uid);
        }

        setRemoteUsers((prev) => ({ ...prev, [user.uid]: user }));
      } catch (error) {
        console.error("❌ Error handling user published:", error);
      }
    };

    const handleUserUnpublished = (user) => {
      console.log("User unpublished:", user.uid);
      setRemoteUsers((prev) => {
        const newUsers = { ...prev };
        delete newUsers[user.uid];
        return newUsers;
      });
    };

    const handleUserJoined = (user) => {
      console.log("User joined:", user.uid);
      setRemoteUsers((prev) => ({ ...prev, [user.uid]: user }));
      setCallStatus("Connected");
    };

    const handleUserLeft = (user) => {
      console.log("User left:", user.uid);
      setRemoteUsers((prev) => {
        const newUsers = { ...prev };
        delete newUsers[user.uid];
        return newUsers;
      });
      setCallStatus("Call ended");
    };

    // Add listener for when user publishes their own tracks
    const handleUserPublish = (user, mediaType) => {
      console.log("🎯 User published their own track:", mediaType, "UID:", user.uid);
    };

    agoraClient.on("user-published", handleUserPublished);
    agoraClient.on("user-unpublished", handleUserUnpublished);
    agoraClient.on("user-joined", handleUserJoined);
    agoraClient.on("user-left", handleUserLeft);
    agoraClient.on("user-publish", handleUserPublish);

    return () => {
      agoraClient.off("user-published", handleUserPublished);
      agoraClient.off("user-unpublished", handleUserUnpublished);
      agoraClient.off("user-joined", handleUserJoined);
      agoraClient.off("user-left", handleUserLeft);
      agoraClient.off("user-publish", handleUserPublish);
    };
  }, [agoraClient]);

  // Effect to handle local video display when tracks change
  useEffect(() => {
    if (localTracks.length > 0 && serviceType === "video") {
      const videoTrack = localTracks.find(track => track.trackMediaType === 'video');
      if (videoTrack) {
        // Wait for DOM to be ready and then play local video
        const timer = setTimeout(() => {
          const localVideoElement = document.getElementById("local-video");
          if (localVideoElement) {
            try {
              videoTrack.play("local-video");
              console.log("✅ Local video playing from useEffect");
            } catch (error) {
              console.error("❌ Error playing local video:", error);
            }
          } else {
            console.error("❌ Local video element not found in useEffect");
          }
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [localTracks, serviceType]);

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
      console.log("🎯 Starting to join Agora channel:", {
        appId: agoraData.appId,
        channelName: agoraData.channelName,
        uid: agoraData.uid,
        serviceType
      });

      // Create local tracks based on call type
      let localAudioTrack = null;
      let localVideoTrack = null;

      // Always create audio track for both call and video
      try {
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        console.log("✅ Audio track created successfully");
      } catch (audioError) {
        console.error("❌ Failed to create audio track:", audioError);
        throw new Error("Failed to access microphone");
      }

      // Create video track only for video calls
      if (serviceType === "video") {
        try {
          localVideoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: "1080p_1",
          });
          console.log("✅ Video track created successfully");
        } catch (videoError) {
          console.error("❌ Failed to create video track:", videoError);
          // Fallback to audio-only if video fails
          localVideoTrack = null;
          alert("Video camera access failed. Continuing with audio only.");
        }
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
        // Publish both audio and video tracks
        await agoraClient.publish([localAudioTrack, localVideoTrack]);
        console.log("✅ Video tracks published successfully");

        // Play local video - IMPORTANT: Wait for DOM to be ready
        setTimeout(() => {
          const localVideoElement = document.getElementById("local-video");
          if (localVideoElement) {
            localVideoTrack.play("local-video");
            console.log("✅ Local video playing");
          } else {
            console.error("❌ Local video element not found");
          }
        }, 500);

      } else {
        // For audio calls, publish only audio
        await agoraClient.publish([localAudioTrack]);
        console.log("✅ Audio track published");
      }

      // Store local tracks for cleanup
      const tracks = [localAudioTrack, localVideoTrack].filter((track) => track !== null);
      setLocalTracks(tracks);
      console.log(`✅ Published ${tracks.length} tracks`);

      // Update call status
      setCallStatus("Waiting for lawyer to join...");

    } catch (error) {
      console.error("❌ User failed to join channel:", error);
      setCallStatus("Connection failed");
      alert(`Failed to join call: ${error.message}`);
    }
  };

  // Leave Agora channel
  const leaveChannel = async () => {
    try {
      // Stop and close all local tracks
      localTracks.forEach((track) => {
        if (track && track.stop) {
          track.stop();
        }
        if (track && track.close) {
          track.close();
        }
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

  // Handle mute/unmute audio
  const toggleAudio = () => {
    if (localTracks.length > 0) {
      const audioTrack = localTracks.find(track => track.trackMediaType === 'audio');
      if (audioTrack) {
        const newState = !audioTrack.enabled;
        audioTrack.setEnabled(newState);
        console.log(`🎤 Audio ${newState ? 'enabled' : 'disabled'}`);
      }
    }
  };

  // Handle video on/off
  const toggleVideo = () => {
    if (localTracks.length > 0) {
      const videoTrack = localTracks.find(track => track.trackMediaType === 'video');
      if (videoTrack) {
        const newState = !videoTrack.enabled;
        videoTrack.setEnabled(newState);
        console.log(`📹 Video ${newState ? 'enabled' : 'disabled'}`);
      }
    }
  };

  // Get current audio/video states
  const getAudioState = () => {
    const audioTrack = localTracks.find(track => track.trackMediaType === 'audio');
    return audioTrack ? audioTrack.enabled : true;
  };

  const getVideoState = () => {
    const videoTrack = localTracks.find(track => track.trackMediaType === 'video');
    return videoTrack ? videoTrack.enabled : true;
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
            durationMinutes: 15, // Fixed duration for all sessions
            paymentId: razorpay_payment_id,
            bookingId,
            agora: verifyData.agora || null,
          });
        }

        // Show success message and automatically proceed to video call
        if (serviceType === "video" || serviceType === "call") {
          // Don't close the modal, let it show the video call UI
          console.log("🎉 Payment successful! Video call UI will appear automatically.");
          
          // Show success notification
          if (window.Swal) {
            window.Swal.fire({
              icon: "success",
              title: "Payment Successful!",
              text: "Starting video call...",
              timer: 2000,
              showConfirmButton: false,
              toast: true,
              position: "top-end"
            });
          }
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
            amount: total * 100, // Convert to paise
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
        amount: total * 100, // Convert to paise
        currency: "INR",
        name: `${service.name} with ${lawyer?.name}`,
        description: `${service.name} consultation`,
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
                      <small>Waiting for lawyer to join...</small>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Local video preview */}
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
                backgroundColor: "#000",
              }}
            >
              <div
                id="local-video"
                style={{ width: "100%", height: "100%" }}
              ></div>
            </div>

            {/* Call controls overlay */}
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
              }}
            >
              <div className="d-flex gap-2">
                <Button
                  variant={getAudioState() ? "outline-light" : "danger"}
                  size="lg"
                  style={{ borderRadius: "50%", width: "60px", height: "60px" }}
                  onClick={toggleAudio}
                >
                  <i className={`fas fa-microphone${getAudioState() ? '' : '-slash'}`}></i>
                </Button>
                <Button
                  variant={getVideoState() ? "outline-light" : "danger"}
                  size="lg"
                  style={{ borderRadius: "50%", width: "60px", height: "60px" }}
                  onClick={toggleVideo}
                >
                  <i className={`fas fa-video${getVideoState() ? '' : '-slash'}`}></i>
                </Button>
              </div>
            </div>

            {/* Debug info overlay */}
            <div
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                zIndex: 10,
                background: "rgba(0,0,0,0.7)",
                color: "white",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "12px",
                maxWidth: "300px",
              }}
            >
              <div><strong>Debug Info:</strong></div>
              <div>Status: {callStatus}</div>
              <div>Local Tracks: {localTracks.length}</div>
              <div>Remote Users: {Object.keys(remoteUsers).length}</div>
              <div>Audio: {getAudioState() ? 'ON' : 'OFF'}</div>
              <div>Video: {getVideoState() ? 'ON' : 'OFF'}</div>
              {Object.keys(remoteUsers).map(uid => (
                <div key={uid}>Remote User: {uid}</div>
              ))}
            </div>
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
          currentUser?._id ? (
            <ChatBox
              sessionToken={sessionToken}
              chatDuration={15} // Fixed duration
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

        <div
          className="p-4 mb-3"
          style={{
            background: "#f8f9fa",
            borderRadius: "10px",
            borderLeft: `4px solid ${serviceDetails[serviceType]?.color}`,
          }}
        >
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Service:</span>
            <span>{serviceDetails[serviceType]?.name}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Lawyer:</span>
            <span>{lawyer?.name}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Specialization:</span>
            <span>{lawyer?.specialization}</span>
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
