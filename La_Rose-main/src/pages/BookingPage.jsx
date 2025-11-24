
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useMemo } from "react";
import bookingService from "../services/booking.service";
import session from "../utils/SessionManager";
import { QRCodeSVG } from "qrcode.react";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import vi from 'date-fns/locale/vi';  // Để hỗ trợ tiếng Việt (optional, nếu chưa có date-fns thì bỏ dòng này)
const DEPOSIT_PERCENTAGE = 0.2; // Đặt cọc 20%

// CSS để highlight các ngày đã đặt
const highlightStyle = `
    .react-datepicker__day--highlighted {
        background-color: #ef4444 !important;
        color: white !important;
        font-weight: bold !important;
    }
    .react-datepicker__day--highlighted:hover {
        background-color: #dc2626 !important;
    }
    .react-datepicker__day--excluded {
        background-color: #fee2e2 !important;
        color: #991b1b !important;
        cursor: not-allowed !important;
        opacity: 0.6 !important;
    }
    .react-datepicker__day--excluded:hover {
        background-color: #fee2e2 !important;
    }
`;

// Hàm kiểm tra định dạng email
const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Hàm kiểm tra định dạng số điện thoại
const isValidPhone = (phone) => {
    return /^\d{9,15}$/.test(phone);
};

// Hàm helper để format YYYY-MM-DD theo local date (không dùng UTC)
const formatDateToLocalString = (date) => {
    if (!date) return "";
    // Format theo local date để tránh lệch múi giờ
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Component hiển thị xác nhận đặt phòng thành công
const ConfirmationContent = ({ bookingInfo, onResetBooking }) => {
    const navigate = useNavigate();
    console.log("Booking info:", bookingInfo);
    useEffect(() => {
        // Gửi thông tin booking từ QR code về backend để gửi email
        if (bookingInfo && bookingInfo.bookingId) {
            // Đảm bảo có customerEmail để gửi email
            const bookingDataToSend = { ...bookingInfo };
            // Lấy email từ session nếu chưa có
            if (!bookingDataToSend.customerEmail) {
                const user = session.getUser();
                if (user?.email) {
                    bookingDataToSend.customerEmail = user.email;
                }
            }
            
            // Chỉ gửi email nếu có email
            if (bookingDataToSend.customerEmail) {
                // Gọi submitBookingFromQR để gửi email xác nhận (cho cả cash và vnpay)
                bookingService.submitBookingFromQR(bookingDataToSend).then(response => {
                    console.log("Booking data sent to backend for email:", response);
                }).catch(err => {
                    console.warn("Error sending booking to backend:", err);
                    // Không block UI nếu gửi email lỗi
                });
            } else {
                console.warn("No customer email found, skipping email send");
            }
        }
    }, [bookingInfo]);
    const handleBackToHome = () => {
        navigate("/");
    };
    
    const handleNewBooking = () => {
      navigate("/rooms");
    };

    return (
        <div className="container mx-auto px-6 py-12 font-inter text-center min-h-full bg-white">
            <div className="max-w-2xl mx-auto p-8 transform transition-all">
                {/* Icon thành công */}
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                        className="w-12 h-12 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                    </svg>
                </div>

                {/* Tiêu đề */}
                <h3 className="text-3xl font-bold text-green-700 mb-4">
                    {bookingInfo.paymentMethod === "cash"
                        ? "Đặt Phòng Thành Công!"
                        : "Đặt Phòng & Thanh Toán Thành Công!"}
                </h3>

                {/* Thông điệp */}
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                    {bookingInfo.paymentMethod === "cash"
                        ? "Cảm ơn quý khách đã lựa chọn La Rosé. Đơn đặt phòng của quý khách đã được xác nhận. Vui lòng đến khách sạn để hoàn tất thủ tục thanh toán."
                        : "Cảm ơn quý khách đã lựa chọn La Rosé. Đơn đặt phòng của quý khách đã được xác nhận và thanh toán thành công. Chúng tôi rất mong được đón tiếp quý khách."}
                </p>

                {/* Thông tin đặt phòng */}
                {bookingInfo && (
                    <div className="bg-white border border-green-200 rounded-xl p-6 mb-8 shadow-sm">
                        <h4 className="font-semibold text-green-800 text-lg mb-4">
                            Thông tin đặt phòng
                        </h4>
                        <div className="space-y-3 text-left">
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Mã đặt phòng:
                                </span>
                                <span className="font-semibold">
                                    #{bookingInfo.bookingId}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Phòng:</span>
                                <span className="font-semibold">
                                    {bookingInfo.roomType}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Số phòng:</span>
                                <span className="font-semibold">
                                    {bookingInfo.roomNumber}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Ngày nhận phòng:
                                </span>
                                <span className="font-semibold">
                                    {bookingInfo.checkin}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Ngày trả phòng:
                                </span>
                                <span className="font-semibold">
                                    {bookingInfo.checkout}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Khách hàng:
                                </span>
                                <span className="font-semibold">
                                    {bookingInfo.customer}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Phương thức thanh toán:
                                </span>
                                <span className="font-semibold">
                                    {bookingInfo.paymentMethod === "cash"
                                        ? "Thanh toán tại quầy"
                                        : "VNPay"}
                                </span>
                            </div>
                            <div className="border-t pt-3 mt-3">
                                {bookingInfo.paymentMethod === "cash" ? (
                                    <>
                                        <div className="flex justify-between text-lg">
                                            <span className="text-gray-700">
                                                Số tiền cần thanh toán tại quầy:
                                            </span>
                                            <span className="font-bold text-amber-600">
                                                {bookingInfo.amountToPay?.toLocaleString()}
                                                ₫
                                            </span>
                                        </div>
                                        {bookingInfo.paymentOption ===
                                            "deposit" && (
                                            <div className="flex justify-between text-sm mt-2">
                                                <span className="text-gray-500">
                                                    Số tiền còn lại (thanh toán
                                                    khi nhận phòng):
                                                </span>
                                                <span className="text-gray-600">
                                                    {bookingInfo.remainingDue?.toLocaleString()}
                                                    ₫
                                                </span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between text-lg">
                                            <span className="text-gray-700">
                                                Số tiền đã thanh toán:
                                            </span>
                                            <span className="font-bold text-green-600">
                                                {bookingInfo.amountPaid?.toLocaleString()}
                                                ₫
                                            </span>
                                        </div>
                                        {bookingInfo.remainingDue > 0 && (
                                            <div className="flex justify-between text-sm mt-2">
                                                <span className="text-gray-500">
                                                    Số tiền còn lại:
                                                </span>
                                                <span className="text-gray-600">
                                                    {bookingInfo.remainingDue?.toLocaleString()}
                                                    ₫
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Hướng dẫn đặc biệt cho thanh toán tại quầy */}
                {bookingInfo.paymentMethod === "cash" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg
                                    className="w-6 h-6 text-yellow-600 mt-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                                    Hướng dẫn thanh toán tại quầy
                                </h3>
                                <ul className="text-yellow-700 text-sm space-y-2 text-left">
                                    <li>
                                        • Vui lòng đến trực tiếp khách sạn La
                                        Rosé để hoàn tất thủ tục thanh toán
                                    </li>
                                    <li>
                                        • Mang theo CMND/CCCD để xác minh thông
                                        tin
                                    </li>
                                    <li>
                                        • Phòng sẽ được giữ đến 18:00 ngày nhận
                                        phòng
                                    </li>
                                    <li>
                                        • Địa chỉ: 123 Đường ABC, Quận XYZ, TP.
                                        Hồ Chí Minh
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* QR Code */}
                {bookingInfo && (
                    <div className="bg-white border border-green-200 rounded-xl p-6 mb-6 shadow-sm">
                        <h4 className="font-semibold text-green-800 text-lg mb-3 text-center">
                            Mã QR Đặt Phòng
                        </h4>
                        <p className="text-sm text-gray-600 mb-4 text-center">
                            Quét mã QR bằng điện thoại để xem thông tin đặt phòng trên trình duyệt
                        </p>
                        <div className="flex justify-center mb-4">
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                                <QRCodeSVG
                                    value={`${window.location.origin}/booking-detail?data=${encodeURIComponent(JSON.stringify(bookingInfo))}`}
                                    size={200}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            Mã đặt phòng: <strong>#{bookingInfo.bookingId}</strong>
                        </p>
                        {bookingInfo.createdAt && (
                            <p className="text-xs text-gray-500 text-center mt-1">
                                Ngày tạo: <strong>{new Date(bookingInfo.createdAt).toLocaleString('vi-VN')}</strong>
                            </p>
                        )}
                    </div>
                )}

                {/* Hướng dẫn tiếp theo */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                    <p className="text-sm text-blue-700">
                        📧 Thông tin xác nhận đã được gửi đến email của quý
                        khách. Vui lòng kiểm tra hộp thư đến và thư rác (spam)
                        để biết chi tiết.
                    </p>
                </div>

                {/* Nút hành động */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={handleBackToHome}
                        className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors shadow-md"
                    >
                        Về Trang Chủ
                    </button>
                    <button
                        onClick={handleNewBooking}
                        className="px-6 py-3 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition-colors shadow-md transform hover:scale-[1.02]"
                    >
                        Đặt Phòng Mới
                    </button>
                </div>
            </div>
        </div>
    );
};

// Component xử lý callback từ VNPay
const VNPayCallbackHandler = ({ onSuccess, onError }) => {
    const [searchParams] = useSearchParams();
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        const processVNPayCallback = async () => {
            try {
                console.log("Processing VNPay callback...");

                // Lấy các tham số từ URL
                const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
                const vnp_TransactionStatus = searchParams.get(
                    "vnp_TransactionStatus",
                );
                const vnp_Amount = searchParams.get("vnp_Amount");
                const vnp_OrderInfo = searchParams.get("vnp_OrderInfo");
                const vnp_BankCode = searchParams.get("vnp_BankCode");

                console.log("VNPay callback params:", {
                    vnp_ResponseCode,
                    vnp_TransactionStatus,
                    vnp_Amount,
                    vnp_OrderInfo,
                    vnp_BankCode,
                });

                // Kiểm tra kết quả thanh toán
                if (
                    vnp_ResponseCode === "00" ||
                    vnp_TransactionStatus === "00"
                ) {
                    // Thanh toán thành công
                    console.log("VNPay payment successful");

                    // Lấy bookingCode từ sessionStorage nếu có
                    const savedBookingCode = sessionStorage.getItem('pendingBookingCode');
                    
                    // Lấy roomNumber từ sessionStorage nếu có
                    const savedRoomNumber = sessionStorage.getItem('pendingRoomNumber');
                    
                    // Tạo thông tin booking tạm thời từ thông tin có sẵn
                    const tempBookingInfo = {
                        bookingId:
                            savedBookingCode ||
                            vnp_OrderInfo ||
                            `BK${Date.now().toString().slice(-8)}`,
                        roomType: "Phòng Deluxe", // Có thể lấy từ localStorage hoặc context
                        roomNumber: savedRoomNumber || null,
                        checkin: formatDateToLocalString(new Date()),
                        checkout: formatDateToLocalString(new Date(Date.now() + 86400000)),
                        customer: session.getUser()?.fullName || "Khách hàng",
                        amountPaid: vnp_Amount ? parseInt(vnp_Amount) / 100 : 0,
                        remainingDue: 0,
                        paymentMethod: "vnpay",
                        paymentOption: "full",
                    };

                    onSuccess(tempBookingInfo);
                } else {
                    // Thanh toán thất bại
                    throw new Error(
                        `Thanh toán VNPay thất bại. Mã lỗi: ${vnp_ResponseCode}`,
                    );
                }
            } catch (error) {
                console.error("Error processing VNPay callback:", error);
                onError(error.message);
            } finally {
                setIsProcessing(false);
            }
        };

        processVNPayCallback();
    }, [searchParams, onSuccess, onError]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Đang xử lý kết quả thanh toán...
                </h3>
                <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
            </div>
        </div>
    );
};

// Component chính cho trang đặt phòng
const BookingPage = () => {
    // ================================================================
// BẮT ĐẦU PHẦN CODE LOGIC ĐÃ SỬA HOÀN CHỈNH
// (Copy tất cả và thay thế cho phần tương ứng trong BookingPage.jsx)
// ================================================================

const { addBooking } = useData(); // (Giữ nguyên)
const location = useLocation();
const navigate = useNavigate();
const [searchParams] = useSearchParams();
const [currentUser, setCurrentUser] = useState(session.getUser());

// State quản lý luồng
const [step, setStep] = useState(1);
const [confirmedBookingInfo, setConfirmedBookingInfo] = useState(null);
const [errorMessage, setErrorMessage] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);

// --- SỬA LỖI 2: THÊM DÒNG NÀY VÀO ---
const [isProcessingVNPayCallback, setIsProcessingVNPayCallback] =
    useState(false);
// --- KẾT THÚC SỬA LỖI 2 ---

// State cho API
const [roomTypes, setRoomTypes] = useState([]);
const [bookedDates, setBookedDates] = useState([]);
const [bookedBookings, setBookedBookings] = useState([]); // Lưu danh sách bookings để kiểm tra overlap
const [loadingRoomTypes, setLoadingRoomTypes] = useState(true);
const [loadingBookedDates, setLoadingBookedDates] = useState(false);

// Dữ liệu từ RoomsPage (nếu có)
const preFilledData = location.state?.preFilledData;
const fromRoomPage = location.state?.fromRoomPage;
console.log("Pre-filled data:", preFilledData);
console.log("From room page:", fromRoomPage);
// Ngày mặc định
const todayDate = new Date();
// const tomorrowDate = new Date(todayDate); // <-- XÓA: Không cần nữa
// tomorrowDate.setDate(tomorrowDate.getDate() + 1);

// --- SỬA 1: Tách 'initialBookingData' ra thành hằng số ---
// (Dùng để reset form và khởi tạo state)
const getInitialBookingData = () => ({
    roomId: preFilledData?.roomId || "",
    roomType: preFilledData?.roomType || "",
    roomNumber: preFilledData?.roomNumber || "",
    roomPrice: preFilledData?.price || 0,
    roomCapacity: preFilledData?.roomCapacity || 1,
    roomDescription: preFilledData?.roomDescription || "",
    roomArea: preFilledData?.roomArea || "",
    
    // THÊM: Các trường string cho ngày tháng để gửi đi API
    checkIn: "",
    checkOut: "",
    
    guests: 1, // Sửa: Đổi 'quantity' thành 'guests'
    name: currentUser?.fullName || "",
    phone: currentUser?.phone || "",
    email: currentUser?.email || "",
    requests: "",

    paymentMethod: "vnpay",
    paymentOption: "full",
});


// State cho LỊCH (dùng đối tượng Date cho DatePicker)
const [bookingDates, setBookingDates] = useState({
    checkIn: null, // (Để null, DatePicker sẽ tự chọn)
    checkOut: null,
});

// Khởi tạo dữ liệu đặt phòng (dùng hằng số ở trên)
const [bookingData, setBookingData] = useState(getInitialBookingData());
 useEffect(() => {
    const token = session.getToken();
    const user = session.getUser();
    
    if (!token || !user) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);
// --- XỬ LÝ CALLBACK VNPAY (Giữ nguyên) ---
useEffect(() => {
    const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
    if (vnp_ResponseCode) {
        console.log("Detected VNPay callback, processing...");
        setIsProcessingVNPayCallback(true); // <-- Dòng này cần state đã khai báo
    }
}, [searchParams]);

// --- 1. LẤY LOẠI PHÒNG (Room Types) TỪ CSDL (Giữ nguyên) ---
useEffect(() => {
    const fetchRoomTypes = async () => {
        try {
            setLoadingRoomTypes(true);
            const types = await bookingService.getAllRoomTypes();
            setRoomTypes(types || []);
            console.log("Room types:", types);
            if (!fromRoomPage && types && types.length > 0) {
               // (Để người dùng tự chọn)
            }

        } catch (err) {
            console.error("Lỗi khi tải loại phòng:", err);
            setErrorMessage("Không thể tải danh sách loại phòng.");
        } finally {
            setLoadingRoomTypes(false);
        }
    };

    if (!fromRoomPage) { 
         fetchRoomTypes();
    } else {
        // Nếu đến từ RoomPage, chỉ cần 1 loại phòng
      setRoomTypes([{
    id: preFilledData.roomId,
    name: preFilledData.roomType || "Phòng không xác định",
    basePrice: preFilledData.price || preFilledData.roomType?.basePrice || 0,
    maxGuests: preFilledData.roomCapacity || 1,
    shortDescription: preFilledData.roomDescription || "",
    area: preFilledData.roomArea || 0,
  }]);
  console.log("Room types from RoomPage:", roomTypes);
        setLoadingRoomTypes(false);
    }
}, [fromRoomPage, preFilledData]);

// --- 2. LẤY NGÀY ĐÃ ĐẶT KHI CHỌN PHÒNG (Giữ nguyên) ---
useEffect(() => {
    const fetchBookedDates = async () => {
        if (!bookingData.roomId) {
            setBookedDates([]);
            return; 
        }
        
        try {
            setLoadingBookedDates(true);
            setErrorMessage("");
            const bookings = await bookingService.getBookedDates(bookingData.roomId);
            
            // Chỉ lưu các ngày đã đặt (từ checkIn đến checkOut-1, không bao gồm checkOut)
            // Vì checkOut là ngày trả phòng, có thể chọn làm checkIn
            const dates = [];
            bookings.forEach(booking => {
                let currentDate = new Date(booking.checkIn);
                const endDate = new Date(booking.checkOut);
                // Chỉ thêm từ checkIn đến checkOut-1 (không bao gồm checkOut)
                while (currentDate < endDate) { 
                    dates.push(new Date(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            });
            setBookedDates(dates);
            // Lưu danh sách bookings để kiểm tra overlap
            setBookedBookings(bookings);
            
            // Bỏ validation overlap - không cần check lỗi này nữa

        } catch (err) {
            console.error("Lỗi khi lấy ngày đã đặt:", err);
            setErrorMessage("Không thể tải lịch của phòng này.");
        } finally {
            setLoadingBookedDates(false);
        }
    };

    fetchBookedDates();
}, [bookingData.roomId]); // Chạy lại mỗi khi đổi phòng

// Bỏ validation overlap - không cần check lỗi này nữa


// --- THÊM: useEffect ĐỂ ĐỒNG BỘ LỊCH (Date) VÀO bookingData (String) ---
useEffect(() => {
    // Sử dụng helper function chung

    setBookingData(prev => ({
        ...prev,
        // Cập nhật các trường string
        checkIn: formatDateToLocalString(bookingDates.checkIn),
        checkOut: formatDateToLocalString(bookingDates.checkOut),
    }));
    
    // Clear errorMessage khi thay đổi ngày để tránh hiển thị lỗi cũ
    setErrorMessage("");
}, [bookingDates.checkIn, bookingDates.checkOut]); // Chạy mỗi khi Date object thay đổi


// Tính toán tổng tiền (Giữ nguyên - dùng bookingDates là đúng)
const { nights, totalPrice, depositAmount, remainingAmount, amountToPay } = useMemo(() => {
    let nights = 0;
    if (bookingDates.checkIn && bookingDates.checkOut) {
        const checkinDate = new Date(bookingDates.checkIn);
        const checkoutDate = new Date(bookingDates.checkOut);
        const diffTime = Math.abs(checkoutDate - checkinDate);
        nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const calculatedTotalPrice = (bookingData.roomPrice || 0) * nights;
    const calculatedDepositAmount = Math.round(calculatedTotalPrice * DEPOSIT_PERCENTAGE);
    const calculatedRemainingAmount = calculatedTotalPrice - calculatedDepositAmount;
    const finalAmountToPay = bookingData.paymentOption === "full"
        ? calculatedTotalPrice
        : calculatedDepositAmount;

    return { nights, totalPrice: calculatedTotalPrice, depositAmount: calculatedDepositAmount, remainingAmount: calculatedRemainingAmount, amountToPay: finalAmountToPay };
}, [bookingDates.checkIn, bookingDates.checkOut, bookingData.roomPrice, bookingData.paymentOption]);

// Helper: Cập nhật state khi chọn loại phòng (Giữ nguyên)
const updateBookingDataForRoomType = (selectedType) => {
     if (selectedType) {
        setBookingData(prev => ({
            ...prev,
            roomId: selectedType.id, // Sửa: Dùng roomId = id
            roomType: selectedType.name,
            roomPrice: selectedType.basePrice,
            roomCapacity: selectedType.maxGuests || 1,
            roomDescription: selectedType.shortDescription || "",
            roomArea: selectedType.area || "", // (Cần thêm 'area' vào RoomType DTO)
            guests: 1, // Reset số khách
        }));
    } else {
        setBookingData(prev => ({ ...prev, roomId: "", roomPrice: 0, roomCapacity: 1, guests: 1 }));
    }
};

// Xử lý thay đổi form (input, select) (Giữ nguyên)
const handleChange = (e) => {
    const { name, value } = e.target;
    setErrorMessage("");
    setBookingData((prev) => ({ ...prev, [name]: value }));

    if (name === "roomId") {
        const selectedType = roomTypes.find(type => type.id.toString() === value);
        updateBookingDataForRoomType(selectedType);
    }
};

// --- SỬA: XÓA HÀM CŨ VÀ THÊM 3 HÀM MỚI ĐỂ XỬ LÝ LỊCH ---

// XÓA: Hàm xử lý khi thay đổi LỊCH (CŨ)
/*
const handleDateChange = (dates) => {
    const [start, end] = dates;
    setBookingDates({
        checkIn: start,
        checkOut: end
    });
    setErrorMessage("");
};
*/

// Hàm kiểm tra overlap giữa khoảng thời gian và các booking đã có
// Lưu ý: 
// - checkOut của booking khác có thể được chọn làm checkIn (vì khách đã trả phòng)
// - checkOut có thể = bookingCheckIn (vì có thể checkOut vào ngày checkIn của booking khác)
const checkDateOverlap = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return false;
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    checkInDate.setHours(0, 0, 0, 0);
    checkOutDate.setHours(0, 0, 0, 0);
    
    // Kiểm tra xem có booking nào overlap không
    return bookedBookings.some(booking => {
        const bookingCheckIn = new Date(booking.checkIn);
        const bookingCheckOut = new Date(booking.checkOut);
        bookingCheckIn.setHours(0, 0, 0, 0);
        bookingCheckOut.setHours(0, 0, 0, 0);
        
        // Overlap nếu khoảng thời gian chọn có ngày nào nằm trong khoảng đã đặt
        // Khoảng đã đặt: [bookingCheckIn, bookingCheckOut) (không bao gồm bookingCheckOut)
        // Khoảng chọn: [checkIn, checkOut) (không bao gồm checkOut)
        // Overlap nếu:
        // - checkIn < bookingCheckOut (checkIn phải trước ngày trả phòng)
        // - checkOut > bookingCheckIn (checkOut phải sau ngày nhận phòng)
        // Lưu ý: 
        // - checkIn có thể = bookingCheckOut (có thể checkIn vào ngày checkOut của booking khác) ✓
        // - checkOut có thể = bookingCheckIn (có thể checkOut vào ngày checkIn của booking khác) ✓
        // Nhưng không được có ngày nào trong khoảng [checkIn, checkOut) nằm trong [bookingCheckIn, bookingCheckOut)
        // Ví dụ: checkIn=21, checkOut=22 với booking 22-24: 21 < 24 && 22 > 22 => true && false => false (không overlap) ✓
        return checkInDate < bookingCheckOut && checkOutDate > bookingCheckIn;
    });
};

// THÊM: Hàm xử lý MỚI cho Check-in
const handleCheckInChange = (date) => {
    if (!date) {
        setBookingDates(prev => ({ ...prev, checkIn: null }));
        setErrorMessage("");
        return;
    }
    
    // Bỏ validation overlap - cho phép chọn bất kỳ ngày nào
    setBookingDates(prev => {
        // Nếu ngày check-in mới >= ngày check-out cũ, reset check-out
        if (prev.checkOut && date && date >= prev.checkOut) {
            return { checkIn: date, checkOut: null };
        }
        return { ...prev, checkIn: date };
    });
    setErrorMessage("");
};

// THÊM: Hàm xử lý MỚI cho Check-out
const handleCheckOutChange = (date) => {
    if (!date) {
        setBookingDates(prev => ({ ...prev, checkOut: null }));
        setErrorMessage("");
        return;
    }
    
    // Phải có checkIn trước khi chọn checkOut
    if (!bookingDates.checkIn) {
        setErrorMessage("Vui lòng chọn ngày nhận phòng trước.");
        return;
    }
    
    // Bỏ validation overlap - cho phép chọn bất kỳ ngày nào
    setBookingDates(prev => ({ ...prev, checkOut: date }));
    setErrorMessage("");
};

// THÊM: Tính toán minDate cho check-out (ngày trả phòng)
const minCheckOutDate = useMemo(() => {
    // Nếu chưa chọn check-in, thì min check-out là ngày mai
    if (!bookingDates.checkIn) {
        const nextDay = new Date(todayDate.getTime());
        nextDay.setDate(nextDay.getDate() + 1);
        return nextDay;
    }
    
    // Nếu đã chọn check-in, min check-out là 1 ngày sau check-in
    const nextDay = new Date(bookingDates.checkIn.getTime());
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay;
}, [bookingDates.checkIn, todayDate]);


// --- SỬA: Validation cho từng bước ---
const validateStep1 = () => {
    // SỬA: Kiểm tra bookingData.checkIn (chữ hoa) vì đây là string từ state
    if (!bookingData.checkIn || !bookingData.checkOut) {
        return "Vui lòng chọn ngày nhận và trả phòng.";
    }

    // SỬA: Dùng bookingData.checkIn (chữ hoa)
    const checkinDate = new Date(bookingData.checkIn);
    const checkoutDate = new Date(bookingData.checkOut);

    if (checkinDate >= checkoutDate) {
        return "Ngày trả phòng phải sau ngày nhận phòng.";
    }

    if (checkinDate < new Date().setHours(0, 0, 0, 0)) {
        return "Ngày nhận phòng không thể là ngày trong quá khứ.";
    }

    // Bỏ validation overlap - cho phép chọn bất kỳ ngày nào

    return null;
};

// (Giữ nguyên validateStep2)
const validateStep2 = () => {
    if (!bookingData.name.trim()) {
        return "Vui lòng nhập họ và tên.";
    }

    if (!bookingData.phone.trim()) {
        return "Vui lòng nhập số điện thoại.";
    }

    if (!isValidPhone(bookingData.phone)) {
        return "Số điện thoại không hợp lệ. Vui lòng nhập 9-15 chữ số.";
    }

    if (!bookingData.email.trim()) {
        return "Vui lòng nhập địa chỉ email.";
    }

    if (!isValidEmail(bookingData.email)) {
        return "Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.";
    }

    return null;
};

// Chuyển bước tiếp theo (Giữ nguyên)
const nextStep = () => {
    setErrorMessage("");

    let validationError = null;

    if (step === 1) {
        validationError = validateStep1();
    } else if (step === 2) {
        validationError = validateStep2();
    }

    if (validationError) {
        setErrorMessage(validationError);
        return;
    }

    setStep((s) => s + 1);
};

// Quay lại bước trước (Giữ nguyên)
const prevStep = () => {
    setErrorMessage("");
    setStep((s) => s - 1);
};

// Reset booking (SỬA: Thêm reset cho bookingDates)
const resetBooking = () => {
    setConfirmedBookingInfo(null);
    // SỬA: Dùng hằng số (đã cập nhật currentUser) để reset
    setBookingData(getInitialBookingData()); 
    // THÊM: Reset cả state của DatePicker
    setBookingDates({ checkIn: null, checkOut: null });
    setStep(1);
    setErrorMessage("");
};

// ================================================================
// KẾT THÚC PHẦN CODE LOGIC
// (Bên dưới đây sẽ là phần 'return' của component)
// ================================================================

      // Xử lý callback từ VNPay thành công (Giữ nguyên)
    const handleVNPayCallbackSuccess = (bookingInfo) => {
        console.log("VNPay callback success:", bookingInfo);
        
        // Lấy bookingCode từ sessionStorage
        const savedBookingCode = sessionStorage.getItem('pendingBookingCode');
        if (savedBookingCode) {
            bookingInfo.bookingId = savedBookingCode;
            // Xóa bookingCode khỏi sessionStorage sau khi dùng
            sessionStorage.removeItem('pendingBookingCode');
            console.log("Using bookingCode from sessionStorage:", savedBookingCode);
        }
        
        // Lấy roomNumber từ sessionStorage
        const savedRoomNumber = sessionStorage.getItem('pendingRoomNumber');
        if (savedRoomNumber) {
            bookingInfo.roomNumber = savedRoomNumber;
            // Xóa roomNumber khỏi sessionStorage sau khi dùng
            sessionStorage.removeItem('pendingRoomNumber');
            console.log("Using roomNumber from sessionStorage:", savedRoomNumber);
        }
        
        // Đảm bảo có customerEmail để gửi email
        if (!bookingInfo.customerEmail && currentUser?.email) {
            bookingInfo.customerEmail = currentUser.email;
        }
        
        // Thêm createdAt nếu chưa có
        if (!bookingInfo.createdAt) {
            bookingInfo.createdAt = new Date().toISOString();
        }
        
        // Lưu thông tin booking vào sessionStorage để trang detail có thể lấy
        if (bookingInfo.bookingId) {
            const bookingKey = `booking_${bookingInfo.bookingId}`;
            sessionStorage.setItem(bookingKey, JSON.stringify(bookingInfo));
            console.log("Saved booking info with key:", bookingKey, "bookingId:", bookingInfo.bookingId);
        }
        
        setConfirmedBookingInfo(bookingInfo);
        setIsProcessingVNPayCallback(false);

        // Thêm booking vào context
        addBooking(bookingInfo);
    };

    // Xử lý callback từ VNPay thất bại (Giữ nguyên)
    const handleVNPayCallbackError = (error) => {
        console.error("VNPay callback error:", error);
        // Xóa bookingCode và roomNumber khỏi sessionStorage nếu có (tránh dữ liệu cũ)
        sessionStorage.removeItem('pendingBookingCode');
        sessionStorage.removeItem('pendingRoomNumber');
        setErrorMessage(error);
        setIsProcessingVNPayCallback(false);
    };

    // Xử lý thanh toán VNPay (Giữ nguyên)
    // (Hàm này ổn vì nó nhận 'bookingPayload' đã được sửa ở 'handleBookingSubmit')
    const handleVNPayPayment = async (bookingPayload) => {
        try {
            // Tạo orderInfo đơn giản, không có ký tự đặc biệt
            const safeOrderInfo = `Booking${bookingPayload.roomId}${Date.now()
                .toString()
                .slice(-6)}`;

            const vnpayData = {
                amount: amountToPay,
                orderInfo: safeOrderInfo,
                roomId: bookingPayload.roomId || 1,
                returnUrl: `${window.location.origin}${window.location.pathname}`,
            };

            console.log("Sending VNPay request:", vnpayData);

            const vnpayResponse = await bookingService.submitVNPayOrder(
                vnpayData,
            );

            console.log("VNPay API response:", vnpayResponse);

            // Xử lý nhiều định dạng response khác nhau
            let paymentUrl = null;

            if (
                typeof vnpayResponse === "string" &&
                vnpayResponse.startsWith("http")
            ) {
                // Trường hợp response là URL string
                paymentUrl = vnpayResponse;
            } else if (vnpayResponse.paymentUrl) {
                // Trường hợp có field paymentUrl
                paymentUrl = vnpayResponse.paymentUrl;
            } else if (vnpayResponse.data && vnpayResponse.data.paymentUrl) {
                // Trường hợp nested data
                paymentUrl = vnpayResponse.data.paymentUrl;
            } else if (vnpayResponse.url) {
                // Trường hợp có field url
                paymentUrl = vnpayResponse.url;
            } else if (vnpayResponse.vnpUrl) {
                // Trường hợp có field vnpUrl
                paymentUrl = vnpayResponse.vnpUrl;
            }

            if (paymentUrl) {
                console.log("Redirecting to VNPay:", paymentUrl);
                // Chuyển hướng đến VNPay
                window.location.href = paymentUrl;
            } else {
                console.error(
                    "No payment URL found in response:",
                    vnpayResponse,
                );
                throw new Error(
                    "Không nhận được URL thanh toán từ VNPay. Vui lòng thử lại.",
                );
            }
        } catch (error) {
            console.error("Lỗi thanh toán VNPay:", error);
            throw new Error("Thanh toán VNPay thất bại: " + error.message);
        }
    };

    // Xử lý thanh toán tại quầy (SỬA LẠI BIẾN)
    const handleCashPayment = async (bookingPayload) => {
        try {
            // Xác định trạng thái thanh toán
            let paymentStatus = "pending";

            if (bookingData.paymentOption === "full") {
                paymentStatus = "pending";
            } else {
                paymentStatus = "deposit_pending";
            }

            // Tạo transaction data
            const transactionData = {
                userId: currentUser?.id || 3,
                provider: "CASH",
                providerTransactionId: `CASH${Date.now()}`,
                amount: amountToPay,
                currency: "VND",
                type: "PAYMENT",
                metadata: JSON.stringify({
                    note: `Payment at counter for booking ${bookingPayload.id}`,
                    customerName: bookingData.name,
                    customerPhone: bookingData.phone,
                    paymentOption: bookingData.paymentOption,
                    amountToPay: amountToPay,
                    totalPrice: totalPrice,
                    // SỬA: Dùng checkIn và checkOut (camelCase)
                    checkin: bookingData.checkIn,
                    checkout: bookingData.checkOut,
                    userId: currentUser?.id,
                }),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                bookingDTO: {
                    userEmail: bookingData.email,
                    // SỬA: Dùng checkIn và checkOut (camelCase)
                    checkIn: bookingData.checkIn,
                    checkOut: bookingData.checkOut,
                    // SỬA: Dùng biến 'nights' từ useMemo
                    nights: nights,
                    // SỬA: Dùng bookingData.guests (số khách nhập)
                    guests: bookingData.guests || 1, 
                    priceTotal: totalPrice,
                    depositAmount: depositAmount,
                    roomId: bookingData.roomId || 1,
                    userId: currentUser?.id || 3,
                },
            };

            // Gọi API tạo transaction cho thanh toán tại quầy
            const transactionResponse = await bookingService.createTransaction(
                transactionData,
            );
            console.log("Cash transaction created:", transactionResponse);

            return transactionResponse;
        } catch (error) {
            console.error(
                "Lỗi khi tạo transaction thanh toán tại quầy:",
                error,
            );
            throw new Error(
                "Tạo đơn đặt phòng thanh toán tại quầy thất bại: " +
                    error.message,
            );
        }
    };
    const handleVnPayment = async (bookingPayload) => {
        try {
            // Xác định trạng thái thanh toán
            let paymentStatus = "pending";

            if (bookingData.paymentOption === "full") {
                paymentStatus = "pending";
            } else {
                paymentStatus = "deposit_pending";
            }

            // Tạo transaction data
            const transactionData = {
                userId: currentUser?.id || 3,
                provider: "VNPAY",
                providerTransactionId: `VNPAY${Date.now()}`,
                amount: amountToPay,
                currency: "VND",
                type: "PAYMENT",
                metadata: JSON.stringify({
                    note: `Payment at counter for booking ${bookingPayload.id}`,
                    customerName: bookingData.name,
                    customerPhone: bookingData.phone,
                    paymentOption: bookingData.paymentOption,
                    amountToPay: amountToPay,
                    totalPrice: totalPrice,
                    // SỬA: Dùng checkIn và checkOut (camelCase)
                    checkin: bookingData.checkIn,
                    checkout: bookingData.checkOut,
                    userId: currentUser?.id,
                }),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                bookingDTO: {
                    userEmail: bookingData.email,
                    // SỬA: Dùng checkIn và checkOut (camelCase)
                    checkIn: bookingData.checkIn,
                    checkOut: bookingData.checkOut,
                    // SỬA: Dùng biến 'nights' từ useMemo
                    nights: nights,
                    // SỬA: Dùng bookingData.guests (số khách nhập)
                    guests: bookingData.guests || 1, 
                    priceTotal: totalPrice,
                    depositAmount: bookingData.paymentOption !== "full" ? depositAmount : null,
                    roomId: bookingData.roomId || 1,
                    userId: currentUser?.id || 3,
                },
            };

            // Gọi API tạo transaction cho thanh toán vnpay
            const transactionResponse = await bookingService.createTransaction(
                transactionData,
            );
            console.log("Cash transaction created:", transactionResponse);

            return transactionResponse;
        } catch (error) {
            console.error(
                "Lỗi khi tạo transaction thanh toán tại quầy:",
                error,
            );
            throw new Error(
                "Tạo đơn đặt phòng thanh toán tại quầy thất bại: " +
                    error.message,
            );
        }
    };

    // Xử lý submit đặt phòng với API (SỬA LẠI BIẾN)
    const handleBookingSubmit = async () => {
        setErrorMessage("");
        setIsSubmitting(true);

        try {
            // Kiểm tra user đã đăng nhập chưa
            if (!currentUser) {
                throw new Error("Vui lòng đăng nhập để đặt phòng.");
            }

            // Validation cuối cùng
            if (!bookingData.paymentMethod) {
                throw new Error("Vui lòng chọn phương thức thanh toán.");
            }

            // Kiểm tra tính khả dụng của phòng
            let isRoomAvailable = true;
            try {
                if (bookingData.roomId) {
                    isRoomAvailable =
                        await bookingService.checkRoomAvailability(
                            bookingData.roomId,
                            // SỬA: Dùng checkIn và checkOut (camelCase)
                            bookingData.checkIn,
                            bookingData.checkOut,
                        );
                }
            } catch (availabilityError) {
                console.warn(
                    "Không thể kiểm tra tính khả dụng phòng:",
                    availabilityError,
                );
                isRoomAvailable = true; // (Tạm thời bỏ qua nếu API lỗi)
            }

            if (!isRoomAvailable) {
                throw new Error(
                    "Loại phòng này tạm thời không còn phòng trống. Vui lòng chọn loại phòng khác hoặc thử lại sau.",
                );
            }

            // Tạo booking ID
            const bookingId = "BK" + Date.now().toString().slice(-8);

            // Xác định trạng thái thanh toán dựa trên phương thức
            let paymentStatus = "confirmed";
            let amountPaid = amountToPay;
            let remainingDue = remainingAmount;

            if (bookingData.paymentMethod === "cash") {
                if (bookingData.paymentOption === "full") {
                    paymentStatus = "pending";
                    amountPaid = 0;
                    remainingDue = totalPrice;
                } else {
                    paymentStatus = "deposit_pending";
                    amountPaid = 0;
                    remainingDue = totalPrice;
                }
            } else {
                // VNPay
                paymentStatus =
                    bookingData.paymentOption === "full"
                        ? "confirmed"
                        : "deposit_paid";
            }
            // Tạo payload cho booking
            const newBookingPayload = {
                id: bookingId,
                customer: bookingData.name.trim(),
                roomType: bookingData.roomType || preFilledData?.roomType || "Deluxe",
                roomNumber: bookingData.roomNumber || preFilledData?.roomNumber || "001",
                roomId: bookingData.roomId || 1,
                checkin: bookingData.checkIn,
                checkout: bookingData.checkOut,
                dates: `${bookingData.checkIn} - ${bookingData.checkOut}`,
                total: totalPrice,
                amountPaid: amountPaid,
                remainingDue: remainingDue,
                paymentMethod: bookingData.paymentMethod,
                paymentOption: bookingData.paymentOption,
                status: paymentStatus,
                customerPhone: bookingData.phone,
                customerEmail: bookingData.email,
                specialRequests: bookingData.requests,
                bookingDate: formatDateToLocalString(new Date()),
                nights: nights,
                guests: bookingData.guests || 1,
                roomTitle:
                    bookingData.roomType || // Sửa: Dùng roomType
                    preFilledData?.roomType ||
                    "Phòng Deluxe",
                roomDescription:
                    bookingData.roomDescription ||
                    preFilledData?.roomDescription ||
                    "Phòng sang trọng",
                roomArea:
                    bookingData.roomArea || preFilledData?.roomArea || "30",
                roomCapacity:
                    bookingData.roomCapacity ||
                    preFilledData?.roomCapacity ||
                    2,
                userId: currentUser.id,
            };

            // Xử lý thanh toán dựa trên phương thức
            if (bookingData.paymentMethod === "vnpay") {
                try {
                    // Tạo transaction trước
                    const transactionResponse = await handleVnPayment(newBookingPayload);
                    
                    // Lưu bookingCode vào sessionStorage để dùng sau khi callback
                    if (transactionResponse?.bookingDTO?.bookingCode) {
                        sessionStorage.setItem('pendingBookingCode', transactionResponse.bookingDTO.bookingCode);
                        console.log("Saved bookingCode to sessionStorage:", transactionResponse.bookingDTO.bookingCode);
                    }
                    
                    // Lưu roomNumber vào sessionStorage để dùng sau khi callback
                    if (newBookingPayload.roomNumber) {
                        sessionStorage.setItem('pendingRoomNumber', newBookingPayload.roomNumber);
                        console.log("Saved roomNumber to sessionStorage:", newBookingPayload.roomNumber);
                    }
                    
                    // Sau khi tạo transaction thành công, mới tạo VNPay order và redirect
                    await handleVNPayPayment(newBookingPayload);
                } catch (error) {
                    console.error("Lỗi trong quá trình thanh toán VNPay:", error);
                    setErrorMessage(error.message || "Có lỗi xảy ra khi xử lý thanh toán VNPay");
                    throw error;
                }
                return; // Dừng lại ở đây vì sẽ chuyển hướng đến VNPay
            } else if (bookingData.paymentMethod === "cash") {
                // Xử lý thanh toán tại quầy
                const transactionResponse = await handleCashPayment(newBookingPayload);
                
                // Lấy bookingCode từ response
                const bookingCode = transactionResponse?.bookingDTO?.bookingCode || newBookingPayload.id;

                // Thêm booking vào hệ thống local context
                addBooking(newBookingPayload);

                console.log(
                    "Đặt phòng thanh toán tại quầy thành công:",
                    newBookingPayload,
                );

                // Lưu thông tin booking vào sessionStorage để trang detail có thể lấy
                const cashBookingInfo = {
                    bookingId: bookingCode, // Dùng bookingCode thay vì id
                    roomType: newBookingPayload.roomType,
                    roomNumber: newBookingPayload.roomNumber,
                    checkin: newBookingPayload.checkin,
                    checkout: newBookingPayload.checkout,
                    customer: newBookingPayload.customer,
                    customerEmail: newBookingPayload.customerEmail, // Thêm email để gửi email
                    amountPaid: newBookingPayload.amountPaid,
                    amountToPay: amountToPay, // Dùng amountToPay (số tiền lẽ ra phải trả)
                    remainingDue: newBookingPayload.remainingDue,
                    paymentMethod: "cash",
                    paymentOption: newBookingPayload.paymentOption,
                    createdAt: newBookingPayload.createdAt || new Date().toISOString(), // Thêm ngày tạo
                };
                const bookingKey = `booking_${bookingCode}`;
                sessionStorage.setItem(bookingKey, JSON.stringify(cashBookingInfo));
                console.log("Saved cash booking info with key:", bookingKey, "bookingId:", bookingCode);
                
                // Hiển thị xác nhận với thông tin đầy đủ
                setConfirmedBookingInfo(cashBookingInfo);
            }
        } catch (error) {
            console.error("Lỗi khi đặt phòng:", error);
            setErrorMessage(
                error.message ||
                    "Có lỗi xảy ra khi đặt phòng. Vui lòng thử lại.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };
    const today = formatDateToLocalString(new Date());

    // Hiển thị progress steps
    const steps = [
        { number: 1, title: "Chọn Phòng & Ngày" },
        { number: 2, title: "Thông Tin Cá Nhân" },
        { number: 3, title: "Thanh Toán" },
    ];

    // Tên loại phòng để hiển thị
    const getRoomTypeName = () => {
        if (preFilledData?.roomType) {
            return preFilledData.roomType;
        }

        const roomTypeNames = {
            deluxe: "Phòng Deluxe",
            suite: "Phòng Suite",
            honeymoon: "Phòng Honeymoon",
            standard: "Phòng Tiêu chuẩn",
        };
        return roomTypeNames[bookingData.roomType] || "Phòng Deluxe";
    };


    // Nếu đang xử lý callback từ VNPay, hiển thị component xử lý callback
    if (isProcessingVNPayCallback) {
        return (
            <VNPayCallbackHandler
                onSuccess={handleVNPayCallbackSuccess}
                onError={handleVNPayCallbackError}
            />
        );
    }

    return (
        <>
            <style>{highlightStyle}</style>
            <div className="min-h-screen bg-gray-50 py-8 font-inter">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold text-gray-800 mb-4">
                        Đặt Phòng
                    </h2>
                    <p className="text-gray-600 text-lg">
                        Trải nghiệm dịch vụ đẳng cấp tại La Rosé
                    </p>

                    {/* Hiển thị thông tin user */}
                    {currentUser && (
                        <div className="max-w-4xl mx-auto mb-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-blue-500 mr-2"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span className="text-blue-700 text-sm">
                                    Đang đặt phòng với tư cách:{" "}
                                    <strong>{currentUser.fullName}</strong> (
                                    {currentUser.email})
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Progress Steps */}
                <div className="max-w-4xl mx-auto mb-8">
                    <div className="flex items-center justify-between">
                        {steps.map((stepItem, index) => (
                            <div
                                key={stepItem.number}
                                className="flex items-center"
                            >
                                <div
                                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                                        step >= stepItem.number
                                            ? "bg-rose-600 border-rose-600 text-white"
                                            : "border-gray-300 text-gray-500"
                                    } font-semibold`}
                                >
                                    {stepItem.number}
                                </div>
                                <span
                                    className={`ml-2 font-medium ${
                                        step >= stepItem.number
                                            ? "text-rose-600"
                                            : "text-gray-500"
                                    }`}
                                >
                                    {stepItem.title}
                                </span>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`w-16 h-1 mx-4 ${
                                            step > stepItem.number
                                                ? "bg-rose-600"
                                                : "bg-gray-300"
                                        }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Thông báo từ RoomsPage */}
                {fromRoomPage && preFilledData && (
                    <div className="max-w-4xl mx-auto mb-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                            <svg
                                className="w-5 h-5 text-green-500 mr-3 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <div>
                                <span className="text-green-700 font-medium">
                                    Đang đặt phòng:{" "}
                                    <strong>
                                        {preFilledData.roomTitle ||
                                            getRoomTypeName()}
                                    </strong>
                                </span>
                                {preFilledData.price && (
                                    <span className="text-green-600 ml-2">
                                        - {preFilledData.price.toLocaleString()}
                                        ₫/đêm
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                    {confirmedBookingInfo ? (
                        <ConfirmationContent
                            bookingInfo={confirmedBookingInfo}
                            onResetBooking={resetBooking}
                        />
                    ) : (
                        <div className="p-8">
                            {/* Error Message */}
                            {errorMessage && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center">
                                        <svg
                                            className="w-5 h-5 text-red-500 mr-2"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <span className="text-red-700 font-medium">
                                            {errorMessage}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Step 1: Room Selection */}
                          {step === 1 && (
    <div className="space-y-6">
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            Chọn Phòng & Thời Gian
        </h3>
        <p className="text-gray-600 mb-6">
            Lựa chọn loại phòng và thời gian lưu trú
            phù hợp với nhu cầu của bạn
        </p>

        {/* Hiển thị lỗi chung */}
        {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                {errorMessage}
            </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
            {/* 1. Loại phòng (Giữ nguyên) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại phòng *
                </label>
                <input
                    type="text"
                    name="roomType"
                    value={bookingData.roomType}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-colors"
                    disabled={fromRoomPage || loadingRoomTypes}
                />
            </div>

            {/* 2. Số lượng người (Giữ nguyên) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng người *
                </label>
                <input
                    type="number"
                    name="guests"
                    value={bookingData.guests}
                    onChange={handleChange}
                    min="1"
                    max={bookingData.roomCapacity || 1}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-colors"
                    disabled={!bookingData.roomId}
                />
            </div>
        </div>
        
        {/* 3. SỬA: Tách riêng 2 ô chọn ngày (thay thế Lịch inline) */}
        <div className="grid md:grid-cols-2 gap-6 relative">
            
            {/* Ngày nhận phòng */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày nhận phòng *
                </label>
                <DatePicker
                    selected={bookingDates.checkIn}
                    onChange={handleCheckInChange}
                    
                    minDate={todayDate} // Không cho đặt quá khứ
                    excludeDates={bookedDates} // Chặn ngày đã đặt
                    highlightDates={bookedDates} // Bôi đỏ các ngày đã đặt
                    
                    // Chặn ngày trong quá khứ và ngày đã đặt
                    filterDate={(date) => {
                        // Không cho chọn ngày trong quá khứ
                        const today = new Date(todayDate);
                        today.setHours(0, 0, 0, 0);
                        const checkDate = new Date(date);
                        checkDate.setHours(0, 0, 0, 0);
                        if (checkDate < today) return false;
                        
                        // Nếu đang load bookedBookings, không cho chọn (chờ load xong)
                        if (loadingBookedDates) {
                            return false;
                        }
                        
                        // Kiểm tra xem ngày này có nằm trong khoảng booking đã có không
                        const isInBookedRange = bookedBookings.some(booking => {
                            const bookingCheckIn = new Date(booking.checkIn);
                            const bookingCheckOut = new Date(booking.checkOut);
                            bookingCheckIn.setHours(0, 0, 0, 0);
                            bookingCheckOut.setHours(0, 0, 0, 0);
                            // Không thể checkIn vào ngày từ checkIn đến checkOut-1
                            return checkDate >= bookingCheckIn && checkDate < bookingCheckOut;
                        });
                        
                        if (isInBookedRange) return false;
                        
                        return true;
                    }}
                    
                    // Ngăn chặn nhập thủ công - chỉ cho chọn từ calendar
                    shouldCloseOnSelect={true}
                    strictParsing={true}
                    
                    placeholderText="Chọn ngày nhận phòng"
                    dateFormat="dd/MM/yyyy"
                    locale={vi}
                    
                    selectsStart
                    startDate={bookingDates.checkIn}
                    endDate={bookingDates.checkOut}
                    
                    disabled={!bookingData.roomId || loadingBookedDates}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-colors"
                    autoComplete="off"
                />
            </div>
            
            {/* Ngày trả phòng */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày trả phòng *
                </label>
                <DatePicker
                    selected={bookingDates.checkOut}
                    onChange={handleCheckOutChange}
                    
                    minDate={minCheckOutDate}
                    highlightDates={bookedDates} // Bôi đỏ các ngày đã đặt
                    
                    // Chặn ngày <= checkIn và ngày đã đặt
                    filterDate={(date) => {
                        if (!bookingDates.checkIn) return false;
                        
                        // Nếu đang load bookedBookings, không cho chọn (chờ load xong)
                        if (loadingBookedDates) {
                            return false;
                        }
                        
                        const checkInDate = new Date(bookingDates.checkIn);
                        const checkOutDate = new Date(date);
                        checkInDate.setHours(0, 0, 0, 0);
                        checkOutDate.setHours(0, 0, 0, 0);
                        
                        // Không cho chọn ngày <= checkIn
                        if (checkOutDate <= checkInDate) return false;
                        
                        // Kiểm tra overlap: nếu khoảng checkIn đến date có overlap với booking nào
                        const hasOverlap = bookedBookings.some(booking => {
                            const bookingCheckIn = new Date(booking.checkIn);
                            const bookingCheckOut = new Date(booking.checkOut);
                            bookingCheckIn.setHours(0, 0, 0, 0);
                            bookingCheckOut.setHours(0, 0, 0, 0);
                            // Overlap nếu khoảng thời gian chọn có ngày nào nằm trong khoảng đã đặt
                            return checkInDate < bookingCheckOut && checkOutDate > bookingCheckIn;
                        });
                        
                        if (hasOverlap) return false;
                        
                        return true;
                    }}
                    
                    // Ngăn chặn nhập thủ công - chỉ cho chọn từ calendar
                    shouldCloseOnSelect={true}
                    strictParsing={true}
                    
                    placeholderText="Chọn ngày trả phòng"
                    dateFormat="dd/MM/yyyy"
                    locale={vi}
                    
                    selectsEnd
                    startDate={bookingDates.checkIn}
                    endDate={bookingDates.checkOut}
                    
                    disabled={!bookingDates.checkIn || loadingBookedDates}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-colors"
                    autoComplete="off"
                />
            </div>

            {/* Loading overlay */}
            {loadingBookedDates && (
                 <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg col-span-2 z-10">
                     <div className="text-gray-600">Đang tải lịch...</div>
                 </div>
            )}
        </div>

        {/* Thông tin phòng */}
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <h4 className="font-semibold text-gray-800 mb-2">
                {bookingData.roomType || "Vui lòng chọn loại phòng"}
            </h4>
            <p className="text-gray-600 text-sm">
                {bookingData.roomDescription || ""}
            </p>
            {bookingData.roomArea > 0 && (
                <p className="text-gray-600 text-sm mt-1">
                    Diện tích: {bookingData.roomArea}m²
                </p>
            )}
            {bookingData.roomCapacity > 0 && (
                <p className="text-gray-600 text-sm mt-1">
                    Sức chứa: {bookingData.roomCapacity} người
                </p>
            )}
        </div>

        {/* Tổng chi phí */}
        <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-semibold text-rose-700">
                        Tổng chi phí dự kiến
                    </p>
                    <p className="text-sm text-gray-600">
                        {bookingData.roomPrice.toLocaleString()} ₫/đêm
                        × {nights} đêm 
                        {/* Đảm bảo 'nights' được tính toán trong useEffect hoặc ở đâu đó */}
                    </p>
                </div>
                <span className="text-2xl font-bold text-amber-600">
                    {totalPrice.toLocaleString()}₫
                    {/* Đảm bảo 'totalPrice' được tính toán */}
                </span>
            </div>
        </div>

        {/* Navigation */}
        <button
            onClick={nextStep}
            className="w-full bg-rose-600 text-white py-3 px-6 rounded-lg hover:bg-rose-700 transition-colors font-semibold shadow-md hover:shadow-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            // Điều kiện disabled này bây giờ sẽ hoạt động chính xác
            disabled={!bookingDates.checkIn || !bookingDates.checkOut || !bookingData.roomId}
        >
            Tiếp Tục - Thông Tin Cá Nhân
        </button>
    </div>
)}
                            {/* Step 2: Customer Information */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                                        Thông Tin Cá Nhân
                                    </h3>
                                    <p className="text-gray-600 mb-6">                                       
                                    </p>

                                    {/* Thông báo tự động điền */}
                                    {currentUser && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                            <div className="flex items-center">
                                                <svg
                                                    className="w-4 h-4 text-green-500 mr-2"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                <span className="text-green-700 text-sm">
                                                    Thông tin đã được tự động
                                                    điền từ tài khoản của bạn
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Họ và tên */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Họ và tên *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={bookingData.name}
                                                onChange={handleChange}
                                                placeholder="Nguyễn Văn A"
                                                disabled={!!bookingData.name && bookingData.name.trim() !== ""}
                                                className={`w-full p-3 border border-gray-300 rounded-lg transition-colors ${
                                                    bookingData.name && bookingData.name.trim() !== ""
                                                        ? "bg-gray-100 cursor-not-allowed text-gray-600"
                                                        : "focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                                                }`}
                                            />
                                            {currentUser &&
                                                bookingData.name &&
                                                bookingData.name ===
                                                    currentUser.fullName && (
                                                    <p className="text-xs text-green-600 mt-1">
                                                        ✓ Tự động điền từ tài
                                                        khoản
                                                    </p>
                                                )}
                                        </div>

                                        {/* Số điện thoại */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Số điện thoại *
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={bookingData.phone}
                                                onChange={handleChange}
                                                placeholder="0912345678"
                                                disabled={!!bookingData.phone && bookingData.phone.trim() !== ""}
                                                className={`w-full p-3 border border-gray-300 rounded-lg transition-colors ${
                                                    bookingData.phone && bookingData.phone.trim() !== ""
                                                        ? "bg-gray-100 cursor-not-allowed text-gray-600"
                                                        : "focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                                                }`}
                                            />
                                            {currentUser &&
                                                bookingData.phone &&
                                                bookingData.phone ===
                                                    currentUser.phone && (
                                                    <p className="text-xs text-green-600 mt-1">
                                                        ✓ Tự động điền từ tài
                                                        khoản
                                                    </p>
                                                )}
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={bookingData.email}
                                                onChange={handleChange}
                                                placeholder="example@email.com"
                                                disabled={!!bookingData.email && bookingData.email.trim() !== ""}
                                                className={`w-full p-3 border border-gray-300 rounded-lg transition-colors ${
                                                    bookingData.email && bookingData.email.trim() !== ""
                                                        ? "bg-gray-100 cursor-not-allowed text-gray-600"
                                                        : "focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                                                }`}
                                            />
                                            {currentUser &&
                                                bookingData.email &&
                                                bookingData.email ===
                                                    currentUser.email && (
                                                    <p className="text-xs text-green-600 mt-1">
                                                        ✓ Tự động điền từ tài
                                                        khoản
                                                    </p>
                                                )}
                                        </div>

                                        {/* Yêu cầu đặc biệt */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Yêu cầu đặc biệt (tùy chọn)
                                            </label>
                                            <textarea
                                                name="requests"
                                                value={bookingData.requests}
                                                onChange={handleChange}
                                                rows="3"
                                                placeholder="Ví dụ: Cần giường phụ, phòng không hút thuốc, dịp kỷ niệm..."
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-colors resize-none"
                                            ></textarea>
                                        </div>
                                    </div>

                                    {/* Navigation */}
                                    <div className="flex space-x-4 mt-8">
                                        <button
                                            onClick={prevStep}
                                            className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                                        >
                                            Quay Lại
                                        </button>
                                        <button
                                            onClick={nextStep}
                                            className="flex-1 bg-rose-600 text-white py-3 px-6 rounded-lg hover:bg-rose-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                                        >
                                            Tiếp Tục - Thanh Toán
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Payment */}
                            {step === 3 && (
                                <div className="space-y-8">
                                    <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                                        Thanh Toán
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Lựa chọn phương thức thanh toán phù hợp
                                    </p>

                                    <div className="grid lg:grid-cols-3 gap-8">
                                        {/* Payment Options */}
                                        <div className="lg:col-span-2 space-y-6">
                                            {/* Hình thức thanh toán */}
                                            <div>
                                                <h4 className="font-semibold text-gray-800 mb-4 text-lg">
                                                    Hình thức thanh toán
                                                </h4>
                                                <div className="space-y-4">
                                                    {/* Thanh toán toàn bộ */}
                                                    <label
                                                        className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                                            bookingData.paymentOption ===
                                                            "full"
                                                                ? "border-rose-500 bg-rose-50 shadow-sm"
                                                                : "border-gray-300 hover:border-gray-400"
                                                        }`}
                                                    >
                                                        <div className="flex items-start">
                                                            <input
                                                                type="radio"
                                                                name="paymentOption"
                                                                value="full"
                                                                checked={
                                                                    bookingData.paymentOption ===
                                                                    "full"
                                                                }
                                                                onChange={
                                                                    handleChange
                                                                }
                                                                className="mt-1 mr-3 text-rose-600 focus:ring-rose-500"
                                                            />
                                                            <div>
                                                                <span className="font-bold text-rose-700">
                                                                    Thanh toán
                                                                    toàn bộ
                                                                </span>
                                                                <p className="text-gray-600 mt-1 text-sm">
                                                                    Thanh toán
                                                                    100% tổng số
                                                                    tiền
                                                                </p>
                                                                <p className="text-rose-600 font-semibold mt-2">
                                                                    {totalPrice.toLocaleString()}
                                                                    ₫
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </label>

                                                    {/* Đặt cọc */}
                                                    <label
                                                        className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                                            bookingData.paymentOption ===
                                                            "deposit"
                                                                ? "border-rose-500 bg-rose-50 shadow-sm"
                                                                : "border-gray-300 hover:border-gray-400"
                                                        }`}
                                                    >
                                                        <div className="flex items-start">
                                                            <input
                                                                type="radio"
                                                                name="paymentOption"
                                                                value="deposit"
                                                                checked={
                                                                    bookingData.paymentOption ===
                                                                    "deposit"
                                                                }
                                                                onChange={
                                                                    handleChange
                                                                }
                                                                className="mt-1 mr-3 text-rose-600 focus:ring-rose-500"
                                                            />
                                                            <div>
                                                                <span className="font-bold text-rose-700">
                                                                    Đặt cọc{" "}
                                                                    {DEPOSIT_PERCENTAGE *
                                                                        100}
                                                                    %
                                                                </span>
                                                                <p className="text-gray-600 mt-1 text-sm">
                                                                    Thanh toán{" "}
                                                                    {DEPOSIT_PERCENTAGE *
                                                                        100}
                                                                    % trước, số
                                                                    tiền còn lại
                                                                    thanh toán
                                                                    khi nhận
                                                                    phòng
                                                                </p>
                                                                <div className="mt-2">
                                                                    <p className="text-rose-600 font-semibold">
                                                                        Đặt cọc:{" "}
                                                                        {depositAmount.toLocaleString()}
                                                                        ₫
                                                                    </p>
                                                                    <p className="text-gray-500 text-xs">
                                                                        Còn lại:{" "}
                                                                        {remainingAmount.toLocaleString()}
                                                                        ₫ (thanh
                                                                        toán khi
                                                                        check-in)
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Phương thức thanh toán */}
                                            <div>
                                                <h4 className="font-semibold text-gray-800 mb-4 text-lg">
                                                    Phương thức thanh toán
                                                </h4>
                                                <select
                                                    name="paymentMethod"
                                                    value={
                                                        bookingData.paymentMethod
                                                    }
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-200 transition-colors"
                                                >
                                                    <option value="vnpay">
                                                        VNPay - Ví điện tử & Thẻ
                                                        ngân hàng
                                                    </option>
                                                    <option value="cash">
                                                        Thanh toán trực tiếp tại
                                                        khách sạn
                                                    </option>
                                                </select>

                                                {/* Thông báo cho thanh toán tại quầy */}
                                                {bookingData.paymentMethod ===
                                                    "cash" && (
                                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <p className="text-sm text-blue-700">
                                                            💡{" "}
                                                            <strong>
                                                                Lưu ý:
                                                            </strong>{" "}
                                                            Khi chọn thanh toán
                                                            tại quầy, quý khách
                                                            vui lòng đến trực
                                                            tiếp khách sạn để
                                                            hoàn tất thủ tục
                                                            thanh toán và nhận
                                                            phòng.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Order Summary */}
                                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-fit sticky top-4">
                                            <h4 className="font-bold text-gray-800 mb-4 text-lg border-b pb-2">
                                                Đơn Hàng
                                            </h4>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">
                                                        Khách hàng:
                                                    </span>
                                                    <span className="font-semibold">
                                                        {bookingData.name ||
                                                            "Chưa nhập"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">
                                                        Loại phòng:
                                                    </span>
                                                    <span className="font-semibold text-right">
                                                        {getRoomTypeName()}
                                                        <br />
                                                        <span className="text-gray-500 text-xs">
                                                            {
                                                                bookingData.quantity
                                                            }{" "}
                                                            phòng
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">
                                                        Thời gian:
                                                    </span>
                                                    <span className="font-semibold text-right">
                                                        {bookingData.checkIn || "Chưa chọn"}
                                                        <br />
                                                        đến{" "}
                                                        {bookingData.checkOut || "Chưa chọn"}
                                                        <br />
                                                        <span className="text-gray-500 text-xs">
                                                            {nights > 0 ? `${nights} đêm` : "Chưa chọn ngày"}
                                                        </span>
                                                    </span>
                                                </div>

                                                <hr className="my-3 border-gray-300" />

                                                <div className="flex justify-between text-base">
                                                    <span className="font-semibold">
                                                        Tổng chi phí:
                                                    </span>
                                                    <span className="font-bold text-rose-600">
                                                        {totalPrice.toLocaleString()}
                                                        ₫
                                                    </span>
                                                </div>

                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">
                                                        Hình thức:
                                                    </span>
                                                    <span className="text-rose-600 font-medium">
                                                        {bookingData.paymentOption ===
                                                        "full"
                                                            ? "Thanh toán toàn bộ"
                                                            : `Đặt cọc ${
                                                                  DEPOSIT_PERCENTAGE *
                                                                  100
                                                              }%`}
                                                    </span>
                                                </div>

                                                <hr className="my-3 border-gray-300" />

                                                <div
                                                    className={`p-3 rounded-lg border ${
                                                        bookingData.paymentMethod ===
                                                        "cash"
                                                            ? "bg-blue-50 border-blue-200"
                                                            : "bg-amber-50 border-amber-200"
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-center font-bold">
                                                        <span className="text-gray-800">
                                                            {bookingData.paymentMethod ===
                                                            "cash"
                                                                ? "Số tiền cần thanh toán tại quầy:"
                                                                : "Cần thanh toán:"}
                                                        </span>
                                                        <span
                                                            className={`text-2xl ${
                                                                bookingData.paymentMethod ===
                                                                "cash"
                                                                    ? "text-blue-600"
                                                                    : "text-amber-600"
                                                            }`}
                                                        >
                                                            {amountToPay.toLocaleString()}
                                                            ₫
                                                        </span>
                                                    </div>
                                                    {bookingData.paymentOption ===
                                                        "deposit" && (
                                                        <p className="text-xs text-gray-600 mt-2">
                                                            Số tiền còn lại{" "}
                                                            {remainingAmount.toLocaleString()}
                                                            ₫ sẽ được thanh toán
                                                            khi nhận phòng
                                                        </p>
                                                    )}
                                                    {bookingData.paymentMethod ===
                                                        "cash" && (
                                                        <p className="text-xs text-blue-600 mt-2 font-medium">
                                                            💳 Thanh toán trực
                                                            tiếp tại quầy lễ tân
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Navigation */}
                                    <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
                                        <button
                                            onClick={prevStep}
                                            className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                                        >
                                            Quay Lại
                                        </button>
                                        <button
                                            onClick={handleBookingSubmit}
                                            disabled={
                                                isSubmitting || !currentUser
                                            }
                                            className="flex-1 bg-gradient-to-r from-rose-600 to-rose-700 text-white py-3 px-6 rounded-lg hover:shadow-lg transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <div className="flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                    Đang xử lý...
                                                </div>
                                            ) : !currentUser ? (
                                                "Vui lòng đăng nhập"
                                            ) : bookingData.paymentMethod ===
                                              "cash" ? (
                                                `Xác Nhận Đặt Phòng`
                                            ) : (
                                                `Thanh Toán ${amountToPay.toLocaleString()}₫`
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
        </>
    );
};

export default BookingPage;