type RulerProps = {
  numSegments: number;
  segmentWidth: number;
  measuresPerSegment: number;
  segmentIsBeat: boolean;
  divisions: number;
  markerPatternWidth: number;
  totalWidth: number;
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, alsoChangePlayerPos?: boolean) => void;
};

const Ruler = ({
  numSegments,
  segmentWidth,
  measuresPerSegment,
  segmentIsBeat,
  divisions,
  markerPatternWidth,
  totalWidth,
  onClick,
}: RulerProps): JSX.Element => {
  return (
    <div className="ruler" onClick={onClick}>
      <Labling
        numSegments={numSegments}
        segmentWidth={segmentWidth}
        measuresPerSegment={measuresPerSegment}
        segmentIsBeat={segmentIsBeat}
        totalWidth={totalWidth}
      />
      <Markers divisions={divisions} markerPatternWidth={markerPatternWidth} />
    </div>
  );
};

type LablingProps = {
  numSegments: number;
  segmentWidth: number;
  measuresPerSegment: number;
  segmentIsBeat: boolean;
  totalWidth: number;
};

const Labling = ({ numSegments, segmentWidth, measuresPerSegment, segmentIsBeat, totalWidth }: LablingProps): JSX.Element => {
  const segments: JSX.Element[] = [];

  for (let i = 0; i < numSegments; i++) {
    const offset: number = Math.round(segmentWidth * i);
    let labelNum: number = i * measuresPerSegment + 1;

    if (segmentIsBeat) {
      const beat: number = i % 4;
      if (beat !== 0) labelNum = Math.floor(labelNum) + (beat / 10 + 0.1);
    }

    segments.push(
      <span key={i} className="ruler-label" style={{ left: offset }}>
        {labelNum}
      </span>
    );
  }

  return (
    <div className="ruler-labels" style={{ width: totalWidth }}>
      {segments}
    </div>
  );
};

type MarkersProps = {
  divisions: number;
  markerPatternWidth: number;
};

const Markers = ({ divisions, markerPatternWidth }: MarkersProps): JSX.Element => {
  const markers: JSX.Element[] = [];

  for (let i = 1; i < divisions; i++) {
    const offset: number = Math.round((i * markerPatternWidth) / divisions) + 1;
    markers.push(<line key={i} x1={offset} y1="75%" x2={offset} y2="100%" stroke="#a9abad" strokeWidth="0.6" />);
  }

  return (
    <svg className="ruler-markers" width="100%" height="100%">
      <defs>
        <pattern id="marker-pattern" width={markerPatternWidth} height="100%" patternUnits="userSpaceOnUse">
          <line x1="1" y1="0" x2="1" y2="100%" stroke="#898b8d" strokeWidth="0.6" />
          {markers}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#marker-pattern)" />
    </svg>
  );
};

export default Ruler;
