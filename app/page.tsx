"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { logout, signInWithGoogle } from "@/app/lib/auth";
import { sendPhoneCode, setupRecaptcha, verifyCode } from "@/app/lib/phoneAuth";
import { useUserRole } from "./hook/useUserHook";

type Role = "user" | "admin" | "moderator";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<Role>("user");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { profile, role, loading } = useUserRole();

  const sendCode = async () => {
    if (!phone) {
      setError("Please enter a phone number");
      return;
    }
    
    if (!phone.startsWith("+")) {
      setError("Phone number must include country code (e.g., +1234567890)");
      return;
    }

    setError(null);
    setLoadingAuth(true);
    
    try {
      const verifier = setupRecaptcha();
      if (!verifier) {
        setError("Failed to initialize reCAPTCHA. Please refresh the page.");
        return;
      }
      const result = await sendPhoneCode(phone, verifier);
      setConfirmation(result);
    } catch (err: any) {
      console.error("Error sending code:", err);
      setError(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setLoadingAuth(false);
    }
  };

  const verify = async () => {
    if (!confirmation) {
      setError("Please send a verification code first");
      return;
    }

    if (!code) {
      setError("Please enter the verification code");
      return;
    }

    setError(null);
    setLoadingAuth(true);

    console.log("verify - selectedRole:", selectedRole);

    try {
      const user = await verifyCode(confirmation, code, selectedRole);
      console.log("Signed in user:", user);
      setCode("");
      setConfirmation(null);
      setPhone("");
    } catch (err: any) {
      console.error("Error verifying code:", err);
      setError(err.message || "Invalid verification code. Please try again.");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoadingAuth(true);
    
    console.log("handleGoogleSignIn - selectedRole:", selectedRole);
    
    try {
      await signInWithGoogle(selectedRole);
      console.log("Google sign-in completed successfully");
    } catch (err: any) {
      console.error("Error signing in with Google:", err);
      setError(err.message || "Failed to sign in with Google. Please try again.");
    } finally {
      setLoadingAuth(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    console.log("profile", profile);
    console.log("user", user);
    console.log("role", role);
    
  }, [profile,user]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 ">
      {user ? (
        <>
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">
              Welcome, {user.displayName || user.phoneNumber || user.email}
            </h1>
            <p className="text-sm text-gray-600 mb-1">Current Role: <span className="font-semibold capitalize">{role || "user"}</span></p>
            {role === "admin" && (
              <div className="mt-4 p-4 bg-blue-100 border border-blue-300 rounded-lg">
                <p className="font-bold text-blue-800">Admin Panel Access</p>
                <p className="text-sm text-blue-600 mt-1">You have administrator privileges</p>
              </div>
            )}
            {role === "moderator" && (
              <div className="mt-4 p-4 bg-purple-100 border border-purple-300 rounded-lg">
                <p className="font-bold text-purple-800">Moderator Access</p>
                <p className="text-sm text-purple-600 mt-1">You have moderator privileges</p>
              </div>
            )}
          </div>
          <button 
            onClick={logout}
            className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Sign Out
          </button>
        </>
      ) : (
        <div className="w-full max-w-md space-y-6 p-10 shadow-md rounded-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Sign In</h1>
            <p className="text-gray-600">Choose your authentication method</p>
          </div>

          {/* Role Selector */}
          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Select Role
            </label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loadingAuth}
            >
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-xs text-gray-500">
              Select the role you want to use for this account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button 
            onClick={handleGoogleSignIn}
            disabled={loadingAuth}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loadingAuth ? "Signing in..." : "Sign In with Google"}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          {/* Phone Authentication */}
          <div className="space-y-4">
            <h3 className="font-semibold text-center">Sign in with Phone</h3>
            <div id="recaptcha-container"></div>
            
            <div className="space-y-2">
              <input
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError(null);
                }}
                disabled={loadingAuth || !!confirmation}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
              />
              <button 
                onClick={sendCode}
                disabled={loadingAuth || !!confirmation}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loadingAuth ? "Sending..." : confirmation ? "Code Sent" : "Send OTP"}
              </button>
            </div>

            {confirmation && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError(null);
                  }}
                  disabled={loadingAuth}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                />
                <button 
                  onClick={verify}
                  disabled={loadingAuth}
                  className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingAuth ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}