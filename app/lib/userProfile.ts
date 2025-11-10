// app/lib/userProfile.ts
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { User } from "firebase/auth";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  role: "user" | "admin" | "moderator"; // Define your roles here
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// Create user profile in Firestore
export const createUserProfile = async (user: User, role: "user" | "admin" | "moderator" = "user") => {
  console.log("Creating user profile with role:", role, "for user:", user.uid);
  
  // Ensure role is valid
  if (!["user", "admin", "moderator"].includes(role)) {
    console.warn("Invalid role provided, defaulting to 'user':", role);
    role = "user";
  }
  
  const userProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    phoneNumber: user.phoneNumber,
    role: role, // This is the key field we're setting
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  console.log("User profile object to save:", JSON.stringify(userProfile, null, 2));

  try {
    const userRef = doc(db, "users", user.uid);
    console.log("Attempting to write to Firestore:", userRef.path);
    
    await setDoc(userRef, userProfile, { merge: false });
    console.log("✅ User profile created successfully in Firestore");
    
    // Wait a bit for Firestore to process
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify the document was created with the correct role
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("✅ Verified user profile in Firestore:", {
        uid: data.uid,
        role: data.role,
        email: data.email,
        hasRole: !!data.role,
        roleValue: data.role
      });
      
      if (data.role !== role) {
        console.error("❌ Role mismatch! Expected:", role, "Got:", data.role);
      } else {
        console.log("✅ Role matches expected value:", role);
      }
      
      return data as UserProfile;
    } else {
      console.error("❌ Profile was not created - document does not exist after write");
      throw new Error("Failed to create user profile - document not found after write");
    }
  } catch (error: any) {
    console.error("❌ Error creating user profile:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    // Check if it's a permissions error
    if (error.code === "permission-denied") {
      throw new Error("Permission denied: Check your Firestore security rules");
    }
    
    throw error;
  }
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

// Update user role (admin only)
export const updateUserRole = async (uid: string, newRole: "user" | "admin" | "moderator") => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp(),
    });
    console.log(`Role updated to ${newRole} for user ${uid}`);
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

// Check if user profile exists, if not create it
export const ensureUserProfile = async (user: User, role: "user" | "admin" | "moderator" = "user") => {
  console.log("ensureUserProfile called with role:", role, "for user:", user.uid);
  const profile = await getUserProfile(user.uid);
  console.log("Existing profile:", profile);
  
  if (!profile) {
    console.log("No existing profile found, creating new profile with role:", role);
    return await createUserProfile(user, role);
  } else {
    console.log("Profile already exists with role:", profile.role);
  }
  return profile;
};