type RulerProps = {
  zoomFactor: number;
};

const Ruler = ({ zoomFactor }: RulerProps): JSX.Element => {
  const numMeasures: number = 450;
  const measures: JSX.Element[] = [];

  for (let i = 1; i <= numMeasures; i++) {
    measures.push(<Measure key={i} measureNum={i} zoomFactor={zoomFactor} />);
  }

  return (
    <>
      <div>Ruler - Zoom: {zoomFactor}x</div>
      <div>{measures}</div>
    </>
  );
};

type MeasureProps = {
  measureNum: number;
  zoomFactor: number;
};

const Measure = ({ measureNum, zoomFactor }: MeasureProps): JSX.Element => {
  return (
    <>
      <span>{`${measureNum} `}</span>
      {zoomFactor >= 10 && (
        <>
          <span>{`${measureNum}.2 `}</span>
          <span>{`${measureNum}.3 `}</span>
          <span>{`${measureNum}.4 `}</span>
        </>
      )}
    </>
  );
};

export default Ruler;
