import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Image {
    id: string;
    url: string;
    alt: string;
  }

interface ImageGalleryModalProps {
    show: boolean;
    images: Image[];
    currentIndex: number;
    closeGallery: () => void;
    nextImage: (e: React.MouseEvent) => void;
    prevImage: (e: React.MouseEvent) => void;
  }
  
  export  function ImageGalleryModal({
    show,
    images,
    currentIndex,
    closeGallery,
    nextImage,
    prevImage,
  }: ImageGalleryModalProps) {
    if (!show || images.length === 0) return null;
  
    return (
      <div
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
        onClick={closeGallery}
      >
        <div className="relative max-w-4xl w-full">
          <button
            className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 z-10"
            onClick={closeGallery}
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative">
            <img
              src={images[currentIndex].url}
              alt={images[currentIndex].alt}
              className="w-full h-auto max-h-screen object-contain"
            />
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2"
              onClick={prevImage}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2"
              onClick={nextImage}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
          <div className="text-center text-white mt-4">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      </div>
    );
  }