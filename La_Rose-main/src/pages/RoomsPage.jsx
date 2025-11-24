// src/pages/RoomsPage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RoomCard from "../components/RoomCard";
import SearchAutocomplete from "../components/SearchAutocomplete";
import roomService from "../services/room.service";
import bookingService from "../services/booking.service";

const RoomsPage = () => {
    const [rooms, setRooms] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        keyword: "",
        typeId: "",
        priceRange: "",
        capacity: "",
    });

    const [appliedFilters, setAppliedFilters] = useState({
        keyword: "",
        typeId: "",
        priceRange: "",
        capacity: "",
    });

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [pageSize, setPageSize] = useState(18);

    // Search suggestions state
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);

    const navigate = useNavigate();

    // Fetch search suggestions on mount
    useEffect(() => {
        const fetchSearchSuggestions = async () => {
            // Check session storage for cached suggestions
            const cached = sessionStorage.getItem('roomSuggestions');
            if (cached) {
                try {
                    const { data, timestamp } = JSON.parse(cached);
                    const age = Date.now() - timestamp;
                    
                    // Use cache if less than 5 minutes old
                    if (age < 5 * 60 * 1000) {
                        setSuggestions(data);
                        return;
                    }
                } catch (e) {
                    console.error("Error parsing cached suggestions:", e);
                }
            }
            
            // Fetch fresh suggestions
            try {
                setSuggestionsLoading(true);
                const data = await bookingService.getSearchSuggestions();
                
                // Process API response into suggestion format
                const processedSuggestions = data.map((item) => {
                    if (item.suggestionType === 'room') {
                        // Specific room suggestion
                        return {
                            id: `room-${item.roomId}`,
                            label: item.roomTitle || item.roomCode,
                            type: 'room',
                            value: item.roomId,
                            roomTitle: item.roomTitle,
                            roomCode: item.roomCode,
                            roomTypeName: item.roomTypeName,
                            count: item.bookingCount || 0,
                            lastBookedDate: item.lastBookedDate,
                            isPreviouslyBooked: !!item.lastBookedDate,
                        };
                    } else {
                        // Room type suggestion
                        return {
                            id: `roomType-${item.roomTypeId}`,
                            label: item.roomTypeName,
                            type: 'roomType',
                            value: item.roomTypeId,
                            count: item.bookingCount || 0,
                            lastBookedDate: item.lastBookedDate,
                            isPreviouslyBooked: !!item.lastBookedDate,
                        };
                    }
                });
                
                setSuggestions(processedSuggestions);
                
                // Save to session storage
                sessionStorage.setItem('roomSuggestions', JSON.stringify({
                    data: processedSuggestions,
                    timestamp: Date.now()
                }));
            } catch (err) {
                console.error("Error fetching search suggestions:", err);
                setSuggestions([]);
            } finally {
                setSuggestionsLoading(false);
            }
        };
        
        fetchSearchSuggestions();
    }, []);

    // Lấy loại phòng
    useEffect(() => {
        const fetchRoomTypes = async () => {
            try {
                const types = await roomService.getAllRoomTypes();
                setRoomTypes(types || []);
            } catch (err) {
                setError("Không thể tải danh sách loại phòng.");
                console.error("Error fetching room types:", err);
            }
        };
        fetchRoomTypes();
    }, []);

    // Lấy phòng
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                setLoading(true);
                setError(null);

                // Parse priceRange
                let minPrice, maxPrice;
                if (appliedFilters.priceRange) {
                    if (appliedFilters.priceRange === "10000000-") {
                        minPrice = 10000000;
                    } else {
                        const [min, max] = appliedFilters.priceRange.split("-").map(Number);
                        minPrice = min;
                        maxPrice = max;
                    }
                }

                // Parse capacity — chỉ gửi nếu có giá trị hợp lệ
                const capacity = appliedFilters.capacity
                    ? Number(appliedFilters.capacity)
                    : undefined;

                // ✅ TẠO PARAMS CHUẨN
                const params = {};
                if (appliedFilters.keyword) params.keyword = appliedFilters.keyword;
                if (minPrice !== undefined) params.minPrice = minPrice;
                if (maxPrice !== undefined) params.maxPrice = maxPrice;
                if (appliedFilters.typeId) params.typeId = appliedFilters.typeId;
                if (capacity !== undefined && !isNaN(capacity)) params.capacity = capacity;
                params.page = currentPage;
                params.size = pageSize;

                const response = await roomService.getAllRooms(params);
                setRooms(response.content || []);
                setTotalPages(response.totalPages || 0);
                setTotalElements(response.totalElements || 0);
            } catch (err) {
                console.error("Error fetching rooms:", err);
                setError("Không thể tải danh sách phòng. Vui lòng thử lại sau.");
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, [currentPage, pageSize, appliedFilters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleSearchFromServer = () => {
        setAppliedFilters({ ...filters });
        setCurrentPage(0);
    };

    const handleResetFilters = () => {
        const resetFilters = {
            keyword: "",
            typeId: "",
            priceRange: "",
            capacity: "",
        };
        setFilters(resetFilters);
        setAppliedFilters(resetFilters);
        setCurrentPage(0);
    };

    // Handle suggestion click from autocomplete
    const handleSuggestionSelect = (suggestion) => {
        if (suggestion.type === 'roomType') {
            // Apply room type filter
            setFilters(prev => ({ ...prev, typeId: suggestion.value, keyword: '' }));
            setAppliedFilters(prev => ({ ...prev, typeId: suggestion.value, keyword: '' }));
        } else if (suggestion.type === 'room') {
            // Search for specific room by title or code
            const searchTerm = suggestion.roomTitle || suggestion.roomCode;
            setFilters(prev => ({ ...prev, keyword: searchTerm, typeId: '' }));
            setAppliedFilters(prev => ({ ...prev, keyword: searchTerm, typeId: '' }));
        } else if (suggestion.type === 'history') {
            // Apply keyword search from history
            setFilters(prev => ({ ...prev, keyword: suggestion.label }));
            setAppliedFilters(prev => ({ ...prev, keyword: suggestion.label }));
        }
        setCurrentPage(0);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handlePageSizeChange = (e) => {
        const newSize = parseInt(e.target.value);
        setPageSize(newSize);
        setCurrentPage(0);
    };

    const handleBookRoom = (room) => {
        // Kiểm tra xem phòng có thể đặt được không
        if (room.status !== "available") {
            const statusMessages = {
                cleaning: "Phòng đang được dọn dẹp, không thể đặt vào lúc này.",
                maintenance: "Phòng đang bảo trì, không thể đặt vào lúc này.",
                offline: "Phòng đã được đặt, không thể đặt vào lúc này.",
            };
            alert(statusMessages[room.status] || "Phòng không thể đặt vào lúc này.");
            return;
        }

        const bookingData = {
            roomId: room.id,
            roomType: room.type.name,
            roomNumber: room.code,
            price: room.price || room.roomType?.basePrice,
            roomTitle: room.title,
            roomDescription: room.description,
            roomCapacity: room.capacity || room.roomType?.maxGuests || 2,
            roomImages: room.images,
            status: room.status,
        };
        
        navigate("/booking", {
            state: {
                preFilledData: bookingData,
                fromRoomPage: true,
            },
        });
    };

    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(0, endPage - maxVisiblePages + 1);
        }
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }
        return pageNumbers;
    };

    if (loading && rooms.length === 0) {
        return (
            <div className="container mx-auto px-6 py-16">
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg text-gray-600">Đang tải danh sách phòng...</div>
                </div>
            </div>
        );
    }

    if (error && rooms.length === 0) {
        return (
            <div className="container mx-auto px-6 py-16">
                <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-16">
            <h2 className="font-playfair text-4xl font-bold text-center text-gray-800 mb-12">
                Khám Phá Không Gian Nghỉ Dưỡng
            </h2>

            {/* Suggestions from BE - Display as chips */}
            {suggestions.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <h3 className="text-sm font-medium text-gray-700">Gợi ý cho bạn</h3>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {suggestions.map((suggestion) => (
                            <button
                                key={suggestion.id}
                                onClick={() => handleSuggestionSelect(suggestion)}
                                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-rose-50 
                                         border border-gray-200 hover:border-rose-300 rounded-lg 
                                         transition-all duration-200 group"
                            >
                                <span className="text-sm font-medium text-gray-700 group-hover:text-rose-700 whitespace-nowrap">
                                    {suggestion.label}
                                </span>
                                {suggestion.isPreviouslyBooked && (
                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-medium rounded-full">
                                        Đã đặt
                                    </span>
                                )}
                                {suggestion.count > 1 && (
                                    <span className="text-xs text-gray-500">
                                        ({suggestion.count})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white shadow-lg rounded-lg p-6 mb-12 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-1 xl:col-span-1">
                        <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">
                            Tìm kiếm
                        </label>
                        <SearchAutocomplete
                            name="keyword"
                            value={filters.keyword}
                            onChange={handleFilterChange}
                            onSelect={handleSuggestionSelect}
                            placeholder="Tên phòng, loại phòng..."
                        />
                    </div>

                    <div className="lg:col-span-1 xl:col-span-1">
                        <label htmlFor="typeId" className="block text-sm font-medium text-gray-700 mb-1">
                            Loại phòng
                        </label>
                        <select
                            name="typeId"
                            id="typeId"
                            value={filters.typeId}
                            onChange={handleFilterChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                        >
                            <option value="">Tất cả</option>
                            {roomTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="lg:col-span-1 xl:col-span-1">
                        <label htmlFor="priceRange" className="block text-sm font-medium text-gray-700 mb-1">
                            Khoảng giá
                        </label>
                        <select
                            name="priceRange"
                            id="priceRange"
                            value={filters.priceRange}
                            onChange={handleFilterChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                        >
                            <option value="">Tất cả mức giá</option>
                            <option value="0-1000000">Dưới 1 triệu</option>
                            <option value="1000000-2000000">1 – 2 triệu</option>
                            <option value="2000000-5000000">2 – 5 triệu</option>
                            <option value="5000000-10000000">5 – 10 triệu</option>
                            <option value="10000000-">Trên 10 triệu</option>
                        </select>
                    </div>

                    <div className="lg:col-span-1 xl:col-span-1">
                        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                            Số người
                        </label>
                        <input
                            type="number"
                            name="capacity"
                            id="capacity"
                            value={filters.capacity}
                            onChange={handleFilterChange}
                            placeholder="Nhập số người"
                            min="1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                        />
                    </div>

                    <div className="flex gap-2 items-center justify-start lg:col-span-1 xl:col-span-1 lg:mt-6 xl:mt-0">
                        <button
                            onClick={handleSearchFromServer}
                            className="flex-1 w-full bg-rose-600 text-white py-2 px-5 rounded-lg hover:bg-rose-700 transition-colors duration-200 font-medium"
                        >
                            Tìm Kiếm
                        </button>
                        <button
                            onClick={handleResetFilters}
                            title="Xóa bộ lọc"
                            className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {rooms.length > 0 ? (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-gray-700">
                            Hiển thị <b>{rooms.length}</b> trong tổng số <b>{totalElements}</b> kết quả
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Hiển thị:</label>
                            <select
                                value={pageSize}
                                onChange={handlePageSizeChange}
                                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors text-sm"
                            >
                                <option value={9}>9</option>
                                <option value={18}>18</option>
                                <option value={36}>36</option>
                                <option value={54}>54</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {rooms.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                primaryImageUrl={
                                    room.images?.find((img) => img.isPrimary)?.url || room.images?.[0]?.url
                                }
                                onBookNow={() => handleBookRoom(room)}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex flex-wrap justify-center items-center gap-2 mt-12">
                            <button
                                onClick={() => handlePageChange(0)}
                                disabled={currentPage === 0}
                                className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                                    currentPage === 0
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                «
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 0}
                                className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                                    currentPage === 0
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                ‹
                            </button>

                            {getPageNumbers().map((pageNumber) => (
                                <button
                                    key={pageNumber}
                                    onClick={() => handlePageChange(pageNumber)}
                                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                                        currentPage === pageNumber
                                            ? "bg-rose-600 text-white font-medium shadow"
                                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    {pageNumber + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages - 1}
                                className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                                    currentPage === totalPages - 1
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                ›
                            </button>
                            <button
                                onClick={() => handlePageChange(totalPages - 1)}
                                disabled={currentPage === totalPages - 1}
                                className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                                    currentPage === totalPages - 1
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                »
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-600 text-lg mb-4">
                        Không tìm thấy phòng phù hợp với tiêu chí tìm kiếm.
                    </p>
                    <button
                        onClick={handleResetFilters}
                        className="bg-rose-600 text-white py-2 px-6 rounded-lg hover:bg-rose-700 transition-colors duration-200 font-medium"
                    >
                        Hiển thị tất cả phòng
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoomsPage;