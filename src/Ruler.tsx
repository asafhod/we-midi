type RulerProps = {
  numSegments: number;
  segmentWidth: number;
  measuresPerSegment: number;
  segmentIsBeat: boolean;
  divisions: number;
  markerPatternWidth: number;
  totalWidth: number;
};

const Ruler = ({
  numSegments,
  segmentWidth,
  measuresPerSegment,
  segmentIsBeat,
  divisions,
  markerPatternWidth,
  totalWidth,
}: RulerProps): JSX.Element => {
  return (
    <div className="ruler">
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
    const offset: number = segmentWidth * i;
    let labelNum: number = i * measuresPerSegment + 1;

    if (segmentIsBeat) {
      const beat: number = (i % 4) / 10;
      labelNum = Math.floor(labelNum) + beat;
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
    const offset: number = i * Math.round(markerPatternWidth / divisions) + 1;
    markers.push(<line key={i} x1={offset} y1="75%" x2={offset} y2="100%" stroke="black" strokeWidth="0.6" />);
  }

  return (
    <svg className="ruler-markers" width="100%" height="100%">
      <defs>
        <pattern id="marker-pattern" width={markerPatternWidth} height="100%" patternUnits="userSpaceOnUse">
          <line x1="1" y1="0" x2="1" y2="100%" stroke="black" strokeWidth="0.6" />
          {markers}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#marker-pattern)" />
    </svg>
  );
};

export default Ruler;
