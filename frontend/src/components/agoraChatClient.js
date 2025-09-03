// Lightweight Agora Chat (RTM) wrapper using @easemob/chat SDK
// If the local package isn't installed, we fall back to CDN ESM build.

let ChatSDK = null;
let chatClient = null;

async function loadChatSDK() {
  if (ChatSDK) return ChatSDK;
  // Always load from CDN to avoid bundler resolution issues
  const cdn = await import(
    /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/agora-chat@4.8.0/AgoraChat-esm.js"
  );
  ChatSDK = cdn.default || cdn;
  return ChatSDK;
}

export async function initAgoraChat({ appKey, username, accessToken, onMessage, onTyping }) {
  if (chatClient) return chatClient;

  const SDK = await loadChatSDK();
  chatClient = SDK.create({ appKey });

  chatClient.addEventHandler("handler", {
    onTextMessage: (msg) => {
      if (onMessage) onMessage(msg);
    },
    onCustomMessage: (msg) => {
      if (msg?.event === "typing" && onTyping) onTyping(msg);
    },
    onError: (e) => console.error("AgoraChat error", e),
  });

  await chatClient.open({ user: username, accessToken });
  return chatClient;
}

export async function sendText({ to, text }) {
  if (!chatClient) throw new Error("Chat not initialized");
  return chatClient.send({ type: "txt", chatType: "singleChat", to, msg: text });
}

export async function sendTyping({ to }) {
  if (!chatClient) return;
  return chatClient.send({ type: "custom", chatType: "singleChat", to, event: "typing" });
}

export function getClient() {
  return chatClient;
}


