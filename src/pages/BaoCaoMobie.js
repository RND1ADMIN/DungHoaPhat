import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Search, ChevronDown, ChevronUp, Filter, Check, X, Calendar, ArrowLeft } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
const ReportMobile = () => {
    // State management (giữ nguyên)
    const [reports, setReports] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [congDoanList, setCongDoanList] = useState([
        "Cắt thô",
        "Bào, lựa phôi",
        "Finger ghép dọc 1",
        "Finger ghép dọc 2",
        "Bào tinh ghép ngang",
        "Trám trít",
        "Chà nhám - kiểm hàng",
        "Nhập kho thành phẩm"
    ]);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        congDoan: '',
        trangThai: '',
        startDate: null,
        endDate: null
    });
    const [showFilters, setShowFilters] = useState(false);
    const [groupedReports, setGroupedReports] = useState({});
    const [expandedDates, setExpandedDates] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal States (giữ nguyên)
    const [showReportModal, setShowReportModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [reportToApprove, setReportToApprove] = useState(null);
    const [currentReport, setCurrentReport] = useState({
        ID: '',
        'NGÀY': new Date(),
        'CÔNG ĐOẠN': '',
        'KHỐI LƯỢNG': '',
        'NHÂN SỰ THAM GIA': [],
        'GHI CHÚ': '',
        'NGƯỜI NHẬP': '',
        'TRẠNG THÁI': 'Chờ duyệt',
        'NGƯỜI DUYỆT': ''
    });

    // Các useEffect và hàm xử lý (giữ nguyên)
    useEffect(() => {
        fetchReports();
        fetchStaffList();
        fetchCongDoanList();
    }, []);

    useEffect(() => {
        groupReportsByDate();
    }, [reports, search, filters]);
    useEffect(() => {
        // Register the buttons in the header
        if (window.registerPageActions) {
            window.registerPageActions([
                {
                    icon: <Filter className="w-5 h-5" />,
                    onClick: () => setShowFilters(!showFilters),
                    title: "Lọc báo cáo",
                    className: "p-2 text-gray-600 border border-gray-300 rounded-lg"
                },
                {
                    icon: <Plus className="w-5 h-5" />,
                    onClick: () => handleOpenReportModal(),
                    title: "Thêm báo cáo mới",
                    className: "p-2 bg-blue-500 text-white rounded-lg"
                }
            ]);
        }
        
        // Clean up on component unmount
        return () => {
            if (window.clearPageActions) {
                window.clearPageActions();
            }
        };
    }, [showFilters]);
    // Các hàm xử lý (giữ nguyên)
    const fetchReports = async () => {
        // Giữ nguyên code
        try {
            const response = await authUtils.apiRequest('BC', 'Find', {});
            setReports(response);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Lỗi khi tải danh sách báo cáo');
        }
    };

    const fetchStaffList = async () => {
        // Giữ nguyên code
        try {
            const response = await authUtils.apiRequest('DSNV', 'Find', {});
            const staffOptions = response.map(staff => ({
                value: staff['Họ và Tên'],
                label: staff['Họ và Tên']
            }));
            setStaffList(staffOptions);
        } catch (error) {
            console.error('Error fetching staff list:', error);
            toast.error('Lỗi khi tải danh sách nhân viên');
        }
    };

    const fetchCongDoanList = async () => {
        // Giữ nguyên code
        try {
            // API implementation would go here if available
        } catch (error) {
            console.error('Error fetching cong doan list:', error);
        }
    };

    const groupReportsByDate = () => {
        // Giữ nguyên code
        const filteredReports = reports.filter(report => {
            const matchesSearch = !search ||
                report['CÔNG ĐOẠN']?.toLowerCase().includes(search.toLowerCase()) ||
                report.ID?.toLowerCase().includes(search.toLowerCase());

            const matchesCongDoan = !filters.congDoan || report['CÔNG ĐOẠN'] === filters.congDoan;
            const matchesTrangThai = !filters.trangThai || report['TRẠNG THÁI'] === filters.trangThai;

            // Date filtering
            let dateMatches = true;
            if (filters.startDate || filters.endDate) {
                const reportDate = new Date(report['NGÀY']);

                if (filters.startDate && filters.endDate) {
                    dateMatches = reportDate >= filters.startDate && reportDate <= filters.endDate;
                } else if (filters.startDate) {
                    dateMatches = reportDate >= filters.startDate;
                } else if (filters.endDate) {
                    dateMatches = reportDate <= filters.endDate;
                }
            }

            return matchesSearch && matchesCongDoan && matchesTrangThai && dateMatches;
        });

        // Group by date
        const grouped = filteredReports.reduce((acc, report) => {
            const date = new Date(report['NGÀY']).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(report);
            return acc;
        }, {});

        // Sort dates in descending order (newest first)
        const sortedGrouped = Object.keys(grouped)
            .sort((a, b) => new Date(b) - new Date(a))
            .reduce((acc, date) => {
                acc[date] = grouped[date];
                return acc;
            }, {});

        setGroupedReports(sortedGrouped);
    };

    // Các hàm xử lý khác (giữ nguyên)
    const toggleDateExpansion = (date) => {
        setExpandedDates(prev => ({
            ...prev,
            [date]: !prev[date]
        }));
    };

    const handleOpenReportModal = (report = null) => {
        // Giữ nguyên code
        if (report) {
            const staffArray = report['NHÂN SỰ THAM GIA']
                ? report['NHÂN SỰ THAM GIA'].split(',').map(name => ({
                    value: name.trim(),
                    label: name.trim()
                }))
                : [];

            setCurrentReport({
                ID: report.ID || '',
                'NGÀY': report['NGÀY'] ? new Date(report['NGÀY']) : new Date(),
                'CÔNG ĐOẠN': report['CÔNG ĐOẠN'] || '',
                'KHỐI LƯỢNG': report['KHỐI LƯỢNG'] || '',
                'NHÂN SỰ THAM GIA': staffArray,
                'GHI CHÚ': report['GHI CHÚ'] || '',
                'NGƯỜI NHẬP': report['NGƯỜI NHẬP'] || '',
                'TRẠNG THÁI': report['TRẠNG THÁI'] || 'Chờ duyệt',
                'NGƯỜI DUYỆT': report['NGƯỜI DUYỆT'] || ''
            });
        } else {
            const currentUser = authUtils.getUserData();
            setCurrentReport(prev => ({
                ...prev,
                'NGÀY': new Date(),
                'CÔNG ĐOẠN': '',
                'KHỐI LƯỢNG': '',
                'NHÂN SỰ THAM GIA': [],
                'GHI CHÚ': '',
                'NGƯỜI NHẬP': currentUser?.['Họ và Tên'] || '',
                'TRẠNG THÁI': 'Chờ duyệt',
                'NGƯỜI DUYỆT': ''
            }));
        }
        setShowReportModal(true);
    };

    // Các hàm xử lý form (giữ nguyên)
    const handleInputChange = (field, value) => {
        setCurrentReport(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDateChange = (date) => {
        setCurrentReport(prev => ({
            ...prev,
            'NGÀY': date
        }));
    };

    const handleStaffChange = (selectedOptions) => {
        setCurrentReport(prev => ({
            ...prev,
            'NHÂN SỰ THAM GIA': selectedOptions || []
        }));
    };

    // Các hàm validate và save (giữ nguyên)
    const validateReport = (report) => {
        const errors = [];
        if (!report['CÔNG ĐOẠN']) errors.push('CÔNG ĐOẠN không được để trống');
        if (!report['KHỐI LƯỢNG']) errors.push('KHỐI LƯỢNG không được để trống');
        if (!report['NGÀY']) errors.push('NGÀY không được để trống');
        if (!report['NGƯỜI NHẬP']) errors.push('NGƯỜI NHẬP không được để trống');
        return errors;
    };

    const handleSaveReport = async () => {
        // Giữ nguyên code
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            const errors = validateReport(currentReport);
            if (errors.length > 0) {
                toast.error(errors.join('\n'));
                setIsSubmitting(false);
                return;
            }

            const staffString = currentReport['NHÂN SỰ THAM GIA']
                .map(staff => staff.value)
                .join(', ');

            const reportData = {
                ...currentReport,
                'NGÀY': currentReport['NGÀY'].toISOString().split('T')[0],
                'NHÂN SỰ THAM GIA': staffString
            };

            if (reportData.ID) {
                await authUtils.apiRequest('BC', 'Edit', {
                    "Rows": [reportData]
                });
                toast.success('Cập nhật báo cáo thành công!');
            } else {
                const existingReports = await authUtils.apiRequest('BC', 'Find', {});
                const maxID = existingReports.reduce((max, report) => {
                    const id = parseInt(report.ID.replace('BC', '')) || 0;
                    return id > max ? id : max;
                }, 0);

                const newID = maxID + 1;
                const newReportID = `BC${newID.toString().padStart(3, '0')}`;
                reportData.ID = newReportID;
                reportData['TRẠNG THÁI'] = 'Chờ duyệt';

                await authUtils.apiRequest('BC', 'Add', {
                    "Rows": [reportData]
                });
                toast.success('Thêm báo cáo thành công!');
            }

            await fetchReports();
            setShowReportModal(false);
        } catch (error) {
            console.error('Error saving report:', error);
            toast.error('Có lỗi xảy ra: ' + (error.message || 'Không thể lưu báo cáo'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Các hàm xử lý khác (giữ nguyên)
    const handleDeleteReport = async (ID) => {
        // Giữ nguyên code
        if (window.confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) {
            try {
                await authUtils.apiRequest('BC', 'Delete', {
                    "Rows": [{ "ID": ID }]
                });
                toast.success('Xóa báo cáo thành công!');
                await fetchReports();
            } catch (error) {
                console.error('Error deleting report:', error);
                toast.error('Có lỗi xảy ra khi xóa báo cáo');
            }
        }
    };

    const openApprovalModal = (report) => {
        setReportToApprove(report);
        setShowApprovalModal(true);
    };

    const handleApprove = async (approve) => {
        // Giữ nguyên code
        if (!reportToApprove) return;

        try {
            const currentUser = authUtils.getUserData();
            const approverName = currentUser?.['Họ và Tên'] || '';
            const reportData = {
                ...reportToApprove,
                'TRẠNG THÁI': approve ? 'Đã duyệt' : 'Từ chối',
                'NGƯỜI DUYỆT': approverName
            };

            await authUtils.apiRequest('BC', 'Edit', {
                "Rows": [reportData]
            });

            toast.success(`Báo cáo đã được ${approve ? 'duyệt' : 'từ chối'}!`);
            await fetchReports();
            setShowApprovalModal(false);
            setReportToApprove(null);
        } catch (error) {
            console.error('Error approving report:', error);
            toast.error('Có lỗi xảy ra khi xử lý báo cáo');
        }
    };

    // Các hàm utility (giữ nguyên)
    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'Đã duyệt':
                return 'bg-green-100 text-green-800';
            case 'Từ chối':
                return 'bg-red-100 text-red-800';
            case 'Chờ duyệt':
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('vi-VN', options);
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-16">
           {/* Header */}
<div className="bg-white shadow-sm px-4 py-3 fixed top-0 left-0 right-0 z-10">
    <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
            <button
                onClick={() => window.history.back()}
                className="p-2 text-gray-600 border border-gray-300 rounded-lg"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Báo Cáo Sản Xuất</h1>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-600 border border-gray-300 rounded-lg"
            >
                <Filter className="w-5 h-5" />
            </button>
            <button
                onClick={() => handleOpenReportModal()}
                className="p-2 bg-blue-500 text-white rounded-lg"
            >
                <Plus className="w-5 h-5" />
            </button>
        </div>
    </div>
</div>
            {/* Main Content Area */}
            <div className="pt-2 px-4">
                {/* Search Bar */}
               {/* Search Bar */}
               <div className="mt-3 mb-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm báo cáo..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                </div>
                {/* Filters Section */}
                {showFilters && (
                    <div className="mb-4 p-4 bg-white rounded-lg shadow">
                        <h3 className="font-medium text-gray-700 mb-3">Lọc báo cáo</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Công đoạn</label>
                                <select
                                    value={filters.congDoan}
                                    onChange={(e) => setFilters({ ...filters, congDoan: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">Tất cả công đoạn</option>
                                    {congDoanList.map((type, index) => (
                                        <option key={index} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Trạng thái</label>
                                <select
                                    value={filters.trangThai}
                                    onChange={(e) => setFilters({ ...filters, trangThai: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="Chờ duyệt">Chờ duyệt</option>
                                    <option value="Đã duyệt">Đã duyệt</option>
                                    <option value="Từ chối">Từ chối</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Từ ngày</label>
                                <DatePicker
                                    selected={filters.startDate}
                                    onChange={(date) => setFilters({ ...filters, startDate: date })}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    dateFormat="dd/MM/yyyy"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Đến ngày</label>
                                <DatePicker
                                    selected={filters.endDate}
                                    onChange={(date) => setFilters({ ...filters, endDate: date })}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    dateFormat="dd/MM/yyyy"
                                />
                            </div>

                            <button
                                onClick={() => setFilters({
                                    congDoan: '',
                                    trangThai: '',
                                    startDate: null,
                                    endDate: null
                                })}
                                className="w-full mt-3 px-4 py-2 text-blue-500 border border-blue-500 rounded-lg"
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                )}

                {/* Reports List Grouped by Date */}
                <div className="space-y-4">
                    {Object.keys(groupedReports).length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-6 text-center">
                            <p className="text-gray-500">Không có báo cáo phù hợp</p>
                        </div>
                    ) : (
                        Object.entries(groupedReports).map(([date, dateReports]) => (
                            <div key={date} className="bg-white rounded-lg shadow">
                                <div
                                    className="p-3 border-b flex justify-between items-center cursor-pointer"
                                    onClick={() => toggleDateExpansion(date)}
                                >
                                    <div className="flex items-center">
                                        <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                                        <div>
                                            <h3 className="font-medium">{formatDate(date)}</h3>
                                            <p className="text-xs text-gray-500">{dateReports.length} báo cáo</p>
                                        </div>
                                    </div>
                                    {expandedDates[date] ?
                                        <ChevronUp className="w-5 h-5 text-gray-400" /> :
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    }
                                </div>

                                {expandedDates[date] && (
                                    <div className="divide-y">
                                        {dateReports.map(report => (
                                            <div key={report.ID} className="p-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex space-x-2">
                                                        {/* Nút điều khiển báo cáo được đặt ở phía trái, trước ID */}
                                                        <div className="flex space-x-1">
                                                            {report['TRẠNG THÁI'] === 'Chờ duyệt' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openApprovalModal(report);
                                                                    }}
                                                                    className="p-1.5 bg-green-100 text-green-600 rounded-lg"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenReportModal(report);
                                                                }}
                                                                className="p-1.5 bg-blue-100 text-blue-600 rounded-lg"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteReport(report.ID);
                                                                }}
                                                                className="p-1.5 bg-red-100 text-red-600 rounded-lg"
                                                            >
                                                                <Trash className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(report['TRẠNG THÁI'])}`}>
                                                        {report['TRẠNG THÁI']}
                                                    </span>
                                                </div>

                                                <div className="mt-1">
                                                    <span className="font-medium text-gray-800">{report.ID}</span>
                                                </div>

                                                <div className="space-y-1 mt-2">
                                                    <p className="text-sm">
                                                        <span className="text-gray-500">Công đoạn:</span> {report['CÔNG ĐOẠN']}
                                                    </p>
                                                    <p className="text-sm">
                                                        <span className="text-gray-500">Khối lượng:</span> {report['KHỐI LƯỢNG']}
                                                    </p>
                                                    <p className="text-sm">
                                                        <span className="text-gray-500">Nhân sự:</span> {report['NHÂN SỰ THAM GIA']}
                                                    </p>
                                                    {report['GHI CHÚ'] && (
                                                        <p className="text-sm">
                                                            <span className="text-gray-500">Ghi chú:</span> {report['GHI CHÚ']}
                                                        </p>
                                                    )}
                                                    <p className="text-sm">
                                                        <span className="text-gray-500">Người nhập:</span> {report['NGƯỜI NHẬP']}
                                                    </p>
                                                    {report['NGƯỜI DUYỆT'] && (
                                                        <p className="text-sm">
                                                            <span className="text-gray-500">Người duyệt:</span> {report['NGƯỜI DUYỆT']}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto mx-4">
                        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-semibold">
                                {currentReport.ID ? 'Cập nhật báo cáo' : 'Thêm báo cáo mới'}
                            </h2>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="text-gray-500"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NGÀY</label>
                                <DatePicker
                                    selected={currentReport['NGÀY']}
                                    onChange={handleDateChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    dateFormat="dd/MM/yyyy"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CÔNG ĐOẠN</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    value={currentReport['CÔNG ĐOẠN']}
                                    onChange={(e) => handleInputChange('CÔNG ĐOẠN', e.target.value)}
                                    required
                                >
                                    <option value="">Chọn công đoạn</option>
                                    {congDoanList.map((congDoan, index) => (
                                        <option key={index} value={congDoan}>{congDoan}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">KHỐI LƯỢNG</label>
                                <input
                                    type="text"
                                    placeholder="Nhập khối lượng"
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    value={currentReport['KHỐI LƯỢNG']}
                                    onChange={(e) => handleInputChange('KHỐI LƯỢNG', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NHÂN SỰ THAM GIA</label>
                                <Select
                                    isMulti
                                    options={staffList}
                                    value={currentReport['NHÂN SỰ THAM GIA']}
                                    onChange={handleStaffChange}
                                    placeholder="Chọn nhân sự tham gia..."
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NGƯỜI NHẬP</label>
                                <input
                                    type="text"
                                    placeholder="Người nhập"
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    value={currentReport['NGƯỜI NHẬP']}
                                    onChange={(e) => handleInputChange('NGƯỜI NHẬP', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GHI CHÚ</label>
                                <textarea
                                    placeholder="Nhập ghi chú (nếu có)"
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    value={currentReport['GHI CHÚ']}
                                    onChange={(e) => handleInputChange('GHI CHÚ', e.target.value)}
                                />
                            </div>

                            {currentReport.ID && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">TRẠNG THÁI</label>
                                    <div className={`px-3 py-2 rounded-lg text-sm ${getStatusBadgeColor(currentReport['TRẠNG THÁI'])}`}>
                                        {currentReport['TRẠNG THÁI']}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Thay đổi các nút ở dưới modal sang trái */}
                        <div className="sticky bottom-0 bg-white p-4 border-t flex justify-start gap-3">
                            <button
                                onClick={handleSaveReport}
                                disabled={isSubmitting}
                                className={`px-4 py-2 bg-blue-500 text-white rounded-lg ${isSubmitting ? 'opacity-50' : 'active:bg-blue-600'}`}
                            >
                                {isSubmitting ? 'Đang lưu...' : 'Lưu báo cáo'}
                            </button>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approval Modal */}
            {showApprovalModal && reportToApprove && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full mx-4 max-w-md">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Duyệt báo cáo</h2>
                            <button
                                onClick={() => {
                                    setShowApprovalModal(false);
                                    setReportToApprove(null);
                                }}
                                className="text-gray-500"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">ID:</span>
                                        <span className="font-medium">{reportToApprove.ID}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Ngày:</span>
                                        <span className="font-medium">
                                            {new Date(reportToApprove['NGÀY']).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Công đoạn:</span>
                                        <span className="font-medium">{reportToApprove['CÔNG ĐOẠN']}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Khối lượng:</span>
                                        <span className="font-medium">{reportToApprove['KHỐI LƯỢNG']}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Nhân sự tham gia:</span>
                                        <p className="font-medium text-sm mt-1">{reportToApprove['NHÂN SỰ THAM GIA']}</p>
                                    </div>
                                    {reportToApprove['GHI CHÚ'] && (
                                        <div>
                                            <span className="text-sm text-gray-500">Ghi chú:</span>
                                            <p className="font-medium text-sm mt-1">{reportToApprove['GHI CHÚ']}</p>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Người nhập:</span>
                                        <span className="font-medium">{reportToApprove['NGƯỜI NHẬP']}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Thay đổi các nút duyệt sang bên trái */}
                            <div className="flex justify-start gap-3">
                                <button
                                    onClick={() => handleApprove(true)}
                                    className="py-3 px-5 bg-green-500 text-white rounded-lg flex items-center gap-2"
                                >
                                    <Check className="w-5 h-5" />
                                    Duyệt
                                </button>
                                <button
                                    onClick={() => handleApprove(false)}
                                    className="py-3 px-5 bg-red-500 text-white rounded-lg flex items-center gap-2"
                                >
                                    <X className="w-5 h-5" />
                                    Từ chối
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Đã bỏ Bottom Navigation Bar để đặt các nút vào header */}

            {/* Toast Container */}
            <ToastContainer
                position="top-center"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
                style={{ marginTop: '50px' }}
            />
        </div>
    );
};

export default ReportMobile;