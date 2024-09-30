import api from "@/src/common/api";
import { getSession } from "next-auth/react";
import { authConfig } from "./auth";

export async function loginIsRequiredClient() {
    const session = await getSession(authConfig);

    if (!session){
      if (typeof window !== 'undefined') {
        window.location.href = "/auth/signin";
      } else {
        // Handle server-side redirect
        // This will depend on your server-side framework
      }
    }
}
export async function adminPageClient() {
    const session = await getSession(authConfig);

    if (session) {
      const response = await api.signInUser(session.user.email);
      const user = response.data.user;
      if (user.user_type !== "faculty"){
        window.location.href = "/dashboard";
      
      }
  }
}

export async function getUser() {
  const session = await getSession(authConfig);

  if (session) {
    const response = await api.signInUser(session.user.email)
    const user = response.data.user;
    return user;
  }
}
