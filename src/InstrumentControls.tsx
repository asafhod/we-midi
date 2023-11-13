import { useMemo } from "react";
import { TrackType } from "./types";
import { noteNames, drumsNoteNames } from "./noteNames";

type InstrumentControlsProps = {
  track: TrackType;
};

const InstrumentControls = ({ track }: InstrumentControlsProps) => {
  const playNote = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const target = e.target as HTMLDivElement;
    const noteName: string | undefined = target.dataset.note;

    if (noteName) {
      track.instrument.triggerAttackRelease(noteName, 0.35);
      //   track.instrument.triggerAttackRelease(noteName, 0.25, time, velocity);
    }
  };

  const instrumentNotes: JSX.Element[] = useMemo(() => {
    const instrumentNotes: JSX.Element[] = [];
    const isDrums: boolean = track.instrumentName === "drums";

    for (let i = 87; i >= 0; i--) {
      const noteName: string = noteNames[i];
      const isSharp: boolean = noteName.length === 3;

      instrumentNotes.push(
        <div key={i} className={isSharp ? "instrument-note-sharp" : "instrument-note"} data-note={noteName}>
          {isDrums ? drumsNoteNames[i] : noteName}
        </div>
      );
    }

    return instrumentNotes;
  }, []); // Deps?

  return (
    <div className="instrument-controls" onClick={(e) => playNote(e)}>
      {instrumentNotes}
    </div>
  );
};

export default InstrumentControls;
