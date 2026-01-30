
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { createClient, User } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://cgbvqulyfelkgkaubqwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnYnZxdWx5ZmVsa2drYXVicXdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MzU4OTYsImV4cCI6MjA4NTMxMTg5Nn0.hrf6tEakSJaOBOHmfYfNqGYcbLZqgIgq8t3-K4dTbgg';
const PAYSTACK_PUBLIC_KEY = 'pk_live_fa45d8687ff6e15b6e182b34a7884fb7da1c3e1a';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- TYPES ---
interface Rider {
  id: string;
  full_name: string;
  phone_number: string;
  base_name: string;
  county: string;
  town: string;
  bike_plate: string;
  profile_image: string; // Changed from photo_url to profile_image
  is_premium: boolean;
  created_at: string;
}

// --- HELPERS ---
const formatPhoneForWA = (phone: string) => {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) return '254' + clean.slice(1);
  if (clean.startsWith('254')) return clean;
  return '254' + clean;
};

// --- COMPONENTS ---

const App = () => {
  const [view, setView] = useState<'directory' | 'auth' | 'profile'>('directory');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Rider | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchMyProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchMyProfile(currentUser.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    fetchActiveRiders();
    return () => subscription.unsubscribe();
  }, []);

  const fetchMyProfile = async (id: string) => {
    const { data, error } = await supabase.from('boda_profiles').select('*').eq('id', id).single();
    if (!error && data) setProfile(data);
    setLoading(false);
  };

  const fetchActiveRiders = async () => {
    const { data, error } = await supabase
      .from('boda_profiles')
      .select('*')
      .eq('is_premium', true)
      .order('created_at', { ascending: false });
    
    if (!error && data) setRiders(data);
  };

  const filteredRiders = useMemo(() => {
    const term = search.toLowerCase();
    return riders.filter(r => 
      r.town?.toLowerCase().includes(term) || 
      r.base_name?.toLowerCase().includes(term) ||
      r.county?.toLowerCase().includes(term) ||
      r.full_name?.toLowerCase().includes(term)
    );
  }, [riders, search]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setView('directory');
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-[#FACC15] selection:text-slate-900">
      <header className="bg-slate-900 text-white sticky top-0 z-50 border-b-4 border-[#FACC15] shadow-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('directory')}>
            <div className="bg-[#FACC15] text-slate-900 w-10 h-10 flex items-center justify-center rounded-xl font-black text-xl group-hover:rotate-6 transition-transform">B</div>
            <span className="text-xl md:text-2xl font-black tracking-tighter italic uppercase">BodaNearMe</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <button onClick={() => setView('profile')} className="hidden md:block text-xs font-black uppercase text-[#FACC15] border border-[#FACC15] px-4 py-2 rounded-lg hover:bg-[#FACC15] hover:text-slate-900 transition-colors">My Profile</button>
                <button onClick={handleSignOut} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-red-600 transition-colors">Exit</button>
              </div>
            ) : (
              <button onClick={() => setView('auth')} className="bg-[#FACC15] text-slate-900 px-6 py-2 rounded-xl font-black text-sm hover:scale-105 transition-transform shadow-lg">Rider Login</button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {view === 'directory' && (
          <div className="animate-slide-in">
            <div className="bg-slate-900 pt-16 pb-24 px-4 text-center">
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none">Reliable Rides. <br/><span className="text-[#FACC15]">Verified Riders.</span></h1>
              <p className="text-slate-400 font-bold mb-10 max-w-xl mx-auto">Kenya's premium directory for professional Boda Boda transportation.</p>
              <div className="max-w-2xl mx-auto relative group">
                <input 
                  type="text" 
                  placeholder="Enter Town or Stage Name..." 
                  className="w-full p-6 md:p-8 rounded-[2.5rem] bg-white border-8 border-slate-800 shadow-2xl text-xl font-black outline-none focus:border-[#FACC15] transition-all group-hover:scale-[1.02]" 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-[#FACC15] p-4 rounded-3xl hidden md:block border-2 border-slate-900">
                  <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 -mt-12 pb-20">
              {filteredRiders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredRiders.map(rider => <RiderCard key={rider.id} rider={rider} />)}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-[3rem] shadow-xl border-4 border-dashed border-slate-100">
                  <div className="text-7xl mb-4 opacity-20">🏍️</div>
                  <h3 className="text-2xl font-black text-slate-400 uppercase italic">No riders found in this area yet</h3>
                  <p className="text-slate-300 font-bold">Try searching for a different town.</p>
                </div>
              )}
            </div>
          </div>
        )}
        {view === 'auth' && <AuthView mode={authMode} setMode={setAuthMode} onSuccess={() => setView('profile')} />}
        {view === 'profile' && user && <ProfileView user={user} profile={profile} onRefresh={() => fetchMyProfile(user.id)} onDone={() => { setView('directory'); fetchActiveRiders(); }} />}
      </main>

      <footer className="bg-slate-900 text-slate-500 py-12 px-4 text-center border-t border-slate-800">
        <div className="bg-[#FACC15] text-slate-900 w-12 h-12 flex items-center justify-center rounded-xl font-black text-xl mx-auto mb-4">B</div>
        <p className="font-black text-xs uppercase tracking-widest mb-2">BodaNearMe Network Africa</p>
        <p className="text-[10px] font-bold">© 2024 • Verified Transportation Directory • Ride Safe</p>
      </footer>
    </div>
  );
};

const RiderCard = ({ rider }: { rider: Rider }) => {
  const handleCall = () => window.location.href = `tel:${rider.phone_number}`;
  const handleWA = () => {
    const waPhone = formatPhoneForWA(rider.phone_number);
    const msg = encodeURIComponent(`Hello ${rider.full_name}, I saw your profile on BodaNearMe and I need a ride.`);
    window.open(`https://wa.me/${waPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border-2 border-slate-100 p-3 overflow-hidden transition-all hover:border-[#FACC15] hover:-translate-y-2 group">
      <div className="relative h-72 rounded-[2rem] overflow-hidden bg-slate-200">
        <img src={rider.profile_image || `https://picsum.photos/seed/${rider.id}/600/600`} alt={rider.full_name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md text-[#FACC15] text-[10px] font-black px-4 py-1.5 rounded-full border border-[#FACC15] shadow-lg">VERIFIED RIDER</div>
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl">
           <h3 className="text-xl font-black text-slate-900 truncate uppercase tracking-tighter">{rider.full_name}</h3>
           <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest leading-none mt-1">{rider.base_name} • {rider.town}</p>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="block text-[8px] text-slate-400 font-black uppercase mb-0.5">Plate Number</span>
            <span className="font-black text-slate-900 uppercase italic tracking-tighter">{rider.bike_plate}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="block text-[8px] text-slate-400 font-black uppercase mb-0.5">County</span>
            <span className="font-black text-slate-900 uppercase tracking-tighter">{rider.county}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCall} className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-tighter">
            <svg className="w-5 h-5 text-[#FACC15]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
            Call
          </button>
          <button onClick={handleWA} className="w-16 bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const AuthView = ({ mode, setMode, onSuccess }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        alert("Success! You can now log in.");
        setMode('login');
        setLoading(false);
        return;
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-[3rem] shadow-2xl border-4 border-slate-900 animate-slide-in">
      <h2 className="text-4xl font-black mb-2 text-slate-900 tracking-tighter italic uppercase">{mode === 'login' ? 'Login' : 'Join Us'}</h2>
      <p className="text-slate-500 font-bold mb-8 uppercase text-xs tracking-widest">Official Rider Portal</p>
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-black border-2 border-red-100">{error}</div>}
      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Email Address</label>
          <input type="email" required className="w-full p-4 rounded-2xl bg-slate-50 border-4 border-slate-100 focus:border-[#FACC15] outline-none font-bold transition-all text-lg" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Secret Password</label>
          <input type="password" required className="w-full p-4 rounded-2xl bg-slate-50 border-4 border-slate-100 focus:border-[#FACC15] outline-none font-bold transition-all text-lg" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button disabled={loading} className="w-full bg-[#FACC15] text-slate-900 font-black py-5 rounded-2xl text-xl shadow-xl mt-6 hover:brightness-110 active:scale-95 transition-all uppercase tracking-tighter italic">{loading ? 'WAIT...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}</button>
      </form>
      <div className="mt-8 text-center">
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-slate-900 font-black uppercase text-xs tracking-widest hover:underline">{mode === 'login' ? "Need an account? Sign Up" : "Already registered? Log In"}</button>
      </div>
    </div>
  );
};

const ProfileView = ({ user, profile, onRefresh, onDone }: any) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    base_name: profile?.base_name || '',
    county: profile?.county || '',
    town: profile?.town || '',
    bike_plate: profile?.bike_plate || '',
  });
  const [photo, setPhoto] = useState<File | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let profile_image = profile?.profile_image || '';
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `rider_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage.from('boda-media').upload(fileName, photo);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from('boda-media').getPublicUrl(uploadData.path);
        profile_image = publicUrl;
      }

      const { error } = await supabase.from('boda_profiles').upsert({
        id: user.id,
        ...formData,
        profile_image, // Using profile_image column
      });

      if (error) throw error;
      alert("Profile Saved!");
      onRefresh();
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    try {
      // @ts-ignore
      const paystack = new (window as any).PaystackPop();
      paystack.newTransaction({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: 2000, // 20 KES
        currency: 'KES',
        onSuccess: async (transaction: any) => {
          setLoading(true);
          const { error } = await supabase.rpc('activate_boda_premium', {
            target_rider_id: user.id,
            payment_reference: transaction.reference
          });
          if (error) alert("Verification Error: " + error.message);
          else onRefresh();
          setLoading(false);
        },
        onCancel: () => alert('Transaction Cancelled'),
      });
    } catch (e) {
      alert("Paystack module failed to load. Please check your internet connection and refresh.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4 pb-20 animate-slide-in">
      <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border-4 border-slate-900">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Rider Profile</h2>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-1">Manage your public listing</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border-2 border-slate-100">
             <div className={`h-4 w-4 rounded-full ${profile?.is_premium ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
             <span className="text-sm font-black uppercase text-slate-700">{profile?.is_premium ? 'Premium Listing Active' : 'Directory Visibility: Off'}</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
              <input required className="w-full p-5 rounded-2xl bg-slate-50 border-4 border-slate-100 focus:border-[#FACC15] outline-none font-bold transition-all text-lg" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">M-Pesa Phone</label>
              <input required className="w-full p-5 rounded-2xl bg-slate-50 border-4 border-slate-100 focus:border-[#FACC15] outline-none font-bold transition-all text-lg" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stage / Base Name</label>
              <input required className="w-full p-5 rounded-2xl bg-slate-50 border-4 border-slate-100 focus:border-[#FACC15] outline-none font-bold transition-all text-lg" value={formData.base_name} onChange={e => setFormData({...formData, base_name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bike Plate Number</label>
              <input required className="w-full p-5 rounded-2xl bg-slate-50 border-4 border-slate-100 focus:border-[#FACC15] outline-none font-bold transition-all text-lg uppercase italic" value={formData.bike_plate} onChange={e => setFormData({...formData, bike_plate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">County</label>
              <input required className="w-full p-5 rounded-2xl bg-slate-50 border-4 border-slate-100 focus:border-[#FACC15] outline-none font-bold transition-all text-lg" value={formData.county} onChange={e => setFormData({...formData, county: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Town</label>
              <input required className="w-full p-5 rounded-2xl bg-slate-50 border-4 border-slate-100 focus:border-[#FACC15] outline-none font-bold transition-all text-lg" value={formData.town} onChange={e => setFormData({...formData, town: e.target.value})} />
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Rider Photo</label>
            <div className="flex items-center gap-6">
              {profile?.profile_image && <img src={profile.profile_image} className="w-24 h-24 rounded-3xl object-cover border-4 border-[#FACC15] shadow-lg" alt="Current" />}
              <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} className="flex-grow p-6 rounded-3xl bg-slate-50 border-4 border-dashed border-slate-200 text-xs font-black cursor-pointer hover:border-[#FACC15] transition-colors" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl text-2xl shadow-2xl hover:scale-[1.01] active:scale-95 transition-all uppercase tracking-tighter italic">{loading ? 'WAITING...' : 'SAVE PROFILE'}</button>
        </form>

        {!profile?.is_premium && (
          <div className="mt-12 pt-12 border-t-8 border-slate-50">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-8 rounded-[2.5rem] border-4 border-[#FACC15] text-center shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl -rotate-12 translate-x-1/4 -translate-y-1/4">🚀</div>
              <h4 className="text-3xl font-black text-slate-900 mb-2 uppercase italic tracking-tighter">Activate Visibility</h4>
              <p className="text-slate-600 font-bold mb-8 max-w-md mx-auto text-lg leading-snug">Verification ensures trust. Pay KES 20 to be listed in our public directory for 30 days.</p>
              <button onClick={handlePayment} className="bg-[#FACC15] text-slate-900 font-black px-12 py-5 rounded-[2rem] shadow-2xl hover:scale-110 active:scale-95 transition-all text-xl uppercase tracking-tighter">Verify Now (KES 20)</button>
            </div>
          </div>
        )}
        <div className="mt-10 text-center">
          <button onClick={onDone} className="text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-colors">Back to Directory</button>
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
