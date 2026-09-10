import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { toast } from '@/store/useToastStore';

export interface IdentifiedUser {
  isAnonymous: boolean;
  userId: number | null;
  role: string;
  email?: string;
  fullName?: string;
}

export interface SocketLog {
  id: string;
  time: string;
  type: 'connect' | 'disconnect' | 'error' | 'ping' | 'pong' | 'action';
  message: string;
  data?: any;
}

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  socketId: string | null;
  identifiedUser: IdentifiedUser | null;
  latency: number | null;
  logs: SocketLog[];

  // Actions (Async / Await & Error Handling)
  connectSocket: (customToken?: string) => Promise<boolean>;
  disconnectSocket: () => void;
  sendPing: () => Promise<number | null>;
  executeAdminAction: (task?: string) => Promise<{ success: boolean; message: string; data?: any }>;
  checkWhoAmI: () => Promise<IdentifiedUser | null>;
  clearLogs: () => void;
}

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NEXT_PUBLIC_API_BASE_URL
    ? process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api', '')
    : 'http://localhost:5000');

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  isConnecting: false,
  socketId: null,
  identifiedUser: null,
  latency: null,
  logs: [],

  clearLogs: () => set({ logs: [] }),

  connectSocket: async (customToken?: string) => {
    const { socket: existingSocket } = get();
    if (existingSocket && existingSocket.connected) {
      existingSocket.disconnect();
    }

    set({ isConnecting: true });

    // Trích xuất token từ tham số hoặc LocalStorage
    const token =
      customToken !== undefined
        ? customToken
        : typeof window !== 'undefined'
        ? localStorage.getItem('token') || ''
        : '';

    return new Promise<boolean>((resolve) => {
      try {
        const socketInstance = io(SOCKET_SERVER_URL, {
          auth: { token: token ? `Bearer ${token}` : undefined },
          transports: ['websocket', 'polling'],
          timeout: 7000,
          reconnection: false,
        });

        // Xử lý sự kiện kết nối thành công
        socketInstance.on('connect', () => {
          set({
            socket: socketInstance,
            isConnected: true,
            isConnecting: false,
            socketId: socketInstance.id,
          });

          const logItem: SocketLog = {
            id: Math.random().toString(36).substring(2, 9),
            time: new Date().toLocaleTimeString(),
            type: 'connect',
            message: `Đã kết nối thành công với Socket.IO Gateway (ID: ${socketInstance.id})`,
          };
          set((state) => ({ logs: [logItem, ...state.logs.slice(0, 40)] }));
        });

        // Xử lý sự kiện chào mừng & định danh từ Server JWT Middleware
        socketInstance.on('welcome', (payload: any) => {
          if (payload && payload.user) {
            set({ identifiedUser: payload.user });

            if (!payload.user.isAnonymous) {
              toast.success(
                `Định danh: #${payload.user.userId} • Vai trò: [${payload.user.role}]`,
                'Socket.IO JWT Verified'
              );
            } else {
              toast.info('Kết nối ở chế độ Khách vãng lai (Guest)', 'Socket.IO Gateway');
            }

            const logItem: SocketLog = {
              id: Math.random().toString(36).substring(2, 9),
              time: new Date().toLocaleTimeString(),
              type: 'connect',
              message: `Server định danh: ${
                payload.user.isAnonymous
                  ? 'Khách vãng lai (Guest)'
                  : `User #${payload.user.userId} [${payload.user.role}]`
              }`,
              data: payload.user,
            };
            set((state) => ({ logs: [logItem, ...state.logs.slice(0, 40)] }));
          }
          resolve(true);
        });

        // Xử lý lỗi kết nối & xác thực JWT thất bại (Error Handling)
        socketInstance.on('connect_error', (error: Error) => {
          set({
            isConnected: false,
            isConnecting: false,
            socketId: null,
            identifiedUser: null,
          });

          const errorMsg = error.message || 'Không thể kết nối đến Socket Gateway';
          toast.error(errorMsg, 'Lỗi Kết Nối Socket.IO');

          const logItem: SocketLog = {
            id: Math.random().toString(36).substring(2, 9),
            time: new Date().toLocaleTimeString(),
            type: 'error',
            message: `Lỗi kết nối / xác thực: ${errorMsg}`,
          };
          set((state) => ({ logs: [logItem, ...state.logs.slice(0, 40)] }));
          resolve(false);
        });

        // Xử lý mất kết nối
        socketInstance.on('disconnect', (reason: string) => {
          set({
            isConnected: false,
            isConnecting: false,
            socketId: null,
          });

          const logItem: SocketLog = {
            id: Math.random().toString(36).substring(2, 9),
            time: new Date().toLocaleTimeString(),
            type: 'disconnect',
            message: `Mất kết nối với Socket server. Lý do: ${reason}`,
          };
          set((state) => ({ logs: [logItem, ...state.logs.slice(0, 40)] }));
        });
      } catch (err: any) {
        set({ isConnecting: false });
        toast.error(err.message || 'Lỗi khởi tạo kết nối', 'Socket Error');
        resolve(false);
      }
    });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({
      socket: null,
      isConnected: false,
      isConnecting: false,
      socketId: null,
      identifiedUser: null,
      latency: null,
    });
    toast.info('Đã ngắt kết nối Socket.IO', 'Realtime Disconnected');
  },

  sendPing: async () => {
    const { socket, isConnected } = get();
    if (!socket || !isConnected) {
      toast.warning('Vui lòng kết nối Socket.IO trước khi gửi Ping!', 'Chưa kết nối');
      return null;
    }

    const startTime = Date.now();
    return new Promise<number | null>((resolve) => {
      socket.emit('ping', { clientTime: startTime }, (response: any) => {
        const rtt = Date.now() - startTime;
        set({ latency: rtt });

        toast.info(`Phản hồi Pong trong ${rtt} ms`, 'Ping-Pong Benchmark');

        const logItem: SocketLog = {
          id: Math.random().toString(36).substring(2, 9),
          time: new Date().toLocaleTimeString(),
          type: 'pong',
          message: `Pong nhận từ server! RTT: ${rtt} ms`,
          data: response,
        };
        set((state) => ({ logs: [logItem, ...state.logs.slice(0, 40)] }));
        resolve(rtt);
      });
    });
  },

  executeAdminAction: async (task = 'HEATING_SYSTEM_CYCLE') => {
    const { socket, isConnected } = get();
    if (!socket || !isConnected) {
      const err = { success: false, message: 'Chưa kết nối đến Socket Gateway!' };
      toast.warning(err.message, 'Cảnh báo');
      return err;
    }

    return new Promise((resolve) => {
      socket.emit('admin_action', { task, timestamp: Date.now() }, (res: any) => {
        if (res.success) {
          toast.success(res.message, 'Ủy quyền Admin/Staff Hợp Lệ');
        } else {
          toast.error(res.message, `Từ chối truy cập (${res.statusCode || 403})`);
        }

        const logItem: SocketLog = {
          id: Math.random().toString(36).substring(2, 9),
          time: new Date().toLocaleTimeString(),
          type: 'action',
          message: `[${res.statusCode || (res.success ? 200 : 403)}] ${res.message}`,
          data: res,
        };
        set((state) => ({ logs: [logItem, ...state.logs.slice(0, 40)] }));

        resolve(res);
      });
    });
  },

  checkWhoAmI: async () => {
    const { socket, isConnected } = get();
    if (!socket || !isConnected) {
      toast.warning('Chưa kết nối tới Socket.IO!', 'Cảnh báo');
      return null;
    }

    return new Promise((resolve) => {
      socket.emit('whoami', (res: any) => {
        if (res && res.user) {
          set({ identifiedUser: res.user });
          toast.info(
            `Định danh hiện tại: #${res.user.userId || 'N/A'} - Vai trò: ${res.user.role}`,
            'WhoAmI Response'
          );
          resolve(res.user);
        } else {
          resolve(null);
        }
      });
    });
  },
}));
