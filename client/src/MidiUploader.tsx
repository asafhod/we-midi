import { Loading } from "./types";
import { FileUploader } from "react-drag-drop-files";

type MidiUploaderProps = {
  setMidiFile: React.Dispatch<React.SetStateAction<File | null>>;
  setLoading: React.Dispatch<React.SetStateAction<Loading>>;
};

const MidiUploader = ({ setMidiFile, setLoading }: MidiUploaderProps): JSX.Element => {
  const handleChange = (file: any) => {
    setLoading((currLoading) => ({ ...currLoading, workspace: false }));
    setMidiFile(file);
  };

  return <FileUploader handleChange={handleChange} types={["MID"]} />;
};

export default MidiUploader;
