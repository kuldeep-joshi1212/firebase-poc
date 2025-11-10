// app/lib/phoneAuth.ts
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { ensureUserProfile } from "@/app/lib/userProfile";

export const setupRecaptcha = () => {
  if (typeof window === "undefined") return null;
  
  try {
    return new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {
        console.log("reCAPTCHA solved");
      },
    });
  } catch (error) {
    console.error("Error setting up reCAPTCHA:", error);
    return null;
  }
};

export const sendPhoneCode = async (phoneNumber: string, verifier: RecaptchaVerifier) => {
  try {
    const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    return confirmation;
  } catch (error) {
    console.error("Error sending phone code:", error);
    throw error;
  }
};

export const verifyCode = async (confirmation: any, code: string, role: "user" | "admin" | "moderator" = "user") => {
  console.log("verifyCode called with role:", role);
  try {
    const result = await confirmation.confirm(code);
    console.log("Phone verification successful, user:", result.user.uid);
    // Create user profile after phone verification
    const profile = await ensureUserProfile(result.user, role);
    console.log("Profile after ensureUserProfile:", profile);
    return result.user;
  } catch (error) {
    console.error("Error verifying code:", error);
    throw error;
  }
};