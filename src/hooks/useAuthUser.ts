"use client";

import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";

export type AuthUserState = {
  user: User | null;
  loading: boolean;
};

export const useAuthUser = (): AuthUserState => {
  const [state, setState] = useState<AuthUserState>({
    user: null,
    loading: isFirebaseConfigured,
  });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setState({ user: null, loading: false });
      return;
    }
    const unsub = onAuthStateChanged(getFirebaseAuth(), (user) => {
      setState({ user, loading: false });
    });
    return unsub;
  }, []);

  return state;
};
