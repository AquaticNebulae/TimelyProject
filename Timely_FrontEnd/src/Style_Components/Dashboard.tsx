// src/Style_Components/Dashboard.tsx
// not fully functional waiting for jeter and vlad
// not tested
// might be some errors 
// not connectect to database
import React, { useState, useMemo, useEffect } from "react";
import Navbar from "./Navbar";
import { useTheme } from "../Views_Layouts/ThemeContext";
import { FolderOpen, Users, UserCircle, Clock, Bell, ChevronLeft, ChevronRight, Plus, History, TrendingUp, Calendar, MessageSquare, Heart, Share2, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

const API_BASE = 'http://localhost:4000/api';

const safeFetch = async (url: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null;
        return await response.json();
    } catch { return null; }
};

type Props = { sidebarToggle: boolean; setSidebarToggle: (v: boolean) => void; onNavigate?: (page: string) => void; userName?: string; userEmail?: string; };

interface Project { projectId: string; projectCode: string; projectName: string; clientName: string; status: string; dateCreated?: string; dateDue?: string; }
interface Client { customerId: string; clientCode: string; firstName: string; lastName: string; email: string; status?: string; clientType?: string; lastContactDate?: string; nextFollowUp?: string; }
interface Consultant { consultantId: string; consultantCode: string; firstName: string; lastName: string; email: string; role?: string; status?: string; }
interface HoursLog { logId: string; projectId: string; consultantId: string; date: string; hours: number; description: string; }
interface Alert { id: number; type: string; message: string; time: string; color: string; page?: string; }
interface Activity { id: number; user: string; action: string; target: string; timestamp: string; color: string; }
interface Comment { id: number; author: string; content: string; timestamp: string; likes: number; }
interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }

const getHolidays = (year: number): { [key: string]: string } => {
    const holidays: { [key: string]: string } = { [`${year}-01-01`]: "New Year's Day", [`${year}-07-04`]: "Independence Day", [`${year}-12-25`]: "Christmas Day", [`${year}-11-11`]: "Veterans Day" };
    const getNth = (y: number, m: number, w: number, n: number) => { let c = 0, d = new Date(y, m, 1); while (c < n) { if (d.getDay() === w) c++; if (c < n) d.setDate(d.getDate() + 1); } return `${y}-${String(m + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const getLast = (y: number, m: number, w: number) => { let d = new Date(y, m + 1, 0); while (d.getDay() !== w) d.setDate(d.getDate() - 1); return `${y}-${String(m + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    holidays[getNth(year, 0, 1, 3)] = "MLK Day"; holidays[getNth(year, 1, 1, 3)] = "Presidents' Day"; holidays[getLast(year, 4, 1)] = "Memorial Day";
    holidays[getNth(year, 8, 1, 1)] = "Labor Day"; holidays[getNth(year, 10, 4, 4)] = "Thanksgiving";
    return holidays;
};

const Dashboard: React.FC<Props> = ({ sidebarToggle, setSidebarToggle, onNavigate, userName = "Admin", userEmail = "admin@timely.com" }) => {
    const { isDark } = useTheme();
    const s = {
        bg: isDark ? 'bg-slate-950' : 'bg-gray-50', text: isDark ? 'text-white' : 'text-gray-900', textMuted: isDark ? 'text-slate-400' : 'text-gray-600',
        textSubtle: isDark ? 'text-slate-500' : 'text-gray-400', card: isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200',
        cardHover: isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-50', cardInner: isDark ? 'bg-slate-800' : 'bg-gray-100',
        input: isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900', divider: isDark ? 'border-slate-700' : 'border-gray-200',
        button: isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800', buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
    };

    const [toasts, setToasts] = useState<Toast[]>([]);
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => { const id = `t_${Date.now()}`; setToasts(p => [...p, { id, message, type }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000); };
    const ToastIcon = ({ type }: { type: string }) => type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <Info className="w-5 h-5 text-blue-400" />;

    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [consultants, setConsultants] = useState<Consultant[]>([]);
    const [hoursLogs, setHoursLogs] = useState<HoursLog[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            let projectsList: Project[] = [];
            const pr = await safeFetch(`${API_BASE}/projects`);
            if (pr?.data) projectsList = pr.data;
            const lp = JSON.parse(localStorage.getItem('timely_projects') || '[]');
            lp.forEach((p: Project) => { if (!projectsList.find(x => x.projectId === p.projectId)) projectsList.push(p); });
            setProjects(projectsList);

            let clientsList: Client[] = [];
            const cr = await safeFetch(`${API_BASE}/users-report`);
            if (cr?.data) clientsList = cr.data;
            const ec = JSON.parse(localStorage.getItem('timely_clients_extended') || '{}');
            clientsList = clientsList.map(c => ({ ...c, ...ec[c.customerId] }));
            setClients(clientsList);

            let consultantsList: Consultant[] = [];
            const cor = await safeFetch(`${API_BASE}/consultants`);
            if (cor?.data) consultantsList = cor.data;
            setConsultants(consultantsList);

            const hr = await safeFetch(`${API_BASE}/hours-logs`);
            if (hr?.data) setHoursLogs(hr.data);

            const ar = await safeFetch(`${API_BASE}/audit-logs/latest?limit=10`);
            if (ar?.data) {
                setActivities(ar.data.map((l: any, i: number) => ({
                    id: i, user: l.performedBy || 'System', action: l.actionType?.toLowerCase().replace(/_/g, ' ') || 'action',
                    target: l.details || l.entityId, timestamp: formatTime(l.timestamp), color: l.actionType?.includes('DELETE') ? 'text-red-400' : 'text-emerald-400'
                })));
            }

            generateAlerts(projectsList, clientsList);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const formatTime = (ts: string) => {
        if (!ts) return 'Unknown';
        const diff = Date.now() - new Date(ts).getTime();
        const mins = Math.floor(diff / 60000), hrs = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
        if (mins < 1) return 'Just now'; if (mins < 60) return `${mins}m ago`; if (hrs < 24) return `${hrs}h ago`; if (days < 7) return `${days}d ago`;
        return new Date(ts).toLocaleDateString();
    };

    const generateAlerts = (projectsList: Project[], clientsList: Client[]) => {
        const newAlerts: Alert[] = [];
        const today = new Date();
        projectsList.forEach((p, i) => {
            if (p.dateDue && p.status !== 'completed') {
                const diff = Math.ceil((new Date(p.dateDue).getTime() - today.getTime()) / 86400000);
                if (diff < 0) newAlerts.push({ id: i, type: 'overdue', message: `"${p.projectName}" overdue by ${Math.abs(diff)} days`, time: `Due: ${p.dateDue}`, color: 'text-red-500', page: 'projects' });
                else if (diff <= 7) newAlerts.push({ id: i + 100, type: 'deadline', message: `"${p.projectName}" due in ${diff} day${diff !== 1 ? 's' : ''}`, time: `Due: ${p.dateDue}`, color: 'text-amber-500', page: 'projects' });
            }
        });
        clientsList.forEach((c, i) => {
            if (c.nextFollowUp) {
                const diff = Math.ceil((new Date(c.nextFollowUp).getTime() - today.getTime()) / 86400000);
                if (diff <= 0) newAlerts.push({ id: i + 200, type: 'followup', message: `Follow up with ${c.firstName} ${c.lastName}`, time: diff === 0 ? 'Today' : `${Math.abs(diff)} days overdue`, color: 'text-cyan-500', page: 'client' });
            }
        });
        const newLeads = clientsList.filter(c => c.status === 'new_lead').length;
        if (newLeads > 0) newAlerts.push({ id: 998, type: 'leads', message: `${newLeads} new lead${newLeads > 1 ? 's' : ''} awaiting contact`, time: 'Action needed', color: 'text-emerald-500', page: 'client' });
        setAlerts(newAlerts.slice(0, 5));
    };

    const stats = useMemo(() => {
        const active = projects.filter(p => p.status === 'active').length;
        const completed = projects.filter(p => p.status === 'completed').length;
        const total = projects.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        const totalHours = hoursLogs.reduce((s, l) => s + l.hours, 0);
        const weekHours = hoursLogs.filter(l => { const d = new Date(l.date); const w = new Date(); w.setDate(w.getDate() - 7); return d >= w; }).reduce((s, l) => s + l.hours, 0);
        return { active, completed, total, progress, clients: clients.length, consultants: consultants.length, totalHours, weekHours };
    }, [projects, clients, consultants, hoursLogs]);

    const holidays = useMemo(() => getHolidays(currentDate.getFullYear()), [currentDate]);
    const calendarDays = useMemo(() => {
        const y = currentDate.getFullYear(), m = currentDate.getMonth();
        const first = new Date(y, m, 1).getDay(), last = new Date(y, m + 1, 0).getDate();
        const days: (number | null)[] = [];
        for (let i = 0; i < first; i++) days.push(null);
        for (let d = 1; d <= last; d++) days.push(d);
        return days;
    }, [currentDate]);

    const isToday = (day: number | null) => { if (!day) return false; const t = new Date(); return day === t.getDate() && currentDate.getMonth() === t.getMonth() && currentDate.getFullYear() === t.getFullYear(); };
    const getDateStr = (day: number) => `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hasDeadline = (day: number | null) => day ? projects.some(p => p.dateDue === getDateStr(day)) : false;
    const hasFollowUp = (day: number | null) => day ? clients.some(c => c.nextFollowUp === getDateStr(day)) : false;
    const isHoliday = (day: number | null) => day ? holidays[getDateStr(day)] : false;

    const formatHours = (h: number) => { const hr = Math.floor(h), mn = Math.round((h - hr) * 60); return mn === 0 ? `${hr}h` : `${hr}h ${mn}m`; };
    const handleNavigate = (page: string) => { if (onNavigate) onNavigate(page); };
    const handlePost = () => { if (!newComment.trim()) return; setComments([{ id: Date.now(), author: userName, content: newComment, timestamp: 'Just now', likes: 0 }, ...comments]); setNewComment(''); showToast('Posted', 'success'); };
    const handleLike = (id: number) => setComments(comments.map(c => c.id === id ? { ...c, likes: c.likes + 1 } : c));

    const recentProjects = useMemo(() => projects.filter(p => p.status === 'active').slice(0, 4), [projects]);
    const recentClients = useMemo(() => [...clients].sort((a, b) => (b.lastContactDate || '').localeCompare(a.lastContactDate || '')).slice(0, 4), [clients]);

    return (
        <>
            <Navbar sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle} activePage="dashboard" onNavigate={onNavigate} userName={userName} userEmail={userEmail} />

            <div className={`min-h-screen ${s.bg} ${s.text}`}>
                {/* Toasts */}
                <div className="fixed top-4 right-4 z-[10000] space-y-2">
                    {toasts.map(t => (
                        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${s.card}`}>
                            <ToastIcon type={t.type} /><span>{t.message}</span>
                            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className={s.textMuted}><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>

                <div className="pt-20 px-6 pb-10 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className={`text-3xl font-bold ${s.text}`}>Dashboard</h1>
                        <p className={s.textMuted}>Welcome back, {userName.split(' ')[0]}</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Projects', value: stats.total, sub: `${stats.active} active`, icon: FolderOpen, color: 'text-blue-500', page: 'projects' },
                            { label: 'Clients', value: stats.clients, sub: 'Total clients', icon: Users, color: 'text-purple-500', page: 'client' },
                            { label: 'Consultants', value: stats.consultants, sub: 'Team members', icon: UserCircle, color: 'text-emerald-500', page: 'consultants' },
                            { label: 'Hours', value: formatHours(stats.totalHours), sub: `${formatHours(stats.weekHours)} this week`, icon: Clock, color: 'text-amber-500', page: 'hours' },
                        ].map((stat, i) => (
                            <div key={i} onClick={() => handleNavigate(stat.page)} className={`${s.card} border rounded-xl p-5 cursor-pointer ${s.cardHover} transition-colors`}>
                                <div className="flex items-center justify-between mb-3">
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                    <span className={`text-2xl font-bold ${s.text}`}>{stat.value}</span>
                                </div>
                                <p className={`text-sm font-medium ${s.text}`}>{stat.label}</p>
                                <p className={`text-xs ${s.textMuted}`}>{stat.sub}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Main Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Alerts */}
                            <section className={`${s.card} border rounded-xl p-5`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className={`font-semibold flex items-center gap-2 ${s.text}`}><Bell className="w-5 h-5 text-amber-500" />Alerts</h2>
                                    <span className={`text-sm ${s.textMuted}`}>{alerts.length} active</span>
                                </div>
                                {alerts.length === 0 ? (
                                    <div className="text-center py-8"><CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" /><p className={s.textMuted}>All caught up!</p></div>
                                ) : (
                                    <div className="space-y-3">
                                        {alerts.map(a => (
                                            <div key={a.id} onClick={() => a.page && handleNavigate(a.page)} className={`flex items-start gap-3 p-3 rounded-lg ${s.cardInner} cursor-pointer ${s.cardHover} transition-colors`}>
                                                <AlertTriangle className={`w-5 h-5 ${a.color} mt-0.5`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${s.text}`}>{a.message}</p>
                                                    <p className={`text-xs ${s.textMuted}`}>{a.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Quick Actions */}
                            <section className={`${s.card} border rounded-xl p-5`}>
                                <h2 className={`font-semibold mb-4 ${s.text}`}>Quick Actions</h2>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'New Project', page: 'projects', color: 'bg-blue-600' },
                                        { label: 'Add Client', page: 'client', color: 'bg-purple-600' },
                                        { label: 'Log Hours', page: 'hours', color: 'bg-emerald-600' },
                                    ].map((action, i) => (
                                        <button key={i} onClick={() => handleNavigate(action.page)} className={`${action.color} text-white rounded-lg p-4 hover:opacity-90 transition-opacity`}>
                                            <Plus className="w-5 h-5 mx-auto mb-2" />
                                            <p className="text-sm font-medium">{action.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Progress */}
                            <section className={`${s.card} border rounded-xl p-5`}>
                                <h2 className={`font-semibold mb-4 flex items-center gap-2 ${s.text}`}><TrendingUp className="w-5 h-5 text-emerald-500" />Progress</h2>
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className={s.textMuted}>Project Completion</span>
                                        <span className={s.text}>{stats.progress}%</span>
                                    </div>
                                    <div className={`w-full h-2 ${s.cardInner} rounded-full overflow-hidden`}>
                                        <div className="h-full bg-blue-600 transition-all" style={{ width: `${stats.progress}%` }} />
                                    </div>
                                    <div className={`flex justify-between text-xs mt-2 ${s.textMuted}`}>
                                        <span>{stats.completed} completed</span>
                                        <span>{stats.total} total</span>
                                    </div>
                                </div>
                            </section>

                            {/* Recent Activity */}
                            <section className={`${s.card} border rounded-xl p-5`}>
                                <h2 className={`font-semibold mb-4 flex items-center gap-2 ${s.text}`}><History className="w-5 h-5" />Recent Activity</h2>
                                {activities.length === 0 ? (
                                    <p className={`text-center py-6 ${s.textMuted}`}>No recent activity</p>
                                ) : (
                                    <div className={`divide-y ${s.divider}`}>
                                        {activities.slice(0, 5).map(a => (
                                            <div key={a.id} className="py-3 flex items-start gap-3">
                                                <div className={`w-2 h-2 rounded-full mt-2 ${a.color === 'text-red-400' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${s.text}`}><span className="font-medium">{a.user}</span> {a.action}</p>
                                                    <p className={`text-xs ${s.textMuted} truncate`}>{a.target}</p>
                                                </div>
                                                <span className={`text-xs ${s.textSubtle}`}>{a.timestamp}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Calendar */}
                            <section className={`${s.card} border rounded-xl p-5`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className={`font-semibold flex items-center gap-2 ${s.text}`}><Calendar className="w-5 h-5 text-blue-500" />Calendar</h2>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className={`p-1 rounded ${s.cardHover}`}><ChevronLeft className="w-4 h-4" /></button>
                                        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className={`p-1 rounded ${s.cardHover}`}><ChevronRight className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <p className={`text-sm ${s.textMuted} mb-3`}>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className={`text-center text-xs ${s.textSubtle} py-1`}>{d}</div>)}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {calendarDays.map((day, i) => (
                                        <div key={i} onClick={() => day && setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))} className={`
                                            aspect-square flex items-center justify-center text-xs rounded relative cursor-pointer transition-colors
                                            ${!day ? '' : isToday(day) ? 'bg-blue-600 text-white font-bold' : `${s.cardInner} ${s.cardHover}`}
                                        `}>
                                            {day}
                                            {day && (hasDeadline(day) || hasFollowUp(day) || isHoliday(day)) && (
                                                <div className="absolute bottom-0.5 flex gap-0.5">
                                                    {isHoliday(day) && <div className="w-1 h-1 bg-red-500 rounded-full" />}
                                                    {hasDeadline(day) && <div className="w-1 h-1 bg-amber-400 rounded-full" />}
                                                    {hasFollowUp(day) && <div className="w-1 h-1 bg-cyan-400 rounded-full" />}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className={`mt-3 pt-3 border-t ${s.divider} flex justify-center gap-4 text-xs ${s.textMuted}`}>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full" />Holiday</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-400 rounded-full" />Due</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-cyan-400 rounded-full" />Follow-up</span>
                                </div>
                            </section>

                            {/* Active Projects */}
                            <section className={`${s.card} border rounded-xl p-5`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className={`font-semibold ${s.text}`}>Active Projects</h2>
                                    <button onClick={() => handleNavigate('projects')} className={`text-sm text-blue-500 hover:underline`}>View All</button>
                                </div>
                                {recentProjects.length === 0 ? (
                                    <p className={`text-center py-4 ${s.textMuted}`}>No active projects</p>
                                ) : (
                                    <div className="space-y-3">
                                        {recentProjects.map(p => (
                                            <div key={p.projectId} onClick={() => handleNavigate('projects')} className={`p-3 rounded-lg ${s.cardInner} cursor-pointer ${s.cardHover} transition-colors`}>
                                                <p className={`text-sm font-medium ${s.text} truncate`}>{p.projectName}</p>
                                                <p className={`text-xs ${s.textMuted}`}>{p.dateDue ? `Due: ${p.dateDue}` : 'No deadline'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Recent Clients */}
                            <section className={`${s.card} border rounded-xl p-5`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className={`font-semibold ${s.text}`}>Recent Clients</h2>
                                    <button onClick={() => handleNavigate('client')} className={`text-sm text-blue-500 hover:underline`}>View All</button>
                                </div>
                                {recentClients.length === 0 ? (
                                    <p className={`text-center py-4 ${s.textMuted}`}>No clients yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {recentClients.map(c => (
                                            <div key={c.customerId} onClick={() => handleNavigate('client')} className={`flex items-center gap-3 p-3 rounded-lg ${s.cardInner} cursor-pointer ${s.cardHover} transition-colors`}>
                                                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">{c.firstName[0]}{c.lastName[0]}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium ${s.text} truncate`}>{c.firstName} {c.lastName}</p>
                                                    <p className={`text-xs ${s.textMuted}`}>{(c.status || 'new_lead').replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>

                    {/* Team Feed */}
                    <section className={`${s.card} border rounded-xl p-5 mt-6`}>
                        <h2 className={`font-semibold mb-4 flex items-center gap-2 ${s.text}`}><MessageSquare className="w-5 h-5 text-blue-500" />Team Feed</h2>
                        <div className={`flex gap-3 pb-4 border-b ${s.divider}`}>
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">{userName.substring(0, 2).toUpperCase()}</div>
                            <div className="flex-1">
                                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Share an update..." className={`w-full ${s.input} border rounded-lg px-4 py-2 resize-none focus:outline-none focus:border-blue-500`} rows={2} />
                                <div className="flex justify-end mt-2">
                                    <button onClick={handlePost} disabled={!newComment.trim()} className={`px-4 py-2 ${s.buttonPrimary} rounded-lg text-sm disabled:opacity-50`}>Post</button>
                                </div>
                            </div>
                        </div>
                        {comments.length === 0 ? (
                            <p className={`text-center py-6 ${s.textMuted}`}>No posts yet</p>
                        ) : (
                            <div className={`divide-y ${s.divider}`}>
                                {comments.map(c => (
                                    <div key={c.id} className="py-4">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-medium">{c.author.substring(0, 2).toUpperCase()}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-medium text-sm ${s.text}`}>{c.author}</span>
                                                    <span className={`text-xs ${s.textSubtle}`}>{c.timestamp}</span>
                                                </div>
                                                <p className={`text-sm mt-1 ${s.textMuted}`}>{c.content}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <button onClick={() => handleLike(c.id)} className={`flex items-center gap-1 text-xs ${s.textSubtle} hover:text-pink-500`}><Heart className="w-4 h-4" />{c.likes}</button>
                                                    <button className={`flex items-center gap-1 text-xs ${s.textSubtle} hover:text-blue-500`}><Share2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
};

export default Dashboard;