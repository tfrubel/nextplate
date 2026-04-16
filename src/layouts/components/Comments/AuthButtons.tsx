"use client";

import {
  signInWithGithub,
  signInWithGoogle,
  signOutUser,
} from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { useState } from "react";
import { FaGithub, FaGoogle } from "react-icons/fa";

type Props = {
  user: User | null;
  providers: string[];
};

const AuthButtons = ({ user, providers }: Props) => {
  const [busy, setBusy] = useState<null | "google" | "github" | "signout">(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: "google" | "github" | "signout") => {
    setError(null);
    setBusy(action);
    try {
      if (action === "google") await signInWithGoogle();
      else if (action === "github") await signInWithGithub();
      else await signOutUser();
    } catch (err) {
      setError((err as Error).message ?? "Authentication failed");
    } finally {
      setBusy(null);
    }
  };

  if (user) {
    return (
      <div className="flex items-center justify-between rounded bg-light p-4 dark:bg-darkmode-light">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={user.displayName ?? "avatar"}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-semibold text-white dark:bg-darkmode-primary dark:text-text-dark">
              {(user.displayName ?? "A").charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <p className="m-0 font-semibold text-text-dark dark:text-darkmode-text-light">
              {user.displayName ?? "Anonymous"}
            </p>
            <p className="m-0 text-xs text-text dark:text-darkmode-text">
              Signed in
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => run("signout")}
          disabled={busy === "signout"}
          className="btn btn-sm btn-outline-primary"
        >
          {busy === "signout" ? "Signing out…" : "Sign out"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded bg-light p-6 dark:bg-darkmode-light">
      <p className="mb-4 text-center text-text-dark dark:text-darkmode-text-light">
        Sign in to join the discussion
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {providers.includes("google") && (
          <button
            type="button"
            onClick={() => run("google")}
            disabled={busy === "google"}
            className="btn btn-sm btn-outline-primary inline-flex items-center gap-2"
          >
            <FaGoogle />
            {busy === "google" ? "Signing in…" : "Continue with Google"}
          </button>
        )}
        {providers.includes("github") && (
          <button
            type="button"
            onClick={() => run("github")}
            disabled={busy === "github"}
            className="btn btn-sm btn-outline-primary inline-flex items-center gap-2"
          >
            <FaGithub />
            {busy === "github" ? "Signing in…" : "Continue with GitHub"}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-3 text-center text-sm text-[#DB2C23]">{error}</p>
      )}
    </div>
  );
};

export default AuthButtons;
