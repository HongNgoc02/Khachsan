import React, { useState } from "react";
import { Clock, Sparkles } from "lucide-react";

/**
 * SearchSuggestions Component
 * Displays personalized search suggestions based on user's booking history
 * 
 * @param {Array} suggestions - Array of suggestion objects
 * @param {Function} onSuggestionClick - Callback when a suggestion is clicked
 * @param {Boolean} loading - Loading state
 */
const SearchSuggestions = ({ suggestions = [], onSuggestionClick, loading = false }) => {
    const [hoveredId, setHoveredId] = useState(null);

    if (loading) {
        return (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-rose-600" />
                    <h3 className="text-sm font-medium text-gray-700">Gợi ý cho bạn</h3>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="flex-shrink-0 h-10 w-32 bg-gray-200 rounded-lg animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (!suggestions || suggestions.length === 0) {
        return null;
    }

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-medium text-gray-700">Gợi ý cho bạn</h3>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {suggestions.map((suggestion) => (
                    <div
                        key={suggestion.id}
                        className="relative flex-shrink-0"
                        onMouseEnter={() => setHoveredId(suggestion.id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        <button
                            onClick={() => onSuggestionClick(suggestion)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-rose-50 
                                     border border-gray-200 hover:border-rose-300 rounded-lg 
                                     transition-all duration-200 group focus:outline-none 
                                     focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
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

                        {/* Tooltip */}
                        {hoveredId === suggestion.id && suggestion.lastBookedDate && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                                          px-3 py-2 bg-gray-900 text-white text-xs rounded-lg 
                                          whitespace-nowrap z-10 shadow-lg">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    <span>Lần cuối: {formatDate(suggestion.lastBookedDate)}</span>
                                </div>
                                {/* Arrow */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 
                                              border-4 border-transparent border-t-gray-900" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SearchSuggestions;
