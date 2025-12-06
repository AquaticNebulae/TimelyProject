import React, { useState, useEffect, useRef } from "react";
import { Menu, Search, Bell, ChevronRight, Settings, LogOut, User, FolderOpen, Home, X, Plus, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { useTheme } from "../Views_Layouts/ThemeContext";

type Project = { projectId: string; projectCode: string; projectName: string; status: string; };
type Props = { sidebarToggle: boolean; setSidebarToggle: (v: boolean) => void; activePage?: string; onNavigate?: (page: string) => void; userName?: string; userEmail?: string; };

const Navbar: React.FC<Props> = ({ sidebarToggle, setSidebarToggle, activePage = "dashboard", onNavigate, userName = "Admin User", userEmail = "admin@timely.com" }) => {
    const { isDark } = useTheme();
    const s = {
        header: isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200',
        text: isDark ? 'text-white' : 'text-gray-900',
        textMuted: isDark ? 'text-slate-400' : 'text-gray-600',
        textSubtle: isDark ? 'text-slate-500' : 'text-gray-400',
        button: isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100',
        dropdown: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-lg',
        dropdownHover: isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50',
        input: isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900',
        divider: isDark ? 'border-slate-700' : 'border-gray-200',
        accent: isDark ? 'text-blue-400' : 'text-blue-600',
        accentBg: isDark ? 'bg-blue-500/10 hover:bg-blue-500/20' : 'bg-blue-50 hover:bg-blue-100',
    };

    const [showSearch, setShowSearch] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showProjectSelector, setShowProjectSelector] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [globalSearchQuery, setGlobalSearchQuery] = useState("");
    const [projects, setProjects] = useState<Project[]>([]);
    const [consultants, setConsultants] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<{ type: string; id: string; name: string; subtitle: string; }[]>([]);

    const searchRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const projectSelectorRef = useRef<HTMLDivElement>(null);

    // Load notifications from audit logs and localStorage
    useEffect(() => {
        const loadNotifications = async () => {
            const stored = localStorage.getItem('timely_notifications_list');
            let notifs: any[] = stored ? JSON.parse(stored) : [];

            // Try to fetch recent audit logs for real notifications
            try {
                const response = await fetch('http://localhost:4000/api/audit-logs/latest?limit=5');
                const data = await response.json();
                if (data.data && data.data.length > 0) {
                    const auditNotifs = data.data.map((log: any, i: number) => ({
                        id: `audit_${log.timestamp}_${i}`,
                        type: log.actionType?.includes('DELETE') ? 'warning' : 'success',
                        message: formatAuditMessage(log),
                        time: formatTime(log.timestamp),
                        read: false
                    }));
                    // Merge with stored, avoiding duplicates
                    auditNotifs.forEach((an: any) => {
                        if (!notifs.find(n => n.id === an.id)) {
                            notifs.unshift(an);
                        }
                    });
                }
            } catch (e) {
                console.log('Could not fetch audit logs for notifications');
            }

            // If still empty, show default welcome notifications
            if (notifs.length === 0) {
                notifs = [
                    { id: 1, type: 'info', message: 'Welcome to Timely!', time: 'Just now', read: false },
                    { id: 2, type: 'info', message: 'Create your first project to get started', time: '1m ago', read: false },
                ];
            }

            setNotifications(notifs.slice(0, 10)); // Keep max 10 notifications
        };
        loadNotifications();
    }, []);

    const formatAuditMessage = (log: any): string => {
        const actions: { [key: string]: string } = {
            'CREATE_PROJECT': `New project created: ${log.details || log.entityId}`,
            'DELETE_PROJECT': `Project deleted: ${log.details || log.entityId}`,
            'CREATE_CLIENT': `New client added: ${log.details || log.entityId}`,
            'CREATE_CONSULTANT': `New consultant added: ${log.details || log.entityId}`,
            'LOG_HOURS': `Hours logged: ${log.details || 'Time entry added'}`,
            'ASSIGN_PROJECT': `Project assigned: ${log.details || log.entityId}`,
            'ASSIGN_CONSULTANT': `Consultant assigned: ${log.details || log.entityId}`,
        };
        return actions[log.actionType] || log.details || 'Activity recorded';
    };

    const formatTime = (timestamp: string): string => {
        if (!timestamp) return 'Just now';
        const diff = Date.now() - new Date(timestamp).getTime();
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        if (hrs < 24) return `${hrs}h ago`;
        return `${days}d ago`;
    };

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const response = await fetch('http://localhost:4000/api/projects');
                const data = await response.json();
                const localProjects = JSON.parse(localStorage.getItem('timely_projects') || '[]');
                if (data.data) {
                    const merged = [...data.data];
                    localProjects.forEach((lp: Project) => {
                        if (!merged.find((p: Project) => p.projectId === lp.projectId)) {
                            merged.push(lp);
                        }
                    });
                    setProjects(merged);
                } else {
                    setProjects(localProjects);
                }
            } catch {
                const stored = localStorage.getItem('timely_projects');
                if (stored) setProjects(JSON.parse(stored));
            }
        };

        const loadConsultants = async () => {
            try {
                const response = await fetch('http://localhost:4000/api/consultants');
                const data = await response.json();
                if (data.data) setConsultants(data.data);
            } catch {
                console.log('Could not load consultants');
            }
        };

        const loadClients = async () => {
            try {
                const response = await fetch('http://localhost:4000/api/users-report');
                const data = await response.json();
                if (data.data) setClients(data.data);
            } catch {
                console.log('Could not load clients');
            }
        };

        loadProjects();
        loadConsultants();
        loadClients();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false);
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setShowUserMenu(false);
            if (projectSelectorRef.current && !projectSelectorRef.current.contains(event.target as Node)) setShowProjectSelector(false);
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSearch(false);
                setGlobalSearchQuery('');
                setSearchResults([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => { if (showSearch && searchRef.current) searchRef.current.focus(); }, [showSearch]);

    // Global search functionality
    useEffect(() => {
        if (!globalSearchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const query = globalSearchQuery.toLowerCase();
        const results: { type: string; id: string; name: string; subtitle: string; }[] = [];

        // Search projects
        projects.forEach(p => {
            if (p.projectName.toLowerCase().includes(query) || (p.projectCode || '').toLowerCase().includes(query)) {
                results.push({ type: 'project', id: p.projectId, name: p.projectName, subtitle: p.projectCode || 'Project' });
            }
        });

        // Search consultants
        consultants.forEach(c => {
            const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
            if (fullName.includes(query) || (c.email || '').toLowerCase().includes(query) || (c.consultantCode || '').toLowerCase().includes(query)) {
                results.push({ type: 'consultant', id: c.consultantId, name: `${c.firstName} ${c.lastName}`, subtitle: c.email || c.consultantCode || 'Consultant' });
            }
        });

        // Search clients
        clients.forEach(c => {
            const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
            if (fullName.includes(query) || (c.email || '').toLowerCase().includes(query) || (c.clientCode || '').toLowerCase().includes(query)) {
                results.push({ type: 'client', id: c.customerId, name: `${c.firstName} ${c.lastName}`, subtitle: c.email || c.clientCode || 'Client' });
            }
        });

        // Search pages
        const pages = [
            { name: 'Dashboard', id: 'dashboard', subtitle: 'Home page' },
            { name: 'Projects', id: 'projects', subtitle: 'Manage projects' },
            { name: 'Clients', id: 'client', subtitle: 'Manage clients' },
            { name: 'Consultants', id: 'consultants', subtitle: 'Manage consultants' },
            { name: 'Hours', id: 'hours', subtitle: 'Time tracking' },
            { name: 'Settings', id: 'settings', subtitle: 'App settings' },
            { name: 'Create Account', id: 'EmailGenerator', subtitle: 'Generate invites' },
        ];
        pages.forEach(p => {
            if (p.name.toLowerCase().includes(query)) {
                results.push({ type: 'page', id: p.id, name: p.name, subtitle: p.subtitle });
            }
        });

        setSearchResults(results.slice(0, 10)); // Limit to 10 results
    }, [globalSearchQuery, projects, consultants, clients]);

    const handleSearchResultClick = (result: { type: string; id: string; name: string; }) => {
        setShowSearch(false);
        setGlobalSearchQuery('');
        setSearchResults([]);

        if (result.type === 'page') {
            onNavigate?.(result.id);
        } else if (result.type === 'project') {
            onNavigate?.('projects');
        } else if (result.type === 'consultant') {
            onNavigate?.('consultants');
        } else if (result.type === 'client') {
            onNavigate?.('client');
        }
    };

    const getSearchResultIcon = (type: string) => {
        switch (type) {
            case 'project': return <FolderOpen className="w-4 h-4 text-amber-500" />;
            case 'consultant': return <User className="w-4 h-4 text-blue-500" />;
            case 'client': return <User className="w-4 h-4 text-emerald-500" />;
            case 'page': return <Home className="w-4 h-4 text-purple-500" />;
            default: return <Search className="w-4 h-4" />;
        }
    };

    const getPageInfo = (page: string) => {
        const pages: { [key: string]: { title: string; icon: React.ReactNode } } = {
            dashboard: { title: 'Dashboard', icon: <Home className="w-4 h-4" /> },
            projects: { title: 'Projects', icon: <FolderOpen className="w-4 h-4" /> },
            client: { title: 'Clients', icon: <User className="w-4 h-4" /> },
            consultants: { title: 'Consultants', icon: <User className="w-4 h-4" /> },
            reports: { title: 'Reports', icon: <FolderOpen className="w-4 h-4" /> },
            admin: { title: 'Admin Panel', icon: <Settings className="w-4 h-4" /> },
            hours: { title: 'Hours', icon: <Clock className="w-4 h-4" /> },
            settings: { title: 'Settings', icon: <Settings className="w-4 h-4" /> },
            EmailGenerator: { title: 'Create Account', icon: <User className="w-4 h-4" /> },
        };
        return pages[page] || { title: page, icon: <Home className="w-4 h-4" /> };
    };

    const pageInfo = getPageInfo(activePage);
    const unreadNotifications = notifications.filter((n: any) => !n.read).length;

    const markAllAsRead = () => {
        const updated = notifications.map((n: any) => ({ ...n, read: true }));
        setNotifications(updated);
        localStorage.setItem('timely_notifications_list', JSON.stringify(updated));
    };

    const getNotificationIcon = (type: string) => {
        if (type === 'success') return <CheckCircle className="w-4 h-4 text-emerald-500" />;
        if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
        return <Bell className={`w-4 h-4 ${s.accent}`} />;
    };

    const filteredProjects = projects.filter(p => p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || p.projectCode?.toLowerCase().includes(searchQuery.toLowerCase()));
    const getUserInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <header className={`fixed top-0 right-0 z-30 ${s.header} border-b transition-all duration-300 ${sidebarToggle ? "left-0" : "left-72"}`}>
            <nav className="flex items-center justify-between px-6 py-3">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                    <button className={`p-2 ${s.button} rounded-lg transition-colors`} onClick={() => setSidebarToggle(!sidebarToggle)}>
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm">
                        <button onClick={() => onNavigate?.('dashboard')} className={`${s.textMuted} hover:text-blue-500 transition-colors`}>
                            <Home className="w-4 h-4" />
                        </button>
                        <ChevronRight className={`w-3 h-3 ${s.textSubtle}`} />
                        <span className={`${s.text} font-medium flex items-center gap-2`}>
                            <span className={s.accent}>{pageInfo.icon}</span>
                            {pageInfo.title}
                        </span>

                        {/* Project Selector */}
                        {(activePage === 'projects' || selectedProject) && (
                            <>
                                <ChevronRight className={`w-3 h-3 ${s.textSubtle}`} />
                                <div className="relative" ref={projectSelectorRef}>
                                    <button onClick={() => setShowProjectSelector(!showProjectSelector)} className={`flex items-center gap-2 px-3 py-1.5 ${s.button} rounded-lg transition-colors border ${s.divider}`}>
                                        <FolderOpen className={`w-3 h-3 ${s.accent}`} />
                                        <span className="max-w-32 truncate">{selectedProject?.projectName || 'Select Project'}</span>
                                        <ChevronRight className={`w-3 h-3 transition-transform ${showProjectSelector ? 'rotate-90' : ''}`} />
                                    </button>

                                    {showProjectSelector && (
                                        <div className={`absolute top-full left-0 mt-2 w-72 ${s.dropdown} border rounded-xl overflow-hidden z-50`}>
                                            <div className={`p-3 border-b ${s.divider}`}>
                                                <div className="relative">
                                                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${s.textMuted} w-4 h-4`} />
                                                    <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-10 pr-4 py-2 ${s.input} border rounded-lg text-sm focus:outline-none focus:border-blue-500`} />
                                                </div>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto">
                                                {filteredProjects.length === 0 ? (
                                                    <div className={`p-4 text-center ${s.textMuted} text-sm`}>No projects found</div>
                                                ) : (
                                                    filteredProjects.map(project => (
                                                        <button key={project.projectId} onClick={() => { setSelectedProject(project); setShowProjectSelector(false); }} className={`w-full px-4 py-3 flex items-center gap-3 ${s.dropdownHover} transition-colors text-left ${selectedProject?.projectId === project.projectId ? (isDark ? 'bg-slate-700 border-l-2 border-blue-500' : 'bg-blue-50 border-l-2 border-blue-500') : ''}`}>
                                                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                                                <FolderOpen className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`${s.text} text-sm font-medium truncate`}>{project.projectName}</p>
                                                                <p className={`${s.textMuted} text-xs`}>{project.projectCode}</p>
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                            <div className={`p-2 border-t ${s.divider}`}>
                                                <button onClick={() => { setShowProjectSelector(false); onNavigate?.('projects'); }} className={`w-full px-4 py-2 flex items-center gap-2 ${s.accent} ${s.accentBg} rounded-lg transition-colors text-sm font-medium`}>
                                                    <Plus className="w-4 h-4" />
                                                    Create New Project
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative" ref={searchContainerRef}>
                        {showSearch ? (
                            <div className="relative">
                                <div className={`flex items-center gap-2 ${s.dropdown} rounded-lg border px-3 py-2`}>
                                    <Search className={`${s.accent} w-4 h-4`} />
                                    <input
                                        ref={searchRef}
                                        type="text"
                                        placeholder="Search projects, people, pages..."
                                        value={globalSearchQuery}
                                        onChange={(e) => setGlobalSearchQuery(e.target.value)}
                                        className={`w-64 bg-transparent ${s.text} text-sm focus:outline-none`}
                                    />
                                    <button onClick={() => { setShowSearch(false); setGlobalSearchQuery(''); setSearchResults([]); }} className={`${s.textMuted} hover:${s.text} transition-colors`}>
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                {/* Search Results Dropdown */}
                                {searchResults.length > 0 && (
                                    <div className={`absolute top-full left-0 right-0 mt-2 ${s.dropdown} border rounded-xl overflow-hidden z-50`}>
                                        <div className="max-h-80 overflow-y-auto">
                                            {searchResults.map((result, i) => (
                                                <button
                                                    key={`${result.type}_${result.id}_${i}`}
                                                    onClick={() => handleSearchResultClick(result)}
                                                    className={`w-full px-4 py-3 flex items-center gap-3 ${s.dropdownHover} transition-colors text-left`}
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                                                        {getSearchResultIcon(result.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`${s.text} text-sm font-medium truncate`}>{result.name}</p>
                                                        <p className={`${s.textMuted} text-xs`}>{result.subtitle}</p>
                                                    </div>
                                                    <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                                                        {result.type}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* No Results */}
                                {globalSearchQuery.trim() && searchResults.length === 0 && (
                                    <div className={`absolute top-full left-0 right-0 mt-2 ${s.dropdown} border rounded-xl overflow-hidden z-50`}>
                                        <div className={`p-4 text-center ${s.textMuted} text-sm`}>
                                            No results found for "{globalSearchQuery}"
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button onClick={() => setShowSearch(true)} className={`p-2.5 ${s.button} rounded-lg transition-colors`}>
                                <Search className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Notifications */}
                    <div className="relative" ref={notificationRef}>
                        <button onClick={() => setShowNotifications(!showNotifications)} className={`relative p-2.5 ${s.button} rounded-lg transition-colors`}>
                            <Bell className="w-5 h-5" />
                            {unreadNotifications > 0 && (
                                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-medium">{unreadNotifications}</span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className={`absolute right-0 top-full mt-2 w-80 ${s.dropdown} border rounded-xl overflow-hidden z-50`}>
                                <div className={`px-4 py-3 border-b ${s.divider} flex items-center justify-between`}>
                                    <h3 className={`${s.text} font-semibold`}>Notifications</h3>
                                    {unreadNotifications > 0 && (
                                        <button onClick={markAllAsRead} className={`${s.accent} text-sm font-medium`}>Mark all as read</button>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.map((notification: any) => (
                                        <div key={notification.id} className={`px-4 py-3 flex items-start gap-3 ${s.dropdownHover} transition-colors border-l-2 ${notification.read ? 'border-transparent' : 'border-blue-500 ' + (isDark ? 'bg-blue-500/5' : 'bg-blue-50')}`}>
                                            <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${notification.read ? s.textMuted : s.text}`}>{notification.message}</p>
                                                <p className={`text-xs ${s.textSubtle} mt-1`}>{notification.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`w-px h-8 bg-slate-700 mx-2`} style={{ backgroundColor: isDark ? '#334155' : '#e5e7eb' }} />

                    {/* User Menu */}
                    <div className="relative" ref={userMenuRef}>
                        <button onClick={() => setShowUserMenu(!showUserMenu)} className={`flex items-center gap-3 px-3 py-2 ${s.dropdownHover} rounded-lg transition-colors`}>
                            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">{getUserInitials(userName)}</div>
                            <div className="hidden md:block text-left">
                                <p className={`${s.text} text-sm font-medium`}>{userName}</p>
                                <p className={`${s.textMuted} text-xs`}>{userEmail}</p>
                            </div>
                        </button>

                        {showUserMenu && (
                            <div className={`absolute right-0 top-full mt-2 w-56 ${s.dropdown} border rounded-xl overflow-hidden z-50`}>
                                <div className={`px-4 py-3 border-b ${s.divider}`}>
                                    <p className={`${s.text} font-medium`}>{userName}</p>
                                    <p className={`${s.textMuted} text-sm`}>{userEmail}</p>
                                </div>
                                <div className="py-2">
                                    <button onClick={() => { setShowUserMenu(false); onNavigate?.('settings'); }} className={`w-full px-4 py-2.5 flex items-center gap-3 ${s.dropdownHover} ${s.textMuted} transition-colors`}>
                                        <User className="w-4 h-4" /><span className="text-sm">Profile</span>
                                    </button>
                                    <button onClick={() => { setShowUserMenu(false); onNavigate?.('settings'); }} className={`w-full px-4 py-2.5 flex items-center gap-3 ${s.dropdownHover} ${s.textMuted} transition-colors`}>
                                        <Settings className="w-4 h-4" /><span className="text-sm">Settings</span>
                                    </button>
                                </div>
                                <div className={`py-2 border-t ${s.divider}`}>
                                    <button onClick={() => { setShowUserMenu(false); onNavigate?.('logout'); }} className={`w-full px-4 py-2.5 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors`}>
                                        <LogOut className="w-4 h-4" /><span className="text-sm">Logout</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;