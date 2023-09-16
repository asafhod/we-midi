import { useEffect } from "react";
import * as Tone from "tone";

type playerProps = {
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  startPosition: number;
  playerPosition: number;
  setPlayerPosition: React.Dispatch<React.SetStateAction<number>>;
  autoscrollBlocked: boolean;
  setAutoscrollBlocked: React.Dispatch<React.SetStateAction<boolean>>;
};

const Player = ({
  isPlaying,
  setIsPlaying,
  startPosition,
  playerPosition,
  setPlayerPosition,
  autoscrollBlocked,
  setAutoscrollBlocked,
}: playerProps): JSX.Element => {
  const formatPositionBars = (position: number) => {
    const posBars: string = Tone.TransportTime(position).toBarsBeatsSixteenths();
    const [whole] = posBars.split(".");
    const [measures, beats] = whole.split(":");

    return `${Number(measures) + 1} bar ${Number(beats) + 1} beat`;
  };

  const formatPosition = (position: number): string => {
    const posRoundedToSec: number = Math.round(position);

    const minutes: number = Math.floor(posRoundedToSec / 60);
    const seconds: number = posRoundedToSec % 60;

    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const togglePlay = () => {
    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.seconds = startPosition;
      setIsPlaying(false);
      setPlayerPosition(startPosition);
      console.log("s", startPosition);

      if (autoscrollBlocked) setAutoscrollBlocked(false);
    } else {
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    Tone.Transport.scheduleRepeat((time) => {
      Tone.Draw.schedule(() => setPlayerPosition(Math.max(Tone.Transport.seconds - 0.085, 0)), time); // offset is compromise between desktop and mobile
      console.log("u", Tone.Transport.seconds - 0.085);
    }, "32n");
    // clear it in a cleanup function?
  }, [setPlayerPosition]);

  return (
    <>
      <button type="button" className="play-button" onClick={togglePlay}>
        {isPlaying ? "Stop" : "Play"}
      </button>
      {`${formatPosition(playerPosition)} / ${formatPositionBars(playerPosition)}`}
    </>
  );
};

export default Player;
