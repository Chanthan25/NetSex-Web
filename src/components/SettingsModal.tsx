import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Camera, Save } from 'lucide-react';
import { useAuth } from '../AuthContext';

export const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { profile, updateProfile } = useAuth();
  const [name, setName] = useState(profile?.displayName || '');
  const [avatar, setAvatar] = useState(profile?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile({ displayName: name, photoURL: avatar });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg bg-[#141414] rounded-2xl p-8 border border-white/10"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full">
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-8">Account Settings</h2>

        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <img src={avatar || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} className="w-24 h-24 rounded-full object-cover border-2 border-red-600" alt="Avatar" />
              <button className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6" />
              </button>
            </div>
            <p className="text-xs text-white/40 mt-2">Recommended: 200x200px</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Display Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-red-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Avatar URL</label>
            <input 
              type="text" 
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-red-600 font-mono text-sm"
              placeholder="https://..."
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? "Saving..." : <><Save className="w-5 h-5" /> Save Changes</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
