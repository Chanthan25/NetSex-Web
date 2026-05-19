import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, Zap, Shield, Crown } from 'lucide-react';
import { useAuth } from '../AuthContext';

export const BillingModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async (tier: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          userId: user.uid,
          email: user.email,
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to initiate checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const TIERS = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      features: ['Standard quality', 'Ad-supported', 'Limited library'],
      icon: <Shield className="w-8 h-8 text-white/40" />,
      color: 'bg-white/5',
    },
    {
      id: 'basic',
      name: 'Basic',
      price: '$9.99',
      features: ['HD Streaming', 'No Ads', 'Full library'],
      icon: <Zap className="w-8 h-8 text-blue-500" />,
      color: 'bg-blue-600/10',
      borderColor: 'border-blue-500/50',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$19.99',
      features: ['4K + HDR', 'Spatial Audio', 'Personalized AI Curator', 'Offline Downloads'],
      icon: <Crown className="w-8 h-8 text-amber-500" />,
      color: 'bg-amber-600/10',
      borderColor: 'border-amber-500/50',
    }
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-5xl p-8"
      >
        <button onClick={onClose} className="absolute top-0 right-0 p-4 text-white/40 hover:text-white">
          <X className="w-8 h-8" />
        </button>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-black italic tracking-tighter mb-4">CHOOSE YOUR POWER</h2>
          <p className="text-white/60">Upgrade your experience and unlock the full potential of NETSEX.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div 
              key={tier.id}
              className={cn(
                "relative group flex flex-col p-8 rounded-2xl border transition-all duration-500",
                tier.borderColor || "border-white/10",
                tier.color,
                profile?.subscriptionTier === tier.id && "ring-2 ring-red-600"
              )}
            >
              {profile?.subscriptionTier === tier.id && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Current Plan
                </div>
              )}
              
              <div className="mb-6">{tier.icon}</div>
              <h3 className="text-2xl font-bold mb-1">{tier.name}</h3>
              <p className="text-3xl font-black mb-8">{tier.price}<span className="text-sm font-normal text-white/40">/mo</span></p>
              
              <ul className="space-y-4 mb-10 flex-1">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-white/70">
                    <Check className="w-4 h-4 text-green-500" /> {f}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleSubscribe(tier.id)}
                disabled={loading || tier.id === 'free' || profile?.subscriptionTier === tier.id}
                className={cn(
                  "w-full py-4 rounded-xl font-bold transition-all active:scale-95",
                  tier.id === 'free' ? "bg-white/5 text-white/40 cursor-not-allowed" : 
                  profile?.subscriptionTier === tier.id ? "bg-white/10 text-white/40 cursor-not-allowed" :
                  "bg-white text-black hover:bg-white/90"
                )}
              >
                {loading ? "Processing..." : tier.id === 'free' ? "Basic Tier" : profile?.subscriptionTier === tier.id ? "Activated" : "Get Started"}
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
