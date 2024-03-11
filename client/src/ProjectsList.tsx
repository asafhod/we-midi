import { useState, useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

type Projects = {
  member: JSX.Element[];
  invited: JSX.Element[];
};

const ProjectsList = (): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Projects>({ member: [], invited: [] });

  useEffect(() => {
    const acceptInvite = async (_id: string, name: string) => {
      try {
        // get Cognito access token
        const { accessToken } = (await fetchAuthSession()).tokens ?? {};
        if (!accessToken) throw new Error("Invalid Cognito access token");

        const username: string = String(accessToken.payload["username"] ?? "");
        if (!username) throw new Error("Could not get Cognito username");

        // TODO: Change to Production URL once deployed
        const response: Response = await fetch(`http://localhost:5000/projectUsers/${_id}/${username}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const { success, data, msg } = await response.json();

        if (success) {
          setProjects((currProjects: Projects) => {
            const invitedProjects: JSX.Element[] = currProjects.invited.filter((project: JSX.Element) => project.key !== _id);

            const memberProjects: JSX.Element[] = [...currProjects.member];
            memberProjects.push(
              <MemberProject
                key={_id}
                _id={_id}
                name={name}
                isProjectAdmin={data.isProjectAdmin}
                leaveProject={leaveProject}
                deleteProject={deleteProject}
              />
            );

            return { member: memberProjects, invited: invitedProjects };
          });
        } else {
          throw new Error(msg || "Invalid response");
        }
      } catch (error) {
        console.error("Error accepting project invite:", error);
      }
    };

    const leaveProject = async (_id: string, isAccepted: boolean) => {
      // TODO: Prevent showing leave option if user is the only accepted projectAdmin? Refresh on error? Or always display and show message?
      try {
        // get Cognito access token
        const { accessToken } = (await fetchAuthSession()).tokens ?? {};
        if (!accessToken) throw new Error("Invalid Cognito access token");

        const username: string = String(accessToken.payload["username"] ?? "");
        if (!username) throw new Error("Could not get Cognito username");

        // TODO: Change to Production URL once deployed
        const response: Response = await fetch(`http://localhost:5000/projectUsers/${_id}/${username}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.status === 204) {
          setProjects((currProjects: Projects) => {
            if (isAccepted) {
              const memberProjects: JSX.Element[] = currProjects.member.filter((project: JSX.Element) => project.key !== _id);
              return { ...currProjects, member: memberProjects };
            } else {
              const invitedProjects: JSX.Element[] = currProjects.invited.filter((project: JSX.Element) => project.key !== _id);
              return { ...currProjects, invited: invitedProjects };
            }
          });
        } else {
          const { msg } = await response.json();
          throw new Error(msg || "Invalid response");
        }
      } catch (error) {
        console.error("Error leaving project:", error);
      }
    };

    const deleteProject = async (_id: string) => {
      try {
        // get Cognito access token
        const { accessToken } = (await fetchAuthSession()).tokens ?? {};
        if (!accessToken) throw new Error("Invalid Cognito access token");

        // TODO: Change to Production URL once deployed
        const response: Response = await fetch(`http://localhost:5000/projects/${_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.status === 204) {
          setProjects((currProjects: Projects) => {
            const memberProjects: JSX.Element[] = currProjects.member.filter((project: JSX.Element) => project.key !== _id);
            return { ...currProjects, member: memberProjects };
          });
        } else {
          const { msg } = await response.json();
          throw new Error(msg || "Invalid response");
        }
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    };

    const fetchProjects = async () => {
      try {
        // get Cognito access token
        const { accessToken } = (await fetchAuthSession()).tokens ?? {};
        if (!accessToken) throw new Error("Invalid Cognito access token");

        // TODO: Change to Production URL once deployed
        const response: Response = await fetch("http://localhost:5000/projects", {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const { success, data, msg } = await response.json();

        if (success) {
          const memberProjects: JSX.Element[] = [];
          const invitedProjects: JSX.Element[] = [];

          for (const project of data) {
            const { _id, name, isProjectAdmin, isAccepted } = project;

            if (isAccepted) {
              memberProjects.push(
                <MemberProject
                  key={_id}
                  _id={_id}
                  name={name}
                  isProjectAdmin={isProjectAdmin}
                  leaveProject={leaveProject}
                  deleteProject={deleteProject}
                />
              );
            } else {
              invitedProjects.push(
                <InvitedProject key={_id} _id={_id} name={name} acceptInvite={acceptInvite} leaveProject={leaveProject} />
              );
            }
          }

          setProjects({ member: memberProjects, invited: invitedProjects });
          setLoading(false);
        } else {
          throw new Error(msg || "Invalid response");
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return loading ? (
    <p>Loading...</p>
  ) : (
    <>
      <h3>Projects</h3>
      <ul className="projects-list">
        <li>
          <a href="./project/">New Project</a>
        </li>
        {projects.member}
      </ul>
      <h3>Invitations</h3>
      <ul className="projects-list">{projects.invited}</ul>
    </>
  );
};

type MemberProjectProps = {
  _id: string;
  name: string;
  isProjectAdmin: boolean;
  leaveProject: (_id: string, isAccepted: boolean) => Promise<void>;
  deleteProject: (_id: string) => Promise<void>;
};

const MemberProject = ({ _id, name, isProjectAdmin, leaveProject, deleteProject }: MemberProjectProps): JSX.Element => {
  return (
    <li>
      <a href={`./project/${_id}`}>{name}</a>
      <button type="button" onClick={() => leaveProject(_id, true)}>
        Leave
      </button>
      {isProjectAdmin && (
        <>
          <span>{" - ADMIN: "}</span>
          <button type="button" onClick={() => deleteProject(_id)}>
            Delete
          </button>
        </>
      )}
    </li>
  );
};

type InvitedProjectProps = {
  _id: string;
  name: string;
  acceptInvite: (_id: string, name: string) => Promise<void>;
  leaveProject: (_id: string, isAccepted: boolean) => Promise<void>;
};

const InvitedProject = ({ _id, name, acceptInvite, leaveProject }: InvitedProjectProps): JSX.Element => {
  return (
    <li>
      {name}
      <button type="button" onClick={() => acceptInvite(_id, name)}>
        Accept
      </button>
      <button type="button" onClick={() => leaveProject(_id, false)}>
        Decline
      </button>
    </li>
  );
};

export default ProjectsList;
