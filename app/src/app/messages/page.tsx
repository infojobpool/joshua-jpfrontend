// // "use client"

// // import { useState, useEffect, useRef } from "react"
// // import { useRouter } from "next/navigation"
// // import Link from "next/link"
// // import { Button } from "@/components/ui/button"
// // import { Input } from "@/components/ui/input"
// // import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// // import { Badge } from "@/components/ui/badge"
// // import { ScrollArea } from "@/components/ui/scroll-area"
// // import { Send, Paperclip, MoreVertical, Search, MessageSquare } from "lucide-react"

// // // Define proper TypeScript interfaces
// // interface User {
// //   id: string;
// //   name: string;
// //   avatar: string;
// // }

// // interface Message {
// //   id: string;
// //   text: string;
// //   timestamp: string;
// //   sender: string;
// // }

// // interface LastMessage extends Message {
// //   isRead: boolean;
// // }

// // interface Conversation {
// //   id: string;
// //   user: User;
// //   task: {
// //     id: string;
// //     title: string;
// //   };
// //   lastMessage: LastMessage;
// //   unread: number;
// // }

// // interface MessagesMap {
// //   [key: string]: Message[];
// // }

// // export default function MessagesPage() {
// //   const router = useRouter()
// //   const [user, setUser] = useState<User | null>(null)
// //   const [loading, setLoading] = useState(true)
// //   const [activeChat, setActiveChat] = useState<string | null>(null)
// //   const [message, setMessage] = useState("")
// //   const messagesEndRef = useRef<HTMLDivElement | null>(null)
// //   const [searchTerm, setSearchTerm] = useState("")

// //   // Mock data for conversations
// //   const [conversations, setConversations] = useState<Conversation[]>([
// //     {
// //       id: "conv1",
// //       user: {
// //         id: "user2",
// //         name: "Alex Johnson",
// //         avatar: "/images/placeholder.svg",
// //       },
// //       task: {
// //         id: "task1",
// //         title: "Help with moving furniture",
// //       },
// //       lastMessage: {
// //         id: "lastMsg1",
// //         text: "I'll be there at 10am tomorrow",
// //         timestamp: "10:30 AM",
// //         isRead: true,
// //         sender: "user2",
// //       },
// //       unread: 0,
// //     },
// //     {
// //       id: "conv2",
// //       user: {
// //         id: "user3",
// //         name: "Sarah Williams",
// //         avatar: "/images/placeholder.svg",
// //       },
// //       task: {
// //         id: "task2",
// //         title: "Fix leaky faucet",
// //       },
// //       lastMessage: {
// //         id: "lastMsg2",
// //         text: "Do you have the tools or should I bring mine?",
// //         timestamp: "Yesterday",
// //         isRead: false,
// //         sender: "user3",
// //       },
// //       unread: 2,
// //     },
// //     {
// //       id: "conv3",
// //       user: {
// //         id: "user4",
// //         name: "Mike Smith",
// //         avatar: "/images/placeholder.svg",
// //       },
// //       task: {
// //         id: "task3",
// //         title: "Website debugging",
// //       },
// //       lastMessage: {
// //         id: "lastMsg3",
// //         text: "I've fixed the issue with the login page",
// //         timestamp: "Yesterday",
// //         isRead: true,
// //         sender: "current",
// //       },
// //       unread: 0,
// //     },
// //   ])

// //   // Mock data for messages in a conversation
// //   const [mockMessages, setMockMessages] = useState<MessagesMap>({
// //     conv1: [
// //       {
// //         id: "msg1",
// //         text: "Hi, I'm interested in helping you move your furniture",
// //         timestamp: "10:15 AM",
// //         sender: "current",
// //       },
// //       {
// //         id: "msg2",
// //         text: "Great! When are you available?",
// //         timestamp: "10:20 AM",
// //         sender: "user2",
// //       },
// //       {
// //         id: "msg3",
// //         text: "I can do it tomorrow morning",
// //         timestamp: "10:25 AM",
// //         sender: "current",
// //       },
// //       {
// //         id: "msg4",
// //         text: "I'll be there at 10am tomorrow",
// //         timestamp: "10:30 AM",
// //         sender: "user2",
// //       },
// //     ],
// //     conv2: [
// //       {
// //         id: "msg1",
// //         text: "Hello, I can help fix your leaky faucet",
// //         timestamp: "Yesterday",
// //         sender: "current",
// //       },
// //       {
// //         id: "msg2",
// //         text: "That's great! When can you come?",
// //         timestamp: "Yesterday",
// //         sender: "user3",
// //       },
// //       {
// //         id: "msg3",
// //         text: "I can come tomorrow afternoon",
// //         timestamp: "Yesterday",
// //         sender: "current",
// //       },
// //       {
// //         id: "msg4",
// //         text: "Do you have the tools or should I bring mine?",
// //         timestamp: "Yesterday",
// //         sender: "user3",
// //       },
// //     ],
// //     conv3: [
// //       {
// //         id: "msg1",
// //         text: "I've looked at your website and found a few issues",
// //         timestamp: "Yesterday",
// //         sender: "user4",
// //       },
// //       {
// //         id: "msg2",
// //         text: "Can you fix them?",
// //         timestamp: "Yesterday",
// //         sender: "current",
// //       },
// //       {
// //         id: "msg3",
// //         text: "Yes, I'll start working on it right away",
// //         timestamp: "Yesterday",
// //         sender: "user4",
// //       },
// //       {
// //         id: "msg4",
// //         text: "I've fixed the issue with the login page",
// //         timestamp: "Yesterday",
// //         sender: "current",
// //       },
// //     ],
// //   })

// //   useEffect(() => {
// //     // Check if user is logged in
// //     const storedUser = localStorage.getItem("user")
// //     if (storedUser) {
// //       setUser(JSON.parse(storedUser))
// //     } else {
// //       // Redirect to sign in if not logged in
// //       router.push("/signin")
// //     }
// //     setLoading(false)

// //     // Set first conversation as active by default
// //     if (conversations.length > 0 && !activeChat) {
// //       setActiveChat(conversations[0].id)
// //     }
// //   }, [router, activeChat, conversations])

// //   useEffect(() => {
// //     // Scroll to bottom of messages when active chat changes or new message is added
// //     if (messagesEndRef.current) {
// //       messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
// //     }
// //   }, [activeChat, mockMessages])

// //   const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
// //     e.preventDefault()
// //     if (!message.trim() || !activeChat) return

// //     // In a real app, you would send this message to your backend
// //     console.log("Sending message:", message)

// //     // For demo purposes, we'll just add it to our mock data
// //     const newMessage: Message = {
// //       id: `msg${Math.random().toString(36).substring(2, 9)}`,
// //       text: message,
// //       timestamp: "Just now",
// //       sender: "current",
// //     }

// //     setMockMessages(prevMessages => ({
// //       ...prevMessages,
// //       [activeChat]: [...(prevMessages[activeChat] || []), newMessage]
// //     }))

// //     // Update the last message in the conversation list
// //     setConversations(prevConversations => 
// //       prevConversations.map((conv) => {
// //         if (conv.id === activeChat) {
// //           return {
// //             ...conv,
// //             lastMessage: {
// //               ...newMessage,
// //               isRead: true,
// //             },
// //           }
// //         }
// //         return conv
// //       })
// //     )

// //     // Clear the input field
// //     setMessage("")
// //   }

// //   const filteredConversations = conversations.filter((conv) => {
// //     return (
// //       conv.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       conv.task.title.toLowerCase().includes(searchTerm.toLowerCase())
// //     )
// //   })

// //   const getCurrentConversation = (): Conversation | undefined => {
// //     return conversations.find((conv) => conv.id === activeChat)
// //   }

// //   const getCurrentMessages = (): Message[] => {
// //     return activeChat ? mockMessages[activeChat] || [] : []
// //   }

// //   if (loading) {
// //     return <div className="flex h-screen items-center justify-center">Loading...</div>
// //   }

// //   if (!user) {
// //     return null // Will redirect in useEffect
// //   }

// //   return (
// //     <div className="flex min-h-screen flex-col">
// //       <header className="border-b">
// //         <div className="container flex h-16 items-center justify-between px-4 md:px-6">
// //           <Link href="/" className="flex items-center gap-2 font-bold text-xl">
// //             <span className="text-primary">JobPool</span>
// //           </Link>
// //           <nav className="hidden md:flex gap-6">
// //             <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
// //               Dashboard
// //             </Link>
// //             <Link href="/browse" className="text-sm font-medium hover:underline underline-offset-4">
// //               Browse Tasks
// //             </Link>
// //             <Link href="/post-task" className="text-sm font-medium hover:underline underline-offset-4">
// //               Post a Task
// //             </Link>
// //           </nav>
// //         </div>
// //       </header>
// //       <main className="flex-1 container py-6 md:py-10 px-4 md:px-6">
// //         <div className="mb-6">
// //           <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
// //           <p className="text-muted-foreground">Communicate with taskers and task posters</p>
// //         </div>

// //         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
// //           {/* Conversation List */}
// //           <Card className="md:col-span-1 flex flex-col h-full">
// //             <CardHeader className="px-4 py-3">
// //               <div className="relative">
// //                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
// //                 <Input
// //                   type="search"
// //                   placeholder="Search conversations..."
// //                   className="pl-8"
// //                   value={searchTerm}
// //                   onChange={(e) => setSearchTerm(e.target.value)}
// //                 />
// //               </div>
// //             </CardHeader>
// //             <ScrollArea className="flex-1">
// //               <CardContent className="p-0">
// //                 {filteredConversations.length === 0 ? (
// //                   <div className="p-4 text-center text-muted-foreground">No conversations found</div>
// //                 ) : (
// //                   <div className="divide-y">
// //                     {filteredConversations.map((conv) => (
// //                       <div
// //                         key={conv.id}
// //                         className={`p-4 cursor-pointer hover:bg-muted transition-colors ${
// //                           activeChat === conv.id ? "bg-muted" : ""
// //                         }`}
// //                         onClick={() => setActiveChat(conv.id)}
// //                       >
// //                         <div className="flex items-start gap-3">
// //                           <Avatar className="h-10 w-10">
// //                             <AvatarImage src={conv.user.avatar || "/images/placeholder.svg"} alt={conv.user.name} />
// //                             <AvatarFallback>{conv.user.name.charAt(0)}</AvatarFallback>
// //                           </Avatar>
// //                           <div className="flex-1 min-w-0">
// //                             <div className="flex justify-between items-start">
// //                               <div className="font-medium truncate">{conv.user.name}</div>
// //                               <div className="text-xs text-muted-foreground whitespace-nowrap">
// //                                 {conv.lastMessage.timestamp}
// //                               </div>
// //                             </div>
// //                             <div className="text-sm text-muted-foreground truncate">{conv.task.title}</div>
// //                             <div className="flex justify-between items-center mt-1">
// //                               <div className="text-sm truncate">
// //                                 {conv.lastMessage.sender === "current" ? "You: " : ""}
// //                                 {conv.lastMessage.text}
// //                               </div>
// //                               {conv.unread > 0 && (
// //                                 <Badge variant="default" className="ml-2">
// //                                   {conv.unread}
// //                                 </Badge>
// //                               )}
// //                             </div>
// //                           </div>
// //                         </div>
// //                       </div>
// //                     ))}
// //                   </div>
// //                 )}
// //               </CardContent>
// //             </ScrollArea>
// //           </Card>

// //           {/* Chat Window */}
// //           <Card className="md:col-span-2 flex flex-col h-full">
// //             {activeChat ? (
// //               <>
// //                 <CardHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
// //                   <div className="flex items-center gap-3">
// //                     <Avatar className="h-10 w-10">
// //                       <AvatarImage
// //                         src={getCurrentConversation()?.user.avatar || "/images/placeholder.svg"}
// //                         alt={getCurrentConversation()?.user.name || "User"}
// //                       />
// //                       <AvatarFallback>
// //                         {getCurrentConversation()?.user.name.charAt(0) || "U"}
// //                       </AvatarFallback>
// //                     </Avatar>
// //                     <div>
// //                       <CardTitle className="text-lg">
// //                         {getCurrentConversation()?.user.name}
// //                       </CardTitle>
// //                       <div className="text-sm text-muted-foreground">
// //                         {getCurrentConversation()?.task.title}
// //                       </div>
// //                     </div>
// //                   </div>
// //                   <Button variant="ghost" size="icon">
// //                     <MoreVertical className="h-5 w-5" />
// //                   </Button>
// //                 </CardHeader>
// //                 <ScrollArea className="flex-1 p-4">
// //                   <div className="space-y-4">
// //                     {getCurrentMessages().map((msg: Message) => (
// //                       <div
// //                         key={msg.id}
// //                         className={`flex ${msg.sender === "current" ? "justify-end" : "justify-start"}`}
// //                       >
// //                         <div
// //                           className={`max-w-[80%] rounded-lg px-4 py-2 ${
// //                             msg.sender === "current"
// //                               ? "bg-primary text-primary-foreground"
// //                               : "bg-muted text-muted-foreground"
// //                           }`}
// //                         >
// //                           <div className="text-sm">{msg.text}</div>
// //                           <div className="text-xs mt-1 opacity-70">{msg.timestamp}</div>
// //                         </div>
// //                       </div>
// //                     ))}
// //                     <div ref={messagesEndRef} />
// //                   </div>
// //                 </ScrollArea>
// //                 <div className="p-4 border-t">
// //                   <form onSubmit={handleSendMessage} className="flex gap-2">
// //                     <Button type="button" variant="ghost" size="icon">
// //                       <Paperclip className="h-5 w-5" />
// //                     </Button>
// //                     <Input
// //                       placeholder="Type a message..."
// //                       value={message}
// //                       onChange={(e) => setMessage(e.target.value)}
// //                       className="flex-1"
// //                     />
// //                     <Button type="submit" size="icon">
// //                       <Send className="h-5 w-5" />
// //                     </Button>
// //                   </form>
// //                 </div>
// //               </>
// //             ) : (
// //               <div className="flex flex-col items-center justify-center h-full p-6 text-center">
// //                 <div className="rounded-full bg-muted p-6 mb-4">
// //                   <MessageSquare className="h-10 w-10 text-muted-foreground" />
// //                 </div>
// //                 <h3 className="text-xl font-medium mb-2">No conversation selected</h3>
// //                 <p className="text-muted-foreground">
// //                   Select a conversation from the list or start a new one from a task page.
// //                 </p>
// //               </div>
// //             )}
// //           </Card>
// //         </div>
// //       </main>
// //     </div>
// //   )
// // }


// // 'use client';
// // import { useEffect, useState } from 'react';
// // import { useRouter } from 'next/navigation';
// // import axiosInstance from '@/lib/axiosInstance';
// // import useStore from '@/lib/Zustand';
// // import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// // import { Button } from '@/components/ui/button';
// // import { Toaster } from '@/components/ui/sonner';
// // import { toast } from 'sonner';
// // import Link from 'next/link';

// // interface Message {
// //   messagesid: string;
// //   chatid: string;
// //   userrefid: string;
// //   username: string;
// //   description: string;
// //   readstatus: boolean;
// //   tstamp: string;
// // }

// // interface ChatSummary {
// //   chatid: string;
// //   otherUserId: string;
// //   otherUser: string;
// //   lastMessage: string;
// //   lastMessageTime: string;
// // }

// // export default function MessagesPage() {
// //   const router = useRouter();
// //   const { userId } = useStore();
// //   const [chats, setChats] = useState<ChatSummary[]>([]);
// //   const [loading, setLoading] = useState<boolean>(true);

// //   useEffect(() => {
// //     if (!userId) {
// //       router.push('/signin');
// //       return;
// //     }

// //     const fetchChats = async () => {
// //       try {
// //         // Fetch all chats for the user
// //         const response = await axiosInstance.get(`/get-user-chats/${userId}`);
// //         if (response.data.status_code === 200) {
// //           const chatData = response.data.data || [];
// //           const chatSummaries: ChatSummary[] = [];

// //           for (const chat of chatData) {
// //             const otherUserId = chat.userrefid.find((id: string) => id !== userId);
// //             if (!otherUserId) continue;

// //             // Fetch other user's details
// //             const userResponse = await axiosInstance.get(`/user/${otherUserId}`);
// //             const otherUserName = userResponse.data.status_code === 200
// //               ? userResponse.data.data.username || 'Unknown User'
// //               : 'Unknown User';

// //             // Fetch latest message for the chat
// //             const messagesResponse = await axiosInstance.get(`/get-messages/${chat.chatid}`);
// //             const messages: Message[] = messagesResponse.data.status_code === 200
// //               ? messagesResponse.data.data || []
// //               : [];
// //             const lastMessage = messages[messages.length - 1];

// //             chatSummaries.push({
// //               chatid: chat.chatid,
// //               otherUserId,
// //               otherUser: otherUserName,
// //               lastMessage: lastMessage ? lastMessage.description : 'No messages yet',
// //               lastMessageTime: lastMessage ? lastMessage.tstamp : '',
// //             });
// //           }

// //           // Sort chats by last message time (newest first)
// //           chatSummaries.sort((a, b) => {
// //             if (!a.lastMessageTime || !b.lastMessageTime) return 0;
// //             return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
// //           });

// //           setChats(chatSummaries);
// //         } else {
// //           throw new Error(response.data.message || 'Failed to fetch chats');
// //         }
// //       } catch (error: any) {
// //         console.error('Error fetching chats:', error);
// //         toast.error(error.response?.data?.message || 'Failed to load chats');
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchChats();
// //   }, [userId, router]);

// //   const handleSignOut = () => {
// //     localStorage.removeItem('user');
// //     localStorage.removeItem('token');
// //     localStorage.removeItem('bids');
// //     router.push('/');
// //   };

// //   if (loading) {
// //     return <div className="flex h-screen items-center justify-center">Loading...</div>;
// //   }

// //   if (!userId) {
// //     return <div className="flex h-screen items-center justify-center">Please log in to view messages</div>;
// //   }

// //   return (
// //     <div className="flex min-h-screen flex-col">
// //       <Toaster position="top-right" />
// //       <header className="border-b">
// //         <div className="container flex h-16 items-center justify-between px-4 md:px-6">
// //           <Link href="/" className="flex items-center gap-2 font-bold text-xl">
// //             <span className="text-primary">JobPool</span>
// //           </Link>
// //           <nav className="hidden md:flex gap-6">
// //             <Link href="/browse" className="text-sm font-medium hover:underline underline-offset-4">
// //               Browse Tasks
// //             </Link>
// //             <Link href="/post-task" className="text-sm font-medium hover:underline underline-offset-4">
// //               Post a Task
// //             </Link>
// //             <Link href="/messages" className="text-sm font-medium hover:underline underline-offset-4">
// //               Messages
// //             </Link>
// //           </nav>
// //           <div className="flex items-center gap-4">
// //             <Button variant="outline" size="sm" onClick={handleSignOut}>
// //               Sign Out
// //             </Button>
// //           </div>
// //         </div>
// //       </header>
// //       <main className="flex-1 container py-6 md:py-10 px-4 md:px-6">
// //         <h1 className="text-2xl font-bold mb-6">Your Messages</h1>
// //         {chats.length === 0 ? (
// //           <p>No messages yet.</p>
// //         ) : (
// //           <ul className="space-y-4">
// //             {chats.map((chat) => (
// //               <li key={chat.chatid} className="border p-4 rounded-md hover:bg-gray-50">
// //                 <Link href={`/messages/${chat.chatid}`}>
// //                   <div className="flex items-center gap-4">
// //                     <Avatar className="h-10 w-10">
// //                       <AvatarFallback>{chat.otherUser.charAt(0)}</AvatarFallback>
// //                     </Avatar>
// //                     <div>
// //                       <p className="font-medium">{chat.otherUser}</p>
// //                       <p className="text-sm text-muted-foreground">{chat.lastMessage}</p>
// //                       {chat.lastMessageTime && (
// //                         <p className="text-xs text-muted-foreground">
// //                           {new Date(chat.lastMessageTime).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
// //                         </p>
// //                       )}
// //                     </div>
// //                   </div>
// //                 </Link>
// //               </li>
// //             ))}
// //           </ul>
// //         )}
// //       </main>
// //     </div>
// //   );
// // }





// 'use client';
// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import axiosInstance from '@/lib/axiosInstance';
// import useStore from '@/lib/Zustand';
// import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// import { Button } from '@/components/ui/button';
// import { Toaster } from '@/components/ui/sonner';
// import { toast } from 'sonner';
// import Link from 'next/link';

// interface Message {
//   messagesid: string;
//   chatid: string;
//   userrefid: string;
//   username: string;
//   description: string;
//   readstatus: boolean;
//   tstamp: string;
// }

// interface ChatSummary {
//   chatid: string;
//   otherUserId: string;
//   otherUser: string;
//   lastMessage: string;
//   lastMessageTime: string;
// }

// export default function MessagesPage() {
//   const router = useRouter();
//   const { userId } = useStore();
//   const [chats, setChats] = useState<ChatSummary[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);

//   useEffect(() => {
//     if (!userId) {
//       router.push('/signin');
//       return;
//     }

//     const fetchChats = async () => {
//       try {
//         // Retrieve chat IDs from localStorage (populated elsewhere, e.g., TaskDetailPage or ChatPage)
//         const storedChats = localStorage.getItem('userChats');
//         const chatIds: string[] = storedChats ? JSON.parse(storedChats) : [];
//         const chatSummaries: ChatSummary[] = [];

//         if (chatIds.length === 0) {
//           setChats([]);
//           return;
//         }

//         // Fetch messages for each chat ID
//         for (const chatId of chatIds) {
//           const messagesResponse = await axiosInstance.get(`/get-messages/${chatId}`);
//           if (messagesResponse.data.status_code === 200) {
//             const messages: Message[] = messagesResponse.data.data || [];
//             if (messages.length === 0) continue;

//             // Find the other user
//             const otherUserMessage = messages.find((msg) => msg.userrefid !== userId);
//             if (!otherUserMessage) continue;

//             const otherUserId = otherUserMessage.userrefid;
//             const otherUserName = otherUserMessage.username || 'Unknown User';

//             // Get the last message
//             const lastMessage = messages[messages.length - 1];

//             chatSummaries.push({
//               chatid: chatId,
//               otherUserId,
//               otherUser: otherUserName,
//               lastMessage: lastMessage.description,
//               lastMessageTime: lastMessage.tstamp,
//             });
//           }
//         }

//         // Sort chats by last message time (newest first)
//         chatSummaries.sort((a, b) => {
//           if (!a.lastMessageTime || !b.lastMessageTime) return 0;
//           return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
//         });

//         setChats(chatSummaries);
//       } catch (error: any) {
//         console.error('Error fetching chats:', error);
//         toast.error(error.response?.data?.message || 'Failed to load chats');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchChats();
//   }, [userId, router]);

//   const handleSignOut = () => {
//     localStorage.removeItem('user');
//     localStorage.removeItem('token');
//     localStorage.removeItem('bids');
//     localStorage.removeItem('userChats');
//     router.push('/');
//   };

//   if (loading) {
//     return <div className="flex h-screen items-center justify-center">Loading...</div>;
//   }

//   if (!userId) {
//     return <div className="flex h-screen items-center justify-center">Please log in to view messages</div>;
//   }

//   return (
//     <div className="flex min-h-screen flex-col">
//       <Toaster position="top-right" />
//       <header className="border-b">
//         <div className="container flex h-16 items-center justify-between px-4 md:px-6">
//           <Link href="/" className="flex items-center gap-2 font-bold text-xl">
//             <span className="text-primary">JobPool</span>
//           </Link>
//           <nav className="hidden md:flex gap-6">
//             <Link href="/browse" className="text-sm font-medium hover:underline underline-offset-4">
//               Browse Tasks
//             </Link>
//             <Link href="/post-task" className="text-sm font-medium hover:underline underline-offset-4">
//               Post a Task
//             </Link>
//             {/* <Link href="/messages" className="text-sm font-medium hover:underline underline-offset-4">
//               Messages
//             </Link> */}
//           </nav>
//           <div className="flex items-center gap-4">
//             <Button variant="outline" size="sm" onClick={handleSignOut}>
//               Sign Out
//             </Button>
//           </div>
//         </div>
//       </header>
//       <main className="flex-1 container py-6 md:py-10 px-4 md:px-6">
//         <h1 className="text-2xl font-bold mb-6">Your Messages</h1>
//         {chats.length === 0 ? (
//           <p>No messages yet.</p>
//         ) : (
//           <ul className="space-y-4">
//             {chats.map((chat) => (
//               <li key={chat.chatid} className="border p-4 rounded-md hover:bg-gray-50">
//                 <Link href={`/messages/${chat.chatid}`}>
//                   <div className="flex items-center gap-4">
//                     <Avatar className="h-10 w-10">
//                       <AvatarFallback>{chat.otherUser.charAt(0)}</AvatarFallback>
//                     </Avatar>
//                     <div>
//                       <p className="font-medium">{chat.otherUser}</p>
//                       <p className="text-sm text-muted-foreground">{chat.lastMessage}</p>
//                       {chat.lastMessageTime && (
//                         <p className="text-xs text-muted-foreground">
//                           {new Date(chat.lastMessageTime).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 </Link>
//               </li>
//             ))}
//           </ul>
//         )}
//       </main>
//     </div>
//   );
// }