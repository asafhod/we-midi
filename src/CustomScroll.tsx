import { PropsWithChildren, Children, useEffect, useRef } from "react";
import useResizeObserver from "use-resize-observer";

type CustomScrollProps = {
  contentFullSizeH: number;
  contentFullSizeV: number;
  scaledPlayerPosition: number;
  isPlaying: boolean;
  scrollWheelZoom: (e: React.WheelEvent<HTMLDivElement>) => void;
  autoscrollBlocked: boolean;
  blockAutoscroll: () => void;
};

const CustomScroll = ({
  contentFullSizeH,
  contentFullSizeV,
  scaledPlayerPosition,
  isPlaying,
  scrollWheelZoom,
  autoscrollBlocked,
  blockAutoscroll,
  children,
}: PropsWithChildren<CustomScrollProps>) => {
  const contentHRef = useRef<HTMLDivElement>(null);
  const contentVRef = useRef<HTMLDivElement>(null);
  const thumbHRef = useRef<HTMLDivElement>(null);
  const thumbVRef = useRef<HTMLDivElement>(null);
  const { width: sizeH = 0 } = useResizeObserver<HTMLDivElement>({ ref: contentHRef });
  const { height: sizeV = 0 } = useResizeObserver<HTMLDivElement>({ ref: contentVRef });

  if (contentFullSizeH <= 0 || contentFullSizeV <= 0)
    throw new Error(`Scrollable content size is invalid - Width: ${contentFullSizeH} Height: ${contentFullSizeV}`);

  const childrenArray = Children.toArray(children);

  // const thumbOffset: number = Math.round(scrollPosition * pageRatio);

  // console.log(contentRef.current);

  // const scrollbarProps: { className: string; style: { width?: number; height?: number } } = isVertical
  //   ? { className: "custom-scrollbar-v", style: { height: size } }
  //   : { className: "custom-scrollbar-h", style: { width: size } };

  // const thumbProps: { style: { left?: number; top?: number; width?: number; height?: number } } = isVertical
  //   ? { style: { top: thumbOffset, height: thumbSize } }
  //   : { style: { left: thumbOffset, width: thumbSize } };

  // const calcScrollOptions = (scrollbarClickPos: number): ScrollOptions => {
  //   const thumbEnd: number = thumbOffset + thumbSize - 1;

  //   const scrollOptions: ScrollToOptions = {};

  //   // scroll smoothly if scroll thumb is larger than half the scroll bar
  //   // this makes the thumb's motion clearer for the user
  //   if (thumbSize > Math.floor(size / 2)) scrollOptions.behavior = "smooth";

  //   // detect which direction to scroll, then scroll by a page's worth
  //   if (scrollbarClickPos < thumbOffset) {
  //     isVertical
  //       ? (scrollOptions.top = Math.max(scrollPosition - size, 0))
  //       : (scrollOptions.left = Math.max(scrollPosition - size, 0));
  //   } else if (scrollbarClickPos > thumbEnd) {
  //     isVertical
  //       ? (scrollOptions.top = Math.min(scrollPosition + size, maxScrollPosition))
  //       : (scrollOptions.left = Math.min(scrollPosition + size, maxScrollPosition));
  //   }

  //   return scrollOptions;
  // };

  // const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
  // if (e.button === 0) {
  //   e.preventDefault(); // prevent unwanted effects, such as text highlighting when moving mouse
  //   const target = e.target as HTMLDivElement;
  //   if (target.className === "scroll-thumb") {
  //     const initialMousePos: number = isVertical ? e.clientY : e.clientX;
  //     const handleMouseMove = (e: MouseEvent) => {
  //       const newMousePos: number = isVertical ? e.clientY : e.clientX;
  //       const deltaPos: number = newMousePos - initialMousePos;
  //       const newScrollPosition: number = Math.max(Math.min(Math.round((thumbOffset + deltaPos) / pageRatio), maxScrollPosition), 0);
  //       setScrollPosition(newScrollPosition);
  //       // isVertical ? (contentRef.current.scrollTop = newScrollPosition) : (contentRef.current.scrollLeft = newScrollPosition);
  //     };
  //     const handleMouseUp = () => {
  //       document.removeEventListener("mousemove", handleMouseMove);
  //       document.removeEventListener("mouseup", handleMouseUp);
  //     };
  //     document.addEventListener("mousemove", handleMouseMove);
  //     document.addEventListener("mouseup", handleMouseUp);
  //   } else {
  //     const scrollbarClickPos: number = isVertical
  //       ? e.clientY - target.getBoundingClientRect().top
  //       : e.clientX - target.getBoundingClientRect().left;
  //     // const scrollOptions: ScrollToOptions = calcScrollOptions(scrollbarClickPos);
  //     // contentRef.current.scrollTo(scrollOptions);
  //     // detect which direction to scroll, then scroll by a page's worth
  //     if (scrollbarClickPos < thumbOffset) {
  //       setScrollPosition(Math.max(scrollPosition - size, 0));
  //     } else if (scrollbarClickPos > thumbOffset + thumbSize - 1) {
  //       setScrollPosition(Math.min(scrollPosition + size, maxScrollPosition));
  //     }
  //   }
  // }
  // };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, targetButton: number) => {
    if (e.button === targetButton) blockAutoscroll();
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (contentVRef.current) {
      if (e.deltaY > 0) {
        contentVRef.current.scrollBy(0, 100);
      } else if (e.deltaY < 0) {
        contentVRef.current.scrollBy(0, -100);
      }
    }

    // may need to prevent entire window from scrolling, see how wheel usually behaves
  };

  const updateThumbH = (scrollPositionX: number, updateSize: boolean) => {
    if (thumbHRef.current) {
      // const currentScrollPositionX: number = contentHRef.current.scrollLeft;
      const pageRatioH: number = sizeH / contentFullSizeH;
      const newThumbHOffset: number = Math.round(scrollPositionX * pageRatioH);

      const atEnd: boolean = Math.ceil(scrollPositionX) >= contentFullSizeH - sizeH;
      const transition: string = thumbHRef.current.style.transitionDuration;
      if (atEnd && !transition) {
        thumbHRef.current.style.transitionDuration = "0.1s";
      } else if (!atEnd && transition) {
        thumbHRef.current.style.transitionDuration = "";
      }

      if (updateSize) {
        const maxThumbHSize: number = sizeH - newThumbHOffset;
        const newThumbHSize: number = Math.min(Math.max(Math.ceil(sizeH * pageRatioH), 17), maxThumbHSize);
        thumbHRef.current.style.width = `${newThumbHSize}px`;
      }

      thumbHRef.current.style.left = `${newThumbHOffset}px`;
    }
  };

  const updateThumbV = (scrollPositionY: number, updateSize: boolean) => {
    if (thumbVRef.current) {
      // const currentScrollPositionY: number = contentVRef.current.scrollTop;
      const pageRatioV: number = sizeV / contentFullSizeV;
      const newThumbVOffset: number = Math.round(scrollPositionY * pageRatioV);

      const atEnd: boolean = Math.ceil(scrollPositionY) >= contentFullSizeV - sizeV;
      const transition: string = thumbVRef.current.style.transitionDuration;
      if (atEnd && !transition) {
        thumbVRef.current.style.transitionDuration = "0.1s";
      } else if (!atEnd && transition) {
        thumbVRef.current.style.transitionDuration = "";
      }

      if (updateSize) {
        const maxThumbVSize: number = sizeV - newThumbVOffset;
        const newThumbVSize: number = Math.min(Math.max(Math.ceil(sizeV * pageRatioV), 17), maxThumbVSize);
        thumbVRef.current.style.height = `${newThumbVSize}px`;
      }

      thumbVRef.current.style.top = `${newThumbVOffset}px`;
    }
  };

  const handleScrollX = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    // Note: Offset will be set twice on the max position zoom-out edge case (regardless of whether handleScrollX or the UE fires first), but it's harmless

    const newScrollPositionX: number = e.currentTarget.scrollLeft;
    updateThumbH(newScrollPositionX, false);
  };

  const handleScrollY = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    // Note: Offset will be set twice on the max position track-length-decrease edge case (regardless of whether handleScrollY or the UE fires first), but it's harmless

    const newScrollPositionY: number = e.currentTarget.scrollTop;
    updateThumbV(newScrollPositionY, false);
  };

  useEffect(() => {
    if (contentHRef.current) {
      const currentScrollPositionX: number = contentHRef.current.scrollLeft;
      updateThumbH(currentScrollPositionX, true);

      // trigger zoom-centering scroll (actually, best to do a useEffect on zoom for this)
    }
  }, [sizeH, contentFullSizeH]);

  useEffect(() => {
    if (contentVRef.current) {
      const currentScrollPositionY: number = contentVRef.current.scrollTop;
      updateThumbV(currentScrollPositionY, true);
    }
  }, [sizeV, contentFullSizeV]);

  useEffect(() => {
    const autoscroll = () => {
      if (isPlaying && !autoscrollBlocked && contentHRef.current) {
        const minPositionVisible: number = contentHRef.current.scrollLeft;
        const maxPositionVisible: number = minPositionVisible + sizeH - 1;

        if (scaledPlayerPosition > maxPositionVisible || scaledPlayerPosition < minPositionVisible) {
          contentHRef.current.scrollTo(scaledPlayerPosition, 0);
        }
      }
    };

    autoscroll();
  }, [scaledPlayerPosition, isPlaying, autoscrollBlocked, sizeH]);

  return (
    <div className="scroll-container">
      <div className="scroll-content-wrapper">
        <div className="content-v" ref={contentVRef} onScroll={handleScrollY}>
          <div className="content-panel" onWheel={handleWheel}>
            {childrenArray[0]}
          </div>

          <div
            className="content-h"
            ref={contentHRef}
            onScroll={handleScrollX}
            onWheel={scrollWheelZoom}
            onMouseDown={(e) => handleMouseDown(e, 1)}
          >
            {childrenArray[1]}
          </div>
        </div>
        <div className="scrollbar-h" onWheel={scrollWheelZoom} onMouseDown={(e) => handleMouseDown(e, 0)}>
          <div className="scroll-thumb" ref={thumbHRef} />
        </div>
      </div>

      {/* use CSS for height instead */}
      <div
        className="scrollbar-v"
        style={{ height: sizeV }}
        onWheel={handleWheel}
        // onMouseDown={handleMouseDown}
      >
        <div className="scroll-thumb" ref={thumbVRef} />
      </div>
    </div>
  );
};

export default CustomScroll;
