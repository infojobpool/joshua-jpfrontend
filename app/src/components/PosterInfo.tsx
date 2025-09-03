// import { MessageSquare, Star } from "lucide-react";
// import { Button } from "./ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
// import { Avatar, AvatarFallback } from "./ui/avatar";

// interface User {
//     id: string;
//     name: string;
//     rating: number;
//     taskCount: number;
//     joinedDate: string;
//   }


// interface PosterInfoProps {
//     poster: User;
//     isTaskPoster: boolean;
//     handleMessageUser: () => void;
//   }
  
//   export function PosterInfo({ poster, isTaskPoster, handleMessageUser }: PosterInfoProps) {
//     return (
//       <Card>
//         <CardHeader>
//           <CardTitle>About the Poster</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="flex items-center gap-3">
//             <Avatar className="h-10 w-10">
//               <AvatarFallback>{poster.name.charAt(0)}</AvatarFallback>
//             </Avatar>
//             <div>
//               <p className="font-medium">{poster.name}</p>
//               <div className="flex items-center gap-1 text-sm text-muted-foreground">
//                 <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
//                 <span>{poster.rating}</span>
//               </div>
//             </div>
//           </div>
//           <div className="text-sm space-y-2">
//             <div className="flex justify-between">
//               <span className="text-muted-foreground">Member since</span>
//               <span>{poster.joinedDate}</span>
//             </div>
//             <div className="flex justify-between">
//               <span className="text-muted-foreground">Tasks posted</span>
//               <span>{poster.taskCount}</span>
//             </div>
//           </div>
//           {/* {!isTaskPoster && (
//             <Button variant="outline" className="w-full" onClick={handleMessageUser}>
//               <MessageSquare className="mr-2 h-4 w-4" />
//               Contact
//             </Button>
//           )} */}
//         </CardContent>
//       </Card>
//     );
//   }


// components/PosterInfo.tsx
// import { Button } from '@/components/ui/button';
// import Link from 'next/link';

// interface User {
//     id: string;
//     name: string;
//     rating: number;
//     taskCount: number;
//     joinedDate: string;
//   }


// interface PosterInfoProps {
//   poster: User;
//   isTaskPoster: boolean;
//   handleMessageUser: (receiverId?: string) => void;
// }

// export function PosterInfo({ poster, isTaskPoster, handleMessageUser }: PosterInfoProps) {
//   return (
//     <div className="border p-4 rounded-md">
//       <h2 className="text-lg font-semibold">Posted By</h2>
      
//       <Link href={`/profilepage/${poster.id}`} className="font-medium">
//         {poster.name}
//       </Link>
//       <p className="text-sm">Rating: {poster.rating} ★</p>
//       <p className="text-sm">Tasks Completed: {poster.taskCount}</p>
//       <p className="text-sm">Joined: {poster.joinedDate}</p>
//       {!isTaskPoster && (
//         <Button
//           variant="outline"
//           size="sm"
//           className="mt-4"
//           onClick={() => {
//             console.log('Messaging poster:', { posterId: poster.id });
//             handleMessageUser(poster.id);
//           }}
//         >
//           Message Poster
//         </Button>
//       )}
//     </div>
//   );
// }

// change on aug 3rd

import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  rating?: number | null;
  taskCount?: number | null;
  joinedDate?: string | null;
}

interface PosterInfoProps {
  poster: User;
  isTaskPoster: boolean;
  handleMessageUser: (receiverId?: string) => void;
}

export function PosterInfo({ poster, isTaskPoster, handleMessageUser }: PosterInfoProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm border-0 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-100/50 p-3">
        <h2 className="text-sm font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent flex items-center gap-1.5">
          <div className="p-1 rounded bg-indigo-100">
            <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          Posted By
        </h2>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {poster.name.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border border-white rounded-full"></div>
          </div>
          <div className="flex-1">
            <Link 
              href={`/profilepage/${poster.id}`} 
              className="text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors duration-200"
            >
              {poster.name}
            </Link>
            <div className="flex items-center gap-1 mt-0.5">
              <svg className="w-3 h-3 text-yellow-500 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-medium text-gray-600">
                {poster.rating !== null && poster.rating !== undefined ? `${poster.rating} ★` : 'New User'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="space-y-2">
          {/* Tasks Posted */}
          {poster.taskCount !== null && poster.taskCount !== undefined && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2 border border-blue-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded bg-blue-100">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700">Tasks Posted</span>
                </div>
                <span className="text-sm font-bold text-blue-700">{poster.taskCount}</span>
              </div>
            </div>
          )}

          {/* Joined Date */}
          {poster.joinedDate && poster.joinedDate.trim() !== '' && (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-2 border border-emerald-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded bg-emerald-100">
                    <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-700">Joined</span>
                </div>
                <span className="text-sm font-bold text-emerald-700">{poster.joinedDate}</span>
              </div>
            </div>
          )}
        </div>

        {/* Message Button */}
        {!isTaskPoster && (
          <Button
            onClick={() => {
              console.log('Messaging poster:', { posterId: poster.id });
              handleMessageUser(poster.id);
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm"
          >
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Message Poster
            </div>
          </Button>
        )}
      </div>
    </div>
  );
}