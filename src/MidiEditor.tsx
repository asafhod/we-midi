import { TrackType } from "./types";
import TrackNote from "./TrackNote";

type MidiEditorProps = {
  track: TrackType;
  height: number; // Currently unused. Needed?
  scaleWidth: number;
};

const MidiEditor = ({ track, scaleWidth }: MidiEditorProps): JSX.Element => {
  const notes: JSX.Element[] = [];

  if (track.notes.length) {
    // const noteRange: number = track.maxNote - track.minNote;
    const noteHeight: number = 24;

    for (const note of track.notes) {
      const noteLeft: number = Math.round(note.noteTime * scaleWidth) + 1;
      const noteWidth: number = Math.round(Number(note.duration) * scaleWidth);
      const noteTop: number = (108 - note.midiNum) * noteHeight;

      notes.push(<TrackNote key={note.noteID} left={noteLeft} top={noteTop} width={noteWidth} height={noteHeight} />);
    }
  }

  return <div className="midi-editor">{notes}</div>;
};

export default MidiEditor;
