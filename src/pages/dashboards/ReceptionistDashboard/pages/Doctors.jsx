import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search as SearchIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Person as PersonIcon,
    VerifiedUser as VerifiedUserIcon,
    AccessTime as AccessTimeIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    PersonAdd as PersonAddIcon,
    Work as WorkIcon,
    CurrencyRupee as CurrencyRupeeIcon,
    PhoneInTalk as PhoneInTalkIcon,
    Verified as VerifiedIcon,
    ErrorOutline as ErrorOutlineIcon,
    ExpandMore as ExpandMoreIcon,
    Visibility as VisibilityIcon
} from '@mui/icons-material';
import Modal from '../../../../components/common/Modal/Modal';
import { apiFetch } from '../../../../services/apiClient';
import { DOCTOR_LIST, DOCTOR_STATISTICS, DOCTOR_DETAILS} from '../../../../config/api';


const Doctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [statsData, setStatsData] = useState({
        total: 0,
        available: 0,
        busy: 0,
        onLeave: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({});
    const [modalLoading, setModalLoading] = useState(false);

    // Fetch initial data
    useEffect(() => {
        fetchInitialData();
    }, []);

    // Optimized Search Logic: Using client-side filtering for instant feedback
    const filteredDoctors = useMemo(() => {
        if (!searchTerm) return doctors;
        const lowSearch = searchTerm.toLowerCase().trim();
        return doctors.filter(doc =>
            doc.name?.toLowerCase().includes(lowSearch) ||
            doc.specialization?.toLowerCase().includes(lowSearch) ||
            doc.id?.toString().toLowerCase().includes(lowSearch) ||
            doc.department?.toLowerCase().includes(lowSearch)
        );
    }, [doctors, searchTerm]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchDoctors(false),
                fetchStatistics()
            ]);
        } catch (err) {
            setError('Failed to synchronize medical staff data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await apiFetch(DOCTOR_LIST);
            const data = await res.json();
            if (res.ok) {
                // Handle various potential API response structures
                const list = data.data?.doctors || data.data || data;
                setDoctors(Array.isArray(list) ? list : []);
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching doctors:', err);
            setError('Failed to load clinical staff records.');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const res = await apiFetch(DOCTOR_STATISTICS);
            const data = await res.json();
            if (res.ok) {
                setStatsData(data.data || data);
            }
        } catch (err) {
            console.error('Error fetching statistics:', err);
        }
    };

    const fetchDoctorDetails = async (doctorId) => {
        setModalLoading(true);
        setShowModal(true);
        try {
            const res = await apiFetch(DOCTOR_DETAILS(doctorId));
            const data = await res.json();
            if (res.ok) {
                setFormData(data.data?.doctor || data.data || data);
            }
        } catch (err) {
            console.error('Error fetching doctor details:', err);
        } finally {
            setModalLoading(false);
        }
    };

    const handleOpenModal = (doc) => {
        fetchDoctorDetails(doc.id);
    };


    // Dynamic Statistics derived from API response
    const stats = {
        total: statsData.totalDoctors || statsData.total || 0,
        available: statsData.availableDoctors || statsData.available || 0,
        busy: statsData.busyDoctors || statsData.busy || 0,
        onLeave: statsData.onLeaveDoctors || statsData.onLeave || 0
    };


    const getStatusBadge = (status) => {

        switch (status) {
            case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Inactive': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getAvailabilityBadge = (avail) => {
        switch (avail) {
            case 'Available': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Busy': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'On Leave': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        Doctors Management
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and monitor hospital medical staff</p>
                </div>

            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Doctors', val: stats.total, icon: WorkIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Available ', val: stats.available, icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'In Consultation', val: stats.busy, icon: AccessTimeIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'On Leave', val: stats.onLeave, icon: CancelIcon, color: 'text-rose-600', bg: 'bg-rose-50' }
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow cursor-default"
                    >
                        <div className={`p-3.5 rounded-xl ${stat.bg} shadow-inner`}>
                            <stat.icon className={`!w-6 !h-6 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-0.5">{stat.label}</p>
                            <h3 className="text-2xl font-black text-slate-800 tabular-nums">{stat.val}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 max-w-2xl">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 !w-5 !h-5 text-slate-300" />
                    <input
                        type="text"
                        placeholder="Search by name, medical specialization, or registration ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-3.5 bg-slate-50/50 border border-slate-100 focus:border-slate-300 rounded-2xl text-sm transition-all outline-none font-medium placeholder:text-slate-300"
                    />
                </div>
            </div>

            {/* Table Container */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Synchronizing Staff Data...</p>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Doctor</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Specialization</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Experience</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Department</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Fee</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-center text-slate-500 tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence>
                                {Array.isArray(filteredDoctors) && filteredDoctors.map((doc) => (

                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={doc.id}
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{doc.name}</p>
                                                <p className="text-xs text-slate-500">{doc.id}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm text-slate-700 font-medium">{doc.specialization}</p>
                                                <p className="text-xs text-slate-500">{doc.qualification}</p>
                                            </div>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <p className='text-sm font-medium text-slate-700'>{doc.experience} {doc.experienceUnit || 'Years'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium border border-slate-200">
                                                {doc.department}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className='text-sm font-bold text-slate-700'>₹{doc.consultationFee}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                    <EmailIcon className="!w-3.5 !h-3.5" /> {doc.email}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                    <PhoneIcon className="!w-3.5 !h-3.5" /> {doc.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border text-center w-fit ${getStatusBadge(doc.status)}`}>
                                                    {doc.status}
                                                </span>
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border text-center w-fit ${getAvailabilityBadge(doc.availability)}`}>
                                                    {doc.availability === 'Busy' ? 'In Consultation' : doc.availability}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-center">
                                                <button
                                                    onClick={() => handleOpenModal(doc)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group border border-slate-100 hover:border-indigo-600"
                                                >
                                                    <VisibilityIcon className="!w-4 !h-4 transition-transform group-hover:scale-110" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
                {!loading && filteredDoctors.length === 0 && (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PersonIcon className="!w-10 !h-10 text-slate-300" />
                        </div>
                        <h3 className="text-slate-800 font-bold">No Doctors Found</h3>
                        <p className="text-slate-500 text-sm">Try adjusting your search filters</p>
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
                            className="mt-4 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>


            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Doctor Professional Profile"
                size="xl"
                footer={
                    <div className="flex items-center justify-end gap-4 w-full">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-8 py-3 border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 text-xs font-black tracking-[0.2em] transition-all"
                        >
                            Close
                        </button>
                    </div>
                }
            >
                {modalLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Loading Clinical Profile...</p>
                    </div>
                ) : (

                    <div className="space-y-10 py-4">
                        {/* Profile Header Card */}
                        <div className="relative overflow-hidden bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
                            <div className="text-center md:text-left space-y-3">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">{formData.name}</h2>
                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(formData.status)}`}>
                                        {formData.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-slate-500">
                                    <p className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase italic">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                        Registration ID: {formData.id}
                                    </p>
                                    <p className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
                                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                                        {formData.gender}
                                    </p>
                                </div>
                            </div>

                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -z-10" />
                        </div>

                        {/* Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Clinical & Experience Section */}
                            <div className="md:col-span-2 space-y-6">
                                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50/50 rounded-xl border border-slate-100 w-fit">
                                    <WorkIcon className="!w-4 !h-4 text-indigo-500" />
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Clinical Background</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { icon: VerifiedUserIcon, label: 'Medical Qualification', val: formData.qualification },
                                        { icon: WorkIcon, label: 'Specialization', val: formData.specialization },
                                        { icon: AccessTimeIcon, label: 'Clinical Experience', val: `${formData.experience} ${formData.experienceUnit}` },
                                        { icon: PersonIcon, label: 'Hospital Department', val: formData.department },
                                        { icon: CurrencyRupeeIcon, label: 'Consultation Fee', val: `₹${formData.consultationFee}`, color: 'text-emerald-600' },
                                        { icon: VerifiedIcon, label: 'Medical License', val: formData.licenseNumber }
                                    ].map((field, idx) => (
                                        <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-100 flex items-center gap-4">
                                            <div className="p-2.5 rounded-xl bg-slate-50 text-indigo-500">
                                                <field.icon className="!w-4 !h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{field.label}</p>
                                                <p className={`text-sm font-bold ${field.color || 'text-slate-700'}`}>{field.val}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Contact & Status Sidebar */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50/50 rounded-xl border border-slate-100 w-fit">
                                    <PhoneInTalkIcon className="!w-4 !h-4 text-indigo-500" />
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Contact & Duty</span>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { icon: EmailIcon, label: 'Professional Email', val: formData.email },
                                        { icon: PhoneIcon, label: 'Contact Number', val: formData.phone },
                                        { icon: ErrorOutlineIcon, label: 'Emergency Contact', val: formData.emergencyContact },
                                    ].map((field, idx) => (
                                        <div key={idx} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col gap-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <field.icon className="!w-3.5 !h-3.5 text-slate-400" />
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{field.label}</p>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 truncate">{field.val}</p>
                                        </div>
                                    ))}

                                    <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${getAvailabilityBadge(formData.availability)}`}>
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Current Duty Status</p>
                                        <p className="text-lg font-black">{formData.availability === 'Busy' ? 'In Consultation' : formData.availability}</p>
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

export default Doctors;