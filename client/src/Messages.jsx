import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';

// Custom Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type = 'info' }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'voice': return '📞';
      case 'video': return '📹';
      case 'warning': return '⚠️';
      default: return '💬';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
        <div className="text-center">
          <div className="text-4xl mb-4">{getIcon()}</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex space-x-3 justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Call Status Component
const CallStatus = ({ callStatus, activeCall, onEndCall, callDuration }) => {
  if (!callStatus || callStatus === 'ended') return null;

  const getCallText = () => {
    switch (callStatus) {
      case 'calling': return 'Calling...';
      case 'ringing': return 'Ringing...';
      case 'connected': 
        if (callDuration > 0) {
          const minutes = Math.floor(callDuration / 60);
          const seconds = callDuration % 60;
          return `Call Connected • ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        return 'Call Connected';
      case 'ended': return 'Call Ended';
      default: return 'Call in Progress';
    }
  };

  const getCallIcon = () => {
    return activeCall?.type === 'video' ? '📹' : '📞';
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-40 flex items-center space-x-4">
      <span className="text-xl animate-pulse">{getCallIcon()}</span>
      <div className="flex flex-col">
        <span className="font-medium">{getCallText()}</span>
        <span className="text-xs opacity-90">
          {activeCall?.type === 'video' ? 'Video Call' : 'Voice Call'}
        </span>
      </div>
      {callStatus === 'connected' && (
        <button
          onClick={onEndCall}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2"
        >
          <span>📞</span>
          <span>End Call</span>
        </button>
      )}
      {(callStatus === 'calling' || callStatus === 'ringing') && (
        <button
          onClick={onEndCall}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium"
        >
          Cancel
        </button>
      )}
    </div>
  );
};

// Call Interface Component with WebRTC
// Call Interface Component with WebRTC
const CallInterface = ({ 
  call, 
  onEndCall, 
  callDuration, 
  isIncoming = false, 
  incomingCall, 
  onAcceptCall, 
  onRejectCall, 
  activeConversation,
  localStream,
  remoteStream,
  isMuted,
  onToggleMute,
  isVideoEnabled,
  onToggleVideo
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isSpeaker, setIsSpeaker] = useState(false);

  // Set up video streams when available - MOVED BEFORE EARLY RETURN
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  // Early return after hooks
  if (!call && !isIncoming) return null;

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const currentCall = isIncoming ? incomingCall : call;

  const handleSpeakerToggle = () => {
    setIsSpeaker(!isSpeaker);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !isSpeaker;
    }
    toast.info(isSpeaker ? 'Speaker off' : 'Speaker on');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center text-white w-full h-full">
        {/* Video Streams */}
        {currentCall?.type === 'video' && (
          <div className="relative w-full h-full">
            {/* Remote Video */}
            {remoteStream && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={!isSpeaker}
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Local Video Preview */}
            {localStream && (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-white"
              />
            )}
          </div>
        )}

        {/* User Info Overlay */}
        <div className={`absolute inset-0 flex flex-col justify-center items-center ${currentCall?.type === 'video' ? 'bg-black bg-opacity-40' : ''}`}>
          <div className="mb-8">
            {activeConversation?.otherUser?.profileImageUrl ? (
              <img 
                src={activeConversation.otherUser.profileImageUrl} 
                alt={activeConversation.otherUser.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white"
              />
            ) : (
              <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-green-500 flex items-center justify-center border-4 border-white">
                <span className="text-4xl font-bold">
                  {activeConversation?.otherUser?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h2 className="text-2xl font-bold">{activeConversation?.otherUser?.name}</h2>
            <p className="text-gray-300 mt-2">
              {currentCall?.type === 'video' ? 'Video Call' : 'Voice Call'}
            </p>
            {call?.status === 'connected' && (
              <p className="text-xl font-mono mt-4">{formatDuration(callDuration)}</p>
            )}
            {(call?.status === 'calling' || call?.status === 'ringing') && (
              <p className="text-lg mt-4 animate-pulse">
                {isIncoming ? 'Incoming call...' : 'Calling...'}
              </p>
            )}
          </div>

          {/* Call Controls */}
          {!isIncoming && (
            <div className="flex justify-center space-x-8">
              {/* Mute Button */}
              <button 
                onClick={onToggleMute}
                className="flex flex-col items-center space-y-2"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center hover:opacity-80 transition-all ${
                  isMuted ? 'bg-red-600' : 'bg-gray-600'
                }`}>
                  <span className="text-2xl">{isMuted ? '🎤❌' : '🎤'}</span>
                </div>
                <span className="text-sm">{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              {/* Video Toggle Button (only for video calls) */}
              {currentCall?.type === 'video' && (
                <button 
                  onClick={onToggleVideo}
                  className="flex flex-col items-center space-y-2"
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center hover:opacity-80 transition-all ${
                    !isVideoEnabled ? 'bg-red-600' : 'bg-gray-600'
                  }`}>
                    <span className="text-2xl">{isVideoEnabled ? '📹' : '📹❌'}</span>
                  </div>
                  <span className="text-sm">{isVideoEnabled ? 'Video Off' : 'Video On'}</span>
                </button>
              )}

              {/* End Call Button */}
              <button 
                onClick={onEndCall}
                className="flex flex-col items-center space-y-2"
              >
                <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-500 animate-pulse">
                  <span className="text-3xl">📞</span>
                </div>
                <span className="text-sm">End Call</span>
              </button>

              {/* Speaker Button */}
              <button 
                onClick={handleSpeakerToggle}
                className="flex flex-col items-center space-y-2"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center hover:opacity-80 transition-all ${
                  isSpeaker ? 'bg-blue-600' : 'bg-gray-600'
                }`}>
                  <span className="text-2xl">{isSpeaker ? '🔊' : '🔈'}</span>
                </div>
                <span className="text-sm">{isSpeaker ? 'Speaker' : 'Phone'}</span>
              </button>
            </div>
          )}

          {/* Accept/Reject for incoming calls */}
          {isIncoming && incomingCall && (
            <div className="flex justify-center space-x-8 mt-8">
              <button 
                onClick={onRejectCall}
                className="flex flex-col items-center space-y-2"
              >
                <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-500">
                  <span className="text-3xl">📞</span>
                </div>
                <span className="text-sm">Decline</span>
              </button>
              
              <button 
                onClick={onAcceptCall}
                className="flex flex-col items-center space-y-2"
              >
                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-500 animate-pulse">
                  <span className="text-3xl">📞</span>
                </div>
                <span className="text-sm">Accept</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
// File Upload Component
const FileUploadButton = ({ onFileSelect, disabled }) => {
  const fileInputRef = useRef(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
    e.target.value = '';
  };

  return (
    <>
      <button
        onClick={handleFileClick}
        disabled={disabled}
        className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
        title="Attach file"
      >
        📎
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
        className="hidden"
      />
    </>
  );
};

// Message Actions Component
const MessageActions = ({ message, onReply, onDelete, isOwnMessage }) => {
  const [showActions, setShowActions] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await onDelete(message._id);
        setShowActions(false);
      } catch (error) {
        console.error('Error deleting message:', error);
        toast.error('Failed to delete message');
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowActions(!showActions);
        }}
        className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
          isOwnMessage ? 'text-blue-100 hover:bg-blue-600' : 'text-gray-500 hover:bg-gray-200'
        }`}
      >
        ⋮
      </button>
      
      {showActions && (
        <div className="absolute top-0 right-0 mt-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReply(message);
              setShowActions(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg flex items-center"
          >
            <span className="mr-2">↩️</span>
            Reply
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
          >
            <span className="mr-2">🗑️</span>
            Delete
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(message.message || '');
              toast.success('Message copied to clipboard');
              setShowActions(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg flex items-center"
          >
            <span className="mr-2">📋</span>
            Copy
          </button>
        </div>
      )}
      
      {showActions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({ message, isOwnMessage, showSender = false, onReply, onDelete }) => {
  const getMessageStatus = () => {
    if (!isOwnMessage) return null;
    
    if (message.isRead) {
      return { text: 'Read', icon: '✓✓', color: 'text-blue-600' };
    } else if (message.isDelivered) {
      return { text: 'Delivered', icon: '✓✓', color: 'text-gray-500' };
    } else {
      return { text: 'Sent', icon: '✓', color: 'text-gray-400' };
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const status = getMessageStatus();

  const hasReply = message.replyTo && (
    message.replyTo._id || 
    message.replyTo.messageId || 
    message.replyTo.message
  );

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 group`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {showSender && !isOwnMessage && (
          <div className="text-xs text-gray-500 mb-1 ml-2">
            {message.senderName || 'User'}
          </div>
        )}
        
        {hasReply && (
          <div className={`mb-1 p-2 rounded border-l-2 ${
            isOwnMessage ? 'border-blue-400 bg-blue-50' : 'border-gray-400 bg-gray-100'
          }`}>
            <div className="text-xs text-gray-500">
              Replying to {message.replyTo.senderName || 'User'}
            </div>
            <div className="text-xs truncate">
              {message.replyTo.messageType === 'image' ? '🖼️ Image' : 
               message.replyTo.messageType === 'file' ? '📄 File' : 
               message.replyTo.message || '📎 File'}
            </div>
          </div>
        )}
        
        <div className={`rounded-lg p-3 shadow-sm relative ${
          isOwnMessage 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
        }`}>
          <div className="absolute top-2 right-2">
            <MessageActions 
              message={message} 
              onReply={onReply}
              onDelete={onDelete}
              isOwnMessage={isOwnMessage}
            />
          </div>
          
          <p className="text-sm whitespace-pre-wrap break-words pr-8">{message.message}</p>
          <div className={`flex items-center justify-end mt-1 space-x-2 ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <span className="text-xs">
              {formatTime(message.createdAt)}
            </span>
            {status && (
              <span className={`text-xs ${status.color}`} title={status.text}>
                {status.icon}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// File Message Component
const FileMessage = ({ message, isOwnMessage, showSender = false, onReply, onDelete }) => {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageStatus = () => {
    if (!isOwnMessage) return null;
    
    if (message.isRead) {
      return { text: 'Read', icon: '✓✓', color: 'text-blue-600' };
    } else if (message.isDelivered) {
      return { text: 'Delivered', icon: '✓✓', color: 'text-gray-500' };
    } else {
      return { text: 'Sent', icon: '✓', color: 'text-gray-400' };
    }
  };

  const status = getMessageStatus();

  const hasReply = message.replyTo && (message.replyTo._id || message.replyTo.messageId);

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 group`}>
      <div className={`max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {showSender && !isOwnMessage && (
          <div className="text-xs text-gray-500 mb-1 ml-2">
            {message.senderName || 'User'}
          </div>
        )}
        
        {hasReply && (
          <div className={`mb-1 p-2 rounded border-l-2 ${
            isOwnMessage ? 'border-blue-400 bg-blue-50' : 'border-gray-400 bg-gray-100'
          }`}>
            <div className="text-xs text-gray-500">
              Replying to {message.replyTo.senderName || 'User'}
            </div>
            <div className="text-xs truncate">
              {message.replyTo.messageType === 'image' ? '🖼️ Image' : 
               message.replyTo.messageType === 'file' ? '📄 File' : 
               message.replyTo.message || '📎 File'}
            </div>
          </div>
        )}
        
        <div className={`rounded-lg p-3 shadow-sm relative ${
          isOwnMessage 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
        }`}>
          <div className="absolute top-2 right-2">
            <MessageActions 
              message={message} 
              onReply={onReply}
              onDelete={onDelete}
              isOwnMessage={isOwnMessage}
            />
          </div>
          
          <div className="flex items-center space-x-3 pr-8">
            <div className="text-2xl flex-shrink-0">
              {message.messageType === 'image' ? '🖼️' : '📄'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-sm">
                {message.fileName || 'File'}
              </p>
              {message.fileSize && (
                <p className="text-xs opacity-75 mt-1">
                  {(message.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
              {message.message && (
                <p className="text-sm mt-2">{message.message}</p>
              )}
            </div>
            <a 
              href={`http://localhost:5000${message.fileUrl}`}
              download={message.fileName}
              className={`px-3 py-1 rounded text-xs font-medium flex-shrink-0 ${
                isOwnMessage 
                  ? 'bg-blue-400 hover:bg-blue-300 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {message.messageType === 'image' ? 'View' : 'Download'}
            </a>
          </div>
          <div className={`flex items-center justify-end mt-2 ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <span className="text-xs">
              {formatTime(message.createdAt)}
            </span>
            {status && (
              <span className={`text-xs ml-1 ${status.color}`} title={status.text}>
                {status.icon}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Image Message Component
const ImageMessage = ({ message, isOwnMessage, showSender = false, onReply, onDelete }) => {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageStatus = () => {
    if (!isOwnMessage) return null;
    
    if (message.isRead) {
      return { text: 'Read', icon: '✓✓', color: 'text-blue-600' };
    } else if (message.isDelivered) {
      return { text: 'Delivered', icon: '✓✓', color: 'text-gray-500' };
    } else {
      return { text: 'Sent', icon: '✓', color: 'text-gray-400' };
    }
  };

  const status = getMessageStatus();

  const hasReply = message.replyTo && (message.replyTo._id || message.replyTo.messageId);

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 group`}>
      <div className={`max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {showSender && !isOwnMessage && (
          <div className="text-xs text-gray-500 mb-1 ml-2">
            {message.senderName || 'User'}
          </div>
        )}
        
        {hasReply && (
          <div className={`mb-1 p-2 rounded border-l-2 ${
            isOwnMessage ? 'border-blue-400 bg-blue-50' : 'border-gray-400 bg-gray-100'
          }`}>
            <div className="text-xs text-gray-500">
              Replying to {message.replyTo.senderName || 'User'}
            </div>
            <div className="text-xs truncate">
              {message.replyTo.messageType === 'image' ? '🖼️ Image' : 
               message.replyTo.messageType === 'file' ? '📄 File' : 
               message.replyTo.message || '📎 File'}
            </div>
          </div>
        )}
        
        <div className={`rounded-lg overflow-hidden shadow-sm relative ${
          isOwnMessage ? 'bg-blue-500' : 'bg-white border border-gray-200'
        }`}>
          <div className="absolute top-2 right-2 z-10">
            <MessageActions 
              message={message} 
              onReply={onReply}
              onDelete={onDelete}
              isOwnMessage={isOwnMessage}
            />
          </div>
          
          <img 
            src={`http://localhost:5000${message.fileUrl}`} 
            alt="Shared image"
            className="max-w-full max-h-64 object-cover cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`http://localhost:5000${message.fileUrl}`, '_blank');
            }}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
            }}
          />
          {message.message && (
            <p className={`p-3 text-sm ${isOwnMessage ? 'text-white' : 'text-gray-800'}`}>
              {message.message}
            </p>
          )}
          <div className={`flex items-center justify-end p-2 ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <span className="text-xs">
              {formatTime(message.createdAt)}
            </span>
            {status && (
              <span className={`text-xs ml-1 ${status.color}`} title={status.text}>
                {status.icon}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Call Message Component
const CallMessage = ({ message, isOwnMessage, onDelete }) => {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const callIcon = message.callType === 'video' ? '📹' : '📞';
  
  const getCallStatusText = () => {
    if (message.callStatus === 'initiated') return 'Call started';
    if (message.callStatus === 'connected') return 'Call connected';
    if (message.callStatus === 'missed') return 'Call missed';
    if (message.callStatus === 'ended') return 'Call ended';
    if (message.callStatus === 'declined') return 'Call declined';
    return 'Call';
  };

  const getCallColor = () => {
    if (message.callStatus === 'connected') return 'bg-green-500 text-white';
    if (message.callStatus === 'missed') return 'bg-red-500 text-white';
    if (message.callStatus === 'declined') return 'bg-orange-500 text-white';
    return isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700';
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} my-2 group`}>
      <div className={`max-w-xs rounded-lg p-3 shadow-sm relative ${getCallColor()} ${isOwnMessage ? 'rounded-br-none' : 'rounded-bl-none'}`}>
        <div className="absolute top-2 right-2">
          <MessageActions 
            message={message} 
            onDelete={onDelete}
            isOwnMessage={isOwnMessage}
          />
        </div>
        <div className="flex items-center space-x-2 pr-8">
          <span className="text-lg">{callIcon}</span>
          <div>
            <span className="text-sm font-medium">{getCallStatusText()}</span>
            {message.callDuration && (
              <div className="text-xs opacity-90 mt-1">
                Duration: {Math.floor(message.callDuration / 60)}:{(message.callDuration % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        </div>
        <div className="text-xs mt-1 opacity-90">
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
};

// Reply Preview Component
const ReplyPreview = ({ replyTo, onCancel }) => {
  if (!replyTo) return null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3 rounded">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="text-xs text-blue-600 font-medium mb-1">
            Replying to {replyTo.senderName || 'User'}
          </div>
          <div className="text-sm text-gray-700 truncate">
            {replyTo.messageType === 'image' ? '🖼️ Image' : 
             replyTo.messageType === 'file' ? '📄 File' : 
             replyTo.message}
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

const Messages = () => {
  // State management
  const [connectedAlumni, setConnectedAlumni] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  
  // Call states
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callStatus, setCallStatus] = useState('');
  const [callDuration, setCallDuration] = useState(0);

  // WebRTC states
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [peerConnection, setPeerConnection] = useState(null);

  // New states for enhanced features
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  
  // Reply functionality
  const [replyingTo, setReplyingTo] = useState(null);
  
  // Refs
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const callTimeoutRef = useRef(null);

  // WebRTC Configuration
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Get current user ID from token
  const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
    return null;
  };

  // Initialize WebRTC
  const initializeWebRTC = async (type = 'voice') => {
    try {
      // Get user media
      const constraints = {
        audio: true,
        video: type === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      // Create peer connection
      const pc = new RTCPeerConnection(rtcConfiguration);
      
      // Add local stream to connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('ice-candidate', {
            candidate: event.candidate,
            callRoomId: activeCall?.roomId,
            toUserId: activeConversation?.otherUser.id
          });
        }
      };

      setPeerConnection(pc);
      return pc;

    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Unable to access camera/microphone');
      throw error;
    }
  };

  // Delete message function
  const deleteMessage = async (messageId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/messages/${messageId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
        toast.success('Message deleted successfully');
        
        if (socketRef.current && activeConversation) {
          socketRef.current.emit('deleteMessage', {
            messageId,
            conversationId: activeConversation.id
          });
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  // Enhanced message rendering with proper sender identification
  const renderMessage = (msg) => {
    const currentUserId = getCurrentUserId();
    
    const isOwnMessage = msg.senderId === currentUserId || 
                        (msg.senderId && msg.senderId._id === currentUserId) ||
                        (typeof msg.senderId === 'object' && msg.senderId._id === currentUserId);

    const enhancedMessage = {
      ...msg,
      isOwnMessage,
      senderName: typeof msg.senderId === 'object' ? msg.senderId.name : 'You'
    };

    if (msg.isDeleted) {
      return (
        <div key={msg._id} className="flex justify-center my-2">
          <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
            Message deleted
          </div>
        </div>
      );
    }

    if (msg.messageType === 'call') {
      return (
        <CallMessage 
          key={msg._id} 
          message={enhancedMessage} 
          isOwnMessage={isOwnMessage}
          onDelete={deleteMessage}
        />
      );
    }

    if (msg.messageType === 'image') {
      return (
        <ImageMessage 
          key={msg._id} 
          message={enhancedMessage} 
          isOwnMessage={isOwnMessage} 
          showSender={!isOwnMessage}
          onReply={handleReplyToMessage}
          onDelete={deleteMessage}
        />
      );
    }

    if (msg.messageType === 'file') {
      return (
        <FileMessage 
          key={msg._id} 
          message={enhancedMessage} 
          isOwnMessage={isOwnMessage} 
          showSender={!isOwnMessage}
          onReply={handleReplyToMessage}
          onDelete={deleteMessage}
        />
      );
    }

    return (
      <MessageBubble 
        key={msg._id} 
        message={enhancedMessage} 
        isOwnMessage={isOwnMessage} 
        showSender={!isOwnMessage}
        onReply={handleReplyToMessage}
        onDelete={deleteMessage}
      />
    );
  };

  // Handle reply to message
  const handleReplyToMessage = (message) => {
    setReplyingTo(message);
    setTimeout(() => {
      document.querySelector('input[placeholder*="Type a message"]')?.focus();
    }, 100);
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Enhanced Voice Call Implementation with WebRTC
  const handleVoiceCall = async () => {
    if (!activeConversation) {
      toast.error('No conversation selected');
      return;
    }
    
    const currentUserId = getCurrentUserId();
    if (activeConversation.otherUser.id === currentUserId) {
      toast.error('You cannot call yourself');
      return;
    }
    
    try {
      setCallStatus('calling');
      setCallDuration(0);
      
      const callRoomId = `call_${activeConversation.id}_${Date.now()}`;
      
      // Initialize WebRTC for voice
      await initializeWebRTC('voice');
      
      if (socketRef.current) {
        socketRef.current.emit('initiateVoiceCall', {
          conversationId: activeConversation.id,
          toUserId: activeConversation.otherUser.id,
          callRoomId: callRoomId,
          callerName: 'You'
        });
      }
      
      setActiveCall({ 
        type: 'voice', 
        roomId: callRoomId,
        startedAt: new Date()
      });
      
      // Auto cancel after 45 seconds if no answer
      callTimeoutRef.current = setTimeout(() => {
        if (callStatus === 'calling' || callStatus === 'ringing') {
          handleEndCall();
          toast.info('No answer');
        }
      }, 45000);
      
    } catch (error) {
      console.error('Voice call error:', error);
      toast.error('Failed to initiate voice call');
      setCallStatus('ended');
      setActiveCall(null);
    }
  };

  // Enhanced Video Call Implementation with WebRTC
  const handleVideoCall = async () => {
    if (!activeConversation) {
      toast.error('No conversation selected');
      return;
    }
    
    try {
      setCallStatus('calling');
      setCallDuration(0);
      
      const callRoomId = `call_${activeConversation.id}_${Date.now()}`;
      
      // Initialize WebRTC for video
      await initializeWebRTC('video');
      
      if (socketRef.current) {
        socketRef.current.emit('initiateVideoCall', {
          conversationId: activeConversation.id,
          toUserId: activeConversation.otherUser.id,
          callRoomId: callRoomId,
          callerName: 'You'
        });
      }
      
      setActiveCall({ 
        type: 'video', 
        roomId: callRoomId,
        startedAt: new Date()
      });
      
      // Auto cancel after 45 seconds if no answer
      callTimeoutRef.current = setTimeout(() => {
        if (callStatus === 'calling' || callStatus === 'ringing') {
          handleEndCall();
          toast.info('No answer');
        }
      }, 45000);
      
    } catch (error) {
      console.error('Video call error:', error);
      toast.error('Failed to initiate video call');
      setCallStatus('ended');
      setActiveCall(null);
    }
  };

  // Handle incoming call acceptance with WebRTC
  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
    }

    try {
      // Initialize WebRTC
      await initializeWebRTC(incomingCall.type);
      
      setActiveCall({ 
        type: incomingCall.type, 
        roomId: incomingCall.callRoomId,
        startedAt: new Date()
      });
      
      if (socketRef.current) {
        socketRef.current.emit('callAccepted', {
          callRoomId: incomingCall.callRoomId,
          toUserId: incomingCall.fromUserId,
          callType: incomingCall.type,
          conversationId: incomingCall.conversationId
        });
      }
      
      setIncomingCall(null);
      setCallStatus('connected');
      setCallDuration(0);
    } catch (error) {
      console.error('Error accepting call:', error);
      toast.error('Failed to accept call');
      handleEndCall();
    }
  };

  // Handle incoming call rejection
  const handleRejectCall = () => {
    if (!incomingCall) return;

    if (socketRef.current) {
      socketRef.current.emit('callRejected', {
        callRoomId: incomingCall.callRoomId,
        toUserId: incomingCall.fromUserId,
        callType: incomingCall.type,
        conversationId: incomingCall.conversationId
      });
    }
    
    setIncomingCall(null);
    setCallStatus('ended');
    setCallDuration(0);
    toast.info('Call declined');
  };

  // Handle call end with cleanup
  const handleEndCall = () => {
    const duration = activeCall?.startedAt 
      ? Math.round((new Date() - new Date(activeCall.startedAt)) / 1000)
      : 0;

    // Stop all media tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
    }

    if (activeCall && socketRef.current) {
      socketRef.current.emit('endCall', {
        callRoomId: activeCall.roomId,
        toUserId: activeConversation?.otherUser.id,
        duration: duration,
        callType: activeCall.type,
        conversationId: activeConversation?.id
      });
    }
    
    // Reset all states
    setActiveCall(null);
    setCallStatus('ended');
    setCallDuration(0);
    setLocalStream(null);
    setRemoteStream(null);
    setPeerConnection(null);
    setIsMuted(false);
    setIsVideoEnabled(true);
    
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
    }
  };

  // Toggle mute
  const handleToggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
      toast.info(isMuted ? 'Microphone unmuted' : 'Microphone muted');
    }
  };

  // Toggle video
  const handleToggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
      toast.info(isVideoEnabled ? 'Video turned off' : 'Video turned on');
    }
  };

  // Initialize Socket.io connection with WebRTC handlers
  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found for socket connection');
      return;
    }

    try {
      socketRef.current = io('http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Connected to chat server');
        socketRef.current.emit('joinUserRoom');
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('❌ Disconnected from chat server:', reason);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Socket event listeners
      socketRef.current.on('newMessage', (message) => {
        console.log('📨 New message received:', message);
        
        if (activeConversation && 
            (message.senderId === activeConversation.otherUser.id || 
             message.receiverId === activeConversation.otherUser.id)) {
          
          const processedMessage = {
            ...message,
            senderName: message.senderId?.name || 'User'
          };
          
          setMessages(prev => [...prev, processedMessage]);
          markAsRead(activeConversation.id);
        }
        fetchConnectedAlumni();
      });

      socketRef.current.on('messageDeleted', (data) => {
        console.log('🗑️ Message deleted received:', data);
        if (activeConversation && data.conversationId === activeConversation.id) {
          setMessages(prev => prev.map(msg => 
            msg._id === data.messageId 
              ? { ...msg, isDeleted: true }
              : msg
          ));
        }
      });

      socketRef.current.on('messageRead', (data) => {
        console.log('📖 Message read receipt:', data);
        if (activeConversation && data.conversationId === activeConversation.id) {
          setMessages(prev => 
            prev.map(msg => 
              msg.senderId === activeConversation.otherUser.id && !msg.isRead
                ? { ...msg, isRead: true, readAt: new Date() }
                : msg
            )
          );
        }
      });

      socketRef.current.on('typing', (data) => {
        if (activeConversation && data.userId === activeConversation.otherUser.id) {
          setShowTypingIndicator(data.isTyping);
        }
      });

      socketRef.current.on('userOnline', (data) => {
        setConnectedAlumni(prev => 
          prev.map(alumni => 
            alumni.otherUser.id === data.userId 
              ? { 
                  ...alumni, 
                  otherUser: { ...alumni.otherUser, isOnline: true } 
                }
              : alumni
          )
        );
      });

      socketRef.current.on('userOffline', (data) => {
        setConnectedAlumni(prev => 
          prev.map(alumni => 
            alumni.otherUser.id === data.userId 
              ? { 
                  ...alumni, 
                  otherUser: { ...alumni.otherUser, isOnline: false } 
                }
              : alumni
          )
        );
      });

      // WebRTC Socket Handlers
      socketRef.current.on('incomingVoiceCall', (data) => {
        console.log('📞 Incoming voice call:', data);
        
        setIncomingCall({
          type: 'voice',
          callRoomId: data.callRoomId,
          fromUserId: data.fromUserId,
          callerName: data.callerName,
          conversationId: data.conversationId
        });
        
        setCallStatus('ringing');
      });

      socketRef.current.on('incomingVideoCall', (data) => {
        console.log('📹 Incoming video call:', data);
        
        setIncomingCall({
          type: 'video',
          callRoomId: data.callRoomId,
          fromUserId: data.fromUserId,
          callerName: data.callerName,
          conversationId: data.conversationId
        });
        
        setCallStatus('ringing');
      });

      socketRef.current.on('callAccepted', async (data) => {
        console.log('✅ Call accepted by recipient:', data);
        
        if (peerConnection && activeCall) {
          try {
            // Create and send offer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            
            socketRef.current.emit('webrtc-offer', {
              callRoomId: activeCall.roomId,
              offer: offer,
              toUserId: activeConversation.otherUser.id
            });
          } catch (error) {
            console.error('Error creating offer:', error);
          }
        }
        
        setCallStatus('connected');
        setCallDuration(0);
        toast.success('Call connected!');
        setIncomingCall(null);
      });

      socketRef.current.on('webrtc-offer', async (data) => {
        if (peerConnection && data.callRoomId === activeCall?.roomId) {
          try {
            await peerConnection.setRemoteDescription(data.offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            socketRef.current.emit('webrtc-answer', {
              callRoomId: activeCall.roomId,
              answer: answer,
              toUserId: activeConversation.otherUser.id
            });
          } catch (error) {
            console.error('Error handling offer:', error);
          }
        }
      });

      socketRef.current.on('webrtc-answer', async (data) => {
        if (peerConnection && data.callRoomId === activeCall?.roomId) {
          try {
            await peerConnection.setRemoteDescription(data.answer);
          } catch (error) {
            console.error('Error handling answer:', error);
          }
        }
      });

      socketRef.current.on('ice-candidate', async (data) => {
        if (peerConnection && data.callRoomId === activeCall?.roomId) {
          try {
            await peerConnection.addIceCandidate(data.candidate);
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        }
      });

      socketRef.current.on('callRejected', (data) => {
        console.log('❌ Call rejected:', data);
        
        setCallStatus('ended');
        toast.info('Call was declined');
        setIncomingCall(null);
        setActiveCall(null);
        setCallDuration(0);
      });

      socketRef.current.on('callEnded', (data) => {
        console.log('📞 Call ended:', data);
        
        setCallStatus('ended');
        toast.info(`Call ended ${data.duration ? `(Duration: ${data.duration}s)` : ''}`);
        setActiveCall(null);
        setIncomingCall(null);
        setCallDuration(0);
      });

      socketRef.current.on('callRinging', (data) => {
        console.log('🔔 Call is ringing on recipient side:', data);
        
        setCallStatus('ringing');
        toast.info('Call is ringing...');
      });

    } catch (error) {
      console.error('Error initializing socket:', error);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  };

  // Get or create conversation and fetch messages
  const fetchConversation = async (otherUserId) => {
    try {
      setLoading(true);
      console.log('🔄 Fetching conversation for user:', otherUserId);
      
      const conversationResponse = await fetch(
        `http://localhost:5000/api/messages/conversations/${otherUserId}`,
        {
          method: 'GET',
          headers: getAuthHeaders()
        }
      );

      if (!conversationResponse.ok) {
        throw new Error(`Failed to get conversation: ${conversationResponse.status}`);
      }

      const conversationData = await conversationResponse.json();
      
      if (conversationData.success && conversationData.conversation) {
        const messagesResponse = await fetch(
          `http://localhost:5000/api/messages/conversations/${otherUserId}/messages`,
          {
            method: 'GET',
            headers: getAuthHeaders()
          }
        );

        if (!messagesResponse.ok) {
          throw new Error(`Failed to fetch messages: ${messagesResponse.status}`);
        }

        const messagesData = await messagesResponse.json();
        
        if (messagesData.success) {
          const processedMessages = messagesData.messages.map(msg => ({
            ...msg,
            senderName: msg.senderId?.name || 'User'
          }));
          
          setMessages(processedMessages || []);
          
          const otherUser = conversationData.conversation.participants.find(
            p => p._id !== getCurrentUserId()
          );

          if (!otherUser) {
            throw new Error('Could not find other user in conversation');
          }

          setActiveConversation({
            id: conversationData.conversation._id,
            otherUser: {
              id: otherUser._id,
              name: otherUser.name,
              email: otherUser.email,
              profileImageUrl: otherUser.profileImageUrl,
              isOnline: otherUser.isOnline || false,
              currentPosition: otherUser.currentPosition,
              graduationYear: otherUser.graduationYear
            }
          });

          if (socketRef.current) {
            socketRef.current.emit('joinConversation', conversationData.conversation._id);
          }

          await markAsRead(conversationData.conversation._id);
          fetchConnectedAlumni();
          
        } else {
          throw new Error(messagesData.message || 'Failed to load messages');
        }
      } else {
        throw new Error(conversationData.message || 'Failed to create conversation');
      }
    } catch (error) {
      console.error('❌ Error fetching conversation:', error);
      toast.error(`Failed to load conversation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Mark conversation as read
  const markAsRead = async (conversationId) => {
    try {
      await fetch(`http://localhost:5000/api/messages/conversations/${conversationId}/read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (socketRef.current) {
        socketRef.current.emit('markAsRead', { conversationId });
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Enhanced send message function
  const sendMessage = async (text = null, file = null) => {
    const messageToSend = text || messageInput;
    if ((!messageToSend.trim() && !file) || !activeConversation || sendingMessage) return;

    setSendingMessage(true);
    
    try {
      const formData = new FormData();
      formData.append('receiverId', activeConversation.otherUser.id);
      if (messageToSend.trim()) {
        formData.append('message', messageToSend.trim());
      }
      if (file) {
        formData.append('file', file);
      }
      if (replyingTo) {
        formData.append('replyTo', replyingTo._id);
      }

      const response = await fetch('http://localhost:5000/api/messages/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      if (data.success) {
        setMessageInput('');
        setSelectedFile(null);
        setFilePreview(null);
        setReplyingTo(null);
        
        const newMessage = {
          ...data.message,
          _id: data.message._id || Date.now().toString(),
          senderId: getCurrentUserId(),
          receiverId: activeConversation.otherUser.id,
          createdAt: new Date().toISOString(),
          isDelivered: true,
          isRead: false,
          senderName: 'You',
          replyTo: replyingTo ? {
            _id: replyingTo._id,
            message: replyingTo.message,
            senderName: replyingTo.senderName,
            messageType: replyingTo.messageType
          } : undefined
        };
        
        setMessages(prev => [...prev, newMessage]);
        fetchConnectedAlumni();
        
        if (socketRef.current) {
          socketRef.current.emit('sendMessage', {
            conversationId: activeConversation.id,
            message: newMessage
          });
        }

        toast.success('Message sent!');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(`Failed to send message: ${error.message}`);
    } finally {
      setSendingMessage(false);
      setUploadingFile(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (file) => {
    try {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size too large. Maximum 10MB allowed.');
        return;
      }

      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error('File type not allowed');
        return;
      }

      setSelectedFile(file);
      setUploadingFile(true);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
      }

      await sendMessage(null, file);

    } catch (error) {
      console.error('File selection error:', error);
      toast.error('Error processing file');
      setUploadingFile(false);
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  // Handle typing indicator
  const handleTyping = (isTyping) => {
    if (socketRef.current && activeConversation) {
      socketRef.current.emit('typing', {
        conversationId: activeConversation.id,
        userId: getCurrentUserId(),
        isTyping: isTyping
      });
    }
  };

  // Handle alumni click
  const handleAlumniClick = async (alumni) => {
    await fetchConversation(alumni.otherUser.id);
    setReplyingTo(null);
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle input change with typing indicator
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    if (e.target.value.trim() && !sendingMessage && activeConversation) {
      handleTyping(true);
      
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false);
      }, 2000);
    } else {
      handleTyping(false);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch connected alumni with unread counts
  const fetchConnectedAlumni = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/messages/connections/accepted', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch connected alumni: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setConnectedAlumni(data.connections || []);
        
        if (data.connections.length === 0) {
          toast.info('No connected alumni found. Connect with alumni to start messaging.');
        }
      } else {
        throw new Error(data.message || 'Failed to load connections');
      }
    } catch (error) {
      console.error('Error fetching connected alumni:', error);
      toast.error('Failed to load connections');
      setConnectedAlumni([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter connected alumni based on search
  const filteredAlumni = connectedAlumni.filter(alumni =>
    alumni.otherUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (alumni.lastMessage && alumni.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Format message time for sidebar
  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = (now - date) / (1000 * 60);
    
    if (diffInMinutes < 1) {
      return 'now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get display name
  const getDisplayName = (user) => {
    return user?.name || 'Unknown User';
  };

  // Get profile image or fallback
  const getProfileImage = (user) => {
    return user?.profileImageUrl || null;
  };

  // Call duration timer
  useEffect(() => {
    let interval;
    if (callStatus === 'connected' && activeCall?.startedAt) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus, activeCall]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      handleEndCall(); // Clean up any active calls
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Effects
  useEffect(() => {
    fetchConnectedAlumni();
    const cleanup = initializeSocket();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <CallStatus 
        callStatus={callStatus} 
        activeCall={activeCall}
        onEndCall={handleEndCall}
        callDuration={callDuration}
      />

      {/* Call Interface with WebRTC */}
      {(activeCall || incomingCall) && (
        <CallInterface 
          call={activeCall}
          onEndCall={handleEndCall}
          callDuration={callDuration}
          isIncoming={!!incomingCall}
          incomingCall={incomingCall}
          onAcceptCall={handleAcceptCall}
          onRejectCall={handleRejectCall}
          activeConversation={activeConversation}
          localStream={localStream}
          remoteStream={remoteStream}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isVideoEnabled={isVideoEnabled}
          onToggleVideo={handleToggleVideo}
        />
      )}

      <nav className="bg-blue-600 border-b border-blue-700 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">💬 Alumni Messages</h1>
              <span className="ml-2 text-sm text-blue-100 bg-blue-700 px-2 py-1 rounded-full">
                Connected Alumni Only
              </span>
            </div>
            
            <div className="flex-1 max-w-md ml-6">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search connections..." 
                  className="w-full pl-10 pr-4 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-blue-50 text-sm placeholder-blue-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-blue-600">
                  🔍
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="flex-1 overflow-hidden p-4">
        <div className="bg-white rounded-lg shadow-xl h-full flex flex-col">
          <div className="flex h-full">
            <div className="w-2/5 border-r border-gray-200 flex flex-col bg-white">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  🤝 Connected Alumni
                  <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    {connectedAlumni.length} connections
                  </span>
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : filteredAlumni.length > 0 ? (
                  filteredAlumni.map((alumni) => {
                    const isActive = activeConversation?.otherUser.id === alumni.otherUser.id;
                    const hasUnread = alumni.unreadCount > 0;
                    
                    return (
                      <div 
                        key={alumni.otherUser.id}
                        onClick={() => handleAlumniClick(alumni)}
                        className={`p-3 border-b border-gray-100 cursor-pointer transition-all duration-200 ${
                          isActive 
                            ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="relative">
                            {getProfileImage(alumni.otherUser) ? (
                              <img 
                                src={getProfileImage(alumni.otherUser)} 
                                alt={getDisplayName(alumni.otherUser)}
                                className="w-12 h-12 rounded-full object-cover mr-4"
                              />
                            ) : (
                              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                                <span className="text-blue-600 font-semibold text-lg">
                                  {getDisplayName(alumni.otherUser).charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${
                              alumni.otherUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                            {hasUnread && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {alumni.unreadCount}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-gray-900 text-sm truncate">
                                {getDisplayName(alumni.otherUser)}
                                {hasUnread && (
                                  <span className="ml-2 text-xs font-normal text-red-500">
                                    {alumni.unreadCount} new
                                  </span>
                                )}
                              </h4>
                              <div className="flex items-center">
                                <span className="text-xs text-gray-500">
                                  {formatMessageTime(alumni.lastMessageAt)}
                                </span>
                              </div>
                            </div>
                            <p className={`text-sm truncate ${
                              hasUnread ? 'text-gray-900 font-medium' : 'text-gray-600'
                            }`}>
                              {alumni.lastMessage || 'Start a conversation...'}
                            </p>
                            <div className="flex items-center mt-1">
                              <span className="text-xs text-gray-500">
                                {alumni.otherUser.currentPosition}
                              </span>
                              {alumni.otherUser.graduationYear && (
                                <span className="text-xs text-gray-500 ml-2">
                                  • Class of {alumni.otherUser.graduationYear}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No connected alumni found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Connect with alumni to start messaging
                    </p>
                    <button 
                      onClick={() => window.location.href = '/networking'}
                      className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Go to Networking Hub
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              {activeConversation ? (
                <>
                  <div className="p-4 border-b border-gray-200 bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="relative">
                          {getProfileImage(activeConversation.otherUser) ? (
                            <img 
                              src={getProfileImage(activeConversation.otherUser)} 
                              alt={getDisplayName(activeConversation.otherUser)}
                              className="w-10 h-10 rounded-full object-cover mr-3"
                            />
                          ) : (
                            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-semibold">
                                {getDisplayName(activeConversation.otherUser).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${
                            activeConversation.otherUser.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {getDisplayName(activeConversation.otherUser)}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {activeConversation.otherUser.isOnline ? (
                              <span className="text-green-600 font-medium">🟢 Online</span>
                            ) : (
                              <span className="text-gray-500">⚫ Offline</span>
                            )} • Real-time Chat
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={handleVoiceCall}
                          disabled={activeCall || callStatus === 'calling' || callStatus === 'ringing'}
                          className={`p-3 rounded-full transition-all ${
                            activeCall || callStatus === 'calling' || callStatus === 'ringing'
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                          }`}
                          title="Voice Call"
                        >
                          📞
                        </button>
                        <button 
                          onClick={handleVideoCall}
                          disabled={activeCall || callStatus === 'calling' || callStatus === 'ringing'}
                          className={`p-3 rounded-full transition-all ${
                            activeCall || callStatus === 'calling' || callStatus === 'ringing'
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
                          }`}
                          title="Video Call"
                        >
                          📹
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-4 overflow-y-auto bg-[#f0f2f5]">
                    {messages.length > 0 ? (
                      <div className="space-y-1">
                        {messages.map((msg) => renderMessage(msg))}
                        <div ref={messagesEndRef} />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-6xl mb-4 text-gray-400">💬</div>
                          <p className="text-gray-500">No messages yet</p>
                          <p className="text-sm text-gray-400">Start the conversation!</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {showTypingIndicator && (
                    <div className="px-4 pb-2">
                      <div className="flex items-center text-gray-500 text-sm">
                        <div className="flex space-x-1 bg-white rounded-lg px-3 py-2 shadow-sm">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="ml-2">{getDisplayName(activeConversation.otherUser)} is typing...</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <ReplyPreview 
                      replyTo={replyingTo} 
                      onCancel={handleCancelReply} 
                    />
                    
                    {filePreview && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={filePreview} 
                              alt="Preview" 
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                {selectedFile?.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedFile(null);
                              setFilePreview(null);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <button 
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-2 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                        >
                          😊
                        </button>
                        
                        {showEmojiPicker && (
                          <div className="absolute bottom-full mb-2 z-50">
                            <EmojiPicker
                              onEmojiClick={(emojiData) => {
                                setMessageInput(prev => prev + emojiData.emoji);
                                setShowEmojiPicker(false);
                              }}
                              searchDisabled
                              skinTonesDisabled
                            />
                          </div>
                        )}
                      </div>

                      <FileUploadButton 
                        onFileSelect={handleFileSelect}
                        disabled={uploadingFile || sendingMessage}
                      />

                      <div className="flex-1 relative">
                        <input 
                          type="text" 
                          placeholder={replyingTo ? `Replying to ${replyingTo.senderName || 'user'}...` : "Type a message"} 
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                          value={messageInput}
                          onChange={handleInputChange}
                          onKeyPress={handleKeyPress}
                          disabled={sendingMessage || uploadingFile}
                          onFocus={() => setShowEmojiPicker(false)}
                        />
                      </div>

                      <button 
                        onClick={() => sendMessage()}
                        disabled={(!messageInput.trim() && !selectedFile) || sendingMessage || uploadingFile}
                        className={`
                          p-2.5 rounded-full transition-all duration-200 shadow-lg 
                          flex items-center justify-center min-w-[44px] min-h-[44px]
                          ${(!messageInput.trim() && !selectedFile) || sendingMessage || uploadingFile
                            ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                            : 'bg-green-500 hover:bg-green-600 hover:shadow-xl text-white'
                          }
                        `}
                        title="Send message"
                      >
                        {sendingMessage || uploadingFile ? (
                          <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
                        ) : (
                          <svg 
                            className="w-5 h-5" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                            style={{ transform: 'rotate(45deg)' }}
                          >
                            <path d="M10.894 2.553a1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {showEmojiPicker && (
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowEmojiPicker(false)}
                    />
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="text-6xl mb-4 text-gray-400">💭</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Conversation Selected</h3>
                    <p className="text-gray-500">Choose a connection from the list to start messaging</p>
                    {connectedAlumni.length === 0 && (
                      <button 
                        onClick={() => window.location.href = '/networking'}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                      >
                        Find Alumni to Connect With
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <ConfirmationModal
        isOpen={!!incomingCall}
        onClose={handleRejectCall}
        onConfirm={handleAcceptCall}
        title={`Incoming ${incomingCall?.type === 'video' ? 'Video' : 'Voice'} Call`}
        message={`${incomingCall?.callerName} is calling you`}
        type={incomingCall?.type}
      />

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Messages;