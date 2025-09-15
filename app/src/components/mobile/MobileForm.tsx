"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "./MobileWrapper";

interface MobileFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

export function MobileForm({ children, onSubmit, className = "" }: MobileFormProps) {
  const { isMobile } = useIsMobile();

  return (
    <form 
      onSubmit={onSubmit}
      className={`${isMobile ? 'space-y-4' : 'space-y-6'} ${className}`}
    >
      {children}
    </form>
  );
}

interface MobileInputProps {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
}

export function MobileInput({ 
  label, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  required = false,
  className = ""
}: MobileInputProps) {
  const { isMobile } = useIsMobile();

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`${isMobile ? 'mobile-input h-12 text-base text-gray-900 placeholder-gray-500' : ''}`}
      />
    </div>
  );
}

interface MobileTextareaProps {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  rows?: number;
  className?: string;
}

export function MobileTextarea({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  required = false,
  rows = 4,
  className = ""
}: MobileTextareaProps) {
  const { isMobile } = useIsMobile();

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        rows={rows}
        className={`${isMobile ? 'mobile-input text-base resize-none' : ''}`}
      />
    </div>
  );
}

interface MobileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "default" | "outline" | "secondary";
  className?: string;
  disabled?: boolean;
}

export function MobileButton({ 
  children, 
  onClick, 
  type = "button",
  variant = "default",
  className = "",
  disabled = false
}: MobileButtonProps) {
  const { isMobile } = useIsMobile();

  return (
    <Button
      type={type}
      onClick={onClick}
      variant={variant}
      disabled={disabled}
      className={`${isMobile ? 'mobile-btn-full h-12 text-base font-semibold' : ''} ${className}`}
    >
      {children}
    </Button>
  );
}
