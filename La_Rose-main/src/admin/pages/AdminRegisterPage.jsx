import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Shield, UserCog, Building, Sparkles, Lock, UserPlus } from "lucide-react";
import { useEffect } from "react";
import authService from "../../services/auth.service";
import session from "../../utils/SessionManager";

const AdminRegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        fullName: "",
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        session.logout();
    }, []);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone) => {
        const phoneRegex =
            /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
        return phoneRegex.test(phone);
    };

    const validatePassword = (password) => {
        return password.length >= 6;
    };

    const validateFullName = (fullName) => {
        return fullName.trim().length >= 2 && /^[a-zA-ZÀ-ỹ\s]+$/.test(fullName);
    };

    const handleAdminRegister = async (e) => {
        e.preventDefault();

        // Validate all fields
        if (!validateEmail(formData.email)) {
            toast.warning("⚠️ Email không hợp lệ!", {
                position: "top-right",
            });
            return;
        }

        if (!validatePassword(formData.password)) {
            toast.warning("⚠️ Mật khẩu phải có ít nhất 6 ký tự!", {
                position: "top-right",
            });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.warning("⚠️ Mật khẩu xác nhận không khớp!", {
                position: "top-right",
            });
            return;
        }

        if (!validateFullName(formData.fullName)) {
            toast.warning(
                "⚠️ Họ và tên phải có ít nhất 2 ký tự và chỉ chứa chữ cái!",
                {
                    position: "top-right",
                },
            );
            return;
        }

        if (!validatePhone(formData.phone)) {
            toast.warning(
                "⚠️ Số điện thoại không hợp lệ! Ví dụ: 0912345678 hoặc +84912345678",
                {
                    position: "top-right",
                },
            );
            return;
        }

        setIsLoading(true);

        try {
            const userData = {
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                phone: formData.phone,
                roles: ["ADMIN"], // Gửi roles dưới dạng array (Set<String> trong backend)
            };

            const response = await authService.signup(userData);
            console.log(response);

            toast.success(
                "🎉 Đăng ký tài khoản quản trị thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
                {
                    position: "top-right",
                    autoClose: 4000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                },
            );

            // Chuyển về trang login sau khi đăng ký thành công
            setTimeout(() => {
                navigate("/admin/login");
            }, 2000);
        } catch (error) {
            console.error("Admin register error:", error);
            toast.error(
                `❌ ${error.message || "Đăng ký thất bại! Vui lòng thử lại."}`,
                {
                    position: "top-right",
                },
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-rose-gradient relative overflow-hidden flex items-center justify-center p-4">
            {/* Background animated elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-200 rounded-full mix-blend-multiply blur-xl opacity-20 animate-pulse delay-1000"></div>
                <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-rose-200 rounded-full mix-blend-multiply blur-xl opacity-30 animate-pulse delay-500"></div>
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className={`absolute w-2 h-2 rounded-full bg-rose-300 opacity-40 ${
                            i % 3 === 0
                                ? "animate-bounce"
                                : i % 3 === 1
                                ? "animate-pulse"
                                : "animate-ping"
                        }`}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 4}s`,
                        }}
                    ></div>
                ))}
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
                {/* Left Side - Admin Welcome Content */}
                <div className="text-center lg:text-left animate-fade-in">
                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                        <div className="w-12 h-12 bg-gold-gradient rounded-2xl flex items-center justify-center shadow-rose">
                            <UserPlus className="w-6 h-6 text-rose-deep" />
                        </div>
                        <h1 className="font-playfair text-3xl font-bold text-rose-deep">
                            La Rosé Admin
                        </h1>
                    </div>

                    <h2 className="font-playfair text-5xl lg:text-6xl font-bold text-gray-800 mb-6 leading-tight">
                        Tạo tài khoản <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600">
                            Quản trị viên
                        </span>
                    </h2>

                    <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed">
                        Đăng ký tài khoản quản trị để có quyền truy cập vào hệ thống quản lý khách sạn, đặt phòng và người dùng.
                    </p>

                    {/* Admin Features List */}
                    <div className="space-y-4 mb-8">
                        {[
                            {
                                icon: <Building className="w-5 h-5" />,
                                text: "Quản lý hệ thống khách sạn",
                            },
                            {
                                icon: <UserCog className="w-5 h-5" />,
                                text: "Quản lý người dùng & nhân viên",
                            },
                            {
                                icon: <Lock className="w-5 h-5" />,
                                text: "Bảo mật cấp cao",
                            },
                            {
                                icon: <Shield className="w-5 h-5" />,
                                text: "Quyền truy cập đặc biệt",
                            },
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 text-gray-700"
                            >
                                <div className="w-8 h-8 bg-gold-gradient rounded-full flex items-center justify-center text-rose-deep shadow-rose">
                                    {feature.icon}
                                </div>
                                <span className="text-lg">{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Security Notice */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-rose-200 shadow-rose">
                        <div className="flex items-center gap-3 text-rose-deep">
                            <Shield className="w-5 h-5" />
                            <span className="text-sm font-medium">
                                Yêu cầu xác thực
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                            Tài khoản quản trị cần được xác nhận qua email trước khi có thể sử dụng. Vui lòng kiểm tra hộp thư đến sau khi đăng ký.
                        </p>
                    </div>
                </div>

                {/* Right Side - Admin Register Form */}
                <div className="glass-effect bg-white/90 backdrop-blur-md rounded-3xl shadow-rose p-8 lg:p-10 animate-fade-in border border-rose-100 hover-lift">
                    {/* Admin Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gold-gradient rounded-2xl flex items-center justify-center shadow-rose mx-auto mb-4">
                            <UserPlus className="w-8 h-8 text-rose-deep" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">
                            Đăng ký Quản trị viên
                        </h3>
                        <p className="text-gray-600 mt-2">
                            Điền thông tin để tạo tài khoản quản trị
                        </p>
                    </div>

                    <form onSubmit={handleAdminRegister}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Họ và tên *
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-300 hover:border-rose-300 text-gray-800 placeholder-gray-400 shadow-sm"
                                    placeholder="Nguyễn Văn A"
                                    minLength="2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Số điện thoại *
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-300 hover:border-rose-300 text-gray-800 placeholder-gray-400 shadow-sm"
                                    placeholder="0912345678"
                                    pattern="(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Định dạng: 0912345678 hoặc +84912345678
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email quản trị *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-300 hover:border-rose-300 text-gray-800 placeholder-gray-400 shadow-sm"
                                    placeholder="admin@larose.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mật khẩu *
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-300 hover:border-rose-300 text-gray-800 placeholder-gray-400 shadow-sm"
                                    placeholder="••••••••"
                                    minLength="6"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Mật khẩu phải có ít nhất 6 ký tự
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Xác nhận mật khẩu *
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-300 hover:border-rose-300 text-gray-800 placeholder-gray-400 shadow-sm"
                                    placeholder="••••••••"
                                    minLength="6"
                                />
                            </div>
                        </div>

                        {/* Security Info */}
                        <div className="mt-4 p-3 bg-rose-50 rounded-lg border border-rose-200">
                            <div className="flex items-center gap-2 text-rose-700 text-sm">
                                <Shield className="w-4 h-4" />
                                <span>Kết nối được bảo mật bằng mã hóa</span>
                            </div>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full mt-6 bg-gradient-to-r from-rose-600 to-amber-600 text-white p-4 rounded-xl font-semibold shadow-rose transform transition-all duration-300 group ${
                                isLoading
                                    ? "opacity-70 cursor-not-allowed"
                                    : "hover:shadow-lg hover:scale-105 hover:from-rose-700 hover:to-amber-700"
                            }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Đang tạo tài khoản...
                                    </>
                                ) : (
                                    <>
                                        Đăng ký Quản trị viên
                                        <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    {/* Link to login */}
                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-600 mb-2">
                            Đã có tài khoản?
                        </p>
                        <Link
                            to="/admin/login"
                            className="text-rose-deep hover:text-rose-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                            <Lock className="w-4 h-4" />
                            Đăng nhập ngay
                        </Link>
                    </div>

                    {/* Back to main site */}
                    <div className="text-center mt-4">
                        <Link
                            to="/login"
                            className="text-gray-600 hover:text-gray-700 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <Building className="w-4 h-4" />
                            Quay lại trang chủ khách hàng
                        </Link>
                    </div>

                    {/* Admin Notice */}
                    <div className="mt-6 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-xs text-red-700 text-center">
                            ⚠️ CẢNH BÁO: Chỉ đăng ký tài khoản quản trị nếu bạn được ủy quyền. Truy cập trái phép là bất hợp pháp.
                        </p>
                    </div>
                </div>
            </div>

            {/* React Toastify Container */}
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
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

export default AdminRegisterPage;


