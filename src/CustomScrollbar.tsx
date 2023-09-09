import { useState, useEffect, useRef } from "react";

type CustomScrollbarProps = {
  size: number;
  contentSelector: string;
  contentFullSize: number;
  isVertical?: boolean;
};

const CustomScrollbar = ({ size, contentSelector, contentFullSize, isVertical }: CustomScrollbarProps) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const contentRef = useRef<HTMLElement | null>(null);

  if (contentFullSize <= 0) throw new Error(`Scrollable content size is invalid: ${contentFullSize}`);

  const maxScrollPosition: number = contentFullSize - size;

  const pageRatio: number = size / contentFullSize;

  const thumbOffset: number = Math.round(scrollPosition * pageRatio);
  const thumbSize: number = Math.min(Math.max(Math.round(size * pageRatio), 17), size);

  const scrollbarProps: { className: string; style: { width?: number; height?: number } } = isVertical
    ? { className: "custom-scrollbar-v", style: { height: size } }
    : { className: "custom-scrollbar-h", style: { width: size } };

  const thumbProps: { style: { left?: number; top?: number; width?: number; height?: number } } = isVertical
    ? { style: { top: thumbOffset, height: thumbSize } }
    : { style: { left: thumbOffset, width: thumbSize } };

  const calcScrollOptions = (scrollbarClickPos: number): ScrollOptions => {
    const thumbEnd: number = thumbOffset + thumbSize - 1;

    const scrollOptions: ScrollToOptions = {};

    // scroll smoothly if scroll thumb is larger than half the scroll bar
    // this makes the thumb's motion clearer for the user
    if (thumbSize > Math.floor(size / 2)) scrollOptions.behavior = "smooth";

    // detect which direction to scroll, then scroll by a page's worth
    if (scrollbarClickPos < thumbOffset) {
      isVertical
        ? (scrollOptions.top = Math.max(scrollPosition - size, 0))
        : (scrollOptions.left = Math.max(scrollPosition - size, 0));
    } else if (scrollbarClickPos > thumbEnd) {
      isVertical
        ? (scrollOptions.top = Math.min(scrollPosition + size, maxScrollPosition))
        : (scrollOptions.left = Math.min(scrollPosition + size, maxScrollPosition));
    }

    return scrollOptions;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault(); // prevent unwanted effects, such as text highlighting when moving mouse

    if (contentRef.current) {
      const target = e.target as HTMLDivElement;

      if (target.className === "scroll-thumb") {
        const handleMouseMove = (e: Event) => {
          // Check how much mouse moved and set scrollPercentage accordingly
        };

        const handleMouseUp = () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      } else {
        const scrollbarClickPos: number = isVertical
          ? e.clientY - target.getBoundingClientRect().top
          : e.clientX - target.getBoundingClientRect().left;

        const scrollOptions: ScrollToOptions = calcScrollOptions(scrollbarClickPos);

        contentRef.current.scrollTo(scrollOptions);
      }
    }
  };

  useEffect(() => {
    const content: HTMLElement | null = document.querySelector(contentSelector);

    if (!content) throw new Error(`Scrollable content element not found: ${contentSelector}`);

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const newScrollPosition: number = isVertical ? target.scrollTop : target.scrollLeft;

      // if there are two scrollbars on the content (one horizontal and one vertical), and one changes position,
      // the one that does not change position will set its position to the value it already is and trigger an unnecessary re-render.
      // seems inevitable in this case. If any ideas, fix it later. If not, all good, shouldn't affect performance noticeably.
      setScrollPosition(newScrollPosition);
    };

    content.addEventListener("scroll", handleScroll);

    contentRef.current = content; // is this okay practice? Pass ref from parent?

    return () => {
      content.removeEventListener("scroll", handleScroll);
    };
  }, [contentSelector, isVertical, setScrollPosition]);

  return (
    <div {...scrollbarProps} onMouseDown={handleMouseDown}>
      <div className="scroll-thumb" {...thumbProps} />
    </div>
  );
};

export default CustomScrollbar;
