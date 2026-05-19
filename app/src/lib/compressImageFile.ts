import { UPLOAD_IMAGE_MAX_BYTES } from "@/lib/imageUploadLimits";

export type CompressImageResult = {
  file: File;
  wasCompressed: boolean;
  originalBytes: number;
  finalBytes: number;
};

type Options = {
  maxBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
};

const DEFAULT_MAX_DIM = 2048;

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image. Try JPG or PNG."));
    };
    img.src = url;
  });
}

function scaleDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (width <= maxWidth && height <= maxHeight) return { width, height };
  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      "image/jpeg",
      quality,
    );
  });
}

function outputFileName(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, "").trim() || "photo";
  return `${base.slice(0, 80)}.jpg`;
}

/**
 * Resize / re-encode images so uploads stay under the API byte limit.
 * Small files that already fit are returned unchanged.
 */
export async function compressImageFile(
  file: File,
  options: Options = {},
): Promise<CompressImageResult> {
  const maxBytes = options.maxBytes ?? UPLOAD_IMAGE_MAX_BYTES;
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_DIM;
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_DIM;
  const originalBytes = file.size;

  if (!file.type.startsWith("image/")) {
    throw new Error("File is not an image.");
  }

  if (originalBytes <= maxBytes) {
    return { file, wasCompressed: false, originalBytes, finalBytes: originalBytes };
  }

  const img = await loadImageElement(file);
  let { width, height } = scaleDimensions(img.naturalWidth, img.naturalHeight, maxWidth, maxHeight);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing is not supported in this browser.");

  const draw = (w: number, h: number) => {
    canvas.width = w;
    canvas.height = h;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
  };

  draw(width, height);

  let quality = 0.9;
  const minQuality = 0.45;
  let blob = await canvasToJpegBlob(canvas, quality);

  while (blob.size > maxBytes && quality > minQuality) {
    quality = Math.max(minQuality, quality - 0.07);
    blob = await canvasToJpegBlob(canvas, quality);
  }

  let dimFactor = 0.85;
  while (blob.size > maxBytes && dimFactor >= 0.4) {
    width = Math.max(400, Math.round(width * dimFactor));
    height = Math.max(400, Math.round(height * dimFactor));
    draw(width, height);
    quality = 0.82;
    blob = await canvasToJpegBlob(canvas, quality);
    while (blob.size > maxBytes && quality > minQuality) {
      quality = Math.max(minQuality, quality - 0.07);
      blob = await canvasToJpegBlob(canvas, quality);
    }
    dimFactor -= 0.12;
  }

  if (blob.size > maxBytes) {
    throw new Error(
      `This photo is still too large after resizing. Try cropping it or using a smaller image (max ${Math.round(maxBytes / 1024)} KB).`,
    );
  }

  const out = new File([blob], outputFileName(file.name), {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });

  return {
    file: out,
    wasCompressed: true,
    originalBytes,
    finalBytes: out.size,
  };
}
