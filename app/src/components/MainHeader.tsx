"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const MainHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-xl font-bold text-gray-900">JobPool</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/browse" className="text-gray-600 hover:text-blue-600 transition-colors">
              Browse Tasks
            </Link>
            <Link href="/how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">
              How It Works
            </Link>
            <Link href="/categories" className="text-gray-600 hover:text-blue-600 transition-colors">
              Categories
            </Link>
            <Link href="/aboutus" className="text-gray-600 hover:text-blue-600 transition-colors">
              About Us
            </Link>
            <Link href="/support" className="text-gray-600 hover:text-blue-600 transition-colors">
              Support
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/signin">
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Sign Up
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/browse" 
                className="text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Browse Tasks
              </Link>
              <Link 
                href="/how-it-works" 
                className="text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                href="/categories" 
                className="text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Categories
              </Link>
              <Link 
                href="/aboutus" 
                className="text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <Link 
                href="/support" 
                className="text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Support
              </Link>
              
              {/* Mobile Auth Buttons */}
              <div className="flex flex-col space-y-3 px-4 pt-4 border-t border-gray-100">
                <Link href="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default MainHeader;
