import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface MenuItemImageProps {
  imageId?: Id<"_storage">;
  legacyImage?: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  lazy?: boolean;
}

export function MenuItemImage({
  imageId,
  legacyImage,
  alt,
  className = "w-full h-full object-cover",
  fallbackSrc = "/latte.png",
  lazy = true,
}: MenuItemImageProps) {
  // Fetch the storage URL if we have an imageId
  const storageUrl = useQuery(
    api.files.getImageUrl,
    imageId ? { storageId: imageId } : "skip"
  );

  // Determine the final image source
  // Priority: 1. Storage URL, 2. Legacy image path, 3. Fallback
  const imageSrc = imageId
    ? storageUrl || fallbackSrc // Use storage URL or fallback while loading
    : legacyImage
      ? `/${legacyImage}`
      : fallbackSrc;

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading={lazy ? "lazy" : "eager"}
      decoding="async"
      onError={(e) => {
        // Fallback if image fails to load
        (e.target as HTMLImageElement).src = fallbackSrc;
      }}
    />
  );
}
