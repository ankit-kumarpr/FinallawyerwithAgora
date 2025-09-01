// utils/agora.js
const { RtcTokenBuilder, RtcRole, RtmTokenBuilder } = require('agora-access-token');

// IMPORTANT: env vars use karo — kabhi bhi App ID/Certificate hardcode mat karo!
const APP_ID = process.env.AGORA_APP_ID;
const APP_CERT = process.env.AGORA_APP_CERTIFICATE;

if (!APP_ID || !APP_CERT) {
  throw new Error('AGORA_APP_ID / AGORA_APP_CERTIFICATE missing in env');
}

// Stable numeric uid banane ke liye (string id -> 32-bit int)
function uidFromString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  // Convert to positive 32-bit
  return (h >>> 0) % 4294967295 || 1;
}

/**
 * Generate RTC + RTM tokens for a participant
 * @param {string} channelName
 * @param {string} accountId  (e.g., userId or lawyerId)
 * @param {number} ttlSeconds  token validity in seconds
 */
const buildAgoraCredentials = (channelName, uid, tokenExpiry = 3600) => {
  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  
  if (!appID || !appCertificate) {
    throw new Error("Agora credentials not configured");
  }

  // Generate RTC token
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = Math.floor(Date.now() / 1000) + tokenExpiry;
  const privilegeExpiredTs = expirationTimeInSeconds;
  
  const rtcToken = RtcTokenBuilder.buildTokenWithUid(
    appID,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );

  return {
    appId: appID,
    channelName,
    uid,
    rtcToken,
    expiresAt: new Date(expirationTimeInSeconds * 1000).toISOString()
  };
};

module.exports = { buildAgoraCredentials, uidFromString };
