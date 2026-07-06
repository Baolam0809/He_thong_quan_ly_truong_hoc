import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Send, 
  Eraser, 
  Palette, 
  CheckCircle, 
  HelpCircle, 
  MessageSquare, 
  FileText, 
  Trash2, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw, 
  Music, 
  Volume2, 
  Sparkles,
  Presentation,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Account } from '../types';
import { showToast } from './Toast';

interface CommunityRoomSectionProps {
  currentUser: Account | null;
}

interface ChatMessage {
  id: string;
  roomId: string;
  sender: string;
  role: string;
  content: string;
  timestamp: string;
}

interface WhiteboardStroke {
  color: string;
  lineWidth: number;
  points: { x: number; y: number }[];
}

interface StudyQuestionReply {
  id: string;
  sender: string;
  role: string;
  content: string;
  timestamp: string;
}

interface StudyQuestion {
  id: string;
  roomId: string;
  sender: string;
  role: string;
  title: string;
  content: string;
  timestamp: string;
  solved: boolean;
  replies: StudyQuestionReply[];
}

interface ActiveUser {
  id: string;
  name: string;
  role: string;
}

const ROOMS = [
  { id: 'math-sci', name: 'Toán học & Khoa học', icon: '📐', desc: 'Nơi thảo luận các công thức hình học, đại số và các môn khoa học tự nhiên.' },
  { id: 'lit-hist', name: 'Ngữ văn & Lịch sử', icon: '📖', desc: 'Thảo luận văn học, sự kiện lịch sử, phân tích tác phẩm cùng quý thầy cô.' },
  { id: 'english', name: 'Ngoại ngữ (Tiếng Anh)', icon: '🇬🇧', desc: 'Luyện tập ngữ pháp tiếng Anh, từ vựng và giải đáp đề thi.' },
  { id: 'self-study', name: 'Phòng tự học & Pomodoro', icon: '⏱️', desc: 'Góc tự lập ôn tập hiệu quả với âm thanh sóng não Alpha tập trung cao độ.' }
];

export default function CommunityRoomSection({ currentUser }: CommunityRoomSectionProps) {
  const [selectedRoom, setSelectedRoom] = useState('math-sci');
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  
  // Chat input
  const [chatInput, setChatInput] = useState('');
  
  // Question Form inputs
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionContent, setQuestionContent] = useState('');
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  
  // Q&A reply inputs
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});

  // Whiteboard drawing variables
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<{ x: number; y: number }[]>([]);
  const [drawColor, setDrawColor] = useState('#4f46e5');
  const [lineWidth, setLineWidth] = useState(3);
  const [activeTab, setActiveTab] = useState<'chat' | 'whiteboard' | 'qna'>('chat');

  // WebSocket reference
  const socketRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isManualCloseRef = useRef(false);

  // Audio Synth (Web Audio API) state
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicType, setMusicType] = useState<'alpha' | 'rain' | 'ocean'>('alpha');
  const [volume, setVolume] = useState(0.4);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicNodesRef = useRef<{
    source?: AudioNode;
    gainNode?: GainNode;
    oscillators?: OscillatorNode[];
  }>({});

  // Pomodoro Focus Timer State
  const [pomoTime, setPomoTime] = useState(1500); // 25 minutes in seconds
  const [isPomoRunning, setIsPomoRunning] = useState(false);
  const [pomoMode, setPomoMode] = useState<'work' | 'break'>('work');
  const pomoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and maintain WebSocket connection
  useEffect(() => {
    isManualCloseRef.current = false;
    connectWebSocket(selectedRoom);

    return () => {
      isManualCloseRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [selectedRoom]);

  // Connect to the server's WebSocket
  const connectWebSocket = (roomId: string) => {
    setWsStatus('connecting');
    if (socketRef.current) {
      socketRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Determine the protocol (ws vs wss)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    console.log(`[WS Client] Connecting to ${wsUrl}`);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setWsStatus('connected');
      console.log('[WS Client] Connected');

      // Send join message
      const joinPayload = {
        type: 'join',
        data: {
          name: currentUser?.name || 'Thành viên Hòa Phú',
          role: currentUser?.role || 'Học sinh',
          roomId: roomId
        }
      };
      socket.send(JSON.stringify(joinPayload));

      // Start client heartbeat (Ping every 15 seconds to keep connection alive)
      heartbeatIntervalRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping', data: null }));
        }
      }, 15000);
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data } = payload;

        switch (type) {
          case 'pong': {
            // Heartbeat response from server, ignore or log
            break;
          }

          case 'init': {
            if (data.roomId === roomId) {
              setMessages(data.messages || []);
              setActiveUsers(data.activeUsers || []);
              setQuestions(data.questions || []);
              // Clear local canvas and redraw server strokes
              clearLocalCanvas();
              if (data.strokes && data.strokes.length > 0) {
                setTimeout(() => {
                  data.strokes.forEach((stroke: WhiteboardStroke) => {
                    drawStrokeOnCanvas(stroke);
                  });
                }, 100);
              }
            }
            break;
          }

          case 'chat-message': {
            setMessages(prev => [...prev, data]);
            scrollToBottom();
            break;
          }

          case 'draw': {
            // Received remote drawing stroke
            drawStrokeOnCanvas(data);
            break;
          }

          case 'clear-whiteboard': {
            clearLocalCanvas();
            break;
          }

          case 'questions-updated': {
            setQuestions(data.questions || []);
            break;
          }

          case 'users-updated': {
            setActiveUsers(data.activeUsers || []);
            break;
          }
        }
      } catch (err) {
        console.error('[WS Client] Error receiving message:', err);
      }
    };

    socket.onclose = () => {
      setWsStatus('disconnected');
      console.log('[WS Client] Closed');
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      // Auto-reconnect if not closed manually
      if (!isManualCloseRef.current) {
        console.log('[WS Client] Unexpected disconnect. Attempting reconnect in 3 seconds...');
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket(roomId);
        }, 3000);
      }
    };

    socket.onerror = (error) => {
      console.error('[WS Client] Error:', error);
      setWsStatus('disconnected');
      socket.close();
    };
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Canvas drawing functions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Adjust canvas size to container's client size
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = 420; // fixed height for study room whiteboard
        // Re-request full states from socket to draw properly if resized
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          // Send request to reload strokes
          socketRef.current.send(JSON.stringify({
            type: 'join',
            data: {
              name: currentUser?.name || 'Thành viên Hòa Phú',
              role: currentUser?.role || 'Học sinh',
              roomId: selectedRoom
            }
          }));
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [selectedRoom, activeTab]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Handle touch vs mouse
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    isDrawingRef.current = true;
    currentPointsRef.current = [coords];

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    
    currentPointsRef.current.push(coords);

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    // Send drawing action to server
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && currentPointsRef.current.length > 1) {
      socketRef.current.send(JSON.stringify({
        type: 'draw',
        data: {
          color: drawColor,
          lineWidth: lineWidth,
          points: currentPointsRef.current
        }
      }));
    }
  };

  const drawStrokeOnCanvas = (stroke: WhiteboardStroke) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas || !stroke.points || stroke.points.length === 0) return;

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const firstPoint = stroke.points[0];
    ctx.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  };

  const clearLocalCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleClearWhiteboard = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const confirmClear = window.confirm("Bạn có chắc chắn muốn xóa sạch bảng cộng đồng không? Hành động này sẽ xóa bảng đối với tất cả thành viên trong phòng.");
      if (confirmClear) {
        socketRef.current.send(JSON.stringify({
          type: 'clear-whiteboard',
          data: null
        }));
      }
    }
  };

  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat-message',
        data: { content: chatInput.trim() }
      }));
      setChatInput('');
    } else {
      showToast("Không có kết nối đến máy chủ. Đang thử kết nối lại...", "error");
      connectWebSocket(selectedRoom);
    }
  };

  // Post Question
  const handlePostQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionTitle.trim() || !questionContent.trim()) {
      showToast("Vui lòng nhập đầy đủ tiêu đề và nội dung câu hỏi!", "info");
      return;
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'post-question',
        data: {
          title: questionTitle.trim(),
          content: questionContent.trim()
        }
      }));
      setQuestionTitle('');
      setQuestionContent('');
      setIsQuestionModalOpen(false);
      showToast("Đã đăng câu hỏi học thuật thành công!", "success");
    } else {
      showToast("Chưa kết nối máy chủ, vui lòng thử lại sau.", "error");
    }
  };

  // Reply to Question
  const handleReplyQuestion = (questionId: string) => {
    const content = replyInput[questionId];
    if (!content || !content.trim()) return;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'reply-question',
        data: {
          questionId,
          content: content.trim()
        }
      }));
      setReplyInput(prev => ({ ...prev, [questionId]: '' }));
      showToast("Đã gửi lời giải thành công!", "success");
    } else {
      showToast("Chưa kết nối máy chủ.", "error");
    }
  };

  // Toggle solved
  const handleToggleSolved = (questionId: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'toggle-solve-question',
        data: { questionId }
      }));
    }
  };

  // Delete question
  const handleDeleteQuestion = (questionId: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      if (window.confirm("Bạn có muốn xóa câu hỏi này không?")) {
        socketRef.current.send(JSON.stringify({
          type: 'delete-question',
          data: { questionId }
        }));
        showToast("Đã xóa câu hỏi học thuật.", "success");
      }
    }
  };

  // AI & Community Consultation Actions
  const handleAskAiForChatMessage = (messageId: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat-ask-ai',
        data: { messageId }
      }));
      showToast("Đang gửi yêu cầu tham vấn AI...", "info");
    } else {
      showToast("Chưa kết nối máy chủ.", "error");
    }
  };

  const handlePingHelpForChatMessage = (messageId: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat-ping-help',
        data: { messageId }
      }));
      showToast("Đã gửi tín hiệu SOS nhờ Thầy Cô & Bạn bè trợ giúp!", "success");
    } else {
      showToast("Chưa kết nối máy chủ.", "error");
    }
  };

  const handleAskAiForQuestion = (questionId: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'ask-ai-question',
        data: { questionId }
      }));
      showToast("Đang gửi bài tập tới Trợ lý AI để soạn lời giải mẫu...", "info");
    } else {
      showToast("Chưa kết nối máy chủ.", "error");
    }
  };

  const handlePingHelpForQuestion = (questionId: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'ping-help-question',
        data: { questionId }
      }));
      showToast("Đã gửi thông báo nhờ Thầy Cô & Bạn học giải giúp câu hỏi!", "success");
    } else {
      showToast("Chưa kết nối máy chủ.", "error");
    }
  };

  // Pomodoro Timer control
  useEffect(() => {
    if (isPomoRunning) {
      pomoTimerRef.current = setInterval(() => {
        setPomoTime(prev => {
          if (prev <= 1) {
            // Mode switch
            clearInterval(pomoTimerRef.current!);
            setIsPomoRunning(false);
            if (pomoMode === 'work') {
              setPomoMode('break');
              setPomoTime(300); // 5 minutes break
              playFocusBell();
              showToast("🔔 Đã hết giờ học tập! Nghỉ giải lao 5 phút thôi nào!", "success");
            } else {
              setPomoMode('work');
              setPomoTime(1500); // 25 minutes work
              playFocusBell();
              showToast("🔔 Hết giờ nghỉ! Bắt đầu chu kỳ tập trung học tập mới thôi nào!", "success");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (pomoTimerRef.current) clearInterval(pomoTimerRef.current);
    }

    return () => {
      if (pomoTimerRef.current) clearInterval(pomoTimerRef.current);
    };
  }, [isPomoRunning, pomoMode]);

  const formatPomoTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sound generator using Web Audio API for extreme reliability
  const playFocusBell = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.1); // high crisp bell
      
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch (err) {
      console.warn("Could not play bell sound:", err);
    }
  };

  // Focus sound generator (Alpha Waves, Rain, Ocean)
  const toggleFocusMusic = () => {
    if (isMusicPlaying) {
      // Stop music
      stopFocusMusic();
    } else {
      // Start music
      startFocusMusic(musicType);
    }
  };

  const startFocusMusic = (type: 'alpha' | 'rain' | 'ocean') => {
    try {
      stopFocusMusic();
      
      // Create new AudioContext
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(ctx.destination);
      musicNodesRef.current.gainNode = masterGain;

      if (type === 'alpha') {
        // Binaural beat synthesis: Alpha waves at 10Hz
        // Left ear 200Hz, Right ear 210Hz
        const leftOsc = ctx.createOscillator();
        const rightOsc = ctx.createOscillator();
        
        const leftPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const rightPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

        leftOsc.type = 'sine';
        leftOsc.frequency.value = 140; // low deep peaceful binaural beat base

        rightOsc.type = 'sine';
        rightOsc.frequency.value = 150; // 10Hz difference for Alpha brain waves state

        if (leftPanner && rightPanner) {
          leftPanner.pan.value = -1;
          rightPanner.pan.value = 1;

          leftOsc.connect(leftPanner);
          leftPanner.connect(masterGain);

          rightOsc.connect(rightPanner);
          rightPanner.connect(masterGain);
        } else {
          leftOsc.connect(masterGain);
          rightOsc.connect(masterGain);
        }

        // Add a gentle filter/soft hum
        leftOsc.start();
        rightOsc.start();

        musicNodesRef.current.oscillators = [leftOsc, rightOsc];
      } else if (type === 'rain' || type === 'ocean') {
        // Synthesizing rain/ocean using procedural white/pink noise
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        // Pink noise approximation for warm rain or ocean waves
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.11; // normalise
          b6 = white * 0.115926;
        }

        const whiteNoiseSource = ctx.createBufferSource();
        whiteNoiseSource.buffer = noiseBuffer;
        whiteNoiseSource.loop = true;

        // Apply a low pass filter
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = type === 'rain' ? 800 : 350; // Ocean has lower frequency roar

        if (type === 'ocean') {
          // LFO for wave swelling effect
          const lfo = ctx.createOscillator();
          lfo.type = 'sine';
          lfo.frequency.value = 0.08; // 12 seconds per wave swell
          
          const lfoGain = ctx.createGain();
          lfoGain.gain.value = 0.15; // wave swelling gain

          const waveGain = ctx.createGain();
          waveGain.gain.value = 0.3;

          lfo.connect(lfoGain);
          lfoGain.connect(waveGain.gain); // modulate volume dynamically!
          
          whiteNoiseSource.connect(filter);
          filter.connect(waveGain);
          waveGain.connect(masterGain);
          
          lfo.start();
          musicNodesRef.current.oscillators = [lfo];
        } else {
          // Continuous rain sound
          whiteNoiseSource.connect(filter);
          filter.connect(masterGain);
        }

        whiteNoiseSource.start();
        musicNodesRef.current.source = whiteNoiseSource;
      }

      setIsMusicPlaying(true);
    } catch (err) {
      console.error("Could not play sound synthesized via Web Audio API:", err);
    }
  };

  const stopFocusMusic = () => {
    try {
      if (musicNodesRef.current.source) {
        (musicNodesRef.current.source as any).stop();
      }
      if (musicNodesRef.current.oscillators) {
        musicNodesRef.current.oscillators.forEach(osc => osc.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    } catch (err) {
      // already stopped
    }
    audioCtxRef.current = null;
    musicNodesRef.current = {};
    setIsMusicPlaying(false);
  };

  // Adjust volume dynamically
  useEffect(() => {
    if (musicNodesRef.current.gainNode) {
      musicNodesRef.current.gainNode.gain.value = volume;
    }
  }, [volume]);

  const handleMusicTypeChange = (type: 'alpha' | 'rain' | 'ocean') => {
    setMusicType(type);
    if (isMusicPlaying) {
      startFocusMusic(type);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200/85 p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-36 h-36 bg-blue-100 rounded-full blur-3xl opacity-45 -z-10 pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-28 h-28 bg-purple-100 rounded-full blur-2xl opacity-40 -z-10 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
              <Presentation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Phòng học cộng đồng trực tuyến 24/7
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase font-black tracking-wider animate-bounce">
                  Live
                </span>
              </h1>
              <p className="text-slate-500 font-bold text-xs mt-1">
                Không gian ôn tập, vẽ sơ đồ tư duy chung, trao đổi bài viết và thảo luận học thuật thời gian thực cùng bạn bè & thầy cô.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-[11px] shadow-sm ${
              wsStatus === 'connected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              wsStatus === 'connecting' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-red-50 text-red-700 border-red-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                wsStatus === 'connected' ? 'bg-emerald-500 animate-ping' :
                wsStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
                'bg-red-500'
              }`}></span>
              <span>
                {wsStatus === 'connected' ? 'Đã kết nối trực tuyến' :
                 wsStatus === 'connecting' ? 'Đang thiết lập kết nối...' :
                 'Đang mất kết nối'}
              </span>
            </div>
          </div>
        </div>

        {/* ROOM SELECTION TABS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5">
          {ROOMS.map(room => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              className={`p-3.5 rounded-2xl border text-left transition relative cursor-pointer flex flex-col justify-between ${
                selectedRoom === room.id
                  ? 'border-blue-600 bg-gradient-to-br from-blue-50/70 to-indigo-50/70 shadow-sm ring-1 ring-blue-500/10'
                  : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{room.icon}</span>
                <span className="font-extrabold text-xs text-slate-700">{room.name}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold leading-normal mt-1.5 line-clamp-2">
                {room.desc}
              </p>
              {selectedRoom === room.id && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* DYNAMIC ROW: FOCUS TIMER & STUDY SOUNDS (ONLY SHOWN OR HIGHLIGHTED IN STUDY ROOMS) */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-5 text-white shadow-lg border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 bg-blue-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex flex-col items-center justify-center font-mono font-black text-lg border border-white/20 relative shadow-inner">
            <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider absolute top-0.5">Timer</span>
            <span className="mt-2 text-white">{formatPomoTime(pomoTime)}</span>
          </div>
          <div>
            <span className="text-[10px] bg-indigo-500/30 border border-indigo-400/20 text-indigo-200 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
              {pomoMode === 'work' ? 'Đang Tập Trung (Work)' : 'Thời Gian Giải Lao'}
            </span>
            <h4 className="text-xs font-black text-indigo-50 mt-1 flex items-center gap-1">
              Phòng Tự Học Pomodoro Hòa Phú
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            </h4>
          </div>
        </div>

        {/* TIMER CONTROLS */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPomoRunning(!isPomoRunning)}
            className="w-10 h-10 rounded-full bg-white text-indigo-900 font-black hover:bg-slate-100 transition shadow-md flex items-center justify-center cursor-pointer active:scale-95"
            title={isPomoRunning ? "Tạm dừng" : "Bắt đầu"}
          >
            {isPomoRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-indigo-900 ml-0.5" />}
          </button>
          <button
            onClick={() => {
              setIsPomoRunning(false);
              setPomoTime(pomoMode === 'work' ? 1500 : 300);
            }}
            className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition flex items-center justify-center cursor-pointer"
            title="Đặt lại bộ hẹn giờ"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <span className="h-6 w-px bg-white/20 mx-1"></span>

          {/* AMBIENT MUSIC PLAYER CONTROLLER */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleFocusMusic}
              className={`w-10 h-10 rounded-full transition flex items-center justify-center cursor-pointer ${
                isMusicPlaying ? 'bg-amber-400 text-slate-900 animate-spin-slow' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={isMusicPlaying ? "Tắt âm thanh tập trung" : "Bật âm thanh tập trung"}
            >
              <Music className="w-4 h-4" />
            </button>
            <select
              value={musicType}
              onChange={(e) => handleMusicTypeChange(e.target.value as any)}
              className="bg-slate-800 text-white font-bold text-xs border border-white/20 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-400"
            >
              <option value="alpha">Sóng não Alpha (Học tập)</option>
              <option value="rain">Mưa rơi tự nhiên (Rain)</option>
              <option value="ocean">Sóng biển vỗ rì rào (Ocean)</option>
            </select>
            
            <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl px-2.5 py-1.5 border border-white/10">
              <Volume2 className="w-3.5 h-3.5 text-indigo-300" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-12 h-1 accent-indigo-400 opacity-80 hover:opacity-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CORE INTERACTIVE DASHBOARD SECTION: SPLIT IN MAIN DESK & SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* MAIN PANEL - 8 COLS */}
        <div className="lg:col-span-8 space-y-6">
          {/* NAVIGATION INTERNAL TABS */}
          <div className="bg-white p-1 rounded-2xl border border-slate-200 flex items-center gap-1 shadow-sm">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'chat' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Phòng Trò Chuyện Nhóm</span>
            </button>
            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'whiteboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Bảng Vẽ Sơ Đồ Tư Duy Chung</span>
            </button>
            <button
              onClick={() => setActiveTab('qna')}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'qna' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Góc Giải Đáp Học Thuật ({questions.length})</span>
            </button>
          </div>

          {/* TAB 1: DISCUSSION AREA */}
          {activeTab === 'chat' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[520px] overflow-hidden">
              {/* CHAT DISPLAY CONTAINER */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <MessageSquare className="w-12 h-12 text-slate-300 animate-pulse mb-3" />
                    <p className="text-slate-500 text-xs font-bold">Chưa có cuộc trò chuyện nào trong phòng này.</p>
                    <p className="text-slate-400 text-[11px] mt-1">Hãy bắt đầu gửi tin nhắn chào mừng các thành viên khác!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isSystem = msg.sender === 'Hệ thống';
                    const isMe = msg.sender === currentUser?.name;
                    const isTeacher = msg.role === 'Giáo viên' || msg.role === 'Admin';
                    
                    if (isSystem) {
                      return (
                        <div key={msg.id || idx} className="flex justify-center my-1 animate-fade-in">
                          <span className="bg-slate-100 border border-slate-200/60 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold tracking-tight">
                            {msg.content}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex gap-2.5 max-w-[85%] animate-fade-in ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                      >
                        {/* Avatar circle */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black uppercase shrink-0 shadow-sm ${
                          isMe ? 'bg-blue-600 text-white' :
                          isTeacher ? 'bg-purple-600 text-white' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {msg.sender.substring(0, 1)}
                        </div>

                        {/* Content text */}
                        <div className="flex flex-col">
                          <div className={`flex items-center gap-1.5 text-[10px] font-bold text-slate-500 mb-1 ${isMe ? 'justify-end' : ''}`}>
                            <span className={isTeacher ? 'text-purple-600 font-extrabold' : ''}>{msg.sender}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[8.5px] uppercase ${
                              isTeacher ? 'bg-purple-50 text-purple-700 border border-purple-200 font-black' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {msg.role}
                            </span>
                            <span>{msg.timestamp}</span>
                          </div>
                          <div className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm break-words ${
                            isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                          }`}>
                            {msg.content}
                          </div>

                          {/* Consultation Actions */}
                          {msg.role !== 'Hệ thống' && msg.role !== 'AI' && (
                            <div className={`flex items-center gap-1.5 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <button
                                type="button"
                                onClick={() => handleAskAiForChatMessage(msg.id)}
                                className="text-[9.5px] px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold rounded-lg transition flex items-center gap-1 cursor-pointer border border-blue-200/40"
                                title="Tham khảo ý kiến giải đáp nhanh từ Trợ lý AI"
                              >
                                <span>🤖 Hỏi AI</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePingHelpForChatMessage(msg.id)}
                                className="text-[9.5px] px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold rounded-lg transition flex items-center gap-1 cursor-pointer border border-amber-200/40"
                                title="Nhờ Thầy Cô hoặc các bạn học sinh khác trợ giúp trả lời"
                              >
                                <span>📢 Hỏi thầy cô/bạn bè</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* CHAT SENDER INPUT */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Gửi lời nhắn hỏi bài hoặc thảo luận nhóm tại #${ROOMS.find(r => r.id === selectedRoom)?.name}...`}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-500/10 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: WHITEBOARD DRAWING DESK */}
          {activeTab === 'whiteboard' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2.5 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-3.5 flex-wrap">
                  {/* Colors */}
                  <div className="flex items-center gap-1">
                    <Palette className="w-4 h-4 text-slate-500 mr-1.5" />
                    {['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#06b6d4', '#000000'].map(color => (
                      <button
                        key={color}
                        onClick={() => setDrawColor(color)}
                        className={`w-6 h-6 rounded-full transition cursor-pointer border-2 ${
                          drawColor === color ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <span className="h-4 w-px bg-slate-200"></span>

                  {/* Line thickness selection */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-bold">Cỡ nét:</span>
                    {[2, 4, 6, 10].map(size => (
                      <button
                        key={size}
                        onClick={() => setLineWidth(size)}
                        className={`px-2 py-0.5 rounded text-[10px] font-black border transition cursor-pointer ${
                          lineWidth === size ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {size}px
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearWhiteboard}
                    className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-red-200/60"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Xóa Sạch Bảng</span>
                  </button>
                </div>
              </div>

              {/* DRAWING CANVAS DESK */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden relative bg-slate-50">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[420px] bg-white cursor-crosshair touch-none"
                />
                
                <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] text-white font-extrabold flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                  Vẽ bằng chuột/vân tay trực tiếp lên bảng vẽ đồng bộ
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Q&A FORUM */}
          {activeTab === 'qna' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    Diễn đàn giải đáp thắc mắc
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-black">
                      {questions.length} câu hỏi
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5">Đặt câu hỏi khó để cùng bạn bè và giáo viên của trường giải đáp.</p>
                </div>

                <button
                  onClick={() => setIsQuestionModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <HelpCircle className="w-4 h-4" />
                  Đặt câu hỏi mới
                </button>
              </div>

              {/* QUESTIONS LIST */}
              <div className="space-y-4">
                {questions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <HelpCircle className="w-10 h-10 text-slate-300 mb-2 animate-bounce" />
                    <p className="text-slate-500 text-xs font-extrabold">Chưa có câu hỏi học thuật nào được đặt.</p>
                    <p className="text-slate-400 text-[11px] mt-1">Hãy là người đầu tiên đưa ra bài tập cần giúp đỡ!</p>
                  </div>
                ) : (
                  questions.map(q => (
                    <div key={q.id} className="border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm hover:shadow-md transition">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 ${
                            q.solved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {q.solved ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Đã Giải</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                <span>Đang Chờ Giải</span>
                              </>
                            )}
                          </span>
                          <h4 className="font-extrabold text-xs text-slate-800 hover:text-blue-600 transition">{q.title}</h4>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Owner or Teacher actions */}
                          {(currentUser?.role === 'Admin' || currentUser?.role === 'Giáo viên' || currentUser?.name === q.sender) && (
                            <button
                              onClick={() => handleToggleSolved(q.id)}
                              className="p-1 text-slate-400 hover:text-emerald-600 transition"
                              title="Đánh dấu trạng thái Đã Giải / Chưa Giải"
                            >
                              <CheckCircle className="w-4.5 h-4.5" />
                            </button>
                          )}
                          {(currentUser?.role === 'Admin' || currentUser?.role === 'Giáo viên' || currentUser?.name === q.sender) && (
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1 text-slate-400 hover:text-red-600 transition"
                              title="Xóa câu hỏi này"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Question body */}
                      <p className="text-xs text-slate-600 font-medium whitespace-pre-line leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {q.content}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold border-b pb-2">
                        <div className="flex items-center gap-2">
                          <span>Người đăng: <strong className="text-slate-700">{q.sender}</strong> ({q.role})</span>
                        </div>
                        <span>Đăng lúc: {q.timestamp}</span>
                      </div>

                      {/* Consultation & Support Action bar */}
                      <div className="flex items-center gap-2 flex-wrap py-1.5 bg-gradient-to-r from-slate-50 to-blue-50/20 p-2.5 rounded-xl border border-slate-100/80">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight mr-1">Tư vấn giải bài:</span>
                        <button
                          type="button"
                          onClick={() => handleAskAiForQuestion(q.id)}
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-lg transition flex items-center gap-1 cursor-pointer border border-indigo-200/50 shadow-sm"
                          title="Hỏi Trợ lý AI phân tích và đưa ra lời giải từng bước"
                        >
                          <span>🤖 Tham vấn Lời giải AI</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePingHelpForQuestion(q.id)}
                          className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-extrabold rounded-lg transition flex items-center gap-1 cursor-pointer border border-amber-200/50 shadow-sm"
                          title="Gửi thông báo SOS tới phòng chat để nhờ Thầy Cô & Bạn học giải giúp"
                        >
                          <span>📢 Nhờ Thầy Cô & Bạn học</span>
                        </button>
                      </div>

                      {/* REPLIES */}
                      <div className="space-y-2 mt-2">
                        {q.replies && q.replies.length > 0 && (
                          <div className="space-y-2 pl-4 border-l-2 border-slate-150">
                            {q.replies.map(reply => {
                              const isTeacherReply = reply.role === 'Giáo viên' || reply.role === 'Admin';
                              return (
                                <div key={reply.id} className={`p-3 rounded-xl text-xs ${isTeacherReply ? 'bg-purple-50/80 border border-purple-100' : 'bg-slate-50'}`}>
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 mb-1">
                                    <span className={isTeacherReply ? 'text-purple-700' : 'text-slate-700'}>{reply.sender}</span>
                                    <span className={`px-1 rounded text-[8px] uppercase ${isTeacherReply ? 'bg-purple-100 text-purple-700 font-black' : 'bg-slate-200'}`}>
                                      {reply.role}
                                    </span>
                                    <span className="ml-auto">{reply.timestamp}</span>
                                  </div>
                                  <p className="text-slate-700 font-semibold leading-relaxed break-words">{reply.content}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Quick reply box */}
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={replyInput[q.id] || ''}
                            onChange={(e) => setReplyInput(prev => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder="Nhập lời giải hoặc gợi ý ý tưởng tại đây..."
                            className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 bg-slate-50/50 focus:bg-white transition"
                          />
                          <button
                            onClick={() => handleReplyQuestion(q.id)}
                            disabled={!(replyInput[q.id] || '').trim()}
                            className="px-4 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 border border-blue-200/80 font-black text-xs rounded-xl flex items-center justify-center transition cursor-pointer"
                          >
                            Gửi lời giải
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR PANEL - 4 COLS */}
        <div className="lg:col-span-4 space-y-6">
          {/* ACTIVE USERS ROSTER */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3.5">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 pb-2.5 border-b">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Đang trong phòng ({activeUsers.length})</span>
            </h3>

            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {activeUsers.length === 0 ? (
                <p className="text-slate-400 font-bold text-xs text-center py-4">Đang truy xuất danh sách...</p>
              ) : (
                activeUsers.map(user => {
                  const isTeacher = user.role === 'Giáo viên' || user.role === 'Admin';
                  return (
                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-[10.5px] font-black uppercase text-white ${
                          isTeacher ? 'bg-purple-600' : 'bg-blue-500'
                        }`}>
                          {user.name.substring(0, 1)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-700">{user.name}</p>
                          <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                            isTeacher ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1"></span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SHARED LEARNING RESOURCES PANEL */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 pb-2.5 border-b">
              <FileText className="w-5 h-5 text-brand-orange" />
              <span>Tài liệu tự học khuyên dùng</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5 hover:bg-slate-100/50 transition">
                <span className="text-lg">📈</span>
                <div>
                  <h4 className="font-extrabold text-slate-700">Công thức lượng giác cơ bản lớp 9</h4>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">Sổ tay rút gọn ôn thi tuyển sinh lớp 10 chất lượng cao.</p>
                  <a href="#" className="text-[10px] text-blue-600 font-black flex items-center gap-0.5 mt-1 hover:underline">
                    Xem tài liệu <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5 hover:bg-slate-100/50 transition">
                <span className="text-lg">📚</span>
                <div>
                  <h4 className="font-extrabold text-slate-700">Bộ 15 đề thi Ngữ văn chọn lọc</h4>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">Tổng hợp đề ôn luyện chi tiết đáp án của trường THCS Hòa Phú.</p>
                  <a href="#" className="text-[10px] text-blue-600 font-black flex items-center gap-0.5 mt-1 hover:underline">
                    Xem tài liệu <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5 hover:bg-slate-100/50 transition">
                <span className="text-lg">🇬🇧</span>
                <div>
                  <h4 className="font-extrabold text-slate-700">100 Động từ bất quy tắc thiết yếu</h4>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">Học nhanh ghi nhớ lâu bằng thẻ flashcard tiếng Anh Hòa Phú.</p>
                  <a href="#" className="text-[10px] text-blue-600 font-black flex items-center gap-0.5 mt-1 hover:underline">
                    Xem tài liệu <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUESTION MODAL */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b pb-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              Đặt câu hỏi thắc mắc học thuật mới
            </h4>

            <form onSubmit={handlePostQuestion} className="space-y-4 text-xs font-bold">
              <div className="space-y-1.5">
                <label className="text-slate-600">Tiêu đề ngắn của câu hỏi:</label>
                <input
                  type="text"
                  required
                  value={questionTitle}
                  onChange={(e) => setQuestionTitle(e.target.value)}
                  placeholder="Ví dụ: Cách giải bài toán lượng giác đề thi thử..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-600">Nội dung chi tiết hoặc đề bài cụ thể:</label>
                <textarea
                  required
                  rows={4}
                  value={questionContent}
                  onChange={(e) => setQuestionContent(e.target.value)}
                  placeholder="Vui lòng mô tả chi tiết bài tập hoặc thắc mắc của em tại đây để nhận lời giải đáp..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition cursor-pointer shadow-md shadow-blue-500/10"
                >
                  Đăng câu hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
