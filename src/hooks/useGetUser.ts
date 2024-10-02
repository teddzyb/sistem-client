import { useEffect, useState } from "react";
import { getUser } from "../app/lib/loginClient";

const useGetUser = () => {
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    const user = await getUser();
    setUser(user);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return user;
};

export default useGetUser;
