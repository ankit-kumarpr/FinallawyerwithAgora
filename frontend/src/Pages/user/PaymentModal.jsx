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
  const [callDuration, setCallDuration] = useState(0);

  const auth = useAuth();
  const currentUser = auth?.currentUser;
  const callTimerRef = useRef(null);

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
  const total =
    serviceDetails[serviceType]?.price || lawyer?.consultation_fees || 10;

  // Start/stop call timer
  useEffect(() => {
    if (isInCall && callStatus === "Connected") {
      const startTime = Date.now();
      callTimerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isInCall, callStatus]);

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
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
      try {
        await agoraClient.subscribe(user, mediaType);
        console.log(
          "✅ User subscribed to remote media:",
          mediaType,
          "from user:",
          user.uid
        );

        if (mediaType === "video") {
          const remoteVideoContainer = document.getElementById(
            "remote-video-container"
          );
          if (remoteVideoContainer) {
            // Clear any existing content
            remoteVideoContainer.innerHTML = "";

            // Create a new video element for the remote user
            const videoElement = document.createElement("div");
            videoElement.id = `remote-video-${user.uid}`;
            videoElement.style.width = "100%";
            videoElement.style.height = "100%";
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
      console.log(
        "🎯 User published their own track:",
        mediaType,
        "UID:",
        user.uid
      );
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
      const videoTrack = localTracks.find(
        (track) => track.trackMediaType === "video"
      );
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

  // Effect to ensure video tracks are properly published
  useEffect(() => {
    if (isInCall && localTracks.length > 0 && serviceType === "video") {
      console.log("🔍 Ensuring video tracks are published...");

      // Force republish video tracks if needed
      const videoTrack = localTracks.find(
        (track) => track.trackMediaType === "video"
      );
      if (videoTrack && !videoTrack.enabled) {
        videoTrack.setEnabled(true);
        console.log("✅ Video track re-enabled");
      }
    }
  }, [isInCall, localTracks, serviceType]);

  // Effect to monitor remote users and ensure proper video display
  useEffect(() => {
    if (Object.keys(remoteUsers).length > 0) {
      console.log("🔍 Remote users detected:", Object.keys(remoteUsers));

      // Ensure our video is published for remote users
      if (localTracks.length > 0 && serviceType === "video") {
        const videoTrack = localTracks.find(
          (track) => track.trackMediaType === "video"
        );
        if (videoTrack) {
          console.log("✅ Video track available for remote users");
          // Force republish if needed
          if (agoraClient && videoTrack.enabled) {
            agoraClient
              .publish([videoTrack])
              .then(() => {
                console.log("✅ Video track republished for remote users");
              })
              .catch((err) => {
                console.error("❌ Error republishing video:", err);
              });
          }
        }
      }
    }
  }, [remoteUsers, localTracks, serviceType, agoraClient]);

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
        serviceType,
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
      const tracks = [localAudioTrack, localVideoTrack].filter(
        (track) => track !== null
      );
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
      const audioTrack = localTracks.find(
        (track) => track.trackMediaType === "audio"
      );
      if (audioTrack) {
        const newState = !audioTrack.enabled;
        audioTrack.setEnabled(newState);
        console.log(`🎤 Audio ${newState ? "enabled" : "disabled"}`);
      }
    }
  };

  // Handle video on/off
  const toggleVideo = () => {
    if (localTracks.length > 0) {
      const videoTrack = localTracks.find(
        (track) => track.trackMediaType === "video"
      );
      if (videoTrack) {
        const newState = !videoTrack.enabled;
        videoTrack.setEnabled(newState);
        console.log(`📹 Video ${newState ? "enabled" : "disabled"}`);
      }
    }
  };

  // Get current audio/video states
  const getAudioState = () => {
    const audioTrack = localTracks.find(
      (track) => track.trackMediaType === "audio"
    );
    return audioTrack ? audioTrack.enabled : true;
  };

  const getVideoState = () => {
    const videoTrack = localTracks.find(
      (track) => track.trackMediaType === "video"
    );
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
        "https://lawyerwork.onrender.com/lawapi/common/paymentverify",
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
          // Lawyer joins rooms using their public lawyerId (e.g., "Lawyer046"),
          // not the Mongo ObjectId. Ensure we target that room for notifications.
          socket.emit(
            "join-lawyer",
            lawyer?.lawyerId || verifyData.booking.lawyerId
          );
          socket.emit("join-booking", bookingId);

          // Send booking notification
          socket.emit("new-booking-notification", {
            lawyerId: lawyer?.lawyerId || verifyData.booking.lawyerId,
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
          console.log(
            "🎉 Payment successful! Video call UI will appear automatically."
          );

          // Show success notification
          if (window.Swal) {
            window.Swal.fire({
              icon: "success",
              title: "Payment Successful!",
              text: "Starting video call...",
              timer: 2000,
              showConfirmButton: false,
              toast: true,
              position: "top-end",
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
        "https://lawyerwork.onrender.com/lawapi/common/createorder",
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

  // Render video call UI in modal
  const renderVideoCallUI = () => {
    return (
      <Modal
        show={internalShow}
        onHide={handleHide}
        centered
        size="lg"
        className="call-modal"
      >
        <Modal.Header className="call-header">
          <div className="d-flex align-items-center w-100">
            <div
              className={`status-indicator ${
                callStatus === "Connected" ? "connected" : "connecting"
              }`}
            ></div>
            <div className="ms-2 flex-grow-1">
              <Modal.Title className="call-title">
                Video Consultation
              </Modal.Title>
              <div className="call-subtitle">with {lawyer?.name}</div>
            </div>
            <div className="call-duration">{formatDuration(callDuration)}</div>
            <Button variant="close" onClick={handleHide} className="ms-2" />
          </div>
        </Modal.Header>
        <Modal.Body className="call-body p-0">
          <div className="video-call-container">
            {/* Remote video container */}
            <div id="remote-video-container" className="remote-video-container">
              {Object.keys(remoteUsers).length === 0 ? (
                <div className="video-placeholder">
                  <div className="avatar-container">
                    <i className="fas fa-user"></i>
                  </div>
                  <h5>Waiting for Lawyer</h5>
                  <p className="text-muted">{callStatus}</p>
                  <div className="mt-2">
                    <Spinner animation="border" variant="primary" size="sm" />
                  </div>
                </div>
              ) : (
                <div className="connection-status connected">
                  <i className="fas fa-check-circle me-1"></i>
                  Lawyer Connected
                </div>
              )}
            </div>

            {/* Local video preview */}
            <div className="local-video-container">
              <div id="local-video" className="local-video-preview"></div>
            </div>

            {/* Call controls */}
            <div className="call-controls">
              <div className="controls-container">
                <Button
                  className={`control-btn ${getAudioState() ? "" : "muted"}`}
                  onClick={toggleAudio}
                  size="sm"
                >
                  <i
                    className={`fas fa-microphone${
                      getAudioState() ? "" : "-slash"
                    }`}
                  ></i>
                </Button>
                <Button
                  className={`control-btn ${getVideoState() ? "" : "muted"}`}
                  onClick={toggleVideo}
                  size="sm"
                >
                  <i
                    className={`fas fa-video${getVideoState() ? "" : "-slash"}`}
                  ></i>
                </Button>
                <Button
                  className="control-btn end-call"
                  onClick={leaveChannel}
                  size="sm"
                >
                  <i className="fas fa-phone-slash"></i>
                </Button>
              </div>
            </div>
          </div>

          {/* Call info section */}
          <div className="call-info-section p-3 border-top">
            <div className="d-flex align-items-center">
              <img
                src={
                  lawyer?.lawyerImage
                    ? `https://lawyerwork.onrender.com${lawyer.lawyerImage}`
                    : "/logo.png"
                }
                alt={lawyer?.name}
                className="lawyer-avatar-sm me-3"
              />
              <div className="flex-grow-1">
                <h6 className="mb-0">{lawyer?.name}</h6>
                <small className="text-muted">{lawyer?.specialization}</small>
              </div>
              <div
                className={`status-badge ${
                  callStatus === "Connected" ? "connected" : "connecting"
                }`}
              >
                {callStatus}
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    );
  };

  // Render audio call UI in modal
  const renderAudioCallUI = () => {
    return (
      <Modal
        show={internalShow}
        onHide={handleHide}
        centered
        size="md"
        className="call-modal"
      >
        <Modal.Header className="call-header">
          <div className="d-flex align-items-center w-100">
            <div
              className={`status-indicator ${
                callStatus === "Connected" ? "connected" : "connecting"
              }`}
            ></div>
            <div className="ms-2 flex-grow-1">
              <Modal.Title className="call-title">
                Audio Consultation
              </Modal.Title>
              <div className="call-subtitle">with {lawyer?.name}</div>
            </div>
            <div className="call-duration">{formatDuration(callDuration)}</div>
            <Button variant="close" onClick={handleHide} className="ms-2" />
          </div>
        </Modal.Header>
        <Modal.Body className="call-body text-center p-4">
          <div className="audio-call-container">
            <div className="audio-avatar mb-4">
              <i className="fas fa-user"></i>
            </div>

            <h5>{lawyer?.name}</h5>
            <p className="text-muted mb-4">{lawyer?.specialization}</p>

            <div
              className={`status-badge-lg ${
                callStatus === "Connected" ? "connected" : "connecting"
              } mb-4`}
            >
              {callStatus}
            </div>

            {callStatus === "Connecting..." && (
              <div className="mt-3">
                <Spinner
                  animation="border"
                  variant="primary"
                  className="mb-2"
                />
                <p>Connecting to lawyer...</p>
              </div>
            )}

            {/* Call controls */}
            <div className="call-controls mt-4">
              <div className="controls-container justify-content-center">
                <Button
                  className={`control-btn ${getAudioState() ? "" : "muted"}`}
                  onClick={toggleAudio}
                  size="sm"
                >
                  <i
                    className={`fas fa-microphone${
                      getAudioState() ? "" : "-slash"
                    }`}
                  ></i>
                </Button>
                <Button
                  className="control-btn end-call"
                  onClick={leaveChannel}
                  size="sm"
                >
                  <i className="fas fa-phone-slash"></i>
                </Button>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    );
  };

  // ⏳ Waiting screen for chat
  if (paymentSuccess && serviceType === "chat" && !bookingAccepted) {
    return (
      <Modal show={internalShow} onHide={handleHide} centered size="sm">
        <Modal.Body className="text-center py-4">
          <div className="mb-3">
            <Spinner animation="border" variant="primary" />
          </div>
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
      <Modal
        show={internalShow}
        onHide={handleHide}
        centered
        size="lg"
        className="chat-modal"
      >
        <Modal.Header className="chat-header">
          <div className="d-flex align-items-center">
            <div className="chat-icon me-2">
              <i className={`fas ${serviceDetails[serviceType]?.icon}`}></i>
            </div>
            <Modal.Title className="mb-0">Chat with {lawyer?.name}</Modal.Title>
          </div>
          <Button variant="close" onClick={handleHide} />
        </Modal.Header>
        <Modal.Body style={{ height: "400px", overflow: "hidden" }}>
          {sessionToken && bookingId && lawyer && currentUser?._id ? (
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
    <Modal show={internalShow} onHide={handleHide} centered size="md">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className={`fas ${serviceDetails[serviceType]?.icon} me-2`}></i>
          {serviceDetails[serviceType]?.name || "Consultation"} Payment
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <div className="mb-3">
            <div className="payment-icon mx-auto">
              <i
                className={`fas ${serviceDetails[serviceType]?.icon} fa-2x`}
                style={{ color: serviceDetails[serviceType]?.color }}
              ></i>
            </div>
          </div>
          <h5>Consultation with {lawyer?.name}</h5>
          <p className="text-muted">{lawyer?.specialization}</p>
        </div>

        <div className="payment-details-card p-3 mb-3">
          <div className="detail-row d-flex justify-content-between mb-2">
            <span className="text-muted">Service:</span>
            <span>{serviceDetails[serviceType]?.name}</span>
          </div>
          <div className="detail-row d-flex justify-content-between mb-2">
            <span className="text-muted">Lawyer:</span>
            <span>{lawyer?.name}</span>
          </div>
          <div className="detail-row d-flex justify-content-between mb-2">
            <span className="text-muted">Specialization:</span>
            <span>{lawyer?.specialization}</span>
          </div>
          <hr />
          <div className="detail-row d-flex justify-content-between">
            <strong>Total Amount:</strong>
            <strong
              className="h5 mb-0"
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
          className="rounded-pill px-3"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handlePayNow}
          disabled={loading}
          style={{
            background: serviceDetails[serviceType]?.color,
            borderColor: serviceDetails[serviceType]?.color,
            borderRadius: "20px",
            padding: "8px 20px",
          }}
          className="rounded-pill px-4"
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
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

// Add these styles to your CSS file
const styles = `
.call-modal .modal-content {
  border-radius: 12px;
  overflow: hidden;
}

.call-header {
  background: linear-gradient(135deg, #1c1c84, #2e2ea1);
  color: white;
  border: none;
  padding: 1rem;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-indicator.connected {
  background-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
}

.status-indicator.connecting {
  background-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.3);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.call-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: #fff;
}

.call-subtitle {
  font-size: 0.8rem;
  color: #e0e7ff;
}

.call-duration {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e0e7ff;
  margin-right: 10px;
}

.call-body {
  padding: 0;
}

.video-call-container {
  position: relative;
  height: 300px;
  background: #1f2937;
}

.remote-video-container {
  width: 100%;
  height: 100%;
  background-color: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-placeholder {
  text-align: center;
  color: #d1d5db;
}

.avatar-container {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.avatar-container i {
  font-size: 2rem;
  color: #9ca3af;
}

.connection-status {
  position: absolute;
  top: 1rem;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 10;
  background: rgba(0, 0, 0, 0.7);
  color: #22c55e;
  padding: 0.3rem;
  font-size: 0.8rem;
}

.local-video-container {
  position: absolute;
  bottom: 70px;
  right: 15px;
  width: 100px;
  height: 75px;
  z-index: 20;
  border: 2px solid white;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.local-video-preview {
  width: 100%;
  height: 100%;
}

.call-controls {
  position: absolute;
  bottom: 15px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 10;
}

.controls-container {
  display: flex;
  gap: 0.8rem;
  background: rgba(0, 0, 0, 0.6);
  padding: 0.5rem 0.8rem;
  border-radius: 50px;
  backdrop-filter: blur(10px);
}

.control-btn {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  transition: all 0.2s ease;
}

.control-btn:hover {
  transform: scale(1.05);
}

.control-btn.muted {
  background-color: #ef4444 !important;
  color: white !important;
}

.control-btn.end-call {
  background-color: #ef4444;
  color: white;
}

.call-info-section {
  background: #f9fafb;
}

.lawyer-avatar-sm {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.status-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.connected {
  background-color: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.status-badge.connecting {
  background-color: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.status-badge-lg {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  display: inline-block;
}

.status-badge-lg.connected {
  background-color: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.status-badge-lg.connecting {
  background-color: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.audio-call-container {
  padding: 1rem 0;
}

.audio-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1c1c84, #2e2ea1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  color: white;
  font-size: 2.5rem;
}

.payment-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.payment-details-card {
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #4f46e5;
}

.chat-header {
 background: linear-gradient(135deg, #1c1c84, #2e2ea1);
  color: white;
}

.chat-icon {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
`;

// Add styles to the document
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default PaymentModal;
