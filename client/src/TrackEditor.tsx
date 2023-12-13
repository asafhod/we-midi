import { useLayoutEffect } from "react";
import { TrackType } from "./types";
import Track from "./Track";

type TrackEditorProps = {
  tracks: TrackType[];
  trackHeight: number;
  totalWidth: number;
  widthFactor: number;
  setNextMidiEditorTrackID: React.Dispatch<React.SetStateAction<number>>;
  setMidiFile: React.Dispatch<React.SetStateAction<File | null>>;
  setAutoscrollBlocked: React.Dispatch<React.SetStateAction<boolean>>;
};

const TrackEditor = ({
  tracks,
  trackHeight,
  totalWidth,
  widthFactor,
  setNextMidiEditorTrackID,
  setAutoscrollBlocked,
}: TrackEditorProps): JSX.Element => {
  // Figure out exactly how to set up the Track components. Redux/ContextAPI may help clarify.
  //   How to prevent all tracks from re-rendering when a single track is edited (none are added/removed)

  const trackComponents: JSX.Element[] = [];

  for (const track of tracks) {
    trackComponents.push(
      <Track
        key={track.id}
        track={track}
        width={totalWidth}
        height={trackHeight}
        widthFactor={widthFactor}
        setNextMidiEditorTrackID={setNextMidiEditorTrackID}
      />
    );
  }

  useLayoutEffect(() => {
    setAutoscrollBlocked(false);
  }, [setAutoscrollBlocked]);

  return <div className="track-editor">{trackComponents}</div>;
};

export default TrackEditor;
