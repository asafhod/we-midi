import { useState } from "react";
import * as Tone from "tone";
import Player from "./Player";
import Ruler from "./Ruler";
import Tracks from "./Tracks";
import CustomScroll from "./CustomScroll";

type TrackEditorProps = {
  numTracks: number;
};

const TrackEditor = ({ numTracks }: TrackEditorProps): JSX.Element => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [startPosition, setStartPosition] = useState(0);
  const [playerPosition, setPlayerPosition] = useState(0);
  const [autoscrollBlocked, setAutoscrollBlocked] = useState(false);

  const [zoom, setZoom] = useState(1);

  const [trackHeight, setTrackHeight] = useState(78);

  const zoomFactor: number = 1.067;
  const zoomMin: number = 0.104;
  const zoomMax: number = 67.708;

  const allTracksHeight: number = numTracks * trackHeight;
  const trackHeightMin: number = 30;
  const trackHeightMax: number = 200;

  const numMeasures: number = 250;
  const widthFactor: number = 76.824;

  const groupMeasures: boolean = zoom < 0.678;
  const segmentIsBeat: boolean = zoom > 2.644;

  // ------package all zoom logic into one function and reduce to one tree------

  let measuresPerSegment: number = 1;
  let divisions: number = 4;

  // Is there an equation for this? Maybe not. Might just be arbitrary cutoffs.
  if (groupMeasures) {
    if (zoom > 0.311) measuresPerSegment = 2;
    else if (zoom > 0.211) measuresPerSegment = 3;
    else if (zoom > 0.153) measuresPerSegment = 4;
    else if (zoom > 0.126) measuresPerSegment = 5;
    else if (zoom > 0.104) measuresPerSegment = 6;
    else measuresPerSegment = 7;

    divisions = measuresPerSegment;
  } else if (zoom > 1.574) {
    if (segmentIsBeat) measuresPerSegment = 0.25;

    divisions = zoom < 6.996 ? 8 : 16;
  }

  const numSegments: number = Math.ceil(numMeasures / measuresPerSegment);

  const segmentWidth: number = zoom * widthFactor * measuresPerSegment;
  const gridPatternWidth: number = segmentIsBeat ? segmentWidth * 4 : segmentWidth;

  let colorPatternWidthFactor: number = 2;
  if (zoom > 25.541) colorPatternWidthFactor = 0.125;
  else if (zoom > 13.352) colorPatternWidthFactor = 0.25;
  else if (zoom > 6.543) colorPatternWidthFactor = 0.5;
  else if (zoom > 3.206) colorPatternWidthFactor = 1;

  const colorPatternWidth: number = gridPatternWidth * colorPatternWidthFactor;

  // ----------------------------------------------------

  const scaleWidth: number = (zoom * widthFactor) / 2;
  const totalWidth: number = Math.ceil(segmentWidth * numSegments);

  const scaledStartPosition: number = Math.round(startPosition * scaleWidth);
  const scaledPlayerPosition: number = Math.round(playerPosition * scaleWidth);

  const zoomIn = () => {
    setZoom(Math.min(Math.round(zoom * zoomFactor * 1000) / 1000, zoomMax));
  };

  const zoomOut = () => {
    setZoom(Math.max(Math.round((zoom / zoomFactor) * 1000) / 1000, zoomMin));
  };

  const scrollWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY > 0) {
      zoomOut();
    } else if (e.deltaY < 0) {
      zoomIn();
    }

    if (e.deltaX !== 0) blockAutoscroll();

    // console.log(trackEditorRef.current?.scrollTop);
  };

  // const handleScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
  //   // const scrollLeft: number = e.currentTarget.scrollLeft;
  //   // const scrollTop: number = e.currentTarget.scrollTop;

  //   // setScrollPositionX((prevScrollPositionX) => {
  //   //   return prevScrollPositionX === scrollLeft ? prevScrollPositionX : scrollLeft;
  //   // });

  //   // setScrollPositionY((prevScrollPositionY) => {
  //   //   return prevScrollPositionY === scrollTop ? prevScrollPositionY : scrollTop;
  //   // });

  //   if (scrollPositionX !== e.currentTarget.scrollLeft) setScrollPositionX(e.currentTarget.scrollLeft);

  //   if (scrollPositionY !== e.currentTarget.scrollTop) setScrollPositionY(e.currentTarget.scrollTop);
  // };

  const changeStartPosition = (newStartPosition: number) => {
    setStartPosition(newStartPosition);

    if (!isPlaying) {
      Tone.Transport.seconds = newStartPosition;
      setPlayerPosition(newStartPosition);
    }
  };

  const changePlayerPosition = (newPlayerPosition: number) => {
    if (isPlaying) {
      Tone.Transport.seconds = newPlayerPosition;
      setPlayerPosition(newPlayerPosition);
    }
  };

  const clickChangePosition = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, alsoChangePlayerPos?: boolean) => {
    const target = e.currentTarget as HTMLDivElement;

    const x: number = e.clientX - target.getBoundingClientRect().left;
    const newPosition: number = x / scaleWidth;

    changeStartPosition(newPosition);

    if (alsoChangePlayerPos) {
      changePlayerPosition(newPosition);
    } else {
      blockAutoscroll();
    }
  };

  // const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, targetButton: number) => {
  //   if (e.button === targetButton) blockAutoscroll();
  // };

  const blockAutoscroll = () => {
    if (isPlaying && !autoscrollBlocked) setAutoscrollBlocked(true);
  };

  // useEffect(() => {
  //   if (trackEditorRef.current) {
  //     const blockWheelScroll = (e: WheelEvent) => {
  //       e.preventDefault(); // prevent wheel from scrolling vertically
  //     };

  //     trackEditorRef.current.addEventListener("wheel", blockWheelScroll, { passive: false });

  //     // proper pratice with conditional like this?
  //     return trackEditorRef.current.removeEventListener("wheel", blockWheelScroll);
  //   }
  // }, []);

  // useEffect(() => {
  //   if (trackEditorRef.current && trackEditorRef.current.scrollLeft !== scrollPositionX) {
  //     // scroll smoothly if scroll thumb is larger than roughly half the scroll bar
  //     // this makes the thumb's motion clearer for the user
  //     const scrollOptions: ScrollToOptions = { left: scrollPositionX };
  //     if (editorWidth / totalWidth > 0.49) scrollOptions.behavior = "smooth";
  //     trackEditorRef.current.scrollTo(scrollOptions);
  //   }
  // }, [scrollPositionX, editorWidth, totalWidth]);

  // useEffect(() => {
  //   if (trackEditorRef.current && trackEditorRef.current.scrollTop !== scrollPositionY) {
  //     console.log("In useEffect. State is " + scrollPositionY + " and scroll is " + trackEditorRef.current.scrollTop);
  //     trackEditorRef.current.scrollTop = scrollPositionY;
  //   }
  // }, [scrollPositionY]);

  return (
    <>
      <div className="track-editor-controls">
        <Player
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          startPosition={startPosition}
          playerPosition={playerPosition}
          setPlayerPosition={setPlayerPosition}
          autoscrollBlocked={autoscrollBlocked}
          setAutoscrollBlocked={setAutoscrollBlocked}
        />
        <span className="control-block">
          {"Zoom: "}
          <button className="plus-minus-button" type="button" onClick={zoomOut}>
            -
          </button>
          <button className="plus-minus-button" type="button" onClick={zoomIn}>
            +
          </button>
        </span>
        <span className="control-block">
          {"Track Height: "}
          <button
            className="plus-minus-button"
            type="button"
            onClick={() => setTrackHeight(Math.max(trackHeight - 5, trackHeightMin))}
          >
            -
          </button>
          <button
            className="plus-minus-button"
            type="button"
            onClick={() => setTrackHeight(Math.min(trackHeight + 5, trackHeightMax))}
          >
            +
          </button>
        </span>
      </div>
      <CustomScroll
        contentFullSizeH={totalWidth}
        contentFullSizeV={allTracksHeight}
        scaledStartPosition={scaledStartPosition}
        scaledPlayerPosition={scaledPlayerPosition}
        isPlaying={isPlaying}
        scrollWheelZoom={scrollWheelZoom}
        autoscrollBlocked={autoscrollBlocked}
        blockAutoscroll={blockAutoscroll}
      >
        <div className="track-list-header">
          <p>test-header</p>
        </div>
        <div className="track-list" style={{ height: allTracksHeight }}>
          <p>test-list</p>
        </div>

        <Ruler
          numSegments={numSegments}
          segmentWidth={segmentWidth}
          measuresPerSegment={measuresPerSegment}
          segmentIsBeat={segmentIsBeat}
          divisions={divisions}
          markerPatternWidth={gridPatternWidth}
          totalWidth={totalWidth}
          onClick={(e) => clickChangePosition(e, true)}
        />
        <Tracks
          numTracks={numTracks}
          trackHeight={trackHeight}
          totalHeight={allTracksHeight}
          divisions={divisions}
          gridPatternWidth={gridPatternWidth}
          colorPatternWidth={colorPatternWidth}
          totalWidth={totalWidth}
          scaleWidth={scaleWidth}
          onClick={clickChangePosition}
        />
      </CustomScroll>
    </>
  );
};

export default TrackEditor;
