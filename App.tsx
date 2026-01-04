import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { TaskCard } from './components/TaskCard';
import { Button } from './components/Button';
import { USERS, MACHINES, INITIAL_TASKS, APP_VERSION } from './constants';
import { Role, Task, TaskPriority, TaskStatus, User } from './types';
import { generateTaskDetails } from './services/geminiService';
import { fetchCloudTasks, updateCloudTasks } from './services/storageService';
import { Activity, AlertCircle, Bot, CheckCircle2, Clock, Camera, Image as ImageIcon, X, Wifi, WifiOff, Copy, Zap, ShieldCheck, KeyRound } from 'lucide-react';

const App: React.FC = () => {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  
  // Create Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [machineNameInput, setMachineNameInput] = useState('');
  const [taskImage, setTaskImage] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState(USERS.filter(u => u.role === Role.MASTER)[0].id);
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Sync State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [cloudId, setCloudId] = useState<string | null>(null);
  const [inputCloudId, setInputCloudId] = useState('');
  const [syncStatus, setSyncStatus] = useState<'offline' | 'syncing' | 'online' | 'error'>('offline');
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- EFFECT: Load Local Config & Init ---
  useEffect(() => {
    // 1. Load User preference
    const savedUser = localStorage.getItem('hidro_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

    // 2. Load Cloud ID if exists
    const savedCloudId = localStorage.getItem('hidro_cloud_id');
    if (savedCloudId) {
      setCloudId(savedCloudId);
      setSyncStatus('syncing');
      // Initial fetch
      fetchCloudTasks(savedCloudId).then(res => {
        if (res.success && res.data) {
          if (res.data.length > 0) {
            setTasks(res.data);
          }
          setSyncStatus('online');
        } else {
          setSyncStatus('error');
        }
      });
    } else {
      // Fallback to local storage tasks if no cloud
      const savedTasks = localStorage.getItem('hidro_tasks');
      if (savedTasks) setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // --- EFFECT: Polling for Updates (Real-time Simulation) ---
  useEffect(() => {
    if (!cloudId) return;

    // Poll frequently (every 4 seconds) - KVDB is fast enough
    const intervalId = setInterval(async () => {
      const res = await fetchCloudTasks(cloudId);
      if (res.success && res.data && res.data.length > 0) {
        // Deep comparison to avoid unnecessary renders
        if (JSON.stringify(res.data) !== JSON.stringify(tasks)) {
          setTasks(res.data);
          setLastSyncTime(Date.now());
        }
        if (syncStatus !== 'online') setSyncStatus('online');
      }
    }, 4000); 

    return () => clearInterval(intervalId);
  }, [cloudId, tasks, syncStatus]);

  // --- EFFECT: Local Persistence Backup ---
  useEffect(() => {
    localStorage.setItem('hidro_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // --- HANDLERS ---

  const handleLogin = (userId: string) => {
    const user = USERS.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('hidro_user', JSON.stringify(user));
      setCurrentView('tasks');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('hidro_user');
  };

  // Centralized Task Update Logic with Cloud Sync
  const updateTasksAndSync = async (newTasks: Task[]) => {
    setTasks(newTasks); // Optimistic UI update (Instant feedback)
    
    if (cloudId) {
      setSyncStatus('syncing');
      // Fire and forget - don't wait for response to unblock UI
      updateCloudTasks(cloudId, newTasks).then(res => {
         if (res.success) {
            setSyncStatus('online');
            setLastSyncTime(Date.now());
         } else {
            setSyncStatus('error');
         }
      });
    }
  };

  const handleUpdateStatus = (taskId: string, newStatus: TaskStatus, note?: string, rating?: number) => {
    const newTaskList = tasks.map(t => {
      if (t.id !== taskId) return t;

      const updatedTask = { ...t, status: newStatus };
      if (newStatus === TaskStatus.IN_PROGRESS && !t.startedAt) updatedTask.startedAt = Date.now();
      if (newStatus === TaskStatus.COMPLETED && !t.completedAt) updatedTask.completedAt = Date.now();
      
      // Add feedback if provided
      if (note) updatedTask.managerNote = note;
      if (rating) updatedTask.rating = rating;
      
      return updatedTask;
    });
    
    updateTasksAndSync(newTaskList);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTaskTitle,
      description: newTaskDesc,
      machineName: machineNameInput,
      imageUrl: taskImage || undefined,
      assigneeId: selectedAssignee,
      creatorId: currentUser!.id,
      priority: selectedPriority,
      status: TaskStatus.PENDING,
      createdAt: Date.now(),
    };
    
    updateTasksAndSync([newTask, ...tasks]);
    
    setCurrentView('tasks');
    setNewTaskTitle('');
    setNewTaskDesc('');
    setMachineNameInput('');
    setTaskImage(null);
  };

  const handleEnrichWithAI = async () => {
    if (!newTaskTitle) return;
    setIsGeneratingAI(true);
    const context = machineNameInput || 'Hidrolik Makine';
    const suggestion = await generateTaskDetails(newTaskTitle, context);
    setNewTaskDesc(prev => (prev ? prev + "\n\n" : "") + suggestion);
    setIsGeneratingAI(false);
  };

  // Camera Handlers
  const handleTriggerCamera = () => fileInputRef.current?.click();
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTaskImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  const handleRemoveImage = () => {
    setTaskImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Cloud Sync Handlers
  const handleConnectCloud = async () => {
    if (!inputCloudId) return;
    
    // Normalize ID: remove spaces, lowercase, limit special chars to avoid URL issues
    const cleanId = inputCloudId.trim().replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    if (cleanId.length < 3) {
      alert("Lütfen en az 3 karakterli bir kod girin.");
      return;
    }

    setSyncStatus('syncing');
    
    // 1. Try to fetch existing data
    const res = await fetchCloudTasks(cleanId);
    
    if (res.success) {
      if (res.error === 'NOT_FOUND') {
        // This is a NEW room. Initialize it with current tasks.
        const initRes = await updateCloudTasks(cleanId, tasks);
        if (initRes.success) {
          alert('Yeni Fabrika Odası Kuruldu! Bu kodu ustalarla paylaşın.');
        } else {
          alert('Bağlantı kurulamadı. Lütfen kodu değiştirip tekrar deneyin.');
          setSyncStatus('error');
          return;
        }
      } else if (res.data && res.data.length > 0) {
        // Existing room with data
        if (confirm('Bu kodda kayıtlı veriler bulundu. Yüklensin mi? (Mevcut ekranınızdaki veriler güncellenecek)')) {
           setTasks(res.data);
        }
      }
      
      // Success flow
      setCloudId(cleanId);
      localStorage.setItem('hidro_cloud_id', cleanId);
      setSyncStatus('online');
      setIsSyncModalOpen(false);
      setInputCloudId('');
    } else {
      alert('Sunucu hatası: ' + res.error);
      setSyncStatus('error');
    }
  };

  const handleDisconnectCloud = () => {
    if (confirm("Bağlantıyı keserseniz diğer cihazlarla veri alışverişi durur. Emin misiniz?")) {
        setCloudId(null);
        localStorage.removeItem('hidro_cloud_id');
        setSyncStatus('offline');
    }
  };

  // --- RENDER ---
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 relative">
        <div className="absolute top-4 left-4 text-xs font-mono text-slate-400">{APP_VERSION}</div>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200">
             <Activity size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">HidroTakip</h1>
          <p className="text-slate-500 mb-8">Fabrika İçi Hidrolik Bakım Yönetim Sistemi</p>
          <div className="space-y-3">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Giriş Yapılacak Rolü Seçin</p>
            {USERS.map(user => (
              <button key={user.id} onClick={() => handleLogin(user.id)} className="w-full flex items-center p-3 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all group">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full mr-4 grayscale group-hover:grayscale-0 transition-all" />
                <div className="text-left">
                  <div className="font-semibold text-slate-700 group-hover:text-indigo-700">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.role === Role.MANAGER ? 'Birim Amiri' : 'Bakım Ustası'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const relevantTasks = tasks.filter(task => {
    if (currentUser.role === Role.MANAGER) return true;
    return task.assigneeId === currentUser.id;
  });

  const pendingCount = relevantTasks.filter(t => t.status === TaskStatus.PENDING).length;
  const inProgressCount = relevantTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const completedCount = relevantTasks.filter(t => t.status === TaskStatus.COMPLETED).length;

  return (
    <Layout 
      currentUser={currentUser} 
      currentView={currentView} 
      onChangeView={setCurrentView}
      onLogout={handleLogout}
      onOpenDataTransfer={() => setIsSyncModalOpen(true)}
      syncStatus={syncStatus}
    >
      
      {/* VIEW: DASHBOARD */}
      {currentView === 'dashboard' && (
        <div className="space-y-6">
          <header className="flex justify-between items-start mb-6">
             <div>
               <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                 Hoş Geldin, {currentUser.name.split(' ')[0]} 👋
                 <span className="md:hidden ml-2 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-normal">{APP_VERSION}</span>
               </h1>
               <div className="flex items-center text-sm mt-1">
                 <p className="text-slate-500 mr-2">Birim durumu özeti.</p>
                 {syncStatus === 'online' && (
                   <span className="flex items-center text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium animate-pulse">
                     <Wifi size={12} className="mr-1" /> Canlı Sistem Aktif
                   </span>
                 )}
                 {syncStatus === 'offline' && (
                   <span 
                    onClick={() => setIsSyncModalOpen(true)}
                    className="flex items-center text-red-500 bg-red-50 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:bg-red-100"
                   >
                     <WifiOff size={12} className="mr-1" /> Bağlantı Yok - Tıkla
                   </span>
                 )}
               </div>
             </div>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <StatCard label="Bekleyen" value={pendingCount} icon={<Clock className="text-orange-500" />} color="bg-orange-50" />
             <StatCard label="İşlemde" value={inProgressCount} icon={<Activity className="text-blue-500" />} color="bg-blue-50" />
             <StatCard label="Tamamlanan" value={completedCount} icon={<CheckCircle2 className="text-green-500" />} color="bg-green-50" />
             <StatCard label="Toplam Makine" value={MACHINES.length} icon={<AlertCircle className="text-indigo-500" />} color="bg-indigo-50" />
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Acil Müdahale Gerekenler</h2>
            <div className="space-y-4">
              {relevantTasks
                .filter(t => t.priority === TaskPriority.URGENT || t.priority === TaskPriority.HIGH)
                .slice(0, 3)
                .map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    machines={MACHINES} 
                    users={USERS} 
                    currentUser={currentUser}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
                {relevantTasks.filter(t => t.priority === TaskPriority.URGENT || t.priority === TaskPriority.HIGH).length === 0 && (
                  <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500">Harika! Acil bir durum yok.</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CREATE TASK */}
      {currentView === 'create' && currentUser.role === Role.MANAGER && (
        <div className="max-w-xl mx-auto">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Yeni Arıza/Bakım Görevi</h2>
          <form onSubmit={handleCreateTask} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Arıza Başlığı</label>
              <input type="text" required value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Örn: Pres Ana Pompa Basınç Kaybı" className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Makine Adı/Yeri</label>
                <input type="text" required value={machineNameInput} onChange={(e) => setMachineNameInput(e.target.value)} placeholder="Örn: C Blok Pres 4" className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Öncelik</label>
                 <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value as TaskPriority)} className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500">
                  <option value={TaskPriority.LOW}>Düşük</option>
                  <option value={TaskPriority.MEDIUM}>Orta</option>
                  <option value={TaskPriority.HIGH}>Yüksek</option>
                  <option value={TaskPriority.URGENT}>ACİL</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Görevli Usta</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {USERS.filter(u => u.role === Role.MASTER).map(u => (
                   <div key={u.id} onClick={() => setSelectedAssignee(u.id)} className={`cursor-pointer flex items-center p-2 rounded-lg border transition-all ${selectedAssignee === u.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                     <img src={u.avatar} alt="" className="w-8 h-8 rounded-full mr-2" />
                     <span className="text-sm font-medium text-slate-700">{u.name}</span>
                   </div>
                 ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                 <label className="block text-sm font-medium text-slate-700">Açıklama / Talimatlar</label>
                 <button type="button" onClick={handleEnrichWithAI} disabled={isGeneratingAI || !newTaskTitle} className="text-xs flex items-center text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
                   <Bot size={14} className="mr-1" /> {isGeneratingAI ? 'AI Düşünüyor...' : 'AI ile Zenginleştir'}
                 </button>
              </div>
              <textarea rows={5} required value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} placeholder="Arıza detaylarını buraya girin..." className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 text-sm mb-2" />
              <div className="mt-2">
                 <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                 {!taskImage ? (
                    <button type="button" onClick={handleTriggerCamera} className="flex items-center space-x-2 text-sm text-slate-600 hover:text-indigo-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg transition-colors">
                      <Camera size={16} /> <span>Fotoğraf Çek / Ekle</span>
                    </button>
                 ) : (
                   <div className="relative inline-block mt-2">
                     <img src={taskImage} alt="Task" className="h-32 w-auto rounded-lg border border-slate-200 shadow-sm object-cover" />
                     <button type="button" onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">
                       <X size={14} />
                     </button>
                   </div>
                 )}
              </div>
            </div>
            <Button type="submit" fullWidth size="lg">Görevi Ata</Button>
          </form>
        </div>
      )}

      {/* MODAL: Simplified Cloud Connection (USER MANUAL INPUT) */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
              <h3 className="font-bold flex items-center text-lg">
                <Zap className="mr-2 fill-yellow-300 text-yellow-300" size={20} />
                Canlı Fabrika Sistemi
              </h3>
              <button onClick={() => setIsSyncModalOpen(false)} className="text-indigo-100 hover:text-white bg-indigo-700 p-1 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              
              {cloudId ? (
                // CONNECTED STATE
                <div className="text-center space-y-6">
                   <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                     <ShieldCheck size={40} />
                   </div>
                   
                   <div>
                     <h4 className="text-xl font-bold text-slate-800 mb-2">Sistem Aktif</h4>
                     <p className="text-slate-500">Tüm cihazlar aşağıdaki kodu kullanarak birbirine bağlı.</p>
                   </div>
                   
                   <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200">
                     <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-3">FABRİKA KODUNUZ</p>
                     <div className="flex items-center justify-between bg-white p-4 border border-slate-300 rounded-xl shadow-sm mb-3">
                       <code className="text-lg font-mono font-bold text-indigo-700 tracking-wider truncate mr-2">{cloudId}</code>
                       <button 
                        onClick={() => {
                          navigator.clipboard.writeText(cloudId);
                          alert("Kod kopyalandı!");
                        }}
                        className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 p-2 rounded-lg"
                       >
                         <Copy size={20} />
                       </button>
                     </div>
                     <p className="text-sm text-slate-600">
                       Bu kodu diğer ustalara verin. Onlar da <b>"Fabrika Kodunu Gir"</b> bölümüne bunu yazacak.
                     </p>
                   </div>

                   <Button variant="ghost" onClick={handleDisconnectCloud} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                     Sistemden Çıkış Yap (Bağlantıyı Kes)
                   </Button>
                </div>
              ) : (
                // DISCONNECTED STATE - MANUAL INPUT
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-lg font-bold text-slate-800">Fabrika Kodunu Giriniz</h4>
                    <p className="text-slate-500 text-sm mt-1">Eğer kodunuz yoksa, klavyeden karmaşık bir şifre uydurup yazın.</p>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-indigo-100 bg-indigo-50/50">
                     <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center">
                       <KeyRound size={16} className="mr-2" />
                       Fabrika Kodu / Şifresi
                     </label>
                     <div className="flex gap-2">
                       <input 
                         type="text" 
                         className="flex-1 rounded-lg border-indigo-200 text-base py-3 px-4 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                         placeholder="Örn: erkan-usta-istanbul-34"
                         value={inputCloudId}
                         onChange={(e) => setInputCloudId(e.target.value)}
                       />
                     </div>
                     <p className="text-xs text-indigo-700/70 mt-3 leading-relaxed">
                       <b>İpucu:</b> Bu alana istediğiniz şeyi yazabilirsiniz. Örneğin: <code>fabrika-adim-2025</code>. 
                       Yazdığınız kod daha önce kullanılmamışsa, sistem otomatik olarak <b>YENİ</b> bir oda açar.
                       Daha önce kullanılmışsa, o odaya <b>BAĞLANIR</b>.
                     </p>
                  </div>

                  <Button onClick={handleConnectCloud} disabled={!inputCloudId} fullWidth size="lg">
                    Sisteme Bağlan / Oda Kur
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
    <div className={`p-2 rounded-lg mb-2 ${color} bg-opacity-50`}>
      {icon}
    </div>
    <div className="text-2xl font-bold text-slate-800">{value}</div>
    <div className="text-xs text-slate-500 font-medium">{label}</div>
  </div>
);

export default App;