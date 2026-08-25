export type TaskImageLike = {
  id: string;
  url: string;
  alt: string;
};

export function isRealTaskImageUrl(url: string | undefined | null): boolean {
  return Boolean(
    url &&
      !String(url).includes("placeholder.svg") &&
      !String(url).includes("placeholder.com")
  );
}

export function isRealTaskImage(img: TaskImageLike | undefined): boolean {
  return isRealTaskImageUrl(img?.url);
}

export function realTaskImages<T extends TaskImageLike>(images: T[]): T[] {
  return images.filter((img) => isRealTaskImage(img));
}

export function galleryIndexForTaskImage(
  images: TaskImageLike[],
  taskImageIndex: number
): number {
  const clicked = images[taskImageIndex];
  if (!clicked) return 0;
  const filtered = realTaskImages(images);
  const idx = filtered.findIndex((img) => img.url === clicked.url);
  return idx >= 0 ? idx : 0;
}
