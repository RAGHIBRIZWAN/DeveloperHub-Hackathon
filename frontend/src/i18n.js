import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      "nav.home": "Home",
      "nav.learn": "Learn",
      "nav.practice": "Practice",
      "nav.compete": "Compete",
      "nav.profile": "Profile",
      "nav.admin": "Admin",
      "nav.dashboard": "Dashboard",
      "nav.courses": "Courses",
      "nav.leaderboard": "Leaderboard",
      "nav.shop": "Shop",
      
      // Auth
      "auth.login": "Login",
      "auth.register": "Register",
      "auth.logout": "Logout",
      "auth.email": "Email",
      "auth.password": "Password",
      "auth.username": "Username",
      "auth.fullName": "Full Name",
      "auth.welcomeBack": "Welcome Back",
      "auth.createAccount": "Create Account",
      "auth.noAccount": "Don't have an account?",
      "auth.haveAccount": "Already have an account?",
      
      // Home
      "home.title": "Learn Programming with AI",
      "home.subtitle": "Master competitive programming with gamified lessons and AI tutoring",
      "home.getStarted": "Get Started",
      "home.features.learn": "Learn",
      "home.features.practice": "Practice",
      "home.features.compete": "Compete",
      "home.features.reward": "Reward",
      
      // Modules
      "modules.title": "Learning Modules",
      "modules.selectModule": "Select a module to start learning",
      "modules.programmingFundamentals": "Programming Fundamentals",
      "modules.oop": "Object-Oriented Programming",
      "modules.dataStructures": "Data Structures",
      "modules.competitiveProgramming": "Competitive Programming",
      "modules.practice": "Practice",
      "modules.quiz": "Quiz",
      "modules.exam": "Exam",
      "modules.contest": "Contest",
      "modules.selectMode": "Select a learning mode",
      "modules.back": "Back",
      "modules.lessons": "lessons",
      "modules.noContent": "No Content Yet",
      "modules.comingSoon": "Content for this section is coming soon!",
      
      // Lessons
      "lessons.title": "Courses",
      "lessons.startLesson": "Start Lesson",
      "lessons.continueLesson": "Continue",
      "lessons.completed": "Completed",
      "lessons.progress": "Progress",
      
      // Code Editor
      "editor.run": "Run Code",
      "editor.submit": "Submit",
      "editor.reset": "Reset",
      "editor.language": "Language",
      "editor.output": "Output",
      "editor.input": "Input",
      
      // AI Tutor
      "ai.title": "AI Tutor",
      "ai.askQuestion": "Ask a question...",
      "ai.speak": "Speak",
      "ai.listening": "Listening...",
      "ai.thinking": "Thinking...",
      
      // MCQ
      "mcq.title": "Quiz",
      "mcq.question": "Question",
      "mcq.submit": "Submit Answer",
      "mcq.next": "Next Question",
      "mcq.result": "Your Score",
      
      // Gamification
      "gamify.coins": "Coins",
      "gamify.level": "Level",
      "gamify.xp": "XP",
      "gamify.streak": "Day Streak",
      "gamify.badges": "Badges",
      "gamify.achievements": "Achievements",
      "gamify.dailyReward": "Claim Daily Reward",
      
      // Competitions
      "compete.title": "Competitions",
      "compete.subtitle": "Compete with others and climb the leaderboard",
      "compete.upcoming": "Upcoming",
      "compete.ongoing": "Ongoing",
      "compete.past": "Past",
      "compete.completed": "Completed",
      "compete.register": "Register",
      "compete.registered": "Registered",
      "compete.leaderboard": "Leaderboard",
      "compete.rating": "Rating",
      "compete.enterContest": "Enter Contest",
      "compete.viewResults": "View Results",
      "compete.registrationClosed": "Registration Closed",
      "compete.startsIn": "Starts in",
      "compete.endsIn": "Ends in",
      
      // Admin
      "admin.title": "Admin Dashboard",
      "admin.overview": "Overview",
      "admin.contests": "Contests",
      "admin.users": "Users",
      "admin.notifications": "Notifications",
      "admin.createContest": "Create Contest",
      "admin.totalUsers": "Total Users",
      "admin.totalContests": "Total Contests",
      "admin.activeToday": "Active Today",
      "admin.upcomingContests": "Upcoming Contests",
      "admin.broadcastNotification": "Broadcast Notification",
      "admin.sendToAll": "Send to All Users",
      "admin.searchProblems": "Search Codeforces Problems",
      "admin.addProblem": "Add Problem",
      "admin.selectedProblems": "Selected Problems",
      
      // Proctoring
      "proctor.examMode": "Exam Mode",
      "proctor.webcamRequired": "Webcam Required",
      "proctor.warning": "Warning",
      "proctor.tabSwitch": "Tab switch detected",
      "proctor.faceNotDetected": "Face not detected",
      
      // Shop
      "shop.title": "Shop",
      "shop.subtitle": "Spend your coins on themes and rewards",
      "shop.themes": "Themes",
      "shop.powerups": "Power-ups",
      "shop.owned": "Owned",
      "shop.notEnoughCoins": "Not enough coins!",
      "shop.purchaseFailed": "Purchase failed",
      "shop.unlocked": "theme unlocked!",
      "shop.xpBoost": "XP Boost",
      "shop.xpBoostDesc": "Double XP for 24 hours",
      "shop.streakFreeze": "Streak Freeze",
      "shop.streakFreezeDesc": "Protect your streak for one day",
      "shop.hintToken": "Hint Token",
      "shop.hintTokenDesc": "Get a hint on any challenge",
      
      // Profile
      "profile.title": "Profile",
      "profile.editProfile": "Edit Profile",
      "profile.preferences": "Preferences",
      "profile.programmingLanguage": "Programming Language",
      "profile.badges": "Badges",
      "profile.noBadges": "No badges earned yet. Keep learning!",
      "profile.uploadPhoto": "Upload Photo",
      "profile.changePhoto": "Change Photo",
      
      // Codeforces Practice
      "practice.title": "Practice Problems",
      "practice.subtitle": "Solve problems from Codeforces",
      "practice.filterByRating": "Filter by Rating",
      "practice.filterByTags": "Filter by Tags",
      "practice.search": "Search problems...",
      "practice.solvedBy": "Solved by",
      "practice.solve": "Solve",
      "practice.loading": "Loading problems...",
      "practice.noProblems": "No problems found",
      "practice.difficulty": "Difficulty",
      
      // Common
      "common.loading": "Loading...",
      "common.error": "An error occurred",
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.confirm": "Confirm",
      "common.success": "Success!",
      "common.delete": "Delete",
      "common.edit": "Edit",
      "common.view": "View",
      "common.close": "Close",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
