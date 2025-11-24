// src/pages/HistoryBookingPage.jsx
import React, { useState, useEffect } from 'react';
import bookingService from '../services/booking.service'; // Đã import đúng service của user
import reviewService from '../services/review.service';
import additionalServiceService from '../services/additionalService.service';
import uploadService from '../services/upload.service';

const HistoryBookingPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(0); // 0-indexed
    const [totalPages, setTotalPages] = useState(0);
    const [cancelLoading, setCancelLoading] = useState({});
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [transactionLoading, setTransactionLoading] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [transactionMap, setTransactionMap] = useState({}); // Lưu transaction của mỗi booking
    const [reviewMap, setReviewMap] = useState({}); // Lưu review của mỗi booking
    const [showReviewModal, setShowReviewModal] = useState(null); // bookingId của modal đang mở
    const [showViewReviewModal, setShowViewReviewModal] = useState(null); // bookingId của modal xem review đang mở
    const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', content: '', images: [], videos: [] });
    const [reviewLoading, setReviewLoading] = useState({});
    const [uploadingMedia, setUploadingMedia] = useState(false);
    
    // Additional services state
    const [showServicesModal, setShowServicesModal] = useState(null); // bookingId của modal đang mở
    const [availableServices, setAvailableServices] = useState([]);
    const [bookingServices, setBookingServices] = useState({}); // Map bookingId -> services
    const [servicesLoading, setServicesLoading] = useState(false);
    const [addServiceLoading, setAddServiceLoading] = useState({});

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {
                page: page,
                size: 20,
            };
            
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }

            const response = await bookingService.getHistoryBookings(params);
            setBookings(response.content || []);
            setTotalPages(response.totalPages || 0);
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError('Lỗi khi tải danh sách đặt phòng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [page, statusFilter]);

    // Lấy transaction cho các bookings cần kiểm tra (chỉ những booking có thể hủy)
    useEffect(() => {
        const fetchTransactions = async () => {
            if (bookings.length === 0) return;
            
            // Chỉ lấy transaction cho các booking có status pending hoặc confirmed
            const bookingsToCheck = bookings.filter(b => 
                (b.status === 'pending' || b.status === 'confirmed') && 
                b.status !== 'cancelled' && 
                b.status !== 'checked_out'
            );
            
            if (bookingsToCheck.length === 0) return;
            
            const transactionPromises = bookingsToCheck.map(async (booking) => {
                try {
                    const transaction = await bookingService.getTransaction(booking.id);
                    return { bookingId: booking.id, transaction };
                } catch (err) {
                    // Nếu không có transaction hoặc lỗi, coi như chưa thanh toán
                    return { bookingId: booking.id, transaction: null };
                }
            });

            try {
                const results = await Promise.all(transactionPromises);
                const map = {};
                results.forEach(({ bookingId, transaction }) => {
                    map[bookingId] = transaction;
                });
                setTransactionMap(prev => ({ ...prev, ...map }));
            } catch (err) {
                console.error('Error fetching transactions:', err);
            }
        };

        fetchTransactions();
    }, [bookings]);

    // Lấy reviews cho các bookings đã checked_out
    useEffect(() => {
        const fetchReviews = async () => {
            if (bookings.length === 0) return;
            
            // Chỉ lấy review cho các booking đã checked_out
            const checkedOutBookings = bookings.filter(b => b.status === 'checked_out');
            
            if (checkedOutBookings.length === 0) return;
            
            const reviewPromises = checkedOutBookings.map(async (booking) => {
                try {
                    const review = await reviewService.getReviewByBookingId(booking.id);
                    return { bookingId: booking.id, review };
                } catch (err) {
                    // Nếu không có review, trả về null
                    return { bookingId: booking.id, review: null };
                }
            });

            try {
                const results = await Promise.all(reviewPromises);
                const map = {};
                results.forEach(({ bookingId, review }) => {
                    map[bookingId] = review;
                });
                setReviewMap(prev => ({ ...prev, ...map }));
            } catch (err) {
                console.error('Error fetching reviews:', err);
            }
        };

        fetchReviews();
    }, [bookings]);

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy đơn đặt phòng này? Hành động này không thể hoàn tác.')) {
            return;
        }

        setCancelLoading(prev => ({ ...prev, [bookingId]: true }));
        try {
            await bookingService.cancelBooking(bookingId);
            setBookings(prev =>
                prev.map(b =>
                    b.id === bookingId ? { ...b, status: 'cancelled' } : b
                )
            );
            alert('Hủy phòng thành công!');
        } catch (err) {
            console.error('Lỗi khi hủy phòng:', err);
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Không thể hủy phòng';
            alert('Lỗi: ' + msg);
        } finally {
            setCancelLoading(prev => ({ ...prev, [bookingId]: false }));
        }
    };

    const handleViewDetail = async (bookingId) => {
        setTransactionLoading(true);
        setError(null);
        try {
            // Fetch transaction và services song song
            const [transaction, services] = await Promise.all([
                bookingService.getTransaction(bookingId),
                additionalServiceService.getServicesByBookingId(bookingId).catch(() => [])
            ]);
            
            setSelectedTransaction(transaction);
            // Lưu services vào bookingServices map để hiển thị trong modal
            setBookingServices(prev => ({ ...prev, [bookingId]: services }));
            setShowDetailModal(true);
        } catch (err) {
            console.error('Lỗi khi lấy chi tiết transaction:', err);
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Không thể tải chi tiết';
            alert('Lỗi: ' + msg);
        } finally {
            setTransactionLoading(false);
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

    const formatCurrency = (amount) => {
        // Code này chỉ format số, không tính toán
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    const getStatusLabel = (status) => {
        const statusMap = {
            'pending': 'Chờ xử lý',
            'confirmed': 'Đã xác nhận',
            'checked_in': 'Đã nhận phòng',
            'checked_out': 'Đã trả phòng',
            'cancelled': 'Đã hủy',
            'no_show': 'Không đến'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'confirmed': 'bg-green-100 text-green-800',
            'checked_in': 'bg-blue-100 text-blue-800',
            'checked_out': 'bg-gray-100 text-gray-800',
            'cancelled': 'bg-red-100 text-red-800',
            'no_show': 'bg-orange-100 text-orange-800'
        };
        return colorMap[status] || 'bg-gray-100 text-gray-800';
    };

    // Kiểm tra booking có đã thanh toán chưa
    const isPaid = (bookingId) => {
        const transaction = transactionMap[bookingId];
        if (!transaction) {
            console.log(`Booking ${bookingId}: Chưa có transaction`);
            return false;
        }
        // Kiểm tra transaction có status success hoặc completed
        const paid = transaction.status === 'success' || transaction.status === 'completed';
        console.log(`Booking ${bookingId}: Transaction status = ${transaction.status}, isPaid = ${paid}`);
        return paid;
    };

    // Kiểm tra booking có được tạo chưa quá 2 giờ
    const isWithin2Hours = (booking) => {
        if (!booking.createdAt && !booking.bookingDate) return false;
        const bookingDate = booking.createdAt || booking.bookingDate;
        const bookingTime = new Date(bookingDate).getTime();
        const now = new Date().getTime();
        const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 giờ = 2 * 60 * 60 * 1000 ms
        return (now - bookingTime) < twoHoursInMs;
    };

    // Kiểm tra có thể hủy booking không
    const canCancel = (booking) => {
        // Không thể hủy nếu đã hủy hoặc đã trả phòng
        if (booking.status === 'cancelled' || booking.status === 'checked_out') {
            return false;
        }
        
        // Không thể hủy nếu đã thanh toán
        if (isPaid(booking.id)) {
            return false;
        }
        
        // Chỉ có thể hủy nếu chưa quá 2 giờ
        if (!isWithin2Hours(booking)) {
            return false;
        }
        
        // Có thể hủy nếu status là pending hoặc confirmed
        return booking.status === 'pending' || booking.status === 'confirmed';
    };

    // Kiểm tra có thể thêm dịch vụ không
    const canAddServices = (booking) => {
        // Không thể thêm nếu đã hủy
        if (booking.status === 'cancelled') {
            return false;
        }
        
        // Không thể thêm nếu đã trả phòng
        if (booking.status === 'checked_out') {
            return false;
        }
        
        // Không thể thêm nếu đã quá ngày check-out
        if (booking.checkOut) {
            const checkOutDate = new Date(booking.checkOut);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset về đầu ngày
            
            if (checkOutDate < today) {
                return false;
            }
        }
        
        // Chỉ cho phép nếu booking đã được xác nhận (confirmed, checked_in)
        // Không yêu cầu thanh toán trước - khách có thể thêm dịch vụ rồi thanh toán sau
        if (booking.status === 'pending') {
            return false; // Chưa confirm thì chưa cho thêm dịch vụ
        }
        
        return true;
    };

    // Lấy lý do không thể hủy
    const getCancelReason = (booking) => {
        if (booking.status === 'cancelled') {
            return 'Đơn đã bị hủy';
        }
        if (booking.status === 'checked_out') {
            return 'Đã trả phòng';
        }
        if (isPaid(booking.id)) {
            return 'Đã thanh toán, không thể hủy';
        }
        if (!isWithin2Hours(booking)) {
            return 'Đã quá 2 giờ kể từ khi đặt phòng';
        }
        return '';
    };

    // Lấy lý do không thể thêm dịch vụ
    const getServiceDisabledReason = (booking) => {
        if (booking.status === 'cancelled') {
            return 'Đơn đã bị hủy';
        }
        if (booking.status === 'checked_out') {
            return 'Đã trả phòng';
        }
        if (booking.checkOut) {
            const checkOutDate = new Date(booking.checkOut);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (checkOutDate < today) {
                return 'Đã quá thời gian check-out';
            }
        }
        if (!isPaid(booking.id)) {
            return 'Chưa thanh toán';
        }
        return '';
    };

    // Xử lý mở modal đánh giá (chỉ cho phép nếu chưa có review)
    const handleOpenReviewModal = (bookingId) => {
        // Kiểm tra nếu đã có review thì không cho mở
        if (reviewMap[bookingId]) {
            return;
        }
        setReviewForm({ rating: 5, title: '', content: '', images: [], videos: [] });
        setShowReviewModal(bookingId);
    };

    // Xử lý đóng modal đánh giá
    const handleCloseReviewModal = () => {
        setShowReviewModal(null);
        setReviewForm({ rating: 5, title: '', content: '', images: [], videos: [] });
    };

    // Compress và resize hình ảnh (tùy chọn, để giảm kích thước trước khi upload)
    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // Resize nếu quá lớn (max 1200px)
                    const maxSize = 1200;
                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = (height / width) * maxSize;
                            width = maxSize;
                        } else {
                            width = (width / height) * maxSize;
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Compress với quality 0.7 và convert to File
                    canvas.toBlob((blob) => {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    }, 'image/jpeg', 0.7);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Xử lý upload hình ảnh
    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Giới hạn 5 ảnh
        if (reviewForm.images.length + files.length > 5) {
            alert('Chỉ được tải lên tối đa 5 hình ảnh');
            return;
        }

        // Kiểm tra kích thước file
        const maxSize = 10 * 1024 * 1024; // 10MB (tăng lên vì không còn base64)
        for (const file of files) {
            if (file.size > maxSize) {
                alert(`File ${file.name} quá lớn. Vui lòng chọn file nhỏ hơn 10MB`);
                return;
            }
        }

        setUploadingMedia(true);
        try {
            // Compress images trước khi upload (tùy chọn)
            const compressedFiles = await Promise.all(
                files.map(file => compressImage(file))
            );

            // Upload files lên server
            const response = await uploadService.uploadFiles(compressedFiles, 'reviews/images');
            
            if (response.files && response.files.length > 0) {
                const imageUrls = response.files.map(file => file.url);
                setReviewForm(prev => ({
                    ...prev,
                    images: [...prev.images, ...imageUrls]
                }));
            }

            if (response.errors && response.errors.length > 0) {
                alert('Một số file upload thất bại: ' + response.errors.join(', '));
            }
        } catch (err) {
            console.error('Error uploading images:', err);
            alert('Lỗi khi tải ảnh lên: ' + (err.response?.data?.error || err.message));
        } finally {
            setUploadingMedia(false);
        }
    };

    // Xử lý xóa hình ảnh
    const handleRemoveImage = (index) => {
        setReviewForm(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    // Xử lý upload video
    const handleVideoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Giới hạn 2 video
        if (reviewForm.videos.length + files.length > 2) {
            alert('Chỉ được tải lên tối đa 2 video');
            return;
        }

        // Kiểm tra kích thước file - video có thể lớn hơn vì không dùng base64
        const maxSize = 50 * 1024 * 1024; // 50MB
        for (const file of files) {
            if (file.size > maxSize) {
                alert(`Video ${file.name} quá lớn. Vui lòng chọn video nhỏ hơn 50MB`);
                return;
            }
        }

        setUploadingMedia(true);
        try {
            // Upload files lên server
            const response = await uploadService.uploadFiles(files, 'reviews/videos');
            
            if (response.files && response.files.length > 0) {
                const videoUrls = response.files.map(file => file.url);
                setReviewForm(prev => ({
                    ...prev,
                    videos: [...prev.videos, ...videoUrls]
                }));
            }

            if (response.errors && response.errors.length > 0) {
                alert('Một số file upload thất bại: ' + response.errors.join(', '));
            }
        } catch (err) {
            console.error('Error uploading videos:', err);
            alert('Lỗi khi tải video lên: ' + (err.response?.data?.error || err.message));
        } finally {
            setUploadingMedia(false);
        }
    };

    // Xử lý xóa video
    const handleRemoveVideo = (index) => {
        setReviewForm(prev => ({
            ...prev,
            videos: prev.videos.filter((_, i) => i !== index)
        }));
    };

    // Xử lý submit đánh giá (chỉ cho phép tạo mới, không cho sửa)
    const handleSubmitReview = async (bookingId) => {
        if (!reviewForm.title.trim() || !reviewForm.content.trim()) {
            alert('Vui lòng nhập đầy đủ tiêu đề và nội dung đánh giá');
            return;
        }

        // Kiểm tra nếu đã có review thì không cho phép
        if (reviewMap[bookingId]) {
            alert('Bạn đã đánh giá rồi, không thể sửa đánh giá.');
            handleCloseReviewModal();
            return;
        }

        setReviewLoading(prev => ({ ...prev, [bookingId]: true }));
        try {
            const reviewData = {
                bookingId: bookingId,
                rating: reviewForm.rating,
                title: reviewForm.title,
                content: reviewForm.content,
                images: reviewForm.images.length > 0 ? reviewForm.images : null,
                videos: reviewForm.videos.length > 0 ? reviewForm.videos : null
            };

            // Chỉ tạo review mới
            const review = await reviewService.createReview(reviewData);

            // Cập nhật reviewMap
            setReviewMap(prev => ({ ...prev, [bookingId]: review }));
            handleCloseReviewModal();
            alert('Gửi đánh giá thành công!');
        } catch (err) {
            console.error('Lỗi khi gửi đánh giá:', err);
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Không thể gửi đánh giá';
            alert('Lỗi: ' + msg);
        } finally {
            setReviewLoading(prev => ({ ...prev, [bookingId]: false }));
        }
    };

    // Render sao đánh giá
    const renderStars = (rating, interactive = false, onRatingChange = null) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => interactive && onRatingChange && onRatingChange(star)}
                        disabled={!interactive}
                        className={`text-2xl ${
                            star <= rating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                        } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
                    >
                        ★
                    </button>
                ))}
            </div>
        );
    };

    // Xử lý mở modal dịch vụ
    const handleOpenServicesModal = async (bookingId) => {
        setShowServicesModal(bookingId);
        setServicesLoading(true);
        try {
            // Fetch available services
            const services = await additionalServiceService.getAllActiveServices();
            setAvailableServices(services);
            
            // Fetch services already added to this booking
            const addedServices = await additionalServiceService.getServicesByBookingId(bookingId);
            setBookingServices(prev => ({ ...prev, [bookingId]: addedServices }));
        } catch (err) {
            console.error('Error fetching services:', err);
            alert('Không thể tải danh sách dịch vụ');
        } finally {
            setServicesLoading(false);
        }
    };

    // Xử lý đóng modal dịch vụ
    const handleCloseServicesModal = () => {
        setShowServicesModal(null);
    };

    // Xử lý thêm dịch vụ vào booking
    const handleAddService = async (bookingId, serviceId, quantity = 1) => {
        setAddServiceLoading(prev => ({ ...prev, [serviceId]: true }));
        try {
            const result = await additionalServiceService.addServiceToBooking(bookingId, {
                serviceId,
                quantity
            });
            
            // Cập nhật bookingServices
            setBookingServices(prev => ({
                ...prev,
                [bookingId]: [...(prev[bookingId] || []), result]
            }));
            
            alert('Thêm dịch vụ thành công!');
        } catch (err) {
            console.error('Error adding service:', err);
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Không thể thêm dịch vụ';
            alert('Lỗi: ' + msg);
        } finally {
            setAddServiceLoading(prev => ({ ...prev, [serviceId]: false }));
        }
    };

    // Xử lý xóa dịch vụ khỏi booking
    const handleRemoveService = async (bookingId, bookingServiceId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
            return;
        }
        
        try {
            await additionalServiceService.removeServiceFromBooking(bookingServiceId);
            
            // Cập nhật bookingServices
            setBookingServices(prev => ({
                ...prev,
                [bookingId]: (prev[bookingId] || []).filter(s => s.id !== bookingServiceId)
            }));
            
            alert('Xóa dịch vụ thành công!');
        } catch (err) {
            console.error('Error removing service:', err);
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Không thể xóa dịch vụ';
            alert('Lỗi: ' + msg);
        }
    };

    // Xử lý cập nhật số lượng dịch vụ
    const handleUpdateServiceQuantity = async (bookingId, bookingServiceId, newQuantity) => {
        if (newQuantity < 1) {
            alert('Số lượng phải lớn hơn 0');
            return;
        }
        
        try {
            const result = await additionalServiceService.updateBookingServiceQuantity(bookingServiceId, newQuantity);
            
            // Cập nhật bookingServices
            setBookingServices(prev => ({
                ...prev,
                [bookingId]: (prev[bookingId] || []).map(s => 
                    s.id === bookingServiceId ? result : s
                )
            }));
        } catch (err) {
            console.error('Error updating service quantity:', err);
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Không thể cập nhật số lượng';
            alert('Lỗi: ' + msg);
        }
    };

    // ✅ SỬA: Thêm hàm xử lý chuyển trang
    const handlePageChange = (newPage) => {
        // newPage là 0-indexed
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
        }
    };

    // ✅ SỬA: Thêm hàm render các nút số trang
    const renderPaginationNumbers = () => {
        const pageNumbers = [];
        const currentPage = page; // 0-indexed
        const total = totalPages;

        // Luôn hiển thị trang đầu
        pageNumbers.push(0);

        // Các trang xung quanh trang hiện tại
        let startPage = Math.max(1, currentPage - 1);
        let endPage = Math.min(total - 2, currentPage + 1);
        
        // Dấu "..." bên trái
        if (startPage > 1) {
            pageNumbers.push('...');
        }

        // Các trang ở giữa
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        // Dấu "..." bên phải
        if (endPage < total - 2) {
            pageNumbers.push('...');
        }

        // Luôn hiển thị trang cuối (nếu tổng số trang > 1)
        if (total > 1) {
            pageNumbers.push(total - 1);
        }

        // Lọc các trang trùng lặp (ví dụ: nếu totalPages = 3)
        const uniquePages = [...new Set(pageNumbers)];

        return uniquePages.map((p, index) => (
            <button
                key={index}
                onClick={() => (typeof p === 'number' ? handlePageChange(p) : null)}
                disabled={p === '...'}
                className={`px-4 py-2 border rounded ${
                    p === currentPage
                        ? 'bg-blue-600 text-white font-bold' // Trang hiện tại
                        : 'bg-white text-gray-700'
                } ${
                    p === '...' 
                        ? 'cursor-default' 
                        : 'hover:bg-gray-100'
                }`}
            >
                {/* Hiển thị số trang (1-indexed) */}
                {typeof p === 'number' ? p + 1 : p}
            </button>
        ));
    };


    if (loading && bookings.length === 0) {
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
                <h2 className="text-2xl font-playfair font-bold text-gray-800">Lịch sử đặt phòng</h2>
                <div className="flex items-center gap-4">
                    <select 
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(0); // Reset về trang 0 khi đổi filter
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="checked_in">Đã nhận phòng</option>
                        <option value="checked_out">Đã trả phòng</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                            <th scope="col" className="px-6 py-4 font-semibold">Mã đơn</th>
                            <th scope="col" className="px-6 py-4 font-semibold">Khách hàng</th>
                            <th scope="col" className="px-6 py-4 font-semibold">Phòng</th>
                            <th scope="col" className="px-6 py-4 font-semibold">Ngày</th>
                            <th scope="col" className="px-6 py-4 font-semibold text-center">Số đêm</th>
                            <th scope="col" className="px-6 py-4 font-semibold text-right">Tổng tiền</th>
                            <th scope="col" className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                            <th scope="col" className="px-6 py-4 font-semibold text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-lg font-medium">Không có đơn đặt phòng nào</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            bookings.map((booking, index) => (
                                <tr key={booking.id} className="bg-white hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-blue-600 font-semibold">{booking.bookingCode}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{booking.userFullName || 'N/A'}</div>
                                        {booking.userEmail && (
                                            <div className="text-xs text-gray-500 mt-1">{booking.userEmail}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {booking.roomTitle && (
                                            <div className="text-sm text-gray-700 font-medium">{booking.roomTitle}</div>
                                        )}
                                        {!booking.roomTitle && booking.roomTypeName && (
                                            <div className="text-sm text-gray-700 font-medium">{booking.roomTypeName}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 font-medium">{formatDate(booking.checkIn)}</div>
                                        <div className="text-xs text-gray-500 mt-1">→ {formatDate(booking.checkOut)}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {booking.nights} đêm
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-semibold text-gray-900">{formatCurrency(booking.priceTotal)}₫</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-full min-w-[120px] ${getStatusColor(booking.status)}`}>
                                            {getStatusLabel(booking.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 flex-wrap justify-center">
                                            {/* Chỉ hiển thị nút Chi tiết nếu booking chưa bị hủy */}
                                            {booking.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => handleViewDetail(booking.id)}
                                                    disabled={transactionLoading}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow"
                                                >
                                                    {transactionLoading ? 'Đang tải...' : 'Chi tiết'}
                                                </button>
                                            )}
                                            {/* Nút dịch vụ - chỉ hiển thị nếu chưa hủy, chưa trả phòng, chưa quá hạn check-out và đã thanh toán */}
                                            {canAddServices(booking) && (
                                                <button
                                                    onClick={() => handleOpenServicesModal(booking.id)}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-purple-500 text-white hover:bg-purple-600 transition-colors shadow-sm hover:shadow"
                                                >
                                                    Dịch vụ
                                                </button>
                                            )}
                                            {/* Nút đánh giá - chỉ hiển thị khi đã checked_out và chưa đánh giá */}
                                            {booking.status === 'checked_out' && !reviewMap[booking.id] && (
                                                <button
                                                    onClick={() => handleOpenReviewModal(booking.id)}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm hover:shadow"
                                                >
                                                    Đánh giá
                                                </button>
                                            )}
                                            {/* Hiển thị trạng thái đã đánh giá và nút xem */}
                                            {booking.status === 'checked_out' && reviewMap[booking.id] && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setShowViewReviewModal(booking.id)}
                                                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <span>Đã đánh giá</span>
                                                    <div className="flex items-center gap-0.5">
                                                        {renderStars(reviewMap[booking.id].rating)}
                                                    </div>
                                                            {(reviewMap[booking.id].responses && reviewMap[booking.id].responses.length > 0) && (
                                                                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                                                                    {reviewMap[booking.id].responses.length}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                </div>
                                            )}
                                            {canCancel(booking) ? (
                                                <button
                                                    onClick={() => handleCancelBooking(booking.id)}
                                                    disabled={cancelLoading[booking.id]}
                                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors shadow-sm hover:shadow ${
                                                        cancelLoading[booking.id]
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            : 'bg-red-500 text-white hover:bg-red-600'
                                                    }`}
                                                >
                                                    {cancelLoading[booking.id] ? 'Đang hủy...' : 'Hủy phòng'}
                                                </button>
                                            ) : booking.status !== 'cancelled' && (
                                                <span 
                                                    className="text-gray-400 text-xs cursor-help inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200" 
                                                    title={getCancelReason(booking)}
                                                >
                                                    —
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ✅ SỬA: Cập nhật lại khu vực phân trang */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 0}
                        className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Trước
                    </button>
                    
                    {renderPaginationNumbers()}

                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages - 1}
                        className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Sau
                    </button>
                </div>
            )}

            {/* Modal hiển thị chi tiết transaction */}
            {showDetailModal && selectedTransaction && (
                <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => {
                    setShowDetailModal(false);
                    setSelectedTransaction(null);
                }}>
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-gray-800">Chi tiết giao dịch</h3>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedTransaction(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Thông tin booking */}
                            {selectedTransaction.bookingDTO && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-lg mb-3 text-gray-800">Thông tin đặt phòng</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600">Mã đặt phòng:</span>
                                            <p className="font-medium">{selectedTransaction.bookingDTO.bookingCode || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Trạng thái:</span>
                                            <p className="font-medium">{getStatusLabel(selectedTransaction.bookingDTO.status)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Ngày nhận phòng:</span>
                                            <p className="font-medium">{formatDate(selectedTransaction.bookingDTO.checkIn)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Ngày trả phòng:</span>
                                            <p className="font-medium">{formatDate(selectedTransaction.bookingDTO.checkOut)}</p>
                                        </div>
                                        {selectedTransaction.bookingDTO.roomTitle && (
                                            <div>
                                                <span className="text-gray-600">Phòng:</span>
                                                <p className="font-medium">{selectedTransaction.bookingDTO.roomTitle}</p>
                                            </div>
                                        )}
                                        {selectedTransaction.bookingDTO.roomTypeName && (
                                            <div>
                                                <span className="text-gray-600">Loại phòng:</span>
                                                <p className="font-medium">{selectedTransaction.bookingDTO.roomTypeName}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Thông tin transaction */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-lg mb-3 text-gray-800">Thông tin giao dịch</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-600">Mã giao dịch:</span>
                                        <p className="font-medium">{selectedTransaction.providerTransactionId || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Phương thức thanh toán:</span>
                                        <p className="font-medium">
                                            {selectedTransaction.provider === 'VNPAY' ? 'VNPay' : 
                                             selectedTransaction.provider === 'CASH' ? 'Tiền mặt' : 
                                             selectedTransaction.provider || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Trạng thái:</span>
                                        <p className="font-medium">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                selectedTransaction.status === 'success' || selectedTransaction.status === 'completed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : selectedTransaction.status === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {selectedTransaction.status === 'success' || selectedTransaction.status === 'completed' ? 'Thành công' : selectedTransaction.status === 'pending' ? 'Đang xử lý' : selectedTransaction.status === 'failed' ? 'Thất bại' : selectedTransaction.status || 'N/A'}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Số tiền:</span>
                                        <p className="font-semibold text-lg text-blue-600">{formatCurrency(selectedTransaction.amount || 0)}₫</p>
                                    </div>
                                    {selectedTransaction.createdAt && (
                                        <div>
                                            <span className="text-gray-600">Ngày tạo:</span>
                                            <p className="font-medium">{new Date(selectedTransaction.createdAt).toLocaleString('vi-VN')}</p>
                                        </div>
                                    )}
                                    {selectedTransaction.updatedAt && (
                                        <div>
                                            <span className="text-gray-600">Ngày cập nhật:</span>
                                            <p className="font-medium">{new Date(selectedTransaction.updatedAt).toLocaleString('vi-VN')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Thông tin khách hàng */}
                            {selectedTransaction.userDTO && (
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-lg mb-3 text-gray-800">Thông tin khách hàng</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600">Tên:</span>
                                            <p className="font-medium">{selectedTransaction.userDTO.fullName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Email:</span>
                                            <p className="font-medium">{selectedTransaction.userDTO.email || 'N/A'}</p>
                                        </div>
                                        {selectedTransaction.userDTO.phone && (
                                            <div>
                                                <span className="text-gray-600">Số điện thoại:</span>
                                                <p className="font-medium">{selectedTransaction.userDTO.phone}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Dịch vụ đã sử dụng */}
                            {selectedTransaction.bookingDTO && bookingServices[selectedTransaction.bookingDTO.id] && bookingServices[selectedTransaction.bookingDTO.id].length > 0 && (
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-lg mb-3 text-gray-800">Dịch vụ đã sử dụng</h4>
                                    <div className="space-y-2">
                                        {bookingServices[selectedTransaction.bookingDTO.id].map((service) => (
                                            <div key={service.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-purple-200">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-800">{service.serviceName}</p>
                                                    <p className="text-sm text-gray-600">{formatCurrency(service.pricePerUnit)}₫ x {service.quantity}</p>
                                                </div>
                                                <p className="font-semibold text-purple-600 min-w-[100px] text-right">{formatCurrency(service.totalPrice)}₫</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-purple-200">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-gray-800">Tổng tiền dịch vụ:</span>
                                            <span className="font-bold text-purple-600 text-lg">
                                                {formatCurrency(
                                                    bookingServices[selectedTransaction.bookingDTO.id].reduce((sum, s) => sum + Number(s.totalPrice), 0)
                                                )}₫
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    setSelectedTransaction(null);
                                }}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal dịch vụ */}
            {showServicesModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50" onClick={handleCloseServicesModal}>
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-gray-800">
                                Dịch vụ bổ sung
                            </h3>
                            <button
                                onClick={handleCloseServicesModal}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {servicesLoading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                                <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Dịch vụ đã thêm */}
                                {bookingServices[showServicesModal] && bookingServices[showServicesModal].length > 0 && (
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-lg mb-3 text-gray-800">Dịch vụ đã đặt</h4>
                                        <div className="space-y-2">
                                            {bookingServices[showServicesModal].map((service) => (
                                                <div key={service.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-200">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-800">{service.serviceName}</p>
                                                        <p className="text-sm text-gray-600">{formatCurrency(service.pricePerUnit)}₫ x {service.quantity}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleUpdateServiceQuantity(showServicesModal, service.id, service.quantity - 1)}
                                                                disabled={service.quantity <= 1}
                                                                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="px-3 py-1 bg-gray-100 rounded">{service.quantity}</span>
                                                            <button
                                                                onClick={() => handleUpdateServiceQuantity(showServicesModal, service.id, service.quantity + 1)}
                                                                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <p className="font-semibold text-green-600 min-w-[100px] text-right">{formatCurrency(service.totalPrice)}₫</p>
                                                        <button
                                                            onClick={() => handleRemoveService(showServicesModal, service.id)}
                                                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-green-200">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-gray-800">Tổng tiền dịch vụ:</span>
                                                <span className="font-bold text-green-600 text-lg">
                                                    {formatCurrency(
                                                        bookingServices[showServicesModal].reduce((sum, s) => sum + Number(s.totalPrice), 0)
                                                    )}₫
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Dịch vụ có sẵn */}
                                <div>
                                    <h4 className="font-semibold text-lg mb-3 text-gray-800">Dịch vụ có sẵn</h4>
                                    {availableServices.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">Không có dịch vụ nào</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {availableServices.map((service) => {
                                                // Check if this service is already added
                                                const isAdded = bookingServices[showServicesModal]?.some(s => s.serviceId === service.id);
                                                return (
                                                    <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                        <div className="flex items-start gap-3">
                                                            {service.imageUrl && (
                                                                <img 
                                                                    src={service.imageUrl} 
                                                                    alt={service.name}
                                                                    className="w-16 h-16 object-cover rounded"
                                                                />
                                                            )}
                                                            <div className="flex-1">
                                                                <h5 className="font-medium text-gray-800">{service.name}</h5>
                                                                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                                                                <div className="flex items-center justify-between mt-2">
                                                                    <span className="font-semibold text-purple-600">{formatCurrency(service.price)}₫/{service.unit}</span>
                                                                    <button
                                                                        onClick={() => handleAddService(showServicesModal, service.id, 1)}
                                                                        disabled={isAdded || addServiceLoading[service.id]}
                                                                        className={`px-3 py-1 text-xs font-medium rounded ${
                                                                            isAdded 
                                                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                                : 'bg-purple-500 text-white hover:bg-purple-600'
                                                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                                    >
                                                                        {addServiceLoading[service.id] ? 'Đang thêm...' : isAdded ? 'Đã thêm' : 'Thêm'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleCloseServicesModal}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal đánh giá */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50" onClick={handleCloseReviewModal}>
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-gray-800">
                                Đánh giá đặt phòng
                            </h3>
                            <button
                                onClick={handleCloseReviewModal}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Hiển thị thông tin booking */}
                            {bookings.find(b => b.id === showReviewModal) && (() => {
                                const booking = bookings.find(b => b.id === showReviewModal);
                                return (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-2">Thông tin đặt phòng</h4>
                                        <div className="text-sm text-gray-600">
                                            <p><strong>Mã đặt phòng:</strong> {booking.bookingCode}</p>
                                            <p><strong>Phòng:</strong> {booking.roomTitle || booking.roomTypeName || 'N/A'}</p>
                                            <p><strong>Ngày:</strong> {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</p>
                                        </div>
                                    </div>
                                );
                            })()}


                            {/* Form đánh giá */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Đánh giá sao
                                    </label>
                                    {renderStars(reviewForm.rating, true, (rating) => 
                                        setReviewForm(prev => ({ ...prev, rating }))
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tiêu đề đánh giá <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={reviewForm.title}
                                        onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Nhập tiêu đề đánh giá"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nội dung đánh giá <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={reviewForm.content}
                                        onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                                        rows={5}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Chia sẻ trải nghiệm của bạn..."
                                    />
                                </div>

                                {/* Upload hình ảnh */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hình ảnh (Tối đa 5 ảnh)
                                    </label>
                                    <div className="space-y-3">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            id="image-upload"
                                            disabled={uploadingMedia || reviewForm.images.length >= 5}
                                        />
                                        <label
                                            htmlFor="image-upload"
                                            className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                                                uploadingMedia || reviewForm.images.length >= 5
                                                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                                                    : 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400'
                                            }`}
                                        >
                                            <i className="fas fa-camera text-blue-600"></i>
                                            <span className="text-sm font-medium text-gray-700">
                                                {uploadingMedia ? 'Đang tải...' : 'Thêm hình ảnh'}
                                            </span>
                                        </label>
                                        
                                        {reviewForm.images.length > 0 && (
                                            <div className="grid grid-cols-3 gap-2">
                                                {reviewForm.images.map((image, index) => (
                                                    <div key={index} className="relative group">
                                                        <img
                                                            src={image}
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                                                        />
                                                        <button
                                                            onClick={() => handleRemoveImage(index)}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <i className="fas fa-times text-xs"></i>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Upload video */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Video (Tối đa 2 video)
                                    </label>
                                    <div className="space-y-3">
                                        <input
                                            type="file"
                                            accept="video/*"
                                            multiple
                                            onChange={handleVideoUpload}
                                            className="hidden"
                                            id="video-upload"
                                            disabled={uploadingMedia || reviewForm.videos.length >= 2}
                                        />
                                        <label
                                            htmlFor="video-upload"
                                            className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                                                uploadingMedia || reviewForm.videos.length >= 2
                                                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                                                    : 'border-purple-300 bg-purple-50 hover:bg-purple-100 hover:border-purple-400'
                                            }`}
                                        >
                                            <i className="fas fa-video text-purple-600"></i>
                                            <span className="text-sm font-medium text-gray-700">
                                                {uploadingMedia ? 'Đang tải...' : 'Thêm video'}
                                            </span>
                                        </label>
                                        
                                        {reviewForm.videos.length > 0 && (
                                            <div className="space-y-2">
                                                {reviewForm.videos.map((video, index) => (
                                                    <div key={index} className="relative group bg-gray-100 rounded-lg p-3 border-2 border-gray-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <i className="fas fa-video text-purple-600"></i>
                                                                <span className="text-sm text-gray-700">Video {index + 1}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveVideo(index)}
                                                                className="text-red-500 hover:text-red-700 transition-colors"
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        </div>
                                                        <video
                                                            src={video}
                                                            className="w-full h-32 object-cover rounded mt-2"
                                                            controls
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={handleCloseReviewModal}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => handleSubmitReview(showReviewModal)}
                                disabled={reviewLoading[showReviewModal] || uploadingMedia}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {reviewLoading[showReviewModal] ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal xem đánh giá và phản hồi */}
            {showViewReviewModal && reviewMap[showViewReviewModal] && (
                <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowViewReviewModal(null)}>
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-gray-800">
                                Đánh giá của bạn
                            </h3>
                            <button
                                onClick={() => setShowViewReviewModal(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {(() => {
                            const review = reviewMap[showViewReviewModal];
                            const booking = bookings.find(b => b.id === showViewReviewModal);
                            return (
                                <div className="space-y-4">
                                    {/* Thông tin booking */}
                                    {booking && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-semibold mb-2">Thông tin đặt phòng</h4>
                                            <div className="text-sm text-gray-600">
                                                <p><strong>Mã đặt phòng:</strong> {booking.bookingCode}</p>
                                                <p><strong>Phòng:</strong> {booking.roomTitle || booking.roomTypeName || 'N/A'}</p>
                                                <p><strong>Ngày:</strong> {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Đánh giá */}
                                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1">
                                                    {renderStars(review.rating)}
                                                </div>
                                                <span className="text-sm text-gray-600">{review.rating}/5</span>
                                            </div>
                                            <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                                        </div>
                                        {review.title && (
                                            <h4 className="font-semibold text-gray-800 mb-2">{review.title}</h4>
                                        )}
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{review.content}</p>

                                        {/* Hiển thị hình ảnh */}
                                        {review.images && review.images.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm font-medium text-gray-700 mb-2">Hình ảnh:</p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {review.images.map((image, index) => (
                                                        <img
                                                            key={index}
                                                            src={image}
                                                            alt={`Review image ${index + 1}`}
                                                            className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                                            onClick={() => window.open(image, '_blank')}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Hiển thị video */}
                                        {review.videos && review.videos.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm font-medium text-gray-700 mb-2">Video:</p>
                                                <div className="space-y-2">
                                                    {review.videos.map((video, index) => (
                                                        <video
                                                            key={index}
                                                            src={video}
                                                            className="w-full rounded-lg border border-gray-200"
                                                            controls
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Phản hồi từ admin */}
                                    {review.responses && review.responses.length > 0 && (
                                        <div className="border-t pt-4">
                                            <h4 className="font-semibold text-gray-800 mb-3">
                                                Phản hồi từ quản trị viên
                                            </h4>
                                            <div className="space-y-3">
                                                {review.responses.map((response) => (
                                                    <div key={response.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-800">
                                                                    {response.responderName || 'Quản trị viên'}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {formatDate(response.createdAt)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{response.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowViewReviewModal(null)}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryBookingPage;