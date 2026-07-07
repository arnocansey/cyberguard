export const getTokenPayload = () => {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    const base64 = token.split(".")[1];
    if (!base64) return null;
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

export const getCurrentRole = () => getTokenPayload()?.role || null;
export const isAdmin = () => getCurrentRole() === "ADMIN";
export const isAnalyst = () => getCurrentRole() === "SECURITY_ANALYST";
