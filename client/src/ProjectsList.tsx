type ProjectsListProps = {
  userID: string | undefined;
};

const ProjectsList = ({ userID }: ProjectsListProps): JSX.Element => {
  return (
    <>
      <p>{userID}</p>
      <ul className="projects-list">
        <li>
          <a href="./project/">New Project</a>
        </li>
        <li>
          <a href="./project/1">Project 1</a>
        </li>
        <li>
          <a href="./project/2">Project 2</a>
        </li>
      </ul>
    </>
  );
};

export default ProjectsList;
