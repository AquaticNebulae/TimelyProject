// src/Style_Components/Dashboard.tsx
// not fully functional waiting for jeter and vlad
// not tested
// might be some errors 
// not connectect to database
import React, { useState, useMemo } from "react";
import Navbar from "./Navbar";
import {
    FaEye, FaFileAlt, FaProjectDiagram, FaUsers, FaExclamationTriangle,
    FaHeart, FaRetweet, FaComment, FaShare, FaPhoneAlt, FaFolder,
    FaBell, FaClock, FaCalendarAlt, FaCalendarCheck, FaHistory,
    FaFileUpload, FaUserPlus, FaEdit, FaCheckCircle, FaExclamationCircle,
    FaChevronLeft, FaChevronRight, FaExpand, FaCompress
} from "react-icons/fa";

type Props = { sidebarToggle: boolean; setSidebarToggle: (v: boolean) => void; };

interface Comment {
    id: number; author: string; avatar: string; content: string;
    timestamp: string; likes: number; retweets: number; replies: number;
}

interface Alert {
    id: number;
    type: "meeting" | "deadline" | "status" | "overdue" | "upload";
    message: string;
    time: string;
    icon: any;
    color: string;
}

interface CalendarEvent {
    id: number;
    title: string;
    time: string;
    type: "meeting" | "deadline" | "task";
}

interface ActivityLog {
    id: number;
    user: string;
    action: string;
    target: string;
    timestamp: string;
    icon: any;
    color: string;
}

// holidays // might remove later
const getAmericanHolidays = (year: number): { [key: string]: string } => {
    const holidays: { [key: string]: string } = {
        [`${year}-01-01`]: "New Year's Day",
        [`${year}-07-04`]: "Independence Day",
        [`${year}-12-25`]: "Christmas Day",
        [`${year}-11-11`]: "Veterans Day",
    };

    // Martin Luther King Jr. Day (3rd Monday of January)
    const mlkDay = getNthWeekdayOfMonth(year, 0, 1, 3);
    holidays[mlkDay] = "Martin Luther King Jr. Day";

    // Presidents' Day (3rd Monday of February)
    const presidentsDay = getNthWeekdayOfMonth(year, 1, 1, 3);
    holidays[presidentsDay] = "Presidents' Day";

    // Memorial Day (Last Monday of May)
    const memorialDay = getLastWeekdayOfMonth(year, 4, 1);
    holidays[memorialDay] = "Memorial Day";

    // Labor Day (1st Monday of September)
    const laborDay = getNthWeekdayOfMonth(year, 8, 1, 1);
    holidays[laborDay] = "Labor Day";

    // Thanksgiving (4th Thursday of November)
    const thanksgiving = getNthWeekdayOfMonth(year, 10, 4, 4);
    holidays[thanksgiving] = "Thanksgiving";

    return holidays;
};

// Helper: Get nth weekday of month (e.g., 3rd Monday)
const getNthWeekdayOfMonth = (year: number, month: number, weekday: number, n: number): string => {
    let count = 0;
    let date = new Date(year, month, 1);

    while (count < n) {
        if (date.getDay() === weekday) {
            count++;
            if (count === n) break;
        }
        date.setDate(date.getDate() + 1);
    }

    return `${year}-${String(month + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Helper: Get last weekday of month
const getLastWeekdayOfMonth = (year: number, month: number, weekday: number): string => {
    let date = new Date(year, month + 1, 0); // Last day of month

    while (date.getDay() !== weekday) {
        date.setDate(date.getDate() - 1);
    }

    return `${year}-${String(month + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const Dashboard: React.FC<Props> = ({ sidebarToggle, setSidebarToggle }) => {
    const [newComment, setNewComment] = useState("");
    const [comments, setComments] = useState<Comment[]>([]); // TODO: Replace with database fetch
    const customerName = "XYZ"; // TODO: Replace with actual customer name
    const projectProgress = 0; // TODO: Fetch from database
    const criticalNextStep = "No active projects";

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);

    // TODO: Fetch alerts from database
    const [alerts] = useState<Alert[]>([]);

    // TODO: Fetch calendar events from database
    const [calendarEvents] = useState<CalendarEvent[]>([]);

    // TODO: Fetch activity logs from database
    const [activityLogs] = useState<ActivityLog[]>([]);

    // Get holidays for current year
    const holidays = useMemo(() => {
        return getAmericanHolidays(currentDate.getFullYear());
    }, [currentDate]);

    // Get current week (Sunday to Saturday)
    const getCurrentWeek = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const week = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - dayOfWeek + i);
            week.push(date);
        }

        return week;
    };

    const currentWeek = useMemo(() => getCurrentWeek(), []);

    // Generate calendar days for expanded view
    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const firstDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const days = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const calendarDays = useMemo(() => generateCalendarDays(), [currentDate]);

    const isToday = (date: Date | number | null) => {
        const today = new Date();
        if (date instanceof Date) {
            return (
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear()
            );
        }
        if (typeof date === 'number') {
            return (
                date === today.getDate() &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getFullYear() === today.getFullYear()
            );
        }
        return false;
    };

    const isSelected = (day: number | null) => {
        if (!day) return false;
        return (
            day === selectedDate.getDate() &&
            currentDate.getMonth() === selectedDate.getMonth() &&
            currentDate.getFullYear() === selectedDate.getFullYear()
        );
    };

    const isHoliday = (date: Date | number | null) => {
        if (date instanceof Date) {
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            return holidays[dateStr];
        }
        if (typeof date === 'number') {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
            return holidays[dateStr];
        }
        return false;
    };

    const getHolidayName = (date: Date | number | null) => {
        if (date instanceof Date) {
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            return holidays[dateStr];
        }
        if (typeof date === 'number') {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
            return holidays[dateStr];
        }
        return null;
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDayClick = (day: number | null) => {
        if (day) {
            setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
        }
    };

    const handleWeekDayClick = (date: Date) => {
        setSelectedDate(date);
        setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
    };

    const actionCard =
        "flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800/80 px-5 py-5 hover:border-blue-500 hover:bg-gray-800 transition cursor-pointer";

    const smallCard =
        "rounded-xl border border-gray-700 bg-gray-800/80 px-4 py-3 hover:border-blue-500 hover:bg-gray-800 transition cursor-pointer";

    const handlePostComment = () => {
        if (!newComment.trim()) return;
        const comment: Comment = {
            id: comments.length + 1,
            author: customerName,
            avatar: customerName.substring(0, 2).toUpperCase(),
            content: newComment,
            timestamp: "Just now",
            likes: 0,
            retweets: 0,
            replies: 0,
        };
        setComments([comment, ...comments]); // TODO: Save to database via API
        setNewComment("");
    };

    const handleLike = (id: number) =>
        setComments(
            comments.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c))
        ); // TODO: Update like count

    const handleRetweet = (id: number) =>
        setComments(
            comments.map((c) =>
                c.id === id ? { ...c, retweets: c.retweets + 1 } : c
            )
        ); // TODO: Update retweet count

    return (
        <>
            <Navbar sidebarToggle={sidebarToggle} setSidebarToggle={setSidebarToggle} />

            {/* main content pushed under navbar */}
            <div className="pt-16 px-6 pb-10 bg-gray-900 min-h-screen text-white">
                {/* Page header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Welcome {customerName}</h1>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className={actionCard}>
                        <div>
                            <p className="text-sm text-gray-400">Projects</p>
                            <h2 className="text-lg font-semibold">View Projects</h2>
                            <p className="text-xs text-gray-400 mt-1">Browse all active and completed projects.</p>
                        </div>
                        <FaEye className="h-8 w-8 text-blue-400" />
                    </div>

                    <div className={actionCard}>
                        <div>
                            <p className="text-sm text-gray-400">Analytics</p>
                            <h2 className="text-lg font-semibold">Reports</h2>
                            <p className="text-xs text-gray-400 mt-1">Generate project, time, and financial reports.</p>
                        </div>
                        <FaFileAlt className="h-8 w-8 text-purple-400" />
                    </div>

                    <div className={actionCard}>
                        <div>
                            <p className="text-sm text-gray-400">Meetings</p>
                            <h2 className="text-lg font-semibold">Schedule Call</h2>
                            <p className="text-xs text-gray-400 mt-1">Book a meeting with clients or team members.</p>
                        </div>
                        <FaPhoneAlt className="h-8 w-8 text-emerald-400" />
                    </div>
                </div>

                {/* alerts */}
                <section className="mt-8">
                    <h2 className="text-lg font-semibold mb-3">Alerts & Notifications</h2>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {/* TODO: Connect to database for real alerts */}
                        {alerts.length === 0 ? (
                            <div className="col-span-full rounded-xl border border-gray-700 bg-gray-800/80 p-6 text-center">
                                <FaBell className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">No alerts at this time</p>
                            </div>
                        ) : (
                            alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className="rounded-xl border border-gray-700 bg-gray-800/80 p-4 hover:bg-gray-800 transition cursor-pointer"
                                >
                                    <div className="flex items-start gap-3">
                                        <alert.icon className={`h-5 w-5 ${alert.color} mt-0.5 flex-shrink-0`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-200">{alert.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* calendar */}
                <section className="mt-8">
                    <h2 className="text-lg font-semibold mb-3">My Calendar</h2>

                    <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-4">
                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <FaCalendarAlt className="h-4 w-4 text-blue-400" />
                                <h3 className="text-sm font-medium">
                                    {isCalendarExpanded
                                        ? currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                                        : `This Week`
                                    }
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {isCalendarExpanded && (
                                    <>
                                        <button
                                            onClick={previousMonth}
                                            className="p-1.5 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition"
                                        >
                                            <FaChevronLeft className="h-3 w-3" />
                                        </button>
                                        <button
                                            onClick={nextMonth}
                                            className="p-1.5 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition"
                                        >
                                            <FaChevronRight className="h-3 w-3" />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                                    className="p-1.5 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition"
                                    title={isCalendarExpanded ? "Collapse" : "Expand"}
                                >
                                    {isCalendarExpanded ? (
                                        <FaCompress className="h-3 w-3" />
                                    ) : (
                                        <FaExpand className="h-3 w-3" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Compact Week View */}
                        {!isCalendarExpanded && (
                            <div className="grid grid-cols-7 gap-2">
                                {currentWeek.map((date, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleWeekDayClick(date)}
                                        className={`
                                            relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm cursor-pointer transition
                                            ${isToday(date) ? 'bg-blue-500 text-white font-bold' : 'bg-gray-900/50 hover:bg-gray-700'}
                                        `}
                                        title={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    >
                                        <span className="text-xs text-gray-400 mb-1">
                                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </span>
                                        <span className={isToday(date) ? 'text-white' : ''}>
                                            {date.getDate()}
                                        </span>
                                        {/* Red dot for holidays */}
                                        {isHoliday(date) && (
                                            <div className="absolute bottom-1">
                                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* expand */}
                        {isCalendarExpanded && (
                            <div>
                                <div className="grid grid-cols-7 gap-2 mb-2">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                        <div key={day} className="text-center text-xs font-medium text-gray-400 py-2">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar days */}
                                <div className="grid grid-cols-7 gap-2 mb-4">
                                    {calendarDays.map((day, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleDayClick(day)}
                                            className={`
                                                relative aspect-square flex items-center justify-center rounded-lg text-sm
                                                ${day ? 'cursor-pointer hover:bg-gray-700' : ''}
                                                ${isToday(day) ? 'bg-blue-500 text-white font-bold' : 'bg-gray-900/50'}
                                                ${isSelected(day) && !isToday(day) ? 'bg-gray-700 border border-blue-400' : ''}
                                                ${!day ? 'cursor-default' : ''}
                                                transition
                                            `}
                                            title={day ? getHolidayName(day) || '' : ''}
                                        >
                                            {day}
                                            {/* Red dot for holidays */}
                                            {isHoliday(day) && (
                                                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Selected Date Info */}
                                <div className="pt-4 border-t border-gray-700">
                                    <p className="text-sm text-gray-400 mb-3">
                                        Selected: {selectedDate.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                        {getHolidayName(selectedDate.getDate()) && (
                                            <span className="ml-2 text-red-400 font-medium">
                                                • {getHolidayName(selectedDate.getDate())}
                                            </span>
                                        )}
                                    </p>

                                    {/* TODO: Connect to database for calendar events */}
                                    <div className="space-y-2">
                                        {calendarEvents.length === 0 ? (
                                            <div className="text-center py-4">
                                                <p className="text-xs text-gray-400">No events scheduled for this day</p>
                                            </div>
                                        ) : (
                                            calendarEvents.map((event) => (
                                                <div
                                                    key={event.id}
                                                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition"
                                                >
                                                    <div className="flex-shrink-0 w-10 text-center">
                                                        <p className="text-xs text-gray-400">{event.time}</p>
                                                    </div>
                                                    <div className="h-6 w-1 bg-blue-500 rounded-full flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-xs font-medium">{event.title}</p>
                                                        <p className="text-xs text-gray-400 capitalize">{event.type}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* timeline */}
                <section className="mt-8">
                    <h2 className="text-lg font-semibold mb-3">Timeline</h2>
                    <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-6">
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Overall Progress</span>
                                <span className="text-sm text-gray-400">{projectProgress}%</span>
                            </div>
                            {/* TODO: Connect to database */}
                            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-500"
                                    style={{ width: `${projectProgress}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3 mt-4 p-4 bg-gray-900/50 rounded-lg">
                            <FaExclamationTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-amber-400">Critical Next Step</p>
                                <p className="text-sm text-gray-300 mt-1">{criticalNextStep}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* activity */}
                <section className="mt-8">
                    <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>

                    <div className="rounded-xl border border-gray-700 bg-gray-800/80 p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <FaHistory className="h-4 w-4 text-gray-400" />
                            <p className="text-sm text-gray-400">System Activity Log</p>
                        </div>

                        {/* TODO: Connect to database for activity logs */}
                        <div className="space-y-3">
                            {activityLogs.length === 0 ? (
                                <div className="text-center py-8">
                                    <FaHistory className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400">No recent activity</p>
                                </div>
                            ) : (
                                activityLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition"
                                    >
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${log.color} bg-opacity-20 flex items-center justify-center`}>
                                            <log.icon className={`h-4 w-4 ${log.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm">
                                                <span className="font-medium text-gray-200">{log.user}</span>
                                                <span className="text-gray-400"> {log.action} </span>
                                                <span className="font-medium text-gray-200">{log.target}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">{log.timestamp}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* Easy section */}
                <section className="mt-8">
                    <h2 className="text-lg font-semibold mb-3">Quick Access</h2>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className={smallCard}>
                            <div className="flex items-center justify-between mb-2">
                                <FaComment className="h-5 w-5 text-blue-400" />
                                <span className="text-xl font-bold">0</span>
                            </div>
                            <p className="text-sm font-medium">Unread Comments</p>
                            <p className="text-xs text-gray-400 mt-1">New messages waiting</p>
                        </div>

                        <div className={smallCard}>
                            <div className="flex items-center justify-between mb-2">
                                <FaFolder className="h-5 w-5 text-purple-400" />
                                <span className="text-xl font-bold">0</span>
                            </div>
                            <p className="text-sm font-medium">Reports & Docs</p>
                            <p className="text-xs text-gray-400 mt-1">Quick access to files</p>
                        </div>

                        <div className={smallCard}>
                            <div className="flex items-center justify-between mb-2">
                                <FaUsers className="h-5 w-5 text-emerald-400" />
                                <span className="text-xl font-bold">0</span>
                            </div>
                            <p className="text-sm font-medium">Active Team</p>
                            <p className="text-xs text-gray-400 mt-1">Members online now</p>
                        </div>

                        <div className={smallCard}>
                            <div className="flex items-center justify-between mb-2">
                                <FaProjectDiagram className="h-5 w-5 text-pink-400" />
                                <span className="text-xl font-bold">0</span>
                            </div>
                            <p className="text-sm font-medium">Active Projects</p>
                            <p className="text-xs text-gray-400 mt-1">In progress now</p>
                        </div>
                    </div>
                </section>

                {/* TODO: Change to SMS-style interface later */}
                <section className="mt-8">
                    <h2 className="text-lg font-semibold mb-3">Team Feed</h2>

                    <div className="rounded-xl border border-gray-700 bg-gray-800/80 overflow-hidden">
                        {/* Post Input */}
                        <div className="p-4 border-b border-gray-700">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold">
                                    {customerName.substring(0, 2).toUpperCase()}
                                </div>

                                <div className="flex-1">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="What's happening?"
                                        className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none text-sm"
                                        rows={3}
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button
                                            onClick={handlePostComment}
                                            disabled={!newComment.trim()}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            Post
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Comments Feed */}
                        <div className="divide-y divide-gray-700">
                            {comments.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <p className="text-sm">No posts yet. Be the first to share!</p>
                                </div>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className="p-4 hover:bg-gray-800/50 transition">
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-sm font-semibold">
                                                {comment.avatar}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm">{comment.author}</span>
                                                    <span className="text-gray-500 text-xs">{comment.timestamp}</span>
                                                </div>

                                                <p className="text-sm mt-1 text-gray-200">{comment.content}</p>

                                                <div className="flex items-center gap-6 mt-3">
                                                    <button className="flex items-center gap-2 text-gray-500 hover:text-blue-400 transition">
                                                        <FaComment className="h-4 w-4" />
                                                        <span className="text-xs">{comment.replies}</span>
                                                    </button>

                                                    <button
                                                        onClick={() => handleRetweet(comment.id)}
                                                        className="flex items-center gap-2 text-gray-500 hover:text-green-400 transition"
                                                    >
                                                        <FaRetweet className="h-4 w-4" />
                                                        <span className="text-xs">{comment.retweets}</span>
                                                    </button>

                                                    <button
                                                        onClick={() => handleLike(comment.id)}
                                                        className="flex items-center gap-2 text-gray-500 hover:text-pink-400 transition"
                                                    >
                                                        <FaHeart className="h-4 w-4" />
                                                        <span className="text-xs">{comment.likes}</span>
                                                    </button>

                                                    <button className="flex items-center gap-2 text-gray-500 hover:text-blue-400 transition">
                                                        <FaShare className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
};

export default Dashboard;