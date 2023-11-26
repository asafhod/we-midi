import { PropsWithChildren, Children, useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import useResizeObserver from "use-resize-observer";
import { TrackType } from "./types";

type EditorLayoutProps = {
  contentFullSizeH: number;
  contentFullSizeV: number;
  startPosition: number;
  playerPosition: number;
  widthFactor: number;
  isPlaying: boolean;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  scrollWheelZoom: (e: React.WheelEvent<HTMLDivElement>) => void;
  autoscrollBlocked: boolean;
  blockAutoscroll: () => void;
  tracks: TrackType[];
  midiEditorTrackID: number;
  setMidiEditorTrackID: React.Dispatch<React.SetStateAction<number>>;
  nextMidiEditorTrackID: number;
};

type TrackViewSetting = {
  trackID: number;
  scrollPos: number;
  zoom: number;
};

const EditorLayout = ({
  contentFullSizeH,
  contentFullSizeV,
  startPosition,
  playerPosition,
  widthFactor,
  isPlaying,
  zoom,
  setZoom,
  scrollWheelZoom,
  autoscrollBlocked,
  blockAutoscroll,
  tracks,
  midiEditorTrackID,
  setMidiEditorTrackID,
  nextMidiEditorTrackID,
  children,
}: PropsWithChildren<EditorLayoutProps>) => {
  // TODO: TrackViewSettings needs to adjust when adding and removing tracks. Likely move it to a custom hook (useTrackViewSettings).
  const [trackViewSettings, setTrackViewSettings] = useState<TrackViewSetting[]>([{ trackID: 0, scrollPos: 0, zoom: 1 }]);
  const contentVRef = useRef<HTMLDivElement>(null);
  const contentHRef = useRef<HTMLDivElement>(null);
  const contentHeaderRef = useRef<HTMLDivElement>(null);
  const thumbHRef = useRef<HTMLDivElement>(null);
  const thumbVRef = useRef<HTMLDivElement>(null);
  const { height = 0 } = useResizeObserver<HTMLDivElement>({ ref: contentVRef });
  const { width: sizeH = 0 } = useResizeObserver<HTMLDivElement>({ ref: contentHRef });
  const prevSizeHRef = useRef(sizeH);
  const prevContentFullSizeHRef = useRef(contentFullSizeH);
  const prevZoomRef = useRef(zoom);

  // TODO: Fix ratio issue between sizeV and contentFullSizeV (currently removed the +35 on the prop)
  // Appears to slightly affect page amount for vertical click scrolling (anything else?)
  const sizeV: number = Math.max(height - 35, 0); // any issue here when window size is small?

  if (contentFullSizeH <= 0 || contentFullSizeV <= 0) {
    throw new Error(`Scrollable content size is invalid - Width: ${contentFullSizeH} Height: ${contentFullSizeV}`);
  }

  // optimize so doesn't re-calc on every render
  const showScrollbarV: boolean = contentFullSizeV > window.innerHeight * 0.8 - 35; // can this break the ref? maybe gets rid of it, but harmless?

  const scaledStartPosition: number = Math.round(startPosition * widthFactor);
  const scaledPlayerPosition: number = Math.round(playerPosition * widthFactor);
  const playerPositionMarkerDisplay: string = isPlaying ? "inline" : "none"; // use render flag instead?
  const childrenArray = Children.toArray(children);

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
            const currentThumbHSize: number = Number(thumbHRef.current.style.width.slice(0, -2)); // strip the px

            // does this ever conflict with the max scroll offset delay logic? Appears not to
            const scrollOptions: ScrollToOptions = {};
            if (currentThumbHSize > Math.floor(sizeH / 2)) scrollOptions.behavior = "smooth";

            // detect which direction to scroll, then scroll by a page's worth
            if (scrollbarClickPos < currentThumbHOffset) {
              scrollOptions.left = -sizeH;
              contentHRef.current.scrollBy(scrollOptions);
            } else if (scrollbarClickPos > currentThumbHOffset + currentThumbHSize - 1) {
              scrollOptions.left = sizeH;
              contentHRef.current.scrollBy(scrollOptions);
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
            const currentThumbVSize: number = Number(thumbVRef.current.style.height.slice(0, -2)); // strip the px

            // does this ever conflict with the max scroll offset delay logic? Appears not to
            const scrollOptions: ScrollToOptions = {};
            if (currentThumbVSize > Math.floor(sizeV / 2)) scrollOptions.behavior = "smooth";

            // detect which direction to scroll, then scroll by a page's worth
            if (scrollbarClickPos < currentThumbVOffset) {
              scrollOptions.top = -sizeV;
              contentVRef.current.scrollBy(scrollOptions);
            } else if (scrollbarClickPos > currentThumbVOffset + currentThumbVSize - 1) {
              scrollOptions.top = sizeV;
              contentVRef.current.scrollBy(scrollOptions);
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
    if (e.ctrlKey) return;

    if (contentHRef.current) {
      if (e.deltaX > 0) {
        contentHRef.current.scrollBy({ left: 100, behavior: "smooth" });
      } else if (e.deltaX < 0) {
        contentHRef.current.scrollBy({ left: -100, behavior: "smooth" });
      }
    }

    // refactor slightly to prevent duplicate deltaX / control button checking in this scenario (just combine the functions)
    scrollWheelZoom(e);
  };

  const handleWheelV = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) return;

    if (contentVRef.current) {
      if (e.deltaY > 0) {
        contentVRef.current.scrollBy(0, 100);
      } else if (e.deltaY < 0) {
        contentVRef.current.scrollBy(0, -100);
      }
    }

    // Would also scroll the entire window if it's scrollable. Make sure it never is, even on browser zoom-in.
  };

  const updateThumbH = useCallback(
    (scrollPositionX: number, updateSize: boolean, updatePosition: boolean) => {
      if (thumbHRef.current) {
        const pageRatioH: number = sizeH / contentFullSizeH;
        const newThumbHOffset: number = Math.round(scrollPositionX * pageRatioH);

        if (updateSize) {
          const maxThumbHSize: number = sizeH - newThumbHOffset;
          const newThumbHSize: number = Math.min(Math.max(Math.ceil(sizeH * pageRatioH), 17), maxThumbHSize);
          thumbHRef.current.style.width = `${newThumbHSize}px`;
        }

        if (updatePosition) thumbHRef.current.style.left = `${newThumbHOffset}px`;
      }
    },
    [sizeH, contentFullSizeH]
  );

  const updateThumbV = useCallback(
    (scrollPositionY: number, updateSize: boolean) => {
      if (thumbVRef.current) {
        const pageRatioV: number = sizeV / contentFullSizeV;
        const newThumbVOffset: number = Math.round(scrollPositionY * pageRatioV);

        if (updateSize) {
          const maxThumbVSize: number = sizeV - newThumbVOffset;
          const newThumbVSize: number = Math.min(Math.max(Math.ceil(sizeV * pageRatioV), 17), maxThumbVSize);
          thumbVRef.current.style.height = `${newThumbVSize}px`;
        }

        thumbVRef.current.style.top = `${newThumbVOffset}px`;
      }
    },
    [sizeV, contentFullSizeV]
  );

  const handleScrollX = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    // Note: Offset will be set twice on the max position zoom-out edge case (regardless of whether handleScrollX or the UE fires first), but it's harmless
    const newScrollPositionX: number = e.currentTarget.scrollLeft;
    updateThumbH(newScrollPositionX, false, true);
  };

  const handleScrollY = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    // Note: Offset will be set twice on the max position track-length-decrease edge case (regardless of whether handleScrollY or the UE fires first), but it's harmless

    const newScrollPositionY: number = e.currentTarget.scrollTop;

    if (contentHeaderRef.current) {
      contentHeaderRef.current.style.top = `${newScrollPositionY}px`;
    }

    updateThumbV(newScrollPositionY, false);
  };

  useEffect(() => {
    if (sizeV && trackViewSettings.length === 1) {
      const defaultTrackZoom: number = 4.717;
      const newTrackViewSettings: TrackViewSetting[] = [...trackViewSettings];

      for (const track of tracks) {
        const { id, minNote, maxNote } = track;

        // TODO: Use constants for these (Keep them consistent across app. Globals? Props? Google/ChatGPT where to put them.)
        const scrollPos: number = minNote >= 0 ? ((87 - ((minNote + maxNote) / 2 - 21)) / 87) * 2112 : 1056;
        const centeredScrollPos: number = scrollPos - sizeV / 2;

        newTrackViewSettings.push({ trackID: id, scrollPos: centeredScrollPos, zoom: defaultTrackZoom });
      }

      setTrackViewSettings(newTrackViewSettings);
    }
  }, [sizeV]);

  useEffect(() => {
    if (contentVRef.current) {
      const currentScrollPositionY: number = contentVRef.current.scrollTop;
      updateThumbV(currentScrollPositionY, true);
    }
  }, [updateThumbV]);

  useLayoutEffect(() => {
    // check if the horizontal content has changed size (can happen due to zoom or a change in the number of measures),
    // or if the view was resized horizontally (such as on window resize)
    if ((prevContentFullSizeHRef.current !== contentFullSizeH || prevSizeHRef.current !== sizeH) && contentHRef.current) {
      const currentScrollPositionX: number = contentHRef.current.scrollLeft;

      if (zoom !== prevZoomRef.current) {
        // user has zoomed in or out

        // update width of horizontal scroll thumb
        updateThumbH(currentScrollPositionX, true, false);

        // calculate scroll position needed to center the view on the start position marker or on the player position marker,
        // depending on whether the song is currently playing and on whether autoscroll is blocked
        const markerCenterPosition: number = Math.floor(
          (isPlaying && !autoscrollBlocked ? scaledPlayerPosition : scaledStartPosition) - sizeH / 2
        );

        // scroll to the centered position
        contentHRef.current.scrollTo(markerCenterPosition, 0); //round?

        // update previous zoom value to match current value
        prevZoomRef.current = zoom;
      } else {
        // update position and width of the horizontal scroll thumb if the view was resized horizontally
        // or if the width of the content has changed due to factors other than zoom (namely, due to a change in the number of measures)
        updateThumbH(currentScrollPositionX, true, true);
      }

      // update previous contentFullSize and sizeH values to match the current values
      prevContentFullSizeHRef.current = contentFullSizeH;
      prevSizeHRef.current = sizeH;
    }
  }, [updateThumbH, contentFullSizeH, sizeH, zoom, isPlaying, scaledPlayerPosition, scaledStartPosition, autoscrollBlocked]);

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

  useEffect(() => {
    if (contentVRef.current && midiEditorTrackID !== nextMidiEditorTrackID) {
      const currScrollPos: number = contentVRef.current.scrollTop;

      const newTrackViewSettings: TrackViewSetting[] = trackViewSettings.map((trackViewSetting) => {
        if (trackViewSetting.trackID === midiEditorTrackID) {
          return { trackID: midiEditorTrackID, scrollPos: currScrollPos, zoom };
        } else {
          // TODO: Does using original object reference like this cause a memory leak? Need deep copy instead?
          return trackViewSetting;
        }
      });

      setMidiEditorTrackID(nextMidiEditorTrackID);
      setTrackViewSettings(newTrackViewSettings);
    }
  }, [nextMidiEditorTrackID, setMidiEditorTrackID, zoom]);

  useLayoutEffect(() => {
    if (contentVRef.current) {
      // find track view settings for the current MIDI Editor track (or for the Track Editor)
      const currTrackViewSetting: TrackViewSetting | undefined = trackViewSettings.find(
        (trackViewSetting) => trackViewSetting.trackID === midiEditorTrackID
      );

      if (currTrackViewSetting) {
        // scroll to the saved scroll position
        contentVRef.current.scrollTop = currTrackViewSetting.scrollPos;

        // zoom to the saved zoom level
        setZoom(currTrackViewSetting.zoom);
      }
    }
  }, [midiEditorTrackID, setZoom]);

  return (
    <>
      <div className="editor-layout">
        <div className="content-panel-header">{childrenArray[0]}</div>
        <div className="content-v" ref={contentVRef} onScroll={handleScrollY}>
          <div className="content-panel" onWheel={handleWheelV}>
            {childrenArray[1]}
          </div>
          <div
            className="content-h"
            ref={contentHRef}
            onScroll={handleScrollX}
            onWheel={scrollWheelZoom}
            onMouseDown={handleMouseDownContent}
          >
            <div className="content-header" ref={contentHeaderRef}>
              <span className="position-marker" style={{ height: sizeV, left: scaledStartPosition }}>
                <svg className="position-marker-head-container">
                  <circle className="position-marker-head" cx="50%" cy="50%" r="50%" />
                </svg>
              </span>
              <span
                className="player-position-marker"
                style={{ height: sizeV, left: scaledPlayerPosition, display: playerPositionMarkerDisplay }}
              >
                <svg className="position-marker-head-container">
                  <circle className="player-position-marker-head" cx="50%" cy="50%" r="50%" />
                </svg>
              </span>
              {childrenArray[2]}
            </div>
            <div className="content-body">{childrenArray[3]}</div>
          </div>
        </div>
        <div className="scrollbar-h" onWheel={handleWheelH} onMouseDown={handleMouseDownH}>
          <div className="scroll-thumb" ref={thumbHRef} />
        </div>
      </div>

      {showScrollbarV && (
        <div className="scrollbar-v" style={{ height: sizeV }} onWheel={handleWheelV} onMouseDown={handleMouseDownV}>
          <div className="scroll-thumb" ref={thumbVRef} />
        </div>
      )}
    </>
  );
};

export default EditorLayout;
