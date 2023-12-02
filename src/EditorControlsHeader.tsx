import * as Tone from "tone";
import { SongData, TrackType } from "./types";
import createInstrument from "./instruments/createInstrument";

type EditorControlsHeaderProps = {
  tracks: TrackType[];
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
  midiEditorTrack: TrackType | null | undefined;
  songData: SongData;
  setSongData: React.Dispatch<React.SetStateAction<SongData>>;
};

const EditorControlsHeader = ({
  tracks,
  setTracks,
  midiEditorTrack,
  songData,
  setSongData,
}: EditorControlsHeaderProps): JSX.Element => {
  const maxTracks: number = 100;

  const addTrack = () => {
    // TODO: Also chain the instrument to the panVol and add it to the other tracks list(s)
    if (tracks.length >= maxTracks) {
      alert(`The maximum amount of tracks is ${maxTracks}.`);
    } else {
      const { instrument, instrumentName } = createInstrument("piano");
      const panVol: Tone.PanVol = new Tone.PanVol(0, instrument.volume.value); //later, change vol to -16 and have track vols/pans saved for each song

      const newTrackID: number = songData.lastTrackID + 1;

      const newTrack: TrackType = {
        id: newTrackID,
        name: `Track ${newTrackID}`,
        instrumentName,
        instrument,
        panVol,
        notes: [],
        minNote: 128,
        maxNote: -1,
      };

      setTracks([...tracks, newTrack]);
      setSongData({ ...songData, lastTrackID: newTrackID });

      // TODO: Logic somewhere to scroll to the end after the new track is added
    }
  };

  return (
    <div className="track-controls-header">
      {midiEditorTrack ? (
        <p className="track-controls-header-lbl">{midiEditorTrack.name}</p>
      ) : (
        <>
          <button type="button" className="add-track-btn" onClick={addTrack}>
            +
          </button>
          <p className="track-controls-header-lbl">{"Tracks"}</p>
        </>
      )}
    </div>
  );
};

export default EditorControlsHeader;
