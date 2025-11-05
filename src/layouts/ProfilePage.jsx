// src/layouts/Profile.jsx
import { useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/utils/cn";
import { ArrowLeft, Camera, Save, X } from "lucide-react";
import profileImg from "@/assets/profile.jpg";
import { useAuth } from "@/contexts/auth-context";
import { useNavigate } from "react-router-dom";

export const Profile = () => {
  const { theme } = useTheme();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "Andrei",
    email: user?.email || "awdadwadf@gmaul.com",
    phone: user?.phone || "09150475513",
    role: role || "Admin",
    joinDate: user?.joinDate || "June 12, 2004",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // Here you would typically save the data to your backend
    console.log("Saving profile data:", profileData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data if needed
    setIsEditing(false);
  };

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className={cn(
      "min-h-screen p-6 transition-colors",
      theme === "dark" ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-900"
    )}>
      {/* Back Button */}
      <button
        onClick={handleBack}
        className={cn(
          "flex items-center gap-2 mb-6 px-4 py-2 rounded-md transition-colors",
          theme === "dark" 
            ? "text-cyan-400 hover:bg-slate-800" 
            : "text-cyan-600 hover:bg-slate-200"
        )}
      >
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>

      {/* Profile Card */}
      <div className={cn(
        "max-w-4xl mx-auto rounded-xl shadow-lg overflow-hidden",
        theme === "dark" ? "bg-slate-800" : "bg-white"
      )}>
        {/* Profile Header */}
        <div className={cn(
          "p-6 border-b",
          theme === "dark" ? "border-slate-700" : "border-slate-200"
        )}>
          <h1 className="text-2xl font-bold">Profile Information</h1>
          <p className={cn(
            "mt-1",
            theme === "dark" ? "text-slate-400" : "text-slate-500"
          )}>
            Manage your account details and preferences
          </p>
        </div>

        {/* Profile Content */}
        <div className="p-6 md:flex gap-6">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center mb-6 md:mb-0">
            <div className="relative">
              <img
                src={user?.image || profileImg}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-cyan-500"
              />
              {isEditing && (
                <button className="absolute bottom-0 right-0 p-2 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 transition-colors">
                  <Camera size={16} />
                </button>
              )}
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className={cn(
                  "mt-4 px-4 py-2 rounded-md font-medium transition-colors",
                  theme === "dark" 
                    ? "bg-cyan-600 hover:bg-cyan-700 text-white" 
                    : "bg-cyan-500 hover:bg-cyan-600 text-white"
                )}
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Profile Details Section */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={cn(
                  "block text-sm font-medium mb-1",
                  theme === "dark" ? "text-slate-300" : "text-slate-700"
                )}>
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-cyan-500",
                      theme === "dark" 
                        ? "bg-slate-700 border-slate-600 text-white" 
                        : "bg-white border-slate-300 text-slate-900"
                    )}
                  />
                ) : (
                  <p className={cn(
                    "py-2",
                    theme === "dark" ? "text-slate-200" : "text-slate-800"
                  )}>
                    {profileData.name}
                  </p>
                )}
              </div>

              <div>
                <label className={cn(
                  "block text-sm font-medium mb-1",
                  theme === "dark" ? "text-slate-300" : "text-slate-700"
                )}>
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-cyan-500",
                      theme === "dark" 
                        ? "bg-slate-700 border-slate-600 text-white" 
                        : "bg-white border-slate-300 text-slate-900"
                    )}
                  />
                ) : (
                  <p className={cn(
                    "py-2",
                    theme === "dark" ? "text-slate-200" : "text-slate-800"
                  )}>
                    {profileData.email}
                  </p>
                )}
              </div>

              <div>
                <label className={cn(
                  "block text-sm font-medium mb-1",
                  theme === "dark" ? "text-slate-300" : "text-slate-700"
                )}>
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-cyan-500",
                      theme === "dark" 
                        ? "bg-slate-700 border-slate-600 text-white" 
                        : "bg-white border-slate-300 text-slate-900"
                    )}
                  />
                ) : (
                  <p className={cn(
                    "py-2",
                    theme === "dark" ? "text-slate-200" : "text-slate-800"
                  )}>
                    {profileData.phone}
                  </p>
                )}
              </div>

              <div>
                <label className={cn(
                  "block text-sm font-medium mb-1",
                  theme === "dark" ? "text-slate-300" : "text-slate-700"
                )}>
                  Role
                </label>
                <p className={cn(
                  "py-2",
                  theme === "dark" ? "text-slate-200" : "text-slate-800"
                )}>
                  {profileData.role}
                </p>
              </div>

              <div>
                <label className={cn(
                  "block text-sm font-medium mb-1",
                  theme === "dark" ? "text-slate-300" : "text-slate-700"
                )}>
                  Member Since
                </label>
                <p className={cn(
                  "py-2",
                  theme === "dark" ? "text-slate-200" : "text-slate-800"
                )}>
                  {profileData.joinDate}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700">
                <button
                  onClick={handleSave}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors",
                    theme === "dark" 
                      ? "bg-cyan-600 hover:bg-cyan-700 text-white" 
                      : "bg-cyan-500 hover:bg-cyan-600 text-white"
                  )}
                >
                  <Save size={16} />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={handleCancel}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors",
                    theme === "dark" 
                      ? "bg-slate-700 hover:bg-slate-600 text-white" 
                      : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                  )}
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;