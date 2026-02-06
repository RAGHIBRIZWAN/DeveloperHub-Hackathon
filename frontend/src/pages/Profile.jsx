import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  Mail,
  BookOpen,
  Code,
  Trophy,
  Flame,
  Star,
  Settings,
  Camera,
  Save,
  Award,
  Loader2,
  X
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { useSettingsStore } from '../stores/settingsStore';
import { authAPI, gamifyAPI } from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const { level, xp, xpToNextLevel, coins, currentStreak, badges, updateGamification, rankTitle } = useGamificationStore();
  const { programmingLanguage, setProgrammingLanguage } = useSettingsStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    bio: user?.bio || '',
  });
  
  // Profile picture state
  const fileInputRef = useRef(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch gamification data
  const { data: gamifyData } = useQuery({
    queryKey: ['gamification'],
    queryFn: async () => {
      const response = await gamifyAPI.getProfile();
      return response.data;
    },
  });

  // Update gamification store when data is fetched
  useEffect(() => {
    if (gamifyData) {
      updateGamification(gamifyData);
    }
  }, [gamifyData, updateGamification]);

  // Fetch achievements
  const { data: achievementsData } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => gamifyAPI.getAchievements(),
  });

  const achievements = achievementsData?.data?.achievements || [];

  const handleSave = async () => {
    try {
      const response = await authAPI.updateProfile(formData);
      updateUser(response.data);
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  // Profile picture handlers
  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image (JPG, PNG, or GIF)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
      setSelectedFile(file);
      setShowPhotoPreview(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) return;

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await authAPI.uploadProfilePicture(formData);
      updateUser({ ...user, profile_picture: response.data.profile_picture });
      toast.success('Profile picture updated!');
      setShowPhotoPreview(false);
      setPreviewImage(null);
      setSelectedFile(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload profile picture');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCancelPreview = () => {
    setShowPhotoPreview(false);
    setPreviewImage(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const stats = [
    { icon: BookOpen, label: 'Lessons Completed', value: user?.stats?.total_lessons_completed || 0, color: 'text-blue-400' },
    { icon: Code, label: 'Challenges Solved', value: user?.stats?.total_challenges_solved || 0, color: 'text-purple-400' },
    { icon: Trophy, label: 'Contests Won', value: user?.stats?.total_contests_won || 0, color: 'text-yellow-400' },
    { icon: Flame, label: 'Current Streak', value: currentStreak || 0, color: 'text-orange-400' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/jpg,image/png,image/gif"
        className="hidden"
      />

      {/* Photo Preview Modal */}
      {showPhotoPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Preview Profile Picture</h3>
              <button
                onClick={handleCancelPreview}
                className="p-1 hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="flex justify-center mb-6">
              <img
                src={previewImage}
                alt="Preview"
                className="w-48 h-48 rounded-full object-cover border-4 border-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelPreview}
                className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadPhoto}
                disabled={isUploadingPhoto}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploadingPhoto ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Photo
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 border border-gray-700 rounded-2xl p-8 mb-6"
      >
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user?.full_name || 'Profile'}
                className="w-24 h-24 rounded-full object-cover border-2 border-purple-500"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
            )}
            <button 
              onClick={handleCameraClick}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors cursor-pointer"
              title="Change profile picture"
            >
              <Camera size={16} className="text-white" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="Full Name"
                />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="Username"
                />
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="Bio"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                  >
                    <Save size={16} />
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-white">{user?.full_name || 'User'}</h1>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                    Level {level}
                  </span>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                    {rankTitle}
                  </span>
                </div>
                <p className="text-gray-400">@{user?.username}</p>
                <p className="text-gray-500 mt-2">{user?.bio || 'No bio yet'}</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  <Settings size={16} />
                  Edit Profile
                </button>
              </>
            )}
          </div>

          {/* XP Progress */}
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <Star className="text-yellow-400" size={20} />
              <span className="text-yellow-400 font-bold text-xl">{xp} XP</span>
            </div>
            <p className="text-gray-500 text-sm">{xpToNextLevel - xp} to Level {level + 1}</p>
            <div className="w-48 h-2 bg-gray-700 rounded-full mt-2">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                style={{ width: `${(xp / xpToNextLevel) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center"
          >
            <stat.icon className={`${stat.color} mx-auto mb-2`} size={24} />
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-gray-500 text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Settings */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Settings size={20} />
          Preferences
        </h2>
        
        <div>
          <label className="block text-gray-400 text-sm mb-2">
            Programming Language
          </label>
          <select
            value={programmingLanguage}
            onChange={(e) => setProgrammingLanguage(e.target.value)}
            className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
          >
            <option value="python">🐍 Python</option>
            <option value="cpp">⚡ C++</option>
            <option value="javascript">🌐 JavaScript</option>
          </select>
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-800 border border-gray-700 rounded-xl p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Award size={20} className="text-yellow-400" />
          Badges
        </h2>
        
        <div className="grid grid-cols-6 gap-4">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center text-3xl">
                {badge.icon}
              </div>
              <p className="text-white text-sm mt-2">{badge.name}</p>
            </motion.div>
          ))}
          
          {badges.length === 0 && (
            <div className="col-span-6 text-center py-8 text-gray-500">
              <Award size={48} className="mx-auto mb-2 opacity-50" />
              <p>No badges earned yet. Keep learning!</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
