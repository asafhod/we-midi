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

  const handleMouseDownH = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.button === 0) {
      e.preventDefault(); // prevent unwanted effects, such as text highlighting when moving mouse

      if (thumbHRef.current) {
        // TODO: Make sure bugs can't happen if values change during. May have to move parts into the handleMouseMove function.
        // Or make it so these values can't change while the mouse is down here, though that may not be feasible in the larger app context.
        const currentThumbHOffset: number = Number(thumbHRef.current.style.left.slice(0, -2)); // strip the px
        const maxScrollPositionX: number = contentFullSizeH - sizeH;

        const target = e.target as HTMLDivElement;
        if (target.className === "scroll-thumb") {
          const initialMousePos: number = e.clientX;

          // TODO: Make sure bugs can't happen if values change during. May have to move parts into the handleMouseMove function.
          // Or make it so these values can't change while the mouse is down here, though that may not be feasible in the larger app context.
          const pageRatioH: number = sizeH / contentFullSizeH;

          const handleMouseMoveH = (e: MouseEvent) => {
            if (contentHRef.current) {
              const newMousePos: number = e.clientX;
              const deltaPos: number = newMousePos - initialMousePos;
              const newScrollPosition: number = Math.max(
                Math.min(Math.round((currentThumbHOffset + deltaPos) / pageRatioH), maxScrollPositionX),
                0
              ); // unnecessary to min-max it?

              contentHRef.current.scrollLeft = newScrollPosition;
            }
          };

          const handleMouseUpH = () => {
            document.removeEventListener("mousemove", handleMouseMoveH);
            document.removeEventListener("mouseup", handleMouseUpH);
          };
          document.addEventListener("mousemove", handleMouseMoveH);
          document.addEventListener("mouseup", handleMouseUpH);
        } else {
          if (contentHRef.current) {
            const scrollbarClickPos: number = e.clientX - target.getBoundingClientRect().left;
            const currentThumbHSize: number = Number(thumbHRef.current.style.width.slice(0, -2)); // strip the px (it has that, right?)

            // const scrollOptions: ScrollToOptions = calcScrollOptions(scrollbarClickPos);
            // contentRef.current.scrollTo(scrollOptions);

            // detect which direction to scroll, then scroll by a page's worth
            if (scrollbarClickPos < currentThumbHOffset) {
              contentHRef.current.scrollBy(-sizeH, 0);
            } else if (scrollbarClickPos > currentThumbHOffset + currentThumbHSize - 1) {
              contentHRef.current.scrollBy(sizeH, 0);
            }
          }
        }
      }

      blockAutoscroll();
    }
  };

  const handleMouseDownV = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.button === 0) {
      e.preventDefault(); // prevent unwanted effects, such as text highlighting when moving mouse

      if (thumbVRef.current) {
        // TODO: Make sure bugs can't happen if values change during. May have to move parts into the handleMouseMove function.
        // Or make it so these values can't change while the mouse is down here, though that may not be feasible in the larger app context.
        const currentThumbVOffset: number = Number(thumbVRef.current.style.top.slice(0, -2)); // strip the px
        const maxScrollPositionY: number = contentFullSizeV - sizeV;

        const target = e.target as HTMLDivElement;
        if (target.className === "scroll-thumb") {
          const initialMousePos: number = e.clientY;

          // TODO: Make sure bugs can't happen if values change during. May have to move parts into the handleMouseMove function.
          // Or make it so these values can't change while the mouse is down here, though that may not be feasible in the larger app context.
          const pageRatioV: number = sizeV / contentFullSizeV;

          const handleMouseMoveV = (e: MouseEvent) => {
            if (contentVRef.current) {
              const newMousePos: number = e.clientY;
              const deltaPos: number = newMousePos - initialMousePos;
              const newScrollPosition: number = Math.max(
                Math.min(Math.round((currentThumbVOffset + deltaPos) / pageRatioV), maxScrollPositionY),
                0
              ); // unnecessary to min-max it?

              contentVRef.current.scrollTop = newScrollPosition;
            }
          };

          const handleMouseUpV = () => {
            document.removeEventListener("mousemove", handleMouseMoveV);
            document.removeEventListener("mouseup", handleMouseUpV);
          };
          document.addEventListener("mousemove", handleMouseMoveV);
          document.addEventListener("mouseup", handleMouseUpV);
        } else {
          if (contentVRef.current) {
            const scrollbarClickPos: number = e.clientY - target.getBoundingClientRect().top;
            const currentThumbVSize: number = Number(thumbVRef.current.style.height.slice(0, -2)); // strip the px (it has that, right?)

            // const scrollOptions: ScrollToOptions = calcScrollOptions(scrollbarClickPos);
            // contentRef.current.scrollTo(scrollOptions);

            // detect which direction to scroll, then scroll by a page's worth
            if (scrollbarClickPos < currentThumbVOffset) {
              contentVRef.current.scrollBy(0, -sizeH);
            } else if (scrollbarClickPos > currentThumbVOffset + currentThumbVSize - 1) {
              contentVRef.current.scrollBy(0, sizeH);
            }
          }
        }
      }
    }
  };

  const handleMouseDownContent = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.button === 1) blockAutoscroll();
  };

  const handleWheelH = (e: React.WheelEvent<HTMLDivElement>) => {
    if (contentHRef.current) {
      if (e.deltaX > 0) {
        contentHRef.current.scrollBy({ left: 100, behavior: "smooth" });
      } else if (e.deltaX < 0) {
        contentHRef.current.scrollBy({ left: -100, behavior: "smooth" });
      }
    }
    // may need to prevent entire window from scrolling, see how wheel usually behaves

    // refactor slightly to prevent duplicate deltaX checking in this scenario
    scrollWheelZoom(e);
  };

  const handleWheelV = (e: React.WheelEvent<HTMLDivElement>) => {
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
          <div className="content-panel" onWheel={handleWheelV}>
            {childrenArray[0]}
          </div>

          <div
            className="content-h"
            ref={contentHRef}
            onScroll={handleScrollX}
            onWheel={scrollWheelZoom}
            onMouseDown={handleMouseDownContent}
          >
            {childrenArray[1]}
          </div>
        </div>
        <div className="scrollbar-h" onWheel={handleWheelH} onMouseDown={handleMouseDownH}>
          <div className="scroll-thumb" ref={thumbHRef} />
        </div>
      </div>

      {/* use CSS for height instead */}
      <div className="scrollbar-v" style={{ height: sizeV }} onWheel={handleWheelV} onMouseDown={handleMouseDownV}>
        <div className="scroll-thumb" ref={thumbVRef} />
      </div>
    </div>
  );
};

export default CustomScroll;
