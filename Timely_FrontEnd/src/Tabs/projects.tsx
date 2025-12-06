import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../Views_Layouts/ThemeContext';
import { Calendar, Plus, Search, Filter, ChevronRight, ChevronLeft, Clock, Users, FileText, CheckCircle2, AlertCircle, Target, TrendingUp, X, Trash2, BarChart3, ArrowUpDown, ArrowUp, ArrowDown, UserPlus, UserMinus, FolderOpen, Link2, RefreshCw, Edit2, CheckCircle, Info, List, LayoutGrid } from 'lucide-react';

const API_BASE = 'http://localhost:4000/api';
const generateId = () => `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateProjectCode = () => `PRJ-${Date.now().toString().slice(-6)}`;

const STORAGE_KEYS = { projects: 'timely_projects', projectConsultants: 'timely_project_consultants', projectClients: 'timely_project_clients' };

interface Project { projectId: string; projectCode: string; projectName: string; description: string; status: string; priority: string; startDate: string; endDate: string; budget: string; createdAt: string; }
interface ProjectConsultant { projectId: string; consultantId: string; createdAt: string; }
interface ProjectClient { projectId: string; clientId: string; createdAt: string; }
interface Consultant { consultantId: string; consultantCode: string; firstName: string; lastName: string; email: string; }
interface Client { customerId: string; clientCode: string; firstName: string; lastName: string; email: string; }
interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }

const safeFetch = async (url: string) => { try { const r = await fetch(url); if (!r.ok || !r.headers.get('content-type')?.includes('application/json')) return null; return await r.json(); } catch { return null; } };

const RealEstateProjects = () => {
    const { isDark } = useTheme();
    const s = {
        bg: isDark ? 'bg-slate-950' : 'bg-gray-50', text: isDark ? 'text-white' : 'text-gray-900', textMuted: isDark ? 'text-slate-400' : 'text-gray-600',
        textSubtle: isDark ? 'text-slate-500' : 'text-gray-400', card: isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200',
        cardHover: isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-50', cardInner: isDark ? 'bg-slate-800' : 'bg-gray-100',
        input: isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900',
        button: isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white', divider: isDark ? 'border-slate-700' : 'border-gray-200',
        modal: isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200',
        tableHeader: isDark ? 'bg-slate-800' : 'bg-gray-100', tableRow: isDark ? 'border-slate-700 hover:bg-slate-800/50' : 'border-gray-200 hover:bg-gray-50',
        accent: isDark ? 'text-blue-400' : 'text-blue-600',
    };

    const [toasts, setToasts] = useState<Toast[]>([]);
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => { const id = `t_${Date.now()}`; setToasts(p => [...p, { id, message, type }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000); };
    const ToastIcon = ({ type }: { type: string }) => type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : type === 'error' ? <AlertCircle className="w-5 h-5 text-red-400" /> : <Info className="w-5 h-5 text-blue-400" />;

    const [projects, setProjects] = useState<Project[]>([]);
    const [consultants, setConsultants] = useState<Consultant[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [projectConsultants, setProjectConsultants] = useState<ProjectConsultant[]>([]);
    const [projectClients, setProjectClients] = useState<ProjectClient[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showConsultantsModal, setShowConsultantsModal] = useState(false);
    const [showClientsModal, setShowClientsModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [sortConfig, setSortConfig] = useState({ field: 'createdAt', direction: 'desc' as 'asc' | 'desc' });
    const [viewMode, setViewMode] = useState<'list' | 'gantt'>('list');
    const [ganttStartDate, setGanttStartDate] = useState(() => { const d = new Date(); d.setDate(1); return d; });

    const emptyForm = { projectName: '', description: '', status: 'planning', priority: 'medium', startDate: new Date().toISOString().split('T')[0], endDate: '', budget: '', selectedConsultants: [] as string[], selectedClients: [] as string[] };
    const [projectForm, setProjectForm] = useState(emptyForm);

    const statuses = [
        { value: 'planning', label: 'Planning', color: 'bg-blue-600', icon: Target },
        { value: 'active', label: 'Active', color: 'bg-emerald-600', icon: TrendingUp },
        { value: 'on_hold', label: 'On Hold', color: 'bg-amber-600', icon: Clock },
        { value: 'completed', label: 'Completed', color: 'bg-gray-600', icon: CheckCircle2 },
        { value: 'cancelled', label: 'Cancelled', color: 'bg-red-600', icon: X },
    ];

    useEffect(() => { loadAllData(); }, []);

    const loadAllData = async () => { setRefreshing(true); await Promise.all([loadProjects(), loadConsultants(), loadClients()]); loadProjectConsultants(); loadProjectClients(); setRefreshing(false); };
    const loadProjects = async () => { const d = await safeFetch(`${API_BASE}/projects`); const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.projects) || '[]'); if (d?.data) { const all = [...d.data, ...local.filter((l: Project) => !d.data.find((a: Project) => a.projectId === l.projectId))]; setProjects(all); } else { setProjects(local); } };
    const loadConsultants = async () => { const d = await safeFetch(`${API_BASE}/consultants`); if (d?.data) setConsultants(d.data); };
    const loadClients = async () => { const d = await safeFetch(`${API_BASE}/users-report`); if (d?.data) setClients(d.data); };
    const loadProjectConsultants = () => { try { const data = localStorage.getItem(STORAGE_KEYS.projectConsultants); if (data) setProjectConsultants(JSON.parse(data)); } catch (e) { console.error(e); } };
    const loadProjectClients = () => { try { const data = localStorage.getItem(STORAGE_KEYS.projectClients); if (data) setProjectClients(JSON.parse(data)); } catch (e) { console.error(e); } };
    const saveProjectConsultants = (data: ProjectConsultant[]) => { localStorage.setItem(STORAGE_KEYS.projectConsultants, JSON.stringify(data)); setProjectConsultants(data); };
    const saveProjectClients = (data: ProjectClient[]) => { localStorage.setItem(STORAGE_KEYS.projectClients, JSON.stringify(data)); setProjectClients(data); };

    const saveProjectToStorage = (updatedProject: Project) => {
        const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.projects) || '[]');
        const idx = local.findIndex((p: Project) => p.projectId === updatedProject.projectId);
        if (idx !== -1) { local[idx] = updatedProject; } else { local.push(updatedProject); }
        localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(local));
    };

    const createProject = async () => {
        if (!projectForm.projectName) { showToast('Project name is required', 'error'); return; }
        setLoading(true);
        const newProject: Project = { projectId: generateId(), projectCode: generateProjectCode(), projectName: projectForm.projectName, description: projectForm.description, status: projectForm.status, priority: projectForm.priority, startDate: projectForm.startDate, endDate: projectForm.endDate, budget: projectForm.budget, createdAt: new Date().toISOString() };
        const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.projects) || '[]');
        localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify([...local, newProject]));
        if (projectForm.selectedConsultants.length > 0) { saveProjectConsultants([...projectConsultants, ...projectForm.selectedConsultants.map(cid => ({ projectId: newProject.projectId, consultantId: cid, createdAt: new Date().toISOString() }))]); }
        if (projectForm.selectedClients.length > 0) { saveProjectClients([...projectClients, ...projectForm.selectedClients.map(cid => ({ projectId: newProject.projectId, clientId: cid, createdAt: new Date().toISOString() }))]); }
        setShowCreateModal(false); resetForm(); loadProjects(); setLoading(false);
        showToast(`Project created (${newProject.projectCode})`, 'success');
    };

    const updateProject = () => {
        if (!selectedProject) return;
        const updated = { ...selectedProject, projectName: projectForm.projectName, description: projectForm.description, status: projectForm.status, priority: projectForm.priority, startDate: projectForm.startDate, endDate: projectForm.endDate, budget: projectForm.budget };
        saveProjectToStorage(updated);
        setShowEditModal(false); setShowDetailsModal(true); loadProjects();
        showToast('Project updated', 'success');
    };

    const updateProjectStatus = (projectId: string, newStatus: string) => {
        const project = projects.find(p => p.projectId === projectId);
        if (!project) return;
        const updated = { ...project, status: newStatus };
        saveProjectToStorage(updated);
        setProjects(projects.map(p => p.projectId === projectId ? updated : p));
        if (selectedProject?.projectId === projectId) setSelectedProject(updated);
        setShowStatusMenu(null);
        showToast(`Status changed to ${statuses.find(st => st.value === newStatus)?.label}`, 'success');
    };

    const deleteProject = (pid: string) => {
        const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.projects) || '[]');
        localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(local.filter((p: Project) => p.projectId !== pid)));
        saveProjectConsultants(projectConsultants.filter(pc => pc.projectId !== pid));
        saveProjectClients(projectClients.filter(pc => pc.projectId !== pid));
        setShowDeleteConfirm(null); setShowDetailsModal(false); setSelectedProject(null); loadProjects();
        showToast('Project deleted', 'success');
    };

    const assignConsultantToProject = (consultantId: string) => { if (!selectedProject) return; if (projectConsultants.find(pc => pc.projectId === selectedProject.projectId && pc.consultantId === consultantId)) { showToast('Already assigned', 'info'); return; } saveProjectConsultants([...projectConsultants, { projectId: selectedProject.projectId, consultantId, createdAt: new Date().toISOString() }]); showToast('Consultant assigned', 'success'); };
    const removeConsultantFromProject = (consultantId: string) => { if (!selectedProject) return; saveProjectConsultants(projectConsultants.filter(pc => !(pc.projectId === selectedProject.projectId && pc.consultantId === consultantId))); showToast('Consultant removed', 'success'); };
    const assignClientToProject = (clientId: string) => { if (!selectedProject) return; if (projectClients.find(pc => pc.projectId === selectedProject.projectId && pc.clientId === clientId)) { showToast('Already assigned', 'info'); return; } saveProjectClients([...projectClients, { projectId: selectedProject.projectId, clientId, createdAt: new Date().toISOString() }]); showToast('Client assigned', 'success'); };
    const removeClientFromProject = (clientId: string) => { if (!selectedProject) return; saveProjectClients(projectClients.filter(pc => !(pc.projectId === selectedProject.projectId && pc.clientId === clientId))); showToast('Client removed', 'success'); };

    const getProjectConsultants = (pid: string) => projectConsultants.filter(pc => pc.projectId === pid).map(pc => consultants.find(c => c.consultantId === pc.consultantId)).filter(Boolean) as Consultant[];
    const getProjectClients = (pid: string) => projectClients.filter(pc => pc.projectId === pid).map(pc => clients.find(c => c.customerId === pc.clientId)).filter(Boolean) as Client[];
    const getAvailableConsultants = (pid: string) => { const assigned = projectConsultants.filter(pc => pc.projectId === pid).map(pc => pc.consultantId); return consultants.filter(c => !assigned.includes(c.consultantId)); };
    const getAvailableClients = (pid: string) => { const assigned = projectClients.filter(pc => pc.projectId === pid).map(pc => pc.clientId); return clients.filter(c => !assigned.includes(c.customerId)); };

    const resetForm = () => setProjectForm(emptyForm);
    const openProjectDetails = (p: Project) => { setSelectedProject(p); setProjectForm({ projectName: p.projectName, description: p.description || '', status: p.status, priority: p.priority || 'medium', startDate: p.startDate || '', endDate: p.endDate || '', budget: p.budget || '', selectedConsultants: [], selectedClients: [] }); setShowDetailsModal(true); };

    const filteredProjects = useMemo(() => {
        let filtered = projects.filter(p => {
            const matchSearch = p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) || (p.projectCode || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = statusFilter === 'all' || p.status === statusFilter;
            return matchSearch && matchStatus;
        });
        filtered.sort((a, b) => {
            let aV: any, bV: any;
            switch (sortConfig.field) { case 'name': aV = a.projectName.toLowerCase(); bV = b.projectName.toLowerCase(); break; case 'status': aV = a.status; bV = b.status; break; default: aV = new Date(a.createdAt || 0).getTime(); bV = new Date(b.createdAt || 0).getTime(); }
            return sortConfig.direction === 'asc' ? (aV > bV ? 1 : -1) : (aV < bV ? 1 : -1);
        });
        return filtered;
    }, [projects, searchTerm, statusFilter, sortConfig]);

    const stats = useMemo(() => ({ total: projects.length, planning: projects.filter(p => p.status === 'planning').length, active: projects.filter(p => p.status === 'active').length, completed: projects.filter(p => p.status === 'completed').length }), [projects]);

    const getStatusColor = (st: string) => statuses.find(stat => stat.value === st)?.color || 'bg-gray-600';
    const getStatusLabel = (st: string) => statuses.find(stat => stat.value === st)?.label || st;
    const getPriorityColor = (p: string) => ({ low: 'text-gray-500', medium: 'text-amber-500', high: 'text-orange-500', urgent: 'text-red-500' }[p] || 'text-gray-500');
    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString() : 'N/A';
    const formatBudget = (b: string) => b ? `$${Number(b).toLocaleString()}` : 'N/A';
    const toggleSort = (f: string) => setSortConfig(p => ({ field: f, direction: p.field === f && p.direction === 'asc' ? 'desc' : 'asc' }));
    const getSortIcon = (f: string) => sortConfig.field !== f ? <ArrowUpDown className={`w-4 h-4 ${s.textSubtle}`} /> : sortConfig.direction === 'asc' ? <ArrowUp className={`w-4 h-4 ${s.accent}`} /> : <ArrowDown className={`w-4 h-4 ${s.accent}`} />;

    // Gantt Chart helpers
    const ganttDays = useMemo(() => {
        const days = [];
        const start = new Date(ganttStartDate);
        for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d); }
        return days;
    }, [ganttStartDate]);

    const getProjectBarStyle = (project: Project) => {
        if (!project.startDate) return null;
        const start = new Date(project.startDate);
        const end = project.endDate ? new Date(project.endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
        const ganttStart = ganttDays[0];
        const ganttEnd = ganttDays[ganttDays.length - 1];
        if (end < ganttStart || start > ganttEnd) return null;
        const totalDays = 42;
        const startOffset = Math.max(0, Math.floor((start.getTime() - ganttStart.getTime()) / (24 * 60 * 60 * 1000)));
        const duration = Math.min(totalDays - startOffset, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
        return { left: `${(startOffset / totalDays) * 100}%`, width: `${(Math.max(duration, 1) / totalDays) * 100}%` };
    };

    const navigateGantt = (direction: 'prev' | 'next') => { const d = new Date(ganttStartDate); d.setDate(d.getDate() + (direction === 'next' ? 14 : -14)); setGanttStartDate(d); };

    const updateProjectDates = (projectId: string, newStartDate: Date) => {
        const project = projects.find(p => p.projectId === projectId);
        if (!project) return;
        const duration = project.startDate && project.endDate ? Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (24 * 60 * 60 * 1000)) : 7;
        const newEndDate = new Date(newStartDate); newEndDate.setDate(newEndDate.getDate() + duration);
        const updated = { ...project, startDate: newStartDate.toISOString().split('T')[0], endDate: newEndDate.toISOString().split('T')[0] };
        saveProjectToStorage(updated);
        setProjects(projects.map(p => p.projectId === projectId ? updated : p));
        showToast('Project dates updated', 'success');
    };

    return (
        <div className={`min-h-screen ${s.bg}`}>
            {/* Toasts */}
            <div className="fixed top-4 right-4 z-[10000] space-y-2">
                {toasts.map(toast => (<div key={toast.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${s.card}`}><ToastIcon type={toast.type} /><span className={s.text}>{toast.message}</span><button onClick={() => setToasts(p => p.filter(t => t.id !== toast.id))} className={s.textMuted}><X className="w-4 h-4" /></button></div>))}
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className={`${s.modal} border rounded-lg max-w-md w-full p-6`}>
                        <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-500" /></div><h3 className={`text-lg font-semibold ${s.text}`}>Delete Project?</h3></div>
                        <p className={`${s.textMuted} mb-6`}>This will permanently delete the project and all assignments.</p>
                        <div className="flex gap-3"><button onClick={() => setShowDeleteConfirm(null)} className={`flex-1 px-4 py-2.5 ${s.button} rounded-lg`}>Cancel</button><button onClick={() => deleteProject(showDeleteConfirm)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete</button></div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-start justify-between mb-6">
                        <div><h1 className={`text-3xl font-bold ${s.text} mb-2`}>Projects</h1><p className={s.textMuted}>Manage projects and assignments</p></div>
                        <div className="flex items-center gap-3">
                            <div className={`flex rounded-lg border ${s.divider} overflow-hidden`}>
                                <button onClick={() => setViewMode('list')} className={`px-3 py-2 flex items-center gap-2 ${viewMode === 'list' ? s.buttonPrimary : s.button}`}><List className="w-4 h-4" />List</button>
                                <button onClick={() => setViewMode('gantt')} className={`px-3 py-2 flex items-center gap-2 ${viewMode === 'gantt' ? s.buttonPrimary : s.button}`}><LayoutGrid className="w-4 h-4" />Gantt</button>
                            </div>
                            <button onClick={loadAllData} disabled={refreshing} className={`p-2.5 rounded-lg border ${s.divider} ${s.cardHover} ${refreshing ? 'animate-spin' : ''}`}><RefreshCw className={`w-5 h-5 ${s.textMuted}`} /></button>
                            <button onClick={() => setShowCreateModal(true)} className={`${s.buttonPrimary} px-5 py-2.5 rounded-lg flex items-center gap-2`}><Plus className="w-5 h-5" />New Project</button>
                        </div>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="relative flex-1"><Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${s.textMuted} w-5 h-5`} /><input type="text" placeholder="Search projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 ${s.input} border rounded-lg focus:outline-none focus:border-blue-500`} /></div>
                        <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-2.5 rounded-lg flex items-center gap-2 ${showFilters ? s.buttonPrimary : s.button}`}><Filter className="w-5 h-5" />Filters</button>
                    </div>
                    {showFilters && (
                        <div className={`mt-4 p-4 ${s.card} border rounded-lg`}>
                            <label className={`${s.textMuted} text-sm block mb-1`}>Status</label>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`w-full max-w-xs px-4 py-2 ${s.input} border rounded-lg`}>
                                <option value="all">All</option>{statuses.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="grid grid-cols-4 gap-4 mt-6">
                        {[{ label: 'Total', value: stats.total, icon: FolderOpen }, { label: 'Planning', value: stats.planning, icon: Target }, { label: 'Active', value: stats.active, icon: TrendingUp }, { label: 'Completed', value: stats.completed, icon: CheckCircle2 }].map((stat, i) => (
                            <div key={i} className={`${s.card} border rounded-lg p-4`}><div className="flex items-center justify-between mb-1"><span className={`${s.textMuted} text-sm`}>{stat.label}</span><stat.icon className={`w-5 h-5 ${s.accent}`} /></div><div className={`text-2xl font-bold ${s.text}`}>{stat.value}</div></div>
                        ))}
                    </div>
                </div>

                {/* List View */}
                {viewMode === 'list' && (
                    <div className={`${s.card} border rounded-lg overflow-hidden`}>
                        <div className={`grid grid-cols-12 gap-4 p-4 border-b ${s.divider} ${s.tableHeader}`}>
                            <div className={`col-span-4 flex items-center gap-2 cursor-pointer ${s.textMuted} text-sm`} onClick={() => toggleSort('name')}>Project {getSortIcon('name')}</div>
                            <div className={`col-span-2 ${s.textMuted} text-sm`}>Team</div>
                            <div className={`col-span-2 ${s.textMuted} text-sm`}>Timeline</div>
                            <div className={`col-span-2 flex items-center gap-2 cursor-pointer ${s.textMuted} text-sm`} onClick={() => toggleSort('status')}>Status {getSortIcon('status')}</div>
                            <div className={`col-span-2 ${s.textMuted} text-sm text-right`}>Actions</div>
                        </div>
                        {filteredProjects.length === 0 ? (
                            <div className="text-center py-16"><FolderOpen className={`w-12 h-12 ${s.textSubtle} mx-auto mb-3`} /><p className={s.textMuted}>No projects found</p></div>
                        ) : filteredProjects.map(p => (
                            <div key={p.projectId} className={`grid grid-cols-12 gap-4 p-4 border-b ${s.tableRow}`}>
                                <div className="col-span-4 flex items-center gap-3 cursor-pointer" onClick={() => openProjectDetails(p)}>
                                    <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center text-white"><FolderOpen className="w-5 h-5" /></div>
                                    <div><p className={`${s.text} font-medium`}>{p.projectName}</p><p className={`${s.textSubtle} text-xs`}>{p.projectCode}</p></div>
                                </div>
                                <div className="col-span-2 flex items-center gap-2"><Users className={`w-4 h-4 ${s.textSubtle}`} /><span className={`${s.textMuted} text-sm`}>{getProjectConsultants(p.projectId).length + getProjectClients(p.projectId).length}</span></div>
                                <div className="col-span-2 flex items-center"><span className={`${s.textMuted} text-sm`}>{p.startDate ? formatDate(p.startDate) : 'No date'}</span></div>
                                <div className="col-span-2 relative">
                                    <button onClick={(e) => { e.stopPropagation(); setShowStatusMenu(showStatusMenu === p.projectId ? null : p.projectId); }} className={`${getStatusColor(p.status)} px-3 py-1 rounded-full text-white text-xs flex items-center gap-1`}>
                                        {getStatusLabel(p.status)}<ChevronRight className={`w-3 h-3 transition-transform ${showStatusMenu === p.projectId ? 'rotate-90' : ''}`} />
                                    </button>
                                    {showStatusMenu === p.projectId && (
                                        <div className={`absolute top-full left-0 mt-1 ${s.modal} border rounded-lg shadow-lg z-50 py-1 min-w-[140px]`}>
                                            {statuses.map(st => (
                                                <button key={st.value} onClick={(e) => { e.stopPropagation(); updateProjectStatus(p.projectId, st.value); }} className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${s.cardHover} ${p.status === st.value ? s.accent : s.textMuted}`}>
                                                    <div className={`w-2 h-2 rounded-full ${st.color}`} />{st.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2 flex items-center justify-end gap-2">
                                    <button onClick={() => openProjectDetails(p)} className={`p-2 ${s.cardHover} rounded-lg`}><Edit2 className={`w-4 h-4 ${s.textMuted}`} /></button>
                                    <button onClick={() => setShowDeleteConfirm(p.projectId)} className="p-2 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Gantt View */}
                {viewMode === 'gantt' && (
                    <div className={`${s.card} border rounded-lg overflow-hidden`}>
                        <div className={`p-4 border-b ${s.divider} flex items-center justify-between`}>
                            <div className="flex items-center gap-2">
                                <button onClick={() => navigateGantt('prev')} className={`p-2 ${s.button} rounded-lg`}><ChevronLeft className="w-5 h-5" /></button>
                                <span className={`${s.text} font-medium`}>{ganttDays[0].toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {ganttDays[ganttDays.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                <button onClick={() => navigateGantt('next')} className={`p-2 ${s.button} rounded-lg`}><ChevronRight className="w-5 h-5" /></button>
                            </div>
                            <button onClick={() => setGanttStartDate(() => { const d = new Date(); d.setDate(1); return d; })} className={`px-3 py-1.5 ${s.button} rounded-lg text-sm`}>Today</button>
                        </div>
                        <div className="overflow-x-auto">
                            <div className="min-w-[1200px]">
                                <div className={`flex border-b ${s.divider}`}>
                                    <div className={`w-48 flex-shrink-0 p-3 ${s.tableHeader} border-r ${s.divider}`}><span className={`${s.textMuted} text-sm`}>Project</span></div>
                                    <div className="flex-1 flex">
                                        {ganttDays.map((day, i) => (
                                            <div key={i} className={`flex-1 min-w-[24px] p-1 text-center border-r ${s.divider} ${s.tableHeader} ${day.getDay() === 0 || day.getDay() === 6 ? (isDark ? 'bg-slate-700' : 'bg-gray-200') : ''}`}>
                                                <div className={`text-[10px] ${s.textSubtle}`}>{day.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}</div>
                                                <div className={`text-xs ${s.textMuted} ${day.toDateString() === new Date().toDateString() ? 'text-blue-500 font-bold' : ''}`}>{day.getDate()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {filteredProjects.length === 0 ? (
                                    <div className="text-center py-16"><FolderOpen className={`w-12 h-12 ${s.textSubtle} mx-auto mb-3`} /><p className={s.textMuted}>No projects found</p></div>
                                ) : filteredProjects.map(p => {
                                    const barStyle = getProjectBarStyle(p);
                                    return (
                                        <div key={p.projectId} className={`flex border-b ${s.tableRow}`}>
                                            <div className={`w-48 flex-shrink-0 p-3 border-r ${s.divider} flex items-center gap-2 cursor-pointer`} onClick={() => openProjectDetails(p)}>
                                                <div className={`w-3 h-3 rounded-full ${getStatusColor(p.status)}`} />
                                                <span className={`${s.text} text-sm truncate`}>{p.projectName}</span>
                                            </div>
                                            <div className="flex-1 relative h-12 flex items-center">
                                                <div className="absolute inset-0 flex">
                                                    {ganttDays.map((day, i) => (
                                                        <div key={i} onClick={() => updateProjectDates(p.projectId, day)} className={`flex-1 min-w-[24px] border-r ${s.divider} cursor-pointer hover:bg-blue-500/10 ${day.getDay() === 0 || day.getDay() === 6 ? (isDark ? 'bg-slate-800/50' : 'bg-gray-100') : ''} ${day.toDateString() === new Date().toDateString() ? 'bg-blue-500/10' : ''}`} />
                                                    ))}
                                                </div>
                                                {barStyle && (
                                                    <div className={`absolute h-6 ${getStatusColor(p.status)} rounded cursor-pointer hover:opacity-80 transition-opacity flex items-center px-2 shadow-sm`} style={{ left: barStyle.left, width: barStyle.width, minWidth: '60px' }} onClick={() => openProjectDetails(p)}>
                                                        <span className="text-white text-xs truncate">{p.projectName}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className={`p-4 border-t ${s.divider} flex items-center gap-6 flex-wrap`}>
                            {statuses.map(st => (<div key={st.value} className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${st.color}`} /><span className={`${s.textMuted} text-sm`}>{st.label}</span></div>))}
                            <span className={`${s.textSubtle} text-xs ml-auto`}>Click on timeline to set project start date</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className={`${s.modal} border rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto`}>
                        <div className={`p-5 border-b ${s.divider} flex items-center justify-between sticky top-0 ${isDark ? 'bg-slate-900' : 'bg-white'}`}><h2 className={`text-xl font-bold ${s.text}`}>New Project</h2><button onClick={() => { setShowCreateModal(false); resetForm(); }} className={`p-2 ${s.cardHover} rounded-lg`}><X className={`w-5 h-5 ${s.textMuted}`} /></button></div>
                        <div className="p-5 space-y-5">
                            <div><label className={`${s.textMuted} text-sm block mb-1`}>Project Name *</label><input type="text" value={projectForm.projectName} onChange={(e) => setProjectForm({ ...projectForm, projectName: e.target.value })} className={`w-full px-4 py-2.5 ${s.input} border rounded-lg`} placeholder="Enter project name" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={`${s.textMuted} text-sm block mb-1`}>Status</label><select value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })} className={`w-full px-4 py-2.5 ${s.input} border rounded-lg`}>{statuses.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}</select></div>
                                <div><label className={`${s.textMuted} text-sm block mb-1`}>Priority</label><select value={projectForm.priority} onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value })} className={`w-full px-4 py-2.5 ${s.input} border rounded-lg`}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
                                <div><label className={`${s.textMuted} text-sm block mb-1`}>Start Date</label><input type="date" value={projectForm.startDate} onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })} className={`w-full px-4 py-2.5 ${s.input} border rounded-lg`} /></div>
                                <div><label className={`${s.textMuted} text-sm block mb-1`}>End Date</label><input type="date" value={projectForm.endDate} onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })} className={`w-full px-4 py-2.5 ${s.input} border rounded-lg`} /></div>
                                <div className="col-span-2"><label className={`${s.textMuted} text-sm block mb-1`}>Budget</label><input type="number" value={projectForm.budget} onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })} className={`w-full px-4 py-2.5 ${s.input} border rounded-lg`} placeholder="Enter budget" /></div>
                            </div>
                            <div><label className={`${s.textMuted} text-sm block mb-2`}>Assign Consultants</label><div className={`max-h-32 overflow-y-auto ${s.cardInner} rounded-lg p-3 space-y-2`}>{consultants.length === 0 ? <p className={s.textSubtle}>No consultants</p> : consultants.map(c => (<label key={c.consultantId} className={`flex items-center gap-2 p-2 ${s.cardHover} rounded cursor-pointer`}><input type="checkbox" checked={projectForm.selectedConsultants.includes(c.consultantId)} onChange={(e) => setProjectForm({ ...projectForm, selectedConsultants: e.target.checked ? [...projectForm.selectedConsultants, c.consultantId] : projectForm.selectedConsultants.filter(id => id !== c.consultantId) })} className="w-4 h-4" /><span className={s.text}>{c.firstName} {c.lastName}</span></label>))}</div></div>
                            <div><label className={`${s.textMuted} text-sm block mb-2`}>Assign Clients</label><div className={`max-h-32 overflow-y-auto ${s.cardInner} rounded-lg p-3 space-y-2`}>{clients.length === 0 ? <p className={s.textSubtle}>No clients</p> : clients.map(c => (<label key={c.customerId} className={`flex items-center gap-2 p-2 ${s.cardHover} rounded cursor-pointer`}><input type="checkbox" checked={projectForm.selectedClients.includes(c.customerId)} onChange={(e) => setProjectForm({ ...projectForm, selectedClients: e.target.checked ? [...projectForm.selectedClients, c.customerId] : projectForm.selectedClients.filter(id => id !== c.customerId) })} className="w-4 h-4" /><span className={s.text}>{c.firstName} {c.lastName}</span></label>))}</div></div>
                            <div><label className={`${s.textMuted} text-sm block mb-1`}>Description</label><textarea rows={3} value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} className={`w-full px-4 py-2.5 ${s.input} border rounded-lg resize-none`} placeholder="Project description..." /></div>
                            <div className="flex gap-3 pt-2"><button onClick={() => { setShowCreateModal(false); resetForm(); }} className={`flex-1 px-5 py-2.5 ${s.button} rounded-lg`}>Cancel</button><button onClick={createProject} disabled={loading} className={`flex-1 px-5 py-2.5 ${s.buttonPrimary} rounded-lg disabled:opacity-50`}>{loading ? 'Creating...' : 'Create'}</button></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedProject && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className={`${s.modal} border rounded-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto`}>
                        <div className={`p-5 border-b ${s.divider} flex items-center justify-between sticky top-0 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center text-white"><FolderOpen className="w-6 h-6" /></div><div><h2 className={`text-xl font-bold ${s.text}`}>{selectedProject.projectName}</h2><p className={s.textMuted}>{selectedProject.projectCode}</p></div></div>
                            <div className="flex items-center gap-2"><button onClick={() => setShowDeleteConfirm(selectedProject.projectId)} className="p-2 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-5 h-5 text-red-500" /></button><button onClick={() => { setShowDetailsModal(false); setSelectedProject(null); }} className={`p-2 ${s.cardHover} rounded-lg`}><X className={`w-5 h-5 ${s.textMuted}`} /></button></div>
                        </div>
                        <div className="p-5 space-y-5">
                            <div><label className={`${s.textMuted} text-sm block mb-2`}>Status</label><div className="flex flex-wrap gap-2">{statuses.map(st => (<button key={st.value} onClick={() => updateProjectStatus(selectedProject.projectId, st.value)} className={`px-4 py-2 rounded-lg flex items-center gap-2 border transition-all ${selectedProject.status === st.value ? `${st.color} text-white border-transparent` : `${s.button} ${s.divider}`}`}><st.icon className="w-4 h-4" />{st.label}</button>))}</div></div>
                            <div className="flex items-center gap-4 flex-wrap"><span className={`${getPriorityColor(selectedProject.priority || 'medium')} font-medium`}>{(selectedProject.priority || 'medium').charAt(0).toUpperCase() + (selectedProject.priority || 'medium').slice(1)} Priority</span></div>
                            <div className="grid grid-cols-4 gap-4">
                                <button onClick={() => { setShowDetailsModal(false); setShowEditModal(true); }} className={`flex items-center justify-center gap-2 px-4 py-2.5 ${s.button} rounded-lg`}><Edit2 className="w-4 h-4" />Edit</button>
                                <button onClick={() => { setShowDetailsModal(false); setShowConsultantsModal(true); }} className={`flex items-center justify-center gap-2 px-4 py-2.5 ${s.button} rounded-lg`}><Users className="w-4 h-4" />Consultants</button>
                                <button onClick={() => { setShowDetailsModal(false); setShowClientsModal(true); }} className={`flex items-center justify-center gap-2 px-4 py-2.5 ${s.button} rounded-lg`}><Users className="w-4 h-4" />Clients</button>
                                <button className={`flex items-center justify-center gap-2 px-4 py-2.5 ${s.button} rounded-lg`}><BarChart3 className="w-4 h-4" />Reports</button>
                            </div>
                            <div className={`${s.cardInner} rounded-lg p-4`}><h3 className={`${s.textMuted} text-sm mb-2 flex items-center gap-2`}><Calendar className="w-4 h-4" />Timeline & Budget</h3><div className="grid grid-cols-3 gap-4"><div><p className={`${s.textSubtle} text-xs`}>Start</p><p className={s.text}>{formatDate(selectedProject.startDate)}</p></div><div><p className={`${s.textSubtle} text-xs`}>End</p><p className={s.text}>{formatDate(selectedProject.endDate)}</p></div><div><p className={`${s.textSubtle} text-xs`}>Budget</p><p className={s.text}>{formatBudget(selectedProject.budget)}</p></div></div></div>
                            <div className={`${s.cardInner} rounded-lg p-4`}><div className="flex items-center justify-between mb-2"><h3 className={`${s.textMuted} text-sm flex items-center gap-2`}><Users className="w-4 h-4" />Consultants</h3><button onClick={() => { setShowDetailsModal(false); setShowConsultantsModal(true); }} className={`${s.accent} text-sm`}>Manage</button></div>{getProjectConsultants(selectedProject.projectId).length === 0 ? <p className={s.textSubtle}>No consultants</p> : <div className="flex flex-wrap gap-2">{getProjectConsultants(selectedProject.projectId).map(c => <span key={c.consultantId} className={`px-3 py-1 ${s.cardInner} border ${s.divider} rounded-full ${s.text} text-sm`}>{c.firstName} {c.lastName}</span>)}</div>}</div>
                            <div className={`${s.cardInner} rounded-lg p-4`}><div className="flex items-center justify-between mb-2"><h3 className={`${s.textMuted} text-sm flex items-center gap-2`}><Users className="w-4 h-4" />Clients</h3><button onClick={() => { setShowDetailsModal(false); setShowClientsModal(true); }} className={`${s.accent} text-sm`}>Manage</button></div>{getProjectClients(selectedProject.projectId).length === 0 ? <p className={s.textSubtle}>No clients</p> : <div className="flex flex-wrap gap-2">{getProjectClients(selectedProject.projectId).map(c => <span key={c.customerId} className={`px-3 py-1 ${s.cardInner} border ${s.divider} rounded-full ${s.text} text-sm`}>{c.firstName} {c.lastName}</span>)}</div>}</div>
                            {selectedProject.description && <div className={`${s.cardInner} rounded-lg p-4`}><h3 className={`${s.textMuted} text-sm mb-2 flex items-center gap-2`}><FileText className="w-4 h-4" />Description</h3><p className={`${s.text} text-sm`}>{selectedProject.description}</p></div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedProject && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className={`${s.modal} border rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto`}>
                        <div className={`p-5 border-b ${s.divider} flex items-center justify-between sticky top-0 ${isDark ? 'bg-slate-900' : 'bg-white'}`}><h2 className={`text-xl font-bold ${s.text}`}>Edit Project</h2><button onClick={() => { setShowEditModal(false); setShowDetailsModal(true); }} className={`p-2 ${s.cardHover} rounded-lg`}><X className={`w-5 h-5 ${s.textMuted}`} /></button></div>
                        <div className="p-5 space-y-5">
                            <div><label className={`${s.textMuted} text-sm block mb-1`}>Project Name</label><input type="text" value={projectForm.projectName} onChange={(e) => setProjectForm({ ...projectForm, projectName: e.target.value })} className={`w-full px-4 py-2.5 ${s.input} border rounded-lg`} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={`${s.textMuted} text-sm block mb-1`}>Status</label><select value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })} className={`w-full px-4 py-2.5 ${s.input} border rounded-lg`}>{statuses.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}</select></div>
                                <div><label className={`${s.textMuted} text-sm block mb-1`}>Priority</label><select value={projectForm.priority} onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value })} className={`w-full px-4 py-2.5 ${s.input} border rounded-lg`}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
                                <div><label className={`${s.textMuted} text-sm block mb-1`}>Start Date</label><input type="date" value={projectForm.startDate} onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })} className={`w-full px-4 py-2.5 ${s.input} border rounded-lg`} /></div>
                                <div><label className={`${s.textMuted} text-sm block mb-1`}>End Date</label><input type="date" value={projectForm.endDate} onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })} className={`w-full px-4 py-2.5 ${s.input} border rounded-lg`} /></div>
                                <div className="col-span-2"><label className={`${s.textMuted} text-sm block mb-1`}>Budget</label><input type="number" value={projectForm.budget} onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })} className={`w-full px-4 py-2.5 ${s.input} border rounded-lg`} /></div>
                            </div>
                            <div><label className={`${s.textMuted} text-sm block mb-1`}>Description</label><textarea rows={3} value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} className={`w-full px-4 py-2.5 ${s.input} border rounded-lg resize-none`} /></div>
                            <div className="flex gap-3 pt-2"><button onClick={() => { setShowEditModal(false); setShowDetailsModal(true); }} className={`flex-1 px-5 py-2.5 ${s.button} rounded-lg`}>Cancel</button><button onClick={updateProject} className={`flex-1 px-5 py-2.5 ${s.buttonPrimary} rounded-lg`}>Save</button></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Consultants Modal */}
            {showConsultantsModal && selectedProject && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className={`${s.modal} border rounded-lg max-w-xl w-full max-h-[85vh] overflow-y-auto`}>
                        <div className={`p-5 border-b ${s.divider} flex items-center justify-between sticky top-0 ${isDark ? 'bg-slate-900' : 'bg-white'}`}><h2 className={`text-xl font-bold ${s.text}`}>Manage Consultants</h2><button onClick={() => { setShowConsultantsModal(false); setShowDetailsModal(true); }} className={`p-2 ${s.cardHover} rounded-lg`}><X className={`w-5 h-5 ${s.textMuted}`} /></button></div>
                        <div className="p-5 space-y-5">
                            <div><h3 className={`${s.text} font-semibold mb-3 flex items-center gap-2`}><Users className={`w-5 h-5 ${s.accent}`} />Assigned</h3>{getProjectConsultants(selectedProject.projectId).length === 0 ? <p className={`${s.textSubtle} text-center py-4`}>None assigned</p> : <div className="space-y-2">{getProjectConsultants(selectedProject.projectId).map(c => (<div key={c.consultantId} className={`flex items-center justify-between p-3 ${s.cardInner} rounded-lg`}><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">{c.firstName[0]}{c.lastName[0]}</div><div><p className={`${s.text} font-medium`}>{c.firstName} {c.lastName}</p><p className={`${s.textMuted} text-sm`}>{c.email}</p></div></div><button onClick={() => removeConsultantFromProject(c.consultantId)} className="p-2 hover:bg-red-500/20 rounded-lg"><UserMinus className="w-5 h-5 text-red-500" /></button></div>))}</div>}</div>
                            <div><h3 className={`${s.text} font-semibold mb-3 flex items-center gap-2`}><UserPlus className={`w-5 h-5 ${s.accent}`} />Available</h3>{getAvailableConsultants(selectedProject.projectId).length === 0 ? <p className={`${s.textSubtle} text-center py-4`}>All assigned</p> : <div className="space-y-2">{getAvailableConsultants(selectedProject.projectId).map(c => (<div key={c.consultantId} className={`flex items-center justify-between p-3 ${s.cardInner} rounded-lg`}><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">{c.firstName[0]}{c.lastName[0]}</div><div><p className={`${s.text} font-medium`}>{c.firstName} {c.lastName}</p><p className={`${s.textMuted} text-sm`}>{c.consultantCode}</p></div></div><button onClick={() => assignConsultantToProject(c.consultantId)} className={`px-4 py-2 ${s.buttonPrimary} rounded-lg flex items-center gap-2`}><Link2 className="w-4 h-4" />Assign</button></div>))}</div>}</div>
                            <button onClick={() => { setShowConsultantsModal(false); setShowDetailsModal(true); }} className={`w-full px-5 py-2.5 ${s.button} rounded-lg`}>Back</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clients Modal */}
            {showClientsModal && selectedProject && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className={`${s.modal} border rounded-lg max-w-xl w-full max-h-[85vh] overflow-y-auto`}>
                        <div className={`p-5 border-b ${s.divider} flex items-center justify-between sticky top-0 ${isDark ? 'bg-slate-900' : 'bg-white'}`}><h2 className={`text-xl font-bold ${s.text}`}>Manage Clients</h2><button onClick={() => { setShowClientsModal(false); setShowDetailsModal(true); }} className={`p-2 ${s.cardHover} rounded-lg`}><X className={`w-5 h-5 ${s.textMuted}`} /></button></div>
                        <div className="p-5 space-y-5">
                            <div><h3 className={`${s.text} font-semibold mb-3 flex items-center gap-2`}><Users className={`w-5 h-5 ${s.accent}`} />Assigned</h3>{getProjectClients(selectedProject.projectId).length === 0 ? <p className={`${s.textSubtle} text-center py-4`}>None assigned</p> : <div className="space-y-2">{getProjectClients(selectedProject.projectId).map(c => (<div key={c.customerId} className={`flex items-center justify-between p-3 ${s.cardInner} rounded-lg`}><div className="flex items-center gap-3"><div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">{c.firstName[0]}{c.lastName[0]}</div><div><p className={`${s.text} font-medium`}>{c.firstName} {c.lastName}</p><p className={`${s.textMuted} text-sm`}>{c.email}</p></div></div><button onClick={() => removeClientFromProject(c.customerId)} className="p-2 hover:bg-red-500/20 rounded-lg"><UserMinus className="w-5 h-5 text-red-500" /></button></div>))}</div>}</div>
                            <div><h3 className={`${s.text} font-semibold mb-3 flex items-center gap-2`}><UserPlus className={`w-5 h-5 ${s.accent}`} />Available</h3>{getAvailableClients(selectedProject.projectId).length === 0 ? <p className={`${s.textSubtle} text-center py-4`}>All assigned</p> : <div className="space-y-2">{getAvailableClients(selectedProject.projectId).map(c => (<div key={c.customerId} className={`flex items-center justify-between p-3 ${s.cardInner} rounded-lg`}><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">{c.firstName[0]}{c.lastName[0]}</div><div><p className={`${s.text} font-medium`}>{c.firstName} {c.lastName}</p><p className={`${s.textMuted} text-sm`}>{c.clientCode}</p></div></div><button onClick={() => assignClientToProject(c.customerId)} className={`px-4 py-2 ${s.buttonPrimary} rounded-lg flex items-center gap-2`}><Link2 className="w-4 h-4" />Assign</button></div>))}</div>}</div>
                            <button onClick={() => { setShowClientsModal(false); setShowDetailsModal(true); }} className={`w-full px-5 py-2.5 ${s.button} rounded-lg`}>Back</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RealEstateProjects;