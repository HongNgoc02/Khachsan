import { useState, useEffect, useRef } from "react";
import { Search, Clock, X } from "lucide-react";

/**
 * SearchAutocomplete Component
 * Displays search history from localStorage in dropdown
 */
const SearchAutocomplete = ({ 
    value, 
    onChange, 
    onSelect,
    placeholder = "Tìm kiếm...",
    name = "search"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Load search history from localStorage
    useEffect(() => {
        const history = JSON.parse(localStorage.getItem('roomSearchHistory') || '[]');
        setSearchHistory(history);
    }, []);

    // Filter history based on input value
    useEffect(() => {
        if (!value || value.length < 1) {
            setFilteredHistory(searchHistory.slice(0, 5));
        } else {
            const searchLower = value.toLowerCase();
            const matches = searchHistory
                .filter(term => term.toLowerCase().includes(searchLower))
                .slice(0, 5);
            setFilteredHistory(matches);
        }
    }, [value, searchHistory]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        onChange(e);
        setIsOpen(true);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const handleHistoryClick = (term) => {
        // Call parent's onSelect handler with history item
        if (onSelect) {
            onSelect({ type: 'history', label: term });
        }
        setIsOpen(false);
    };

    const saveToSearchHistory = (term) => {
        if (!term || term.trim().length === 0) return;

        const history = JSON.parse(localStorage.getItem('roomSearchHistory') || '[]');
        const filtered = history.filter(h => h !== term);
        const updated = [term, ...filtered].slice(0, 10);
        
        localStorage.setItem('roomSearchHistory', JSON.stringify(updated));
        setSearchHistory(updated);
    };

    const clearSearchHistory = (e) => {
        e.stopPropagation();
        localStorage.removeItem('roomSearchHistory');
        setSearchHistory([]);
    };

    const removeHistoryItem = (term, e) => {
        e.stopPropagation();
        const history = JSON.parse(localStorage.getItem('roomSearchHistory') || '[]');
        const updated = history.filter(h => h !== term);
        localStorage.setItem('roomSearchHistory', JSON.stringify(updated));
        setSearchHistory(updated);
    };

    // Save search when user submits
    useEffect(() => {
        if (value && value.trim().length > 0) {
            const timeoutId = setTimeout(() => {
                saveToSearchHistory(value);
            }, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [value]);

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                    ref={inputRef}
                    type="text"
                    name={name}
                    value={value}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500
                             transition-all duration-200 bg-white"
                    autoComplete="off"
                />
            </div>

            {/* Dropdown with search history */}
            {isOpen && filteredHistory.length > 0 && (
                <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-xs font-medium text-gray-600">Tìm kiếm gần đây</span>
                        <button
                            onClick={clearSearchHistory}
                            className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                        >
                            Xóa tất cả
                        </button>
                    </div>
                    
                    <ul className="py-1">
                        {filteredHistory.map((term, index) => (
                            <li key={`${term}-${index}`}>
                                <button
                                    onClick={() => handleHistoryClick(term)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 
                                             hover:bg-gray-50 transition-colors duration-150 group"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Clock className="w-4 h-4 flex-shrink-0 text-gray-400" />
                                        <span className="text-sm text-gray-700 truncate">{term}</span>
                                    </div>
                                    <button
                                        onClick={(e) => removeHistoryItem(term, e)}
                                        className="ml-2 p-1 opacity-0 group-hover:opacity-100 
                                                 hover:bg-gray-200 rounded transition-all duration-150"
                                    >
                                        <X className="w-3 h-3 text-gray-500" />
                                    </button>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchAutocomplete;
