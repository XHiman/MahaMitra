// ImageCarousel.tsx
import React, { useEffect, useState, useCallback } from "react";
import "./Carousel.css";

export interface CarouselImage {
  src: string;
  alt?: string;
  caption?: string;
}

export interface ImageCarouselProps {
  images: CarouselImage[];
  autoPlay?: boolean;
  autoPlayInterval?: number; // ms
  showIndicators?: boolean;
  showArrows?: boolean;
  className?: string;
}

const DEFAULT_INTERVAL = 4000;

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  autoPlay = true,
  autoPlayInterval = DEFAULT_INTERVAL,
  showIndicators = true,
  showArrows = true,
  className = "",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasImages = images && images.length > 0;
  const lastIndex = hasImages ? images.length - 1 : 0;

  const goToIndex = useCallback(
    (index: number) => {
      if (!hasImages) return;
      const normalized =
        ((index % images.length) + images.length) % images.length;
      setCurrentIndex(normalized);
    },
    [hasImages, images.length]
  );

  const goToNext = useCallback(() => {
    goToIndex(currentIndex + 1);
  }, [currentIndex, goToIndex]);

  const goToPrev = useCallback(() => {
    goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || !hasImages) return;

    const id = window.setInterval(() => {
      setCurrentIndex((prev) =>
        images.length > 0 ? (prev + 1) % images.length : prev
      );
    }, autoPlayInterval);

    return () => window.clearInterval(id);
  }, [autoPlay, autoPlayInterval, hasImages, images.length]);

  // Keyboard navigation
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goToNext();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goToPrev();
    }
  };

  if (!hasImages) return null;

  return (
    <div
      className={`ic-carousel ${className}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-roledescription="carousel"
      aria-label="Image carousel"
    >
      <div className="ic-viewport">
        <div
          className="ic-track"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {images.map((image, index) => (
            <div
              className="ic-slide"
              key={image.src + index}
              aria-hidden={index !== currentIndex}
            >
              <img
                src={image.src}
                alt={image.alt ?? `Slide ${index + 1}`}
                className="ic-image"
              />
              {image.caption && (
                <div className="ic-caption">{image.caption}</div>
              )}
            </div>
          ))}
        </div>

        {showArrows && (
          <>
            <button
              type="button"
              className="ic-arrow ic-arrow-left"
              onClick={goToPrev}
              aria-label="Previous slide"
            >
              ‹
            </button>
            <button
              type="button"
              className="ic-arrow ic-arrow-right"
              onClick={goToNext}
              aria-label="Next slide"
            >
              ›
            </button>
          </>
        )}
      </div>

      {showIndicators && images.length > 1 && (
        <div className="ic-indicators" aria-label="Select slide">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`ic-indicator ${
                index === currentIndex ? "ic-indicator-active" : ""
              }`}
              onClick={() => goToIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-pressed={index === currentIndex}
            />
          ))}
        </div>
      )}

      <div className="ic-counter" aria-hidden="true">
        {currentIndex + 1} / {lastIndex + 1}
      </div>
    </div>
  );
};

// Example usage:
// <ImageCarousel
//   images={[
//     { src: "/img/1.jpg", alt: "First", caption: "First slide" },
//     { src: "/img/2.jpg", alt: "Second", caption: "Second slide" },
//   ]}
// />