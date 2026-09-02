import {
  createContext,
  useState,
  useCallback,
  useEffect,
} from "react";

import axiosInstance from "../api/axiosInstance";
import toast from "react-hot-toast";
import socket from "../api/socket";

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);

  const [token, setToken] = useState(() =>
    sessionStorage.getItem("token"),
  );

  // Persist authentication data
  const persistAuth = useCallback((userData, tokenValue) => {
    sessionStorage.setItem("token", tokenValue);
    sessionStorage.setItem("user", JSON.stringify(userData));

    setToken(tokenValue);
    setUser(userData);
  }, []);

  // Register
  const register = useCallback(
    async (name, email, password) => {
      const { data } = await axiosInstance.post("/auth/register", {
        name,
        email,
        password,
      });

      persistAuth(data.user, data.token);

      toast.success("Account created successfully!");

      return data;
    },
    [persistAuth],
  );

  // Login
  const login = useCallback(
    async (email, password) => {
      const { data } = await axiosInstance.post("/auth/login", {
        email,
        password,
      });

      persistAuth(data.user, data.token);

      toast.success(`Welcome back, ${data.user.name}!`);

      return data;
    },
    [persistAuth],
  );

  // Update user information after profile changes
  const updateUser = useCallback((updatedUser) => {
    sessionStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  // ─────────────────────────────────────────────
  // Real-time user/profile updates
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    // Make sure Socket.IO uses the current tab's token.
    socket.auth = {
      token,
    };

    if (!socket.connected) {
      socket.connect();
    }

    const handleUserUpdated = (updatedUser) => {
      // Only update this tab if the event belongs to this user.
      if (!updatedUser?._id || updatedUser._id !== user?._id) {
        return;
      }

      setUser(updatedUser);
      sessionStorage.setItem(
        "user",
        JSON.stringify(updatedUser),
      );
    };

    socket.on("user:updated", handleUserUpdated);

    return () => {
      socket.off("user:updated", handleUserUpdated);
    };
  }, [token, user?._id]);

  // Logout
  const logout = useCallback(() => {
    socket.disconnect();

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setToken(null);
    setUser(null);

    toast.success("Logged out");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;