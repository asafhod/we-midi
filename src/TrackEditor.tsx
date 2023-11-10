import * as Tone from "tone";
import { useState, useRef, useContext } from "react";
import TracksContext from "./TracksContext";
import Player from "./Player";
import CustomScroll from "./CustomScroll";
import Ruler from "./Ruler";
import Grid from "./Grid";
import Tracks from "./Tracks";
import TrackControls from "./TrackControls";
import InstrumentControls from "./InstrumentControls";
import MidiEditor from "./MidiEditor";

type TrackEditorProps = {
  numTracks: number;
};

const TrackEditor = ({ numTracks }: TrackEditorProps): JSX.Element => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [startPosition, setStartPosition] = useState(0);
  const [playerPosition, setPlayerPosition] = useState(0);
  const [autoscrollBlocked, setAutoscrollBlocked] = useState(false);
  const [midiEditorTrackID, setMidiEditorTrackID] = useState(-1);
  const [nextMidiEditorTrackID, setNextMidiEditorTrackID] = useState(-1);
  const { tracks } = useContext(TracksContext)!; // TODO: make sure you're getting tracks consistently across components instead of randomly drilling/contexting

  const [zoom, setZoom] = useState(1);

  const [trackHeight, setTrackHeight] = useState(78);

  const zoomInRef = useRef<HTMLButtonElement>(null);
  const zoomOutRef = useRef<HTMLButtonElement>(null);

  const editingMidi: boolean = midiEditorTrackID !== -1;
  const midiEditorHeight: number = 2112;

  // const zoomFactor: number = 1.067;
  const zoomFactor: number = 1.138; // If you actually do increase this, fine tune the Min, Max, and thresholds
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
    if (e.ctrlKey) return;

    if (e.deltaY !== 0) {
      // super jank and slow workaround - see if there's anything more elegant
      // if you just call zoomOut/zoomIn, React fights this at the level of the wheel event, clashing
      // with the zoom useEffect and causing visual artifacts
      const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true, view: window });

      if (e.deltaY > 0 && zoomOutRef.current) {
        zoomOutRef.current.dispatchEvent(clickEvent);
      } else if (e.deltaY < 0 && zoomInRef.current) {
        zoomInRef.current.dispatchEvent(clickEvent);
      }
    }

    if (e.deltaX !== 0) blockAutoscroll();
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
    const target = e.currentTarget as HTMLDivElement;

    const x: number = e.clientX - Math.round(target.getBoundingClientRect().left);

    // prevent position change in scenario where some browsers trigger the click event
    // even if the user clicked outside of the target div by up to a full pixel
    if (x < 0) return;

    const newPosition: number = x / scaleWidth;

    changeStartPosition(newPosition);

    if (alsoChangePlayerPos) {
      changePlayerPosition(newPosition);
    } else {
      blockAutoscroll();
    }
  };

  const blockAutoscroll = () => {
    if (isPlaying && !autoscrollBlocked) setAutoscrollBlocked(true);
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
          autoscrollBlocked={autoscrollBlocked}
          setAutoscrollBlocked={setAutoscrollBlocked}
        />
        <span className="control-block">
          {"Zoom: "}
          <button className="plus-minus-button" type="button" ref={zoomOutRef} onClick={zoomOut}>
            -
          </button>
          <button className="plus-minus-button" type="button" ref={zoomInRef} onClick={zoomIn}>
            +
          </button>
        </span>
        {editingMidi ? (
          <button className="midi-editor-close-btn" onClick={() => setNextMidiEditorTrackID(-1)}>
            Close
          </button>
        ) : (
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
              className="track-sizing-button"
              type="button"
              onClick={() => setTrackHeight(Math.min(trackHeight + 5, trackHeightMax))}
            >
              +
            </button>
          </span>
        )}
      </div>
      <CustomScroll
        contentFullSizeH={totalWidth}
        contentFullSizeV={editingMidi ? midiEditorHeight : allTracksHeight}
        scaledStartPosition={scaledStartPosition}
        scaledPlayerPosition={scaledPlayerPosition}
        isPlaying={isPlaying}
        zoom={zoom}
        scrollWheelZoom={scrollWheelZoom}
        autoscrollBlocked={autoscrollBlocked}
        blockAutoscroll={blockAutoscroll}
        numMeasures={numMeasures}
        midiEditorTrackID={midiEditorTrackID}
        setMidiEditorTrackID={setMidiEditorTrackID}
        nextMidiEditorTrackID={nextMidiEditorTrackID}
      >
        <div className="track-controls-header">
          <p>{editingMidi ? tracks[midiEditorTrackID].name : "Tracks"}</p>
        </div>
        {editingMidi ? (
          <InstrumentControls track={tracks[midiEditorTrackID]} />
        ) : (
          <TrackControls trackHeight={trackHeight} isPlaying={isPlaying} />
        )}
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
        <Grid
          totalHeight={editingMidi ? midiEditorHeight : allTracksHeight}
          totalWidth={totalWidth}
          gridPatternWidth={gridPatternWidth}
          colorPatternWidth={colorPatternWidth}
          divisions={divisions}
          editingMidi={editingMidi}
          onClick={clickChangePosition}
        >
          {editingMidi ? (
            <MidiEditor track={tracks[midiEditorTrackID]} height={midiEditorHeight} scaleWidth={scaleWidth} />
          ) : (
            <Tracks
              numTracks={numTracks}
              trackHeight={trackHeight}
              totalWidth={totalWidth}
              scaleWidth={scaleWidth}
              setNextMidiEditorTrackID={setNextMidiEditorTrackID}
            />
          )}
        </Grid>
      </CustomScroll>
    </>
  );
};

export default TrackEditor;
