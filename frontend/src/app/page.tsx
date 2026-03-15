"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  User,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db, googleProvider } from "@/lib/firebase";
import { BrainCircuit } from "lucide-react";

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <main className="flex min-h-screen bg-white dark:bg-[#09090b]">
    <div className="flex w-full flex-col lg:w-1/2 p-6 sm:p-12 relative z-10">
      <div className="flex items-center text-2xl font-serif font-bold italic tracking-tight text-zinc-950 dark:text-zinc-50">
        TaskMinds
      </div>
      <div className="flex-1 flex items-center justify-center">
        {children}
      </div>
    </div>
    <div className="hidden lg:block w-1/2 relative bg-zinc-950">
      <img
        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop"
        alt="Premium background"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-6 right-6 text-white/70 text-sm font-medium">
        @unsplash
      </div>
    </div>
  </main>
);

type AuthMode = "login" | "signup";

export default function Page() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [user, setUser] = useState<User | null>(null);
  const [needsName, setNeedsName] = useState(false);

  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authChecked && user && !needsName) {
      router.replace("/c");
    }
  }, [authChecked, user, needsName, router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setNeedsName(false);
        setAuthChecked(true);
        return;
      }

      const authName = currentUser.displayName ?? "";

      // Fast path: if the user object already has the display name, bypass the DB check
      if (authName) {
        setNeedsName(false);
        setAuthChecked(true);
        return;
      }

      // Slow path: check Firestore just in case they have a name there but not on Auth profile
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        const storedName = userSnap.exists()
          ? userSnap.data().displayName
          : "";
        setNeedsName(!storedName && !authName);
      } catch {
        setNeedsName(!authName);
      } finally {
        setAuthChecked(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const upsertUserProfile = async (currentUser: User, displayName: string) => {
    const ref = doc(db, "users", currentUser.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName,
        provider: currentUser.providerData[0]?.providerId ?? "password",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        ref,
        {
          displayName,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  };

  const handleEmailAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        setUser(cred.user);
        setNeedsName(true);
        setEmail("");
        setPassword("");
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        setUser(cred.user);
        setEmail("");
        setPassword("");
      }
    } catch (authError) {
      setError((authError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const googleName = cred.user.displayName ?? "";
      if (googleName) {
        await upsertUserProfile(cred.user, googleName);
        setNeedsName(false);
      } else {
        setUser(cred.user);
        setNeedsName(true);
      }
    } catch (authError) {
      setError((authError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setError("");
    setLoading(true);

    try {
      const cleanName = name.trim();
      await updateProfile(user, { displayName: cleanName });
      await upsertUserProfile(user, cleanName);
      setNeedsName(false);
      setName("");
    } catch (profileError) {
      setError((profileError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <main className="min-h-screen grid place-items-center bg-white dark:bg-[#09090b]">
        <div className="animate-pulse text-sm text-zinc-500">Checking session...</div>
      </main>
    );
  }

  if (user && needsName) {
    return (
      <LayoutWrapper>
        <div className="w-full max-w-[360px] flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-500/10 mb-6">
            <BrainCircuit className="h-6 w-6 text-pink-500" />
          </div>
          <h1 className="mb-8 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Setup your profile
          </h1>

          <form onSubmit={handleSaveName} className="w-full space-y-4">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Username"
              className="w-full rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-zinc-400 dark:focus:border-zinc-600"
            />
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-[#0a0f1c] dark:bg-zinc-50 py-3 text-sm font-bold text-white dark:text-zinc-950 transition hover:bg-[#121929] dark:hover:bg-zinc-200 disabled:opacity-70"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </form>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="w-full max-w-[360px] flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-500/10 mb-6">
          <BrainCircuit className="h-6 w-6 text-pink-500" />
        </div>
        <h1 className="mb-8 text-[30px] leading-tight font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </h1>

        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent py-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-70"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-6 flex w-full items-center gap-4">
          <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
          <span className="text-[13px] tracking-wide text-zinc-400">or</span>
          <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
        </div>

        <form onSubmit={handleEmailAuth} className="w-full space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email or username"
            className="w-full rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-1 focus:ring-zinc-400"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-zinc-400 dark:focus:border-zinc-600 focus:ring-1 focus:ring-zinc-400"
          />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-[#0a0f1c] dark:bg-zinc-50 py-3 text-[15px] font-semibold text-white dark:text-zinc-950 transition hover:bg-[#121929] dark:hover:bg-zinc-200 disabled:opacity-70"
          >
            Continue
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-zinc-500 px-4">
          By continuing, you agree to our{" "}
          <a href="#" className="underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-300">Terms</a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-300">Privacy Policy</a>
        </p>

        <p className="mt-6 text-center text-[13px] text-zinc-500">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-semibold text-zinc-950 dark:text-zinc-50 underline decoration-zinc-300 dark:decoration-zinc-700 underline-offset-4 hover:decoration-zinc-950 dark:hover:decoration-zinc-50"
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </LayoutWrapper>
  );
}
