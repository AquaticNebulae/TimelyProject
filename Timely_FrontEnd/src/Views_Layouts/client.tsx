import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Plus, Filter, ChevronRight, Phone, Mail,
    Users, Building2, Home, DollarSign, Calendar,
    X, Edit2, Trash2, User, Briefcase,
    TrendingUp, CheckCircle2, UserPlus,
    ArrowUpDown, ArrowUp, ArrowDown, StickyNote,
    FolderOpen, Link2, Unlink, UserMinus, FolderPlus
} from 'lucide-react';

const API_BASE = 'http://localhost:4000/api';

// Safe fetch helper - prevents JSON parse errors when API returns HTML
const safeFetch = async (url: string) => {
    try {
        const response = await fetch(url);
        const contentType = response.headers.get('content-type');

        if (!response.ok || !contentType?.includes('application/json')) {
            console.warn(`API ${url} returned non-JSON or error:`, response.status);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.warn(`Failed to fetch ${url}:`, error);
        return null;
    }
};

// Types
interface Client {
    customerId: string;
    clientCode: string;
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    tempPassword: string;
    phone?: string;
    clientType?: 'buyer' | 'renter' | 'seller' | 'investor';
    propertyType?: string;
    budgetMin?: string;
    budgetMax?: string;
    preferredLocations?: string;
    status?: 'new_lead' | 'contacted' | 'tour_scheduled' | 'offer_made' | 'closed' | 'lost';
    lastContactDate?: string;
    nextFollowUp?: string;
    notes?: string;
}

interface Consultant {
    consultantId: string;
    consultantCode: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

interface Project {
    projectId: string;
    projectCode: string;
    projectName: string;
    clientName: string;
    status: string;
}

interface ClientConsultant {
    clientId: string;
    consultantId: string;
    createdAt: string;
}

interface ClientProject {
    clientId: string;
    projectId: string;
    isCurrent: string;
    createdAt: string;
}

// Props types for the component
type UserInfo = {
    customerId: string;
    email: string;
    name: string;
};

type Props = {
    userData: UserInfo;
    onLogout: () => void;
};

const ClientsHomePage: React.FC<Props> = ({ userData, onLogout }) => {
    // Data state
    const [clients, setClients] = useState<Client[]>([]);
    const [consultants, setConsultants] = useState<Consultant[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [clientConsultants, setClientConsultants] = useState<ClientConsultant[]>([]);
    const [clientProjects, setClientProjects] = useState<ClientProject[]>([]);

    // UI state
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showConsultantsModal, setShowConsultantsModal] = useState(false);
    const [showProjectsModal, setShowProjectsModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ field: 'customerId', direction: 'desc' });

    // Form state
    const [clientForm, setClientForm] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        phone: '',
        clientType: 'buyer' as const,
        propertyType: '',
        budgetMin: '',
        budgetMax: '',
        preferredLocations: '',
        status: 'new_lead' as const,
        lastContactDate: new Date().toISOString().split('T')[0],
        nextFollowUp: '',
        notes: ''
    });

    const [tempPassword, setTempPassword] = useState('');

    // Load all data on mount
    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        await Promise.all([
            loadClients(),
            loadConsultants(),
            loadProjects(),
            loadClientConsultants(),
            loadClientProjects()
        ]);
    };

    const loadClients = async () => {
        try {
            const data = await safeFetch(`${API_BASE}/users-report`);

            if (data?.data) {
                const extendedData = localStorage.getItem('timely_clients_extended');
                const extended = extendedData ? JSON.parse(extendedData) : {};

                const mergedClients = data.data.map((client: Client) => ({
                    ...client,
                    ...extended[client.customerId]
                }));

                setClients(mergedClients);
            } else {
                // Fallback to localStorage only
                const extendedData = localStorage.getItem('timely_clients_extended');
                if (extendedData) {
                    const extended = JSON.parse(extendedData);
                    const localClients = Object.entries(extended).map(([id, data]: [string, any]) => ({
                        customerId: id,
                        clientCode: '',
                        firstName: data.firstName || '',
                        middleName: '',
                        lastName: data.lastName || '',
                        email: '',
                        tempPassword: '',
                        ...data
                    }));
                    setClients(localClients as Client[]);
                }
            }
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    };

    const loadConsultants = async () => {
        try {
            const data = await safeFetch(`${API_BASE}/consultants`);
            if (data?.data) {
                setConsultants(data.data);
            } else {
                setConsultants([]);
            }
        } catch (error) {
            console.error('Error loading consultants:', error);
            setConsultants([]);
        }
    };

    const loadProjects = async () => {
        try {
            const data = await safeFetch(`${API_BASE}/projects`);
            if (data?.data) {
                setProjects(data.data);
            } else {
                setProjects([]);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            setProjects([]);
        }
    };

    const loadClientConsultants = async () => {
        try {
            const data = await safeFetch(`${API_BASE}/client-consultants`);
            if (data?.data) {
                setClientConsultants(data.data);
            } else {
                setClientConsultants([]);
            }
        } catch (error) {
            console.error('Error loading client-consultants:', error);
            setClientConsultants([]);
        }
    };

    const loadClientProjects = async () => {
        try {
            const stored = localStorage.getItem('timely_client_projects');
            if (stored) {
                setClientProjects(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading client-projects:', error);
        }
    };

    // Company email generation
    const companyEmail = useMemo(() => {
        const f = clientForm.firstName.trim();
        const l = clientForm.lastName.trim();
        if (!f || !l) return '';
        const firstInitial = f[0].toLowerCase();
        const last = l.replace(/\s+/g, '').toLowerCase();
        return `${last}${firstInitial}@timely.com`;
    }, [clientForm.firstName, clientForm.lastName]);

    // Password generation
    const generateStrongPassword = () => {
        const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const lower = 'abcdefghijkmnopqrstuvwxyz';
        const digits = '23456789';
        const symbols = '!@$%^&*?';
        const all = upper + lower + digits + symbols;

        const pick = (s: string) => s[Math.floor(Math.random() * s.length)];

        let pwd = pick(upper) + pick(lower) + pick(digits) + pick(symbols);
        while (pwd.length < 12) {
            pwd += pick(all);
        }

        pwd = pwd.split('').sort(() => Math.random() - 0.5).join('');
        setTempPassword(pwd);
    };

    // ==================== CLIENT CRUD ====================

    const createClient = async () => {
        if (!clientForm.firstName || !clientForm.lastName) {
            alert('Please fill in required fields (First Name, Last Name)');
            return;
        }

        if (!tempPassword) {
            alert('Please generate a temporary password first');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/users-csv`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: clientForm.firstName.trim(),
                    middleName: clientForm.middleName.trim(),
                    lastName: clientForm.lastName.trim(),
                    email: companyEmail,
                    tempPassword: tempPassword,
                    performedBy: 'admin'
                })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to create client');
            }

            const result = await response.json();

            // Save extended data
            const extendedData = localStorage.getItem('timely_clients_extended');
            const extended = extendedData ? JSON.parse(extendedData) : {};

            extended[result.customerId] = {
                phone: clientForm.phone,
                clientType: clientForm.clientType,
                propertyType: clientForm.propertyType,
                budgetMin: clientForm.budgetMin,
                budgetMax: clientForm.budgetMax,
                preferredLocations: clientForm.preferredLocations,
                status: clientForm.status,
                lastContactDate: clientForm.lastContactDate,
                nextFollowUp: clientForm.nextFollowUp,
                notes: clientForm.notes
            };

            localStorage.setItem('timely_clients_extended', JSON.stringify(extended));

            alert(`Client created successfully! (${result.clientCode})`);
            setShowCreateModal(false);
            resetForm();
            loadClients();
        } catch (error: any) {
            console.error('Error creating client:', error);
            alert(error.message || 'Failed to create client');
        } finally {
            setLoading(false);
        }
    };

    const updateClient = () => {
        if (!selectedClient) return;

        const extendedData = localStorage.getItem('timely_clients_extended');
        const extended = extendedData ? JSON.parse(extendedData) : {};

        extended[selectedClient.customerId] = {
            phone: clientForm.phone,
            clientType: clientForm.clientType,
            propertyType: clientForm.propertyType,
            budgetMin: clientForm.budgetMin,
            budgetMax: clientForm.budgetMax,
            preferredLocations: clientForm.preferredLocations,
            status: clientForm.status,
            lastContactDate: clientForm.lastContactDate,
            nextFollowUp: clientForm.nextFollowUp,
            notes: clientForm.notes
        };

        localStorage.setItem('timely_clients_extended', JSON.stringify(extended));

        setShowEditModal(false);
        loadClients();
        alert('Client updated successfully!');
    };

    const deleteClient = async (customerId: string) => {
        if (!confirm('Are you sure you want to delete this client? This will also remove all consultant and project assignments.')) return;

        try {
            const response = await fetch(`${API_BASE}/users-delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    performedBy: 'admin'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to delete client');
            }

            // Remove extended data
            const extendedData = localStorage.getItem('timely_clients_extended');
            if (extendedData) {
                const extended = JSON.parse(extendedData);
                delete extended[customerId];
                localStorage.setItem('timely_clients_extended', JSON.stringify(extended));
            }

            // Remove client projects
            const storedProjects = localStorage.getItem('timely_client_projects');
            if (storedProjects) {
                const cp = JSON.parse(storedProjects);
                const filtered = cp.filter((p: ClientProject) => p.clientId !== customerId);
                localStorage.setItem('timely_client_projects', JSON.stringify(filtered));
            }

            setShowDetailsModal(false);
            setSelectedClient(null);
            loadAllData();
            alert('Client deleted successfully!');
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('Failed to delete client');
        }
    };

    // ==================== CONSULTANT ASSIGNMENTS ====================

    const assignConsultant = async (consultantId: string) => {
        if (!selectedClient) return;

        try {
            const response = await fetch(`${API_BASE}/client-consultants/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: selectedClient.customerId,
                    consultantId,
                    performedBy: 'admin'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to assign consultant');
            }

            loadClientConsultants();
            alert('Consultant assigned successfully!');
        } catch (error) {
            console.error('Error assigning consultant:', error);
            alert('Failed to assign consultant');
        }
    };

    const removeConsultant = (consultantId: string) => {
        if (!selectedClient) return;
        if (!confirm('Remove this consultant from the client?')) return;

        const updated = clientConsultants.filter(
            cc => !(cc.clientId === selectedClient.customerId && cc.consultantId === consultantId)
        );
        setClientConsultants(updated);
        alert('Consultant removed successfully!');
    };

    const getClientConsultants = (clientId: string) => {
        const assignments = clientConsultants.filter(cc => cc.clientId === clientId);
        return assignments.map(a => consultants.find(c => c.consultantId === a.consultantId)).filter(Boolean) as Consultant[];
    };

    const getAvailableConsultants = (clientId: string) => {
        const assigned = clientConsultants.filter(cc => cc.clientId === clientId).map(cc => cc.consultantId);
        return consultants.filter(c => !assigned.includes(c.consultantId));
    };

    // ==================== PROJECT ASSIGNMENTS ====================

    const assignProject = (projectId: string) => {
        if (!selectedClient) return;

        const existing = clientProjects.find(
            cp => cp.clientId === selectedClient.customerId && cp.projectId === projectId
        );

        if (existing) {
            alert('Project already assigned to this client');
            return;
        }

        const newAssignment: ClientProject = {
            clientId: selectedClient.customerId,
            projectId,
            isCurrent: 'true',
            createdAt: new Date().toISOString()
        };

        const updated = [...clientProjects, newAssignment];
        setClientProjects(updated);
        localStorage.setItem('timely_client_projects', JSON.stringify(updated));
        alert('Project assigned successfully!');
    };

    const removeProject = (projectId: string) => {
        if (!selectedClient) return;
        if (!confirm('Remove this project from the client?')) return;

        const updated = clientProjects.filter(
            cp => !(cp.clientId === selectedClient.customerId && cp.projectId === projectId)
        );
        setClientProjects(updated);
        localStorage.setItem('timely_client_projects', JSON.stringify(updated));
        alert('Project removed successfully!');
    };

    const toggleProjectCurrent = (projectId: string) => {
        if (!selectedClient) return;

        const updated = clientProjects.map(cp => {
            if (cp.clientId === selectedClient.customerId && cp.projectId === projectId) {
                return { ...cp, isCurrent: cp.isCurrent === 'true' ? 'false' : 'true' };
            }
            return cp;
        });

        setClientProjects(updated);
        localStorage.setItem('timely_client_projects', JSON.stringify(updated));
    };

    const getClientProjects = (clientId: string) => {
        const assignments = clientProjects.filter(cp => cp.clientId === clientId);
        return assignments.map(a => ({
            ...projects.find(p => p.projectId === a.projectId),
            isCurrent: a.isCurrent
        })).filter(p => p.projectId) as (Project & { isCurrent: string })[];
    };

    const getAvailableProjects = (clientId: string) => {
        const assigned = clientProjects.filter(cp => cp.clientId === clientId).map(cp => cp.projectId);
        return projects.filter(p => !assigned.includes(p.projectId));
    };

    // ==================== HELPERS ====================

    const resetForm = () => {
        setClientForm({
            firstName: '',
            middleName: '',
            lastName: '',
            phone: '',
            clientType: 'buyer',
            propertyType: '',
            budgetMin: '',
            budgetMax: '',
            preferredLocations: '',
            status: 'new_lead',
            lastContactDate: new Date().toISOString().split('T')[0],
            nextFollowUp: '',
            notes: ''
        });
        setTempPassword('');
    };

    const openClientDetails = (client: Client) => {
        setSelectedClient(client);
        setClientForm({
            firstName: client.firstName,
            middleName: client.middleName || '',
            lastName: client.lastName,
            phone: client.phone || '',
            clientType: client.clientType || 'buyer',
            propertyType: client.propertyType || '',
            budgetMin: client.budgetMin || '',
            budgetMax: client.budgetMax || '',
            preferredLocations: client.preferredLocations || '',
            status: client.status || 'new_lead',
            lastContactDate: client.lastContactDate || new Date().toISOString().split('T')[0],
            nextFollowUp: client.nextFollowUp || '',
            notes: client.notes || ''
        });
        setShowDetailsModal(true);
    };

    const openEditModal = () => {
        setShowDetailsModal(false);
        setShowEditModal(true);
    };

    const openConsultantsModal = () => {
        setShowDetailsModal(false);
        setShowConsultantsModal(true);
    };

    const openProjectsModal = () => {
        setShowDetailsModal(false);
        setShowProjectsModal(true);
    };

    // Filtering and sorting
    const filteredClients = useMemo(() => {
        let filtered = clients.filter(client => {
            const matchesSearch =
                `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (client.phone || '').includes(searchTerm) ||
                (client.clientCode || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
            const matchesType = typeFilter === 'all' || client.clientType === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });

        filtered.sort((a, b) => {
            let aVal: any, bVal: any;

            switch (sortConfig.field) {
                case 'name':
                    aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
                    bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
                    break;
                case 'status':
                    aVal = a.status || '';
                    bVal = b.status || '';
                    break;
                case 'customerId':
                default:
                    aVal = Number(a.customerId) || 0;
                    bVal = Number(b.customerId) || 0;
                    break;
            }

            if (sortConfig.direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        return filtered;
    }, [clients, searchTerm, statusFilter, typeFilter, sortConfig]);

    // Stats
    const stats = useMemo(() => ({
        total: clients.length,
        newLeads: clients.filter(c => c.status === 'new_lead').length,
        active: clients.filter(c => ['contacted', 'tour_scheduled', 'offer_made'].includes(c.status || '')).length,
        closed: clients.filter(c => c.status === 'closed').length
    }), [clients]);

    // Display helpers
    const getStatusColor = (status: string) => {
        const colors: { [key: string]: string } = {
            new_lead: 'bg-blue-500',
            contacted: 'bg-cyan-500',
            tour_scheduled: 'bg-amber-500',
            offer_made: 'bg-purple-500',
            closed: 'bg-emerald-500',
            lost: 'bg-gray-500'
        };
        return colors[status] || 'bg-gray-500';
    };

    const getStatusLabel = (status: string) => {
        const labels: { [key: string]: string } = {
            new_lead: 'New Lead',
            contacted: 'Contacted',
            tour_scheduled: 'Tour Scheduled',
            offer_made: 'Offer Made',
            closed: 'Closed',
            lost: 'Lost'
        };
        return labels[status] || status || 'New Lead';
    };

    const getClientTypeIcon = (type: string) => {
        switch (type) {
            case 'buyer': return <Home className="w-4 h-4" />;
            case 'renter': return <Building2 className="w-4 h-4" />;
            case 'seller': return <DollarSign className="w-4 h-4" />;
            case 'investor': return <TrendingUp className="w-4 h-4" />;
            default: return <User className="w-4 h-4" />;
        }
    };

    const getClientTypeLabel = (type: string) => {
        const labels: { [key: string]: string } = {
            buyer: 'Buyer',
            renter: 'Renter',
            seller: 'Seller',
            investor: 'Investor'
        };
        return labels[type] || type || 'Buyer';
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString();
    };

    const formatBudget = (min: string, max: string) => {
        if (!min && !max) return 'Not specified';
        if (min && max) return `$${Number(min).toLocaleString()} - $${Number(max).toLocaleString()}`;
        if (min) return `From $${Number(min).toLocaleString()}`;
        if (max) return `Up to $${Number(max).toLocaleString()}`;
        return 'Not specified';
    };

    const toggleSort = (field: string) => {
        if (sortConfig.field === field) {
            setSortConfig({
                field,
                direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
            });
        } else {
            setSortConfig({ field, direction: 'asc' });
        }
    };

    const getSortIcon = (field: string) => {
        if (sortConfig.field !== field) {
            return <ArrowUpDown className="w-4 h-4 text-slate-500" />;
        }
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-4 h-4 text-cyan-400" />
            : <ArrowDown className="w-4 h-4 text-cyan-400" />;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Background effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
                                Welcome, {userData.name}
                            </h1>
                            <p className="text-slate-400 text-lg">Manage your clients and projects.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 group"
                            >
                                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                Add Client
                            </button>
                            <button
                                onClick={onLogout}
                                className="bg-slate-700 text-white px-6 py-3 rounded-xl hover:bg-slate-600 transition-all"
                            >
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name, email, phone, or client code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all ${showFilters ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                            <Filter className="w-5 h-5" />
                            Filters
                        </button>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="mt-4 p-6 bg-slate-800/50 border border-slate-700 rounded-xl backdrop-blur-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-slate-400 text-sm mb-2 block">Status</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="new_lead">New Lead</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="tour_scheduled">Tour Scheduled</option>
                                        <option value="offer_made">Offer Made</option>
                                        <option value="closed">Closed</option>
                                        <option value="lost">Lost</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-slate-400 text-sm mb-2 block">Client Type</label>
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="buyer">Buyer</option>
                                        <option value="renter">Renter</option>
                                        <option value="seller">Seller</option>
                                        <option value="investor">Investor</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        {[
                            { label: 'Total Clients', value: stats.total, icon: Users, color: 'text-cyan-400' },
                            { label: 'New Leads', value: stats.newLeads, icon: UserPlus, color: 'text-blue-400' },
                            { label: 'Active', value: stats.active, icon: TrendingUp, color: 'text-amber-400' },
                            { label: 'Closed', value: stats.closed, icon: CheckCircle2, color: 'text-emerald-400' }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 backdrop-blur-sm hover:bg-slate-800/70 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-400 text-sm">{stat.label}</span>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <div className="text-3xl font-bold text-white">{stat.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Clients Table */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden backdrop-blur-sm">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-700 bg-slate-800/80">
                        <div
                            className="col-span-3 flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors text-slate-400 text-sm font-medium"
                            onClick={() => toggleSort('name')}
                        >
                            Client {getSortIcon('name')}
                        </div>
                        <div className="col-span-2 text-slate-400 text-sm font-medium">Consultants</div>
                        <div className="col-span-2 text-slate-400 text-sm font-medium">Projects</div>
                        <div
                            className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors text-slate-400 text-sm font-medium"
                            onClick={() => toggleSort('status')}
                        >
                            Status {getSortIcon('status')}
                        </div>
                        <div className="col-span-2 text-slate-400 text-sm font-medium">Type</div>
                        <div className="col-span-1 text-slate-400 text-sm font-medium text-right">Actions</div>
                    </div>

                    {/* Table Body */}
                    {filteredClients.length === 0 ? (
                        <div className="text-center py-16">
                            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 text-lg">No clients found</p>
                            <p className="text-slate-500 text-sm mt-2">Click "Add Client" to create your first client</p>
                        </div>
                    ) : (
                        filteredClients.map((client) => {
                            const clientConsultantsList = getClientConsultants(client.customerId);
                            const clientProjectsList = getClientProjects(client.customerId);

                            return (
                                <div
                                    key={client.customerId}
                                    className="grid grid-cols-12 gap-4 p-4 border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                                    onClick={() => openClientDetails(client)}
                                >
                                    {/* Client Info */}
                                    <div className="col-span-3 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                            {client.firstName?.[0] || '?'}{client.lastName?.[0] || '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-medium truncate">
                                                {client.firstName} {client.lastName}
                                            </p>
                                            <p className="text-slate-500 text-xs">{client.clientCode}</p>
                                        </div>
                                    </div>

                                    {/* Consultants */}
                                    <div className="col-span-2 flex items-center">
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4 text-slate-500" />
                                            <span className="text-slate-300 text-sm">
                                                {clientConsultantsList.length} assigned
                                            </span>
                                        </div>
                                    </div>

                                    {/* Projects */}
                                    <div className="col-span-2 flex items-center">
                                        <div className="flex items-center gap-1">
                                            <FolderOpen className="w-4 h-4 text-slate-500" />
                                            <span className="text-slate-300 text-sm">
                                                {clientProjectsList.length} projects
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-2 flex items-center">
                                        <span className={`${getStatusColor(client.status || 'new_lead')} px-3 py-1 rounded-full text-white text-xs font-medium`}>
                                            {getStatusLabel(client.status || 'new_lead')}
                                        </span>
                                    </div>

                                    {/* Type */}
                                    <div className="col-span-2 flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            {getClientTypeIcon(client.clientType || 'buyer')}
                                            <span className="text-sm">{getClientTypeLabel(client.clientType || 'buyer')}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-1 flex items-center justify-end">
                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ==================== CREATE CLIENT MODAL ==================== */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
                            <h2 className="text-2xl font-bold text-white">Add New Client</h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Personal Info */}
                            <div>
                                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-cyan-400" />
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-slate-300 text-sm mb-2 block">First Name *</label>
                                        <input
                                            type="text"
                                            value={clientForm.firstName}
                                            onChange={(e) => setClientForm({ ...clientForm, firstName: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-300 text-sm mb-2 block">Middle Name</label>
                                        <input
                                            type="text"
                                            value={clientForm.middleName}
                                            onChange={(e) => setClientForm({ ...clientForm, middleName: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-300 text-sm mb-2 block">Last Name *</label>
                                        <input
                                            type="text"
                                            value={clientForm.lastName}
                                            onChange={(e) => setClientForm({ ...clientForm, lastName: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="text-slate-300 text-sm mb-2 block">Company Email (auto-generated)</label>
                                    <div className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-400">
                                        {companyEmail || 'Enter first and last name to generate'}
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="text-slate-300 text-sm mb-2 block">Phone</label>
                                    <input
                                        type="tel"
                                        value={clientForm.phone}
                                        onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>

                            {/* Account Setup */}
                            <div>
                                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-cyan-400" />
                                    Account Setup
                                </h3>
                                <div>
                                    <label className="text-slate-300 text-sm mb-2 block">Temporary Password *</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={tempPassword}
                                            readOnly
                                            placeholder="Click 'Generate' to create password"
                                            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={generateStrongPassword}
                                            className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Status & Type */}
                            <div>
                                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                                    Status & Type
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-slate-300 text-sm mb-2 block">Status</label>
                                        <select
                                            value={clientForm.status}
                                            onChange={(e) => setClientForm({ ...clientForm, status: e.target.value as any })}
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="new_lead">New Lead</option>
                                            <option value="contacted">Contacted</option>
                                            <option value="tour_scheduled">Tour Scheduled</option>
                                            <option value="offer_made">Offer Made</option>
                                            <option value="closed">Closed</option>
                                            <option value="lost">Lost</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-slate-300 text-sm mb-2 block">Client Type</label>
                                        <select
                                            value={clientForm.clientType}
                                            onChange={(e) => setClientForm({ ...clientForm, clientType: e.target.value as any })}
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="buyer">Buyer</option>
                                            <option value="renter">Renter</option>
                                            <option value="seller">Seller</option>
                                            <option value="investor">Investor</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Requirements */}
                            <div>
                                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <Home className="w-5 h-5 text-cyan-400" />
                                    Requirements
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-slate-300 text-sm mb-2 block">Property Type</label>
                                        <select
                                            value={clientForm.propertyType}
                                            onChange={(e) => setClientForm({ ...clientForm, propertyType: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                        >
                                            <option value="">Select Type</option>
                                            <option value="apartment">Apartment</option>
                                            <option value="house">House</option>
                                            <option value="condo">Condo</option>
                                            <option value="townhouse">Townhouse</option>
                                            <option value="commercial">Commercial</option>
                                            <option value="land">Land</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-slate-300 text-sm mb-2 block">Preferred Locations</label>
                                        <input
                                            type="text"
                                            value={clientForm.preferredLocations}
                                            onChange={(e) => setClientForm({ ...clientForm, preferredLocations: e.target.value })}
                                            placeholder="Downtown, Midtown..."
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-300 text-sm mb-2 block">Budget Min ($)</label>
                                        <input
                                            type="number"
                                            value={clientForm.budgetMin}
                                            onChange={(e) => setClientForm({ ...clientForm, budgetMin: e.target.value })}
                                            placeholder="100000"
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-300 text-sm mb-2 block">Budget Max ($)</label>
                                        <input
                                            type="number"
                                            value={clientForm.budgetMax}
                                            onChange={(e) => setClientForm({ ...clientForm, budgetMax: e.target.value })}
                                            placeholder="500000"
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Follow-up */}
                            <div>
                                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-cyan-400" />
                                    Follow-up
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-slate-300 text-sm mb-2 block">Last Contact</label>
                                        <input
                                            type="date"
                                            value={clientForm.lastContactDate}
                                            onChange={(e) => setClientForm({ ...clientForm, lastContactDate: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-slate-300 text-sm mb-2 block">Next Follow-up</label>
                                        <input
                                            type="date"
                                            value={clientForm.nextFollowUp}
                                            onChange={(e) => setClientForm({ ...clientForm, nextFollowUp: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-slate-300 text-sm mb-2 block">Notes</label>
                                <textarea
                                    rows={3}
                                    value={clientForm.notes}
                                    onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                                    placeholder="Additional notes about the client..."
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createClient}
                                    disabled={loading}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Client'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== CLIENT DETAILS MODAL ==================== */}
            {showDetailsModal && selectedClient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                    {selectedClient.firstName?.[0] || '?'}{selectedClient.lastName?.[0] || '?'}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {selectedClient.firstName} {selectedClient.lastName}
                                    </h2>
                                    <p className="text-slate-400">{selectedClient.clientCode} • {selectedClient.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => deleteClient(selectedClient.customerId)}
                                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                    title="Delete Client"
                                >
                                    <Trash2 className="w-5 h-5 text-red-400" />
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedClient(null);
                                    }}
                                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Quick Info */}
                            <div className="flex items-center gap-4 flex-wrap">
                                <span className={`${getStatusColor(selectedClient.status || 'new_lead')} px-4 py-2 rounded-full text-white text-sm font-medium`}>
                                    {getStatusLabel(selectedClient.status || 'new_lead')}
                                </span>
                                <div className="flex items-center gap-2 text-slate-400">
                                    {getClientTypeIcon(selectedClient.clientType || 'buyer')}
                                    <span>{getClientTypeLabel(selectedClient.clientType || 'buyer')}</span>
                                </div>
                                {selectedClient.phone && (
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Phone className="w-4 h-4" />
                                        <span>{selectedClient.phone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    onClick={openEditModal}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                                >
                                    <Edit2 className="w-5 h-5" />
                                    Edit Info
                                </button>
                                <button
                                    onClick={openConsultantsModal}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                                >
                                    <Users className="w-5 h-5" />
                                    Manage Consultants
                                </button>
                                <button
                                    onClick={openProjectsModal}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                                >
                                    <FolderOpen className="w-5 h-5" />
                                    Manage Projects
                                </button>
                            </div>

                            {/* Requirements Summary */}
                            <div className="bg-slate-900/50 rounded-xl p-4">
                                <h3 className="text-slate-400 text-sm mb-3 flex items-center gap-2">
                                    <Home className="w-4 h-4" />
                                    Requirements
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-slate-500 text-xs">Property Type</p>
                                        <p className="text-white capitalize">{selectedClient.propertyType || 'Not specified'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs">Budget Range</p>
                                        <p className="text-white">{formatBudget(selectedClient.budgetMin || '', selectedClient.budgetMax || '')}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-slate-500 text-xs">Preferred Locations</p>
                                        <p className="text-white">{selectedClient.preferredLocations || 'Not specified'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Assigned Consultants Preview */}
                            <div className="bg-slate-900/50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-slate-400 text-sm flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Assigned Consultants
                                    </h3>
                                    <button
                                        onClick={openConsultantsModal}
                                        className="text-cyan-400 text-sm hover:text-cyan-300"
                                    >
                                        Manage
                                    </button>
                                </div>
                                {getClientConsultants(selectedClient.customerId).length === 0 ? (
                                    <p className="text-slate-500 text-sm">No consultants assigned</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {getClientConsultants(selectedClient.customerId).map(c => (
                                            <span key={c.consultantId} className="px-3 py-1 bg-slate-800 rounded-full text-white text-sm">
                                                {c.firstName} {c.lastName}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Assigned Projects Preview */}
                            <div className="bg-slate-900/50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-slate-400 text-sm flex items-center gap-2">
                                        <FolderOpen className="w-4 h-4" />
                                        Assigned Projects
                                    </h3>
                                    <button
                                        onClick={openProjectsModal}
                                        className="text-cyan-400 text-sm hover:text-cyan-300"
                                    >
                                        Manage
                                    </button>
                                </div>
                                {getClientProjects(selectedClient.customerId).length === 0 ? (
                                    <p className="text-slate-500 text-sm">No projects assigned</p>
                                ) : (
                                    <div className="space-y-2">
                                        {getClientProjects(selectedClient.customerId).map(p => (
                                            <div key={p.projectId} className="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-lg">
                                                <span className="text-white text-sm">{p.projectName}</span>
                                                {p.isCurrent === 'true' && (
                                                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded">Current</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            {selectedClient.notes && (
                                <div className="bg-slate-900/50 rounded-xl p-4">
                                    <h3 className="text-slate-400 text-sm mb-3 flex items-center gap-2">
                                        <StickyNote className="w-4 h-4" />
                                        Notes
                                    </h3>
                                    <p className="text-white text-sm">{selectedClient.notes}</p>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="bg-slate-900/50 rounded-xl p-4">
                                <h3 className="text-slate-400 text-sm mb-3 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Timeline
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-slate-500 text-xs">Last Contact</p>
                                        <p className="text-white">{formatDate(selectedClient.lastContactDate || '')}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs">Next Follow-up</p>
                                        <p className="text-white">{formatDate(selectedClient.nextFollowUp || '')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== EDIT CLIENT MODAL ==================== */}
            {showEditModal && selectedClient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
                            <h2 className="text-2xl font-bold text-white">Edit Client Info</h2>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setShowDetailsModal(true);
                                }}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Basic Info (read-only) */}
                            <div className="bg-slate-900/50 rounded-xl p-4">
                                <h3 className="text-slate-400 text-sm mb-3">Account Info (Read-only)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-slate-500 text-xs">Name</p>
                                        <p className="text-white">{selectedClient.firstName} {selectedClient.lastName}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs">Email</p>
                                        <p className="text-white">{selectedClient.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Editable Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-slate-300 text-sm mb-2 block">Phone</label>
                                    <input
                                        type="tel"
                                        value={clientForm.phone}
                                        onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-300 text-sm mb-2 block">Status</label>
                                    <select
                                        value={clientForm.status}
                                        onChange={(e) => setClientForm({ ...clientForm, status: e.target.value as any })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="new_lead">New Lead</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="tour_scheduled">Tour Scheduled</option>
                                        <option value="offer_made">Offer Made</option>
                                        <option value="closed">Closed</option>
                                        <option value="lost">Lost</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-slate-300 text-sm mb-2 block">Client Type</label>
                                    <select
                                        value={clientForm.clientType}
                                        onChange={(e) => setClientForm({ ...clientForm, clientType: e.target.value as any })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="buyer">Buyer</option>
                                        <option value="renter">Renter</option>
                                        <option value="seller">Seller</option>
                                        <option value="investor">Investor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-slate-300 text-sm mb-2 block">Property Type</label>
                                    <select
                                        value={clientForm.propertyType}
                                        onChange={(e) => setClientForm({ ...clientForm, propertyType: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="">Select Type</option>
                                        <option value="apartment">Apartment</option>
                                        <option value="house">House</option>
                                        <option value="condo">Condo</option>
                                        <option value="townhouse">Townhouse</option>
                                        <option value="commercial">Commercial</option>
                                        <option value="land">Land</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-slate-300 text-sm mb-2 block">Budget Min ($)</label>
                                    <input
                                        type="number"
                                        value={clientForm.budgetMin}
                                        onChange={(e) => setClientForm({ ...clientForm, budgetMin: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-300 text-sm mb-2 block">Budget Max ($)</label>
                                    <input
                                        type="number"
                                        value={clientForm.budgetMax}
                                        onChange={(e) => setClientForm({ ...clientForm, budgetMax: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-slate-300 text-sm mb-2 block">Preferred Locations</label>
                                    <input
                                        type="text"
                                        value={clientForm.preferredLocations}
                                        onChange={(e) => setClientForm({ ...clientForm, preferredLocations: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-300 text-sm mb-2 block">Last Contact</label>
                                    <input
                                        type="date"
                                        value={clientForm.lastContactDate}
                                        onChange={(e) => setClientForm({ ...clientForm, lastContactDate: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-300 text-sm mb-2 block">Next Follow-up</label>
                                    <input
                                        type="date"
                                        value={clientForm.nextFollowUp}
                                        onChange={(e) => setClientForm({ ...clientForm, nextFollowUp: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-slate-300 text-sm mb-2 block">Notes</label>
                                    <textarea
                                        rows={3}
                                        value={clientForm.notes}
                                        onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setShowDetailsModal(true);
                                    }}
                                    className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={updateClient}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== MANAGE CONSULTANTS MODAL ==================== */}
            {showConsultantsModal && selectedClient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
                            <h2 className="text-2xl font-bold text-white">Manage Consultants</h2>
                            <button
                                onClick={() => {
                                    setShowConsultantsModal(false);
                                    setShowDetailsModal(true);
                                }}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Assigned Consultants */}
                            <div>
                                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-cyan-400" />
                                    Assigned Consultants
                                </h3>
                                {getClientConsultants(selectedClient.customerId).length === 0 ? (
                                    <p className="text-slate-500 text-sm py-4 text-center">No consultants assigned yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {getClientConsultants(selectedClient.customerId).map(c => (
                                            <div key={c.consultantId} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                        {c.firstName[0]}{c.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">{c.firstName} {c.lastName}</p>
                                                        <p className="text-slate-400 text-sm">{c.email}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeConsultant(c.consultantId)}
                                                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                                    title="Remove Consultant"
                                                >
                                                    <UserMinus className="w-5 h-5 text-red-400" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Available Consultants */}
                            <div>
                                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-cyan-400" />
                                    Add Consultant
                                </h3>
                                {getAvailableConsultants(selectedClient.customerId).length === 0 ? (
                                    <p className="text-slate-500 text-sm py-4 text-center">All consultants are already assigned</p>
                                ) : (
                                    <div className="space-y-2">
                                        {getAvailableConsultants(selectedClient.customerId).map(c => (
                                            <div key={c.consultantId} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                        {c.firstName[0]}{c.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">{c.firstName} {c.lastName}</p>
                                                        <p className="text-slate-400 text-sm">{c.role || 'Consultant'}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => assignConsultant(c.consultantId)}
                                                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors flex items-center gap-2"
                                                >
                                                    <Link2 className="w-4 h-4" />
                                                    Assign
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Back Button */}
                            <div className="pt-4">
                                <button
                                    onClick={() => {
                                        setShowConsultantsModal(false);
                                        setShowDetailsModal(true);
                                    }}
                                    className="w-full px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
                                >
                                    Back to Client Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== MANAGE PROJECTS MODAL ==================== */}
            {showProjectsModal && selectedClient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-700 flex items-center justify-between sticky top-0 bg-slate-800 z-10">
                            <h2 className="text-2xl font-bold text-white">Manage Projects</h2>
                            <button
                                onClick={() => {
                                    setShowProjectsModal(false);
                                    setShowDetailsModal(true);
                                }}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Assigned Projects */}
                            <div>
                                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <FolderOpen className="w-5 h-5 text-cyan-400" />
                                    Assigned Projects
                                </h3>
                                {getClientProjects(selectedClient.customerId).length === 0 ? (
                                    <p className="text-slate-500 text-sm py-4 text-center">No projects assigned yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {getClientProjects(selectedClient.customerId).map(p => (
                                            <div key={p.projectId} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white">
                                                        <FolderOpen className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">{p.projectName}</p>
                                                        <p className="text-slate-400 text-sm">{p.projectCode}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleProjectCurrent(p.projectId)}
                                                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${p.isCurrent === 'true'
                                                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                                            }`}
                                                    >
                                                        {p.isCurrent === 'true' ? 'Current' : 'Set Current'}
                                                    </button>
                                                    <button
                                                        onClick={() => removeProject(p.projectId)}
                                                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                                        title="Remove Project"
                                                    >
                                                        <Unlink className="w-4 h-4 text-red-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Available Projects */}
                            <div>
                                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                    <FolderPlus className="w-5 h-5 text-cyan-400" />
                                    Add Project
                                </h3>
                                {getAvailableProjects(selectedClient.customerId).length === 0 ? (
                                    <p className="text-slate-500 text-sm py-4 text-center">All projects are already assigned or no projects exist</p>
                                ) : (
                                    <div className="space-y-2">
                                        {getAvailableProjects(selectedClient.customerId).map(p => (
                                            <div key={p.projectId} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center text-white">
                                                        <FolderOpen className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">{p.projectName}</p>
                                                        <p className="text-slate-400 text-sm">{p.status || 'No status'}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => assignProject(p.projectId)}
                                                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors flex items-center gap-2"
                                                >
                                                    <Link2 className="w-4 h-4" />
                                                    Assign
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Back Button */}
                            <div className="pt-4">
                                <button
                                    onClick={() => {
                                        setShowProjectsModal(false);
                                        setShowDetailsModal(true);
                                    }}
                                    className="w-full px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
                                >
                                    Back to Client Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientsHomePage;