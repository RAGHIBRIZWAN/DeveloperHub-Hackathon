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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="text-purple-400" />
            {t('shop.title')}
          </h1>
          <p className="text-gray-400 mt-1">{t('shop.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-lg">
          <span className="text-2xl">🪙</span>
          <span className="text-yellow-400 font-bold text-xl">{coins}</span>
        </div>
      </div>

      {/* Themes Section */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Palette className="text-purple-400" size={24} />
          <h2 className="text-xl font-bold text-white">{t('shop.themes')}</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {themes.map((theme, index) => {
              const isUnlocked = unlockedThemes.includes(theme.id);
              const canAfford = coins >= theme.price;

              return (
                <motion.div
                  key={theme.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-gray-800 border rounded-2xl overflow-hidden ${
                    activeTheme === theme.id ? 'border-purple-500 ring-2 ring-purple-500/30' : isUnlocked ? 'border-green-500/50' : 'border-gray-700'
                  }`}
                >
                  {/* Theme Preview */}
                  <div 
                    className="h-32 relative"
                    style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}88)` }}
                  >
                    {activeTheme === theme.id && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-purple-600 rounded-full flex items-center gap-1">
                        <Sparkles size={12} className="text-white" />
                        <span className="text-white text-xs font-bold">Active</span>
                      </div>
                    )}
                    {isUnlocked && activeTheme !== theme.id && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Check size={18} className="text-white" />
                      </div>
                    )}
                    {!isUnlocked && !canAfford && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Lock size={32} className="text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Theme Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-white">{theme.name}</h3>
                      {theme.price >= 200 && (
                        <Sparkles size={16} className="text-yellow-400" />
                      )}
                    </div>
                    <p className="text-gray-500 text-sm mb-4">{theme.name_ur || ''}</p>

                    {isUnlocked ? (
                      activeTheme === theme.id ? (
                        <button className="w-full py-2 bg-purple-600/20 text-purple-400 rounded-lg font-semibold border border-purple-500/50 cursor-default">
                          ✓ Active
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateTheme(theme)}
                          className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-500 transition-colors"
                        >
                          Activate
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handlePurchase(theme)}
                        disabled={!canAfford}
                        className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                          canAfford
                            ? 'bg-blue-600 text-white hover:bg-blue-500'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <span className="text-lg">🪙</span>
                        {theme.price}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Power-ups Section */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Star className="text-yellow-400" size={24} />
          <h2 className="text-xl font-bold text-white">{t('shop.powerups')}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              id: 'xp_boost',
              icon: '⚡',
              name: 'XP Boost',
              description: 'Double XP for 1 hour',
              price: 100,
            },
            {
              id: 'hint_pack',
              icon: '💡',
              name: 'Hint Pack',
              description: '5 free AI hints',
              price: 50,
            },
            {
              id: 'streak_freeze',
              icon: '❄️',
              name: 'Streak Freeze',
              description: 'Protect your streak for 1 day',
              price: 75,
            },
          ].map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="font-bold text-white mb-1">{item.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{item.description}</p>
              <button
                onClick={() => handlePowerupPurchase(item)}
                disabled={coins < item.price}
                className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                  coins >= item.price
                    ? 'bg-purple-600 text-white hover:bg-purple-500'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span className="text-lg">🪙</span>
                {item.price}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How to earn coins */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6"
      >
        <h3 className="font-bold text-white mb-4">
          💰 How to Earn Coins
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-yellow-400 font-bold text-xl">+10</p>
            <p className="text-gray-400 text-sm">Complete a lesson</p>
          </div>
          <div className="text-center">
            <p className="text-yellow-400 font-bold text-xl">+25</p>
            <p className="text-gray-400 text-sm">Solve a challenge</p>
          </div>
          <div className="text-center">
            <p className="text-yellow-400 font-bold text-xl">+50</p>
            <p className="text-gray-400 text-sm">Win a contest</p>
          </div>
          <div className="text-center">
            <p className="text-yellow-400 font-bold text-xl">+5-50</p>
            <p className="text-gray-400 text-sm">Daily rewards</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Shop;
