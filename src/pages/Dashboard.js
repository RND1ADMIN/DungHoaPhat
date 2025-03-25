import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
    Package, Warehouse, Factory, 
    TrendingUp, AlertTriangle, Loader2, Calendar
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { DatePicker } from "../components/ui/datepicker";
import authUtils from '../utils/authUtils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const formatQuantity = (value) => {
    if (value >= 1e6) return (value / 1e6).toFixed(1) + ' triệu';
    if (value >= 1e3) return (value / 1e3).toFixed(1) + ' nghìn';
    return value;
};

const StatCardSkeleton = () => (
    <Card className="animate-pulse">
        <CardContent className="p-4">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                    <div className="h-6 w-24 bg-gray-300 rounded"></div>
                    <div className="h-3 w-28 bg-gray-200 rounded"></div>
                </div>
                <div className="bg-gray-300 rounded-lg p-2 w-8 h-8"></div>
            </div>
        </CardContent>
    </Card>
);

const ChartSkeleton = ({ height = "h-72" }) => (
    <Card>
        <CardHeader>
            <div className="h-5 w-36 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
            <div className={`${height} bg-gray-100 rounded-lg animate-pulse flex items-center justify-center`}>
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        </CardContent>
    </Card>
);

const StatCard = ({ title, value, icon: Icon, color, percentageChange, unit }) => (
    <Card className="transition-transform duration-200 hover:scale-[1.02]">
        <CardContent className="p-4">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
                    <h3 className="text-xl font-bold text-gray-800">
                        {formatQuantity(value)} {unit}
                    </h3>
                    {percentageChange !== undefined && (
                        <p className={`text-xs mt-1 flex items-center ${percentageChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            <span className={`mr-1 ${percentageChange > 0 ? 'rotate-0' : 'rotate-180'}`}>↑</span>
                            {Math.abs(percentageChange)}% so với tháng trước
                        </p>
                    )}
                </div>
                <div className={`${color} rounded-lg p-2`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
            </div>
        </CardContent>
    </Card>
);

const InventoryDashboard = () => {
    const [allData, setAllData] = useState({
        rawMaterials: [],
        products: [],
        inventory: [],
        production: []
    });
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)),
        end: new Date()
    });
    const [chartType, setChartType] = useState('line');
    const [timeFilter, setTimeFilter] = useState('30d');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState({
        productionTrend: [],
        materialUsage: [],
        inventoryLevels: [],
        lowStockItems: [],
    });

    const handleTimeFilterChange = (value) => {
        setTimeFilter(value);
        const end = new Date();
        let start = new Date();

        switch (value) {
            case '7d':
                start.setDate(end.getDate() - 7);
                break;
            case '30d':
                start.setDate(end.getDate() - 30);
                break;
            case '90d':
                start.setDate(end.getDate() - 90);
                break;
            case '1y':
                start.setFullYear(end.getFullYear() - 1);
                break;
        }

        setDateRange({ start, end });
    };

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const [rawMaterials, products, inventory, production] = await Promise.all([
                authUtils.apiRequest('DMHH', 'Find', {}),
                authUtils.apiRequest('DMHH', 'Find', {}),
                authUtils.apiRequest('Kho', 'Find', {}),
                authUtils.apiRequest('BC', 'Find', {})
            ]);
            setAllData({ rawMaterials, products, inventory, production });
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const processData = () => {
        try {
            // Lọc dữ liệu sản xuất theo khoảng thời gian
            const filteredProduction = allData.production.filter(item => {
                const itemDate = new Date(item['NGÀY']);
                return itemDate >= dateRange.start && itemDate <= dateRange.end;
            });

            // Tính tổng sản lượng
            const totalProduction = filteredProduction.reduce((sum, item) => 
                sum + (Number(item.SoLuong) || 0), 0
            );
            
            // Tính số lượng nguyên vật liệu và sản phẩm
            const totalRawMaterials = allData.rawMaterials.length;
            const totalProducts = allData.products.length;
            
            // Tính tổng số lượng trong kho
            const totalInventory = allData.inventory.reduce((sum, item) => 
                sum + (Number(item.SoLuongTon) || 0), 0
            );
            
            // Đếm số mặt hàng sắp hết
            const lowStockCount = allData.inventory.filter(item => 
                (Number(item.SoLuongTon) || 0) < (Number(item.MucTonToiThieu) || 10)
            ).length;

            // Tính % thay đổi sản lượng so với tháng trước
            const currentMonth = new Date().getMonth();
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            
            const currentMonthProduction = allData.production.filter(item => {
                const date = new Date(item.NgaySanXuat);
                return date.getMonth() === currentMonth;
            }).reduce((sum, item) => sum + (Number(item.SoLuong) || 0), 0);
            
            const lastMonthProduction = allData.production.filter(item => {
                const date = new Date(item.NgaySanXuat);
                return date.getMonth() === lastMonth;
            }).reduce((sum, item) => sum + (Number(item.SoLuong) || 0), 0);
            
            const productionPercentageChange = lastMonthProduction 
                ? ((currentMonthProduction - lastMonthProduction) / lastMonthProduction) * 100 
                : 0;

            setStats({
                totalRawMaterials,
                totalProducts,
                totalInventory,
                totalProduction,
                lowStockCount,
                productionPercentageChange: parseFloat(productionPercentageChange.toFixed(1))
            });

            // Xu hướng sản xuất theo ngày
            const productionByDate = filteredProduction.reduce((acc, item) => {
                const date = new Date(item.NgaySanXuat).toLocaleDateString('vi-VN');
                acc[date] = (acc[date] || 0) + Number(item.SoLuong || 0);
                return acc;
            }, {});

            const productionTrend = Object.entries(productionByDate)
                .map(([date, amount]) => ({
                    date,
                    production: amount
                }))
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            // Thống kê sử dụng nguyên vật liệu
            const materialUsageData = allData.rawMaterials.map(material => {
                const usage = filteredProduction.reduce((sum, item) => {
                    if (item.IDNguyenVatLieu === material.ID) {
                        return sum + (Number(item.SoLuongSuDung) || 0);
                    }
                    return sum;
                }, 0);
                
                return {
                    name: material.TenNguyenVatLieu,
                    usage: usage
                };
            }).sort((a, b) => b.usage - a.usage).slice(0, 5);

            // Mức tồn kho hiện tại
            const inventoryLevels = allData.inventory
                .filter(item => item.SanPhamID)
                .map(item => {
                    const product = allData.products.find(p => p.ID === item.SanPhamID);
                    return {
                        name: product ? product.TenSanPham : `Sản phẩm #${item.SanPhamID}`,
                        current: Number(item.SoLuongTon) || 0,
                        minimum: Number(item.MucTonToiThieu) || 10
                    };
                })
                .sort((a, b) => a.current - a.minimum - (b.current - b.minimum))
                .slice(0, 5);

            // Mặt hàng sắp hết trong kho
            const lowStockItems = allData.inventory
                .filter(item => (Number(item.SoLuongTon) || 0) < (Number(item.MucTonToiThieu) || 10))
                .map(item => {
                    const product = allData.products.find(p => p.ID === item.SanPhamID);
                    return {
                        name: product ? product.TenSanPham : `Sản phẩm #${item.SanPhamID}`,
                        current: Number(item.SoLuongTon) || 0,
                        minimum: Number(item.MucTonToiThieu) || 10,
                        percentage: Math.round((item.SoLuongTon / item.MucTonToiThieu) * 100)
                    };
                })
                .sort((a, b) => a.current / a.minimum - b.current / b.minimum);

            setAnalyticsData({
                productionTrend,
                materialUsage: materialUsageData,
                inventoryLevels,
                lowStockItems
            });
        } catch (error) {
            console.error('Error processing data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!allData.rawMaterials.length) {
                    const [rawMaterials, products, inventory, production] = await Promise.all([
                        authUtils.apiRequest('NguyenVatLieu', 'Find', {}),
                        authUtils.apiRequest('SanPham', 'Find', {}),
                        authUtils.apiRequest('Kho', 'Find', {}),
                        authUtils.apiRequest('SanLuong', 'Find', {})
                    ]);
                    setAllData({ rawMaterials, products, inventory, production });
                }
                processData();
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, [dateRange, allData]);

    const resetFilters = () => {
        setDateRange({
            start: new Date(new Date().setDate(new Date().getDate() - 30)),
            end: new Date()
        });
        setTimeFilter('30d');
    };

    const statCards = [
        {
            title: 'Nguyên vật liệu',
            value: stats?.totalRawMaterials || 0,
            icon: Package,
            color: 'bg-blue-500',
            unit: 'loại'
        },
        {
            title: 'Sản phẩm',
            value: stats?.totalProducts || 0,
            icon: Factory,
            color: 'bg-green-500',
            unit: 'loại'
        },
        {
            title: 'Tổng tồn kho',
            value: stats?.totalInventory || 0,
            icon: Warehouse,
            color: 'bg-orange-500',
            unit: 'đơn vị'
        },
        {
            title: 'Tổng sản lượng',
            value: stats?.totalProduction || 0,
            icon: TrendingUp,
            color: 'bg-red-500',
            unit: 'đơn vị',
            percentageChange: stats?.productionPercentageChange
        },
        {
            title: 'Sắp hết hàng',
            value: stats?.lowStockCount || 0,
            icon: AlertTriangle,
            color: 'bg-yellow-500',
            unit: 'mặt hàng'
        }
    ];

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="mx-auto space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Báo Cáo Kho & Sản Xuất
                        </h1>

                        <div className="flex flex-wrap items-center gap-4">
                            <Button variant="outline" onClick={handleRefresh}>
                                <Loader2 className="w-4 h-4 mr-2" />
                                Làm mới
                            </Button>

                            <Button variant="outline" onClick={resetFilters}>
                                Reset
                            </Button>

                            <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
                                <SelectTrigger className="w-44">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Chọn thời gian" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7d">7 ngày qua</SelectItem>
                                    <SelectItem value="30d">30 ngày qua</SelectItem>
                                    <SelectItem value="90d">90 ngày qua</SelectItem>
                                    <SelectItem value="1y">1 năm qua</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex gap-4">
                                <DatePicker
                                    selected={dateRange.start}
                                    onChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                                    className="w-36"
                                    placeholderText="Từ ngày"
                                />
                                <DatePicker
                                    selected={dateRange.end}
                                    onChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                                    className="w-36"
                                    placeholderText="Đến ngày"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {loading
                        ? Array(5).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
                        : statCards.map((stat, index) => <StatCard key={index} {...stat} />)
                    }
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {loading ? (
                        <>
                            <ChartSkeleton height="h-72" />
                            <ChartSkeleton height="h-72" />
                            <ChartSkeleton height="h-72" />
                        </>
                    ) : (
                        <>
                            <Card className="lg:col-span-2">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-semibold">
                                        Xu hướng sản lượng
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={chartType === 'line' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setChartType('line')}
                                        >
                                            Line
                                        </Button>
                                        <Button
                                            variant={chartType === 'bar' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setChartType('bar')}
                                        >
                                            Bar
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            {chartType === 'line' ? (
                                                <LineChart data={analyticsData.productionTrend}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="production"
                                                        stroke="#0088FE"
                                                        name="Sản lượng"
                                                    />
                                                </LineChart>
                                            ) : (
                                                <BarChart data={analyticsData.productionTrend}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="production" fill="#0088FE" name="Sản lượng" />
                                                </BarChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">
                                        Top 5 nguyên vật liệu sử dụng nhiều nhất
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analyticsData.materialUsage}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar dataKey="usage" fill="#00C49F" name="Lượng sử dụng" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">
                                        Mức tồn kho hiện tại
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart 
                                                data={analyticsData.inventoryLevels}
                                                layout="vertical"
                                                margin={{ left: 100 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" />
                                                <YAxis dataKey="name" type="category" width={100} />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="current" fill="#0088FE" name="Tồn kho hiện tại" />
                                                <Bar dataKey="minimum" fill="#FF8042" name="Mức tồn tối thiểu" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            Cảnh báo hàng sắp hết
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr>
                                        <th className="pb-2 font-medium text-gray-500">Sản phẩm</th>
                                        <th className="pb-2 font-medium text-gray-500">Tồn kho</th>
                                        <th className="pb-2 font-medium text-gray-500">Mức tối thiểu</th>
                                        <th className="pb-2 font-medium text-gray-500">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analyticsData.lowStockItems.map((item, index) => (
                                        <tr key={index} className="border-t border-gray-100">
                                            <td className="py-3">{item.name}</td>
                                            <td className="py-3">{item.current}</td>
                                            <td className="py-3">{item.minimum}</td>
                                            <td className="py-3">
                                                <div className="flex items-center">
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                                        <div
                                                            className={`h-2.5 rounded-full ${
                                                                item.percentage < 30 ? 'bg-red-500' : 
                                                                item.percentage < 70 ? 'bg-yellow-500' : 'bg-green-500'
                                                            }`}
                                                            style={{ width: `${item.percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <span 
                                                        className={`text-xs font-medium ${
                                                            item.percentage < 30 ? 'text-red-500' : 
                                                            item.percentage < 70 ? 'text-yellow-500' : 'text-green-500'
                                                        }`}
                                                    >
                                                        {item.percentage}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default InventoryDashboard;