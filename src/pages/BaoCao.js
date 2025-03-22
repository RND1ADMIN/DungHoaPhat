import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Search, ChevronLeft, ChevronRight, Filter, Download, Check, Upload, Clock, X } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';
import * as XLSX from 'xlsx';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ReportManagement = () => {
    // State Management
    const [reports, setReports] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedReports, setSelectedReports] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        congDoan: '',
        trangThai: '',
        startDate: null,
        endDate: null
    });

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
    // Add import states
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importPreview, setImportPreview] = useState([]);
    const [isImporting, setIsImporting] = useState(false);

    // Add approval modal state
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [reportToApprove, setReportToApprove] = useState(null);

    // Fetch Reports and Staff List
    useEffect(() => {
        fetchReports();
        fetchStaffList();
        fetchCongDoanList();
    }, []);

    const fetchReports = async () => {
        try {
            const response = await authUtils.apiRequest('BC', 'Find', {});
            setReports(response);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Lỗi khi tải danh sách báo cáo');
        }
    };
    // Thêm hàm để lấy danh sách công đoạn từ API (nếu có)
    const fetchCongDoanList = async () => {
        try {
            // Nếu có API riêng để lấy danh sách công đoạn
            // const response = await authUtils.apiRequest('CONGDOAN', 'Find', {});
            // setCongDoanList(response.map(item => item.Ten));

            // Hoặc tạm thời dùng dữ liệu cứng như trên
        } catch (error) {
            console.error('Error fetching cong doan list:', error);
        }
    };
    const fetchStaffList = async () => {
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

    // Handle Report Modal
    const handleOpen = (report = null) => {
        if (report) {
            // Transform string of staff names to array of objects for react-select
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
            // Get current user
            const currentUser = authUtils.getUserData();
            setCurrentReport(prev => ({
                ...prev,
                'NGƯỜI NHẬP': currentUser?.['Họ và Tên'] || ''
            }));
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setCurrentReport({
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
    };

    // Handle Form Input
    const handleInputChange = (field, value) => {
        setCurrentReport(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle date change
    const handleDateChange = (date) => {
        setCurrentReport(prev => ({
            ...prev,
            'NGÀY': date
        }));
    };

    // Handle staff selection
    const handleStaffChange = (selectedOptions) => {
        setCurrentReport(prev => ({
            ...prev,
            'NHÂN SỰ THAM GIA': selectedOptions || []
        }));
    };

    // Validation Function
    const validateReport = (report) => {
        const errors = [];
        if (!report['CÔNG ĐOẠN']) errors.push('CÔNG ĐOẠN không được để trống');
        if (!report['KHỐI LƯỢNG']) errors.push('KHỐI LƯỢNG không được để trống');
        if (!report['NGÀY']) errors.push('NGÀY không được để trống');
        if (!report['NGƯỜI NHẬP']) errors.push('NGƯỜI NHẬP không được để trống');
        return errors;
    };

    // Save Report
    const handleSave = async () => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            const errors = validateReport(currentReport);
            if (errors.length > 0) {
                toast.error(errors.join('\n'));
                setIsSubmitting(false);
                return;
            }

            // Convert staff array to comma-separated string
            const staffString = currentReport['NHÂN SỰ THAM GIA']
                .map(staff => staff.value)
                .join(', ');

            const reportData = {
                ...currentReport,
                'NGÀY': currentReport['NGÀY'].toISOString().split('T')[0], // Format date as YYYY-MM-DD
                'NHÂN SỰ THAM GIA': staffString
            };

            if (reportData.ID) {
                // When editing, maintain the existing approval status unless specifically changing it
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
            handleClose();
        } catch (error) {
            console.error('Error saving report:', error);
            toast.error('Có lỗi xảy ra: ' + (error.message || 'Không thể lưu báo cáo'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete Report
    const handleDelete = async (ID) => {
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

    // Approval functionality
    const openApprovalModal = (report) => {
        setReportToApprove(report);
        setShowApprovalModal(true);
    };

    const handleApprove = async (approve) => {
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

    // Bulk Actions
    const handleBulkDelete = async () => {
        if (selectedReports.length === 0) {
            toast.warning('Vui lòng chọn báo cáo để xóa');
            return;
        }

        if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedReports.length} báo cáo đã chọn?`)) {
            try {
                const deletePromises = selectedReports.map(id =>
                    authUtils.apiRequest('BC', 'Delete', {
                        "Rows": [{ "ID": id }]
                    })
                );

                await Promise.all(deletePromises);
                toast.success('Xóa báo cáo thành công!');
                setSelectedReports([]);
                await fetchReports();
            } catch (error) {
                toast.error('Có lỗi xảy ra khi xóa báo cáo');
            }
        }
    };

    const handleExportSelected = () => {
        if (selectedReports.length === 0) {
            toast.warning('Vui lòng chọn báo cáo để xuất file');
            return;
        }

        const selectedItems = reports.filter(r => selectedReports.includes(r.ID));
        const excelData = selectedItems.map(item => ({
            ID: item.ID,
            'NGÀY': item['NGÀY'],
            'CÔNG ĐOẠN': item['CÔNG ĐOẠN'],
            'KHỐI LƯỢNG': item['KHỐI LƯỢNG'],
            'NHÂN SỰ THAM GIA': item['NHÂN SỰ THAM GIA'],
            'GHI CHÚ': item['GHI CHÚ'],
            'NGƯỜI NHẬP': item['NGƯỜI NHẬP'],
            'TRẠNG THÁI': item['TRẠNG THÁI'],
            'NGƯỜI DUYỆT': item['NGƯỜI DUYỆT'] || ''
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo');
        XLSX.writeFile(wb, `bao-cao-${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // Import Excel functionality
    const handleImportFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check if file is Excel
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
            toast.error('Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV');
            return;
        }

        setImportFile(file);

        // Parse Excel file for preview
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const binaryData = evt.target.result;
                const workbook = XLSX.read(binaryData, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON with headers
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    toast.error('File không có dữ liệu hoặc không đúng định dạng');
                    setImportFile(null);
                    return;
                }

                // Extract headers and data
                const headers = jsonData[0];
                const requiredColumns = ['NGÀY', 'CÔNG ĐOẠN', 'KHỐI LƯỢNG', 'NHÂN SỰ THAM GIA', 'NGƯỜI NHẬP'];

                // Check if all required columns exist
                const missingColumns = requiredColumns.filter(col => !headers.includes(col));
                if (missingColumns.length > 0) {
                    toast.error(`File thiếu các cột bắt buộc: ${missingColumns.join(', ')}`);
                    setImportFile(null);
                    return;
                }

                // Create preview data (first 5 rows)
                const previewData = jsonData.slice(1, 6).map(row => {
                    const rowData = {};
                    headers.forEach((header, index) => {
                        rowData[header] = row[index] || '';
                    });
                    return rowData;
                });

                setImportPreview(previewData);
            } catch (error) {
                console.error('Error parsing Excel file:', error);
                toast.error('Không thể đọc file. Vui lòng kiểm tra định dạng file.');
                setImportFile(null);
            }
        };

        reader.onerror = () => {
            toast.error('Không thể đọc file');
            setImportFile(null);
        };

        reader.readAsBinaryString(file);
    };

    const handleImportData = async () => {
        if (!importFile) return;

        setIsImporting(true);
        toast.info('Đang xử lý dữ liệu...', { autoClose: false, toastId: 'importing' });

        try {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const binaryData = evt.target.result;
                    const workbook = XLSX.read(binaryData, { type: 'binary' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // Convert to JSON with headers
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    // Validate data
                    const invalidRows = [];
                    const validatedData = [];

                    // Get existing reports for ID generation
                    const existingReports = await authUtils.apiRequest('BC', 'Find', {});
                    const maxID = existingReports.reduce((max, report) => {
                        const id = parseInt(report.ID.replace('BC', '')) || 0;
                        return id > max ? id : max;
                    }, 0);

                    let newIdCounter = maxID + 1;
                    const currentUser = authUtils.getCurrentUser();
                    const currentUserName = currentUser?.displayName || currentUser?.email || '';

                    // Process each row
                    for (let i = 0; i < jsonData.length; i++) {
                        const row = jsonData[i];

                        // Basic validation
                        if (!row['CÔNG ĐOẠN'] || !row['KHỐI LƯỢNG'] || !row['NGÀY']) {
                            invalidRows.push(i + 2); // +2 because of 0-indexing and header row
                            continue;
                        }

                        // Create report object
                        const report = {
                            ID: row.ID || `BC${newIdCounter.toString().padStart(3, '0')}`,
                            'NGÀY': row['NGÀY'],
                            'CÔNG ĐOẠN': row['CÔNG ĐOẠN'],
                            'KHỐI LƯỢNG': row['KHỐI LƯỢNG'],
                            'NHÂN SỰ THAM GIA': row['NHÂN SỰ THAM GIA'] || '',
                            'GHI CHÚ': row['GHI CHÚ'] || '',
                            'NGƯỜI NHẬP': row['NGƯỜI NHẬP'] || currentUserName,
                            'TRẠNG THÁI': 'Chờ duyệt',
                            'NGƯỜI DUYỆT': ''
                        };

                        validatedData.push(report);
                        newIdCounter++;
                    }

                    if (invalidRows.length > 0) {
                        toast.warning(`Có ${invalidRows.length} dòng dữ liệu không hợp lệ: ${invalidRows.join(', ')}`);
                    }

                    if (validatedData.length === 0) {
                        toast.error('Không có dữ liệu hợp lệ để nhập');
                        setIsImporting(false);
                        toast.dismiss('importing');
                        return;
                    }

                    // Import reports in batches to avoid timeout
                    const batchSize = 25;
                    let successCount = 0;

                    for (let i = 0; i < validatedData.length; i += batchSize) {
                        const batch = validatedData.slice(i, i + batchSize);
                        try {
                            await authUtils.apiRequest('BC', 'Add', {
                                "Rows": batch
                            });
                            successCount += batch.length;
                        } catch (error) {
                            console.error('Error importing batch:', error);
                        }
                    }

                    toast.dismiss('importing');
                    toast.success(`Đã nhập thành công ${successCount} báo cáo`);
                    await fetchReports();
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportPreview([]);
                } catch (error) {
                    console.error('Error processing import:', error);
                    toast.dismiss('importing');
                    toast.error('Có lỗi xảy ra khi xử lý dữ liệu');
                } finally {
                    setIsImporting(false);
                }
            };

            reader.onerror = () => {
                toast.dismiss('importing');
                toast.error('Không thể đọc file');
                setIsImporting(false);
            };

            reader.readAsBinaryString(importFile);
        } catch (error) {
            toast.dismiss('importing');
            toast.error('Có lỗi xảy ra');
            setIsImporting(false);
        }
    };
    const [showAddCongDoanModal, setShowAddCongDoanModal] = useState(false);
    const [newCongDoan, setNewCongDoan] = useState('');
    const handleAddCongDoan = async () => {
        if (!newCongDoan.trim()) {
            toast.error('Tên công đoạn không được để trống');
            return;
        }

        // Kiểm tra nếu công đoạn đã tồn tại
        if (congDoanList.includes(newCongDoan.trim())) {
            toast.error('Công đoạn này đã tồn tại');
            return;
        }

        try {
            // Nếu có API để thêm công đoạn
            // await authUtils.apiRequest('CONGDOAN', 'Add', {
            //    "Rows": [{ "Ten": newCongDoan }]
            // });

            // Cập nhật state local
            setCongDoanList([...congDoanList, newCongDoan.trim()]);
            setNewCongDoan('');
            setShowAddCongDoanModal(false);
            toast.success('Thêm công đoạn mới thành công');
        } catch (error) {
            console.error('Error adding new cong doan:', error);
            toast.error('Có lỗi xảy ra khi thêm công đoạn mới');
        }
    };
    const handleDownloadTemplate = () => {
        const templateData = [
            ['NGÀY', 'CÔNG ĐOẠN', 'KHỐI LƯỢNG', 'NHÂN SỰ THAM GIA', 'GHI CHÚ', 'NGƯỜI NHẬP'],
            ['2025-03-22', 'Cưa gỗ', '50 khối', 'Nguyễn Văn A, Trần Văn B', 'Hoàn thành đúng tiến độ', 'Lê Văn C'],
            ['2025-03-22', 'Đóng thùng', '30 khối', 'Phạm Văn D, Ngô Văn E', 'Cần bổ sung nhân lực', 'Lê Văn C']
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');

        // Generate file
        XLSX.writeFile(wb, 'mau_nhap_bao_cao.xlsx');
    };

    // Filtering and Pagination
    const filteredReports = reports.filter(report => {
        const matchesSearch =
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

    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Get status badge color
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

    // Pagination Component
    const Pagination = () => {
        return (
            <div className="flex flex-wrap justify-center items-center space-x-1 md:space-x-2 mt-4">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-50'}`}
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                        <button
                            key={number}
                            onClick={() => handlePageChange(number)}
                            className={`px-3 py-1 rounded-lg ${currentPage === number ? 'bg-blue-500 text-white'
                                : 'text-gray-600 hover:bg-blue-50'
                                }`}
                        >
                            {number}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-50'}`}
                >
                    <ChevronRight className="h-5 w-5" />
                </button>

                <span className="text-gray-600 ml-4">
                    Trang {currentPage} / {totalPages || 1}
                </span>
            </div>
        );
    };

    return (
        <div className="p-3 md:p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-sm p-3 md:p-6 mb-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-3 md:space-y-0">
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-800">Quản lý Báo Cáo</h1>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Filter className="w-4 h-4" />
                            Bộ lọc
                        </button>

                        {/* Import button */}
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            Nhập Excel
                        </button>

                        {selectedReports.length > 0 && (
                            <>
                                <button
                                    onClick={handleExportSelected}
                                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Xuất file
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                                >
                                    <Trash className="w-4 h-4" />
                                    Xóa ({selectedReports.length})
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => handleOpen()}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm báo cáo
                        </button>
                    </div>
                </div>

                {/* Filter Section */}
                {showFilters && (
                    <div className="mb-4 p-3 md:p-4 border rounded-lg bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <select
                                value={filters.congDoan}
                                onChange={(e) => setFilters({ ...filters, congDoan: e.target.value })}
                                className="p-2 border rounded-lg"
                            >
                                <option value="">Tất cả CÔNG ĐOẠN</option>
                                {Array.from(new Set(reports.map(r => r['CÔNG ĐOẠN']))).map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>

                            <select
                                value={filters.trangThai}
                                onChange={(e) => setFilters({ ...filters, trangThai: e.target.value })}
                                className="p-2 border rounded-lg"
                            >
                                <option value="">Tất cả TRẠNG THÁI</option>
                                <option value="Chờ duyệt">Chờ duyệt</option>
                                <option value="Đã duyệt">Đã duyệt</option>
                                <option value="Từ chối">Từ chối</option>
                            </select>

                            <div className="flex gap-2">
                                <div className="w-1/2">
                                    <DatePicker
                                        selected={filters.startDate}
                                        onChange={(date) => setFilters({ ...filters, startDate: date })}
                                        className="p-2 border rounded-lg w-full"
                                        placeholderText="Từ ngày"
                                        dateFormat="dd/MM/yyyy"
                                    />
                                </div>
                                <div className="w-1/2">
                                    <DatePicker
                                        selected={filters.endDate}
                                        onChange={(date) => setFilters({ ...filters, endDate: date })}
                                        className="p-2 border rounded-lg w-full"
                                        placeholderText="Đến ngày"
                                        dateFormat="dd/MM/yyyy"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => setFilters({
                                    congDoan: '',
                                    trangThai: '',
                                    startDate: null,
                                    endDate: null
                                })}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                )}

                {/* Search Section */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo mã hoặc công đoạn..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto -mx-3 md:mx-0">
                    <table className="w-full min-w-[1000px]">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-3 border-b">
                                    <input
                                        type="checkbox"
                                        checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedReports(filteredReports.map(r => r.ID));
                                            } else {
                                                setSelectedReports([]);
                                            }
                                        }}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-600">ID</th>
                                <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-600">NGÀY</th>
                                <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-600">CÔNG ĐOẠN</th>
                                <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-600">KHỐI LƯỢNG</th>
                                <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-600">NHÂN SỰ THAM GIA</th>
                                <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-600">NGƯỜI NHẬP</th>
                                <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-600">TRẠNG THÁI</th>
                                <th className="px-4 py-3 border-b text-left text-sm font-medium text-gray-600">NGƯỜI DUYỆT</th>
                                <th className="px-4 py-3 border-b text-right text-sm font-medium text-gray-600">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map((report) => (
                                <tr key={report.ID} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 border-b">
                                        <input
                                            type="checkbox"
                                            checked={selectedReports.includes(report.ID)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedReports([...selectedReports, report.ID]);
                                                } else {
                                                    setSelectedReports(selectedReports.filter(id => id !== report.ID));
                                                }
                                            }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3 border-b">{report.ID}</td>
                                    <td className="px-4 py-3 border-b">
                                        {new Date(report['NGÀY']).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-4 py-3 border-b">{report['CÔNG ĐOẠN']}</td>
                                    <td className="px-4 py-3 border-b">{report['KHỐI LƯỢNG']}</td>
                                    <td className="px-4 py-3 border-b">
                                        <div className="max-w-xs truncate" title={report['NHÂN SỰ THAM GIA']}>
                                            {report['NHÂN SỰ THAM GIA']}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 border-b">{report['NGƯỜI NHẬP']}</td>
                                    <td className="px-4 py-3 border-b">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(report['TRẠNG THÁI'])}`}>
                                            {report['TRẠNG THÁI']}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 border-b">{report['NGƯỜI DUYỆT'] || '-'}</td>
                                    <td className="px-4 py-3 border-b text-right">
                                        {report['TRẠNG THÁI'] === 'Chờ duyệt' && (
                                            <button
                                                onClick={() => openApprovalModal(report)}
                                                className="text-green-500 hover:text-green-700 p-1"
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleOpen(report)}
                                            className="text-blue-500 hover:text-blue-700 p-1"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(report.ID)}
                                            className="text-red-500 hover:text-red-700 p-1 ml-1"
                                        >
                                            <Trash className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <Pagination />
            </div>

            {/* Modal Add/Edit Report */}
            {open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-4 md:p-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">
                                {currentReport.ID ? 'Cập nhật báo cáo' : 'Thêm báo cáo mới'}
                            </h2>
                            <button
                                onClick={handleClose}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">NGÀY</label>
                                    <DatePicker
                                        selected={currentReport['NGÀY']}
                                        onChange={handleDateChange}
                                        className="p-2 border border-gray-300 rounded-lg w-full"
                                        dateFormat="dd/MM/yyyy"
                                    />
                                </div>
                                {/* Thay thế input CÔNG ĐOẠN bằng select */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        CÔNG ĐOẠN
                                        <button
                                            type="button"
                                            onClick={() => setShowAddCongDoanModal(true)}
                                            className="ml-2 text-xs text-blue-500 hover:text-blue-700"
                                        >
                                            + Thêm mới
                                        </button>
                                    </label>
                                    <select
                                        className="p-2 border border-gray-300 rounded-lg w-full"
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
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">KHỐI LƯỢNG</label>
                                    <input
                                        type="text"
                                        placeholder="KHỐI LƯỢNG"
                                        className="p-2 border border-gray-300 rounded-lg w-full"
                                        value={currentReport['KHỐI LƯỢNG']}
                                        onChange={(e) => handleInputChange('KHỐI LƯỢNG', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">NGƯỜI NHẬP</label>
                                    <input
                                        type="text"
                                        placeholder="NGƯỜI NHẬP"
                                        className="p-2 border border-gray-300 rounded-lg w-full"
                                        value={currentReport['NGƯỜI NHẬP']}
                                        onChange={(e) => handleInputChange('NGƯỜI NHẬP', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NHÂN SỰ THAM GIA</label>
                                <Select
                                    isMulti
                                    options={staffList}
                                    value={currentReport['NHÂN SỰ THAM GIA']}
                                    onChange={handleStaffChange}
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                    placeholder="Chọn nhân sự tham gia..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GHI CHÚ</label>
                                <textarea
                                    placeholder="GHI CHÚ"
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={currentReport['GHI CHÚ']}
                                    onChange={(e) => handleInputChange('GHI CHÚ', e.target.value)}
                                />
                            </div>

                            {currentReport.ID && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">TRẠNG THÁI</label>
                                        <div className={`px-3 py-2 rounded-lg text-sm ${getStatusBadgeColor(currentReport['TRẠNG THÁI'])}`}>
                                            {currentReport['TRẠNG THÁI']}
                                        </div>
                                    </div>
                                    {currentReport['NGƯỜI DUYỆT'] && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">NGƯỜI DUYỆT</label>
                                            <div className="px-3 py-2 rounded-lg bg-gray-100 text-sm">
                                                {currentReport['NGƯỜI DUYỆT']}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    disabled={isSubmitting}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSubmitting}
                                    className={`px-4 py-2 bg-blue-500 text-white rounded-lg ${isSubmitting
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-blue-600'
                                        } flex items-center gap-2`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang lưu...
                                        </>
                                    ) : 'Lưu'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Excel Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-4 md:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Nhập báo cáo từ Excel</h2>
                            <button
                                onClick={() => {
                                    setShowImportModal(false);
                                    setImportFile(null);
                                    setImportPreview([]);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                Tải lên file Excel (.xlsx, .xls) hoặc CSV có chứa dữ liệu báo cáo.
                                File cần có các cột: NGÀY, CÔNG ĐOẠN, KHỐI LƯỢNG, NHÂN SỰ THAM GIA, NGƯỜI NHẬP.
                            </p>
                            <div className="flex gap-2">
                                <label className="flex items-center gap-2 cursor-pointer px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        className="hidden"
                                        onChange={handleImportFileChange}
                                    />
                                    <Upload className="h-4 w-4" />
                                    <span>Chọn file</span>
                                </label>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="px-4 py-2 text-blue-500 border border-blue-500 rounded-lg hover:bg-blue-50 flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Tải mẫu nhập
                                </button>
                            </div>
                            {importFile && (
                                <div className="mt-2 text-sm text-gray-600">
                                    Đã chọn: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                                </div>
                            )}
                        </div>

                        {importPreview.length > 0 && (
                            <div className="mb-4">
                                <h3 className="font-medium mb-2">Xem trước dữ liệu (5 dòng đầu tiên):</h3>
                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {Object.keys(importPreview[0]).map((header, index) => (
                                                    <th key={index} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {importPreview.map((row, rowIndex) => (
                                                <tr key={rowIndex}>
                                                    {Object.values(row).map((cell, cellIndex) => (
                                                        <td key={cellIndex} className="px-3 py-2 text-sm text-gray-500 truncate">
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => {
                                    setShowImportModal(false);
                                    setImportFile(null);
                                    setImportPreview([]);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                disabled={isImporting}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleImportData}
                                disabled={!importFile || isImporting}
                                className={`px-4 py-2 bg-blue-500 text-white rounded-lg ${(!importFile || isImporting)
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-blue-600'
                                    } flex items-center gap-2`}
                            >
                                {isImporting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang nhập...
                                    </>
                                ) : 'Nhập dữ liệu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal thêm công đoạn mới */}
            {showAddCongDoanModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 md:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Thêm công đoạn mới</h2>
                            <button
                                onClick={() => setShowAddCongDoanModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên công đoạn</label>
                                <input
                                    type="text"
                                    value={newCongDoan}
                                    onChange={(e) => setNewCongDoan(e.target.value)}
                                    className="p-2 border border-gray-300 rounded-lg w-full"
                                    placeholder="Nhập tên công đoạn mới"
                                />
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    onClick={() => setShowAddCongDoanModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleAddCongDoan}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                >
                                    Thêm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Approval Modal */}
            {showApprovalModal && reportToApprove && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-4 md:p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Duyệt báo cáo</h2>
                            <button
                                onClick={() => {
                                    setShowApprovalModal(false);
                                    setReportToApprove(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-sm text-gray-500">ID:</p>
                                        <p className="font-medium">{reportToApprove.ID}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">NGÀY:</p>
                                        <p className="font-medium">{new Date(reportToApprove['NGÀY']).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">CÔNG ĐOẠN:</p>
                                        <p className="font-medium">{reportToApprove['CÔNG ĐOẠN']}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">KHỐI LƯỢNG:</p>
                                        <p className="font-medium">{reportToApprove['KHỐI LƯỢNG']}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-500">NHÂN SỰ THAM GIA:</p>
                                        <p className="font-medium">{reportToApprove['NHÂN SỰ THAM GIA']}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">NGƯỜI NHẬP:</p>
                                        <p className="font-medium">{reportToApprove['NGƯỜI NHẬP']}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">GHI CHÚ:</p>
                                        <p className="font-medium">{reportToApprove['GHI CHÚ'] || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    onClick={() => handleApprove(false)}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Từ chối
                                </button>
                                <button
                                    onClick={() => handleApprove(true)}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                                >
                                    <Check className="h-4 w-4" />
                                    Duyệt
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Container */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </div>
    );
};

export default ReportManagement;