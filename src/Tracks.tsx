import Track from "./Track";

type TracksProps = {
  numTracks: number;
  trackHeight: number;
  totalHeight: number;
  divisions: number;
  gridPatternWidth: number;
  colorPatternWidth: number;
  totalWidth: number;
  scaleWidth: number;
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, alsoChangePlayerPos?: boolean) => void;
  setMidiEditorTrackID: React.Dispatch<React.SetStateAction<number>>;
};

const Tracks = ({
  numTracks,
  trackHeight,
  totalHeight,
  divisions,
  gridPatternWidth,
  colorPatternWidth,
  totalWidth,
  scaleWidth,
  onClick,
  setMidiEditorTrackID,
}: TracksProps): JSX.Element => {
  // Figure out exactly how to set up the Track components. Redux/ContextAPI may help clarify.
  //   How to prevent all tracks from re-rendering when a single track is edited (none are added/removed)

  let trackComponents: JSX.Element[] = [];

  for (let i = 0; i < numTracks; i++) {
    trackComponents[i] = (
      <Track
        key={i}
        trackID={i}
        width={totalWidth}
        height={trackHeight}
        scaleWidth={scaleWidth}
        setMidiEditorTrackID={setMidiEditorTrackID}
      />
    );
  }

  const gridLines: JSX.Element[] = [];

  for (let i = 0; i < divisions; i++) {
    const offset: number = Math.round((i * gridPatternWidth) / divisions) + 1;

    gridLines.push(<line key={i} x1={offset} y1="0" x2={offset} y2="100%" stroke="#32373c" strokeWidth="0.6" />);
  }

  const colorHighlightWidth: number = colorPatternWidth / 2;

  return (
    <div className="tracks-wrapper" style={{ width: totalWidth, height: totalHeight }} onClick={onClick}>
      <svg className="tracks-grid" width="100%" height={totalHeight}>
        <defs>
          <pattern id="grid-pattern" width={gridPatternWidth} height="100%" patternUnits="userSpaceOnUse">
            {gridLines}
          </pattern>
          <pattern id="color-pattern" width={colorPatternWidth} height="100%" patternUnits="userSpaceOnUse">
            <rect width={colorHighlightWidth} height="100%" fill="#00000024" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#color-pattern)" />
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>
      <div className="tracks">{trackComponents}</div>
    </div>
  );
};

export default Tracks;
