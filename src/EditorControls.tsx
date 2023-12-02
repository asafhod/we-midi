import { useRef } from "react";
import * as Tone from "tone";
import { TrackType, TrackVol, SoloTrack } from "./types";
import TrackControls from "./TrackControls";
import InstrumentControls from "./InstrumentControls";

type EditorControlsProps = {
  tracks: TrackType[];
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
  midiEditorTrack: TrackType | null | undefined;
  trackVols: TrackVol[];
  setTrackVols: React.Dispatch<React.SetStateAction<TrackVol[]>>;
  soloTracks: SoloTrack[];
  setSoloTracks: React.Dispatch<React.SetStateAction<SoloTrack[]>>;
  trackHeight: number;
  isPlaying: boolean;
};

const EditorControls = ({
  tracks,
  setTracks,
  midiEditorTrack,
  trackVols,
  setTrackVols,
  soloTracks,
  setSoloTracks,
  trackHeight,
  isPlaying,
}: EditorControlsProps): JSX.Element => {
  const soloChangedRef = useRef(true);

  //   useCallback?
  const removeTrack = (trackID: number) => {
    const track: TrackType | undefined = tracks.find((track) => track.id === trackID);

    if (track) {
      for (const note of track.notes) {
        Tone.Transport.clear(note.id);
      }

      track.panVol.dispose();
      track.instrument.dispose();

      const newTracks: TrackType[] = tracks.filter((track) => track.id !== trackID);

      soloChangedRef.current = true; // TODO: Add condition here to only set it to true if removed track was the only soloed track
      setTracks(newTracks);
      //   TODO: Also remove it from the other tracks array(s)
    } else {
      throw new Error(`Cannot remove track ${trackID}: Not Found`);
    }
  };

  //   useCallback?
  const toggleTrackSolo = (trackID: number) => {
    soloChangedRef.current = true;
    setSoloTracks((prevSoloTracks) => {
      return prevSoloTracks.map((tr) => (tr.id === trackID ? { ...tr, solo: !tr.solo } : tr));
    });
  };

  //   useEffect(() => {
  //     if (soloChangedRef.current) {
  //       // a track has been soloed/unsoloed

  //       // true if one or more of the tracks are soloed
  //       const soloExists: boolean = soloTracks.some((track) => track.solo);

  //       for (const track of tracks) {
  //         // use trackVols instead?
  //         const panVolNode: Tone.PanVol | undefined = track.panVol;

  //         if (panVolNode) {
  //           const trackVol: TrackVol | undefined = trackVols.find((tr) => tr.id === track.id);
  //           const soloTrack: SoloTrack | undefined = soloTracks.find((tr) => tr.id === track.id);

  //           if (!trackVol || !soloTrack) throw new Error("Invalid Track Control settings");

  //           if (soloExists) {
  //             // Unmute track's panVol if the track is soloed, mute it if it is not
  //             panVolNode.volume.value = soloTrack.solo ? trackVol.volume : -Infinity;
  //           } else {
  //             // No track is soloed. Unmute the track's panVol, unless the track has been manually muted in the UI.
  //             panVolNode.volume.value = trackVol.muted ? -Infinity : trackVol.volume;
  //           }
  //         }
  //       }

  //       soloChangedRef.current = false;
  //     }
  //   }, [soloTracks, trackVols, tracks]);

  return (
    <>
      {midiEditorTrack ? (
        <InstrumentControls track={midiEditorTrack} />
      ) : (
        <TrackControls
          tracks={tracks}
          setTracks={setTracks}
          trackVols={trackVols}
          setTrackVols={setTrackVols}
          soloTracks={soloTracks}
          toggleTrackSolo={toggleTrackSolo}
          removeTrack={removeTrack}
          trackHeight={trackHeight}
          isPlaying={isPlaying}
        />
      )}
    </>
  );
};

export default EditorControls;
