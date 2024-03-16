import { Routes, Route } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { WithAuthenticatorProps, withAuthenticator } from "@aws-amplify/ui-react";
import ProjectsList from "./ProjectsList";
import Workspace from "./Workspace";

// TODO: Test token expiration when app is open. Should redirect to login screen.
const ProtectedApp = ({ signOut, user }: WithAuthenticatorProps) => {
  const navigate = useNavigate();

  const logout = () => {
    // TODO: Why doesn't it close the ws on signOut? Only after navigating away, post-signOut.
    if (signOut) {
      navigate("./");
      signOut();
    }
  };

  return (
    <>
      <div className="user-panel">
        {/* TODO: Make the username/logout button look nice. Maybe a dropdown? */}
        {user?.username || "User"}
        <button className="logout-btn" type="button" onClick={logout}>
          Logout
        </button>
      </div>
      <Routes>
        <Route path="/dashboard" element={<ProjectsList username={user?.username} />} />
        <Route path="/project" element={<Workspace username={user?.username} />} />
        <Route path="/project/:id" element={<Workspace username={user?.username} />} />
      </Routes>
    </>
  );
};

export default withAuthenticator(ProtectedApp);
