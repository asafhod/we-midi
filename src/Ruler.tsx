type RulerProps = {
  zoom: number;
};

const Ruler = ({ zoom }: RulerProps): JSX.Element => {
  const numMeasures: number = 450;
  const measureWidthFactor: number = 6.402;

  let increment: number = 1;

  if (zoom < 0.678) {
    if (zoom > 0.311) {
      increment = 2;
    } else if (zoom > 0.211) {
      increment = 3;
    } else if (zoom > 0.153) {
      increment = 4;
    } else if (zoom > 0.126) {
      increment = 5;
    } else if (zoom > 0.104) {
      increment = 6;
    } else {
      increment = 7;
    }
  }

  const measures: JSX.Element[] = [];
  const measureWidth = Math.round(zoom * measureWidthFactor * increment * 1000) / 1000;

  for (let i = 0; i < numMeasures; i += increment) {
    const measureNum: number = i + 1;
    measures.push(<Measure key={measureNum} measureNum={measureNum} width={measureWidth} />);
  }

  return (
    <div className="ruler">
      <div>{measures}</div>
    </div>
  );
};

type MeasureProps = {
  measureNum: number;
  width: number;
};

const Measure = ({ measureNum, width }: MeasureProps): JSX.Element => {
  const showBeatsCutoff: number = 16.927;

  return (
    <div className="measure" style={{ width: `${width}em` }}>
      <span className="beat">{`${measureNum} `}</span>

      {width >= showBeatsCutoff && (
        <>
          <span className="beat" style={{ left: `${width * 0.25}em` }}>{`${measureNum}.2 `}</span>
          <span className="beat" style={{ left: `${width * 0.5}em` }}>{`${measureNum}.3 `}</span>
          <span className="beat" style={{ left: `${width * 0.75}em` }}>{`${measureNum}.4 `}</span>
        </>
      )}
    </div>
  );
};

export default Ruler;
