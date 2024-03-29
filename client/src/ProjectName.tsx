import { useState, useEffect, useRef, useContext } from "react";
import { Loading } from "./types";
import TracksContext from "./TracksContext";
import editIcon from "./assets/icons/edit.svg";
import { ReactComponent as WaitingIcon } from "./assets/icons/loading.svg";

type ProjectNameProps = {
  projectName: string;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<Loading>>;
};

const ProjectName = ({ projectName, loading, setLoading }: ProjectNameProps): JSX.Element => {
  const [editing, setEditing] = useState(false);

  return (
    <>
      {editing || loading ? (
        <ProjectNameEditor
          projectName={projectName}
          editing={editing}
          setEditing={setEditing}
          loading={loading}
          setLoading={setLoading}
        />
      ) : (
        <span className="project-name-container">
          <span className="project-name">{projectName}</span>
          <img
            className="project-name-edit-btn"
            onClick={() => setEditing(true)}
            src={editIcon}
            alt="Edit Project Name"
            height="20px"
            width="20px"
          />
        </span>
      )}
    </>
  );
};

type ProjectNameEditorProps = {
  projectName: string;
  editing: boolean;
  setEditing: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<Loading>>;
};

const ProjectNameEditor = ({ projectName, editing, setEditing, loading, setLoading }: ProjectNameEditorProps): JSX.Element => {
  const [newProjectName, setNewProjectName] = useState(projectName);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const { ws } = useContext(TracksContext)!;

  useEffect(() => {
    if (nameInputRef.current) nameInputRef.current.focus();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: Event) => {
      if (!containerRef.current || !containerRef.current.contains(e.target as Node)) {
        const formattedNewProjectName: string = nameInputRef.current ? nameInputRef.current.value.trim() : "";

        if (formattedNewProjectName && formattedNewProjectName !== projectName && ws && ws.readyState === WebSocket.OPEN) {
          setLoading((currLoading) => ({ ...currLoading, projectName: true }));
          try {
            ws.send(JSON.stringify({ action: "updateProject", data: { name: formattedNewProjectName } }));
          } catch (error) {
            console.error(`Error updating project name: ${error}`);
            setLoading((currLoading) => ({ ...currLoading, projectName: false }));
          }
        }

        setEditing(false);
      }
    };

    if (editing) document.addEventListener("mousedown", handleOutsideClick);

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [projectName, ws, editing, loading, setEditing, setLoading]);

  return (
    <span className="project-name-editor-container" ref={containerRef}>
      <input
        ref={nameInputRef}
        type="text"
        name="project-name-input"
        className="project-name-input"
        maxLength={45}
        value={newProjectName}
        onChange={(e) => setNewProjectName(e.target.value)}
        readOnly={loading}
      />

      {loading && (
        // TODO: Color it blue
        <WaitingIcon className="project-name-waiting-icon" aria-label="Project Name Updating" />
      )}
    </span>
  );
};

export default ProjectName;
