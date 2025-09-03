import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Button,
  Alert,
  Spinner,
  Badge,
  Card,
  ListGroup,
} from "react-bootstrap";
import { getSocket } from "../../components/socket";
import AgoraRTC from "agora-rtc-sdk-ng";

const Livechat = () => {
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [socketId, setSocketId] = useState(null);
  const [incomingCalls, setIncomingCalls] = useState([]);
  const [activeCalls, setActiveCalls] = useState([]);
  const [showCallModal, setShowCallModal] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [agoraCredentials, setAgoraCredentials] = useState(null);
  const [apiResponses, setApiResponses] = useState([]);
  const [agoraClient, setAgoraClient] = useState(null);
  const [localTracks, setLocalTracks] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState({});
  const [isInCall, setIsInCall] = useState(false);
  const [callStatus, setCallStatus] = useState("");

  const socketRef = useRef(null);

  // Initialize Agora client
  useEffect(() => {
    try {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setAgoraClient(client);
      console.log("✅ Lawyer Agora client initialized");
    } catch (error) {
      console.error("❌ Failed to initialize lawyer Agora client:", error);
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
          "✅ Lawyer subscribed to user media:",
          mediaType,
          "from user:",
          user.uid
        );

        if (mediaType === "video") {
          const remoteVideoContainer = document.getElementById(
            "lawyer-remote-video"
          );
          if (remoteVideoContainer) {
            // Clear any existing content
            remoteVideoContainer.innerHTML = "";

            // Create a new video element for the remote user
            const videoElement = document.createElement("div");
            videoElement.id = `lawyer-remote-video-${user.uid}`;
            videoElement.style.width = "100%";
            videoElement.style.height = "100%";
            remoteVideoContainer.appendChild(videoElement);

            // Play the remote video
            user.videoTrack.play(`lawyer-remote-video-${user.uid}`);
            console.log(
              "✅ Lawyer remote video track playing for user:",
              user.uid
            );
          } else {
            console.error("❌ Lawyer remote video container not found");
          }
        }

        if (mediaType === "audio") {
          user.audioTrack.play();
          setCallStatus("Connected");
          console.log(
            "✅ Lawyer remote audio track playing for user:",
            user.uid
          );
        }

        setRemoteUsers((prev) => ({ ...prev, [user.uid]: user }));
      } catch (error) {
        console.error("Error handling user published:", error);
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
      handleEndCall();
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

  // Effect to handle remote video display when remote users change
  useEffect(() => {
    if (Object.keys(remoteUsers).length > 0) {
      console.log("🔍 Remote users updated:", Object.keys(remoteUsers));

      // Force re-render of remote video
      const remoteVideoContainer = document.getElementById(
        "lawyer-remote-video"
      );
      if (remoteVideoContainer) {
        // Clear and recreate video elements
        remoteVideoContainer.innerHTML = "";

        Object.values(remoteUsers).forEach((user) => {
          if (user.videoTrack) {
            const videoElement = document.createElement("div");
            videoElement.id = `lawyer-remote-video-${user.uid}`;
            videoElement.style.width = "100%";
            videoElement.style.height = "100%";
            remoteVideoContainer.appendChild(videoElement);

            try {
              user.videoTrack.play(`lawyer-remote-video-${user.uid}`);
              console.log("✅ Recreated remote video for user:", user.uid);
            } catch (error) {
              console.error("❌ Error playing remote video:", error);
            }
          }
        });
      }
    }
  }, [remoteUsers]);

  useEffect(() => {
    const socket = getSocket();
    const userData = JSON.parse(sessionStorage.getItem("userData"));
    const lawyerId = userData?.lawyerId || userData?.userId;

    if (!socket || !lawyerId) {
      console.warn("⚠️ Socket not initialized or missing user ID");
      setConnectionStatus("error");
      return;
    }

    socketRef.current = socket;

    setConnectionStatus(socket.connected ? "connected" : "connecting");
    setSocketId(socket.id);

    const onConnect = () => {
      console.log("✅ Socket connected:", socket.id);
      setConnectionStatus("connected");
      setSocketId(socket.id);

      socket.emit("join-lawyer", lawyerId, (response) => {
        if (response?.status === "success") {
          console.log(`🔗 Joined lawyer room: ${lawyerId}`);
          addApiResponse("join-lawyer", response);
        } else {
          console.error("Join failed:", response);
        }
      });
    };

    const onDisconnect = (reason) => {
      console.warn("🔌 Socket disconnected:", reason);
      setConnectionStatus("disconnected");
      setSocketId(null);
    };

    const onConnectError = (err) => {
      console.error("❌ Socket error:", err);
      setConnectionStatus("error");
      setSocketId(null);
    };

    const onIncomingCall = (data) => {
      // Only treat as call popup for call/video
      if (data?.mode === "chat") return;
      console.log("📞 Incoming call:", data);
      addApiResponse("incoming-call", data);

      const safeData = {
        ...data,
        user: data.user || { name: "Unknown Client", id: "unknown" },
      };
      setIncomingCalls((prev) => [...prev, safeData]);

      if (Notification.permission === "granted") {
        new Notification("New Consultation Request", {
          body: `Incoming ${data.mode} call from ${safeData.user.name}`,
          icon: "/logo.png",
        });
      }
    };

    const onAgoraCredentials = (data) => {
      console.log("🔑 Received Agora credentials:", data);
      addApiResponse("agora-credentials", data);
      setAgoraCredentials(data);

      sessionStorage.setItem(`agora_${data.channelName}`, JSON.stringify(data));

      console.log("🎯 Lawyer Agora RTC Token:", data.token);
      console.log("🎯 Lawyer Agora UID:", data.uid);
      console.log("🎯 Agora Channel:", data.channelName);

      if (currentCall) {
        setCurrentCall((prev) => ({ ...prev, agora: data }));
      }
    };

    const onSessionStarted = (data) => {
      console.log("▶️ Session started:", data);
      addApiResponse("session-started", data);

      // Ensure user object exists
      const safeData = {
        ...data,
        user: data.user || { name: "Unknown Client", id: "unknown" },
      };

      setIncomingCalls((prev) =>
        prev.filter((call) => call.bookingId !== data.bookingId)
      );
      setActiveCalls((prev) => [...prev, { ...safeData, status: "active" }]);
    };

    const onCallStatus = (data) => {
      console.log("📱 Call status:", data);
      addApiResponse("call-status", data);

      if (data.status === "ended") {
        setActiveCalls((prev) =>
          prev.filter((call) => call.bookingId !== data.bookingId)
        );
        setIncomingCalls((prev) =>
          prev.filter((call) => call.bookingId !== data.bookingId)
        );

        if (currentCall?.bookingId === data.bookingId) {
          setCurrentCall(null);
          setShowCallModal(false);
          leaveChannel();
        }
      }
    };

    const addApiResponse = (endpoint, data) => {
      const timestamp = new Date().toLocaleTimeString();
      setApiResponses((prev) => [
        ...prev.slice(-9),
        { endpoint, timestamp, data },
      ]);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("incoming-call", onIncomingCall);
    socket.on("booking-notification", (data) => {
      // Chat booking → show in Active Sessions panel
      console.log("💬 Chat booking-notification:", data);
      addApiResponse("booking-notification", data);
      if (data?.mode === "chat") {
        setActiveCalls((prev) => [
          ...prev,
          { ...data, status: "active", startedAt: new Date().toISOString() },
        ]);
      }
    });
    socket.on("agora-credentials", onAgoraCredentials);
    socket.on("session-started", onSessionStarted);
    socket.on("call-status", onCallStatus);

    socket.onAny((event, ...args) => {
      console.log(`📡 Event [${event}]:`, args?.[0] ?? "");
    });

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("incoming-call", onIncomingCall);
      socket.off("agora-credentials", onAgoraCredentials);
      socket.off("session-started", onSessionStarted);
      socket.off("call-status", onCallStatus);
      socket.offAny();
    };
  }, [currentCall]);

  // Join Agora channel for lawyer
  const joinChannel = async (agoraData) => {
    if (!agoraClient || !agoraData || !agoraData.token) {
      console.error(
        "❌ Lawyer Agora client, data, or token not available",
        agoraData
      );
      return;
    }

    try {
      console.log("🎯 Lawyer starting to join Agora channel:", {
        appId: agoraData.appId,
        channelName: agoraData.channelName,
        uid: agoraData.uid,
        mode: currentCall?.mode,
      });

      setCallStatus("Connecting...");

      // Create local tracks based on call type
      let localAudioTrack = null;
      let localVideoTrack = null;

      // Always create audio track for both call and video
      try {
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: "music_standard",
        });
        console.log("✅ Lawyer audio track created successfully");
      } catch (audioError) {
        console.error("❌ Failed to create lawyer audio track:", audioError);
        throw new Error("Failed to access microphone");
      }

      // Create video track only for video calls
      if (currentCall?.mode === "video") {
        try {
          localVideoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: "1080p_1",
          });
          console.log("✅ Lawyer video track created successfully");
        } catch (videoError) {
          console.error("❌ Failed to create lawyer video track:", videoError);
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

      console.log("✅ Lawyer joined Agora channel");
      setIsInCall(true);
      setCallStatus("Waiting for client...");

      // Publish tracks based on call type
      if (currentCall?.mode === "video" && localVideoTrack) {
        await agoraClient.publish([localAudioTrack, localVideoTrack]);

        // Play local video
        const localVideoElement = document.getElementById("lawyer-local-video");
        if (localVideoElement) {
          localVideoTrack.play("lawyer-local-video");
          console.log("✅ Lawyer local video playing");
        }
      } else {
        // For audio calls, publish only audio
        await agoraClient.publish([localAudioTrack]);
        console.log("✅ Lawyer audio track published");
      }

      // Store local tracks for cleanup
      const tracks = [localAudioTrack, localVideoTrack].filter(
        (track) => track !== null
      );
      setLocalTracks(tracks);
      console.log(`✅ Lawyer published ${tracks.length} tracks`);
    } catch (error) {
      console.error("❌ Lawyer failed to join channel:", error);
      setCallStatus("Connection failed");
      alert(`Failed to join call: ${error.message}`);
    }
  };

  // Leave Agora channel
  const leaveChannel = async () => {
    try {
      console.log("🔄 Lawyer leaving Agora channel...");

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
      setCallStatus("");

      console.log("✅ Lawyer left Agora channel");
    } catch (error) {
      console.error("❌ Lawyer failed to leave channel:", error);
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
        console.log(`🎤 Lawyer audio ${newState ? "enabled" : "disabled"}`);
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
        console.log(`📹 Lawyer video ${newState ? "enabled" : "disabled"}`);
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

  const getStatusBadge = () => {
    const statusMap = {
      connecting: { variant: "warning", text: "Connecting..." },
      connected: { variant: "success", text: "Connected" },
      disconnected: { variant: "danger", text: "Disconnected" },
      error: { variant: "danger", text: "Connection Error" },
    };
    const status = statusMap[connectionStatus] || statusMap.disconnected;
    return <Badge bg={status.variant}>{status.text}</Badge>;
  };

  const handleAcceptCall = async (call) => {
    console.log("✅ Accepting call:", call);

    try {
      // Update booking status first
      const token = sessionStorage.getItem("token");
      const res = await fetch(
        `https://lawyerwork.onrender.com/lawapi/common/bookings/${call.bookingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "accepted" }),
        }
      );

      if (res.ok) {
        console.log("✅ Booking accepted successfully");

        // Emit booking accepted event
        socketRef.current.emit("booking-accepted", {
          bookingId: call.bookingId,
          lawyerId: call.lawyerId,
          userId: call.user?.id || call.userId || "unknown",
          duration: call.duration || 900,
        });

        setCurrentCall(call);
        setShowCallModal(true);
        setIncomingCalls((prev) =>
          prev.filter((c) => c.bookingId !== call.bookingId)
        );

        // If we have Agora credentials, join the channel
        if (call.agora) {
          setTimeout(() => {
            joinChannel(call.agora.lawyer);
          }, 1000);
        }
      } else {
        console.error("❌ Failed to accept booking");
        alert("Failed to accept the call. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error accepting call:", error);
      alert("Error accepting the call. Please try again.");
    }
  };

  const handleRejectCall = (call) => {
    console.log("❌ Rejecting call:", call);

    socketRef.current.emit("call-status", {
      bookingId: call.bookingId,
      status: "rejected",
      lawyerId: call.lawyerId,
    });

    setIncomingCalls((prev) =>
      prev.filter((c) => c.bookingId !== call.bookingId)
    );
  };

  const handleEndCall = () => {
    if (currentCall) {
      console.log("📴 Ending call:", currentCall);

      socketRef.current.emit("call-status", {
        bookingId: currentCall.bookingId,
        status: "ended",
        lawyerId: currentCall.lawyerId,
      });

      setActiveCalls((prev) =>
        prev.filter((c) => c.bookingId !== currentCall.bookingId)
      );
      setCurrentCall(null);
      setShowCallModal(false);
      leaveChannel();
    }
  };

  const CopyToClipboard = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <Button variant="outline-secondary" size="sm" onClick={handleCopy}>
        {copied ? "Copied!" : "Copy"}
      </Button>
    );
  };

  const CallModal = () => {
    if (!currentCall) return null;

    const isVideo = currentCall.mode === "video";
    const isAudio = currentCall.mode === "call";
    const userName = currentCall.user?.name || "Client";

    return (
      <Modal
        show={showCallModal}
        onHide={() => setShowCallModal(false)}
        centered
        size="lg"
      >
        <Modal.Header
          closeButton
          style={{
            background: isVideo ? "#dc3545" : "#0d6efd",
            color: "white",
          }}
        >
          <Modal.Title>
            <i className={`fas ${isVideo ? "fa-video" : "fa-phone"} me-2`}></i>
            {isVideo ? "Video" : "Audio"} Call with {userName}
            {callStatus && (
              <span className="badge bg-light text-dark ms-2">
                {callStatus}
              </span>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="mb-4">
            <div className="position-relative">
              <div
                style={{
                  width: "100%",
                  height: isVideo ? "400px" : "150px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {isVideo ? (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "relative",
                    }}
                  >
                    {/* Remote video */}
                    <div
                      id="lawyer-remote-video"
                      style={{ width: "100%", height: "100%" }}
                    >
                      {Object.keys(remoteUsers).length === 0 ? (
                        <div className="text-muted d-flex flex-column align-items-center justify-content-center h-100">
                          <i className="fas fa-user fa-3x mb-2"></i>
                          <div>Waiting for client...</div>
                          <small className="mt-2">
                            Client will appear here when they join
                          </small>
                        </div>
                      ) : (
                        <div className="text-success text-center p-2">
                          <i className="fas fa-check-circle me-2"></i>
                          Client connected ({
                            Object.keys(remoteUsers).length
                          }{" "}
                          user{Object.keys(remoteUsers).length > 1 ? "s" : ""})
                        </div>
                      )}
                    </div>

                    {/* Local video preview */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        width: 120,
                        height: 90,
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "2px solid white",
                        zIndex: 10,
                        backgroundColor: "#000",
                      }}
                    >
                      <div
                        id="lawyer-local-video"
                        style={{ width: "100%", height: "100%" }}
                      ></div>
                    </div>

                    {/* Call controls overlay */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 10,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 10,
                      }}
                    >
                      <div className="d-flex gap-2">
                        <Button
                          variant={getAudioState() ? "outline-light" : "danger"}
                          size="sm"
                          style={{
                            borderRadius: "50%",
                            width: "40px",
                            height: "40px",
                          }}
                          onClick={toggleAudio}
                        >
                          <i
                            className={`fas fa-microphone${
                              getAudioState() ? "" : "-slash"
                            }`}
                          ></i>
                        </Button>
                        <Button
                          variant={getVideoState() ? "outline-light" : "danger"}
                          size="sm"
                          style={{
                            borderRadius: "50%",
                            width: "40px",
                            height: "40px",
                          }}
                          onClick={toggleVideo}
                        >
                          <i
                            className={`fas fa-video${
                              getVideoState() ? "" : "-slash"
                            }`}
                          ></i>
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          style={{
                            borderRadius: "50%",
                            width: "40px",
                            height: "40px",
                          }}
                          onClick={refreshVideoDisplay}
                          title="Refresh Video Display"
                        >
                          <i className="fas fa-sync-alt"></i>
                        </Button>
                      </div>
                    </div>

                    {/* Debug info overlay */}
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        zIndex: 10,
                        background: "rgba(0,0,0,0.7)",
                        color: "white",
                        padding: "8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        maxWidth: "280px",
                      }}
                    >
                      <div>
                        <strong>Debug Info:</strong>
                      </div>
                      <div>Status: {callStatus}</div>
                      <div>Local Tracks: {localTracks.length}</div>
                      <div>Remote Users: {Object.keys(remoteUsers).length}</div>
                      <div>Audio: {getAudioState() ? "ON" : "OFF"}</div>
                      <div>Video: {getVideoState() ? "ON" : "OFF"}</div>
                      <div>
                        Channel: {agoraCredentials?.channelName || "N/A"}
                      </div>
                      {Object.keys(remoteUsers).map((uid) => {
                        const user = remoteUsers[uid];
                        return (
                          <div key={uid} className="mt-1">
                            <div>User: {uid}</div>
                            <div>Video: {user.videoTrack ? "✅" : "❌"}</div>
                            <div>Audio: {user.audioTrack ? "✅" : "❌"}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <i className="fas fa-user fa-4x text-secondary"></i>
                    <div className="mt-2">{userName}</div>
                    {callStatus && (
                      <div className="mt-2 text-muted">{callStatus}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {agoraCredentials && (
            <Alert variant="info" className="small">
              <strong>Agora Channel:</strong> {agoraCredentials.channelName}
              <CopyToClipboard text={agoraCredentials.channelName} />
              <br />
              <strong>Token:</strong> {agoraCredentials.token.substring(0, 20)}
              ...
              <CopyToClipboard text={agoraCredentials.token} />
              <br />
              <strong>UID:</strong> {agoraCredentials.uid}
              <CopyToClipboard text={agoraCredentials.uid} />
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <Button variant="danger" onClick={handleEndCall}>
            <i className="fas fa-phone-slash me-2"></i>End Call
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // Safe user name getter function
  const getUserName = (call) => {
    return call.user?.name || "Unknown Client";
  };

  // Test function to manually refresh video display
  const refreshVideoDisplay = () => {
    console.log("🔄 Manually refreshing video display...");

    if (Object.keys(remoteUsers).length > 0) {
      const remoteVideoContainer = document.getElementById(
        "lawyer-remote-video"
      );
      if (remoteVideoContainer) {
        remoteVideoContainer.innerHTML = "";

        Object.values(remoteUsers).forEach((user) => {
          if (user.videoTrack) {
            const videoElement = document.createElement("div");
            videoElement.id = `lawyer-remote-video-${user.uid}`;
            videoElement.style.width = "100%";
            videoElement.style.height = "100%";
            remoteVideoContainer.appendChild(videoElement);

            try {
              user.videoTrack.play(`lawyer-remote-video-${user.uid}`);
              console.log("✅ Manually refreshed video for user:", user.uid);
            } catch (error) {
              console.error("❌ Error in manual refresh:", error);
            }
          }
        });
      }
    }
  };

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Lawyer Consultation Portal</h2>
        <div>
          {getStatusBadge()}
          {socketId && (
            <Badge bg="secondary" className="ms-2">
              ID: {socketId.slice(0, 6)}...
            </Badge>
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <Alert variant="info">
            You will receive live notifications for new consultation requests
            here.
          </Alert>

          <div className="row">
            <div className="col-md-6">
              <Card className="mb-4">
                <Card.Header className="bg-warning text-dark">
                  <i className="fas fa-phone-incoming me-2"></i>
                  Incoming Calls ({incomingCalls.length})
                </Card.Header>
                <Card.Body className="p-0">
                  {incomingCalls.length === 0 ? (
                    <div className="text-center p-4 text-muted">
                      No incoming calls
                    </div>
                  ) : (
                    <ListGroup variant="flush">
                      {incomingCalls.map((call, index) => (
                        <ListGroup.Item key={index} className="p-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1">
                                {call.mode === "video" ? (
                                  <i className="fas fa-video text-danger me-2"></i>
                                ) : (
                                  <i className="fas fa-phone text-primary me-2"></i>
                                )}
                                {getUserName(call)}
                              </h6>
                              <small className="text-muted">
                                {call.mode} consultation •{" "}
                                {new Date(call.timestamp).toLocaleTimeString()}
                              </small>
                            </div>
                            <div>
                              <Button
                                size="sm"
                                variant="success"
                                className="me-2"
                                onClick={() => handleAcceptCall(call)}
                              >
                                <i className="fas fa-check"></i>
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleRejectCall(call)}
                              >
                                <i className="fas fa-times"></i>
                              </Button>
                            </div>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </div>

            <div className="col-md-6">
              <Card>
                <Card.Header className="bg-success text-white">
                  <i className="fas fa-phone-alt me-2"></i>
                  Active Sessions ({activeCalls.length})
                </Card.Header>
                <Card.Body className="p-0">
                  {activeCalls.length === 0 ? (
                    <div className="text-center p-4 text-muted">
                      No active sessions
                    </div>
                  ) : (
                    <ListGroup variant="flush">
                      {activeCalls.map((call, index) => (
                        <ListGroup.Item key={index} className="p-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1">
                                {call.mode === "video" ? (
                                  <i className="fas fa-video text-danger me-2"></i>
                                ) : call.mode === "call" ? (
                                  <i className="fas fa-phone text-primary me-2"></i>
                                ) : (
                                  <i className="fas fa-comment text-success me-2"></i>
                                )}
                                {getUserName(call)}
                              </h6>
                              <small className="text-muted">
                                {call.mode} session • Started{" "}
                                {new Date(
                                  call.startedAt || call.timestamp
                                ).toLocaleTimeString()}
                              </small>
                            </div>
                            <Badge bg="success">Active</Badge>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <Card>
            <Card.Header className="bg-primary text-white">
              <i className="fas fa-code me-2"></i>
              API Responses & Tokens
            </Card.Header>
            <Card.Body style={{ maxHeight: "400px", overflowY: "auto" }}>
              {apiResponses.length === 0 ? (
                <div className="text-center text-muted p-3">
                  No API responses yet
                </div>
              ) : (
                <div>
                  {apiResponses.map((response, index) => (
                    <div key={index} className="mb-2 p-2 border-bottom">
                      <small>
                        <strong>{response.endpoint}</strong>
                        <span className="text-muted">
                          {" "}
                          at {response.timestamp}
                        </span>
                      </small>
                      <pre
                        className="bg-light p-2 mt-1 small"
                        style={{ fontSize: "10px", overflow: "hidden" }}
                      >
                        {JSON.stringify(response.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      <CallModal />
    </div>
  );
};

export default Livechat;
