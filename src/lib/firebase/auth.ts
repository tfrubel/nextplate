import {
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { getFirebaseAuth } from "./client";

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

const signInWithProviderSafe = async (
  provider: GoogleAuthProvider | GithubAuthProvider,
) => {
  const auth = getFirebaseAuth();
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (
      code === "auth/popup-blocked" ||
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request"
    ) {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw err;
  }
};

export const signInWithGoogle = () => signInWithProviderSafe(googleProvider);
export const signInWithGithub = () => signInWithProviderSafe(githubProvider);
export const signOutUser = () => signOut(getFirebaseAuth());

export const providerIdFromUser = (
  providerId: string | undefined,
): "google" | "github" => {
  if (providerId === "github.com") return "github";
  return "google";
};
