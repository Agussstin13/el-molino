import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";
import { categoryPath } from "../../lib/seo";

const API_BASE = import.meta.env.VITE_API_BASE;

export interface ShopCategory {
  id: number;
  name: string;
  imagePath?: string | null;
  displayOrder?: number;
}

// imagePath viene como "/images/categories/filename.jpg" del backend
const imgUrl = (path?: string | null) =>
  path ? (path.startsWith("/") ? `${API_BASE}${path}` : `${API_BASE}/images/${path}`) : "";

interface CategoryItemProps {
  category: ShopCategory;
  hiddenFromNavigation: boolean;
  eager: boolean;
}

function CategoryItem({ category, hiddenFromNavigation, eager }: CategoryItemProps) {
  return (
    <Link
      to={categoryPath(category)}
      tabIndex={hiddenFromNavigation ? -1 : undefined}
      aria-hidden={hiddenFromNavigation || undefined}
      className="category-marquee__item group"
    >
      <span className="category-marquee__image-frame">
        {category.imagePath ? (
          <img
            src={imgUrl(category.imagePath)}
            alt={hiddenFromNavigation ? "" : `${category.name} en El Molino`}
            // Native lazy-loading is unreliable inside this continuously
            // transformed marquee: off-screen items may never be requested
            // until the animation is paused or the element is repainted.
            loading="eager"
            fetchPriority={eager ? "high" : "auto"}
            decoding="async"
            width="112"
            height="112"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 group-focus-visible:scale-110"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-secondary text-primary/65">
            <Leaf className="h-8 w-8" aria-hidden="true" />
          </span>
        )}
      </span>
      <span className="category-marquee__label">{category.name}</span>
    </Link>
  );
}

interface CategoryGridProps {
  categories: ShopCategory[];
  loading?: boolean;
}

export function CategoryGrid({ categories, loading = false }: CategoryGridProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const marqueeOffsetRef = useRef(0);
  const groupWidthRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isHoveringRef = useRef(false);
  const isFocusedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const dragRef = useRef({ pointerId: -1, lastX: 0, distance: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const sortedCategories = [...categories].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
  const repetitions = sortedCategories.length > 0
    ? Math.max(1, Math.ceil(10 / sortedCategories.length))
    : 0;
  const loopCategories = Array.from({ length: repetitions }, (_, repetition) =>
    sortedCategories.map((category) => ({ category, repeated: repetition > 0 })),
  ).flat();
  const marqueeContentKey = loopCategories
    .map(({ category }) => `${category.id}:${category.imagePath ?? ""}`)
    .join("|");

  const positionMarquee = useCallback((requestedOffset: number) => {
    const track = trackRef.current;
    const groupWidth = groupWidthRef.current;
    if (!track || groupWidth <= 0) return;

    let nextOffset = requestedOffset;
    const lowerLimit = groupWidth * 0.5;
    const upperLimit = groupWidth * 1.5;

    // The three identical groups let the position wrap in either direction
    // without a visible jump while the user is dragging.
    while (nextOffset >= upperLimit) nextOffset -= groupWidth;
    while (nextOffset < lowerLimit) nextOffset += groupWidth;

    marqueeOffsetRef.current = nextOffset;
    track.style.transform = `translate3d(${-nextOffset}px, 0, 0)`;
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || loading || loopCategories.length === 0) return;

    const measureTrack = () => {
      const nextGroupWidth = track.scrollWidth / 3;
      if (nextGroupWidth <= 0) return;

      const previousGroupWidth = groupWidthRef.current;
      if (Math.abs(previousGroupWidth - nextGroupWidth) < 0.5) {
        positionMarquee(marqueeOffsetRef.current || nextGroupWidth);
        return;
      }

      const phase = previousGroupWidth > 0
        ? ((marqueeOffsetRef.current % previousGroupWidth) + previousGroupWidth) % previousGroupWidth / previousGroupWidth
        : 0;

      groupWidthRef.current = nextGroupWidth;
      positionMarquee(nextGroupWidth * (1 + phase));
    };

    measureTrack();

    const resizeObserver = new ResizeObserver(measureTrack);
    resizeObserver.observe(track);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let previousTime = performance.now();
    let animationFrame = 0;

    const animate = (currentTime: number) => {
      const elapsed = Math.min(currentTime - previousTime, 64);
      previousTime = currentTime;

      if (
        !reducedMotion.matches
        && !isDraggingRef.current
        && !isHoveringRef.current
        && !isFocusedRef.current
      ) {
        positionMarquee(marqueeOffsetRef.current + elapsed * 0.036);
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [loading, marqueeContentKey, positionMarquee]);

  if (!loading && categories.length === 0) return null;

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (groupWidthRef.current <= 0) return;

    isDraggingRef.current = true;
    dragRef.current = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      distance: 0,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || dragRef.current.pointerId !== event.pointerId) return;

    const movement = event.clientX - dragRef.current.lastX;
    dragRef.current.lastX = event.clientX;
    dragRef.current.distance += Math.abs(movement);

    positionMarquee(marqueeOffsetRef.current - movement);

    if (dragRef.current.distance > 4) {
      // Capturing on pointer-down changes the eventual click target from the
      // category link to this container. Wait until this is a real drag.
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
    }
  };

  const finishDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || dragRef.current.pointerId !== event.pointerId) return;

    const wasDragged = dragRef.current.distance > 5;
    isDraggingRef.current = false;
    dragRef.current.pointerId = -1;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (wasDragged) {
      suppressClickRef.current = true;
      if (
        document.activeElement instanceof HTMLElement
        && event.currentTarget.contains(document.activeElement)
      ) {
        document.activeElement.blur();
        isFocusedRef.current = false;
      }
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
  };

  const handleClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

  const handleBlurCapture = (event: ReactFocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      isFocusedRef.current = false;
    }
  };

  return (
    <section className="border-y border-border/60 bg-card/55 py-5 sm:py-6" id="categorias" aria-labelledby="categories-title">
      <div className="mb-4 px-4 text-center sm:mb-5">
        <h2 id="categories-title" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
          Encontrá tu sección favorita
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center gap-5 overflow-hidden px-4 sm:gap-8" aria-busy="true" aria-label="Cargando categorías">
          {Array.from({ length: 10 }, (_, index) => (
            <div key={index} className="flex w-[5.5rem] flex-none flex-col items-center gap-2.5" aria-hidden="true">
              <span className="block aspect-square w-[5.25rem] animate-pulse rounded-full bg-secondary sm:w-24" />
              <span className="block h-3 w-16 animate-pulse rounded-full bg-secondary" />
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`category-marquee${isDragging ? " category-marquee--dragging" : ""}`}
          role="group"
          aria-label="Categorías desplazables"
          aria-roledescription="carrusel"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDragging}
          onPointerCancel={finishDragging}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") isHoveringRef.current = true;
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") isHoveringRef.current = false;
          }}
          onClickCapture={handleClickCapture}
          onFocusCapture={() => {
            isFocusedRef.current = true;
          }}
          onBlurCapture={handleBlurCapture}
          onDragStart={(event) => event.preventDefault()}
        >
          <div ref={trackRef} className="category-marquee__track">
            <div className="category-marquee__group category-marquee__group--duplicate" aria-hidden="true">
              {loopCategories.map(({ category }, index) => (
                <CategoryItem
                  key={`leading-duplicate-${category.id}-${index}`}
                  category={category}
                  hiddenFromNavigation
                  eager={false}
                />
              ))}
            </div>
            <div className="category-marquee__group">
              {loopCategories.map(({ category, repeated }, index) => (
                <CategoryItem
                  key={`primary-${category.id}-${index}`}
                  category={category}
                  hiddenFromNavigation={repeated}
                  eager={!repeated && index < 4}
                />
              ))}
            </div>
            <div className="category-marquee__group category-marquee__group--duplicate" aria-hidden="true">
              {loopCategories.map(({ category }, index) => (
                <CategoryItem
                  key={`trailing-duplicate-${category.id}-${index}`}
                  category={category}
                  hiddenFromNavigation
                  eager={false}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
