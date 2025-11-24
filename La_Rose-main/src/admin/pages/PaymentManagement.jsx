import React, { useState, useEffect } from 'react';
import bookingService from '../services/booking.service';
import additionalServiceService from '../../services/additionalService.service';

const PaymentManagement = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [providerFilter, setProviderFilter] = useState('all');
    const [searchCode, setSearchCode] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [bookingServices, setBookingServices] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState({});

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Sử dụng endpoint mới từ backend
            const params = {
                page: page,
                size: 20,
                sortBy: 'createdAt',
                sortDirection: 'desc'
            };
            
            // Thêm filter status nếu có
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }
            
            // Thêm filter provider nếu có
            if (providerFilter !== 'all') {
                params.provider = providerFilter;
            }

            const response = await bookingService.getAllTransactions(params);
            let transactions = response.content || [];
            
            // Lọc theo mã đơn ở frontend (vì backend chưa có search theo bookingCode)
            // Lưu ý: Khi search, totalPages sẽ không chính xác vì filter ở frontend
            if (searchCode.trim() !== '') {
                transactions = transactions.filter(t => {
                    const bookingCode = t.bookingDTO?.bookingCode || '';
                    return bookingCode.toLowerCase().includes(searchCode.toLowerCase().trim());
                });
                // Khi search, tính lại totalPages dựa trên kết quả đã filter
                // Nhưng vì chỉ filter trên 1 trang, nên chỉ hiển thị 1 trang
                setTotalPages(transactions.length > 0 ? 1 : 0);
            } else {
                setTotalPages(response.totalPages || 0);
            }

            setTransactions(transactions);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError('Lỗi khi tải danh sách thanh toán: ' + (err.response?.data?.message || err.message || 'Vui lòng thử lại'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [page, statusFilter, providerFilter, searchCode]);

    const handleViewDetail = async (transaction) => {
        setDetailLoading(true);
        setSelectedTransaction(transaction);
        setShowDetailModal(true);
        try {
            // Fetch services nếu có booking
            if (transaction.bookingDTO?.id) {
                const services = await additionalServiceService.getServicesByBookingId(transaction.bookingDTO.id).catch(() => []);
                setBookingServices(services || []);
            } else {
                setBookingServices([]);
            }
        } catch (err) {
            console.error('Error fetching details:', err);
            setBookingServices([]);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCloseDetail = () => {
        setShowDetailModal(false);
        setSelectedTransaction(null);
        setBookingServices([]);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount || 0);
    };

    const getStatusLabel = (status) => {
        const statusMap = {
            'initiated': 'Đang xử lý',
            'success': 'Thành công',
            'failed': 'Thất bại',
            'refunded': 'Đã hoàn tiền',
            'REFUNDED': 'Đã hoàn tiền'
        };
        // Case-insensitive lookup
        const statusLower = status?.toLowerCase();
        return statusMap[status] || statusMap[statusLower] || status || 'N/A';
    };

    const handleUpdateStatus = async (transactionId, newStatus) => {
        if (!window.confirm(`Bạn có chắc chắn muốn cập nhật trạng thái thanh toán thành "${getStatusLabel(newStatus)}"?`)) {
            return;
        }

        setUpdatingStatus(prev => ({ ...prev, [transactionId]: true }));
        try {
            // Gọi API cập nhật trạng thái transaction
            await bookingService.updateTransactionStatus(transactionId, newStatus);
            alert('Cập nhật trạng thái thanh toán thành công!');
            fetchTransactions(); // Refresh list
        } catch (err) {
            console.error('Error updating transaction status:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Vui lòng thử lại';
            const statusCode = err.response?.status;
            
            if (statusCode === 404) {
                alert('Lỗi: Endpoint cập nhật transaction status chưa được tạo trong backend. Vui lòng liên hệ admin để thêm endpoint này.');
            } else if (statusCode === 405) {
                alert('Lỗi: Phương thức HTTP không được hỗ trợ. Vui lòng liên hệ admin.');
            } else {
                alert('Lỗi khi cập nhật trạng thái: ' + errorMessage);
            }
        } finally {
            setUpdatingStatus(prev => ({ ...prev, [transactionId]: false }));
        }
    };

    const getStatusColor = (status) => {
        if (!status) return 'bg-gray-100 text-gray-800';
        
        const statusLower = status.toLowerCase();
        const colorMap = {
            'initiated': 'bg-yellow-100 text-yellow-800',
            'success': 'bg-green-100 text-green-800',
            'failed': 'bg-red-100 text-red-800',
            'refunded': 'bg-blue-100 text-blue-800'
        };
        
        // Xử lý cả REFUNDED (uppercase) và refunded (lowercase)
        if (statusLower === 'refunded' || status === 'REFUNDED') {
            return 'bg-blue-100 text-blue-800';
        }
        
        return colorMap[statusLower] || colorMap[status] || 'bg-gray-100 text-gray-800';
    };

    const getProviderLabel = (provider) => {
        const providerMap = {
            'VNPAY': 'VNPay',
            'CASH': 'Tiền mặt'
        };
        return providerMap[provider] || provider || 'N/A';
    };

    if (loading && transactions.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-playfair font-bold text-gray-800">Quản lý thanh toán</h2>
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mã đơn..."
                        value={searchCode}
                        onChange={(e) => {
                            setSearchCode(e.target.value);
                            setPage(0);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select 
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(0);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="initiated">Đang xử lý</option>
                        <option value="success">Thành công</option>
                        <option value="failed">Thất bại</option>
                        <option value="refunded">Đã hoàn tiền</option>
                    </select>
                    <select 
                        value={providerFilter}
                        onChange={(e) => {
                            setProviderFilter(e.target.value);
                            setPage(0);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tất cả phương thức</option>
                        <option value="VNPAY">VNPay</option>
                        <option value="CASH">Tiền mặt</option>
                    </select>
                    <button 
                        onClick={fetchTransactions}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <i className="fas fa-sync-alt mr-2"></i>Làm mới
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Mã giao dịch</th>
                            <th scope="col" className="px-6 py-3">Mã đơn</th>
                            <th scope="col" className="px-6 py-3">Khách hàng</th>
                            <th scope="col" className="px-6 py-3">Phương thức</th>
                            <th scope="col" className="px-6 py-3">Số tiền</th>
                            <th scope="col" className="px-6 py-3">Trạng thái</th>
                            <th scope="col" className="px-6 py-3">Ngày tạo</th>
                            <th scope="col" className="px-6 py-3">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                    Không có giao dịch nào
                                </td>
                            </tr>
                        ) : (
                            transactions.map(transaction => (
                                <tr key={transaction.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-blue-600">
                                        {transaction.providerTransactionId || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-700">
                                        {transaction.bookingDTO?.bookingCode || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {transaction.userDTO?.fullName || 
                                         transaction.bookingDTO?.userFullName || 
                                         transaction.bookingDTO?.userDTO?.fullName || 
                                         'N/A'}
                                        {(transaction.userDTO?.email || 
                                          transaction.bookingDTO?.userEmail || 
                                          transaction.bookingDTO?.userDTO?.email) && (
                                            <div className="text-xs text-gray-500">
                                                {transaction.userDTO?.email || 
                                                 transaction.bookingDTO?.userEmail || 
                                                 transaction.bookingDTO?.userDTO?.email}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getProviderLabel(transaction.provider)}
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-green-600">
                                        {formatCurrency(transaction.amount)}₫
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={transaction.status || ''}
                                            onChange={(e) => handleUpdateStatus(transaction.id, e.target.value)}
                                            disabled={updatingStatus[transaction.id]}
                                            className={`text-xs px-2 py-1 rounded border ${getStatusColor(transaction.status)} ${
                                                updatingStatus[transaction.id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                            }`}
                                        >
                                            <option value="initiated">Đang xử lý</option>
                                            <option value="success">Thành công</option>
                                            <option value="failed">Thất bại</option>
                                            <option value="refunded">Đã hoàn tiền</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {formatDate(transaction.createdAt)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => handleViewDetail(transaction)} 
                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs px-2 py-1 whitespace-nowrap"
                                            title="Xem chi tiết"
                                        >
                                            <i className="fas fa-info-circle"></i>
                                            <span>Chi tiết</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                        onClick={() => setPage(0)}
                        disabled={page === 0}
                        className="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        title="Trang đầu"
                    >
                        «
                    </button>
                    <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Trước
                    </button>
                    <span className="px-4 py-2 text-gray-700">
                        Trang {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Sau
                    </button>
                    <button
                        onClick={() => setPage(totalPages - 1)}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        title="Trang cuối"
                    >
                        »
                    </button>
                </div>
            )}

            {/* Modal chi tiết */}
            {showDetailModal && selectedTransaction && (
                <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50" onClick={handleCloseDetail}>
                    <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-gray-800">Chi tiết giao dịch</h3>
                            <button
                                onClick={handleCloseDetail}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {detailLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Thông tin giao dịch */}
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-3 text-lg">Thông tin giao dịch</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Mã giao dịch:</span>
                                            <span className="font-medium font-mono">{selectedTransaction.providerTransactionId || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Phương thức thanh toán:</span>
                                            <span className="font-medium">{getProviderLabel(selectedTransaction.provider)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Trạng thái:</span>
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                                                {getStatusLabel(selectedTransaction.status)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Số tiền:</span>
                                            <span className="font-semibold text-lg text-green-600">{formatCurrency(selectedTransaction.amount)}₫</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Ngày tạo:</span>
                                            <span className="font-medium">{formatDate(selectedTransaction.createdAt)}</span>
                                        </div>
                                        {selectedTransaction.updatedAt && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Ngày cập nhật:</span>
                                                <span className="font-medium">{formatDate(selectedTransaction.updatedAt)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Thông tin đơn đặt phòng */}
                                {selectedTransaction.bookingDTO && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3 text-lg">Thông tin đơn đặt phòng</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Mã đơn:</span>
                                                <span className="font-medium font-mono">{selectedTransaction.bookingDTO.bookingCode || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Trạng thái:</span>
                                                <span className="font-medium">{selectedTransaction.bookingDTO.status || 'N/A'}</span>
                                            </div>
                                            {selectedTransaction.bookingDTO.checkIn && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Ngày nhận phòng:</span>
                                                    <span className="font-medium">{formatDate(selectedTransaction.bookingDTO.checkIn)}</span>
                                                </div>
                                            )}
                                            {selectedTransaction.bookingDTO.checkOut && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Ngày trả phòng:</span>
                                                    <span className="font-medium">{formatDate(selectedTransaction.bookingDTO.checkOut)}</span>
                                                </div>
                                            )}
                                            {selectedTransaction.bookingDTO.roomTitle && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Phòng:</span>
                                                    <span className="font-medium">{selectedTransaction.bookingDTO.roomTitle}</span>
                                                </div>
                                            )}
                                            {selectedTransaction.bookingDTO.roomTypeName && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Loại phòng:</span>
                                                    <span className="font-medium">{selectedTransaction.bookingDTO.roomTypeName}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Thông tin khách hàng */}
                                {selectedTransaction.userDTO && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3 text-lg">Thông tin khách hàng</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Họ tên:</span>
                                                <span className="font-medium">{selectedTransaction.userDTO.fullName || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Email:</span>
                                                <span className="font-medium">{selectedTransaction.userDTO.email || 'N/A'}</span>
                                            </div>
                                            {selectedTransaction.userDTO.phone && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Số điện thoại:</span>
                                                    <span className="font-medium">{selectedTransaction.userDTO.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Dịch vụ bổ sung */}
                                {bookingServices.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3 text-lg">Dịch vụ bổ sung</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="space-y-2">
                                                {bookingServices.map((service, index) => (
                                                    <div key={index} className="flex justify-between items-center border-b pb-2">
                                                        <div>
                                                            <span className="font-medium">{service.name || service.serviceName}</span>
                                                            <span className="text-sm text-gray-500 ml-2">x{service.quantity || 1}</span>
                                                        </div>
                                                        <span className="font-medium text-green-600">{formatCurrency(service.totalPrice || service.price)}₫</span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between items-center pt-2 border-t font-semibold">
                                                    <span>Tổng dịch vụ:</span>
                                                    <span className="text-green-600">
                                                        {formatCurrency(bookingServices.reduce((sum, s) => sum + Number(s.totalPrice || s.price || 0), 0))}₫
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        onClick={handleCloseDetail}
                                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentManagement;

