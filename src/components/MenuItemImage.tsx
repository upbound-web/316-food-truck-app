import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface MenuItemImageProps {
  imageId?: Id<"_storage">;
  legacyImage?: string;
  alt: string;
  className?: string;
  lazy?: boolean;
}

// 1x1 transparent PNG as a guaranteed-available fallback
const TRANSPARENT_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualzQAAAABJRU5ErkJggg==";

export function MenuItemImage({
  imageId,
  legacyImage,
  alt,
  className = "w-full h-full object-cover",
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
    ? storageUrl || TRANSPARENT_PIXEL // Use storage URL or fallback while loading
    : legacyImage
      ? `/${legacyImage}`
      : TRANSPARENT_PIXEL;

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading={lazy ? "lazy" : "eager"}
      decoding="async"
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        if (img.src !== TRANSPARENT_PIXEL) {
          img.src = TRANSPARENT_PIXEL;
        }
      }}
    />
  );
}
