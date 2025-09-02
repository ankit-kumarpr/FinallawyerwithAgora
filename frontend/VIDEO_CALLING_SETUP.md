# Video Calling Setup Guide

## Overview
This guide explains how to set up and troubleshoot the video calling system using Agora RTC.

## Prerequisites
1. Agora account and project
2. Agora App ID and App Certificate
3. Proper environment variables configured

## Environment Variables
Create a `.env` file in your backend directory with:

```env
AGORA_APP_ID=your_actual_agora_app_id
AGORA_APP_CERTIFICATE=your_actual_agora_app_certificate
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

## How Video Calling Works

### 1. User Initiates Video Call
- User selects "Video Call" service type
- Payment is processed through Razorpay
- Agora tokens are generated for both user and lawyer

### 2. Agora Channel Setup
- Unique channel name: `booking-{bookingId}`
- User UID: Random number between 100,000-199,999
- Lawyer UID: Random number between 200,000-299,999

### 3. Video Track Creation
- Audio track: Always created (microphone)
- Video track: Created only for video calls (camera)
- Fallback: If video fails, continues with audio only

### 4. Real-time Communication
- Both parties join the same Agora channel
- Video/audio streams are published and subscribed
- Real-time communication established

## Troubleshooting

### Common Issues

#### 1. "Camera access failed" error
- Check browser permissions for camera access
- Ensure HTTPS is used (required for camera access)
- Check if camera is being used by another application

#### 2. "Agora credentials not configured" error
- Verify `.env` file exists and has correct values
- Restart backend server after updating environment variables
- Check console logs for configuration warnings

#### 3. Video not displaying
- Check browser console for Agora errors
- Verify video elements exist in DOM
- Check if video tracks are properly created and published

#### 4. Connection issues
- Check network connectivity
- Verify Agora App ID and Certificate are correct
- Check if Agora service is available in your region

### Debug Steps

1. **Check Backend Logs**
   - Look for Agora token generation messages
   - Verify channel creation and joining

2. **Check Frontend Console**
   - Look for Agora client initialization messages
   - Check for track creation and publishing logs
   - Verify video element mounting

3. **Test Camera Access**
   - Open browser dev tools
   - Go to Console tab
   - Check for camera permission errors

4. **Verify Agora Configuration**
   - Check if Agora credentials are loaded
   - Verify token generation is working
   - Test with Agora's sample app

## Testing Video Calls

### 1. Basic Test
- Create a test booking with video service
- Complete payment process
- Check if video call UI appears
- Verify camera access

### 2. End-to-End Test
- User initiates video call
- Lawyer accepts call
- Both parties join Agora channel
- Verify video/audio communication

### 3. Fallback Test
- Test with camera disabled
- Verify audio-only fallback works
- Check error handling

## Performance Optimization

### 1. Video Quality
- Default: 1080p (can be adjusted)
- Consider bandwidth limitations
- Implement quality adaptation

### 2. Network Handling
- Implement reconnection logic
- Handle poor network conditions
- Add connection quality indicators

### 3. Resource Management
- Properly dispose of video tracks
- Clean up Agora client on unmount
- Handle browser tab switching

## Security Considerations

1. **Token Expiration**: Agora tokens expire after 1 hour
2. **Channel Isolation**: Each booking has unique channel
3. **User Authentication**: Verify user identity before joining
4. **Rate Limiting**: Implement call frequency limits

## Support

If you encounter issues:
1. Check this troubleshooting guide
2. Review browser console logs
3. Check backend server logs
4. Verify Agora account status
5. Test with Agora's sample applications
