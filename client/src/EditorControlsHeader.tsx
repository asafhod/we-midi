import * as Tone from "tone";
import { TrackType } from "./types";
import createInstrument from "./instruments/createInstrument";

type EditorControlsHeaderProps = {
  tracks: TrackType[];
  setTracks: React.Dispatch<React.SetStateAction<TrackType[]>>;
  midiEditorTrack: TrackType | null | undefined;
};

const EditorControlsHeader = ({ tracks, setTracks, midiEditorTrack }: EditorControlsHeaderProps): JSX.Element => {
  const maxTracks: number = 100;

  const addTrack = async () => {
    try {
      // TODO: Also chain the instrument to the panVol and add it to the other tracks list(s)
      if (tracks.length >= maxTracks) {
        alert(`The maximum amount of tracks is ${maxTracks}.`);
      } else {
        const instrument = createInstrument("p");
        const panVol: Tone.PanVol = new Tone.PanVol(0, instrument.volume.value); //later, change vol to -16 and have track vols/pans saved for each song
        // chain
        await Tone.loaded();

        // TODO: Fix trackID logic. Should come from the server.
        const newTrack: TrackType = {
          id: 999,
          name: `Track ${999}`,
          instrumentName: "p",
          instrument,
          panVol,
          notes: [],
          minNote: 128,
          maxNote: -1,
        };

        setTracks([...tracks, newTrack]);

        // TODO: Logic somewhere to scroll to the end after the new track is added
      }
    } catch (error) {
      console.log(error);
      // TODO: Dispose of instrument and panVol?
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
