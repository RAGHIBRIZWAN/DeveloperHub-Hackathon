import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  Mail,
  Trophy,
  Code,
  Flame,
  Star,
  Settings,
  Camera,
  Save,
  Award,
  Loader2,
  X,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useGamificationStore } from '../stores/gamificationStore';
import { useSettingsStore } from '../stores/settingsStore';
import { authAPI, gamifyAPI } from '../services/api';
import toast from 'react-hot-toast';
import PageBackground from '../components/ui/PageBackground';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
};

const Profile = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const { level, xp, xpToNextLevel, coins, currentStreak, badges, updateGamification } = useGamificationStore();
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

  // Fetch fresh user profile (for up-to-date stats)
  const { data: profileData } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await authAPI.getProfile();
      return response.data;
    },
  });

  // Sync fresh profile data into auth store
  useEffect(() => {
    if (profileData) {
      updateUser(profileData);
    }
  }, [profileData, updateUser]);

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
    { icon: Zap, label: 'Rating', value: user?.rating || 1000, color: 'text-blue-400', glow: 'from-blue-500/20 to-blue-600/5', borderColor: 'border-blue-500/20' },
    { icon: Code, label: 'Challenges Solved', value: user?.stats?.total_challenges_solved || 0, color: 'text-purple-400', glow: 'from-purple-500/20 to-purple-600/5', borderColor: 'border-purple-500/20' },
    { icon: Trophy, label: 'Contests Won', value: user?.stats?.total_contests_won || 0, color: 'text-yellow-400', glow: 'from-yellow-500/20 to-yellow-600/5', borderColor: 'border-yellow-500/20' },
    { icon: Flame, label: 'Current Streak', value: currentStreak || 0, color: 'text-orange-400', glow: 'from-orange-500/20 to-orange-600/5', borderColor: 'border-orange-500/20' },
  ];

  return (
    <div className="relative min-h-screen">
      <PageBackground />

      <div className="relative z-10 p-6 max-w-4xl mx-auto">
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-2xl overflow-hidden max-w-md w-full"
            >
              {/* Glass glow border */}
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/40 via-violet-500/40 to-pink-500/40 blur-[1px]" />
              <div className="relative bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400">
                    Preview Profile Picture
                  </h3>
                  <button
                    onClick={handleCancelPreview}
                    className="p-1.5 hover:bg-white/[0.08] rounded-full transition-colors"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500/50 via-violet-500/50 to-pink-500/50 blur-sm" />
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="relative w-48 h-48 rounded-full object-cover border-2 border-white/[0.1]"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancelPreview}
                    className="flex-1 py-3 bg-white/[0.06] backdrop-blur-sm text-slate-300 rounded-xl hover:bg-white/[0.1] transition-all border border-white/[0.06]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadPhoto}
                    disabled={isUploadingPhoto}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
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
              </div>
            </motion.div>
          </div>
        )}

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-6 rounded-2xl overflow-hidden"
        >
          {/* Gradient glow border */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/40 via-violet-500/30 to-pink-500/40 blur-[1px]" />
          <div className="relative bg-white/[0.04] backdrop-blur-xl rounded-2xl p-8 border border-white/[0.06]">
            <div className="flex items-start gap-6">
              {/* Avatar with glow ring */}
              <div className="relative group">
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-indigo-500/50 via-violet-500/50 to-pink-500/50 blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
                {user?.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user?.full_name || 'Profile'}
                    className="relative w-24 h-24 rounded-full object-cover border-2 border-white/[0.15]"
                  />
                ) : (
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/40 to-violet-600/40 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold border-2 border-white/[0.15]">
                    {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </div>
                )}
                <button 
                  onClick={handleCameraClick}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full flex items-center justify-center hover:from-indigo-500 hover:to-violet-500 transition-all cursor-pointer shadow-[0_0_12px_rgba(99,102,241,0.4)] border border-white/[0.15]"
                  title="Change profile picture"
                >
                  <Camera size={14} className="text-white" />
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
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 backdrop-blur-sm transition-all"
                      placeholder="Full Name"
                    />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 backdrop-blur-sm transition-all"
                      placeholder="Username"
                    />
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 backdrop-blur-sm transition-all resize-none"
                      placeholder="Bio"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-[0_0_16px_rgba(99,102,241,0.3)]"
                      >
                        <Save size={16} />
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-5 py-2.5 bg-white/[0.06] text-slate-300 rounded-xl hover:bg-white/[0.1] border border-white/[0.06] transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl font-bold text-white">{user?.full_name || 'User'}</h1>
                      <span className="px-3 py-1 bg-indigo-500/[0.12] text-indigo-400 rounded-full text-sm border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.15)]">
                        Level {level}
                      </span>
                      <span className="px-3 py-1 bg-yellow-500/[0.12] text-yellow-400 rounded-full text-sm border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.15)]">
                        Rating: {user?.rating || 1000}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1">@{user?.username}</p>
                    <p className="text-slate-500 mt-2">{user?.bio || 'No bio yet'}</p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] text-slate-300 rounded-xl hover:bg-white/[0.1] border border-white/[0.06] transition-all"
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
                  <Star className="text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]" size={20} />
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-400">{xp} XP</span>
                </div>
                <p className="text-slate-500 text-sm mt-1">{xpToNextLevel - xp} to Level {level + 1}</p>
                <div className="w-48 h-2 bg-white/[0.06] rounded-full mt-2 overflow-hidden border border-white/[0.04]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(xp / xpToNextLevel) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}
              className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 text-center transition-all duration-300 hover:border-white/[0.1] relative overflow-hidden group"
            >
              {/* Subtle gradient glow on hover */}
              <div className={`absolute inset-0 bg-gradient-to-b ${stat.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative z-10">
                <stat.icon className={`${stat.color} mx-auto mb-2 drop-shadow-[0_0_6px_currentColor]`} size={24} />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-slate-500 text-sm mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Settings size={20} className="text-slate-400" />
            Preferences
          </h2>
          
          <div>
            <label className="block text-slate-400 text-sm mb-2">
              Programming Language
            </label>
            <select
              value={programmingLanguage}
              onChange={(e) => setProgrammingLanguage(e.target.value)}
              className="w-full max-w-md bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 backdrop-blur-sm appearance-none cursor-pointer transition-all"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              <option value="python">🐍 Python</option>
              <option value="cpp">⚡ C++</option>
              <option value="javascript">🌐 JavaScript</option>
            </select>
          </div>
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <Award size={20} className="text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-400">Badges</span>
          </h2>
          
          <div className="grid grid-cols-6 gap-4">
            {badges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                whileHover={{ scale: 1.08, y: -4 }}
                className="text-center group"
              >
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-yellow-500/[0.12] to-orange-500/[0.08] backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl border border-yellow-500/[0.15] group-hover:border-yellow-400/30 group-hover:shadow-[0_0_20px_rgba(250,204,21,0.2)] transition-all duration-300">
                  {badge.icon}
                </div>
                <p className="text-slate-300 text-sm mt-2">{badge.name}</p>
              </motion.div>
            ))}
            
            {badges.length === 0 && (
              <div className="col-span-6 text-center py-10 text-slate-500">
                <Award size={48} className="mx-auto mb-3 opacity-30" />
                <p>No badges earned yet. Keep learning!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
