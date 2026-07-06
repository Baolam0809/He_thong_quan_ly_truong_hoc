import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client using named parameter as mandated
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Helper function to call Gemini with retries and fallback models
async function generateContentWithRetry(
  aiClient: GoogleGenAI,
  contents: any,
  systemInstruction: string,
  temperature: number = 0.7
): Promise<any> {
  // Try gemini-3.5-flash first as it is the recommended standard model, with high-quality fallbacks
  const modelsToTry = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.1-pro-preview", "gemini-2.5-pro"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    let delay = 1000; // start with 1 second delay
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[Gemini Request] Model: ${model}, Attempt: ${attempt}`);
        const response = await aiClient.models.generateContent({
          model: model,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: temperature,
          },
        });
        if (response && response.text) {
          console.log(`[Gemini Success] Answer retrieved successfully using model: ${model}`);
          return response;
        }
      } catch (error: any) {
        lastError = error;
        const errMsg = error.message || String(error);
        const errStatus = error.status || 0;
        console.warn(`[Gemini Warning] Model ${model} attempt ${attempt} failed: ${errMsg} (Status: ${errStatus})`);
        
        // Determine if error is transient (503 Service Unavailable, 429 Too Many Requests, etc.)
        const isTransient = 
          errStatus === 503 || 
          errStatus === 429 || 
          errMsg.includes("503") || 
          errMsg.includes("429") || 
          errMsg.toLowerCase().includes("unavailable") || 
          errMsg.toLowerCase().includes("busy") ||
          errMsg.toLowerCase().includes("temporary") ||
          errMsg.toLowerCase().includes("overloaded");

        if (!isTransient) {
          // Non-transient errors (like bad requests 400 or auth errors 403) should trigger model switch immediately
          break;
        }

        if (attempt < 3) {
          console.log(`[Gemini Retry] Waiting ${delay}ms before next attempt...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
        }
      }
    }
  }

  throw lastError || new Error("Không thể nhận diện phản hồi từ các mô hình AI sau nhiều lần thử.");
}

// API endpoint for Gemini chat
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Yêu cầu danh sách tin nhắn hợp lệ." });
    }

    if (!ai) {
      return res.status(503).json({ 
        error: "Trợ lý AI chưa được kích hoạt do thiếu API Key hoặc cấu hình sai. Vui lòng liên hệ Admin." 
      });
    }

    // Map message history to Gemini contents structure
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const systemInstruction = `Bạn là Trợ lý Học thuật AI (HPAI) của Trường THCS Hòa Phú - một cổng thông tin giáo vụ số hiện đại.
Hãy trả lời một cách lịch sự, thân thiện, và mang tính xây dựng bằng tiếng Việt.
Hỗ trợ giải đáp về các chức năng học vụ số của website:
- Trang chủ tổng quan: Tin tức, danh hiệu học sinh/lớp xuất sắc, giám sát khách thăm.
- Khóa học của con: Nơi học sinh/phụ huynh đăng ký học tập hoặc bồi dưỡng học sinh giỏi.
- Văn bản chỉ đạo: Cập nhật văn bản chỉ thị từ ban giám hiệu.
- Góc tự học: Tổng hợp các bài giảng video hữu ích theo môn học.
- Quản lý tài khoản, khối & lớp, bộ môn, phân công giảng dạy: Dành cho Admin/Nhà trường để thiết lập.
- Ngân hàng đề thi: Nơi giáo viên lưu trữ đề ôn tập/kiểm tra.
- Quản lý bài tập: Giáo viên giao bài tập, học sinh nộp bài giải.
- Phòng thi: Học sinh tham gia làm bài trắc nghiệm / tự luận.
- Chấm bài & Nhập điểm: Giáo viên đánh giá kết quả làm bài của học sinh.
- Bảng điểm tổng hợp: Tra cứu điểm số học tập của từng học sinh hoặc lớp.
- Sổ liên lạc điện tử: Kênh kết nối thông tin giữa giáo viên chủ nhiệm và phụ huynh học sinh.
- Trung tâm kết xuất: Xuất báo cáo, học bạ, bảng điểm định dạng Excel nhanh chóng.
- Trò chơi trí tuệ: Các mini-game hữu ích rèn luyện trí tuệ.
Hãy luôn xưng hô lịch sự và chu đáo (Ví dụ: xưng "HPAI" hoặc "Trợ lý", gọi người dùng là "thầy cô", "phụ huynh", "em", hoặc "bạn").
Nếu câu hỏi không liên quan đến học tập hoặc các hoạt động nhà trường, hãy khéo léo và tế nhị định hướng người học quay lại chủ đề giáo dục và học đường (Ví dụ: "HPAI là trợ lý giáo vụ trường THCS Hòa Phú, em có câu hỏi nào về môn Toán hoặc lịch học của trường mình không nè?").`;

    const response = await generateContentWithRetry(ai, contents, systemInstruction, 0.7);

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini API Error in server.ts:", error);
    res.status(500).json({ error: error.message || "Đã xảy ra lỗi hệ thống khi trò chuyện." });
  }
});

// Serve static files or Vite middleware
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

interface StudyRoomState {
  messages: ChatMessage[];
  strokes: WhiteboardStroke[];
  questions: StudyQuestion[];
}

const roomStates: Record<string, StudyRoomState> = {
  "math-sci": {
    messages: [
      {
        id: "m1",
        roomId: "math-sci",
        sender: "Thầy Nguyễn Minh Triết",
        role: "Giáo viên",
        content: "Chào các em học sinh! Thầy vừa tải lên sơ đồ tư duy môn Toán hình lớp 9 chương hệ thức lượng tam giác vuông. Các em cùng ôn tập và vẽ thêm sơ đồ tư duy trực tiếp lên bảng vẽ chung nhé!",
        timestamp: "08:15",
      }
    ],
    strokes: [],
    questions: [
      {
        id: "q1",
        roomId: "math-sci",
        sender: "Trần Bảo Nam",
        role: "Học sinh",
        title: "Tính độ dài đường cao trong tam giác vuông",
        content: "Cho tam giác vuông ABC tại A có AB = 6cm, AC = 8cm. Làm thế nào tính nhanh đường cao AH và hình chiếu BH, CH ạ?",
        timestamp: "08:20",
        solved: true,
        replies: [
          {
            id: "qr1",
            sender: "Thầy Nguyễn Minh Triết",
            role: "Giáo viên",
            content: "Chào Nam, em có thể tính BC bằng định lý Pythagoras: BC^2 = AB^2 + AC^2 = 100 => BC = 10cm. Sau đó áp dụng hệ thức lượng: AB * AC = AH * BC => 6 * 8 = AH * 10 => AH = 4.8cm. Còn hình chiếu BH tính bằng AB^2 = BH * BC => 36 = BH * 10 => BH = 3.6cm.",
            timestamp: "08:25"
          }
        ]
      }
    ]
  },
  "lit-hist": {
    messages: [
      {
        id: "m2",
        roomId: "lit-hist",
        sender: "Cô Lê Thị Thanh Nhàn",
        role: "Giáo viên",
        content: "Hôm nay chúng ta cùng phân tích tác phẩm 'Đồng chí' của Chính Hữu. Các em có thể thảo luận và ghi chú các từ khóa quan trọng lên bảng vẽ.",
        timestamp: "09:00",
      }
    ],
    strokes: [],
    questions: []
  },
  "english": {
    messages: [
      {
        id: "m3",
        roomId: "english",
        sender: "Mr. David Miller",
        role: "Giáo viên",
        content: "Welcome to English Study Group! Let's practice relative clauses. Feel free to write down any doubts.",
        timestamp: "09:10",
      }
    ],
    strokes: [],
    questions: []
  },
  "self-study": {
    messages: [
      {
        id: "m4",
        roomId: "self-study",
        sender: "Hệ thống Hòa Phú",
        role: "Hệ thống",
        content: "Phòng tự học ôn thi chung 24/7. Các em có thể bật nhạc sóng Alpha, Pomodoro để cùng tập trung ôn tập hiệu quả.",
        timestamp: "00:00",
      }
    ],
    strokes: [],
    questions: []
  }
};

interface ConnectedClient {
  ws: WebSocket;
  id: string;
  name: string;
  role: string;
  roomId: string;
}

const clients = new Map<WebSocket, ConnectedClient>();

function setupWebSocket(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket) => {
    console.log("[WS] New connection established");

    ws.on("message", async (message: string) => {
      try {
        const payload = JSON.parse(message);
        const { type, data } = payload;

        switch (type) {
          case "join": {
            const { name, role, roomId } = data;
            const clientId = Math.random().toString(36).substring(2, 9);
            const userRoomId = roomId || "math-sci";
            
            clients.set(ws, {
              ws,
              id: clientId,
              name: name || "Ẩn danh",
              role: role || "Học sinh",
              roomId: userRoomId
            });

            console.log(`[WS] User joined: ${name} (${role}) in room ${userRoomId}`);

            // Initialize room state if missing
            if (!roomStates[userRoomId]) {
              roomStates[userRoomId] = { messages: [], strokes: [], questions: [] };
            }

            // Send initial room history to this client
            ws.send(JSON.stringify({
              type: "init",
              data: {
                roomId: userRoomId,
                messages: roomStates[userRoomId].messages,
                strokes: roomStates[userRoomId].strokes,
                questions: roomStates[userRoomId].questions,
                activeUsers: getActiveUsersInRoom(userRoomId)
              }
            }));

            // Broadcast updated active users to everyone in the room
            broadcastToRoom(userRoomId, {
              type: "users-updated",
              data: { activeUsers: getActiveUsersInRoom(userRoomId) }
            });

            // Broadcast a system message that this user has joined
            const joinMsg: ChatMessage = {
              id: `sys-${Date.now()}`,
              roomId: userRoomId,
              sender: "Hệ thống",
              role: "Hệ thống",
              content: `${name} (${role}) đã tham gia phòng học.`,
              timestamp: getShortTime()
            };
            roomStates[userRoomId].messages.push(joinMsg);
            broadcastToRoom(userRoomId, {
              type: "chat-message",
              data: joinMsg
            });

            break;
          }

          case "chat-message": {
            const client = clients.get(ws);
            if (!client) return;

            const newMsg: ChatMessage = {
              id: `m-${Date.now()}`,
              roomId: client.roomId,
              sender: client.name,
              role: client.role,
              content: data.content,
              timestamp: getShortTime()
            };

            roomStates[client.roomId].messages.push(newMsg);
            if (roomStates[client.roomId].messages.length > 200) {
              roomStates[client.roomId].messages.shift();
            }

            broadcastToRoom(client.roomId, {
              type: "chat-message",
              data: newMsg
            });
            break;
          }

          case "draw": {
            const client = clients.get(ws);
            if (!client) return;

            const stroke: WhiteboardStroke = {
              color: data.color || "#4f46e5",
              lineWidth: data.lineWidth || 3,
              points: data.points || []
            };

            roomStates[client.roomId].strokes.push(stroke);
            if (roomStates[client.roomId].strokes.length > 500) {
              roomStates[client.roomId].strokes.shift();
            }

            broadcastToRoom(client.roomId, {
              type: "draw",
              data: stroke
            }, ws);
            break;
          }

          case "clear-whiteboard": {
            const client = clients.get(ws);
            if (!client) return;

            roomStates[client.roomId].strokes = [];
            broadcastToRoom(client.roomId, {
              type: "clear-whiteboard",
              data: null
            });
            break;
          }

          case "post-question": {
            const client = clients.get(ws);
            if (!client) return;

            const newQuestion: StudyQuestion = {
              id: `q-${Date.now()}`,
              roomId: client.roomId,
              sender: client.name,
              role: client.role,
              title: data.title,
              content: data.content,
              timestamp: getShortTime(),
              solved: false,
              replies: []
            };

            roomStates[client.roomId].questions.push(newQuestion);
            broadcastToRoom(client.roomId, {
              type: "questions-updated",
              data: { questions: roomStates[client.roomId].questions }
            });
            break;
          }

          case "reply-question": {
            const client = clients.get(ws);
            if (!client) return;

            const { questionId, content } = data;
            const roomQ = roomStates[client.roomId].questions;
            const question = roomQ.find(q => q.id === questionId);
            
            if (question) {
              const reply: StudyQuestionReply = {
                id: `qr-${Date.now()}`,
                sender: client.name,
                role: client.role,
                content: content,
                timestamp: getShortTime()
              };
              question.replies.push(reply);
              broadcastToRoom(client.roomId, {
                type: "questions-updated",
                data: { questions: roomQ }
              });
            }
            break;
          }

          case "toggle-solve-question": {
            const client = clients.get(ws);
            if (!client) return;

            const { questionId } = data;
            const roomQ = roomStates[client.roomId].questions;
            const question = roomQ.find(q => q.id === questionId);
            
            if (question) {
              question.solved = !question.solved;
              broadcastToRoom(client.roomId, {
                type: "questions-updated",
                data: { questions: roomQ }
              });
            }
            break;
          }

          case "delete-question": {
            const client = clients.get(ws);
            if (!client) return;

            const { questionId } = data;
            const roomQ = roomStates[client.roomId].questions;
            const idx = roomQ.findIndex(q => q.id === questionId);
            if (idx !== -1) {
              const question = roomQ[idx];
              if (client.role === 'Admin' || client.role === 'Giáo viên' || client.name === question.sender) {
                roomQ.splice(idx, 1);
                broadcastToRoom(client.roomId, {
                  type: "questions-updated",
                  data: { questions: roomQ }
                });
              }
            }
            break;
          }

          case "chat-ask-ai": {
            const client = clients.get(ws);
            if (!client) return;

            const { messageId } = data;
            const messagesList = roomStates[client.roomId].messages;
            const targetMsg = messagesList.find(m => m.id === messageId);
            if (!targetMsg) return;

            if (!ai) {
              const errorMsg: ChatMessage = {
                id: `sys-err-${Date.now()}`,
                roomId: client.roomId,
                sender: "Hệ thống",
                role: "Hệ thống",
                content: "⚠️ Trợ lý AI chưa được kích hoạt do thiếu API Key. Vui lòng liên hệ Admin để cấu hình.",
                timestamp: getShortTime()
              };
              ws.send(JSON.stringify({ type: "chat-message", data: errorMsg }));
              return;
            }

            // Send temporary pending message to the client or group so they know AI is thinking
            const thinkingMsg: ChatMessage = {
              id: `sys-think-${Date.now()}`,
              roomId: client.roomId,
              sender: "Hệ thống",
              role: "Hệ thống",
              content: `🤖 Trợ lý AI đang nghiên cứu câu hỏi của @${targetMsg.sender}...`,
              timestamp: getShortTime()
            };
            broadcastToRoom(client.roomId, {
              type: "chat-message",
              data: thinkingMsg
            });

            // Call Gemini
            try {
              let roomName = "Học tập chung";
              if (client.roomId === "math-sci") roomName = "Toán học & Khoa học";
              else if (client.roomId === "lit-hist") roomName = "Ngữ văn & Lịch sử";
              else if (client.roomId === "english") roomName = "Ngoại ngữ (Tiếng Anh)";
              else if (client.roomId === "self-study") roomName = "Phòng tự học & Pomodoro";

              const systemInstruction = `Bạn là Trợ lý Học thuật AI (Hòa Phú) chuyên hỗ trợ thắc mắc học vụ/bài tập cho học sinh trung học cơ sở tại phòng học '${roomName}'.
Hãy phân tích và trả lời thắc mắc dưới đây của học sinh một cách ngắn gọn, trực diện, chính xác, lịch sự và dễ hiểu nhất. 
Khuyến khích và động viên các em tự học sáng tạo. Không viết quá dài dòng (khoảng 2-4 câu). Trả lời bằng tiếng Việt.`;

              const prompt = `Học sinh ${targetMsg.sender} (${targetMsg.role}) hỏi trong phòng ${roomName}: "${targetMsg.content}"`;
              const response = await generateContentWithRetry(ai, prompt, systemInstruction, 0.7);

              const aiMsg: ChatMessage = {
                id: `m-ai-${Date.now()}`,
                roomId: client.roomId,
                sender: "Trợ lý Học thuật AI (Hòa Phú)",
                role: "AI",
                content: `🤖 Trả lời @${targetMsg.sender}: ${response.text}`,
                timestamp: getShortTime()
              };

              roomStates[client.roomId].messages.push(aiMsg);
              if (roomStates[client.roomId].messages.length > 200) {
                roomStates[client.roomId].messages.shift();
              }

              broadcastToRoom(client.roomId, {
                type: "chat-message",
                data: aiMsg
              });
            } catch (err: any) {
              const failMsg: ChatMessage = {
                id: `sys-fail-${Date.now()}`,
                roomId: client.roomId,
                sender: "Hệ thống",
                role: "Hệ thống",
                content: `⚠️ Có lỗi xảy ra khi kết nối với Trợ lý AI: ${err.message || String(err)}`,
                timestamp: getShortTime()
              };
              broadcastToRoom(client.roomId, {
                type: "chat-message",
                data: failMsg
              });
            }
            break;
          }

          case "chat-ping-help": {
            const client = clients.get(ws);
            if (!client) return;

            const { messageId } = data;
            const messagesList = roomStates[client.roomId].messages;
            const targetMsg = messagesList.find(m => m.id === messageId);
            if (!targetMsg) return;

            const truncated = targetMsg.content.length > 60 ? targetMsg.content.substring(0, 60) + "..." : targetMsg.content;
            const systemAlert: ChatMessage = {
              id: `sys-alert-${Date.now()}`,
              roomId: client.roomId,
              sender: "Hệ thống",
              role: "Hệ thống",
              content: `📢 Học sinh ${client.name} đang cần Thầy Cô hoặc các Bạn học hỗ trợ giải đáp tin nhắn: "${truncated}"`,
              timestamp: getShortTime()
            };

            roomStates[client.roomId].messages.push(systemAlert);
            broadcastToRoom(client.roomId, {
              type: "chat-message",
              data: systemAlert
            });
            break;
          }

          case "ask-ai-question": {
            const client = clients.get(ws);
            if (!client) return;

            const { questionId } = data;
            const roomQ = roomStates[client.roomId].questions;
            const question = roomQ.find(q => q.id === questionId);
            if (!question) return;

            if (!ai) {
              const systemMsg: ChatMessage = {
                id: `sys-err-${Date.now()}`,
                roomId: client.roomId,
                sender: "Hệ thống",
                role: "Hệ thống",
                content: "⚠️ Trợ lý AI chưa được kích hoạt. Hãy cấu hình GEMINI_API_KEY.",
                timestamp: getShortTime()
              };
              ws.send(JSON.stringify({ type: "chat-message", data: systemMsg }));
              return;
            }

            // Create a temporary "AI is thinking" reply to show status
            const thinkingReply: StudyQuestionReply = {
              id: `qr-ai-thinking-${Date.now()}`,
              sender: "Trợ lý Học thuật AI (Hòa Phú)",
              role: "AI",
              content: "⏳ Đang nghiên cứu đề bài và soạn lời giải chi tiết học thuật cho em. Vui lòng chờ trong giây lát...",
              timestamp: getShortTime()
            };
            question.replies.push(thinkingReply);
            broadcastToRoom(client.roomId, {
              type: "questions-updated",
              data: { questions: roomQ }
            });

            try {
              let roomName = "Học tập chung";
              if (client.roomId === "math-sci") roomName = "Toán học & Khoa học";
              else if (client.roomId === "lit-hist") roomName = "Ngữ văn & Lịch sử";
              else if (client.roomId === "english") roomName = "Ngoại ngữ (Tiếng Anh)";
              else if (client.roomId === "self-study") roomName = "Phòng tự học & Pomodoro";

              const systemInstruction = `Bạn là Trợ lý Học thuật AI (Hòa Phú) chuyên giảng dạy, hỗ trợ và giải đáp bài tập cho học sinh cấp 2 tại phòng học '${roomName}'.
Hãy phân tích và viết một lời giải chi tiết, khoa học, có cấu trúc rõ ràng, từng bước một (step-by-step) cho câu hỏi học tập dưới đây.
Bao gồm:
1. Phân tích đề bài và tóm tắt phương pháp giải.
2. Các bước giải chi tiết kèm theo công thức/lý thuyết áp dụng (nếu có).
3. Lời khuyên học tập để học sinh ghi nhớ dạng bài này.
Giọng điệu sư phạm, dễ hiểu, tận tình, khuyến khích học sinh. Trả lời bằng tiếng Việt.`;

              const prompt = `Đề bài/Câu hỏi: "${question.title}"
Chi tiết nội dung:
"${question.content}"`;

              const response = await generateContentWithRetry(ai, prompt, systemInstruction, 0.7);

              // Remove the thinking reply
              question.replies = question.replies.filter(r => r.id !== thinkingReply.id);

              const aiReply: StudyQuestionReply = {
                id: `qr-ai-${Date.now()}`,
                sender: "Trợ lý Học thuật AI (Hòa Phú)",
                role: "AI",
                content: response.text,
                timestamp: getShortTime()
              };

              question.replies.push(aiReply);
              
              // Broadcast the updated questions list
              broadcastToRoom(client.roomId, {
                type: "questions-updated",
                data: { questions: roomQ }
              });

              // Add a nice alert message in chat room
              const chatAlert: ChatMessage = {
                id: `sys-q-alert-${Date.now()}`,
                roomId: client.roomId,
                sender: "Hệ thống",
                role: "Hệ thống",
                content: `🤖 Trợ lý Học thuật AI đã đăng bài giải tham khảo chi tiết cho câu hỏi: "${question.title}" tại Góc Giải Đáp!`,
                timestamp: getShortTime()
              };
              roomStates[client.roomId].messages.push(chatAlert);
              broadcastToRoom(client.roomId, {
                type: "chat-message",
                data: chatAlert
              });
            } catch (err: any) {
              // Remove thinking reply
              question.replies = question.replies.filter(r => r.id !== thinkingReply.id);
              
              const errReply: StudyQuestionReply = {
                id: `qr-ai-fail-${Date.now()}`,
                sender: "Trợ lý Học thuật AI (Hòa Phú)",
                role: "AI",
                content: `⚠️ Không thể kết nối với dịch vụ AI để giải bài: ${err.message || String(err)}`,
                timestamp: getShortTime()
              };
              question.replies.push(errReply);
              
              broadcastToRoom(client.roomId, {
                type: "questions-updated",
                data: { questions: roomQ }
              });
            }
            break;
          }

          case "ping-help-question": {
            const client = clients.get(ws);
            if (!client) return;

            const { questionId } = data;
            const roomQ = roomStates[client.roomId].questions;
            const question = roomQ.find(q => q.id === questionId);
            if (!question) return;

            const systemAlert: ChatMessage = {
              id: `sys-alert-q-${Date.now()}`,
              roomId: client.roomId,
              sender: "Hệ thống",
              role: "Hệ thống",
              content: `📢 Học sinh ${client.name} đang cần Thầy Cô và các Bạn hỗ trợ giải gấp câu hỏi: "${question.title}" tại Góc Giải Đáp!`,
              timestamp: getShortTime()
            };

            roomStates[client.roomId].messages.push(systemAlert);
            broadcastToRoom(client.roomId, {
              type: "chat-message",
              data: systemAlert
            });
            break;
          }

          case "ping": {
            ws.send(JSON.stringify({ type: "pong" }));
            break;
          }
        }
      } catch (err) {
        console.error("[WS] Error parsing message:", err);
      }
    });

    ws.on("close", () => {
      const client = clients.get(ws);
      if (client) {
        console.log(`[WS] Connection closed for ${client.name}`);
        const userRoomId = client.roomId;
        clients.delete(ws);

        // Broadcast updated active users
        broadcastToRoom(userRoomId, {
          type: "users-updated",
          data: { activeUsers: getActiveUsersInRoom(userRoomId) }
        });

        // Broadcast system leave message
        const leaveMsg: ChatMessage = {
          id: `sys-${Date.now()}`,
          roomId: userRoomId,
          sender: "Hệ thống",
          role: "Hệ thống",
          content: `${client.name} đã rời phòng học.`,
          timestamp: getShortTime()
        };
        roomStates[userRoomId].messages.push(leaveMsg);
        broadcastToRoom(userRoomId, {
          type: "chat-message",
          data: leaveMsg
        });
      }
    });
  });
}

function getActiveUsersInRoom(roomId: string) {
  const list: { id: string; name: string; role: string }[] = [];
  clients.forEach(client => {
    if (client.roomId === roomId) {
      list.push({
        id: client.id,
        name: client.name,
        role: client.role
      });
    }
  });
  return list;
}

function broadcastToRoom(roomId: string, payload: any, skipWs?: WebSocket) {
  const json = JSON.stringify(payload);
  clients.forEach((client, ws) => {
    if (client.roomId === roomId && ws !== skipWs && ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  });
}

function getShortTime(): string {
  const now = new Date();
  return now.toTimeString().split(' ')[0].substring(0, 5);
}

async function setupVite() {
  const httpServer = http.createServer(app);

  // Setup WebSocket server
  const wss = new WebSocketServer({ noServer: true });

  // Handle WS upgrade
  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  setupWebSocket(wss);

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupVite();
