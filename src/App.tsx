/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Info, 
  Search, 
  Bell, 
  User, 
  ChevronRight, 
  Plus,
  X,
  LogOut,
  CreditCard,
  Settings,
  Github,
  Mail,
  Lock
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AuthProvider, useAuth } from './AuthContext';
import { db } from './firebase';
import { VideoPlayer } from './components/VideoPlayer';
import { seedDatabase } from './seed';
import { SettingsModal } from './components/SettingsModal';
import { BillingModal } from './components/BillingModal';
import { doc, setDoc, serverTimestamp, collection, onSnapshot, query, orderBy, limit, getDocs, where } from 'firebase/firestore';

const GENRES = ['All', 'Action', 'Sci-Fi', 'Drama', 'Thriller', 'Animation'];

// Utility for cleaner tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const AuthModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { signInWithGoogle, signInWithGithub } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[url('https://picsum.photos/seed/cinema/1920/1080')] bg-cover bg-center brightness-[0.2]"
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full h-full flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto"
      >
        <button 
          onClick={onClose} 
          className="absolute top-8 right-8 p-3 hover:bg-white/10 rounded-full transition-all border border-white/10 group active:scale-90"
        >
          <X className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        <div className="w-full max-w-sm space-y-8 py-12">
          <div className="text-center">
            <motion.h2 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-6xl font-black tracking-tighter text-red-600 italic mb-4"
            >
              NETSEX
            </motion.h2>
            <p className="text-white/60 text-lg">{isLogin ? 'Welcome back to the future.' : 'Join the revolution.'}</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={async () => {
                const success = await signInWithGoogle();
                if (success) onClose();
              }}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all shadow-xl active:scale-[0.98]"
            >
              <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
              Continue with Google
            </button>
            <button 
              onClick={async () => {
                const success = await signInWithGithub();
                if (success) onClose();
              }}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#24292e] text-white font-bold rounded-xl hover:bg-[#24292e]/90 transition-all shadow-xl active:scale-[0.98]"
            >
              <Github className="w-6 h-6" />
              Continue with GitHub
            </button>
          </div>

          <div className="relative flex items-center gap-4 text-white/20">
            <div className="flex-1 border-t border-current"></div>
            <span className="text-xs uppercase font-bold tracking-widest">Or email</span>
            <div className="flex-1 border-t border-current"></div>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input 
                type="email" 
                placeholder="Email address" 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-red-600 focus:bg-white/10 transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-red-600 focus:bg-white/10 transition-all"
              />
            </div>
            <button className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-[0.98]">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center text-white/40">
            {isLogin ? "New to NETSEX?" : "Already have an account?"}
            <button onClick={() => setIsLogin(!isLogin)} className="ml-2 text-white hover:text-red-500 underline decoration-red-600 underline-offset-4 font-bold transition-colors">
              {isLogin ? 'Sign up now' : 'Log in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const Navbar = ({ onAuthClick, onSearch, onSettingsClick, onBillingClick }: { onAuthClick: () => void; onSearch: (q: string) => void; onSettingsClick: () => void; onBillingClick: () => void }) => {
  const { user, profile, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 w-full z-50 transition-all duration-500 px-4 md:px-12 py-4 flex items-center justify-between",
      isScrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/10" : "bg-gradient-to-b from-black/70 to-transparent"
    )}>
      <div className="flex items-center gap-8">
        <h1 className="text-3xl font-black tracking-tighter text-red-600 italic cursor-pointer">NETSEX</h1>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/70">
          <a href="#" className="text-white hover:text-white transition-colors">Home</a>
          <a href="#" className="hover:text-white transition-colors">TV Shows</a>
          <a href="#" className="hover:text-white transition-colors">Movies</a>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Search titles..." 
            onChange={(e) => onSearch(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-red-600 w-48 lg:w-64 transition-all"
          />
        </div>
        
        {user ? (
          <div className="relative">
            <div 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 rounded bg-red-600 flex items-center justify-center cursor-pointer overflow-hidden border border-white/20 hover:scale-110 transition-transform"
            >
              {user.photoURL ? <img src={user.photoURL} alt="User" /> : <User className="w-5 h-5" />}
            </div>
            
            <AnimatePresence>
              {showUserMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-4 w-64 bg-[#141414] border border-white/10 rounded-xl p-2 shadow-2xl"
                >
                  <div className="p-4 border-b border-white/5 mb-2">
                    <p className="font-bold truncate">{user.displayName || user.email}</p>
                    <p className="text-xs text-red-500 font-bold uppercase tracking-tighter mt-1">
                      {profile?.subscriptionTier || 'Free'} Member
                    </p>
                  </div>
                  <button 
                    onClick={onBillingClick}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-lg transition-colors text-sm"
                  >
                    <CreditCard className="w-4 h-4" /> Subscription
                  </button>
                  <button 
                    onClick={onSettingsClick}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-lg transition-colors text-sm"
                  >
                    <Settings className="w-4 h-4" /> Account Settings
                  </button>
                  <button 
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-600/10 text-red-500 rounded-lg transition-colors text-sm mt-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button 
            onClick={onAuthClick}
            className="px-6 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-all"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

const MovieCard = ({ item, onClick }: { item: any; onClick: () => void; key?: any }) => {
  const { toggleWatchlist, watchlist, user } = useAuth();
  const isInWatchlist = watchlist.includes(item.id);

  return (
    <motion.div 
      whileHover={{ scale: 1.05, zIndex: 10 }}
      className="relative flex-none w-[160px] md:w-[240px] aspect-[2/3] rounded-lg overflow-hidden cursor-pointer group shadow-2xl"
    >
      <img 
        src={item.posterUrl} 
        alt={item.title} 
        onClick={onClick}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-end p-4">
        <h3 className="text-sm font-bold truncate">{item.title}</h3>
        <div className="flex items-center gap-2 mt-2 pointer-events-auto">
          <div 
            onClick={onClick}
            className="p-2 rounded-full bg-white text-black hover:bg-white/80 transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (user) toggleWatchlist(item.id);
            }}
            className={cn(
              "p-2 rounded-full border transition-all",
              isInWatchlist ? "bg-red-600 border-red-600" : "border-white/50 hover:border-white"
            )}
          >
            <Plus className={cn("w-4 h-4 transition-transform", isInWatchlist && "rotate-45")} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Row = ({ title, items, onMovieClick }: { title: string; items: any[]; onMovieClick: (m: any) => void }) => {
  if (items.length === 0) return null;
  return (
    <div className="mb-12">
      <h2 className="text-xl md:text-2xl font-bold mb-4 px-4 md:px-12 flex items-center gap-2 group cursor-pointer">
        {title}
        <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
      </h2>
      <div className="flex gap-4 overflow-x-auto px-4 md:px-12 pb-8 no-scrollbar scroll-smooth">
        {items.map((item: any) => (
          <MovieCard key={item.id} item={item} onClick={() => onMovieClick(item)} />
        ))}
      </div>
    </div>
  );
};

function MainApp() {
  const { user, watchlist, profile } = useAuth();
  const [media, setMedia] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<any | null>(null);

  useEffect(() => {
    seedDatabase();
    const q = query(collection(db, 'media'), orderBy('year', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedia(docs);
    });
    return unsubscribe;
  }, []);

  // Real Recommendation Engine Implementation
  useEffect(() => {
    if (!user || media.length === 0) {
      setRecommendations([]);
      return;
    }

    const fetchRecommendations = async () => {
      const historyQ = query(
        collection(db, 'watch_history'),
        where('userId', '==', user.uid),
        orderBy('watchedAt', 'desc'),
        limit(10)
      );
      
      const historySnap = await getDocs(historyQ);
      if (historySnap.empty) {
        // Fallback: suggest trending or random
        setRecommendations(media.slice(0, 8));
        return;
      }

      // Analyze favorite genres from history
      const genreCounts: Record<string, number> = {};
      const watchedIds = new Set();
      
      historySnap.docs.forEach(d => {
        const h = d.data();
        watchedIds.add(h.mediaId);
        const item = media.find(m => m.id === h.mediaId);
        if (item) {
          const genres = item.genre.split('•').map((g: string) => g.trim());
          genres.forEach((g: string) => {
            genreCounts[g] = (genreCounts[g] || 0) + 1;
          });
        }
      });

      const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      
      const recs = media
        .filter(m => !watchedIds.has(m.id) && m.genre.includes(topGenre))
        .slice(0, 10);
      
      setRecommendations(recs.length > 0 ? recs : media.slice(0, 10));
    };

    fetchRecommendations();
  }, [user, media]);

  const filteredMedia = useMemo(() => {
    return media.filter(m => {
      const matchesSearch = !searchQuery || 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.genre.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'All' || m.genre.includes(selectedGenre);
      return matchesSearch && matchesGenre;
    });
  }, [media, searchQuery, selectedGenre]);

  const watchlistMedia = media.filter(m => watchlist.includes(m.id));

  const recordWatchHistory = async (movie: any) => {
    if (!user) return;
    const historyId = `${user.uid}_${movie.id}`;
    await setDoc(doc(db, 'watch_history', historyId), {
      userId: user.uid,
      mediaId: movie.id,
      watchedAt: serverTimestamp(),
      progress: 0
    });
  };

  const handleMoviePlay = (movie: any) => {
    if (movie.isOriginal && (!profile || profile.subscriptionTier === 'free')) {
      setIsBillingOpen(true);
      return;
    }
    recordWatchHistory(movie);
    setActiveVideo(movie);
  };

  const heroMovie = media.find(m => m.isOriginal) || media[0];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-red-600 selection:text-white">
      <Navbar 
        onAuthClick={() => setIsAuthModalOpen(true)} 
        onSearch={setSearchQuery} 
        onSettingsClick={() => setIsSettingsOpen(true)} 
        onBillingClick={() => setIsBillingOpen(true)}
      />

      <AnimatePresence>
        {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />}
        {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
        {isBillingOpen && <BillingModal isOpen={isBillingOpen} onClose={() => setIsBillingOpen(false)} />}
        {activeVideo && (
          <VideoPlayer 
            src={activeVideo.videoUrl} 
            title={activeVideo.title} 
            onClose={() => setActiveVideo(null)} 
          />
        )}
      </AnimatePresence>

      {/* Hero Section */}
      {heroMovie && (
        <section className="relative h-[85vh] md:h-screen w-full overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={heroMovie.backdropUrl} 
              alt="Hero" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          </div>

          <div className="relative h-full flex flex-col justify-center px-4 md:px-12 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="flex items-center gap-3 mb-4">
                {heroMovie.isOriginal && <span className="px-2 py-0.5 bg-red-600 text-[10px] font-bold rounded uppercase tracking-widest">Original</span>}
                <span className="text-sm font-medium text-white/60">{heroMovie.year} • {heroMovie.rating} • {heroMovie.genre}</span>
              </div>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 leading-none italic uppercase">
                {heroMovie.title}
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-8 line-clamp-3 max-w-xl">
                {heroMovie.description}
              </p>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleMoviePlay(heroMovie)}
                  className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded font-bold hover:bg-white/90 transition-all transform active:scale-95"
                >
                  <Play className="w-6 h-6 fill-current" />
                  Play Now
                </button>
                <button className="flex items-center gap-2 px-8 py-3 bg-white/20 backdrop-blur-md text-white rounded font-bold hover:bg-white/30 transition-all border border-white/10">
                  <Info className="w-6 h-6" />
                  More Info
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Genre Filter */}
      <div className="relative z-30 px-4 md:px-12 -mt-16 mb-8 flex gap-2 overflow-x-auto no-scrollbar">
        {GENRES.map(genre => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={cn(
              "px-6 py-2 rounded-full border transition-all text-sm font-bold whitespace-nowrap",
              selectedGenre === genre 
                ? "bg-white text-black border-white" 
                : "bg-black/40 text-white/60 border-white/10 hover:border-white/40"
            )}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Content Rows */}
      <div className="relative z-20">
        {searchQuery || selectedGenre !== 'All' ? (
          <Row title={`Results`} items={filteredMedia} onMovieClick={handleMoviePlay} />
        ) : (
          <>
            {watchlistMedia.length > 0 && <Row title="My List" items={watchlistMedia} onMovieClick={handleMoviePlay} />}
            <Row title="Trending Now" items={media.filter(m => m.type === 'movie')} onMovieClick={handleMoviePlay} />
            <Row title="Original Series" items={media.filter(m => m.type === 'series')} onMovieClick={handleMoviePlay} />
            {recommendations.length > 0 && <Row title="Tailored for You" items={recommendations} onMovieClick={handleMoviePlay} />}
            <Row title="New Releases" items={media.slice().reverse()} onMovieClick={handleMoviePlay} />
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="px-4 md:px-12 py-20 border-t border-white/10 bg-black/40">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          <div className="flex flex-col gap-4 text-sm text-white/50">
            <h4 className="text-white font-bold mb-2">Platform</h4>
            <a href="#" className="hover:underline">Browse</a>
            <a href="#" className="hover:underline">Devices</a>
            <a href="#" className="hover:underline">Accessibility</a>
          </div>
          <div className="flex flex-col gap-4 text-sm text-white/50">
            <h4 className="text-white font-bold mb-2">Company</h4>
            <a href="#" className="hover:underline">About Us</a>
            <a href="#" className="hover:underline">Press</a>
            <a href="#" className="hover:underline">Careers</a>
          </div>
          <div className="flex flex-col gap-4 text-sm text-white/50">
            <h4 className="text-white font-bold mb-2">Support</h4>
            <a href="#" className="hover:underline">Help Center</a>
            <a href="#" className="hover:underline">Terms of Use</a>
            <a href="#" className="hover:underline">Privacy</a>
          </div>
          <div className="flex flex-col gap-4 text-sm text-white/50">
            <h4 className="text-white font-bold mb-2">Social</h4>
            <a href="#" className="hover:underline">Twitter</a>
            <a href="#" className="hover:underline">Instagram</a>
            <a href="#" className="hover:underline">YouTube</a>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-white/5">
          <p className="text-xs text-white/30">© 2026 NETSEX Streaming Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 border border-white/20 rounded text-[10px] text-white/40 uppercase tracking-widest">Service Code: 2026-X</div>
          </div>
        </div>
      </footer>

      {/* Global CSS for no-scrollbar */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
