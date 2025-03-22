import React from "react";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  githubTokenIsSet: boolean;
  setGitHubTokenIsSet: (value: boolean) => void;
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

interface AuthContextProps extends React.PropsWithChildren {
  initialGithubTokenIsSet?: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children, initialGithubTokenIsSet }: AuthContextProps) {
  const [githubTokenIsSet, setGitHubTokenIsSet] = React.useState(
    !!initialGithubTokenIsSet,
  );
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [username, setUsername] = React.useState<string | null>(null);

  const checkAuthStatus = React.useCallback(async () => {
    try {
      const response = await fetch("/api/auth-status");
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        setUsername(data.username || null);
      } else {
        setIsAuthenticated(false);
        setUsername(null);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
      setUsername(null);
    }
  }, []);

  // Check auth status on initial load
  React.useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUsername(data.username);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/logout", {
        method: "POST",
      });
      setIsAuthenticated(false);
      setUsername(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = React.useMemo(
    () => ({
      githubTokenIsSet,
      setGitHubTokenIsSet,
      isAuthenticated,
      username,
      login,
      logout,
      checkAuthStatus,
    }),
    [
      githubTokenIsSet,
      setGitHubTokenIsSet,
      isAuthenticated,
      username,
      checkAuthStatus,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
}

export { AuthProvider, useAuth };
