import { useState, useRef } from "react";
import * as Tone from "tone";
import Player from "./Player";
import Ruler from "./Ruler";
import TrackList from "./TrackList";

type TrackEditorProps = {
  numTracks: number;
};

const TrackEditor = ({ numTracks }: TrackEditorProps): JSX.Element => {
  const trackEditorRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startPosition, setStartPosition] = useState(0);
  const [playerPosition, setPlayerPosition] = useState(0);

  const [zoom, setZoom] = useState(1);

  const [trackHeight, setTrackHeight] = useState(78);

  const zoomFactor: number = 1.067;
  const zoomMin: number = 0.104;
  const zoomMax: number = 67.708;

  const trackHeightMin: number = 30;
  const trackHeightMax: number = 200;

  const numMeasures: number = 450;
  const widthFactor: number = 76.824;

  const groupMeasures: boolean = zoom < 0.678;
  const segmentIsBeat: boolean = zoom > 2.644;

  let measuresPerSegment: number = 1;
  let divisions: number = 4;

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

  const scaleWidth: number = (zoom * widthFactor) / 2;
  const totalWidth: number = Math.ceil(segmentWidth * numSegments);

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
  };

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
    const target = e.target as HTMLDivElement;

    const x: number = e.clientX - target.getBoundingClientRect().left;
    const newPosition: number = x / scaleWidth;

    changeStartPosition(newPosition);

    if (alsoChangePlayerPos) changePlayerPosition(newPosition);
  };

  const autoscroll = (x: number) => {
    if (trackEditorRef.current) {
      trackEditorRef.current.scrollBy(x, 0);
    }
  };

  return (
    <>
      <div className="track-editor-controls">
        <Player
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          startPosition={startPosition}
          playerPosition={playerPosition}
          setPlayerPosition={setPlayerPosition}
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
        <span className="control-block">
          {"Autoscroll Test: "}
          <button className="plus-minus-button" type="button" onClick={() => autoscroll(-1000)}>
            -
          </button>
          <button className="plus-minus-button" type="button" onClick={() => autoscroll(1000)}>
            +
          </button>
        </span>
      </div>
      <div className="track-editor" ref={trackEditorRef} onWheel={scrollWheelZoom}>
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
        <TrackList
          numTracks={numTracks}
          trackHeight={trackHeight}
          divisions={divisions}
          gridPatternWidth={gridPatternWidth}
          totalWidth={totalWidth}
          scaleWidth={scaleWidth}
          isPlaying={isPlaying}
          startPosition={startPosition}
          playerPosition={playerPosition}
          onClick={clickChangePosition}
        />
      </div>
    </>
  );
};

export default TrackEditor;
