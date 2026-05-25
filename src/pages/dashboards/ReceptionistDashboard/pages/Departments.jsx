import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search as SearchIcon,
    Visibility as ViewIcon,
    Business as BusinessIcon,
    People as PeopleIcon,
    Person as PersonIcon,
    LocalPhone as PhoneIcon,
    CheckCircle as CheckCircleIcon,
    Build as BuildIcon,
    GridView as GridViewIcon,
    Verified as VerifiedIcon,
    ExpandMore as ExpandMoreIcon,
    LocalHospital as HospitalIcon,
    BedroomChild as BedIcon,
    Emergency as EmergencyIcon,
    Description as DescriptionIcon,
    Tag as TagIcon,
    LocationOn as LocationIcon,
    Email as EmailIcon,
    AccessTime as TimeIcon,
    LocalOffer as OfferIcon,
    Construction as ToolIcon,
    ErrorOutline as ErrorOutlineIcon
} from '@mui/icons-material';
import Modal from '../../../../components/common/Modal/Modal';
import { apiFetch } from '../../../../services/apiClient';
import {
    DEPARTMENT_LIST,
    DEPARTMENT_SEARCH,
    DEPARTMENT_STATISTICS,
    DEPARTMENT_DETAILS,
    DEPARTMENT_DOCTORS,
    DEPARTMENT_NURSES,
    DEPARTMENT_BEDS
} from '../../../../config/api';


const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [statsData, setStatsData] = useState({
        total: 0,
        active: 0,
        totalBeds: 0,
        availableBeds: 0,
        totalStaff: 0,
        emergencyUnits: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDeptId, setSelectedDeptId] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({});
    const [modalLoading, setModalLoading] = useState(false);

    // Fetch initial data
    useEffect(() => {
        fetchInitialData();
    }, []);

    // Filter and search active departments (KPI statistics are derived from this dataset)
    const searchFilteredDepartments = useMemo(() => {
        // Filter only Active departments
        const activeDepts = departments.filter(dept => 
            dept.status?.toLowerCase() === 'active'
        );

        if (!searchTerm) return activeDepts;
        const lowSearch = searchTerm.toLowerCase().trim();
        return activeDepts.filter(dept =>
            dept.name?.toLowerCase().includes(lowSearch) ||
            dept.head?.toLowerCase().includes(lowSearch) ||
            dept.code?.toLowerCase().includes(lowSearch) ||
            dept.id?.toString().toLowerCase().includes(lowSearch)
        );
    }, [departments, searchTerm]);

    // Final departments shown in the table (filtered by search and selected department dropdown)
    const filteredDepartments = useMemo(() => {
        if (selectedDeptId === 'all') return searchFilteredDepartments;
        return searchFilteredDepartments.filter(dept => dept.id?.toString() === selectedDeptId.toString());
    }, [searchFilteredDepartments, selectedDeptId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchDepartments(),
                fetchStatistics()
            ]);
        } catch (err) {
            setError('Failed to synchronize department data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await apiFetch(DEPARTMENT_LIST);
            const data = await res.json();
            if (res.ok) {
                const list = data.data?.departments || data.data || data;
                setDepartments(Array.isArray(list) ? list : []);
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching departments:', err);
            setError('Failed to synchronize clinical unit data.');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const res = await apiFetch(DEPARTMENT_STATISTICS);
            const data = await res.json();
            if (res.ok) {
                setStatsData(data.data || data);
            }
        } catch (err) {
            console.error('Error fetching statistics:', err);
        }
    };

    const fetchDepartmentDetails = async (deptId) => {
        setModalLoading(true);
        setShowModal(true);
        try {
            const [detailsRes, doctorsRes, nursesRes, bedsRes] = await Promise.all([
                apiFetch(DEPARTMENT_DETAILS(deptId)),
                apiFetch(DEPARTMENT_DOCTORS(deptId)),
                apiFetch(DEPARTMENT_NURSES(deptId)),
                apiFetch(DEPARTMENT_BEDS(deptId))
            ]);

            const details = await detailsRes.json();
            const doctors = await doctorsRes.json();
            const nurses = await nursesRes.json();
            const beds = await bedsRes.json();

            if (detailsRes.ok) {
                setFormData({
                    ...(details.data || details),
                    linkedDoctors: doctors.data || doctors || [],
                    linkedNurses: nurses.data || nurses || [],
                    linkedBeds: beds.data || beds || []
                });
            }
        } catch (err) {
            console.error('Error fetching department details:', err);
        } finally {
            setModalLoading(false);
        }
    };


    const handleOpenModal = (dept) => {
        fetchDepartmentDetails(dept.id);
    };


    // Dynamic Statistics derived from active/filtered table data
    const stats = useMemo(() => {
        let totalBeds = 0;
        let availableBeds = 0;
        let totalDoctors = 0;
        let totalNurses = 0;
        let emergencyUnits = 0;

        filteredDepartments.forEach(dept => {
            totalBeds += Number(dept.bedCapacity || 0);
            availableBeds += Number(dept.availableBeds || 0);
            totalDoctors += Number(dept.doctorCount || 0);
            totalNurses += Number(dept.nurseCount || 0);
            if (dept.emergencyAvailable || dept.emergencyReady || dept.isEmergencyReady) {
                emergencyUnits++;
            }
        });

        const activeCount = filteredDepartments.filter(dept => 
            dept.status?.toLowerCase() === 'active'
        ).length;

        return {
            total: filteredDepartments.length,
            active: activeCount,
            totalBeds,
            availableBeds,
            totalStaff: totalDoctors + totalNurses,
            emergencyUnits
        };
    }, [filteredDepartments]);




    const getStatusBadge = (status) => {
        switch (status) {
            case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Under Maintenance': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Closed': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        Clinical Departments
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Operational management of specialized hospital units</p>
                </div>

            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    {
                        label: 'Clinical Units',
                        val: stats.total,
                        sub: `${stats.active} Operational`,
                        icon: GridViewIcon,
                        color: 'text-indigo-600',
                        bg: 'bg-indigo-50'
                    },
                    {
                        label: 'Bed Availability',
                        val: `${stats.availableBeds}/${stats.totalBeds}`,
                        sub: `${Math.round((stats.availableBeds / stats.totalBeds) * 100) || 0}% Vacant`,
                        icon: BedIcon,
                        color: 'text-blue-600',
                        bg: 'bg-blue-50'
                    },
                    {
                        label: 'Staff Strength',
                        val: stats.totalStaff,
                        sub: 'Doctors & Nurses',
                        icon: PeopleIcon,
                        color: 'text-amber-600',
                        bg: 'bg-amber-50'
                    },
                    {
                        label: 'Emergency Ready',
                        val: stats.emergencyUnits,
                        sub: '24/7 Units',
                        icon: EmergencyIcon,
                        color: 'text-rose-600',
                        bg: 'bg-rose-50'
                    }
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow cursor-default"
                    >
                        <div className={`p-4 rounded-2xl ${stat.bg} flex-shrink-0`}>
                            <stat.icon className={`!w-7 !h-7 ${stat.color}`} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-slate-500 text-[10px] font-black tracking-widest  mb-0.5 truncate">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-slate-800 leading-none mb-1.5">{stat.val}</h3>
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                {stat.sub}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Search Bar & Department Filter */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full max-w-2xl">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 !w-5 !h-5 text-slate-300" />
                    <input
                        type="text"
                        placeholder="Search by name, HOD, or department code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-3.5 bg-slate-50/50 border border-slate-100 focus:border-slate-300 rounded-2xl text-sm transition-all outline-none font-medium placeholder:text-slate-300"
                    />
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className="text-xs font-semibold text-slate-400 whitespace-nowrap"></span>
                    <select
                        value={selectedDeptId}
                        onChange={(e) => setSelectedDeptId(e.target.value)}
                        className="w-full md:w-56 px-4 py-3 bg-slate-50 border border-slate-100 focus:border-slate-300 rounded-2xl text-xs font-bold text-slate-700 transition-all outline-none cursor-pointer"
                    >
                        <option value="all">All Departments</option>
                        {departments
                            .filter(dept => dept.status?.toLowerCase() === 'active')
                            .map(dept => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))
                        }
                    </select>
                </div>
            </div>

            {/* Table Container */}
            <div className="relative bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Synchronizing Clinical Units...</p>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 tracking-wider">Department Detail</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 tracking-wider">Head of Department</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 tracking-wider  text-center">Beds</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 tracking-wider  text-center">Staffing</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-center text-slate-500 tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence>
                                {Array.isArray(filteredDepartments) && filteredDepartments.map((dept) => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={dept.id}
                                        className="hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{dept.name}</p>
                                                <p className="text-xs text-slate-400 font-medium tracking-tight">
                                                    {dept.code} • {dept.id}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-slate-700">{dept.head}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center">
                                                <p className="text-sm font-bold text-slate-800">{dept.availableBeds} / {dept.bedCapacity}</p>
                                                <p className="text-[9px] text-slate-400 font-black tracking-tighter">Available</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-4 justify-center">
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-slate-800">{dept.doctorCount}</p>
                                                    <p className="text-[9px] text-slate-400 font-black tracking-tighter">Doctors</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-slate-800">{dept.nurseCount}</p>
                                                    <p className="text-[9px] text-slate-400 font-black tracking-tighter">Nurses</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border text-center block w-fit shadow-sm ${getStatusBadge(dept.status)}`}>
                                                {dept.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center">
                                                <button
                                                    onClick={() => handleOpenModal(dept)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black    tracking-widest transition-all group border border-slate-100 hover:border-indigo-600"
                                                >
                                                    <ViewIcon className="!w-4 !h-4 transition-transform group-hover:scale-110" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
                {!loading && filteredDepartments.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BusinessIcon className="!w-10 !h-10 text-slate-300" />
                        </div>
                        <h3 className="text-slate-800 font-bold">No Departments Found</h3>
                        <p className="text-slate-500 text-sm">Try adjusting your search criteria</p>
                    </div>
                )}
                {error && (
                    <div className="p-10 text-center">
                        <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ErrorOutlineIcon className="!w-6 !h-6 text-rose-500" />
                        </div>
                        <h3 className="text-slate-800 font-bold text-sm">{error}</h3>
                        <button
                            onClick={fetchInitialData}
                            className="mt-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                        >
                            Retry Sync
                        </button>
                    </div>
                )}
            </div>

            {/* Department Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Department Clinical Profile"
                size="xl"
                footer={
                    <div className="flex items-center justify-end gap-4 w-full">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-8 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-all"
                        >
                            Close
                        </button>
                    </div>
                }
            >
                {modalLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Accessing Unit Records...</p>
                    </div>
                ) : (

                    <div className="space-y-8 py-4 px-2">
                        {/* Top Header Section */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-slate-100 pb-6 gap-4">
                            <div className="flex gap-5">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-2xl font-bold text-slate-800">{formData.name}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(formData.status)}`}>
                                            {formData.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-500">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                            {formData.code}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                                            {formData.id}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {formData.emergencyAvailable && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 h-fit">
                                    <span className="text-[10px] font-black tracking-wider">Emergency Ready</span>
                                </div>
                            )}
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Primary Stats */}
                            <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest">Clinical Capacity</span>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-bold text-slate-800">{formData.availableBeds}</span>
                                        <span className="text-sm font-bold text-slate-400 mb-1">/ {formData.bedCapacity} Total Beds</span>
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest">Staff Strength</span>
                                    </div>
                                    <div className="flex gap-6">
                                        <div>
                                            <p className="text-xl font-bold text-slate-800">{formData.doctorCount}</p>
                                            <p className="text-[9px] font-black text-slate-400">Doctors</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold text-slate-800">{formData.nurseCount}</p>
                                            <p className="text-[9px] font-black text-slate-400">Nurses</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-1 sm:col-span-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest   ">Department Head</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{formData.head}</p>
                                            <p className="text-xs text-slate-500">Chief Clinical Officer</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Details */}
                            <div className="col-span-1 space-y-4">
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">

                                        <span className="text-[10px] font-black text-slate-400 tracking-widest   ">Location</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">{formData.location}</p>
                                </div>

                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest   ">Operating Hours</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">{formData.operatingHours}</p>
                                    <p className="text-[10px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
                                        Currently Operational
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description & Technical */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Unit Overview</span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-5 rounded-2xl border border-slate-100 italic">
                                        "{formData.description}"
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Assigned Doctors</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.isArray(formData.linkedDoctors) && formData.linkedDoctors.length > 0 ? (
                                            formData.linkedDoctors.map(doc => (
                                                <span key={doc.id} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-bold border border-indigo-100 flex items-center gap-2">
                                                    <PersonIcon className="!w-3 !h-3" /> {doc.name}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-[10px] text-slate-400 font-medium italic">No doctors currently assigned</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Specializations</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(Array.isArray(formData.specializations) ? formData.specializations : formData.specializations?.split(',') || []).map((spec, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-bold border border-indigo-100">
                                                {typeof spec === 'string' ? spec.trim() : spec}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Clinical Equipment</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(Array.isArray(formData.equipmentList) ? formData.equipmentList : formData.equipmentList?.split(',') || []).map((item, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-[11px] font-bold border border-slate-200">
                                                {typeof item === 'string' ? item.trim() : item}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Bed Occupancy Detail</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.isArray(formData.linkedBeds) && formData.linkedBeds.length > 0 ? (
                                            formData.linkedBeds.map(bed => (
                                                <span key={bed.id} className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border ${bed.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                                    Bed {bed.number}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-[10px] text-slate-400 font-medium italic">Bed inventory data unavailable</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </Modal>


            {/* Decorative background elements */}
            <div className="fixed top-20 right-0 w-96 h-96 bg-indigo-200/10 blur-3xl -z-10 pointer-events-none rounded-full" />
            <div className="fixed bottom-0 left-0 w-80 h-80 bg-emerald-200/10 blur-3xl -z-10 pointer-events-none rounded-full" />
        </>
    );
};

export default Departments;