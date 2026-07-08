import { useState, useRef, useEffect } from "react";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, ArrowLeft, Save, LogOut, Mail, Calendar, Clock, Plus, Minus, X } from "lucide-react";
import { BASE_URL, fetchWithToken } from "../api";
import { useToast } from "../components/Toast";

function toAbsolute(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${BASE_URL}${url}`;
}

function saveFocus(f) {
  localStorage.setItem("profileFocus", JSON.stringify(f));
}

function compressImage(file, maxDim = 512) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) {
          const compressed = new File([blob], file.name, { type: "image/jpeg" });
          resolve(compressed);
        } else {
          reject(new Error("Compression failed"));
        }
      }, "image/jpeg", 0.85);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const avatarRef = useRef(null);
  const focusRef = useRef({ x: 50, y: 50, zoom: 1 });
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, fx: 50, fy: 50 });
  const cropDragRef = useRef({ startX: 0, startY: 0, fx: 50, fy: 50 });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [showCropModal, setShowCropModal] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState("");
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPos, setCropPos] = useState({ x: 50, y: 50 });
  const [isCropDragging, setIsCropDragging] = useState(false);
  const [focus, setFocusRaw] = useState(() => {
    try {
      const saved = localStorage.getItem("profileFocus");
      const f = saved ? JSON.parse(saved) : { x: 50, y: 50, zoom: 1 };
      focusRef.current = f;
      return f;
    } catch {
      return { x: 50, y: 50, zoom: 1 };
    }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const setFocus = (f) => {
    focusRef.current = f;
    setFocusRaw(f);
  };

  useEffect(() => {
    if (isLoaded) loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const loadProfile = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/teachers/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFirstName(data.first_name || user?.firstName || "");
        setLastName(data.last_name || user?.lastName || "");
        setProfileImageUrl(
          data.profile_image_url
            ? toAbsolute(data.profile_image_url)
            : user?.profileImageUrl || ""
        );
      } else {
        setFirstName(user?.firstName || "");
        setLastName(user?.lastName || "");
        setProfileImageUrl(user?.profileImageUrl || "");
      }
    } catch {
      setFirstName(user?.firstName || "");
      setLastName(user?.lastName || "");
      setProfileImageUrl(user?.profileImageUrl || "");
    } finally {
      setIsLoading(false);
    }
  };

  // Drag-to-focus on profile image
  useEffect(() => {
    const el = avatarRef.current;
    if (!el || !profileImageUrl) return;

    const onDown = (e) => {
      dragging.current = true;
      setIsDragging(true);
      const c = e.touches ? e.touches[0] : e;
      dragStart.current = { x: c.clientX, y: c.clientY, fx: focusRef.current.x, fy: focusRef.current.y };
    };

    el.addEventListener("mousedown", onDown);
    el.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("touchstart", onDown);
    };
  }, [profileImageUrl]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      e.preventDefault();
      const c = e.touches ? e.touches[0] : e;
      const dx = c.clientX - dragStart.current.x;
      const dy = c.clientY - dragStart.current.y;
      const size = 112;
      const s = (100 / size) / (focusRef.current.zoom || 1);
      setFocus({
        x: Math.max(0, Math.min(100, dragStart.current.fx + dx * s)),
        y: Math.max(0, Math.min(100, dragStart.current.fy + dy * s)),
      });
    };

    const onEnd = () => {
      if (dragging.current) {
        dragging.current = false;
        setIsDragging(false);
        saveFocus(focusRef.current);
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, []);

  const handleSave = async () => {
    if (!firstName.trim()) return;
    setIsSaving(true);
    try {
      const token = await getToken();
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const res = await fetchWithToken("teachers/profile", token, {
        method: "PUT",
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          name: fullName,
        }),
      });
      if (res.ok) {
        toast({ title: "Changes saved", status: "success" });
      } else {
        toast({ title: "Failed to save", status: "error" });
      }
    } catch {
      toast({ title: "Error saving profile", status: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setIsUploading(true);
    try {
      const compressed = await compressImage(file, 512);
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", compressed, "profile.jpg");
      const clerkResp = await fetch(
        `https://proper-mullet-33.clerk.accounts.dev/v1/me/profile_image?__clerk_api_version=2025-11-10`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      if (!clerkResp.ok) throw new Error(`Clerk upload failed: ${await clerkResp.text()}`);
      const clerkData = await clerkResp.json();
      const newUrl = clerkData.imageUrl;

      await fetchWithToken("teachers/profile", token, {
        method: "PUT",
        body: JSON.stringify({ profile_image_url: newUrl }),
      });

      setPendingImageUrl(newUrl);
      setCropZoom(1);
      setCropPos({ x: 50, y: 50 });
      setShowCropModal(true);
    } catch {
      toast({ title: "Error uploading photo", status: "error" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCropSave = () => {
    const f = { x: cropPos.x, y: cropPos.y, zoom: cropZoom };
    setFocus(f);
    saveFocus(f);
    setProfileImageUrl(pendingImageUrl);
    setShowCropModal(false);
    toast({ title: "Profile photo updated", status: "success" });
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setPendingImageUrl("");
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const primaryEmail =
    user?.emailAddresses?.find((e) => e.id === user?.primaryEmailAddressId)?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "";

  return (
    <>
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account settings</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-8">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          <div className="h-1 bg-gradient-to-r from-brand-400 to-accent-400 rounded-t-2xl" />
          <div className="p-8 text-center">
            <div className="relative inline-block mb-4">
              <div
                ref={avatarRef}
                className={`w-28 h-28 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center overflow-hidden ring-4 ring-white dark:ring-gray-900 ${profileImageUrl ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""} select-none`}
                title={profileImageUrl ? "Drag to adjust focus" : ""}
              >
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt=""
                    draggable={false}
                    className="w-full h-full pointer-events-none"
                    style={{
                      objectFit: "cover",
                      transform: `scale(${focus.zoom || 1})`,
                      transformOrigin: `${focus.x}% ${focus.y}%`,
                    }}
                  />
                ) : (
                  <span className="text-3xl font-bold text-brand-600 dark:text-brand-400">
                    {user?.firstName?.[0] || user?.username?.[0] || "U"}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 transition-colors shadow-lg disabled:opacity-50"
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={15} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {user?.fullName || "User"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{primaryEmail}</p>

            <div className="my-6 border-t border-gray-200 dark:border-gray-800" />

            <div className="space-y-3 text-sm text-left">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Role</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">Teacher</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  <Calendar size={14} className="inline mr-1" />
                  Member since
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "\u2014"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  <Clock size={14} className="inline mr-1" />
                  Last sign in
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : "\u2014"}
                </span>
              </div>
            </div>

            <div className="my-6 border-t border-gray-200 dark:border-gray-800" />

            <button
              onClick={() => signOut()}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-sm font-medium"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </motion.div>

        {/* Personal info card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          <div className="h-1 bg-gradient-to-r from-accent-400 to-brand-400" />
          <div className="p-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
              Personal Information
            </h2>

            <div className="max-w-md space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    First name
                  </label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Last name
                  </label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed">
                  <Mail size={16} />
                  {primaryEmail}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Email cannot be changed here.
                </p>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save changes
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>

    {showCropModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md mx-4 overflow-hidden"
        >
          <div className="h-1 bg-gradient-to-r from-brand-400 to-accent-400" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Adjust your photo</h2>
              <button
                onClick={handleCropCancel}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex justify-center mb-4">
              <div
                className={`w-72 h-72 rounded-full overflow-hidden ${isCropDragging ? "cursor-grabbing" : "cursor-grab"} select-none`}
                style={{ background: "var(--color-brand-100)" }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsCropDragging(true);
                  const c = e;
                  cropDragRef.current = { startX: c.clientX, startY: c.clientY, fx: cropPos.x, fy: cropPos.y };
                }}
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  setIsCropDragging(true);
                  cropDragRef.current = { startX: t.clientX, startY: t.clientY, fx: cropPos.x, fy: cropPos.y };
                }}
              >
                <div
                  className="w-full h-full"
                  style={{ transform: `scale(${cropZoom})`, transformOrigin: `${cropPos.x}% ${cropPos.y}%` }}
                >
                  <img
                    src={pendingImageUrl}
                    alt=""
                    draggable={false}
                    className="w-full h-full pointer-events-none"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-2 mb-4">
              <button
                onClick={() => setCropZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
              >
                <Minus size={16} />
              </button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={cropZoom}
                onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-brand-600 cursor-pointer"
                style={{
                  WebkitAppearance: "none",
                  height: "6px",
                  borderRadius: "3px",
                  background: `linear-gradient(to right, #6366f1 ${((cropZoom - 1) / 2) * 100}%, #e5e7eb ${((cropZoom - 1) / 2) * 100}%)`,
                }}
              />
              <button
                onClick={() => setCropZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="text-center text-xs text-gray-400 dark:text-gray-500 mb-4">
              {cropZoom.toFixed(2)}x zoom
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCropCancel}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCropSave}
                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors text-sm font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}

    {/* Global listeners for crop drag */}
    {showCropModal && (
      <CropDragListeners
        isDragging={isCropDragging}
        setIsDragging={setIsCropDragging}
        cropPos={cropPos}
        setCropPos={setCropPos}
        cropZoom={cropZoom}
        dragRef={cropDragRef}
      />
    )}
    </>
  );
}

function CropDragListeners({ isDragging, setIsDragging, cropPos, setCropPos, cropZoom, dragRef }) {
  const posRef = useRef(cropPos);
  posRef.current = cropPos;

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e) => {
      e.preventDefault();
      const c = e.touches ? e.touches[0] : e;
      const dx = c.clientX - dragRef.current.startX;
      const dy = c.clientY - dragRef.current.startY;
      const containerSize = 288;
      const sensitivity = (100 / containerSize) / cropZoom;
      setCropPos({
        x: Math.max(0, Math.min(100, dragRef.current.fx + dx * sensitivity)),
        y: Math.max(0, Math.min(100, dragRef.current.fy + dy * sensitivity)),
      });
    };

    const onEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [isDragging, cropZoom, dragRef, setCropPos, setIsDragging]);

  return null;
}
