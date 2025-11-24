import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const AboutPage = () => {
    const navigate = useNavigate();
    const sectionRefs = useRef([]);
    const [activeTab, setActiveTab] = useState(0);
    const [activeAccordion, setActiveAccordion] = useState(null);

    // SEO: Cập nhật title và meta description
    useEffect(() => {
        document.title =
            "Về La Rosé - Khách Sạn 5 Sao Sang Trọng | Hòa Quyện Văn Hóa Pháp - Việt";

        const metaDescription = document.querySelector(
            'meta[name="description"]',
        );
        if (metaDescription) {
            metaDescription.setAttribute(
                "content",
                "Khám phá câu chuyện và giá trị cốt lõi của La Rosé - khách sạn 5 sao đẳng cấp kết hợp tinh hoa văn hóa Pháp và sự ấm áp Việt Nam. Trải nghiệm dịch vụ cá nhân hóa và tiện nghi cao cấp.",
            );
        }

        // Thêm structured data cho SEO
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "Hotel",
            name: "La Rosé Hotel",
            description:
                "Khách sạn 5 sao sang trọng kết hợp văn hóa Pháp và Việt Nam",
            address: {
                "@type": "PostalAddress",
                addressLocality: "Hà Nội",
                addressCountry: "Vietnam",
            },
            amenityFeature: [
                "SwimmingPool",
                "Spa",
                "FineDiningRestaurant",
                "BusinessCenter",
                "ConciergeService",
            ],
        };

        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify(structuredData);
        document.head.appendChild(script);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    // Thêm ref cho mỗi section
    const addToRefs = (el) => {
        if (el && !sectionRefs.current.includes(el)) {
            sectionRefs.current.push(el);
        }
    };

    // Observer để kích hoạt animation khi scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("animate-fade-in-up");
                        // Remove observer after animation is triggered
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: "0px 0px -50px 0px",
            },
        );

        sectionRefs.current.forEach((section) => {
            if (section) observer.observe(section);
        });

        return () => {
            sectionRefs.current.forEach((section) => {
                if (section) observer.unobserve(section);
            });
        };
    }, []);

    const toggleAccordion = (index) => {
        setActiveAccordion(activeAccordion === index ? null : index);
    };

    // Dữ liệu mở rộng
    const features = [
        {
            icon: "🎨",
            title: "Thiết Kế Tinh Tế",
            description:
                "Phong cách thiết kế Pháp sang trọng kết hợp với nét đẹp hiện đại, tạo không gian nghỉ dưỡng độc đáo.",
            details: [
                "Kiến trúc Pháp cổ điển",
                "Nội thất cao cấp",
                "Không gian mở thoáng đãng",
                "Ánh sáng tự nhiên tối ưu",
            ],
            stats: "100+ thiết kế độc bản",
            color: "from-purple-400 to-pink-400",
        },
        {
            icon: "🌹",
            title: "Dịch Vụ Cá Nhân Hóa",
            description:
                "Đội ngũ nhân viên chuyên nghiệp luôn sẵn sàng mang đến trải nghiệm được thiết kế riêng.",
            details: [
                "Butler 24/7",
                "Tư vấn du lịch",
                "Dịch vụ đặc biệt theo yêu cầu",
                "Hỗ trợ đa ngôn ngữ",
            ],
            stats: "50+ dịch vụ đặc biệt",
            color: "from-rose-400 to-red-400",
        },
        {
            icon: "🍷",
            title: "Ẩm Thực Đẳng Cấp",
            description:
                "Nhà hàng với các món ăn từ ẩm thực Pháp và Việt Nam, nguyên liệu tươi ngon nhất.",
            details: [
                "Đầu bếp Michelin",
                "Rượu vang cao cấp",
                "Nguyên liệu hữu cơ",
                "Menu theo mùa",
            ],
            stats: "200+ món ăn đặc sắc",
            color: "from-amber-400 to-orange-400",
        },
        {
            icon: "💎",
            title: "Tiện Nghi Cao Cấp",
            description:
                "Hệ thống phòng nghỉ được trang bị đầy đủ tiện nghi 5 sao với công nghệ hiện đại nhất.",
            details: [
                "Hệ thống smart room",
                "Bể bơi vô cực",
                "Spa đẳng cấp quốc tế",
                "Phòng tập đạt chuẩn",
            ],
            stats: "99% khách hài lòng",
            color: "from-blue-400 to-cyan-400",
        },
    ];

    const milestones = [
        {
            year: "2018",
            event: "Thành lập La Rosé",
            description:
                "Khởi đầu với tầm nhìn tạo ra không gian nghỉ dưỡng đẳng cấp",
            achievement: "Top 10 khách sạn mới tốt nhất Việt Nam",
        },
        {
            year: "2019",
            event: "Đạt chứng nhận 5 sao",
            description:
                "Được công nhận là khách sạn 5 sao đầu tiên theo tiêu chuẩn quốc tế",
            achievement: "Chứng nhận 5 sao từ Tổng cục Du lịch",
        },
        {
            year: "2020",
            event: "Mở rộng 50 phòng suite",
            description: "Mở rộng quy mô với 50 phòng suite cao cấp mới",
            achievement: "Doanh thu tăng 150%",
        },
        {
            year: "2022",
            event: "Nhận giải Khách sạn xuất sắc",
            description:
                "Vinh dự nhận giải thưởng Khách sạn xuất sắc nhất Việt Nam",
            achievement: "Giải thưởng World Luxury Hotel Awards",
        },
        {
            year: "2023",
            event: "10,000+ khách hàng hài lòng",
            description: "Đón hơn 10,000 khách với tỷ lệ hài lòng 98%",
            achievement: "Điểm đánh giá 4.9/5 trên Booking.com",
        },
        {
            year: "2024",
            event: "Mở rộng chi nhánh mới",
            description: "Khai trương chi nhánh thứ 2 tại Đà Nẵng",
            achievement: "Dự kiến đón 15,000 khách/năm",
        },
    ];

    const stats = [
        { number: "5+", label: "Năm Kinh Nghiệm", icon: "📅" },
        { number: "98%", label: "Khách Hài Lòng", icon: "⭐" },
        { number: "50+", label: "Phòng Cao Cấp", icon: "🏨" },
        { number: "25+", label: "Giải Thưởng", icon: "🏆" },
        { number: "100+", label: "Nhân Viên", icon: "👥" },
        { number: "10K+", label: "Khách Phục Vụ", icon: "🙂" },
    ];

    const teamMembers = [
        {
            icon: "👨‍💼",
            role: "Tổng Giám Đốc",
            name: "Nguyễn Văn A",
            experience: "15 năm trong ngành khách sạn",
            quote: "Sự hài lòng của khách hàng là thước đo thành công của chúng tôi",
        },
        {
            icon: "👩‍🍳",
            role: "Bếp Trưởng",
            name: "Trần Thị B",
            experience: "Cựu đầu bếp tại Pháp",
            quote: "Mỗi món ăn là một tác phẩm nghệ thuật",
        },
        {
            icon: "🧹",
            role: "Giám Sát Dịch Vụ",
            name: "Phạm Văn C",
            experience: "10 năm quản lý dịch vụ",
            quote: "Sự hoàn hảo nằm ở từng chi tiết nhỏ",
        },
        {
            icon: "👨‍💻",
            role: "Trưởng Phòng Marketing",
            name: "Lê Thị D",
            experience: "Chuyên gia thương hiệu luxury",
            quote: "Xây dựng trải nghiệm khách hàng đáng nhớ",
        },
    ];

    const sustainabilityInitiatives = [
        {
            title: "Bảo Vệ Môi Trường",
            icon: "🌱",
            initiatives: [
                "Sử dụng năng lượng mặt trời",
                "Hệ thống xử lý nước thải",
                "Giảm thiểu rác thải nhựa",
            ],
        },
        {
            title: "Hỗ Trợ Cộng Đồng",
            icon: "🤝",
            initiatives: [
                "Tuyển dụng lao động địa phương",
                "Hỗ trợ giáo dục trẻ em",
                "Bảo tồn văn hóa bản địa",
            ],
        },
        {
            title: "Phát Triển Bền Vững",
            icon: "♻️",
            initiatives: [
                "Nguyên liệu địa phương",
                "Công trình xanh",
                "Giảm carbon footprint",
            ],
        },
    ];

    const awards = [
        {
            name: "World Luxury Hotel Awards",
            year: "2023",
            category: "Khách sạn sang trọng",
        },
        {
            name: "Tripadvisor Travelers' Choice",
            year: "2022-2023",
            category: "Top 1% khách sạn toàn cầu",
        },
        {
            name: "Forbes Travel Guide",
            year: "2023",
            category: "5 sao Recommended",
        },
        {
            name: "Vietnam Tourism Awards",
            year: "2022",
            category: "Khách sạn xuất sắc nhất",
        },
    ];

    const faqs = [
        {
            question: "La Rosé có những loại phòng nào?",
            answer: "Chúng tôi có 5 loại phòng: Deluxe, Executive Suite, Presidential Suite, Rosé Villa, và Royal Penthouse. Mỗi phòng đều được thiết kế độc đáo với view thành phố hoặc vườn.",
        },
        {
            question: "Có dịch vụ đưa đón sân bay không?",
            answer: "Có, chúng tôi cung cấp dịch vụ đưa đón sân bay miễn phí bằng xe Mercedes cho khách đặt phòng suite trở lên. Các loại phòng khác có dịch vụ với phí ưu đãi.",
        },
        {
            question: "Nhà hàng phục vụ những loại ẩm thực nào?",
            answer: "Nhà hàng chính phục vụ ẩm thực Pháp-Việt fusion, cùng với nhà hàng Ý, quầy bar rooftop, và dịch vụ room service 24/7.",
        },
        {
            question: "Có dịch vụ spa và wellness không?",
            answer: "Có, La Rosé Spa cung cấp các liệu pháp trị liệu từ thiên nhiên, phòng xông hơi, bể sục, và các lớp yoga hàng ngày với HLV chuyên nghiệp.",
        },
    ];

    return (
        <div className="min-h-screen bg-white overflow-hidden relative">
            {/* Background Patterns */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-10 w-2 h-2 bg-rose-300 rounded-full animate-pulse"></div>
                <div
                    className="absolute top-1/3 right-20 w-1 h-1 bg-amber-300 rounded-full animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                ></div>
                <div
                    className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-rose-200 rounded-full animate-pulse"
                    style={{ animationDelay: "1s" }}
                ></div>
            </div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes float {
                    0%,
                    100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                @keyframes floatSlow {
                    0%,
                    100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-5px);
                    }
                }

                @keyframes floatMedium {
                    0%,
                    100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-8px);
                    }
                }

                @keyframes pulseSlow {
                    0%,
                    100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                }

                @keyframes bounceIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.3);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.05);
                    }
                    70% {
                        transform: scale(0.9);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes typewriter {
                    from {
                        width: 0;
                    }
                    to {
                        width: 100%;
                    }
                }

                @keyframes blink {
                    0%,
                    100% {
                        border-color: transparent;
                    }
                    50% {
                        border-color: #e11d48;
                    }
                }

                .animate-fade-in-up {
                    animation: fadeInUp 0.6s ease-out forwards;
                }

                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }

                .animate-float-slow {
                    animation: floatSlow 4s ease-in-out infinite;
                }

                .animate-float-medium {
                    animation: floatMedium 3.5s ease-in-out infinite;
                }

                .animate-pulse-slow {
                    animation: pulseSlow 2s ease-in-out infinite;
                }

                .animate-bounce-in {
                    animation: bounceIn 0.6s ease-out forwards;
                }

                .animate-typewriter {
                    animation: typewriter 3s steps(40) 1s both,
                        blink 0.8s infinite;
                }

                .bg-rose-gradient {
                    background: linear-gradient(
                        135deg,
                        #fdf2f8 0%,
                        #fefce8 100%
                    );
                }

                .bg-gold-gradient {
                    background: linear-gradient(
                        135deg,
                        #fefce8 0%,
                        #fdf4ff 100%
                    );
                }

                .glass-effect {
                    background: rgba(255, 255, 255, 0.25);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.18);
                }

                .text-shadow {
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .hover-lift {
                    transition: all 0.3s ease;
                }

                .hover-lift:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                }

                .gradient-text {
                    background: linear-gradient(
                        135deg,
                        #e11d48 0%,
                        #f59e0b 100%
                    );
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
            `}</style>

            {/* Hero Section với Typewriter Effect */}
            <section
                className="pt-32 pb-20 bg-rose-gradient relative overflow-hidden"
                ref={addToRefs}
            >
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-10 left-10 w-40 h-40 bg-rose-300 rounded-full opacity-20 animate-float-slow"></div>
                    <div className="absolute top-32 right-20 w-32 h-32 bg-amber-300 rounded-full opacity-30 animate-float-medium"></div>
                    <div className="absolute bottom-20 left-20 w-28 h-28 bg-rose-400 rounded-full opacity-25 animate-float"></div>
                    <div className="absolute bottom-10 right-10 w-24 h-24 bg-rose-200 rounded-full opacity-30 animate-float-slow"></div>
                </div>

                <div className="container mx-auto px-6 text-center relative z-10">
                    <div className="opacity-0 animate-fade-in-up">
                        <h1 className="font-playfair text-5xl md:text-7xl font-bold text-rose-600 mb-6 text-shadow">
                            Về La Rosé
                        </h1>
                        <div className="typewriter-container inline-block">
                            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed font-light border-r-2 border-rose-500 whitespace-nowrap overflow-hidden animate-typewriter">
                                Khách sạn La Rosé - Biểu tượng của sự sang trọng
                                và tinh tế
                            </p>
                        </div>
                    </div>

                    {/* Enhanced Stats Section */}
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-16 max-w-6xl mx-auto">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50 text-center transform hover:scale-105 transition-all duration-500 opacity-0 animate-fade-in-up hover-lift group"
                                style={{
                                    animationDelay: `${index * 0.1 + 0.5}s`,
                                }}
                            >
                                <div className="text-2xl mb-2 transform group-hover:scale-110 transition-transform duration-300">
                                    {stat.icon}
                                </div>
                                <div className="text-2xl font-bold text-rose-600 mb-1">
                                    {stat.number}
                                </div>
                                <div className="text-gray-600 text-sm font-medium">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Enhanced Story Section với Interactive Tabs */}
            <section className="py-20 bg-white" ref={addToRefs}>
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="lg:w-1/2 opacity-0 animate-fade-in-up">
                            <h2 className="font-playfair text-4xl font-bold text-rose-600 mb-6">
                                Câu Chuyện Của Chúng Tôi
                            </h2>

                            {/* Interactive Tabs */}
                            <div className="mb-6">
                                <div className="flex space-x-1 bg-gray-100 rounded-2xl p-1">
                                    {["Sứ mệnh", "Tầm nhìn", "Giá trị", "Chính sách"].map(
                                        (tab, index) => (
                                            <button
                                                key={index}
                                                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                                                    activeTab === index
                                                        ? "bg-white text-rose-600 shadow-lg"
                                                        : "text-gray-600 hover:text-rose-500"
                                                }`}
                                                onClick={() =>
                                                    setActiveTab(index)
                                                }
                                            >
                                                {tab}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className="min-h-[200px]">
                                {activeTab === 0 && (
                                    <div className="space-y-4 text-gray-700 leading-relaxed">
                                        <p className="text-lg">
                                            <strong className="text-rose-600">
                                                Sứ mệnh
                                            </strong>{" "}
                                            của La Rosé là tạo ra những trải
                                            nghiệm nghỉ dưỡng đẳng cấp, nơi văn
                                            hóa Pháp tinh tế hòa quyện với sự ấm
                                            áp Việt Nam, mang đến cho khách hàng
                                            những kỷ niệm đáng nhớ suốt đời.
                                        </p>
                                        <ul className="space-y-2">
                                            <li className="flex items-center">
                                                <span className="w-2 h-2 bg-rose-400 rounded-full mr-3"></span>
                                                Dịch vụ cá nhân hóa xuất sắc
                                            </li>
                                            <li className="flex items-center">
                                                <span className="w-2 h-2 bg-rose-400 rounded-full mr-3"></span>
                                                Không gian sang trọng, đẳng cấp
                                            </li>
                                            <li className="flex items-center">
                                                <span className="w-2 h-2 bg-rose-400 rounded-full mr-3"></span>
                                                Cam kết chất lượng 5 sao
                                            </li>
                                        </ul>
                                    </div>
                                )}
                                {activeTab === 1 && (
                                    <div className="space-y-4 text-gray-700 leading-relaxed">
                                        <p className="text-lg">
                                            <strong className="text-amber-600">
                                                Tầm nhìn
                                            </strong>{" "}
                                            trở thành biểu tượng khách sạn sang
                                            trọng hàng đầu Đông Nam Á, tiên
                                            phong trong xu hướng hospitality kết
                                            hợp văn hóa bản địa với chuẩn mực
                                            quốc tế.
                                        </p>
                                        <div className="bg-amber-50 rounded-2xl p-4">
                                            <h4 className="font-semibold text-amber-800 mb-2">
                                                Mục tiêu 2025:
                                            </h4>
                                            <ul className="space-y-1 text-amber-700">
                                                <li>
                                                    • Mở rộng 3 chi nhánh mới
                                                </li>
                                                <li>• Đón 50,000 khách/năm</li>
                                                <li>
                                                    • Đạt giải thưởng quốc tế
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 2 && (
                                    <div className="space-y-4 text-gray-700 leading-relaxed">
                                        <p className="text-lg">
                                            <strong className="text-purple-600">
                                                Giá trị cốt lõi
                                            </strong>{" "}
                                            định hình văn hóa doanh nghiệp và
                                            cam kết với khách hàng, đối tác, và
                                            cộng đồng.
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-purple-50 rounded-xl p-3 text-center">
                                                <div className="text-purple-600 font-semibold">
                                                    Chất lượng
                                                </div>
                                            </div>
                                            <div className="bg-purple-50 rounded-xl p-3 text-center">
                                                <div className="text-purple-600 font-semibold">
                                                    Sáng tạo
                                                </div>
                                            </div>
                                            <div className="bg-purple-50 rounded-xl p-3 text-center">
                                                <div className="text-purple-600 font-semibold">
                                                    Chân thành
                                                </div>
                                            </div>
                                            <div className="bg-purple-50 rounded-xl p-3 text-center">
                                                <div className="text-purple-600 font-semibold">
                                                    Bền vững
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {activeTab === 3 && (
                                    <div className="space-y-4 text-gray-700 leading-relaxed">
                                        <p className="text-lg">
                                            <strong className="text-blue-600">
                                                Chính sách
                                            </strong>{" "}
                                            của La Rosé được thiết kế để đảm bảo trải nghiệm tốt nhất cho khách hàng.
                                        </p>
                                        <div className="space-y-4">
                                            <div className="bg-blue-50 rounded-2xl p-4">
                                                <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                                                    <span className="mr-2">🕐</span>
                                                    Thời gian Check-in/Check-out
                                                </h4>
                                                <ul className="space-y-2 text-blue-700">
                                                    <li className="flex items-start">
                                                        <span className="mr-2">•</span>
                                                        <span>Check-in từ 14:00, check-out trước 12:00</span>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div className="bg-green-50 rounded-2xl p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-semibold text-green-800 flex items-center">
                                                        <span className="mr-2">💰</span>
                                                        Chính sách Hủy & Hoàn tiền
                                                    </h4>
                                                    <a
                                                        href="https://zalo.me/0348861352"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transform hover:scale-105 transition-all duration-300 shadow-md text-sm"
                                                    >
                                                        <span className="mr-2">💬</span>
                                                        Liên hệ hoàn tiền
                                                    </a>
                                                </div>
                                                <ul className="space-y-2 text-green-700">
                                                    <li className="flex items-start">
                                                        <span className="mr-2">•</span>
                                                        <span>Hủy trước 5 ngày hoàn 100%</span>
                                                    </li>
                                                    <li className="flex items-start">
                                                        <span className="mr-2">•</span>
                                                        <span>Hủy trước 3 ngày hoàn 50%</span>
                                                    </li>
                                                    <li className="flex items-start">
                                                        <span className="mr-2">•</span>
                                                        <span>Sát ngày không hoàn</span>
                                                    </li>
                                                    <li className="flex items-start">
                                                        <span className="mr-2">•</span>
                                                        <span>Không hoàn tiền nếu khách không đến (no-show)</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div
                            className="lg:w-1/2 opacity-0 animate-fade-in-up"
                            style={{ animationDelay: "0.3s" }}
                        >
                            <div className="relative">
                                <div className="w-full h-80 bg-gradient-to-br from-rose-200 to-amber-200 rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-500 hover-lift"></div>
                                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-100 rounded-2xl animate-float-slow shadow-lg"></div>
                                <div className="absolute -top-6 -left-6 w-24 h-24 bg-rose-100 rounded-2xl animate-float shadow-lg"></div>
                                {/* Floating Elements */}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg animate-float-medium">
                                    <div className="text-rose-600 font-bold">
                                        ⭐ 4.9/5
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        Tripadvisor
                                    </div>
                                </div>
                                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg animate-float-slow">
                                    <div className="text-amber-600 font-bold">
                                        🏆 25+
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        Giải thưởng
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Enhanced Features Section với Hover Effects */}
            <section className="py-20 bg-gold-gradient" ref={addToRefs}>
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16 opacity-0 animate-fade-in-up">
                        <h2 className="font-playfair text-4xl font-bold text-rose-600 mb-4">
                            Điểm Khác Biệt Của La Rosé
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                            Khám phá những yếu tố đặc biệt tạo nên trải nghiệm
                            đáng nhớ tại khách sạn 5 sao của chúng tôi
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 opacity-0 animate-fade-in-up group relative overflow-hidden"
                                style={{ animationDelay: `${index * 0.2}s` }}
                            >
                                {/* Background Gradient on Hover */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                                ></div>

                                <div className="text-5xl mb-4 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-rose-600 mb-4 font-playfair group-hover:gradient-text transition-all duration-300">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-700 leading-relaxed mb-4">
                                    {feature.description}
                                </p>
                                <ul className="space-y-2 mb-4">
                                    {feature.details.map((detail, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-center text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300"
                                        >
                                            <span className="w-2 h-2 bg-rose-400 rounded-full mr-3 group-hover:scale-150 transition-transform duration-300"></span>
                                            {detail}
                                        </li>
                                    ))}
                                </ul>
                                <div className="text-xs font-semibold text-rose-500 bg-rose-50 rounded-full px-3 py-1 inline-block">
                                    {feature.stats}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Sustainability Section */}
            <section className="py-20 bg-white" ref={addToRefs}>
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16 opacity-0 animate-fade-in-up">
                        <h2 className="font-playfair text-4xl font-bold text-rose-600 mb-4">
                            Cam Kết Phát Triển Bền Vững
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                            La Rosé không chỉ là khách sạn sang trọng mà còn là
                            đại sứ của du lịch bền vững
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {sustainabilityInitiatives.map((initiative, index) => (
                            <div
                                key={index}
                                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg opacity-0 animate-fade-in-up hover-lift group"
                                style={{ animationDelay: `${index * 0.2}s` }}
                            >
                                <div className="text-5xl mb-4 text-center transform group-hover:scale-110 transition-transform duration-300">
                                    {initiative.icon}
                                </div>
                                <h3 className="text-xl font-bold text-green-600 mb-4 text-center">
                                    {initiative.title}
                                </h3>
                                <ul className="space-y-3">
                                    {initiative.initiatives.map((item, idx) => (
                                        <li
                                            key={idx}
                                            className="flex items-center text-gray-700"
                                        >
                                            <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Sustainability Stats */}
                    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div
                            className="text-center opacity-0 animate-fade-in-up"
                            style={{ animationDelay: "0.6s" }}
                        >
                            <div className="text-3xl font-bold text-green-600">
                                80%
                            </div>
                            <div className="text-gray-600">
                                Năng lượng tái tạo
                            </div>
                        </div>
                        <div
                            className="text-center opacity-0 animate-fade-in-up"
                            style={{ animationDelay: "0.7s" }}
                        >
                            <div className="text-3xl font-bold text-green-600">
                                90%
                            </div>
                            <div className="text-gray-600">
                                Nguyên liệu địa phương
                            </div>
                        </div>
                        <div
                            className="text-center opacity-0 animate-fade-in-up"
                            style={{ animationDelay: "0.8s" }}
                        >
                            <div className="text-3xl font-bold text-green-600">
                                50%
                            </div>
                            <div className="text-gray-600">
                                Giảm rác thải nhựa
                            </div>
                        </div>
                        <div
                            className="text-center opacity-0 animate-fade-in-up"
                            style={{ animationDelay: "0.9s" }}
                        >
                            <div className="text-3xl font-bold text-green-600">
                                100%
                            </div>
                            <div className="text-gray-600">
                                Nhân viên được đào tạo
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Enhanced Interactive Milestones với Achievement */}
            <section className="py-20 bg-rose-50" ref={addToRefs}>
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16 opacity-0 animate-fade-in-up">
                        <h2 className="font-playfair text-4xl font-bold text-rose-600 mb-4">
                            Hành Trình Phát Triển
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                            Cùng nhìn lại chặng đường đầy tự hào với những cột
                            mốc quan trọng
                        </p>
                    </div>

                    {/* Desktop Timeline với Achievement */}
                    <div className="hidden lg:block relative">
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-rose-200 to-amber-200"></div>
                        <div className="space-y-16">
                            {milestones.map((milestone, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center ${
                                        index % 2 === 0
                                            ? "flex-row"
                                            : "flex-row-reverse"
                                    } opacity-0 animate-fade-in-up group`}
                                    style={{
                                        animationDelay: `${index * 0.3}s`,
                                    }}
                                >
                                    <div className="w-1/2 flex justify-center">
                                        <div
                                            className={`max-w-sm p-6 rounded-2xl shadow-lg hover-lift cursor-pointer ${
                                                index % 2 === 0
                                                    ? "bg-white text-right"
                                                    : "bg-white text-left"
                                            }`}
                                        >
                                            <div className="text-3xl font-bold text-rose-600 mb-2 group-hover:gradient-text transition-all duration-300">
                                                {milestone.year}
                                            </div>
                                            <div className="text-lg font-semibold text-gray-800 mb-2">
                                                {milestone.event}
                                            </div>
                                            <div className="text-gray-600 mb-3">
                                                {milestone.description}
                                            </div>
                                            <div className="text-sm text-amber-600 font-medium bg-amber-50 rounded-full px-3 py-1 inline-block">
                                                {milestone.achievement}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 bg-rose-500 rounded-full border-4 border-white shadow-lg z-10 transform group-hover:scale-125 group-hover:bg-amber-500 transition-all duration-300 cursor-pointer relative">
                                        <div className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-75"></div>
                                    </div>
                                    <div className="w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Timeline với Achievement */}
                    <div className="lg:hidden space-y-6">
                        {milestones.map((milestone, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl p-6 shadow-lg opacity-0 animate-fade-in-up hover-lift"
                                style={{ animationDelay: `${index * 0.2}s` }}
                            >
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold mr-4 animate-bounce-in shadow-lg">
                                        {milestone.year}
                                    </div>
                                    <div>
                                        <div className="text-lg font-semibold text-gray-800">
                                            {milestone.event}
                                        </div>
                                        <div className="text-sm text-amber-600 font-medium">
                                            {milestone.achievement}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-600">
                                    {milestone.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Awards & Recognition Section */}
            <section className="py-20 bg-white" ref={addToRefs}>
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16 opacity-0 animate-fade-in-up">
                        <h2 className="font-playfair text-4xl font-bold text-rose-600 mb-4">
                            Giải Thưởng & Công Nhận
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                            Những danh hiệu và giải thưởng quốc tế ghi nhận chất
                            lượng dịch vụ xuất sắc
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {awards.map((award, index) => (
                            <div
                                key={index}
                                className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-2xl p-6 opacity-0 animate-fade-in-up hover-lift group"
                                style={{ animationDelay: `${index * 0.2}s` }}
                            >
                                <div className="flex items-start space-x-4">
                                    <div className="text-3xl transform group-hover:scale-110 transition-transform duration-300">
                                        🏆
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 text-lg mb-1">
                                            {award.name}
                                        </h3>
                                        <div className="text-rose-600 font-medium mb-2">
                                            {award.year}
                                        </div>
                                        <p className="text-gray-600 text-sm">
                                            {award.category}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Enhanced Team Section với Profile Details */}
            <section className="py-20 bg-gold-gradient" ref={addToRefs}>
                <div className="container mx-auto px-6 text-center">
                    <h2 className="font-playfair text-4xl font-bold text-rose-600 mb-6 opacity-0 animate-fade-in-up">
                        Đội Ngũ Lãnh Đạo
                    </h2>
                    <p
                        className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto opacity-0 animate-fade-in-up"
                        style={{ animationDelay: "0.2s" }}
                    >
                        Đội ngũ quản lý giàu kinh nghiệm với tầm nhìn chiến lược
                        và đam mê phục vụ
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                        {teamMembers.map((member, index) => (
                            <div
                                key={index}
                                className="text-center opacity-0 animate-fade-in-up bg-white rounded-2xl p-6 shadow-lg hover-lift group"
                                style={{
                                    animationDelay: `${index * 0.2 + 0.4}s`,
                                }}
                            >
                                <div className="text-6xl mb-4 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 animate-float-slow">
                                    {member.icon}
                                </div>
                                <div className="font-semibold text-gray-800 text-lg">
                                    {member.role}
                                </div>
                                <div className="text-rose-600 font-bold text-xl mb-3">
                                    {member.name}
                                </div>
                                <div className="text-sm text-gray-600 mb-3 bg-gray-100 rounded-full px-3 py-1 inline-block">
                                    {member.experience}
                                </div>
                                <div className="text-xs text-gray-500 italic border-t pt-3 mt-3">
                                    "{member.quote}"
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Team Stats */}
                    <div
                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg max-w-4xl mx-auto opacity-0 animate-fade-in-up"
                        style={{ animationDelay: "1s" }}
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-rose-600">
                                    100+
                                </div>
                                <div className="text-gray-600">Nhân viên</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-rose-600">
                                    15+
                                </div>
                                <div className="text-gray-600">
                                    Năm kinh nghiệm TB
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-rose-600">
                                    98%
                                </div>
                                <div className="text-gray-600">
                                    Đào tạo chuyên môn
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-rose-600">
                                    24/7
                                </div>
                                <div className="text-gray-600">
                                    Hỗ trợ khách hàng
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section với Accordion */}
            <section className="py-20 bg-white" ref={addToRefs}>
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16 opacity-0 animate-fade-in-up">
                        <h2 className="font-playfair text-4xl font-bold text-rose-600 mb-4">
                            Câu Hỏi Thường Gặp
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                            Tìm hiểu thêm về dịch vụ và trải nghiệm tại La Rosé
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="bg-gray-50 rounded-2xl overflow-hidden opacity-0 animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <button
                                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-100 transition-colors duration-300"
                                    onClick={() => toggleAccordion(index)}
                                >
                                    <span className="font-semibold text-gray-800">
                                        {faq.question}
                                    </span>
                                    <span
                                        className={`transform transition-transform duration-300 ${
                                            activeAccordion === index
                                                ? "rotate-180"
                                                : ""
                                        }`}
                                    >
                                        ▼
                                    </span>
                                </button>
                                <div
                                    className={`px-6 overflow-hidden transition-all duration-300 ${
                                        activeAccordion === index
                                            ? "max-h-96 pb-4"
                                            : "max-h-0"
                                    }`}
                                >
                                    <p className="text-gray-600 leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Enhanced Final CTA với Multiple Options */}
            <section
                className="py-20 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white relative overflow-hidden"
                ref={addToRefs}
            >
                {/* Animated Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-float-slow"></div>
                    <div className="absolute top-20 right-20 w-16 h-16 bg-white/10 rounded-full animate-float-medium"></div>
                    <div className="absolute bottom-20 left-20 w-12 h-12 bg-white/10 rounded-full animate-float"></div>
                    <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/10 rounded-full animate-float-slow"></div>
                </div>

                <div className="container mx-auto px-6 text-center relative z-10">
                    <h2 className="font-playfair text-4xl font-bold mb-6 opacity-0 animate-fade-in-up">
                        Sẵn Sàng Trải Nghiệm?
                    </h2>
                    <p
                        className="text-xl mb-8 max-w-2xl mx-auto opacity-90 opacity-0 animate-fade-in-up"
                        style={{ animationDelay: "0.2s" }}
                    >
                        Khám phá sự khác biệt của dịch vụ đẳng cấp 5 sao và
                        không gian sang trọng. Đặt phòng ngay hôm nay để nhận ưu
                        đãi đặc biệt!
                    </p>

                    {/* Multiple CTA Options */}
                    <div
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto opacity-0 animate-fade-in-up"
                        style={{ animationDelay: "0.4s" }}
                    >
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover-lift cursor-pointer group">
                            <div className="text-3xl mb-3">🛎️</div>
                            <h3 className="font-semibold mb-2">Đặt Phòng</h3>
                            <p className="text-sm opacity-80">
                                Trải nghiệm dịch vụ 5 sao ngay hôm nay
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover-lift cursor-pointer group">
                            <div className="text-3xl mb-3">📞</div>
                            <h3 className="font-semibold mb-2">Tư Vấn</h3>
                            <p className="text-sm opacity-80">
                                Được tư vấn miễn phí 24/7
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover-lift cursor-pointer group">
                            <div className="text-3xl mb-3">📧</div>
                            <h3 className="font-semibold mb-2">Nhận Báo Giá</h3>
                            <p className="text-sm opacity-80">
                                Báo giá chi tiết trong 30 phút
                            </p>
                        </div>
                    </div>

                    <div
                        className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-in-up"
                        style={{ animationDelay: "0.6s" }}
                    >
                        <button
                            onClick={() => navigate("/rooms")}
                            className="bg-white text-rose-600 px-8 py-4 rounded-full font-semibold hover:bg-amber-50 transform hover:scale-105 transition-all duration-300 shadow-lg animate-bounce-in"
                        >
                            📅 Đặt Phòng Ngay
                        </button>
                        <button
                            onClick={() => window.open("https://zalo.me/0348861352", "_blank")}
                            className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-rose-600 transition-all duration-300 backdrop-blur-sm"
                        >
                            💬 Liên Hệ Tư Vấn
                        </button>
                        {/* <button
                            onClick={() => navigate("/virtual-tour")}
                            className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-rose-600 transition-all duration-300 backdrop-blur-sm"
                        >
                            🎥 Tham Quan Ảo
                        </button> */}
                    </div>

                    {/* Trust Indicators */}
                    <div
                        className="mt-12 flex flex-wrap justify-center gap-8 opacity-60 text-sm opacity-0 animate-fade-in-up"
                        style={{ animationDelay: "0.8s" }}
                    >
                        <div className="flex items-center">
                            <span className="mr-2">🔒</span> Thanh toán an toàn
                        </div>
                        <div className="flex items-center">
                            <span className="mr-2">⭐</span> Đánh giá 4.9/5
                        </div>
                        <div className="flex items-center">
                            <span className="mr-2">🏆</span> Giải thưởng uy tín
                        </div>
                        <div className="flex items-center">
                            <span className="mr-2">💎</span> Cam kết chất lượng
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
