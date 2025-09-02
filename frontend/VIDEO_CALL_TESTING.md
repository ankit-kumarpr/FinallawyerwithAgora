# Video Call Testing Guide

## Quick Test Steps

### 1. **Test Video Call Button**
- Go to Find Lawyer page
- Click on any lawyer
- Click the "Video" button (should open payment modal, not "Coming Soon")

### 2. **Test Payment Flow**
- Complete payment process
- Video call UI should appear after successful payment
- Check browser console for Agora initialization messages

### 3. **Test Camera Access**
- Grant camera permissions when prompted
- Local video preview should appear in bottom-right corner
- Check if camera is working

### 4. **Test Controls**
- Click microphone button - should mute/unmute audio
- Click video button - should turn video on/off
- Button colors should change (green = enabled, red = disabled)

### 5. **Test Remote Video**
- Lawyer should accept the call
- Remote video should appear in main area
- Check debug panel for connection status

## Debug Information

### **Debug Panel Shows:**
- **Status**: Current call status (Connecting, Connected, etc.)
- **Local Tracks**: Number of audio/video tracks created
- **Remote Users**: Number of connected remote users
- **Audio**: ON/OFF status of microphone
- **Video**: ON/OFF status of camera

### **Console Logs to Check:**
```
✅ Agora client initialized
✅ User joined Agora channel
✅ Audio track created successfully
✅ Video track created successfully
✅ User published tracks
✅ User subscribed to remote media: video from user: [UID]
✅ Remote video track playing for user: [UID]
```

## Common Issues & Solutions

### **Issue: Camera not working**
**Solution:**
- Check browser permissions (camera access)
- Ensure HTTPS is used
- Check if camera is used by another app
- Look for console errors

### **Issue: Can't see other person's video**
**Solution:**
- Check debug panel for remote users count
- Verify both parties joined the channel
- Check console for subscription errors
- Ensure lawyer accepted the call

### **Issue: Mute/Video buttons not working**
**Solution:**
- Check if tracks are properly created
- Verify track.enabled property exists
- Look for console errors in toggle functions

### **Issue: No audio/video after joining**
**Solution:**
- Check if tracks are published successfully
- Verify Agora tokens are valid
- Check network connectivity
- Restart call if needed

## Testing Checklist

- [ ] Video call button opens payment modal
- [ ] Payment process completes successfully
- [ ] Video call UI appears
- [ ] Camera permission granted
- [ ] Local video preview shows
- [ ] Microphone button works (mute/unmute)
- [ ] Video button works (on/off)
- [ ] Lawyer can accept call
- [ ] Remote video displays
- [ ] Audio communication works
- [ ] Debug panel shows correct info

## Performance Testing

### **Video Quality:**
- Check if 1080p video is smooth
- Monitor CPU usage during calls
- Test with different network conditions

### **Connection Stability:**
- Test call duration (should work for full session)
- Check reconnection if network drops
- Verify proper cleanup when call ends

## Browser Compatibility

### **Supported Browsers:**
- Chrome (recommended)
- Firefox
- Safari
- Edge

### **Requirements:**
- HTTPS connection (required for camera access)
- Camera and microphone permissions
- WebRTC support enabled

## Troubleshooting Commands

### **Check Browser Console:**
```javascript
// Check if Agora client is initialized
console.log(window.AgoraRTC);

// Check local tracks
console.log(localTracks);

// Check remote users
console.log(remoteUsers);
```

### **Check Network:**
- Open DevTools → Network tab
- Look for Agora WebSocket connections
- Check for failed requests

### **Check Permissions:**
- Open DevTools → Application tab
- Check Camera and Microphone permissions
- Ensure they are set to "Allow"

## Support Commands

If you need to debug further, add these to your code:

```javascript
// Add to PaymentModal.jsx for debugging
console.log("🔍 Debug Info:", {
  agoraClient: !!agoraClient,
  localTracks: localTracks.length,
  remoteUsers: Object.keys(remoteUsers),
  serviceType,
  isInCall,
  callStatus
});
```

## Expected Behavior

1. **User clicks Video** → Payment modal opens
2. **Payment completes** → Video call UI appears
3. **Camera permission** → Local video shows
4. **Lawyer accepts** → Remote video appears
5. **Controls work** → Mute/unmute, video on/off
6. **Call ends** → Proper cleanup and return to main UI

## Success Indicators

- ✅ Video call button works (no "Coming Soon")
- ✅ Camera access granted
- ✅ Local video preview visible
- ✅ Remote video displays when lawyer joins
- ✅ Audio/video controls functional
- ✅ Debug panel shows correct information
- ✅ Console logs show successful connections
