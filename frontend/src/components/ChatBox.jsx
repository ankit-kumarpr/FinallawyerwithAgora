import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../components/AuthContext";
import { initSocket, getSocket } from "../components/socket";
import { toast } from "react-toastify";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import styled from "styled-components";
import {
  Paper,
  Avatar,
  Typography,
  IconButton,
  TextField,
  Button,
  Badge,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Send as SendIcon,
  InsertEmoticon as EmojiIcon,
  AttachFile as AttachFileIcon,
  Timer as TimerIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

// Styled components (No changes needed)
const ChatContainer = styled(Paper)`
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  border-radius: 0;
  position: relative;
  overflow: hidden;

  @media (min-width: 768px) {
    height: 80vh;
    max-height: 800px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
`;

const ChatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #1976d2;
  color: white;
  position: relative;
  z-index: 10;
`;

const ProfileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatusBadge = styled(Badge)`
  & .MuiBadge-badge {
    right: 5px;
    top: 5px;
    border: 2px solid white;
  }
`;

const SessionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  &.sent {
    align-self: flex-end;
    background-color: #1976d2;
    color: white;
    border-bottom-right-radius: 4px;
  }

  &.received {
    align-self: flex-start;
    background-color: white;
    color: #333;
    border-bottom-left-radius: 4px;
  }
`;

const MessageMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  margin-bottom: 4px;
  opacity: 0.8;
`;

const InputContainer = styled.form`
  display: flex;
  padding: 12px;
  background-color: white;
  border-top: 1px solid #e0e0e0;
  align-items: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 24px;
  color: #666;
`;

const TypingIndicator = styled.div`
  padding: 8px 16px;
  font-size: 0.85rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EmojiPickerContainer = styled.div`
  position: absolute;
  bottom: 70px;
  right: 20px;
  z-index: 100;
`;

const FileInput = styled.input`
  display: none;
`;

const ChatBox = ({
  sessionToken,
  chatDuration,
  lawyer,
  client,
  bookingId,
  role = "client",
  currentUser: passedUser,
  onReady,
}) => {
  const emojiPickerRef = useRef(null);
  const auth = useAuth();
  const currentUser = passedUser || auth?.currentUser;

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [remainingTime, setRemainingTime] = useState(chatDuration * 60);
  const [sessionStatus, setSessionStatus] = useState("waiting");
  const [socketConnected, setSocketConnected] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = sessionToken || sessionStorage.getItem("token");
    if (!token || !bookingId || !currentUser?._id) {
      console.warn("⏳ ChatBox waiting for props...");
      return;
    }

    const socket = getSocket();
    if (!socket) {
      console.error(
        "❌ Socket has not been initialized. Cannot establish chat."
      );
      return;
    }
    socketRef.current = socket;

    // --- Fetch history ---
    const fetchChatHistory = async () => {
      try {
        const res = await axios.get(
          `http://localhost:4000/lawapi/common/gethistory/${bookingId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.data.error && Array.isArray(res.data.data)) {
          const sortedMessages = res.data.data.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
          setMessages(sortedMessages);
        }
      } catch (err) {
        console.error(
          "❌ Error fetching chat history",
          err.response?.data || err.message
        );
      }
    };
    fetchChatHistory();

    // --- Event handlers ---
    const handleConnect = () => {
      setSocketConnected(true);
      socket.emit("join-booking", bookingId);
      console.log("✅ Joined booking room", bookingId);
      if (onReady) onReady();
    };

    const handleDisconnect = () => setSocketConnected(false);

    const handleSessionStarted = (data) => {
      if (data.bookingId === bookingId) {
        setSessionStatus("active");
        setRemainingTime(data.duration || chatDuration * 60);
        toast.success("✅ Session started!");
      }
    };

    const handleNewMessage = (msg) => {
      if (msg.bookingId === bookingId && msg.senderId !== currentUser._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleTypingIndicator = (data) => {
      if (data.bookingId === bookingId && data.senderId !== currentUser._id) {
        setOtherTyping(true);
        setTimeout(() => setOtherTyping(false), 2000);
      }
    };

    const handleSessionEnded = () => {
      setSessionStatus("expired");
      toast.info("⚠️ Session has ended.");
    };

    // --- Attach listeners ---
    if (socket.connected) {
      handleConnect();
    }
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("session-started", handleSessionStarted);
    socket.on("new-message", handleNewMessage);
    socket.on("session-ended", handleSessionEnded);
    socket.on("typing", handleTypingIndicator);

    // --- Cleanup ---
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("session-started", handleSessionStarted);
      socket.off("new-message", handleNewMessage);
      socket.off("session-ended", handleSessionEnded);
      socket.off("typing", handleTypingIndicator);
    };
  }, [bookingId, currentUser?._id, sessionToken]); // 👈 add deps

  useEffect(() => {
    if (sessionStatus !== "active" || remainingTime <= 0) return;
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSessionStatus("expired");
          socketRef.current?.emit("end-session", { bookingId });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStatus, remainingTime, bookingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || sessionStatus !== "active" || !socketConnected)
      return;

    const token = sessionToken || sessionStorage.getItem("token");
    const msgData = {
      id: uuidv4(), // Temporary ID for React key purposes
      sender: currentUser.name,
      senderId: currentUser._id,
      senderRole: role,
      content: message,
      type: "text",
      bookingId,
      timestamp: new Date().toISOString(),
    };

    // Emit the message to the server
    socketRef.current?.emit("chat-message", msgData);

    // Optimistically add the message to our own UI
    setMessages((prev) => [...prev, msgData]);
    setMessage("");

    // Persist the message to the database in the background
    // try {
    //   await axios.post(
    //     'http://localhost:4000/lawapi/common/sendmessage',
    //     { bookingId, content: message, files: [] },
    //     { headers: { Authorization: `Bearer ${token}` } }
    //   );
    // } catch (err) {
    //   console.error('❌ Failed to save message', err.response?.data || err.message);
    // toast.error("Failed to send message.");
    // Optional: Here you could implement logic to mark the message as "failed" in the UI
    // }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socketRef.current?.emit("typing", { bookingId, senderId: currentUser._id });
  };

  const handleEndSession = () => {
    if (window.confirm("Are you sure you want to end this session?")) {
      socketRef.current?.emit("end-session", { bookingId });
      setSessionStatus("expired");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = sessionToken || sessionStorage.getItem("token");
    const reader = new FileReader();
    reader.onloadend = async () => {
      const msg = {
        id: uuidv4(),
        sender: currentUser.name,
        senderId: currentUser._id,
        senderRole: role,
        content: reader.result,
        filename: file.name,
        fileType: file.type,
        type: "file",
        bookingId,
        timestamp: new Date().toISOString(),
      };

      socketRef.current?.emit("chat-message", msg);
      setMessages((prev) => [...prev, msg]);

      try {
        await axios.post(
          "http://localhost:4000/lawapi/common/sendmessage",
          {
            bookingId,
            content: `File: ${file.name}`,
            files: [
              {
                fileUrl: reader.result,
                fileType: file.type,
                fileName: file.name,
              },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (err) {
        console.error("❌ Failed to save file message", err);
        toast.error("Failed to upload file.");
      }
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (secs) =>
    `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, "0")}`;

  return (
    <ChatContainer elevation={3}>
      <ChatHeader>
        <ProfileInfo>
          <StatusBadge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="dot"
            color={socketConnected ? "success" : "error"}
          >
            <Avatar sx={{ bgcolor: "white", color: "#1976d2" }}>
              {(role === "lawyer" ? client?.name || "C" : lawyer?.name || "L")
                .charAt(0)
                .toUpperCase()}
            </Avatar>
          </StatusBadge>
          <div>
            <Typography variant="subtitle1" fontWeight="bold">
              {role === "lawyer"
                ? client?.name || "Client"
                : lawyer?.name || "Lawyer"}
            </Typography>
            <Typography
              variant="caption"
              display="flex"
              alignItems="center"
              gap={0.5}
            >
              <WorkIcon fontSize="inherit" />
              {role === "lawyer"
                ? "Client"
                : lawyer?.specialization || "Legal Professional"}
            </Typography>
          </div>
        </ProfileInfo>
        <SessionInfo>
          <Tooltip title="Time remaining">
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <TimerIcon fontSize="small" />
              <Typography variant="body2">
                {formatTime(remainingTime)}
              </Typography>
            </div>
          </Tooltip>
          {sessionStatus === "active" && (
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={handleEndSession}
              endIcon={<CloseIcon />}
            >
              End
            </Button>
          )}
        </SessionInfo>
      </ChatHeader>
      <MessagesContainer>
        {sessionStatus === "waiting" ? (
          <EmptyState>
            <CircularProgress size={48} thickness={4} />
            <Typography variant="h6" mt={2}>
              Setting up your secure consultation...
            </Typography>
            <Typography variant="body2" mt={1}>
              Please wait while we connect you with{" "}
              {role === "lawyer" ? "the client" : "your attorney"}
            </Typography>
          </EmptyState>
        ) : messages.length === 0 && sessionStatus === "active" ? (
          <EmptyState>
            <Typography variant="h5" color="primary">
              ⚖️ Secure Legal Consultation
            </Typography>
            <Typography variant="body1" mt={2}>
              This is a private, encrypted conversation.
            </Typography>
            <Typography variant="body2">
              You can start the conversation now.
            </Typography>
          </EmptyState>
        ) : (
          messages
            .filter((msg) => msg?.content)
            .map((msg, index) => (
              <MessageBubble
                key={msg.id || msg._id || `${msg.timestamp}-${index}`}
                className={
                  msg.senderId === currentUser._id ? "sent" : "received"
                }
              >
                <MessageMeta>
                  <span>
                    {msg.senderRole === "lawyer" ? (
                      <WorkIcon
                        fontSize="inherit"
                        sx={{ verticalAlign: "middle", mr: 0.5 }}
                      />
                    ) : (
                      <PersonIcon
                        fontSize="inherit"
                        sx={{ verticalAlign: "middle", mr: 0.5 }}
                      />
                    )}
                    {msg.sender}
                  </span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </MessageMeta>
                {msg.type === "file" ? (
                  msg.fileType && msg.fileType.startsWith("image") ? (
                    <img
                      src={msg.content}
                      alt={msg.filename}
                      style={{
                        maxWidth: "100%",
                        borderRadius: 8,
                        marginTop: 4,
                      }}
                    />
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      href={msg.content}
                      download={msg.filename}
                      target="_blank"
                      rel="noreferrer"
                      sx={{ mt: 1, textTransform: "none" }}
                    >
                      📄 {msg.filename || "Download File"}
                    </Button>
                  )
                ) : (
                  <div>{msg.content}</div>
                )}
              </MessageBubble>
            ))
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      {sessionStatus === "active" && (
        <>
          {otherTyping && (
            <TypingIndicator>
              <CircularProgress size={12} thickness={5} />
              <span>
                {role === "lawyer" ? "Client" : "Lawyer"} is typing...
              </span>
            </TypingIndicator>
          )}
          <InputContainer onSubmit={handleSendMessage}>
            <Tooltip title="Add emoji">
              <IconButton onClick={() => setShowEmojiPicker((prev) => !prev)}>
                <EmojiIcon color="primary" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Attach file">
              <IconButton onClick={() => fileInputRef.current.click()}>
                <AttachFileIcon color="primary" />
              </IconButton>
            </Tooltip>
            <FileInput
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,application/pdf,.doc,.docx"
            />
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Type your message..."
              value={message}
              onChange={handleTyping}
              disabled={!socketConnected}
              sx={{ mx: 1 }}
              autoComplete="off"
            />
            <Tooltip title="Send message">
              <span>
                <IconButton
                  type="submit"
                  color="primary"
                  disabled={!message.trim() || !socketConnected}
                >
                  <SendIcon />
                </IconButton>
              </span>
            </Tooltip>
          </InputContainer>
        </>
      )}
    </ChatContainer>
  );
};

export default ChatBox;
