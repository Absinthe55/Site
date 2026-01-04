import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus, Role, User, Machine } from '../types';
import { Clock, AlertTriangle, User as UserIcon, CheckCircle2, Bot, Timer, Image as ImageIcon, ChevronDown, ChevronUp, Star, MessageSquare } from 'lucide-react';
import { Button } from './Button';

interface TaskCardProps {
  task: Task;
  machines: Machine[];
  users: User[];
  currentUser: User;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus, note?: string, rating?: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  machines, 
  users, 
  currentUser, 
  onUpdateStatus 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isApprovalMode, setIsApprovalMode] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [approvalRating, setApprovalRating] = useState(5);

  // Use manually entered name if available, otherwise lookup ID
  const machineName = task.machineName || machines.find(m => m.id === task.machineId)?.name || 'Bilinmeyen Makine';
  const machineLocation = task.machineName ? '' : (machines.find(m => m.id === task.machineId)?.location || '');

  const assignee = users.find(u => u.id === task.assigneeId);
  
  const priorityColors = {
    [TaskPriority.LOW]: 'bg-slate-100 text-slate-700 border-slate-200',
    [TaskPriority.MEDIUM]: 'bg-blue-50 text-blue-700 border-blue-200',
    [TaskPriority.HIGH]: 'bg-orange-50 text-orange-700 border-orange-200',
    [TaskPriority.URGENT]: 'bg-red-50 text-red-700 border-red-200 animate-pulse',
  };

  const statusColors = {
    [TaskStatus.PENDING]: 'text-slate-500 bg-slate-100',
    [TaskStatus.IN_PROGRESS]: 'text-blue-600 bg-blue-50',
    [TaskStatus.COMPLETED]: 'text-green-600 bg-green-50',
    [TaskStatus.APPROVED]: 'text-indigo-600 bg-indigo-50',
  };

  const statusLabels = {
    [TaskStatus.PENDING]: 'Beklemede',
    [TaskStatus.IN_PROGRESS]: 'İşlemde',
    [TaskStatus.COMPLETED]: 'Tamamlandı',
    [TaskStatus.APPROVED]: 'Onaylandı',
  };

  const getDuration = () => {
    if (!task.startedAt || !task.completedAt) return null;
    const diffMs = task.completedAt - task.startedAt;
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return '1 dk\'dan az';
    return `${diffMins} dakika`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const handleApprove = () => {
    onUpdateStatus(task.id, TaskStatus.APPROVED, approvalNote, approvalRating);
    setIsApprovalMode(false);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4 transition-all hover:shadow-md">
      {/* Header Section - Clickable for Collapse/Expand */}
      <div 
        className="cursor-pointer select-none" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start mb-3">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${priorityColors[task.priority]}`}>
            {task.priority === TaskPriority.URGENT && <AlertTriangle size={12} className="inline mr-1 mb-0.5" />}
            {task.priority === TaskPriority.URGENT ? 'ACİL' : 
            task.priority === TaskPriority.HIGH ? 'Yüksek' : 
            task.priority === TaskPriority.MEDIUM ? 'Orta' : 'Düşük'}
          </span>
          
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center ${statusColors[task.status]}`}>
              {statusLabels[task.status]}
            </span>
            {isExpanded ? (
              <ChevronUp size={18} className="text-slate-400" />
            ) : (
              <ChevronDown size={18} className="text-slate-400" />
            )}
          </div>
        </div>

        <h3 className={`text-lg font-bold text-slate-800 ${isExpanded ? 'mb-1' : 'mb-0'}`}>
          {task.title}
        </h3>
        
        {!isExpanded && (
           <p className="text-sm text-slate-400 truncate mt-1">
             {machineName} • {task.description}
           </p>
        )}
      </div>

      {isExpanded && (
        <>
          <p className="text-sm text-slate-500 mb-4 flex items-center mt-1">
            <span className="w-2 h-2 rounded-full bg-slate-300 mr-2"></span>
            {machineName} {machineLocation && `(${machineLocation})`}
          </p>

          <div className="bg-slate-50 rounded-xl p-3 mb-4 text-sm text-slate-700 leading-relaxed">
            {task.description}
            
            {/* Attached Image */}
            {task.imageUrl && (
              <div className="mt-3">
                <div className="flex items-center text-slate-500 text-xs mb-1">
                  <ImageIcon size={12} className="mr-1" />
                  <span>Ekli Fotoğraf</span>
                </div>
                <img 
                  src={task.imageUrl} 
                  alt="Task Attachment" 
                  className="w-full h-48 object-cover rounded-lg border border-slate-200 shadow-sm"
                />
              </div>
            )}

            {task.aiSuggestions && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center text-indigo-600 mb-2 font-medium text-xs">
                  <Bot size={14} className="mr-1" />
                  AI Bakım Önerileri
                </div>
                <div className="whitespace-pre-line text-slate-600 text-xs bg-indigo-50/50 p-2 rounded-lg">
                  {task.aiSuggestions}
                </div>
              </div>
            )}
          </div>

          {/* Task Time Details for Completed Tasks */}
          {(task.status === TaskStatus.COMPLETED || task.status === TaskStatus.APPROVED) && task.completedAt && task.startedAt && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-800">
              <div className="flex items-center mb-2">
                <div className="bg-green-100 p-1.5 rounded-lg mr-3">
                  <Timer size={18} className="text-green-600" />
                </div>
                <div>
                  <span className="font-semibold block text-xs uppercase tracking-wide opacity-70">Toplam Süre</span>
                  <span className="font-bold text-base">{getDuration()}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-green-100 text-xs">
                <div className="bg-white/50 p-2 rounded-lg">
                  <span className="opacity-70 block text-[10px] uppercase">Başlangıç</span>
                  <span className="font-medium font-mono">{formatTime(task.startedAt)}</span>
                </div>
                <div className="bg-white/50 p-2 rounded-lg">
                  <span className="opacity-70 block text-[10px] uppercase">Bitiş</span>
                  <span className="font-medium font-mono">{formatTime(task.completedAt)}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Manager Feedback Display (Only for Approved Tasks) */}
          {task.status === TaskStatus.APPROVED && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
               <h4 className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-2 flex items-center">
                 <CheckCircle2 size={14} className="mr-1" />
                 Amir Değerlendirmesi
               </h4>
               <div className="flex items-center mb-2">
                 {[1, 2, 3, 4, 5].map((star) => (
                   <Star 
                     key={star} 
                     size={20} 
                     className={`${(task.rating || 0) >= star ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'} mr-1`} 
                   />
                 ))}
               </div>
               {task.managerNote && (
                 <div className="text-sm text-slate-700 bg-white/60 p-2 rounded-lg border border-yellow-100 italic">
                   "{task.managerNote}"
                 </div>
               )}
            </div>
          )}

          {/* In Progress Info */}
          {task.status === TaskStatus.IN_PROGRESS && task.startedAt && (
            <div className="mb-4 flex items-center text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              <Clock size={14} className="mr-2" />
              Başlangıç: {formatTime(task.startedAt)}
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                {assignee?.avatar ? <img src={assignee.avatar} alt="" /> : <UserIcon size={16} className="text-slate-500" />}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">Görevli</span>
                <span className="text-sm font-medium text-slate-700">{assignee?.name}</span>
              </div>
            </div>

            {/* Action Buttons based on Role & Status */}
            <div className="flex space-x-2">
                {currentUser.role === Role.MASTER && currentUser.id === task.assigneeId && (
                    <>
                        {task.status === TaskStatus.PENDING && (
                            <Button 
                                size="sm" 
                                onClick={() => onUpdateStatus(task.id, TaskStatus.IN_PROGRESS)}
                            >
                                Başla
                            </Button>
                        )}
                        {task.status === TaskStatus.IN_PROGRESS && (
                            <Button 
                                size="sm" 
                                variant="primary"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => onUpdateStatus(task.id, TaskStatus.COMPLETED)}
                            >
                                <CheckCircle2 size={16} className="mr-1" />
                                Bitir
                            </Button>
                        )}
                    </>
                )}

                {currentUser.role === Role.MANAGER && task.status === TaskStatus.COMPLETED && (
                    <>
                      {!isApprovalMode ? (
                        <Button 
                            size="sm" 
                            variant="primary"
                            onClick={() => setIsApprovalMode(true)}
                        >
                            İncele ve Onayla
                        </Button>
                      ) : (
                        <div className="absolute left-0 right-0 bottom-0 bg-white p-4 rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-slate-100 z-10 animate-in slide-in-from-bottom-5">
                           <div className="flex justify-between items-center mb-4">
                             <h4 className="font-bold text-slate-800">İşi Onayla ve Puanla</h4>
                             <button onClick={() => setIsApprovalMode(false)} className="text-slate-400 hover:text-slate-600"><CheckCircle2 className="opacity-0" size={24}/></button>
                           </div>
                           
                           <div className="flex justify-center space-x-2 mb-4">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onClick={() => setApprovalRating(star)} className="focus:outline-none transform transition hover:scale-110">
                                  <Star 
                                    size={32} 
                                    className={`${approvalRating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} 
                                  />
                                </button>
                              ))}
                           </div>
                           
                           <div className="mb-4">
                             <label className="block text-xs font-medium text-slate-500 mb-1">Amir Notu (Opsiyonel)</label>
                             <div className="relative">
                               <MessageSquare className="absolute top-3 left-3 text-slate-400" size={16} />
                               <textarea 
                                  value={approvalNote}
                                  onChange={(e) => setApprovalNote(e.target.value)}
                                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="Eline sağlık, temiz işçilik..."
                                  rows={2}
                               />
                             </div>
                           </div>

                           <div className="flex space-x-2">
                             <Button variant="secondary" fullWidth onClick={() => setIsApprovalMode(false)}>Vazgeç</Button>
                             <Button variant="primary" fullWidth onClick={handleApprove}>Onayla</Button>
                           </div>
                        </div>
                      )}
                    </>
                )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};