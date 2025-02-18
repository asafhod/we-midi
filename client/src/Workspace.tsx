import * as Tone from "tone";
import { useState, useLayoutEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import TracksContext from "./TracksContext";
// TODO: Syntax: import type?
import { TrackType, NoteType, SongData, TrackControlType, ProjectUser, Message, Loading } from "./types";
import useMessageRouter from "./useMessageRouter";
// import useLoadSong from "./useLoadSong";
import Player from "./Player";
import EditorLayout from "./EditorLayout";
import Ruler from "./Ruler";
import Grid from "./Grid";
import TrackEditor from "./TrackEditor";
import EditorControlsHeader from "./EditorControlsHeader";
import TrackControls from "./TrackControls";
import InstrumentControls from "./InstrumentControls";
import MidiEditor from "./MidiEditor";
import MidiUploader from "./MidiUploader";
import NewProject from "./NewProject";
import ProjectName from "./ProjectName";

// TODO: Make sure you're using map() where necessary throughout the app instead of pushing to an array
//       Control+F for "= []" and if it should be map() instead, change it. Tempo change logic and list components need this, likely others.

type WorkspaceProps = {
  username: string | undefined;
};

const Workspace = ({ username }: WorkspaceProps): JSX.Element => {
  const { id } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [startPosition, setStartPosition] = useState(0);
  const [playerPosition, setPlayerPosition] = useState(0);
  const [autoscrollBlocked, setAutoscrollBlocked] = useState(false);
  const [nextMidiEditorTrackID, setNextMidiEditorTrackID] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [trackHeight, setTrackHeight] = useState(78);
  const [midiFile, setMidiFile] = useState<File | null>(null);

  // TODO: Get track reordering working with songData's trackIDs or whichever way is best. Index Map? Map instead of tracks Array? Re-order tracks directly?

  // const { loading, setLoading, songData, setSongData, tracks, setTracks, trackControls, setTrackControls, tempo, setTempo } =
  //   useLoadSong(id, midiFile, setMidiFile);

  // TODO: Change loading type back
  const [loading, setLoading] = useState<Loading>({ workspace: true, projectName: false }); // TODO: Move inside useMessageRouter (once you fix MIDI import logic to not have setLoading passed to it)?
  const [disconnected, setDisconnected] = useState(false); // TODO: Move elsewhere?
  // TODO: If you keep trackIDs and trackControls account for them when adding/removing tracks
  const [songData, setSongData] = useState<SongData>({ name: "", tempo: -1, trackIDs: [] }); // TODO: Split into Global and Local
  const [tracks, setTracks] = useState<TrackType[]>([]); // TODO: make sure you're getting tracks consistently across components
  const [trackControls, setTrackControls] = useState<TrackControlType[]>([]);
  const [tempo, setTempo] = useState(String(songData.tempo));
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
  const [childMessage, setChildMessage] = useState<Message>(); // TODO: Change to mouseMessage
  const ws = useMessageRouter(
    id,
    username,
    setChildMessage,
    setLoading,
    setDisconnected,
    setSongData,
    setTracks,
    setTrackControls,
    setTempo,
    setProjectUsers,
    setMidiFile
  );

  // Get rid of this when you implement associated logic
  console.log(midiFile, projectUsers);

  const zoomFactor: number = 1.21; // Fine-tune the Min, Max, and thresholds?
  const zoomMin: number = 0.104; // TODO: Limit so can't be smaller than screen size
  const zoomMax: number = 67.708;
  const numMeasures: number = 250;
  const midiEditorHeight: number = 2112;
  const trackHeightMin: number = 30;
  const trackHeightMax: number = 200;

  const allTracksHeight: number = tracks.length * trackHeight || 100;
  const widthFactor: number = (zoom * 4609.44) / songData.tempo;
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
  const segmentWidth: number = 2 * widthFactor * measuresPerSegment * (120 / songData.tempo);
  const totalWidth: number = Math.ceil(segmentWidth * numSegments);

  const gridPatternWidth: number = segmentIsBeat ? segmentWidth * 4 : segmentWidth;

  const midiEditorTrackID: number = useMemo(() => {
    const projectUser: ProjectUser | undefined = projectUsers.find((pu: ProjectUser) => pu.username === username);
    return projectUser?.currentView ?? 0;
  }, [projectUsers, username]);

  const midiEditorTrack: TrackType | null | undefined = useMemo(() => {
    // Also re-calcs every time tracks changes. Any way to limit that so its only if the current track is removed from tracks?
    // TODO: If track is deleted, need to update the midiEditorTrackID (in projectUsers) to 0?
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

  const changeStartPosition = useCallback(
    (newStartPosition: number) => {
      setStartPosition(newStartPosition);

      if (!isPlaying) {
        Tone.Transport.seconds = newStartPosition;
        setPlayerPosition(newStartPosition);
      }
    },
    [isPlaying]
  );

  const changePlayerPosition = useCallback(
    (newPlayerPosition: number) => {
      if (isPlaying) {
        Tone.Transport.seconds = newPlayerPosition;
        setPlayerPosition(newPlayerPosition);
      }
    },
    [isPlaying]
  );

  const toBeginning = () => {
    changePlayerPosition(0);
    changeStartPosition(0);
  };

  const clickChangePosition = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, alsoChangePlayerPos?: boolean) => {
    const target = e.currentTarget as HTMLDivElement;

    const x: number = e.clientX - Math.round(target.getBoundingClientRect().left);

    // prevent position change in scenario where some browsers trigger the click event
    // even if the user clicked outside of the target div by up to a full pixel
    if (x < 0) return;

    const newPosition: number = x / widthFactor;

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

  const changeTempo = (newTempo: number) => {
    if (newTempo > 0 && newTempo <= 300) {
      setSongData({ ...songData, tempo: newTempo });
    } else {
      setTempo(String(songData.tempo));
    }
  };

  // const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  //   if (!loading.workspace) {
  //     const target = e.target as HTMLElement;

  //     if (!target.classList.contains("track-name") && !target.classList.contains("tempo-input")) {
  //       e.preventDefault();

  //       // TODO: Clean up and add min/max constraints, scrolling, and blockAuto scroll. Move elsewhere, if needed for consistent focusing.
  //       //       Probably just change to a document listener and have those wherever needed, like in Player
  //       if (e.code === "ArrowRight") {
  //         setStartPosition((prevStartPos) => prevStartPos + 0.077);
  //       } else if (e.code === "ArrowLeft") {
  //         setStartPosition((prevStartPos) => prevStartPos - 0.077);
  //       } else if (e.code === "ArrowUp" && zoom < zoomMax) {
  //         zoomIn();
  //       } else if (e.code === "ArrowDown" && zoom > zoomMin) {
  //         zoomOut();
  //       } else if (e.code === "Home") {
  //         toBeginning();
  //       } else if (e.code === "Space") {
  //         // toggle play
  //       }
  //     }
  //   }
  // };

  useLayoutEffect(() => {
    // TODO: Correct zoom settings for other tempos (account for this in TrackViewSettings as well)

    // prevents from running unnecessarily
    if (songData.tempo !== -1 && songData.tempo !== Tone.Transport.bpm.value) {
      const tempoConversionFactor: number = Tone.Transport.bpm.value / songData.tempo;

      // Needlessly shifts the existing notes first. Any way around this? Maybe clearing the entire transport at once here, instead of per note.
      Tone.Transport.bpm.value = songData.tempo;

      const newTracks: TrackType[] = [];

      for (const track of tracks) {
        const newNotes: NoteType[] = [];

        for (const note of track.notes) {
          const { clientNoteID: id, noteID, name, midiNum, duration, noteTime, velocity } = note;

          const newDuration: number = Number(duration) * tempoConversionFactor;
          const newNoteTime: number = noteTime * tempoConversionFactor;

          Tone.Transport.clear(id);

          const newID: number = Tone.Transport.schedule((time) => {
            track.instrument.triggerAttackRelease(name, newDuration, time, velocity);
          }, newNoteTime);

          const newNote: NoteType = {
            clientNoteID: newID,
            noteID,
            name,
            midiNum,
            duration: newDuration,
            noteTime: newNoteTime,
            velocity,
          };
          newNotes.push(newNote);
        }

        const newTrack: TrackType = { ...track, notes: newNotes };
        newTracks.push(newTrack);
      }

      setTracks(newTracks);
      changePlayerPosition(playerPosition * tempoConversionFactor);
      changeStartPosition(startPosition * tempoConversionFactor);
    }
  }, [songData, playerPosition, changePlayerPosition, startPosition, changeStartPosition, tracks, setTracks]);

  return (
    <TracksContext.Provider value={{ username, ws, childMessage, projectUsers, tracks, setTracks }}>
      {/* <div className="workspace" tabIndex={0} onKeyDown={(e) => handleKeyDown(e)}> */}
      <div className="workspace" tabIndex={0}>
        {disconnected ? (
          <div>
            <span>Your session has been disconnected</span>
            <br />
            <a href="/dashboard">Back to Dashboard</a>
          </div>
        ) : loading.workspace ? (
          <p>Loading...</p>
        ) : id ? (
          <>
            <div className="header-bar">
              <a className="dashboard-link" href="/dashboard">
                Back to Dashboard
              </a>
              <ProjectName projectName={songData.name} loading={loading.projectName} setLoading={setLoading} />
            </div>
            <div className="controls-bar">
              <button type="button" className="beginning-button" onClick={toBeginning}>
                {"<<"}
              </button>
              <Player
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                startPosition={startPosition}
                playerPosition={playerPosition}
                setPlayerPosition={setPlayerPosition}
                autoscrollBlocked={autoscrollBlocked}
                setAutoscrollBlocked={setAutoscrollBlocked}
                numMeasures={numMeasures}
              />
              <span className="control-block">
                {"Tempo: "}
                <input
                  type="text"
                  name="tempo-input"
                  className="tempo-input"
                  maxLength={3}
                  value={tempo}
                  onChange={(e) => setTempo(e.target.value)}
                  onBlur={(e) => changeTempo(Number(e.target.value))}
                />
              </span>
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
              widthFactor={widthFactor}
              isPlaying={isPlaying}
              zoom={zoom}
              setZoom={setZoom}
              scrollWheelZoom={scrollWheelZoom}
              autoscrollBlocked={autoscrollBlocked}
              blockAutoscroll={blockAutoscroll}
              tracks={tracks}
              midiEditorTrackID={midiEditorTrackID}
              setProjectUsers={setProjectUsers}
              nextMidiEditorTrackID={nextMidiEditorTrackID}
              setDisconnected={setDisconnected}
            >
              <EditorControlsHeader tracks={tracks} midiEditorTrack={midiEditorTrack} />
              {midiEditorTrack ? (
                <InstrumentControls track={midiEditorTrack} />
              ) : (
                <TrackControls
                  tracks={tracks}
                  setTracks={setTracks}
                  trackControls={trackControls}
                  setTrackControls={setTrackControls}
                  trackHeight={trackHeight}
                  isPlaying={isPlaying}
                />
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
              {tracks.length ? (
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
                    <MidiEditor
                      track={midiEditorTrack}
                      setTracks={setTracks}
                      widthFactor={widthFactor}
                      startPosition={startPosition}
                      setAutoscrollBlocked={setAutoscrollBlocked}
                    />
                  ) : (
                    <TrackEditor
                      tracks={tracks}
                      trackHeight={trackHeight}
                      totalWidth={totalWidth}
                      widthFactor={widthFactor}
                      setNextMidiEditorTrackID={setNextMidiEditorTrackID}
                      setMidiFile={setMidiFile}
                      setAutoscrollBlocked={setAutoscrollBlocked}
                    />
                  )}
                </Grid>
              ) : (
                <MidiUploader setMidiFile={setMidiFile} setLoading={setLoading} />
              )}
            </EditorLayout>
          </>
        ) : (
          <NewProject />
        )}
      </div>
    </TracksContext.Provider>
  );
};

export default Workspace;
