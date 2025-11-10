// app/lib/auth.ts
import { 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut,
    onAuthStateChanged,
    User
  } from "firebase/auth";
  import { auth } from "@/app/lib/firebase";
  import { ensureUserProfile } from "@/app/lib/userProfile";
  
  export const signInWithGoogle = async (role: "user" | "admin" | "moderator" = "user") => {
    console.log("signInWithGoogle called with role:", role);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Google sign-in successful, user:", result.user.uid);
      // Create user profile if it doesn't exist
      const profile = await ensureUserProfile(result.user, role);
      console.log("Profile after ensureUserProfile:", profile);
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };
  
  export const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };