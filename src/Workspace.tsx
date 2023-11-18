import * as Tone from "tone";
import { Midi as MidiLoad, MidiJSON, TrackJSON } from "@tonejs/midi";
import { useState, useEffect, useMemo } from "react";
import TracksContext from "./TracksContext";
import { TrackType, NoteType } from "./types";
import createInstrument from "./instruments/createInstrument";
import Player from "./Player";
import EditorLayout from "./EditorLayout";
import Ruler from "./Ruler";
import Grid from "./Grid";
import TrackEditor from "./TrackEditor";
import TrackControls from "./TrackControls";
import InstrumentControls from "./InstrumentControls";
import MidiEditor from "./MidiEditor";

type WorkspaceProps = {
  midiURL: string;
};

const Workspace = ({ midiURL }: WorkspaceProps): JSX.Element => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [startPosition, setStartPosition] = useState(0);
  const [playerPosition, setPlayerPosition] = useState(0);
  const [autoscrollBlocked, setAutoscrollBlocked] = useState(false);
  const [midiEditorTrackID, setMidiEditorTrackID] = useState(0);
  const [nextMidiEditorTrackID, setNextMidiEditorTrackID] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [trackHeight, setTrackHeight] = useState(78);
  const [tracks, setTracks] = useState<TrackType[]>([]); // TODO: make sure you're getting tracks consistently across components

  const zoomFactor: number = 1.21; // Fine-tune the Min, Max, and thresholds?
  const zoomMin: number = 0.104;
  const zoomMax: number = 67.708;
  const widthFactor: number = 76.824;
  const numMeasures: number = 250;
  const midiEditorHeight: number = 2112;
  const trackHeightMin: number = 30;
  const trackHeightMax: number = 200;

  const allTracksHeight: number = tracks.length * trackHeight;
  const segmentIsBeat: boolean = zoom > 2.644;

  let measuresPerSegment: number = 1;
  let divisions: number = 4;

  if (zoom < 0.678) {
    // group measures
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

  const midiEditorTrack: TrackType | null | undefined = useMemo(() => {
    // Also re-calcs every time tracks changes. Any way to limit that so its only if the current track is removed from tracks?
    return midiEditorTrackID !== 0 ? tracks.find((track) => track.id === midiEditorTrackID) : null;
  }, [midiEditorTrackID, tracks]);

  const zoomIn = () => {
    setZoom(Math.min(Math.round(zoom * zoomFactor * 1000) / 1000, zoomMax));
  };

  const zoomOut = () => {
    setZoom(Math.max(Math.round((zoom / zoomFactor) * 1000) / 1000, zoomMin));
  };

  const scrollWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) return;

    if (e.deltaY !== 0) {
      if (e.deltaY > 0) {
        zoomOut();
      } else if (e.deltaY < 0) {
        zoomIn();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Is any of this triggerable before the workspace finishes loading?
    const target = e.target as HTMLElement;

    if (!target.classList.contains("track-name")) {
      e.preventDefault();

      // TODO: Clean up and add min/max constraints, scrolling, and blockAuto scroll. Move elsewhere, if needed for consistent focusing.
      //       Probably just change to a document listener and have those wherever needed, like in Player
      if (e.code === "ArrowRight") {
        setStartPosition((prevStartPos) => prevStartPos + 0.077);
      } else if (e.code === "ArrowLeft") {
        setStartPosition((prevStartPos) => prevStartPos - 0.077);
      } else if (e.code === "ArrowUp" && zoom < zoomMax) {
        zoomIn();
      } else if (e.code === "ArrowDown" && zoom > zoomMin) {
        zoomOut();
      } else if (e.code === "Space") {
        // toggle play
      }
    }
  };

  useEffect(() => {
    // clear it in a cleanup function for unmount and in case url changes (dispose of instruments, volumes, etc.)
    const loadMidi = async (midiURL: string) => {
      const midi: MidiJSON = await MidiLoad.fromUrl(midiURL);
      if (!midi || !Object.keys(midi).length) throw new Error("Cannot schedule notes: Invalid MIDI file");

      console.log(midi);

      // TODO: Retrieve trackIDs from database
      const trackIDs: number[] = [];

      await Tone.start();

      Tone.Transport.PPQ = midi.header.ppq;
      Tone.Transport.bpm.value = midi.header.tempos[0].bpm;

      const tracks: TrackType[] = [];

      for (let i = 1; i < midi.tracks.length; i++) {
        const track: TrackJSON = midi.tracks[i];
        const { instrument, instrumentName } = createInstrument(track.instrument.family, track.instrument.number);

        const panVol: Tone.PanVol = new Tone.PanVol(0, instrument.volume.value); //later, change vol to -16 and have track vols/pans saved for each song

        await Tone.loaded();

        const notes: NoteType[] = [];
        let minNote: number = 128;
        let maxNote: number = -1;

        for (const { name, midi: midiNum, duration, time: noteTime, velocity } of track.notes) {
          const noteID: number = Tone.Transport.schedule((time) => {
            instrument.triggerAttackRelease(name, duration, time, velocity);
          }, noteTime);

          notes.push({ id: noteID, name, midiNum, duration, noteTime, velocity });

          minNote = Math.min(minNote, midiNum);
          maxNote = Math.max(maxNote, midiNum);
        }

        tracks.push({
          id: trackIDs[i - 1] || i,
          name: track.name || `Track ${i - 1}`,
          instrumentName,
          instrument,
          panVol,
          notes,
          minNote,
          maxNote,
        });
      }

      setTracks(tracks);
    };

    try {
      loadMidi(midiURL);
    } catch (error) {
      console.error(error);
    }
  }, [midiURL]);

  return (
    <TracksContext.Provider value={{ tracks, setTracks }}>
      <div className="workspace" tabIndex={0} onKeyDown={(e) => handleKeyDown(e)}>
        {!tracks.length ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="controls-bar">
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
              {midiEditorTrack ? (
                <button className="midi-editor-close-btn" onClick={() => setNextMidiEditorTrackID(0)}>
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
            <EditorLayout
              contentFullSizeH={totalWidth}
              contentFullSizeV={midiEditorTrack ? midiEditorHeight : allTracksHeight}
              startPosition={startPosition}
              playerPosition={playerPosition}
              scaleWidth={scaleWidth}
              isPlaying={isPlaying}
              zoom={zoom}
              setZoom={setZoom}
              scrollWheelZoom={scrollWheelZoom}
              autoscrollBlocked={autoscrollBlocked}
              blockAutoscroll={blockAutoscroll}
              numMeasures={numMeasures}
              tracks={tracks}
              midiEditorTrackID={midiEditorTrackID}
              setMidiEditorTrackID={setMidiEditorTrackID}
              nextMidiEditorTrackID={nextMidiEditorTrackID}
            >
              <div className="track-controls-header">
                <p>{midiEditorTrack ? midiEditorTrack.name : "Tracks"}</p>
              </div>
              {midiEditorTrack ? (
                <InstrumentControls track={midiEditorTrack} />
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
                totalHeight={midiEditorTrack ? midiEditorHeight : allTracksHeight}
                totalWidth={totalWidth}
                zoom={zoom}
                gridPatternWidth={gridPatternWidth}
                divisions={divisions}
                editingMidi={Boolean(midiEditorTrack)}
                onClick={clickChangePosition}
              >
                {midiEditorTrack ? (
                  <MidiEditor track={midiEditorTrack} setTracks={setTracks} scaleWidth={scaleWidth} startPosition={startPosition} />
                ) : (
                  <TrackEditor
                    tracks={tracks}
                    trackHeight={trackHeight}
                    totalWidth={totalWidth}
                    scaleWidth={scaleWidth}
                    setNextMidiEditorTrackID={setNextMidiEditorTrackID}
                  />
                )}
              </Grid>
            </EditorLayout>
          </>
        )}
      </div>
    </TracksContext.Provider>
  );
};

export default Workspace;
