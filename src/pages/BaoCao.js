import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash, Search, ChevronLeft, ChevronRight, Filter, Download, Check, Upload, Clock, X, Calendar } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';
import * as XLSX from 'xlsx';
import Select from 'react-select';

// Date formatting utilities
const formatDateToString = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

// Parse date for filtering
const parseVNDate = (dateString) => {
  if (!dateString) return null;
  if (dateString.includes('/')) {
    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Improved dashboard component with animated metrics
const ProductionDashboard = ({ reports, congDoanList }) => {
    const [timeView, setTimeView] = useState('day');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedMonth, setSelectedMonth] = useState(new Date());
  
    const handleDateChange = (e) => {
      // Create date at noon to avoid timezone issues
      const date = new Date(e.target.value + 'T12:00:00');
      setSelectedDate(date);
    };
    
    const handleMonthChange = (e) => {
      const [year, month] = e.target.value.split('-');
      // Create date at noon on the first day of month to avoid timezone issues
      const date = new Date(year, month - 1, 1, 12, 0, 0);
      setSelectedMonth(date);
    };
  
    const dashboardData = useMemo(() => {
      const result = {
        byDay: {},
        byMonth: {},
        all: { total: 0, stages: {} }
      };
  
      congDoanList.forEach(stage => {
        result.all.stages[stage] = 0;
      });
  
      reports.forEach(report => {
        if (!report['NGÀY'] || !report['CÔNG ĐOẠN'] || !report['KHỐI LƯỢNG']) return;
  
        // Create date and set hours to noon to avoid timezone issues
        const reportDate = new Date(report['NGÀY']);
        reportDate.setHours(12, 0, 0, 0);
        
        // Format the date key consistently with how we'll look it up
        const dateKey = formatDateToString(reportDate);
        const monthKey = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;
        const stage = report['CÔNG ĐOẠN'];
  
        const quantityStr = report['KHỐI LƯỢNG'].toString().replace(/[^\d.-]/g, '');
        const quantity = parseFloat(quantityStr) || 0;
  
        if (!stage || isNaN(quantity)) return;
  
        // Initialize if needed
        if (!result.byDay[dateKey]) {
          result.byDay[dateKey] = { total: 0, stages: {} };
          congDoanList.forEach(s => {
            result.byDay[dateKey].stages[s] = 0;
          });
        }
  
        if (!result.byMonth[monthKey]) {
          result.byMonth[monthKey] = { total: 0, stages: {} };
          congDoanList.forEach(s => {
            result.byMonth[monthKey].stages[s] = 0;
          });
        }
  
        // Add quantities
        result.byDay[dateKey].stages[stage] += quantity;
        result.byDay[dateKey].total += quantity;
  
        result.byMonth[monthKey].stages[stage] += quantity;
        result.byMonth[monthKey].total += quantity;
  
        result.all.stages[stage] += quantity;
        result.all.total += quantity;
      });
  
      return result;
    }, [reports, congDoanList]);
  
    const currentData = useMemo(() => {
      if (timeView === 'day') {
        // Format the selected date consistently with how we stored it
        const dateKey = formatDateToString(selectedDate);
        
        // Debug output to check the keys
        console.log('Looking for date key:', dateKey);
        console.log('Available date keys:', Object.keys(dashboardData.byDay));
        
        return dashboardData.byDay[dateKey] || { total: 0, stages: {} };
      } else if (timeView === 'month') {
        const monthKey = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;
        return dashboardData.byMonth[monthKey] || { total: 0, stages: {} };
      } else {
        return dashboardData.all;
      }
    }, [timeView, selectedDate, selectedMonth, dashboardData]);
  
    return (
      <div className="bg-white rounded-lg shadow p-5 mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-800">Tổng hợp sản lượng</h2>
          <div className="flex flex-wrap items-center gap-3">
            {timeView === 'day' && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Calendar className="w-4 h-4 text-gray-500" />
                </div>
                <input
                  type="date"
                  value={formatDateToString(selectedDate)}
                  onChange={handleDateChange}
                  className="pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}
  
            {timeView === 'month' && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Calendar className="w-4 h-4 text-gray-500" />
                </div>
                <input
                  type="month"
                  value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
                  onChange={handleMonthChange}
                  className="pl-10 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setTimeView('day')}
                className={`px-4 py-2 text-sm font-medium ${timeView === 'day' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300 rounded-l-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
              >
                Theo ngày
              </button>
              <button
                onClick={() => setTimeView('month')}
                className={`px-4 py-2 text-sm font-medium ${timeView === 'month' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border-t border-b border-gray-300 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
              >
                Theo tháng
              </button>
              <button
                onClick={() => setTimeView('all')}
                className={`px-4 py-2 text-sm font-medium ${timeView === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-300 rounded-r-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500`}
              >
                Tổng cộng
              </button>
            </div>
          </div>
        </div>
  
        {/* Total production card */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-lg p-5">
            <p className="text-sm text-indigo-600 mb-1">Tổng sản lượng {timeView === 'day' ? 'ngày' : timeView === 'month' ? 'tháng' : ''}</p>
            <h3 className="text-3xl font-bold text-indigo-700 mb-2">
              {currentData.total.toFixed(2)} {currentData.total > 0 ? 'khối' : ''}
            </h3>
            <p className="text-sm text-indigo-600">
              {timeView === 'day'
                ? `Ngày ${selectedDate.toLocaleDateString('vi-VN')}`
                : timeView === 'month'
                  ? `Tháng ${selectedMonth.getMonth() + 1}/${selectedMonth.getFullYear()}`
                  : 'Tổng tất cả các ngày'}
            </p>
          </div>
        </div>
  
        {/* Production by stage - redesigned cards */}
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Chi tiết theo công đoạn</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {congDoanList.map((stage, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
              <h4 className="text-md font-medium text-gray-700 mb-2 truncate" title={stage}>{stage}</h4>
              <p className="text-2xl font-bold text-gray-800 mb-3">
                {(currentData.stages[stage] || 0).toFixed(2)} {currentData.stages[stage] > 0 ? 'khối' : ''}
              </p>
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 mb-2 text-xs flex rounded-full bg-gray-200">
                  <div
                    style={{
                      width: `${currentData.total > 0 ? (currentData.stages[stage] / currentData.total) * 100 : 0}%`
                    }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500 ease-in-out"
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  {currentData.total > 0
                    ? `${((currentData.stages[stage] || 0) / currentData.total * 100).toFixed(1)}%`
                    : '0%'} của tổng
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

// Improved pagination component with better styling
const Pagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex justify-center items-center space-x-2 mt-6">
    <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'}`}
    >
      <ChevronLeft className="h-5 w-5" />
    </button>

    <div className="flex space-x-1">
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        let pageNum;
        if (totalPages <= 5) {
          pageNum = i + 1;
        } else if (currentPage <= 3) {
          pageNum = i + 1;
        } else if (currentPage >= totalPages - 2) {
          pageNum = totalPages - 4 + i;
        } else {
          pageNum = currentPage - 2 + i;
        }
        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`w-8 h-8 flex items-center justify-center rounded-md ${
              currentPage === pageNum 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-700 hover:bg-indigo-50'
            }`}
          >
            {pageNum}
          </button>
        );
      })}
    </div>

    <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'}`}
    >
      <ChevronRight className="h-5 w-5" />
    </button>

    <span className="text-sm text-gray-600 ml-2">
      Trang {currentPage} / {totalPages || 1}
    </span>
  </div>
);

const ReportManagement = () => {
  // State Management - core data
  const [reports, setReports] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [congDoanList, setCongDoanList] = useState([
    "Cắt thô", "Bào, lựa phôi", "Finger ghép dọc 1", "Finger ghép dọc 2",
    "Bào tinh ghép ngang", "Trám trít", "Chà nhám - kiểm hàng", "Nhập kho thành phẩm"
  ]);

  // State - UI controls
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

  // State - modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showAddCongDoanModal, setShowAddCongDoanModal] = useState(false);
  const [reportToApprove, setReportToApprove] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [newCongDoan, setNewCongDoan] = useState('');

  // Default empty report
  const emptyReport = {
    ID: '',
    'NGÀY': new Date(),
    'CÔNG ĐOẠN': '',
    'KHỐI LƯỢNG': '',
    'NHÂN SỰ THAM GIA': [],
    'GHI CHÚ': '',
    'NGƯỜI NHẬP': '',
    'TRẠNG THÁI': 'Chờ duyệt',
    'NGƯỜI DUYỆT': ''
  };

  const [currentReport, setCurrentReport] = useState(emptyReport);
  
  const handleFilterDateChange = (field, value) => {
    if (value) {
      const date = new Date(value);
      setFilters(prev => ({
        ...prev,
        [field]: date
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };
  
  // Data fetching
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

  const fetchCongDoanList = async () => {
    try {
      // If API exists for fetching stages
      // const response = await authUtils.apiRequest('CONGDOAN', 'Find', {});
      // setCongDoanList(response.map(item => item.Ten));
    } catch (error) {
      console.error('Error fetching cong doan list:', error);
    }
  };

  // Report modal functions
  const handleOpen = useCallback((report = null) => {
    if (report) {
      // Transform string to array for react-select
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
      // Get current user for new report
      const currentUser = authUtils.getUserData();
      setCurrentReport({
        ...emptyReport,
        'NGƯỜI NHẬP': currentUser?.['Họ và Tên'] || ''
      });
    }
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setCurrentReport(emptyReport);
  }, [emptyReport]);

  // Form handlers
  const handleInputChange = useCallback((field, value) => {
    setCurrentReport(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleDateChange = useCallback((date) => {
    setCurrentReport(prev => ({
      ...prev,
      'NGÀY': date
    }));
  }, []);

  const handleStaffChange = useCallback((selectedOptions) => {
    setCurrentReport(prev => ({
      ...prev,
      'NHÂN SỰ THAM GIA': selectedOptions || []
    }));
  }, []);

  // Report validation
  const validateReport = useCallback((report) => {
    const errors = [];
    if (!report['CÔNG ĐOẠN']) errors.push('CÔNG ĐOẠN không được để trống');
    if (!report['KHỐI LƯỢNG']) errors.push('KHỐI LƯỢNG không được để trống');
    if (!report['NGÀY']) errors.push('NGÀY không được để trống');
    if (!report['NGƯỜI NHẬP']) errors.push('NGƯỜI NHẬP không được để trống');
    return errors;
  }, []);

  // Save report
  const handleSave = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const errors = validateReport(currentReport);
      if (errors.length > 0) {
        toast.error(errors.join('\n'));
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
        // Edit existing report
        await authUtils.apiRequest('BC', 'Edit', {
          "Rows": [reportData]
        });
        toast.success('Cập nhật báo cáo thành công!');
      } else {
        // Create new report
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

  // Delete report
  const handleDelete = async (ID) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) return;

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
  };

  // Approval functions
  const openApprovalModal = useCallback((report) => {
    setReportToApprove(report);
    setShowApprovalModal(true);
  }, []);

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

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedReports.length === 0) {
      toast.warning('Vui lòng chọn báo cáo để xóa');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedReports.length} báo cáo đã chọn?`)) return;

    try {
      await Promise.all(
        selectedReports.map(id =>
          authUtils.apiRequest('BC', 'Delete', {
            "Rows": [{ "ID": id }]
          })
        )
      );

      toast.success('Xóa báo cáo thành công!');
      setSelectedReports([]);
      await fetchReports();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa báo cáo');
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

  // Import functions
  const handleImportFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
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

        // Extract headers and validate required columns
        const headers = jsonData[0];
        const requiredColumns = ['NGÀY', 'CÔNG ĐOẠN', 'KHỐI LƯỢNG', 'NHÂN SỰ THAM GIA', 'NGƯỜI NHẬP'];
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

          // Get existing reports for ID generation
          const existingReports = await authUtils.apiRequest('BC', 'Find', {});
          const maxID = existingReports.reduce((max, report) => {
            const id = parseInt(report.ID.replace('BC', '')) || 0;
            return id > max ? id : max;
          }, 0);

          // Process data for import
          let newIdCounter = maxID + 1;
          const currentUser = authUtils.getCurrentUser();
          const currentUserName = currentUser?.displayName || currentUser?.email || '';

          // Validate and prepare data
          const invalidRows = [];
          const validatedData = [];

          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];

            // Basic validation
            if (!row['CÔNG ĐOẠN'] || !row['KHỐI LƯỢNG'] || !row['NGÀY']) {
              invalidRows.push(i + 2); // +2 for 0-indexing and header row
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
            return;
          }

          // Import in batches to avoid timeout
          const batchSize = 25;
          let successCount = 0;

          for (let i = 0; i < validatedData.length; i += batchSize) {
            const batch = validatedData.slice(i, i + batchSize);
            try {
              await authUtils.apiRequest('BC', 'Add', { "Rows": batch });
              successCount += batch.length;
            } catch (error) {
              console.error('Error importing batch:', error);
            }
          }

          toast.success(`Đã nhập thành công ${successCount} báo cáo`);
          await fetchReports();
          setShowImportModal(false);
          setImportFile(null);
          setImportPreview([]);
        } catch (error) {
          console.error('Error processing import:', error);
          toast.error('Có lỗi xảy ra khi xử lý dữ liệu');
        } finally {
          toast.dismiss('importing');
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

  const handleAddCongDoan = async () => {
    if (!newCongDoan.trim()) {
      toast.error('Tên công đoạn không được để trống');
      return;
    }

    // Check if stage already exists
    if (congDoanList.includes(newCongDoan.trim())) {
      toast.error('Công đoạn này đã tồn tại');
      return;
    }

    try {
      // If API exists to add stage
      // await authUtils.apiRequest('CONGDOAN', 'Add', {
      //    "Rows": [{ "Ten": newCongDoan }]
      // });

      // Update local state
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
    XLSX.writeFile(wb, 'mau_nhap_bao_cao.xlsx');
  };

  // Filtering and pagination logic
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch =
        report['CÔNG ĐOẠN']?.toLowerCase().includes(search.toLowerCase()) ||
        report.ID?.toLowerCase().includes(search.toLowerCase());

      const matchesCongDoan = !filters.congDoan || report['CÔNG ĐOẠN'] === filters.congDoan;
      const matchesTrangThai = !filters.trangThai || report['TRẠNG THÁI'] === filters.trangThai;

      // Date filtering
      let dateMatches = true;
      if (filters.startDate || filters.endDate) {
        const reportDate = parseVNDate(report['NGÀY']);

        // Đảm bảo filters.startDate và filters.endDate cũng đặt giờ về 00:00:00
        const startDate = filters.startDate ? new Date(filters.startDate.setHours(0, 0, 0, 0)) : null;
        const endDate = filters.endDate ? new Date(filters.endDate.setHours(0, 0, 0, 0)) : null;

        if (startDate && endDate) {
          dateMatches = reportDate >= startDate && reportDate <= endDate;
        } else if (startDate) {
          dateMatches = reportDate >= startDate;
        } else if (endDate) {
          dateMatches = reportDate <= endDate;
        }
      }
      return matchesSearch && matchesCongDoan && matchesTrangThai && dateMatches;
    });
  }, [reports, search, filters]);

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredReports.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredReports, currentPage, itemsPerPage]);

  // Status badge helper
  const getStatusBadgeColor = useCallback((status) => {
    switch (status) {
      case 'Đã duyệt':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'Từ chối':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'Chờ duyệt':
      default:
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    }
  }, []);

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className=" mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Quản lý Báo Cáo Sản Xuất</h1>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? "Ẩn bộ lọc" : "Bộ lọc"}
              </button>

              {/* Import button */}
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4" />
                Nhập Excel
              </button>

              {selectedReports.length > 0 && (
                <>
                  <button
                    onClick={handleExportSelected}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Xuất file ({selectedReports.length})
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Trash className="w-4 h-4" />
                    Xóa ({selectedReports.length})
                  </button>
                </>
              )}
              <button
                onClick={() => handleOpen()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Thêm báo cáo
              </button>
            </div>
          </div>

          {/* Filter Section */}
          {showFilters && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Công đoạn</label>
                  <select
                    value={filters.congDoan}
                    onChange={(e) => setFilters({ ...filters, congDoan: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Tất cả công đoạn</option>
                    {Array.from(new Set(reports.map(r => r['CÔNG ĐOẠN']))).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={filters.trangThai}
                    onChange={(e) => setFilters({ ...filters, trangThai: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="Chờ duyệt">Chờ duyệt</option>
                    <option value="Đã duyệt">Đã duyệt</option>
                    <option value="Từ chối">Từ chối</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khoảng thời gian</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Calendar className="w-4 h-4 text-gray-500" />
                      </div>
                      <input
                        type="date"
                        value={filters.startDate ? formatDateToString(filters.startDate) : ''}
                        onChange={(e) => handleFilterDateChange('startDate', e.target.value)}
                        className="pl-10 p-2 border rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Từ ngày"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Calendar className="w-4 h-4 text-gray-500" />
                      </div>
                      <input
                        type="date"
                        value={filters.endDate ? formatDateToString(filters.endDate) : ''}
                        onChange={(e) => handleFilterDateChange('endDate', e.target.value)}
                        className="pl-10 p-2 border rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Đến ngày"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({
                      congDoan: '',
                      trangThai: '',
                      startDate: null,
                      endDate: null
                    })}
                    className="w-full px-4 py-2 text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search Section */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã hoặc công đoạn..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Dashboard */}
          <ProductionDashboard reports={reports} congDoanList={congDoanList} />

          {/* Table Section */}
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="p-4 text-left">
                        <div className="flex items-center">
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
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">ID</th>
                      <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Ngày</th>
                      <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Công đoạn</th>
                      <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Khối lượng</th>
                      <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Nhân sự</th>
                      <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Người nhập</th>
                      <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Trạng thái</th>
                      <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Người duyệt</th>
                      <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.length > 0 ? (
                      currentItems.map((report) => (
                        <tr key={report.ID} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center">
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
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{report.ID}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {new Date(report['NGÀY']).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{report['CÔNG ĐOẠN']}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-medium">{report['KHỐI LƯỢNG']}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className="max-w-xs truncate" title={report['NHÂN SỰ THAM GIA']}>
                              {report['NHÂN SỰ THAM GIA']}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{report['NGƯỜI NHẬP']}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(report['TRẠNG THÁI'])}`}>
                              {report['TRẠNG THÁI']}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{report['NGƯỜI DUYỆT'] || '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-1">
                              {report['TRẠNG THÁI'] === 'Chờ duyệt' && (
                                <button
                                  onClick={() => openApprovalModal(report)}
                                  className="text-green-600 hover:text-green-900 p-1.5 rounded-full hover:bg-green-50"
                                  title="Duyệt báo cáo"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpen(report)}
                                className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-full hover:bg-indigo-50"
                                title="Sửa báo cáo"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(report.ID)}
                                className="text-red-600 hover:text-red-900 p-1.5 rounded-full hover:bg-red-50"
                                title="Xóa báo cáo"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="px-4 py-6 text-center text-sm text-gray-500">
                          Không tìm thấy báo cáo nào phù hợp với tiêu chí tìm kiếm
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {currentItems.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      {/* Add/Edit Report Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                {currentReport.ID ? 'Cập nhật báo cáo' : 'Thêm báo cáo mới'}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày báo cáo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Calendar className="w-4 h-4 text-gray-500" />
                    </div>
                    <input
                      type="date"
                      value={formatDateToString(currentReport['NGÀY'])}
                      onChange={(e) => handleDateChange(new Date(e.target.value))}
                      className="pl-10 p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Công đoạn
                    <button
                      type="button"
                      onClick={() => setShowAddCongDoanModal(true)}
                      className="ml-2 text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      + Thêm mới
                    </button>
                  </label>
                  <select
                    className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khối lượng</label>
                  <input
                    type="text"
                    placeholder="Nhập khối lượng"
                    className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                    value={currentReport['KHỐI LƯỢNG']}
                    onChange={(e) => handleInputChange('KHỐI LƯỢNG', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Người nhập</label>
                  <input
                    type="text"
                    placeholder="Nhập tên người nhập báo cáo"
                    className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                    value={currentReport['NGƯỜI NHẬP']}
                    onChange={(e) => handleInputChange('NGƯỜI NHẬP', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhân sự tham gia</label>
                <Select
                  isMulti
                  options={staffList}
                  value={currentReport['NHÂN SỰ THAM GIA']}
                  onChange={handleStaffChange}
                  placeholder="Chọn nhân sự tham gia..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: '#d1d5db',
                      borderRadius: '0.5rem',
                      padding: '2px',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: '#9ca3af',
                      }
                    })
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  placeholder="Nhập ghi chú (nếu có)"
                  rows={3}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  value={currentReport['GHI CHÚ']}
                  onChange={(e) => handleInputChange('GHI CHÚ', e.target.value)}
                />
              </div>

              {currentReport.ID && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                    <div className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusBadgeColor(currentReport['TRẠNG THÁI'])}`}>
                      {currentReport['TRẠNG THÁI']}
                    </div>
                  </div>
                  {currentReport['NGƯỜI DUYỆT'] && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Người duyệt</label>
                      <div className="px-3 py-2 rounded-lg bg-gray-100 text-sm">
                        {currentReport['NGƯỜI DUYỆT']}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-indigo-600 text-white rounded-lg ${isSubmitting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-indigo-700'
                    } flex items-center gap-2 transition-colors shadow-sm`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang lưu...
                    </>
                  ) : 'Lưu báo cáo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Excel Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-5">
              <h2 className="text-xl font-bold text-gray-800">Nhập báo cáo từ Excel</h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportPreview([]);
                }}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5">
              <p className="text-sm text-gray-600 mb-3">
                Tải lên file Excel (.xlsx, .xls) hoặc CSV có chứa dữ liệu báo cáo.
                File cần có các cột: <span className="font-medium">NGÀY, CÔNG ĐOẠN, KHỐI LƯỢNG, NHÂN SỰ THAM GIA, NGƯỜI NHẬP</span>.
              </p>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
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
                  className="px-4 py-2 text-indigo-600 border border-indigo-300 bg-indigo-50 rounded-lg hover:bg-indigo-100 flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  Tải mẫu nhập
                </button>
              </div>
              {importFile && (
                <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-700 flex items-center">
                  <div className="mr-2 flex-shrink-0">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 9L15 11L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18 4V5.4C18 5.96005 18 6.24008 17.891 6.45399C17.7951 6.64215 17.6422 6.79513 17.454 6.89104C17.2401 7 16.9601 7 16.4 7H7.6C7.03995 7 6.75992 7 6.54601 6.89104C6.35785 6.79513 6.20487 6.64215 6.10896 6.45399C6 6.24008 6 5.96005 6 5.4V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 14L4 16C4 17.8856 4 18.8284 4.58579 19.4142C5.17157 20 6.11438 20 8 20H16C17.8856 20 18.8284 20 19.4142 19.4142C20 18.8284 20 17.8856 20 16V10C20 8.11438 20 7.17157 19.4142 6.58579C18.8284 6 17.8856 6 16 6L8 6C6.11438 6 5.17157 6 4.58579 6.58579C4 7.17157 4 8.11438 4 10L4 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 12H16.002V12.002H16V12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Đã chọn: {importFile.name}</div>
                    <div className="text-xs text-indigo-600 mt-1">Kích thước: {(importFile.size / 1024).toFixed(2)} KB</div>
                  </div>
                </div>
              )}
            </div>

            {importPreview.length > 0 && (
              <div className="mb-5">
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

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportPreview([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                disabled={isImporting}
              >
                Hủy
              </button>
              <button
                onClick={handleImportData}
                disabled={!importFile || isImporting}
                className={`px-4 py-2 bg-indigo-600 text-white rounded-lg ${(!importFile || isImporting)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-indigo-700'
                  } flex items-center gap-2 transition-colors shadow-sm`}
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

      {/* Add Stage Modal */}
      {showAddCongDoanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-5">
              <h2 className="text-xl font-bold text-gray-800">Thêm công đoạn mới</h2>
              <button
                onClick={() => setShowAddCongDoanModal(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên công đoạn</label>
                <input
                  type="text"
                  value={newCongDoan}
                  onChange={(e) => setNewCongDoan(e.target.value)}
                  className="p-2.5 border border-gray-300 rounded-lg w-full focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nhập tên công đoạn mới"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAddCongDoanModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddCongDoan}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-5">
              <h2 className="text-xl font-bold text-gray-800">Duyệt báo cáo</h2>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setReportToApprove(null);
                }}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">ID:</p>
                    <p className="font-medium">{reportToApprove.ID}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Ngày:</p>
                    <p className="font-medium">{new Date(reportToApprove['NGÀY']).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Công đoạn:</p>
                    <p className="font-medium">{reportToApprove['CÔNG ĐOẠN']}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Khối lượng:</p>
                    <p className="font-medium">{reportToApprove['KHỐI LƯỢNG']}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Nhân sự tham gia:</p>
                    <p className="font-medium">{reportToApprove['NHÂN SỰ THAM GIA']}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Người nhập:</p>
                    <p className="font-medium">{reportToApprove['NGƯỜI NHẬP']}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Ghi chú:</p>
                    <p className="font-medium">{reportToApprove['GHI CHÚ'] || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleApprove(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors shadow-sm"
                >
                  <X className="h-4 w-4" />
                  Từ chối
                </button>
                <button
                  onClick={() => handleApprove(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors shadow-sm"
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
        theme="light"
      />
    </div>
  );
};

export default ReportManagement;