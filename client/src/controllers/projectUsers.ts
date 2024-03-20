import { Message, ProjectUser } from "../types";

export const colors: string[] = [
  "red",
  "blue",
  "green",
  "purple",
  "orange",
  "yellow",
  "turquoise",
  "burgundy",
  "lightgreen",
  "pink",
  "gold",
];

export const searchUsers = () => {};

export const sortProjectUsers = (projectUsers: ProjectUser[]) => {
  // sort the ProjectUser[] in place alphabetically by username
  return projectUsers.sort((a, b) => {
    if (a.username < b.username) {
      return -1;
    }
    if (a.username > b.username) {
      return 1;
    }
    return 0;
  });
};

export const addProjectUsers = () => {};

export const acceptProjectUser = () => {};

export const updateProjectUsers = () => {};

export const deleteProjectUsers = () => {};

export const deleteProjectUser = () => {};

export const userConnected = (
  ws: WebSocket,
  message: Message,
  username: string | undefined,
  setProjectUsers: React.Dispatch<React.SetStateAction<ProjectUser[]>>
) => {
  try {
    const connectedUsername = message.data.username;

    setProjectUsers((currProjectUsers: ProjectUser[]) => {
      let projectUser: ProjectUser | undefined = currProjectUsers.find((pu: ProjectUser) => pu.username === username);
      if (!projectUser || projectUser.currentView === undefined) throw new Error("Could not retrieve current view");

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({ action: "userCurrentView", data: { trackID: projectUser.currentView, targetUser: connectedUsername } })
        );
      } else {
        throw new Error("WebSocket is not open");
      }

      projectUser = currProjectUsers.find((pu: ProjectUser) => pu.username === connectedUsername);

      if (projectUser) {
        const updatedProjectUser: ProjectUser = { ...projectUser, isOnline: true, currentView: 0 };
        return currProjectUsers.map((pu: ProjectUser) => (pu.username === connectedUsername ? updatedProjectUser : pu));
      }

      return sortProjectUsers([
        ...currProjectUsers,
        {
          username: connectedUsername,
          isProjectAdmin: false,
          isAccepted: false,
          color: colors[10],
          isOnline: true,
          currentView: 0,
          isNotMember: true,
        },
      ]);
    });
  } catch (error) {
    console.error(`Error while handling new user connection: ${error}`);

    // close the connection with Close Code 4400 for generic client-side error
    ws.close(4400);
  }
};

export const userDisconnected = (
  ws: WebSocket,
  message: Message,
  setProjectUsers: React.Dispatch<React.SetStateAction<ProjectUser[]>>
) => {
  try {
    const { username } = message.data;

    setProjectUsers((currProjectUsers: ProjectUser[]) => {
      const projectUser: ProjectUser | undefined = currProjectUsers.find((pu: ProjectUser) => pu.username === username);

      if (projectUser) {
        if (projectUser.isNotMember) return currProjectUsers.filter((pu: ProjectUser) => pu.username !== username);

        const updatedProjectUser: ProjectUser = { ...projectUser };

        delete updatedProjectUser.isOnline;
        delete updatedProjectUser.currentView;

        return currProjectUsers.map((pu: ProjectUser) => (pu.username === username ? updatedProjectUser : pu));
      }

      return [...currProjectUsers];
    });
  } catch (error) {
    console.error(`Error while handling user disconnection: ${error}`);

    // close the connection with Close Code 4400 for generic client-side error
    ws.close(4400);
  }
};

export const userCurrentView = (
  ws: WebSocket,
  message: Message,
  setProjectUsers: React.Dispatch<React.SetStateAction<ProjectUser[]>>
) => {
  try {
    if (message.success) {
      const { source, data } = message;

      if (source) {
        setProjectUsers((currProjectUsers: ProjectUser[]) => {
          let projectUserFound: boolean = false;

          const newProjectUsers: ProjectUser[] = currProjectUsers.map((pu: ProjectUser) => {
            if (pu.username === source) {
              projectUserFound = true;
              return pu.isOnline ? { ...pu, currentView: data.trackID } : pu;
            } else {
              return pu;
            }
          });

          if (!projectUserFound) {
            // if the userCurrentView message arrives prior to workspace initialization, push an entry to projectUsers with the view
            // when the workspace initializes, the entry will be updated with the rest of its corresponding data

            // TODO: Fix unlikely scenario where this wrongly marks a user as online (low priority)
            //       Could possibly happen if a global admin or just-removed ProjectUser changed views right as they disconnected and the messages were somehow received in opposite order
            newProjectUsers.push({
              username: source,
              isProjectAdmin: false,
              isAccepted: false,
              color: colors[10],
              currentView: data.trackID,
              isOnline: true,
            });
          }

          return newProjectUsers;
        });
      }
    } else {
      throw new Error(`Server could not forward Current View message: ${message.msg}`);
    }
  } catch (error) {
    console.error(`Error setting ProjectUser current view: ${error}`);

    // close the connection with Close Code 4400 for generic client-side error
    ws.close(4400);
  }
};

export const userMouse = () => {};

export const chatMessage = () => {};
