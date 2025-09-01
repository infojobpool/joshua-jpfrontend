import axios from 'axios';
import { toast } from 'sonner'; // or any toast lib you're using

export const handleAxiosError = (
  error: unknown,
  fallback = 'Something went wrong'
) => {
  if (axios.isAxiosError(error)) {
    // Check if the error response has the message property
    const message = error.response?.data?.detail || fallback;
    // You can log the full error if you'd like to debug
    console.error("API Error:", error.response?.data);
    toast.error(message);
  } else {
    toast.error(fallback);
  }
};

