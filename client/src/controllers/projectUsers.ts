import { Message, ProjectUser } from "../types";

export const searchUsers = () => {};

export const addProjectUsers = () => {};

export const acceptProjectUser = () => {};

export const updateProjectUsers = () => {};

export const deleteProjectUsers = () => {};

export const deleteProjectUser = () => {};

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

export const userConnected = (
  ws: WebSocket,
  message: Message,
  setProjectUsers: React.Dispatch<React.SetStateAction<ProjectUser[]>>
) => {
  try {
    const { username } = message.data;

    setProjectUsers((currProjectUsers: ProjectUser[]) => {
      const projectUser: ProjectUser | undefined = currProjectUsers.find((pu: ProjectUser) => pu.username === username);

      if (projectUser) {
        const updatedProjectUser: ProjectUser = { ...projectUser, isOnline: true };
        return currProjectUsers.map((pu: ProjectUser) => (pu.username === username ? updatedProjectUser : pu));
      }

      return sortProjectUsers([
        ...currProjectUsers,
        { username, isProjectAdmin: false, isAccepted: false, isOnline: true, isNotMember: true },
      ]);
    });
  } catch (error) {
    console.error(`Error setting ProjectUser as online: ${error}`);

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

        const updatedProjectUser: ProjectUser = { ...projectUser, isOnline: false };
        return currProjectUsers.map((pu: ProjectUser) => (pu.username === username ? updatedProjectUser : pu));
      }

      return [...currProjectUsers];
    });
  } catch (error) {
    console.error(`Error setting ProjectUser as offline: ${error}`);

    // close the connection with Close Code 4400 for generic client-side error
    ws.close(4400);
  }
};

export const userCurrentView = () => {};

export const userMouse = () => {};

export const chatMessage = () => {};
