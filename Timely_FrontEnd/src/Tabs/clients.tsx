import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../Views_Layouts/ThemeContext';
import { Search, Plus, Filter, ChevronRight, Phone, Users, Building2, Home, DollarSign, Calendar, X, Edit2, Trash2, User, Briefcase, TrendingUp, CheckCircle2, UserPlus, ArrowUpDown, ArrowUp, ArrowDown, StickyNote, FolderOpen, Link2, Unlink, UserMinus, FolderPlus, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';

const API_BASE = 'http://localhost:4000/api';

const STORAGE_KEYS = {
    projectConsultants: 'timely_project_consultants',
    projectClients: 'timely_project_clients',
    clientsExtended: 'timely_clients_extended',
};

const safeFetch = async (url: string) => { try { const r = await fetch(url); if (!r.ok || !r.headers.get('content-type')?.includes('application/json')) return null; return await r.json(); } catch (e) { return null; } };

interface Client { customerId: string; clientCode: string; firstName: string; middleName: string; lastName: string; email: string; tempPassword: string; phone?: string; clientType?: 'buyer' | 'renter' | 'seller' | 'investor'; propertyType?: string; budgetMin?: string; budgetMax?: string; preferredLocations?: string; status?: 'new_lead' | 'contacted' | 'tour_scheduled' | 'offer_made' | 'closed' | 'lost'; lastContactDate?: string; nextFollowUp?: string; notes?: string; }
interface Consultant { consultantId: string; consultantCode: string; firstName: string; lastName: string; email: string; role: string; }
interface Project { projectId: string; projectCode: string; projectName: string; status: string; }
interface ClientConsultant { clientId: string; consultantId: string; createdAt: string; }
interface ProjectClient { projectId: string; clientId: string; createdAt: string; }
interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }

const ClientsPage = () => {
    const { isDark } = useTheme();
    const styles = {
        bg: isDark ? 'bg-slate-950' : 'bg-gray-50',
        text: isDark ? 'text-white' : 'text-gray-900',
        textMuted: isDark ? 'text-slate-400' : 'text-gray-600',
        textSubtle: isDark ? 'text-slate-500' : 'text-gray-400',
        card: isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200',
        cardHover: isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-50',
        cardInner: isDark ? 'bg-slate-800' : 'bg-gray-50',
        input: isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900',
        inputFocus: isDark ? 'focus:border-blue-500' : 'focus:border-blue-500',
        button: isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
        divider: isDark ? 'border-slate-700' : 'border-gray-200',
        modal: isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200',
        tableHeader: isDark ? 'bg-slate-800' : 'bg-gray-100',
        tableRow: isDark ? 'border-slate-700 hover:bg-slate-800/50' : 'border-gray-200 hover:bg-gray-50',
        accent: isDark ? 'text-blue-400' : 'text-blue-600',
    };

    // Toast notification system
    const [toasts, setToasts] = useState<Toast[]>([]);
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = `toast_${Date.now()}`;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };
    const ToastIcon = ({ type }: { type: string }) => {
        if (type === 'success') return <CheckCircle className="w-5 h-5 text-emerald-400" />;
        if (type === 'error') return <AlertCircle className="w-5 h-5 text-red-400" />;
        return <Info className="w-5 h-5 text-blue-400" />;
    };

    const [clients, setClients] = useState<Client[]>([]);
    const [consultants, setConsultants] = useState<Consultant[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [clientConsultants, setClientConsultants] = useState<ClientConsultant[]>([]);
    const [projectClients, setProjectClients] = useState<ProjectClient[]>([]);

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showConsultantsModal, setShowConsultantsModal] = useState(false);
    const [showProjectsModal, setShowProjectsModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [sortConfig, setSortConfig] = useState({ field: 'customerId', direction: 'desc' });

    const [clientForm, setClientForm] = useState({ firstName: '', middleName: '', lastName: '', phone: '', clientType: 'buyer' as const, propertyType: '', budgetMin: '', budgetMax: '', preferredLocations: '', status: 'new_lead' as const, lastContactDate: new Date().toISOString().split('T')[0], nextFollowUp: '', notes: '' });
    const [tempPassword, setTempPassword] = useState('');

    useEffect(() => { loadAllData(); }, []);

    const loadAllData = async () => { setRefreshing(true); await Promise.all([loadClients(), loadConsultants(), loadProjects(), loadClientConsultants(), loadProjectClients()]); setRefreshing(false); };
    const loadClients = async () => { const d = await safeFetch(`${API_BASE}/users-report`); if (d?.data) { const ext = JSON.parse(localStorage.getItem(STORAGE_KEYS.clientsExtended) || '{}'); setClients(d.data.map((c: Client) => ({ ...c, ...ext[c.customerId] }))); } };
    const loadConsultants = async () => { const d = await safeFetch(`${API_BASE}/consultants`); if (d?.data) setConsultants(d.data); };
    const loadProjects = async () => { const d = await safeFetch(`${API_BASE}/projects`); if (d?.data) setProjects(d.data); };
    const loadClientConsultants = async () => { const d = await safeFetch(`${API_BASE}/client-consultants`); if (d?.data) setClientConsultants(d.data); };
    const loadProjectClients = () => { try { const s = localStorage.getItem(STORAGE_KEYS.projectClients); if (s) setProjectClients(JSON.parse(s)); } catch (e) { console.error(e); } };
    const saveProjectClients = (data: ProjectClient[]) => { localStorage.setItem(STORAGE_KEYS.projectClients, JSON.stringify(data)); setProjectClients(data); };

    const companyEmail = useMemo(() => { const f = clientForm.firstName.trim(), l = clientForm.lastName.trim(); if (!f || !l) return ''; return `${l.replace(/\s+/g, '').toLowerCase()}${f[0].toLowerCase()}@timely.com`; }, [clientForm.firstName, clientForm.lastName]);
    const generateStrongPassword = () => { const u = 'ABCDEFGHJKLMNPQRSTUVWXYZ', lo = 'abcdefghijkmnopqrstuvwxyz', d = '23456789', s = '!@$%^&*?'; const pick = (x: string) => x[Math.floor(Math.random() * x.length)]; let p = pick(u) + pick(lo) + pick(d) + pick(s); while (p.length < 12) p += pick(u + lo + d + s); setTempPassword(p.split('').sort(() => Math.random() - 0.5).join('')); };

    const createClient = async () => {
        if (!clientForm.firstName || !clientForm.lastName) { showToast('Please fill required fields', 'error'); return; }
        if (!tempPassword) { showToast('Generate a password first', 'error'); return; }
        setLoading(true);
        try {
            const r = await fetch(`${API_BASE}/users-csv`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName: clientForm.firstName.trim(), middleName: clientForm.middleName.trim(), lastName: clientForm.lastName.trim(), email: companyEmail, tempPassword, performedBy: 'admin' })
            });
            if (!r.ok) throw new Error('Failed');
            const res = await r.json();
            const ext = JSON.parse(localStorage.getItem(STORAGE_KEYS.clientsExtended) || '{}');
            ext[res.customerId] = { phone: clientForm.phone, clientType: clientForm.clientType, propertyType: clientForm.propertyType, budgetMin: clientForm.budgetMin, budgetMax: clientForm.budgetMax, preferredLocations: clientForm.preferredLocations, status: clientForm.status, lastContactDate: clientForm.lastContactDate, nextFollowUp: clientForm.nextFollowUp, notes: clientForm.notes };
            localStorage.setItem(STORAGE_KEYS.clientsExtended, JSON.stringify(ext));
            showToast(`Client created (${res.clientCode})`, 'success');
            setShowCreateModal(false); resetForm(); loadClients();
        } catch (e: any) { showToast(e.message || 'Failed to create client', 'error'); } finally { setLoading(false); }
    };

    const updateClient = () => {
        if (!selectedClient) return;
        const ext = JSON.parse(localStorage.getItem(STORAGE_KEYS.clientsExtended) || '{}');
        ext[selectedClient.customerId] = { phone: clientForm.phone, clientType: clientForm.clientType, propertyType: clientForm.propertyType, budgetMin: clientForm.budgetMin, budgetMax: clientForm.budgetMax, preferredLocations: clientForm.preferredLocations, status: clientForm.status, lastContactDate: clientForm.lastContactDate, nextFollowUp: clientForm.nextFollowUp, notes: clientForm.notes };
        localStorage.setItem(STORAGE_KEYS.clientsExtended, JSON.stringify(ext));
        setShowEditModal(false); setShowDetailsModal(true); loadClients();
        showToast('Client updated', 'success');
    };

    const deleteClient = async (cid: string) => {
        try {
            await fetch(`${API_BASE}/users-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: cid, performedBy: 'admin' }) });
            const ext = JSON.parse(localStorage.getItem(STORAGE_KEYS.clientsExtended) || '{}'); delete ext[cid]; localStorage.setItem(STORAGE_KEYS.clientsExtended, JSON.stringify(ext));
            saveProjectClients(projectClients.filter(pc => pc.clientId !== cid));
            setShowDeleteConfirm(null); setShowDetailsModal(false); setSelectedClient(null); loadAllData();
            showToast('Client deleted', 'success');
        } catch (e) { showToast('Failed to delete client', 'error'); }
    };

    const assignConsultant = async (consultantId: string) => {
        if (!selectedClient) return;
        try {
            const r = await fetch(`${API_BASE}/client-consultants/assign`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: selectedClient.customerId, consultantId, performedBy: 'admin' })
            });
            if (!r.ok) throw new Error('Failed');
            loadClientConsultants();
            showToast('Consultant assigned', 'success');
        } catch (e) { showToast('Failed to assign consultant', 'error'); }
    };

    const removeConsultant = (consultantId: string) => {
        if (!selectedClient) return;
        setClientConsultants(clientConsultants.filter(cc => !(cc.clientId === selectedClient.customerId && cc.consultantId === consultantId)));
        showToast('Consultant removed', 'success');
    };

    const getClientConsultants = (cid: string) => clientConsultants.filter(cc => cc.clientId === cid).map(a => consultants.find(c => c.consultantId === a.consultantId)).filter(Boolean) as Consultant[];
    const getAvailableConsultants = (cid: string) => { const assigned = clientConsultants.filter(cc => cc.clientId === cid).map(cc => cc.consultantId); return consultants.filter(c => !assigned.includes(c.consultantId)); };

    const assignProject = (pid: string) => {
        if (!selectedClient) return;
        if (projectClients.find(pc => pc.clientId === selectedClient.customerId && pc.projectId === pid)) {
            showToast('Already assigned to this project', 'info'); return;
        }
        saveProjectClients([...projectClients, { projectId: pid, clientId: selectedClient.customerId, createdAt: new Date().toISOString() }]);
        showToast('Project assigned', 'success');
    };

    const removeProject = (pid: string) => {
        if (!selectedClient) return;
        saveProjectClients(projectClients.filter(pc => !(pc.clientId === selectedClient.customerId && pc.projectId === pid)));
        showToast('Project removed', 'success');
    };

    const getClientProjects = (cid: string) => projectClients.filter(pc => pc.clientId === cid).map(a => projects.find(p => p.projectId === a.projectId)).filter(Boolean) as Project[];
    const getAvailableProjects = (cid: string) => { const assigned = projectClients.filter(pc => pc.clientId === cid).map(pc => pc.projectId); return projects.filter(p => !assigned.includes(p.projectId)); };

    const resetForm = () => { setClientForm({ firstName: '', middleName: '', lastName: '', phone: '', clientType: 'buyer', propertyType: '', budgetMin: '', budgetMax: '', preferredLocations: '', status: 'new_lead', lastContactDate: new Date().toISOString().split('T')[0], nextFollowUp: '', notes: '' }); setTempPassword(''); };
    const openClientDetails = (c: Client) => { setSelectedClient(c); setClientForm({ firstName: c.firstName, middleName: c.middleName || '', lastName: c.lastName, phone: c.phone || '', clientType: c.clientType || 'buyer', propertyType: c.propertyType || '', budgetMin: c.budgetMin || '', budgetMax: c.budgetMax || '', preferredLocations: c.preferredLocations || '', status: c.status || 'new_lead', lastContactDate: c.lastContactDate || new Date().toISOString().split('T')[0], nextFollowUp: c.nextFollowUp || '', notes: c.notes || '' }); setShowDetailsModal(true); };

    const filteredClients = useMemo(() => {
        let filtered = clients.filter(c => {
            const search = `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()) || (c.clientCode || '').toLowerCase().includes(searchTerm.toLowerCase());
            const status = statusFilter === 'all' || c.status === statusFilter;
            const type = typeFilter === 'all' || c.clientType === typeFilter;
            return search && status && type;
        });
        filtered.sort((a, b) => {
            let aV: any, bV: any;
            switch (sortConfig.field) {
                case 'name': aV = `${a.firstName} ${a.lastName}`.toLowerCase(); bV = `${b.firstName} ${b.lastName}`.toLowerCase(); break;
                case 'status': aV = a.status || ''; bV = b.status || ''; break;
                default: aV = Number(a.customerId) || 0; bV = Number(b.customerId) || 0;
            }
            return sortConfig.direction === 'asc' ? (aV > bV ? 1 : -1) : (aV < bV ? 1 : -1);
        });
        return filtered;
    }, [clients, searchTerm, statusFilter, typeFilter, sortConfig]);

    const stats = useMemo(() => ({ total: clients.length, newLeads: clients.filter(c => c.status === 'new_lead').length, active: clients.filter(c => ['contacted', 'tour_scheduled', 'offer_made'].includes(c.status || '')).length, closed: clients.filter(c => c.status === 'closed').length }), [clients]);

    const getStatusColor = (s: string) => ({ new_lead: 'bg-blue-600', contacted: 'bg-cyan-600', tour_scheduled: 'bg-amber-600', offer_made: 'bg-purple-600', closed: 'bg-emerald-600', lost: 'bg-gray-600' }[s] || 'bg-gray-600');
    const getStatusLabel = (s: string) => ({ new_lead: 'New Lead', contacted: 'Contacted', tour_scheduled: 'Tour Scheduled', offer_made: 'Offer Made', closed: 'Closed', lost: 'Lost' }[s] || s || 'New Lead');
    const getClientTypeIcon = (t: string) => { switch (t) { case 'buyer': return <Home className="w-4 h-4" />; case 'renter': return <Building2 className="w-4 h-4" />; case 'seller': return <DollarSign className="w-4 h-4" />; case 'investor': return <TrendingUp className="w-4 h-4" />; default: return <User className="w-4 h-4" />; } };
    const getClientTypeLabel = (t: string) => ({ buyer: 'Buyer', renter: 'Renter', seller: 'Seller', investor: 'Investor' }[t] || t || 'Buyer');
    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString() : 'N/A';
    const formatBudget = (min: string, max: string) => { if (!min && !max) return 'N/A'; if (min && max) return `$${Number(min).toLocaleString()} - $${Number(max).toLocaleString()}`; if (min) return `From $${Number(min).toLocaleString()}`; return `Up to $${Number(max).toLocaleString()}`; };
    const toggleSort = (f: string) => setSortConfig(p => ({ field: f, direction: p.field === f && p.direction === 'asc' ? 'desc' : 'asc' }));
    const getSortIcon = (f: string) => sortConfig.field !== f ? <ArrowUpDown className={`w-4 h-4 ${styles.textSubtle}`} /> : sortConfig.direction === 'asc' ? <ArrowUp className={`w-4 h-4 ${styles.accent}`} /> : <ArrowDown className={`w-4 h-4 ${styles.accent}`} />;

    return (
        <div className={`min-h-screen ${styles.bg}`}>
            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-[10000] space-y-2">
                {toasts.map(toast => (
                    <div key={toast.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} animate-in slide-in-from-right duration-300`}>
                        <ToastIcon type={toast.type} />
                        <span className={styles.text}>{toast.message}</span>
                        <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className={`ml-2 ${styles.textMuted} hover:${styles.text}`}><X className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className={`${styles.modal} border rounded-lg max-w-md w-full p-6`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-500" /></div>
                            <h3 className={`text-lg font-semibold ${styles.text}`}>Delete Client?</h3>
                        </div>
                        <p className={`${styles.textMuted} mb-6`}>This will permanently delete the client and remove all project assignments. This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(null)} className={`flex-1 px-4 py-2.5 ${styles.button} rounded-lg`}>Cancel</button>
                            <button onClick={() => deleteClient(showDeleteConfirm)} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <div className="flex items-start justify-between mb-6">
                        <div><h1 className={`text-4xl font-bold ${styles.text} mb-2`}>Clients</h1><p className={styles.textMuted}>Track customers and who's helping them</p></div>
                        <div className="flex items-center gap-3">
                            <button onClick={loadAllData} disabled={refreshing} className={`p-2.5 rounded-lg border ${styles.divider} ${styles.cardHover} ${refreshing ? 'animate-spin' : ''}`}><RefreshCw className={`w-5 h-5 ${styles.textMuted}`} /></button>
                            <button onClick={() => setShowCreateModal(true)} className={`${styles.buttonPrimary} px-5 py-2.5 rounded-lg flex items-center gap-2`}><Plus className="w-5 h-5" />Add Client</button>
                        </div>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="relative flex-1"><Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${styles.textMuted} w-5 h-5`} /><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 ${styles.input} border rounded-lg focus:outline-none ${styles.inputFocus}`} /></div>
                        <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-2.5 rounded-lg flex items-center gap-2 ${showFilters ? styles.buttonPrimary : styles.button}`}><Filter className="w-5 h-5" />Filters</button>
                    </div>
                    {showFilters && (
                        <div className={`mt-4 p-4 ${styles.card} border rounded-lg grid grid-cols-2 gap-4`}>
                            <div><label className={`${styles.textMuted} text-sm block mb-1`}>Status</label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`w-full px-4 py-2 ${styles.input} border rounded-lg`}><option value="all">All</option><option value="new_lead">New Lead</option><option value="contacted">Contacted</option><option value="tour_scheduled">Tour Scheduled</option><option value="offer_made">Offer Made</option><option value="closed">Closed</option><option value="lost">Lost</option></select></div>
                            <div><label className={`${styles.textMuted} text-sm block mb-1`}>Type</label><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`w-full px-4 py-2 ${styles.input} border rounded-lg`}><option value="all">All</option><option value="buyer">Buyer</option><option value="renter">Renter</option><option value="seller">Seller</option><option value="investor">Investor</option></select></div>
                        </div>
                    )}
                    <div className="grid grid-cols-4 gap-4 mt-6">
                        {[{ label: 'Total', value: stats.total, icon: Users }, { label: 'New Leads', value: stats.newLeads, icon: UserPlus }, { label: 'Active', value: stats.active, icon: TrendingUp }, { label: 'Closed', value: stats.closed, icon: CheckCircle2 }].map((s, i) => (
                            <div key={i} className={`${styles.card} border rounded-lg p-4`}><div className="flex items-center justify-between mb-1"><span className={`${styles.textMuted} text-sm`}>{s.label}</span><s.icon className={`w-5 h-5 ${styles.accent}`} /></div><div className={`text-2xl font-bold ${styles.text}`}>{s.value}</div></div>
                        ))}
                    </div>
                </div>

                <div className={`${styles.card} border rounded-lg overflow-hidden`}>
                    <div className={`grid grid-cols-12 gap-4 p-4 border-b ${styles.divider} ${styles.tableHeader}`}>
                        <div className={`col-span-3 flex items-center gap-2 cursor-pointer ${styles.textMuted} text-sm`} onClick={() => toggleSort('name')}>Client {getSortIcon('name')}</div>
                        <div className={`col-span-2 ${styles.textMuted} text-sm`}>Consultants</div>
                        <div className={`col-span-2 ${styles.textMuted} text-sm`}>Projects</div>
                        <div className={`col-span-2 flex items-center gap-2 cursor-pointer ${styles.textMuted} text-sm`} onClick={() => toggleSort('status')}>Status {getSortIcon('status')}</div>
                        <div className={`col-span-2 ${styles.textMuted} text-sm`}>Type</div>
                        <div className={`col-span-1 ${styles.textMuted} text-sm text-right`}>Actions</div>
                    </div>
                    {filteredClients.length === 0 ? (
                        <div className="text-center py-16"><Users className={`w-12 h-12 ${styles.textSubtle} mx-auto mb-3`} /><p className={styles.textMuted}>No clients found</p></div>
                    ) : filteredClients.map(c => {
                        const cConsultants = getClientConsultants(c.customerId);
                        const cProjects = getClientProjects(c.customerId);
                        return (
                            <div key={c.customerId} className={`grid grid-cols-12 gap-4 p-4 border-b ${styles.tableRow} cursor-pointer`} onClick={() => openClientDetails(c)}>
                                <div className="col-span-3 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">{c.firstName[0]}{c.lastName[0]}</div>
                                    <div><p className={`${styles.text} font-medium`}>{c.firstName} {c.lastName}</p><p className={`${styles.textSubtle} text-xs`}>{c.clientCode}</p></div>
                                </div>
                                <div className="col-span-2 flex items-center gap-1"><Users className={`w-4 h-4 ${styles.textSubtle}`} /><span className={`${styles.textMuted} text-sm`}>{cConsultants.length}</span></div>
                                <div className="col-span-2 flex items-center gap-1"><FolderOpen className={`w-4 h-4 ${styles.textSubtle}`} /><span className={`${styles.textMuted} text-sm`}>{cProjects.length}</span></div>
                                <div className="col-span-2 flex items-center"><span className={`${getStatusColor(c.status || 'new_lead')} px-3 py-1 rounded-full text-white text-xs`}>{getStatusLabel(c.status || 'new_lead')}</span></div>
                                <div className={`col-span-2 flex items-center gap-1 ${styles.textMuted}`}>{getClientTypeIcon(c.clientType || 'buyer')}<span className="text-sm">{getClientTypeLabel(c.clientType || 'buyer')}</span></div>
                                <div className="col-span-1 flex items-center justify-end"><ChevronRight className={`w-5 h-5 ${styles.textMuted}`} /></div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className={`${styles.modal} border rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto`}>
                        <div className={`p-5 border-b ${styles.divider} flex items-center justify-between sticky top-0 ${isDark ? 'bg-slate-900' : 'bg-white'}`}><h2 className={`text-xl font-bold ${styles.text}`}>Add Client</h2><button onClick={() => { setShowCreateModal(false); resetForm(); }} className={`p-2 ${styles.cardHover} rounded-lg`}><X className={`w-5 h-5 ${styles.textMuted}`} /></button></div>
                        <div className="p-5 space-y-5">
                            <div><h3 className={`${styles.text} font-semibold mb-3 flex items-center gap-2`}><User className={`w-5 h-5 ${styles.accent}`} />Personal</h3><div className="grid grid-cols-3 gap-4"><div><label className={`${styles.textMuted} text-sm block mb-1`}>First *</label><input type="text" value={clientForm.firstName} onChange={(e) => setClientForm({ ...clientForm, firstName: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`} /></div><div><label className={`${styles.textMuted} text-sm block mb-1`}>Middle</label><input type="text" value={clientForm.middleName} onChange={(e) => setClientForm({ ...clientForm, middleName: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`} /></div><div><label className={`${styles.textMuted} text-sm block mb-1`}>Last *</label><input type="text" value={clientForm.lastName} onChange={(e) => setClientForm({ ...clientForm, lastName: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`} /></div></div><div className="mt-3"><label className={`${styles.textMuted} text-sm block mb-1`}>Email (auto)</label><div className={`px-4 py-2.5 ${styles.cardInner} border ${styles.divider} rounded-lg ${styles.textMuted}`}>{companyEmail || 'Enter names'}</div></div><div className="mt-3"><label className={`${styles.textMuted} text-sm block mb-1`}>Phone</label><input type="tel" value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`} /></div></div>
                            <div><h3 className={`${styles.text} font-semibold mb-3 flex items-center gap-2`}><Briefcase className={`w-5 h-5 ${styles.accent}`} />Account</h3><div><label className={`${styles.textMuted} text-sm block mb-1`}>Temp Password *</label><div className="flex gap-2"><input type="text" value={tempPassword} readOnly placeholder="Click Generate" className={`flex-1 px-4 py-2.5 ${styles.input} border rounded-lg font-mono`} /><button type="button" onClick={generateStrongPassword} className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg">Generate</button></div></div></div>
                            <div><h3 className={`${styles.text} font-semibold mb-3 flex items-center gap-2`}><TrendingUp className={`w-5 h-5 ${styles.accent}`} />Status & Type</h3><div className="grid grid-cols-2 gap-4"><div><label className={`${styles.textMuted} text-sm block mb-1`}>Status</label><select value={clientForm.status} onChange={(e) => setClientForm({ ...clientForm, status: e.target.value as any })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`}><option value="new_lead">New Lead</option><option value="contacted">Contacted</option><option value="tour_scheduled">Tour Scheduled</option><option value="offer_made">Offer Made</option><option value="closed">Closed</option><option value="lost">Lost</option></select></div><div><label className={`${styles.textMuted} text-sm block mb-1`}>Type</label><select value={clientForm.clientType} onChange={(e) => setClientForm({ ...clientForm, clientType: e.target.value as any })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`}><option value="buyer">Buyer</option><option value="renter">Renter</option><option value="seller">Seller</option><option value="investor">Investor</option></select></div></div></div>
                            <div><h3 className={`${styles.text} font-semibold mb-3 flex items-center gap-2`}><Home className={`w-5 h-5 ${styles.accent}`} />Requirements</h3><div className="grid grid-cols-2 gap-4"><div><label className={`${styles.textMuted} text-sm block mb-1`}>Property</label><select value={clientForm.propertyType} onChange={(e) => setClientForm({ ...clientForm, propertyType: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`}><option value="">Select</option><option value="apartment">Apartment</option><option value="house">House</option><option value="condo">Condo</option><option value="townhouse">Townhouse</option><option value="commercial">Commercial</option><option value="land">Land</option></select></div><div><label className={`${styles.textMuted} text-sm block mb-1`}>Locations</label><input type="text" value={clientForm.preferredLocations} onChange={(e) => setClientForm({ ...clientForm, preferredLocations: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`} placeholder="Downtown..." /></div><div><label className={`${styles.textMuted} text-sm block mb-1`}>Budget Min</label><input type="number" value={clientForm.budgetMin} onChange={(e) => setClientForm({ ...clientForm, budgetMin: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`} /></div><div><label className={`${styles.textMuted} text-sm block mb-1`}>Budget Max</label><input type="number" value={clientForm.budgetMax} onChange={(e) => setClientForm({ ...clientForm, budgetMax: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`} /></div></div></div>
                            <div><h3 className={`${styles.text} font-semibold mb-3 flex items-center gap-2`}><Calendar className={`w-5 h-5 ${styles.accent}`} />Follow-up</h3><div className="grid grid-cols-2 gap-4"><div><label className={`${styles.textMuted} text-sm block mb-1`}>Last Contact</label><input type="date" value={clientForm.lastContactDate} onChange={(e) => setClientForm({ ...clientForm, lastContactDate: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`} /></div><div><label className={`${styles.textMuted} text-sm block mb-1`}>Next Follow-up</label><input type="date" value={clientForm.nextFollowUp} onChange={(e) => setClientForm({ ...clientForm, nextFollowUp: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`} /></div></div></div>
                            <div><label className={`${styles.textMuted} text-sm block mb-1`}>Notes</label><textarea rows={3} value={clientForm.notes} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg resize-none`} placeholder="Additional notes..." /></div>
                            <div className="flex gap-3 pt-2"><button onClick={() => { setShowCreateModal(false); resetForm(); }} className={`flex-1 px-5 py-2.5 ${styles.button} rounded-lg`}>Cancel</button><button onClick={createClient} disabled={loading} className={`flex-1 px-5 py-2.5 ${styles.buttonPrimary} rounded-lg disabled:opacity-50`}>{loading ? 'Creating...' : 'Create'}</button></div>
                        </div>
                    </div>
                </div>
            )}

            {showDetailsModal && selectedClient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className={`${styles.modal} border rounded-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto`}>
                        <div className={`p-5 border-b ${styles.divider} flex items-center justify-between sticky top-0 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">{selectedClient.firstName[0]}{selectedClient.lastName[0]}</div><div><h2 className={`text-xl font-bold ${styles.text}`}>{selectedClient.firstName} {selectedClient.lastName}</h2><p className={styles.textMuted}>{selectedClient.clientCode} - {selectedClient.email}</p></div></div>
                            <div className="flex items-center gap-2"><button onClick={() => setShowDeleteConfirm(selectedClient.customerId)} className="p-2 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-5 h-5 text-red-500" /></button><button onClick={() => { setShowDetailsModal(false); setSelectedClient(null); }} className={`p-2 ${styles.cardHover} rounded-lg`}><X className={`w-5 h-5 ${styles.textMuted}`} /></button></div>
                        </div>
                        <div className="p-5 space-y-5">
                            <div className="flex items-center gap-4 flex-wrap"><span className={`${getStatusColor(selectedClient.status || 'new_lead')} px-3 py-1 rounded-full text-white text-sm`}>{getStatusLabel(selectedClient.status || 'new_lead')}</span><span className={`${styles.textMuted} flex items-center gap-1`}>{getClientTypeIcon(selectedClient.clientType || 'buyer')}{getClientTypeLabel(selectedClient.clientType || 'buyer')}</span>{selectedClient.phone && <span className={`${styles.textMuted} flex items-center gap-1`}><Phone className="w-4 h-4" />{selectedClient.phone}</span>}</div>
                            <div className="grid grid-cols-3 gap-4">
                                <button onClick={() => { setShowDetailsModal(false); setShowEditModal(true); }} className={`flex items-center justify-center gap-2 px-4 py-2.5 ${styles.button} rounded-lg`}><Edit2 className="w-4 h-4" />Edit</button>
                                <button onClick={() => { setShowDetailsModal(false); setShowConsultantsModal(true); }} className={`flex items-center justify-center gap-2 px-4 py-2.5 ${styles.button} rounded-lg`}><Users className="w-4 h-4" />Consultants</button>
                                <button onClick={() => { setShowDetailsModal(false); setShowProjectsModal(true); }} className={`flex items-center justify-center gap-2 px-4 py-2.5 ${styles.button} rounded-lg`}><FolderOpen className="w-4 h-4" />Projects</button>
                            </div>
                            <div className={`${styles.cardInner} rounded-lg p-4`}><h3 className={`${styles.textMuted} text-sm mb-2 flex items-center gap-2`}><Home className="w-4 h-4" />Requirements</h3><div className="grid grid-cols-2 gap-4"><div><p className={`${styles.textSubtle} text-xs`}>Property</p><p className={`${styles.text} capitalize`}>{selectedClient.propertyType || 'N/A'}</p></div><div><p className={`${styles.textSubtle} text-xs`}>Budget</p><p className={styles.text}>{formatBudget(selectedClient.budgetMin || '', selectedClient.budgetMax || '')}</p></div><div className="col-span-2"><p className={`${styles.textSubtle} text-xs`}>Locations</p><p className={styles.text}>{selectedClient.preferredLocations || 'N/A'}</p></div></div></div>
                            <div className={`${styles.cardInner} rounded-lg p-4`}><div className="flex items-center justify-between mb-2"><h3 className={`${styles.textMuted} text-sm flex items-center gap-2`}><Users className="w-4 h-4" />Consultants</h3><button onClick={() => { setShowDetailsModal(false); setShowConsultantsModal(true); }} className={`${styles.accent} text-sm`}>Manage</button></div>{getClientConsultants(selectedClient.customerId).length === 0 ? <p className={styles.textSubtle}>No consultants assigned</p> : <div className="flex flex-wrap gap-2">{getClientConsultants(selectedClient.customerId).map(c => <span key={c.consultantId} className={`px-3 py-1 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-full ${styles.text} text-sm`}>{c.firstName} {c.lastName}</span>)}</div>}</div>
                            <div className={`${styles.cardInner} rounded-lg p-4`}><div className="flex items-center justify-between mb-2"><h3 className={`${styles.textMuted} text-sm flex items-center gap-2`}><FolderOpen className="w-4 h-4" />Projects</h3><button onClick={() => { setShowDetailsModal(false); setShowProjectsModal(true); }} className={`${styles.accent} text-sm`}>Manage</button></div>{getClientProjects(selectedClient.customerId).length === 0 ? <p className={styles.textSubtle}>No projects assigned</p> : <div className="space-y-2">{getClientProjects(selectedClient.customerId).map(p => <div key={p.projectId} className={`px-3 py-2 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-lg ${styles.text} text-sm`}>{p.projectName}</div>)}</div>}</div>
                            {selectedClient.notes && <div className={`${styles.cardInner} rounded-lg p-4`}><h3 className={`${styles.textMuted} text-sm mb-2 flex items-center gap-2`}><StickyNote className="w-4 h-4" />Notes</h3><p className={`${styles.text} text-sm`}>{selectedClient.notes}</p></div>}
                            <div className={`${styles.cardInner} rounded-lg p-4`}><h3 className={`${styles.textMuted} text-sm mb-2 flex items-center gap-2`}><Calendar className="w-4 h-4" />Timeline</h3><div className="grid grid-cols-2 gap-4"><div><p className={`${styles.textSubtle} text-xs`}>Last Contact</p><p className={styles.text}>{formatDate(selectedClient.lastContactDate || '')}</p></div><div><p className={`${styles.textSubtle} text-xs`}>Next Follow-up</p><p className={styles.text}>{formatDate(selectedClient.nextFollowUp || '')}</p></div></div></div>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && selectedClient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className={`${styles.modal} border rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto`}>
                        <div className={`p-5 border-b ${styles.divider} flex items-center justify-between sticky top-0 ${isDark ? 'bg-slate-900' : 'bg-white'}`}><h2 className={`text-xl font-bold ${styles.text}`}>Edit Client</h2><button onClick={() => { setShowEditModal(false); setShowDetailsModal(true); }} className={`p-2 ${styles.cardHover} rounded-lg`}><X className={`w-5 h-5 ${styles.textMuted}`} /></button></div>
                        <div className="p-5 space-y-5">
                            <div className={`${styles.cardInner} rounded-lg p-4`}><h3 className={`${styles.textMuted} text-sm mb-2`}>Account (Read-only)</h3><div className="grid grid-cols-2 gap-4"><div><p className={`${styles.textSubtle} text-xs`}>Name</p><p className={styles.text}>{selectedClient.firstName} {selectedClient.lastName}</p></div><div><p className={`${styles.textSubtle} text-xs`}>Email</p><p className={styles.text}>{selectedClient.email}</p></div></div></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={`${styles.textMuted} text-sm block mb-1`}>Phone</label><input type="tel" value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`} /></div>
                                <div><label className={`${styles.textMuted} text-sm block mb-1`}>Status</label><select value={clientForm.status} onChange={(e) => setClientForm({ ...clientForm, status: e.target.value as any })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`}><option value="new_lead">New Lead</option><option value="contacted">Contacted</option><option value="tour_scheduled">Tour Scheduled</option><option value="offer_made">Offer Made</option><option value="closed">Closed</option><option value="lost">Lost</option></select></div>
                                <div><label className={`${styles.textMuted} text-sm block mb-1`}>Type</label><select value={clientForm.clientType} onChange={(e) => setClientForm({ ...clientForm, clientType: e.target.value as any })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`}><option value="buyer">Buyer</option><option value="renter">Renter</option><option value="seller">Seller</option><option value="investor">Investor</option></select></div>
                                <div><label className={`${styles.textMuted} text-sm block mb-1`}>Property</label><select value={clientForm.propertyType} onChange={(e) => setClientForm({ ...clientForm, propertyType: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`}><option value="">Select</option><option value="apartment">Apartment</option><option value="house">House</option><option value="condo">Condo</option><option value="townhouse">Townhouse</option><option value="commercial">Commercial</option><option value="land">Land</option></select></div>
                                <div><label className={`${styles.textMuted} text-sm block mb-1`}>Budget Min</label><input type="number" value={clientForm.budgetMin} onChange={(e) => setClientForm({ ...clientForm, budgetMin: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`} /></div>
                                <div><label className={`${styles.textMuted} text-sm block mb-1`}>Budget Max</label><input type="number" value={clientForm.budgetMax} onChange={(e) => setClientForm({ ...clientForm, budgetMax: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`} /></div>
                                <div className="col-span-2"><label className={`${styles.textMuted} text-sm block mb-1`}>Locations</label><input type="text" value={clientForm.preferredLocations} onChange={(e) => setClientForm({ ...clientForm, preferredLocations: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`} /></div>
                                <div><label className={`${styles.textMuted} text-sm block mb-1`}>Last Contact</label><input type="date" value={clientForm.lastContactDate} onChange={(e) => setClientForm({ ...clientForm, lastContactDate: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`} /></div>
                                <div><label className={`${styles.textMuted} text-sm block mb-1`}>Next Follow-up</label><input type="date" value={clientForm.nextFollowUp} onChange={(e) => setClientForm({ ...clientForm, nextFollowUp: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg`} /></div>
                                <div className="col-span-2"><label className={`${styles.textMuted} text-sm block mb-1`}>Notes</label><textarea rows={3} value={clientForm.notes} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} className={`w-full px-4 py-2.5 ${styles.input} border rounded-lg resize-none`} /></div>
                            </div>
                            <div className="flex gap-3 pt-2"><button onClick={() => { setShowEditModal(false); setShowDetailsModal(true); }} className={`flex-1 px-5 py-2.5 ${styles.button} rounded-lg`}>Cancel</button><button onClick={updateClient} className={`flex-1 px-5 py-2.5 ${styles.buttonPrimary} rounded-lg`}>Save</button></div>
                        </div>
                    </div>
                </div>
            )}

            {showConsultantsModal && selectedClient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className={`${styles.modal} border rounded-lg max-w-xl w-full max-h-[85vh] overflow-y-auto`}>
                        <div className={`p-5 border-b ${styles.divider} flex items-center justify-between sticky top-0 ${isDark ? 'bg-slate-900' : 'bg-white'}`}><h2 className={`text-xl font-bold ${styles.text}`}>Manage Consultants</h2><button onClick={() => { setShowConsultantsModal(false); setShowDetailsModal(true); }} className={`p-2 ${styles.cardHover} rounded-lg`}><X className={`w-5 h-5 ${styles.textMuted}`} /></button></div>
                        <div className="p-5 space-y-5">
                            <div>
                                <h3 className={`${styles.text} font-semibold mb-3 flex items-center gap-2`}><Users className={`w-5 h-5 ${styles.accent}`} />Assigned</h3>
                                {getClientConsultants(selectedClient.customerId).length === 0 ? <p className={`${styles.textSubtle} text-center py-4`}>No consultants assigned</p> : (
                                    <div className="space-y-2">{getClientConsultants(selectedClient.customerId).map(c => (
                                        <div key={c.consultantId} className={`flex items-center justify-between p-3 ${styles.cardInner} rounded-lg`}>
                                            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">{c.firstName[0]}{c.lastName[0]}</div><div><p className={`${styles.text} font-medium`}>{c.firstName} {c.lastName}</p><p className={`${styles.textMuted} text-sm`}>{c.email}</p></div></div>
                                            <button onClick={() => removeConsultant(c.consultantId)} className="p-2 hover:bg-red-500/20 rounded-lg" title="Remove"><UserMinus className="w-5 h-5 text-red-500" /></button>
                                        </div>
                                    ))}</div>
                                )}
                            </div>
                            <div>
                                <h3 className={`${styles.text} font-semibold mb-3 flex items-center gap-2`}><UserPlus className={`w-5 h-5 ${styles.accent}`} />Available</h3>
                                {getAvailableConsultants(selectedClient.customerId).length === 0 ? <p className={`${styles.textSubtle} text-center py-4`}>All consultants assigned</p> : (
                                    <div className="space-y-2">{getAvailableConsultants(selectedClient.customerId).map(c => (
                                        <div key={c.consultantId} className={`flex items-center justify-between p-3 ${styles.cardInner} rounded-lg`}>
                                            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">{c.firstName[0]}{c.lastName[0]}</div><div><p className={`${styles.text} font-medium`}>{c.firstName} {c.lastName}</p><p className={`${styles.textMuted} text-sm`}>{c.role || 'Consultant'}</p></div></div>
                                            <button onClick={() => assignConsultant(c.consultantId)} className={`px-4 py-2 ${styles.buttonPrimary} rounded-lg flex items-center gap-2`}><Link2 className="w-4 h-4" />Assign</button>
                                        </div>
                                    ))}</div>
                                )}
                            </div>
                            <button onClick={() => { setShowConsultantsModal(false); setShowDetailsModal(true); }} className={`w-full px-5 py-2.5 ${styles.button} rounded-lg`}>Back</button>
                        </div>
                    </div>
                </div>
            )}

            {showProjectsModal && selectedClient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className={`${styles.modal} border rounded-lg max-w-xl w-full max-h-[85vh] overflow-y-auto`}>
                        <div className={`p-5 border-b ${styles.divider} flex items-center justify-between sticky top-0 ${isDark ? 'bg-slate-900' : 'bg-white'}`}><h2 className={`text-xl font-bold ${styles.text}`}>Manage Projects</h2><button onClick={() => { setShowProjectsModal(false); setShowDetailsModal(true); }} className={`p-2 ${styles.cardHover} rounded-lg`}><X className={`w-5 h-5 ${styles.textMuted}`} /></button></div>
                        <div className="p-5 space-y-5">
                            <div>
                                <h3 className={`${styles.text} font-semibold mb-3 flex items-center gap-2`}><FolderOpen className={`w-5 h-5 ${styles.accent}`} />Assigned</h3>
                                {getClientProjects(selectedClient.customerId).length === 0 ? <p className={`${styles.textSubtle} text-center py-4`}>No projects assigned</p> : (
                                    <div className="space-y-2">{getClientProjects(selectedClient.customerId).map(p => (
                                        <div key={p.projectId} className={`flex items-center justify-between p-3 ${styles.cardInner} rounded-lg`}>
                                            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center text-white"><FolderOpen className="w-5 h-5" /></div><div><p className={`${styles.text} font-medium`}>{p.projectName}</p><p className={`${styles.textMuted} text-sm`}>{p.projectCode}</p></div></div>
                                            <button onClick={() => removeProject(p.projectId)} className="p-2 hover:bg-red-500/20 rounded-lg" title="Remove"><Unlink className="w-4 h-4 text-red-500" /></button>
                                        </div>
                                    ))}</div>
                                )}
                            </div>
                            <div>
                                <h3 className={`${styles.text} font-semibold mb-3 flex items-center gap-2`}><FolderPlus className={`w-5 h-5 ${styles.accent}`} />Available</h3>
                                {getAvailableProjects(selectedClient.customerId).length === 0 ? <p className={`${styles.textSubtle} text-center py-4`}>All projects assigned</p> : (
                                    <div className="space-y-2">{getAvailableProjects(selectedClient.customerId).map(p => (
                                        <div key={p.projectId} className={`flex items-center justify-between p-3 ${styles.cardInner} rounded-lg`}>
                                            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white"><FolderOpen className="w-5 h-5" /></div><div><p className={`${styles.text} font-medium`}>{p.projectName}</p><p className={`${styles.textMuted} text-sm`}>{p.status || 'No status'}</p></div></div>
                                            <button onClick={() => assignProject(p.projectId)} className={`px-4 py-2 ${styles.buttonPrimary} rounded-lg flex items-center gap-2`}><Link2 className="w-4 h-4" />Assign</button>
                                        </div>
                                    ))}</div>
                                )}
                            </div>
                            <button onClick={() => { setShowProjectsModal(false); setShowDetailsModal(true); }} className={`w-full px-5 py-2.5 ${styles.button} rounded-lg`}>Back</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientsPage;