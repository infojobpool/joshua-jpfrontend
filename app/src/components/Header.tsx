"use client";

import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, MessageSquare } from "lucide-react";

interface User {
  name: string;
  avatar: string;
}

interface HeaderProps {
  user: User;
  onSignOut: () => void;
  /** Hide logo + account menu (inner flows that use Back to Dashboard / local nav). */
  minimal?: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, onSignOut, minimal }) => {
  if (minimal) {
    return null;
  }

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
        >
          <img 
            src="/images/jobpool-logo.png" 
            alt="JobPool Logo" 
            className="h-20 w-auto"
            style={{ mixBlendMode: 'multiply' }}
          />
        </Link>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-2 focus:outline-none"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium hidden md:inline-block">
                  {user.name || "Unknown User"}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="w-full">
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/messages" className="w-full flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  Messages
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/wallet" className="w-full">
                  Wallet
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/support" className="w-full">
                  Contact Support
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSignOut}>Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;