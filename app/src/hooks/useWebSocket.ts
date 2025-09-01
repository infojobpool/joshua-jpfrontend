// // import { useEffect, useRef, useState } from "react";
// // import useStore from '@/lib/Zustand';

// // interface WebSocketMessage {
// //   messagesid: string;
// //   chat_id: string;
// //   userrefid: string;
// //   username: string;
// //   description: string;
// //   readstatus: boolean;
// //   tstamp: string;
// // }

// // interface WebSocketError {
// //   error: string;
// // }

// // type WebSocketResponse = { message: WebSocketMessage } | { error: string };

// // const useWebSocket = (chatId: string, onMessage: (message: WebSocketMessage) => void) => {
// //   const { userId } = useStore();
// //   const wsRef = useRef<WebSocket | null>(null);
// //   const [reconnectAttempts, setReconnectAttempts] = useState(0);
// //   const maxReconnectAttempts = 5;
// //   const reconnectInterval = useRef<NodeJS.Timeout | null>(null);

// //   const connectWebSocket = () => {
// //     if (!chatId || !userId) {
// //       console.warn('useWebSocket - Missing chatId or userId');
// //       return;
// //     }

// //     const wsUrl = `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/ws/chat/${chatId}?user_id=${userId}`;
// //     console.log('useWebSocket - Connecting to:', wsUrl);
// //     wsRef.current = new WebSocket(wsUrl);

// //     wsRef.current.onopen = () => {
// //       console.log('useWebSocket - WebSocket connected for chat:', chatId);
// //       setReconnectAttempts(0); // Reset reconnect attempts on successful connection
// //     };

// //     wsRef.current.onmessage = (event) => {
// //       console.log('useWebSocket - Received message at:', new Date().toISOString(), event.data);
// //       try {
// //         const data: WebSocketResponse = JSON.parse(event.data);
// //         if ('error' in data) {
// //           console.error('useWebSocket - Error in message:', data.error);
// //           return;
// //         }
// //         onMessage(data.message);
// //       } catch (error) {
// //         console.error('useWebSocket - Error parsing message:', error);
// //       }
// //     };

// //     wsRef.current.onclose = (event) => {
// //       console.log('useWebSocket - WebSocket closed for chat:', chatId, 'Code:', event.code, 'Reason:', event.reason);
// //       if (reconnectAttempts < maxReconnectAttempts) {
// //         const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000); // Exponential backoff, max 30s
// //         console.log(`useWebSocket - Attempting to reconnect in ${delay}ms...`);
// //         reconnectInterval.current = setTimeout(() => {
// //           setReconnectAttempts((prev) => prev + 1);
// //           connectWebSocket();
// //         }, delay);
// //       } else {
// //         console.error('useWebSocket - Max reconnect attempts reached');
// //       }
// //     };

// //     wsRef.current.onerror = (error) => {
// //       console.error('useWebSocket - WebSocket error:', error);
// //     };
// //   };

// //   useEffect(() => {
// //     connectWebSocket();

// //     return () => {
// //       if (reconnectInterval.current) {
// //         clearTimeout(reconnectInterval.current);
// //       }
// //       if (wsRef.current) {
// //         wsRef.current.close();
// //       }
// //     };
// //   }, [chatId, userId]);

// //   const sendMessage = (message: WebSocketMessage) => {
// //     if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
// //       console.log('useWebSocket - Sending message:', message);
// //       wsRef.current.send(JSON.stringify({ message }));
// //     } else {
// //       console.error('useWebSocket - WebSocket not open, queuing message');
// //       // Optionally queue the message and retry after reconnection
// //       setTimeout(() => {
// //         if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
// //           wsRef.current.send(JSON.stringify({ message }));
// //         }
// //       }, 1000);
// //     }
// //   };

// //   return { sendMessage };
// // };

// // export default useWebSocket;


// import { useEffect, useRef, useState } from 'react';
// import useStore from '@/lib/Zustand';
// import { toast } from 'sonner';

// interface WebSocketMessage {
//   messagesid: number;
//   chat_id: string;
//   userrefid: string;
//   username: string;
//   description: string;
//   readstatus: boolean;
//   tstamp: string;
// }

// interface WebSocketError {
//   error: string;
// }

// type WebSocketResponse = { message: WebSocketMessage } | { error: string };

// const useWebSocket = (chatId: string, onMessage: (message: WebSocketMessage) => void) => {
//   const { userId } = useStore();
//   const wsRef = useRef<WebSocket | null>(null);
//   const [reconnectAttempts, setReconnectAttempts] = useState(0);
//   const maxReconnectAttempts = 5;
//   const reconnectInterval = useRef<NodeJS.Timeout | null>(null);
//   const messageQueue = useRef<WebSocketMessage[]>([]);

//   const connectWebSocket = () => {
//     if (!chatId || !userId) {
//       console.warn('useWebSocket - Missing chatId or userId', { chatId, userId });
//       return;
//     }

//     const wsBaseUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
//     if (!wsBaseUrl) {
//       console.error('useWebSocket - NEXT_PUBLIC_WEBSOCKET_URL is not defined');
//       toast.error('Chat connection failed. Please try again later.');
//       return;
//     }

//     const wsUrl = `${wsBaseUrl}/ws/chat/${chatId}?user_id=${userId}`;
//     console.log('useWebSocket - Connecting to:', wsUrl);
//     wsRef.current = new WebSocket(wsUrl);

//     wsRef.current.onopen = () => {
//       console.log('useWebSocket - WebSocket connected for chat:', chatId);
//       setReconnectAttempts(0);
//       while (messageQueue.current.length > 0) {
//         const message = messageQueue.current.shift();
//         if (message) {
//           wsRef.current?.send(JSON.stringify({ message }));
//           console.log('useWebSocket - Sent queued message:', message);
//         }
//       }
//     };

//     wsRef.current.onmessage = (event) => {
//       console.log('useWebSocket - Received message at:', new Date().toISOString(), event.data);
//       try {
//         const data: WebSocketResponse = JSON.parse(event.data);
//         if ('error' in data) {
//           console.error('useWebSocket - Error in message:', data.error);
//           toast.error(`Chat error: ${data.error}`);
//           return;
//         }
//         if (
//           data.message &&
//           data.message.messagesid &&
//           data.message.chat_id === chatId &&
//           data.message.userrefid &&
//           data.message.description
//         ) {
//           onMessage(data.message);
//         } else {
//           console.warn('useWebSocket - Invalid message format:', data.message);
//         }
//       } catch (error) {
//         console.error('useWebSocket - Error parsing message:', error);
//       }
//     };

//     wsRef.current.onclose = (event) => {
//       console.log('useWebSocket - WebSocket closed for chat:', chatId, 'Code:', event.code, 'Reason:', event.reason);
//       if (reconnectAttempts < maxReconnectAttempts) {
//         const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
//         console.log(`useWebSocket - Attempting to reconnect in ${delay}ms...`);
//         reconnectInterval.current = setTimeout(() => {
//           setReconnectAttempts((prev) => prev + 1);
//           connectWebSocket();
//         }, delay);
//       } else {
//         console.error('useWebSocket - Max reconnect attempts reached');
//         toast.error('Lost connection to chat. Please refresh the page.');
//       }
//     };

//     wsRef.current.onerror = (error) => {
//       console.error('useWebSocket - WebSocket error:', error);
//     };
//   };

//   useEffect(() => {
//     connectWebSocket();
//     return () => {
//       if (reconnectInterval.current) {
//         clearTimeout(reconnectInterval.current);
//       }
//       if (wsRef.current) {
//         wsRef.current.close();
//       }
//     };
//   }, [chatId, userId]);

//   const sendMessage = (message: WebSocketMessage) => {
//     if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//       console.log('useWebSocket - Sending message:', message);
//       wsRef.current.send(JSON.stringify({ message }));
//     } else {
//       console.warn('useWebSocket - WebSocket not open, queuing message:', message);
//       messageQueue.current.push(message);
//     }
//   };

//   return { sendMessage };
// };

// export default useWebSocket;



// hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';
import useStore from '@/lib/Zustand';
import { toast } from 'sonner';
import { Message } from '../app/messages/[chat_id]/page'; // Adjust path as needed

interface WebSocketError {
  error: string;
}

type WebSocketResponse = { message: Message } | { error: string };

const useWebSocket = (chatId: string, onMessage: (data: { message: Message }) => void): { sendMessage: (message: Message) => void } => {
  const { userId } = useStore();
  const wsRef = useRef<WebSocket | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = useRef<NodeJS.Timeout | null>(null);
  const messageQueue = useRef<Message[]>([]);

  const connectWebSocket = (): void => {
    if (!chatId || !userId) {
      console.warn('useWebSocket - Missing chatId or userId', { chatId, userId });
      return;
    }

    const wsBaseUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    if (!wsBaseUrl) {
      console.error('useWebSocket - NEXT_PUBLIC_WEBSOCKET_URL is not defined');
      toast.error('Chat connection failed. Please try again later.');
      return;
    }

    const wsUrl = `${wsBaseUrl}/ws/chat/${chatId}?user_id=${userId}`;
    console.log('useWebSocket - Connecting to:', wsUrl);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = (): void => {
      console.log('useWebSocket - WebSocket connected for chat:', chatId);
      setReconnectAttempts(0);
      while (messageQueue.current.length > 0) {
        const message = messageQueue.current.shift();
        if (message) {
          wsRef.current?.send(JSON.stringify({ message }));
          console.log('useWebSocket - Sent queued message:', message);
        }
      }
    };

    wsRef.current.onmessage = (event: MessageEvent): void => {
      console.log('useWebSocket - Received message at:', new Date().toISOString(), event.data);
      try {
        const data: WebSocketResponse = JSON.parse(event.data);
        if ('error' in data) {
          console.error('useWebSocket - Error in message:', data.error);
          toast.error(`Chat error: ${data.error}`);
          return;
        }
        if (
          data.message &&
          data.message.messagesid &&
          data.message.chat_id === chatId &&
          data.message.userrefid &&
          data.message.description
        ) {
          onMessage({
            message: {
              ...data.message,
              messagesid: Number(data.message.messagesid), // Ensure number
              username: data.message.username || 'Unknown', // Ensure default
            },
          });
        } else {
          console.warn('useWebSocket - Invalid message format:', data.message);
        }
      } catch (error: unknown) {
        console.error('useWebSocket - Error parsing message:', error);
      }
    };

    wsRef.current.onclose = (event: CloseEvent): void => {
      console.log('useWebSocket - WebSocket closed for chat:', chatId, 'Code:', event.code, 'Reason:', event.reason);
      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
        console.log(`useWebSocket - Attempting to reconnect in ${delay}ms...`);
        reconnectInterval.current = setTimeout(() => {
          setReconnectAttempts((prev) => prev + 1);
          connectWebSocket();
        }, delay);
      } else {
        console.error('useWebSocket - Max reconnect attempts reached');
        toast.error('Lost connection to chat. Please refresh the page.');
      }
    };

    wsRef.current.onerror = (error: Event): void => {
      console.error('useWebSocket - WebSocket error:', error);
    };
  };

  useEffect((): (() => void) => {
    connectWebSocket();
    return (): void => {
      if (reconnectInterval.current) {
        clearTimeout(reconnectInterval.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [chatId, userId]);

  const sendMessage = (message: Message): void => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('useWebSocket - Sending message:', message);
      wsRef.current.send(JSON.stringify({ message }));
    } else {
      console.warn('useWebSocket - WebSocket not open, queuing message:', message);
      messageQueue.current.push(message);
    }
  };

  return { sendMessage };
};

export default useWebSocket;