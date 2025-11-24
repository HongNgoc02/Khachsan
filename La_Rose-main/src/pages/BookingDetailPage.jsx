import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import bookingService from "../services/booking.service";

const BookingDetailPage = () => {
    const { bookingId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [bookingInfo, setBookingInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadBookingInfo = async () => {
            try {
                setLoading(true);

                // Lấy dữ liệu từ query parameter (từ QR code)
                const dataParam = searchParams.get('data');

                if (dataParam) {
                    // Decode và parse JSON từ QR code
                    try {
                        const decoded = decodeURIComponent(dataParam);
                        const parsed = JSON.parse(decoded);
                        setBookingInfo(parsed);
                        // Không cần gửi về backend ở đây vì đã gửi từ trang confirmation
                    } catch (parseError) {
                        console.error("Error parsing booking data:", parseError);
                        setError("Dữ liệu đặt phòng không hợp lệ");
                    }
                } else if (bookingId) {
                    // Fallback: Nếu có bookingId trong URL, thử tìm trong sessionStorage
                    const savedBookingInfo = sessionStorage.getItem(`booking_${bookingId}`);
                    if (savedBookingInfo) {
                        const parsed = JSON.parse(savedBookingInfo);
                        setBookingInfo(parsed);
                    } else {
                        setError("Không tìm thấy thông tin đặt phòng");
                    }
                } else {
                    setError("Không có dữ liệu đặt phòng");
                }
            } catch (err) {
                console.error("Error loading booking:", err);
                setError("Không thể tải thông tin đặt phòng");
            } finally {
                setLoading(false);
            }
        };

        loadBookingInfo();
    }, [bookingId, searchParams]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    if (error || !bookingInfo) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Không tìm thấy
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {error || "Không tìm thấy thông tin đặt phòng với mã này."}
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="px-6 py-3 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition-colors"
                    >
                        Về Trang Chủ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header với Logo */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <img
                            src="http://localhost:8080/images/logo.jpg"
                            alt="La Rosé Hotel Logo"
                            className="h-20 w-auto object-contain"
                            onError={(e) => {
                                // Fallback nếu logo không load được
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                    <h1 className="text-4xl font-bold text-rose-800 mb-2">
                        La Rosé Hotel
                    </h1>
                    <p className="text-gray-600">Thông tin đặt phòng</p>
                </div>

                {/* Booking Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Success Header */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white text-center">
                        <div
                            className="w-16 h-16 rounded-full bg-center bg-cover mx-auto mb-3"
                            style={{ backgroundImage: "url('http://localhost:8080/images/logo.jpg')" }}
                        ></div>


                        <h2 className="text-2xl font-bold mb-1">
                            {bookingInfo.paymentMethod === "cash"
                                ? "Đặt Phòng Thành Công"
                                : "Đặt Phòng & Thanh Toán Thành Công"}
                        </h2>
                        <p className="text-green-100 text-sm">
                            Mã đặt phòng: <strong>#{bookingInfo.bookingId}</strong>
                        </p>
                    </div>

                    {/* Booking Details */}
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">Loại phòng</p>
                                <p className="text-lg font-semibold text-gray-800">
                                    {bookingInfo.roomType || "N/A"}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">Số phòng</p>
                                <p className="text-lg font-semibold text-gray-800">
                                    {bookingInfo.roomNumber || "Chưa xác định"}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <p className="text-sm text-blue-600 mb-1">Ngày nhận phòng</p>
                                <p className="text-lg font-semibold text-blue-800">
                                    {bookingInfo.checkin || "N/A"}
                                </p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                <p className="text-sm text-purple-600 mb-1">Ngày trả phòng</p>
                                <p className="text-lg font-semibold text-purple-800">
                                    {bookingInfo.checkout || "N/A"}
                                </p>
                            </div>
                        </div>

                        <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                            <p className="text-sm text-rose-600 mb-1">Khách hàng</p>
                            <p className="text-lg font-semibold text-rose-800">
                                {bookingInfo.customer || "N/A"}
                            </p>
                        </div>

                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                            <p className="text-sm text-amber-600 mb-1">Phương thức thanh toán</p>
                            <p className="text-lg font-semibold text-amber-800">
                                {bookingInfo.paymentMethod === "cash"
                                    ? "Thanh toán tại quầy"
                                    : "VNPay"}
                            </p>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                            {bookingInfo.paymentMethod === "cash" ? (
                                <>
                                    <p className="text-sm text-green-600 mb-2">
                                        Số tiền cần thanh toán tại quầy
                                    </p>
                                    <p className="text-3xl font-bold text-green-700">
                                        {(bookingInfo.amountToPay || 0).toLocaleString()}₫
                                    </p>
                                    {bookingInfo.paymentOption === "deposit" && (
                                        <p className="text-sm text-green-600 mt-2">
                                            Số tiền còn lại:{" "}
                                            {(bookingInfo.remainingDue || 0).toLocaleString()}₫
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-green-600 mb-2">
                                        Số tiền đã thanh toán
                                    </p>
                                    <p className="text-3xl font-bold text-green-700">
                                        {(bookingInfo.amountPaid || 0).toLocaleString()}₫
                                    </p>
                                    {bookingInfo.remainingDue > 0 && (
                                        <p className="text-sm text-green-600 mt-2">
                                            Số tiền còn lại:{" "}
                                            {bookingInfo.remainingDue.toLocaleString()}₫
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => navigate("/")}
                                className="flex-1 px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Về Trang Chủ
                            </button>
                            <button
                                onClick={() => navigate("/rooms")}
                                className="flex-1 px-4 py-2 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition-colors"
                            >
                                Đặt Phòng Mới
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700 text-center">
                        📧 Thông tin xác nhận đã được gửi đến email của quý khách.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BookingDetailPage;

