import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Chip,
  Button,
  Dialog,
  DialogContent,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Send,
  AttachFile,
  VideoCall,
  Phone,
  MoreVert,
  EmojiEmotions,
  Image,
  LocationOn
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';

function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chat, setChat] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [fileDialog, setFileDialog] = useState(false);

  useEffect(() => {
    initializeChat();
    connectSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setChat(response.data);
      setMessages(response.data.messages || []);
      
      // Find the other user
      const currentUserId = getCurrentUserId();
      const other = response.data.participants.find(p => p._id !== currentUserId);
      setOtherUser(other);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading chat:', error);
      navigate('/');
    }
  };

  const connectSocket = () => {
    const token = localStorage.getItem('token');
    socketRef.current = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join_chat', { chatId });
    });

    socketRef.current.on('new_message', (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => [...prev, data.message]);
      }
    });

    socketRef.current.on('user_typing', (data) => {
      if (data.userId !== getCurrentUserId()) {
        setTyping(data.isTyping);
      }
    });
  };

  const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    }
    return null;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/chat/${chatId}/messages`, {
        content: newMessage,
        messageType: 'text'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = (isTyping) => {
    if (socketRef.current) {
      if (isTyping) {
        socketRef.current.emit('typing_start', { chatId });
      } else {
        socketRef.current.emit('typing_stop', { chatId });
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('chatFile', file);

      const token = localStorage.getItem('token');
      const uploadResponse = await axios.post('/api/upload/chat-file', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      await axios.post(`/api/chat/${chatId}/messages`, {
        content: file.name,
        messageType: file.type.startsWith('image/') ? 'image' : 'file',
        fileUrl: uploadResponse.data.url,
        fileName: file.name
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFileDialog(false);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleVideoCall = () => {
    if (otherUser) {
      navigate(`/video-call/${otherUser._id}`);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Loading chat...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 2, height: 'calc(100vh - 100px)' }}>
      <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Chat Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 2 }}>
              {otherUser?.name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6">{otherUser?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {otherUser?.role === 'technician' ? 'Technician' : 'Customer'}
              </Typography>
            </Box>
          </Box>
          
          <Box>
            <IconButton onClick={handleVideoCall}>
              <VideoCall />
            </IconButton>
            <IconButton>
              <Phone />
            </IconButton>
            <IconButton>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* Messages Area */}
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <List sx={{ width: '100%' }}>
            {messages.map((message, index) => {
              const isOwnMessage = message.sender._id === getCurrentUserId();
              return (
                <ListItem
                  key={message._id || index}
                  sx={{
                    display: 'flex',
                    justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                    px: 1,
                    py: 0.5
                  }}
                >
                  <Card
                    sx={{
                      maxWidth: '70%',
                      backgroundColor: isOwnMessage ? 'primary.main' : 'grey.100',
                      color: isOwnMessage ? 'white' : 'text.primary'
                    }}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      {message.messageType === 'image' && (
                        <img
                          src={message.fileUrl}
                          alt="Shared"
                          style={{ maxWidth: '100%', borderRadius: 4, marginBottom: 8 }}
                        />
                      )}
                      
                      {message.messageType === 'file' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AttachFile sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {message.fileName || 'File'}
                          </Typography>
                        </Box>
                      )}
                      
                      <Typography variant="body2">
                        {message.content}
                      </Typography>
                      
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          textAlign: 'right',
                          mt: 0.5,
                          opacity: 0.7
                        }}
                      >
                        {formatTime(message.createdAt)}
                      </Typography>
                    </CardContent>
                  </Card>
                </ListItem>
              );
            })}
          </List>
          
          {typing && (
            <Box sx={{ px: 2, py: 1 }}>
              <Chip 
                label={`${otherUser?.name} is typing...`}
                size="small"
                variant="outlined"
              />
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>

        {/* Message Input */}
        <Box sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <IconButton onClick={() => setFileDialog(true)}>
            <AttachFile />
          </IconButton>
          
          <TextField
            fullWidth
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping(e.target.value.length > 0);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            multiline
            maxRows={3}
            variant="outlined"
            size="small"
          />
          
          <IconButton 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            color="primary"
          >
            <Send />
          </IconButton>
        </Box>
      </Paper>

      {/* File Upload Dialog */}
      <Dialog open={fileDialog} onClose={() => setFileDialog(false)}>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Share File
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button
                  fullWidth
                  variant="outlined"
                  component="span"
                  startIcon={<Image />}
                >
                  Image
                </Button>
              </label>
            </Grid>
            <Grid item xs={6}>
              <input
                type="file"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button
                  fullWidth
                  variant="outlined"
                  component="span"
                  startIcon={<AttachFile />}
                >
                  File
                </Button>
              </label>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Container>
  );
}

export default ChatPage;