import HttpService from "../../services/http.service";

class BookingService extends HttpService {
    constructor() {
        super("http://localhost:8080/api");
    }

    async getAllBookings(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await this.get(`/admin/bookings?${queryString}`);
            return response;
        } catch (error) {
            console.error("Error in getAllBookings:", error);
            throw error;
        }
    }

    async getHistoryBookings(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await this.get(`/users/bookings/status?${queryString}`);
            return response;
        } catch (error) {
            console.error("Error in getAllBookings:", error);
            throw error;
        }
    }


    async getBookingById(bookingId) {
        try {
            const response = await this.get(`/admin/bookings/${bookingId}`);
            return response;
        } catch (error) {
            console.error("Error in getBookingById:", error);
            throw error;
        }
    }

    async updateBookingStatus(bookingId, status) {
        try {
            const response = await this.put(
                `/admin/bookings/${bookingId}/status?status=${status}`,
            );
            return response;
        } catch (error) {
            console.error("Error in updateBookingStatus:", error);
            throw error;
        }
    }

    async cancelBooking(bookingId, reason = "") {
        try {
            const response = await this.put(
                `/admin/bookings/${bookingId}/cancel?reason=${encodeURIComponent(reason)}`,
            );
            return response;
        } catch (error) {
            console.error("Error in cancelBooking:", error);
            throw error;
        }
    }

    async cancelUserBooking(bookingId) {
        try {
            const response = await this.put(`/booking/cancel/${bookingId}`);
            return response;
        } catch (error) {
            console.error("Error in cancelUserBooking:", error);
            throw error;
        }
    }

    async getTransaction(bookingId) {
        try {
            const response = await this.get(`/transaction/${bookingId}`);
            return response;
        } catch (error) {
            console.error("Error in getTransaction:", error);
            throw error;
        }
    }

    async getAllTransactions(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await this.get(`/admin/transactions?${queryString}`);
            return response;
        } catch (error) {
            console.error("Error in getAllTransactions:", error);
            throw error;
        }
    }

    async updateTransactionStatus(transactionId, status) {
        try {
            // Thử endpoint admin trước
            try {
                const response = await this.put(
                    `/admin/transactions/${transactionId}/status?status=${status}`,
                );
                return response;
            } catch (adminError) {
                // Nếu không có endpoint admin, thử endpoint transaction thông thường
                try {
                    const response = await this.put(
                        `/transaction/${transactionId}/status?status=${status}`,
                    );
                    return response;
                } catch (transactionError) {
                    // Nếu cả hai đều không có, thử PUT với body
                    const response = await this.put(
                        `/transaction/${transactionId}`,
                        { status: status }
                    );
                    return response;
                }
            }
        } catch (error) {
            console.error("Error in updateTransactionStatus:", error);
            throw error;
        }
    }
}

export default new BookingService();

