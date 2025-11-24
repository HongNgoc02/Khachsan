import HttpService from './http.service';

class AdditionalServiceService {
    constructor() {
        this.httpService = new HttpService("http://localhost:8080");
        this.basePath = "/api/services";
    }

    // Get all active services
    async getAllActiveServices() {
        try {
            return await this.httpService.get(`${this.basePath}/active`);
        } catch (error) {
            console.error("Error fetching active services:", error);
            throw error;
        }
    }

    // Get services by booking id
    async getServicesByBookingId(bookingId) {
        try {
            return await this.httpService.get(`${this.basePath}/booking/${bookingId}`);
        } catch (error) {
            console.error("Error fetching services by booking ID:", error);
            throw error;
        }
    }

    // Add service to booking
    async addServiceToBooking(bookingId, serviceData) {
        try {
            return await this.httpService.post(`${this.basePath}/booking/${bookingId}`, serviceData);
        } catch (error) {
            console.error("Error adding service to booking:", error);
            throw error;
        }
    }

    // Update booking service quantity
    async updateBookingServiceQuantity(bookingServiceId, quantity) {
        try {
            return await this.httpService.put(`${this.basePath}/booking-service/${bookingServiceId}?quantity=${quantity}`);
        } catch (error) {
            console.error("Error updating service quantity:", error);
            throw error;
        }
    }

    // Remove service from booking
    async removeServiceFromBooking(bookingServiceId) {
        try {
            return await this.httpService.delete(`${this.basePath}/booking-service/${bookingServiceId}`);
        } catch (error) {
            console.error("Error removing service from booking:", error);
            throw error;
        }
    }

    // Admin endpoints
    async getAllServices() {
        try {
            return await this.httpService.get(this.basePath);
        } catch (error) {
            console.error("Error fetching all services:", error);
            throw error;
        }
    }

    async createService(serviceData) {
        try {
            return await this.httpService.post(this.basePath, serviceData);
        } catch (error) {
            console.error("Error creating service:", error);
            throw error;
        }
    }

    async updateService(id, serviceData) {
        try {
            return await this.httpService.put(`${this.basePath}/${id}`, serviceData);
        } catch (error) {
            console.error("Error updating service:", error);
            throw error;
        }
    }

    async deleteService(id) {
        try {
            return await this.httpService.delete(`${this.basePath}/${id}`);
        } catch (error) {
            console.error("Error deleting service:", error);
            throw error;
        }
    }
}

const additionalServiceService = new AdditionalServiceService();
export default additionalServiceService;

