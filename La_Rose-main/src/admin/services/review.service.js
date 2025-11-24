import HttpService from "../../services/http.service";

class ReviewService extends HttpService {
    constructor() {
        super("http://localhost:8080/api");
    }

    async getAllReviews(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await this.get(`/reviews/admin?${queryString}`);
            return response;
        } catch (error) {
            console.error("Error in getAllReviews:", error);
            throw error;
        }
    }

    async getReviewById(reviewId) {
        try {
            const response = await this.get(`/reviews/${reviewId}`);
            return response;
        } catch (error) {
            console.error("Error in getReviewById:", error);
            throw error;
        }
    }

    async updateReview(reviewId, reviewData) {
        try {
            const response = await this.put(`/reviews`, reviewData);
            return response;
        } catch (error) {
            console.error("Error in updateReview:", error);
            throw error;
        }
    }

    async updateReviewStatus(reviewId, status) {
        try {
            const response = await this.put(`/reviews/${reviewId}/status?status=${status}`);
            return response;
        } catch (error) {
            console.error("Error in updateReviewStatus:", error);
            throw error;
        }
    }

    async deleteReview(reviewId) {
        try {
            const response = await this.delete(`/reviews/${reviewId}`);
            return response;
        } catch (error) {
            console.error("Error in deleteReview:", error);
            throw error;
        }
    }

    // Response methods
    async createResponse(reviewId, content) {
        try {
            const response = await this.post(`/reviews/response`, {
                reviewId: reviewId,
                content: content
            });
            return response;
        } catch (error) {
            console.error("Error in createResponse:", error);
            throw error;
        }
    }

    async updateResponse(responseId, content) {
        try {
            const response = await this.put(`/reviews/response`, {
                id: responseId,
                content: content
            });
            return response;
        } catch (error) {
            console.error("Error in updateResponse:", error);
            throw error;
        }
    }

    async deleteResponse(responseId) {
        try {
            const response = await this.delete(`/reviews/response/${responseId}`);
            return response;
        } catch (error) {
            console.error("Error in deleteResponse:", error);
            throw error;
        }
    }
}

export default new ReviewService();

