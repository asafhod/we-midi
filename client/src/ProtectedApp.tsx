import { Routes, Route } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { WithAuthenticatorProps, withAuthenticator } from "@aws-amplify/ui-react";
import ProjectsList from "./ProjectsList";
import Workspace from "./Workspace";

// TODO: Test token expiration when app is open. Should redirect to login screen.
const ProtectedApp = ({ signOut, user }: WithAuthenticatorProps) => {
  const navigate = useNavigate();

  const logout = () => {
    if (signOut) {
      navigate("./");
      signOut();
    }
  };

  return (
    <>
      <button type="button" onClick={logout}>
        Logout
      </button>
      {/* TODO: Make the username/logout button look nice. Maybe a dropdown? How do I make Cognito save username case formatting while remaining case insensitive? */}
      {user?.username || "User"}
      <Routes>
        <Route path="/dashboard" element={<ProjectsList userID={user?.userId} />} />
        <Route path="/project" element={<Workspace userID={user?.userId} />} />
        <Route path="/project/:id" element={<Workspace userID={user?.userId} />} />
      </Routes>
    </>
  );
};

export default withAuthenticator(ProtectedApp);
