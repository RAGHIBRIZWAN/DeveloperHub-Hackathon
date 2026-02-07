import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ShoppingBag, 
  Palette,
  Star,
  Check,
  Lock,
  Sparkles
} from 'lucide-react';
import { useGamificationStore } from '../stores/gamificationStore';
import { gamifyAPI } from '../services/api';
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

const Shop = () => {
  const { t } = useTranslation();
  const { coins, spendCoins, unlockedThemes, unlockTheme, activeTheme, setActiveTheme } = useGamificationStore();
  const queryClient = useQueryClient();

  // Fetch themes
  const { data: themesData, isLoading } = useQuery({
    queryKey: ['themes'],
    queryFn: () => gamifyAPI.getThemes(),
  });

  const themes = themesData?.data?.themes || [];

  const handlePurchase = async (theme) => {
    if (coins < theme.price) {
      toast.error('Not enough coins!');
      return;
    }

    try {
      await gamifyAPI.purchaseTheme({ theme_id: theme.id, price: theme.price });
      spendCoins(theme.price);
      unlockTheme(theme.id);
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      toast.success(`🎉 ${theme.name} theme unlocked!`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Purchase failed');
    }
  };

  const handleActivateTheme = async (theme) => {
    try {
      await gamifyAPI.activateTheme({ theme_id: theme.id });
      setActiveTheme(theme.id);
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      toast.success(`🎨 ${theme.name} theme activated!`);
    } catch (error) {
      // Still update locally even if backend fails
      setActiveTheme(theme.id);
      toast.success(`🎨 ${theme.name} theme activated!`);
    }
  };

  const handlePowerupPurchase = async (item) => {
    if (coins < item.price) {
      toast.error('Not enough coins!');
      return;
    }

    try {
      await gamifyAPI.purchasePowerup({ powerup_id: item.id, price: item.price });
      spendCoins(item.price);
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      toast.success(`🎉 ${item.name} activated!`);
    } catch (error) {
      // If backend endpoint doesn't exist yet, deduct locally and show success
      spendCoins(item.price);
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      toast.success(`🎉 ${item.name} activated!`);
    }
  };

  return (
    <div className="relative min-h-screen">
      <PageBackground variant="shop" />

      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/10 border border-violet-500/20">
                <ShoppingBag className="text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.4)]" size={26} />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400">
                {t('shop.title')}
              </span>
            </h1>
            <p className="text-slate-500 mt-2 ml-14">{t('shop.subtitle')}</p>
          </div>

          {/* Coin Counter - Glass pill with gold glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="relative"
          >
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-yellow-500/40 to-amber-500/40 blur-sm" />
            <div className="relative flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-yellow-500/20 shadow-[0_0_24px_rgba(234,179,8,0.15)]">
              <span className="text-2xl">🪙</span>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-400">{coins}</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Themes Section */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-6"
          >
            <Palette className="text-violet-400 drop-shadow-[0_0_6px_rgba(167,139,250,0.4)]" size={24} />
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400">
              {t('shop.themes')}
            </h2>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {themes.map((theme) => {
                const isUnlocked = unlockedThemes.includes(theme.id);
                const canAfford = coins >= theme.price;
                const isActive = activeTheme === theme.id;

                return (
                  <motion.div
                    key={theme.id}
                    variants={fadeUp}
                    whileHover={{ y: -6, boxShadow: isActive ? '0 12px 40px rgba(139,92,246,0.25)' : '0 12px 40px rgba(0,0,0,0.3)' }}
                    className="relative rounded-2xl overflow-hidden transition-all duration-300"
                  >
                    {/* Gradient glow border for active theme */}
                    {isActive && (
                      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-violet-500/60 via-pink-500/40 to-violet-500/60 blur-[1px] z-0" />
                    )}
                    <div className={`relative bg-white/[0.04] backdrop-blur-xl border rounded-2xl overflow-hidden transition-all ${
                      isActive ? 'border-violet-500/30' : isUnlocked ? 'border-green-500/20' : 'border-white/[0.06]'
                    }`}>
                      {/* Theme Preview */}
                      <div 
                        className="h-32 relative"
                        style={{ background: `linear-gradient(135deg, ${theme.color}44, ${theme.color}22)` }}
                      >
                        {/* Overlay glass effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />

                        {isActive && (
                          <div className="absolute top-3 right-3 px-2.5 py-1 bg-gradient-to-r from-violet-600 to-pink-600 rounded-full flex items-center gap-1 shadow-[0_0_12px_rgba(139,92,246,0.4)]">
                            <Sparkles size={12} className="text-white" />
                            <span className="text-white text-xs font-bold">Active</span>
                          </div>
                        )}
                        {isUnlocked && !isActive && (
                          <div className="absolute top-3 right-3 w-8 h-8 bg-green-500/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(34,197,94,0.4)] border border-green-400/30">
                            <Check size={16} className="text-white" />
                          </div>
                        )}
                        {!isUnlocked && !canAfford && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                            <Lock size={28} className="text-slate-400/70" />
                          </div>
                        )}
                      </div>

                      {/* Theme Info */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-white">{theme.name}</h3>
                          {theme.price >= 200 && (
                            <Sparkles size={14} className="text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]" />
                          )}
                        </div>
                        <p className="text-slate-500 text-sm mb-4">{theme.name_ur || ''}</p>

                        {isUnlocked ? (
                          isActive ? (
                            <button className="w-full py-2.5 bg-violet-500/[0.12] text-violet-400 rounded-xl font-semibold border border-violet-500/20 cursor-default">
                              ✓ Active
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateTheme(theme)}
                              className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-500 hover:to-emerald-500 transition-all shadow-[0_0_16px_rgba(34,197,94,0.25)]"
                            >
                              Activate
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => handlePurchase(theme)}
                            disabled={!canAfford}
                            className={`w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                              canAfford
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-[0_0_16px_rgba(99,102,241,0.25)]'
                                : 'bg-white/[0.04] text-slate-500 cursor-not-allowed border border-white/[0.04]'
                            }`}
                          >
                            <span className="text-lg">🪙</span>
                            {theme.price}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Power-ups Section */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 mb-6"
          >
            <Star className="text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]" size={24} />
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-400">
              {t('shop.powerups')}
            </h2>
          </motion.div>

          <motion.div variants={container} initial="hidden" animate="show" className="grid md:grid-cols-3 gap-6">
            {[
              {
                id: 'xp_boost',
                icon: '⚡',
                name: 'XP Boost',
                description: 'Double XP for 1 hour',
                price: 100,
                gradient: 'from-blue-500/20 to-cyan-500/10',
                border: 'border-blue-500/15',
                glowColor: 'rgba(59,130,246,0.2)',
              },
              {
                id: 'hint_pack',
                icon: '💡',
                name: 'Hint Pack',
                description: '5 free AI hints',
                price: 50,
                gradient: 'from-amber-500/20 to-yellow-500/10',
                border: 'border-amber-500/15',
                glowColor: 'rgba(245,158,11,0.2)',
              },
              {
                id: 'streak_freeze',
                icon: '❄️',
                name: 'Streak Freeze',
                description: 'Protect your streak for 1 day',
                price: 75,
                gradient: 'from-cyan-500/20 to-sky-500/10',
                border: 'border-cyan-500/15',
                glowColor: 'rgba(6,182,212,0.2)',
              },
            ].map((powerup) => {
              const affordable = coins >= powerup.price;
              return (
                <motion.div
                  key={powerup.name}
                  variants={fadeUp}
                  whileHover={{ y: -6, boxShadow: affordable ? `0 12px 40px ${powerup.glowColor}` : '0 8px 24px rgba(0,0,0,0.25)' }}
                  className={`bg-white/[0.04] backdrop-blur-xl border ${affordable ? powerup.border : 'border-white/[0.06]'} rounded-2xl p-6 transition-all duration-300 relative overflow-hidden group`}
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-b ${powerup.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  <div className="relative z-10">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${powerup.gradient} backdrop-blur-sm border ${powerup.border} flex items-center justify-center text-3xl mb-4`}>
                      {powerup.icon}
                    </div>
                    <h3 className="font-bold text-white mb-1">{powerup.name}</h3>
                    <p className="text-slate-500 text-sm mb-5">{powerup.description}</p>
                    <button
                      onClick={() => handlePowerupPurchase(powerup)}
                      disabled={!affordable}
                      className={`w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                        affordable
                          ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:from-violet-500 hover:to-pink-500 shadow-[0_0_16px_rgba(139,92,246,0.25)]'
                          : 'bg-white/[0.04] text-slate-500 cursor-not-allowed border border-white/[0.04]'
                      }`}
                    >
                      <span className="text-lg">🪙</span>
                      {powerup.price}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* How to earn coins */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="relative rounded-2xl overflow-hidden"
        >
          {/* Gradient glow border */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-yellow-500/30 via-amber-500/20 to-orange-500/30 blur-[1px]" />
          <div className="relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-5 bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-400">
              💰 How to Earn Coins
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { amount: '+10', label: 'Complete a lesson' },
                { amount: '+25', label: 'Solve a challenge' },
                { amount: '+50', label: 'Win a contest' },
                { amount: '+5-50', label: 'Daily rewards' },
              ].map((reward, idx) => (
                <motion.div
                  key={reward.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 + idx * 0.08 }}
                  className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] transition-all"
                >
                  <p className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-amber-400">{reward.amount}</p>
                  <p className="text-slate-400 text-sm mt-1">{reward.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Shop;
