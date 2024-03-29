import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

const NewProject = () => {
  const [projectName, setProjectName] = useState("");
  const navigate = useNavigate();

  const createProject = async () => {
    const formattedProjectName: string = projectName.trim();

    if (formattedProjectName) {
      try {
        // get Cognito access token
        const { accessToken } = (await fetchAuthSession()).tokens ?? {};
        if (!accessToken) throw new Error("Invalid Cognito access token");

        // TODO: Change to Production URL once deployed
        const response: Response = await fetch("http://localhost:5000/projects/", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ name: formattedProjectName }),
        });

        const { success, data, msg } = await response.json();

        if (success) {
          // TODO: Why is this not sending the url request after setting it in the browser bar? Or is it, but not connecting the socket for some reason? Or something with the username prop?
          //       Test, just to know. Then just move this entire thing to a separate component outside of Workspace, since all it does is create a project and re-direct to Workspace.
          navigate(`./${data._id}`);
        } else {
          throw new Error(msg || "Invalid response");
        }
      } catch (error) {
        console.error("Error creating project:", error);
      }
    }
  };

  return (
    <div>
      <label>
        Project Name:
        <input
          type="text"
          maxLength={100}
          value={projectName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectName(e.target.value)}
        ></input>
      </label>
      <button type="button" onClick={createProject}>
        Create Project
      </button>
    </div>
  );
};

export default NewProject;
