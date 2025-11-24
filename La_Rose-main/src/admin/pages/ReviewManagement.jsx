import React, { useState, useEffect } from 'react';
import reviewService from '../services/review.service';

const ReviewManagement = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [responseForm, setResponseForm] = useState({ content: '' });
    const [editingResponse, setEditingResponse] = useState(null);
    const [responseLoading, setResponseLoading] = useState(false);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {
                page: page,
                size: 20
            };
            
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }

            const response = await reviewService.getAllReviews(params);
            setReviews(response.content || []);
            setTotalPages(response.totalPages || 0);
            setTotalElements(response.totalElements || 0);
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setError('Lỗi khi tải danh sách đánh giá');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [page, statusFilter]);

    const handleStatusChange = async (reviewId, newStatus) => {
        try {
            await reviewService.updateReviewStatus(reviewId, newStatus);
            setStatusDropdownOpen(null);
            fetchReviews();
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Lỗi khi cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
        }
    };

    const toggleStatusDropdown = (reviewId) => {
        setStatusDropdownOpen(statusDropdownOpen === reviewId ? null : reviewId);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.status-dropdown-container')) {
                setStatusDropdownOpen(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleDelete = async (reviewId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
            try {
                await reviewService.deleteReview(reviewId);
                fetchReviews();
            } catch (err) {
                console.error('Error deleting review:', err);
                alert('Lỗi khi xóa đánh giá: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleViewDetail = async (review) => {
        try {
            const fullReview = await reviewService.getReviewById(review.id);
            setSelectedReview(fullReview);
            setShowDetailModal(true);
        } catch (err) {
            console.error('Error fetching review details:', err);
            setSelectedReview(review);
            setShowDetailModal(true);
        }
    };

    const handleCloseDetail = () => {
        setShowDetailModal(false);
        setSelectedReview(null);
        setShowResponseModal(false);
        setResponseForm({ content: '' });
        setEditingResponse(null);
    };

    const handleOpenResponseModal = (response = null) => {
        if (response) {
            setEditingResponse(response);
            setResponseForm({ content: response.content });
        } else {
            setEditingResponse(null);
            setResponseForm({ content: '' });
        }
        setShowResponseModal(true);
    };

    const handleCloseResponseModal = () => {
        setShowResponseModal(false);
        setResponseForm({ content: '' });
        setEditingResponse(null);
    };

    const handleSubmitResponse = async () => {
        if (!responseForm.content.trim()) {
            alert('Vui lòng nhập nội dung phản hồi');
            return;
        }

        setResponseLoading(true);
        try {
            if (editingResponse) {
                await reviewService.updateResponse(editingResponse.id, responseForm.content);
            } else {
                await reviewService.createResponse(selectedReview.id, responseForm.content);
            }
            
            await fetchReviews();
            const updatedReview = await reviewService.getReviewById(selectedReview.id);
            setSelectedReview(updatedReview);
            handleCloseResponseModal();
        } catch (err) {
            console.error('Error saving response:', err);
            alert('Lỗi: ' + (err.response?.data?.message || err.message));
        } finally {
            setResponseLoading(false);
        }
    };

    const handleDeleteResponse = async (responseId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) {
            return;
        }

        try {
            await reviewService.deleteResponse(responseId);
            await fetchReviews();
            const updatedReview = await reviewService.getReviewById(selectedReview.id);
            setSelectedReview(updatedReview);
        } catch (err) {
            console.error('Error deleting response:', err);
            alert('Lỗi: ' + (err.response?.data?.message || err.message));
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusLabel = (status) => {
        const statusMap = {
            'published': 'Đã duyệt',
            'pending': 'Chờ duyệt',
            'hidden': 'Đã ẩn'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'published': 'bg-green-100 text-green-800',
            'pending': 'bg-yellow-100 text-yellow-800',
            'hidden': 'bg-gray-100 text-gray-800'
        };
        return colorMap[status] || 'bg-gray-100 text-gray-800';
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <i 
                    key={i} 
                    className={`fas fa-star ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                ></i>
            );
        }
        return stars;
    };

    if (loading && reviews.length === 0) {
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
                <h2 className="text-2xl font-playfair font-bold text-gray-800">Quản lý đánh giá</h2>
                <div className="flex items-center gap-4">
                    <select 
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(0);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="published">Đã duyệt</option>
                        <option value="pending">Chờ duyệt</option>
                        <option value="hidden">Đã ẩn</option>
                    </select>
                    <button 
                        onClick={fetchReviews}
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

            <div className="mb-4 text-sm text-gray-600">
                Tổng số: {totalElements} đánh giá
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                            <th scope="col" className="px-4 py-3 w-16">ID</th>
                            <th scope="col" className="px-4 py-3">Khách hàng & Phòng</th>
                            <th scope="col" className="px-4 py-3 w-32">Đánh giá</th>
                            <th scope="col" className="px-4 py-3">Nội dung</th>
                            <th scope="col" className="px-4 py-3 w-28 text-center">Trạng thái</th>
                            <th scope="col" className="px-4 py-3 w-32 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {reviews.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                    <i className="fas fa-inbox text-4xl mb-2 block text-gray-300"></i>
                                    <p>Không có đánh giá nào</p>
                                </td>
                            </tr>
                        ) : (
                            reviews.map(review => (
                                <tr key={review.id} className="bg-white hover:bg-blue-50 transition-colors">
                                    <td className="px-4 py-4">
                                        <span className="font-mono text-xs text-blue-600 font-semibold">#{review.id}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-user text-blue-500 text-xs"></i>
                                                <span className="font-medium text-gray-900 text-sm">
                                                    {review.userFullName || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-hotel text-green-500 text-xs"></i>
                                                <span className="text-xs text-gray-600">
                                                    {review.roomCode || 'N/A'}
                                                    {review.roomTitle && ` - ${review.roomTitle.substring(0, 20)}${review.roomTitle.length > 20 ? '...' : ''}`}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <i className="fas fa-clock"></i>
                                                <span>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-0.5">
                                                {renderStars(review.rating)}
                                            </div>
                                            <span className="text-lg font-bold text-gray-800">{review.rating}/5</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="space-y-1 max-w-md">
                                            {review.title && (
                                                <p className="font-semibold text-gray-800 text-sm truncate" title={review.title}>
                                                    {review.title}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-600 line-clamp-2" title={review.content}>
                                                {review.content || 'Không có nội dung'}
                                            </p>
                                            <div className="flex gap-2 flex-wrap mt-1">
                                                {review.responses && review.responses.length > 0 && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                        <i className="fas fa-reply"></i>
                                                        {review.responses.length}
                                                    </span>
                                                )}
                                                {review.images && review.images.length > 0 && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                        <i className="fas fa-image"></i>
                                                        {review.images.length}
                                                    </span>
                                                )}
                                                {review.videos && review.videos.length > 0 && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                                        <i className="fas fa-video"></i>
                                                        {review.videos.length}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <div className="status-dropdown-container relative inline-block">
                                            <button
                                                onClick={() => toggleStatusDropdown(review.id)}
                                                className={`px-3 py-1.5 text-xs rounded-full cursor-pointer hover:opacity-80 transition-all font-medium min-w-[100px] inline-flex items-center justify-center ${getStatusColor(review.status)}`}
                                                title="Click để đổi trạng thái"
                                            >
                                                {getStatusLabel(review.status)}
                                                <i className="fas fa-chevron-down ml-1 text-xs"></i>
                                            </button>
                                            {statusDropdownOpen === review.id && (
                                                <div className="absolute z-10 mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-xl min-w-[120px]">
                                                    <button
                                                        onClick={() => handleStatusChange(review.id, 'published')}
                                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                                                            review.status === 'published' ? 'bg-green-50 text-green-700 font-semibold' : ''
                                                        }`}
                                                    >
                                                        <i className="fas fa-check-circle mr-2"></i>Duyệt
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(review.id, 'hidden')}
                                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                                                            review.status === 'hidden' ? 'bg-gray-50 text-gray-700 font-semibold' : ''
                                                        }`}
                                                    >
                                                        <i className="fas fa-eye-slash mr-2"></i>Ẩn
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex gap-2 justify-center">
                                            <button 
                                                onClick={() => handleViewDetail(review)} 
                                                className="w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors border-0 bg-transparent"
                                                title="Xem chi tiết"
                                            >
                                                <i className="fas fa-eye text-lg"></i>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(review.id)} 
                                                className="w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-800 transition-colors border-0 bg-transparent"
                                                title="Xóa"
                                            >
                                                <i className="fas fa-times text-lg"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                        Trước
                    </button>
                    <span className="px-4 py-2">
                        Trang {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                        Sau
                    </button>
                </div>
            )}

            {/* Detail Modal - Improved Design */}
            {showDetailModal && selectedReview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                        <i className="fas fa-star"></i>
                                        Chi tiết đánh giá
                                    </h3>
                                    <p className="text-blue-100 text-sm">ID: #{selectedReview.id}</p>
                                </div>
                                <button
                                    onClick={handleCloseDetail}
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                                >
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Customer Info Card */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border-2 border-blue-200 shadow-sm">
                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                                        <i className="fas fa-user-circle text-blue-600 text-xl"></i>
                                        Thông tin khách hàng
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <i className="fas fa-user text-blue-600 mt-1"></i>
                                            <div>
                                                <p className="text-xs text-gray-600">Họ tên</p>
                                                <p className="font-semibold text-gray-800">{selectedReview.userFullName || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <i className="fas fa-envelope text-blue-600 mt-1"></i>
                                            <div>
                                                <p className="text-xs text-gray-600">Email</p>
                                                <p className="font-semibold text-gray-800 break-all">{selectedReview.userEmail || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Room Info Card */}
                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border-2 border-green-200 shadow-sm">
                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                                        <i className="fas fa-hotel text-green-600 text-xl"></i>
                                        Thông tin phòng
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <i className="fas fa-door-open text-green-600 mt-1"></i>
                                            <div>
                                                <p className="text-xs text-gray-600">Mã phòng</p>
                                                <p className="font-semibold text-gray-800">{selectedReview.roomCode || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <i className="fas fa-bed text-green-600 mt-1"></i>
                                            <div>
                                                <p className="text-xs text-gray-600">Tên phòng</p>
                                                <p className="font-semibold text-gray-800">{selectedReview.roomTitle || 'N/A'}</p>
                                            </div>
                                        </div>
                                        {selectedReview.bookingCode && (
                                            <div className="flex items-start gap-3">
                                                <i className="fas fa-receipt text-green-600 mt-1"></i>
                                                <div>
                                                    <p className="text-xs text-gray-600">Mã đặt phòng</p>
                                                    <p className="font-semibold text-gray-800">{selectedReview.bookingCode}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Review Content Card */}
                            <div className="bg-white border-2 border-gray-200 p-6 rounded-xl shadow-md mb-6">
                                <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-2xl">
                                            {renderStars(selectedReview.rating)}
                                        </div>
                                        <span className="text-3xl font-bold text-gray-800">{selectedReview.rating}/5</span>
                                    </div>
                                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedReview.status)}`}>
                                        {getStatusLabel(selectedReview.status)}
                                    </span>
                                </div>

                                {selectedReview.title && (
                                    <h4 className="font-bold text-xl text-gray-800 mb-4 flex items-start gap-2">
                                        <i className="fas fa-quote-left text-blue-500 text-sm mt-1"></i>
                                        {selectedReview.title}
                                    </h4>
                                )}

                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-5 pl-6">
                                    {selectedReview.content || 'Không có nội dung'}
                                </p>

                                {/* Hiển thị hình ảnh */}
                                {selectedReview.images && selectedReview.images.length > 0 && (
                                    <div className="mb-5 pl-6">
                                        <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <i className="fas fa-images text-blue-500"></i>
                                            Hình ảnh đính kèm
                                        </h5>
                                        <div className="grid grid-cols-4 gap-3">
                                            {selectedReview.images.map((image, index) => (
                                                <img
                                                    key={index}
                                                    src={image}
                                                    alt={`Review image ${index + 1}`}
                                                    className="w-full h-28 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:opacity-80 hover:border-blue-400 transition-all"
                                                    onClick={() => window.open(image, '_blank')}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Hiển thị video */}
                                {selectedReview.videos && selectedReview.videos.length > 0 && (
                                    <div className="mb-5 pl-6">
                                        <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <i className="fas fa-video text-purple-500"></i>
                                            Video đính kèm
                                        </h5>
                                        <div className="grid grid-cols-2 gap-3">
                                            {selectedReview.videos.map((video, index) => (
                                                <div key={index} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                                                    <video
                                                        src={video}
                                                        className="w-full h-48 object-cover"
                                                        controls
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-6 text-sm text-gray-500 pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-calendar-plus text-blue-500"></i>
                                        <span>Tạo: {formatDate(selectedReview.createdAt)}</span>
                                    </div>
                                    {selectedReview.updatedAt && (
                                        <div className="flex items-center gap-2">
                                            <i className="fas fa-calendar-check text-green-500"></i>
                                            <span>Cập nhật: {formatDate(selectedReview.updatedAt)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Admin Responses Section */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border-2 border-orange-200 shadow-md">
                                <div className="flex justify-between items-center mb-5">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                                        <i className="fas fa-reply-all text-orange-600 text-xl"></i>
                                        Phản hồi từ quản trị viên
                                        {selectedReview.responses && selectedReview.responses.length > 0 && (
                                            <span className="ml-2 px-3 py-1 bg-orange-500 text-white rounded-full text-sm">
                                                {selectedReview.responses.length}
                                            </span>
                                        )}
                                    </h4>
                                    <button
                                        onClick={() => handleOpenResponseModal()}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg text-sm font-medium flex items-center gap-2"
                                    >
                                        <i className="fas fa-plus"></i>
                                        Thêm phản hồi
                                    </button>
                                </div>
                                
                                {selectedReview.responses && selectedReview.responses.length > 0 ? (
                                    <div className="space-y-4">
                                        {selectedReview.responses.map((response, index) => (
                                            <div key={response.id} className="bg-white p-5 rounded-xl border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                            <i className="fas fa-user-shield"></i>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800 flex items-center gap-2">
                                                                {response.responderName || 'Admin'}
                                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                                                    Quản trị viên
                                                                </span>
                                                            </p>
                                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                                <i className="fas fa-clock"></i>
                                                                {formatDate(response.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleOpenResponseModal(response)}
                                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-all"
                                                            title="Sửa"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteResponse(response.id)}
                                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all"
                                                            title="Xóa"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="pl-14">
                                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                                                        {response.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <i className="fas fa-inbox text-5xl mb-3 text-gray-300"></i>
                                        <p className="italic text-lg">Chưa có phản hồi nào</p>
                                        <p className="text-sm mt-2">Nhấn nút "Thêm phản hồi" để trả lời khách hàng</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 p-4 border-t-2 flex justify-between items-center">
                            <button
                                onClick={handleCloseDetail}
                                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Response Modal */}
            {showResponseModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                    <i className={`fas ${editingResponse ? 'fa-edit' : 'fa-plus-circle'}`}></i>
                                    {editingResponse ? 'Sửa phản hồi' : 'Thêm phản hồi'}
                                </h3>
                                <button
                                    onClick={handleCloseResponseModal}
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                                >
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Nội dung phản hồi <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={responseForm.content}
                                onChange={(e) => setResponseForm({ content: e.target.value })}
                                rows={6}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                placeholder="Nhập nội dung phản hồi cho khách hàng..."
                            />
                        </div>

                        <div className="bg-gray-50 p-4 rounded-b-2xl flex justify-end gap-3 border-t">
                            <button
                                onClick={handleCloseResponseModal}
                                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSubmitResponse}
                                disabled={responseLoading}
                                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
                            >
                                {responseLoading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <i className={`fas ${editingResponse ? 'fa-save' : 'fa-paper-plane'}`}></i>
                                        {editingResponse ? 'Cập nhật' : 'Gửi phản hồi'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewManagement;
