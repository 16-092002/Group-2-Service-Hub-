import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Box,
  IconButton,
  Typography,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from '@mui/material';
import {
  CallEnd,
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  ScreenShare,
  StopScreenShare,
  Chat,
  MoreVert
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

function VideoCallPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [otherUser, setOtherUser] = useState(null);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, ringing, active, ended
  const [incomingCall, setIncomingCall] = useState(false);
  const [callId, setCallId] = useState(null);

  useEffect(() => {
    initializeCall();
    return () => {
      cleanup();
    };
  }, [userId]);

  useEffect(() => {
    let interval;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize socket connection
      const token = localStorage.getItem('token');
      socketRef.current = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
        auth: { token }
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to socket for video call');
      });

      // Handle incoming call events
      socketRef.current.on('video_call_offer', handleIncomingCall);
      socketRef.current.on('video_call_answer', handleCallAnswer);
      socketRef.current.on('video_call_ice_candidate', handleIceCandidate);
      socketRef.current.on('video_call_ended', handleCallEnded);

      // Start outgoing call
      if (userId) {
        await startCall();
      }

    } catch (error) {
      console.error('Error initializing call:', error);
      alert('Could not access camera/microphone');
      navigate(-1);
    }
  };

  const startCall = async () => {
    try {
      setCallStatus('ringing');
      const callId = Date.now().toString();
      setCallId(callId);

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peerConnectionRef.current = peerConnection;

      // Add local stream to peer connection
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('video_call_ice_candidate', {
            to: userId,
            candidate: event.candidate,
            callId
          });
        }
      };

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to other user
      socketRef.current.emit('video_call_offer', {
        to: userId,
        offer,
        callId
      });

    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const handleIncomingCall = async (data) => {
    setIncomingCall(true);
    setCallId(data.callId);
    setOtherUser({ name: data.fromName });
    
    // Create peer connection for incoming call
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    peerConnectionRef.current = peerConnection;

    // Add local stream
    localStreamRef.current.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStreamRef.current);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('video_call_ice_candidate', {
          to: data.from,
          candidate: event.candidate,
          callId: data.callId
        });
      }
    };

    // Set remote description
    await peerConnection.setRemoteDescription(data.offer);
  };

  const acceptCall = async () => {
    try {
      setIncomingCall(false);
      setIsCallActive(true);
      setCallStatus('active');

      // Create answer
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      // Send answer
      socketRef.current.emit('video_call_answer', {
        to: userId,
        answer,
        callId
      });

    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const rejectCall = () => {
    setIncomingCall(false);
    socketRef.current.emit('video_call_end', { to: userId, callId });
    navigate(-1);
  };

  const handleCallAnswer = async (data) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(data.answer);
      setIsCallActive(true);
      setCallStatus('active');
    } catch (error) {
      console.error('Error handling call answer:', error);
    }
  };

  const handleIceCandidate = async (data) => {
    try {
      await peerConnectionRef.current.addIceCandidate(data.candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  const handleCallEnded = () => {
    setIsCallActive(false);
    setCallStatus('ended');
    cleanup();
    navigate(-1);
  };

  const endCall = () => {
    socketRef.current.emit('video_call_end', { to: userId, callId });
    setIsCallActive(false);
    setCallStatus('ended');
    cleanup();
    navigate(-1);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        // Replace video track
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
        
        setIsScreenSharing(true);
        
        // Handle screen share end
        videoTrack.onended = () => {
          setIsScreenSharing(false);
          // Switch back to camera
          const cameraTrack = localStreamRef.current.getVideoTracks()[0];
          if (sender && cameraTrack) {
            sender.replaceTrack(cameraTrack);
          }
        };
      } else {
        // Stop screen sharing, switch back to camera
        const cameraTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender && cameraTrack) {
          await sender.replaceTrack(cameraTrack);
        }
        
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Container maxWidth="lg" sx={{ height: '100vh', p: 2 }}>
      <Paper sx={{ 
        height: '100%', 
        backgroundColor: '#1a1a1a', 
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Remote Video (Main) */}
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#333'
        }}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          
          {!isCallActive && (
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <Avatar sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}>
                {otherUser?.name?.charAt(0) || 'U'}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {otherUser?.name || 'Connecting...'}
              </Typography>
              <Typography variant="body1">
                {callStatus === 'ringing' ? 'Calling...' : 
                 callStatus === 'connecting' ? 'Connecting...' : 'Call ended'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Local Video (Picture-in-Picture) */}
        <Box sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 200,
          height: 150,
          backgroundColor: '#555',
          borderRadius: 2,
          overflow: 'hidden',
          border: '2px solid white'
        }}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)' // Mirror effect
            }}
          />
        </Box>

        {/* Call Info */}
        {isCallActive && (
          <Box sx={{
            position: 'absolute',
            top: 20,
            left: 20,
            backgroundColor: 'rgba(0,0,0,0.7)',
            px: 2,
            py: 1,
            borderRadius: 2
          }}>
            <Typography variant="h6">
              {formatDuration(callDuration)}
            </Typography>
          </Box>
        )}

        {/* Controls */}
        <Box sx={{
          position: 'absolute',
          bottom: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 2,
          backgroundColor: 'rgba(0,0,0,0.7)',
          p: 2,
          borderRadius: 3
        }}>
          <IconButton
            onClick={toggleMute}
            sx={{
              backgroundColor: isMuted ? 'error.main' : 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': {
                backgroundColor: isMuted ? 'error.dark' : 'rgba(255,255,255,0.3)'
              }
            }}
          >
            {isMuted ? <MicOff /> : <Mic />}
          </IconButton>

          <IconButton
            onClick={toggleVideo}
            sx={{
              backgroundColor: isVideoOff ? 'error.main' : 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': {
                backgroundColor: isVideoOff ? 'error.dark' : 'rgba(255,255,255,0.3)'
              }
            }}
          >
            {isVideoOff ? <VideocamOff /> : <Videocam />}
          </IconButton>

          <IconButton
            onClick={toggleScreenShare}
            sx={{
              backgroundColor: isScreenSharing ? 'primary.main' : 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': {
                backgroundColor: isScreenSharing ? 'primary.dark' : 'rgba(255,255,255,0.3)'
              }
            }}
          >
            {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
          </IconButton>

          <IconButton
            onClick={endCall}
            sx={{
              backgroundColor: 'error.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'error.dark'
              }
            }}
          >
            <CallEnd />
          </IconButton>

          <IconButton
            onClick={() => navigate(`/chat/${userId}`)}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            <Chat />
          </IconButton>
        </Box>
      </Paper>

      {/* Incoming Call Dialog */}
      <Dialog open={incomingCall} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}>
            {otherUser?.name?.charAt(0)}
          </Avatar>
          <Typography variant="h5">
            Incoming call from {otherUser?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography align="center" color="text.secondary">
            Would you like to accept this video call?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
          <Button
            onClick={rejectCall}
            variant="outlined"
            color="error"
            size="large"
          >
            Decline
          </Button>
          <Button
            onClick={acceptCall}
            variant="contained"
            color="success"
            size="large"
          >
            Accept
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default VideoCallPage;