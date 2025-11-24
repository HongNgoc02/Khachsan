// /src/services/statistical.service.js
import HttpService from "./http.service";

class StatisticalService {
    constructor() {
        this.httpService = new HttpService("http://localhost:8080");
        this.basePath = "/api/statistical";
    }

    async getTotalRooms() {
        return await this.httpService.get(`${this.basePath}/rooms/total`, { skipAuth: true });
    }

    async getBookedRooms(minDate, maxDate) {
        let url = `${this.basePath}/rooms/booked`;
        const params = new URLSearchParams();
        if (minDate) params.append("minDate", minDate);
        if (maxDate) params.append("maxDate", maxDate);
        if (params.toString()) url += `?${params.toString()}`;
        return await this.httpService.get(url, { skipAuth: true });
    }

    async getRevenue(days = 7, startDate = null, endDate = null) {
        const params = new URLSearchParams();
        if (startDate && endDate) {
            params.append("startDate", startDate);
            params.append("endDate", endDate);
        } else if (days) {
            params.append("days", days);
        }
        const url = params.toString() ? `${this.basePath}/revenue?${params.toString()}` : `${this.basePath}/revenue`;
        return await this.httpService.get(url, { skipAuth: true });
    }

    // === THÊM MỚI ===
    async getDailyRevenue(days = 7, startDate = null, endDate = null) {
        const params = new URLSearchParams();
        if (startDate && endDate) {
            params.append("startDate", startDate);
            params.append("endDate", endDate);
        } else if (days) {
            params.append("days", days);
        }
        const url = params.toString() ? `${this.basePath}/revenue/daily?${params.toString()}` : `${this.basePath}/revenue/daily`;
        return await this.httpService.get(url, { skipAuth: true });
    }

    async getWeeklyRevenue(weeks = 12) {
        return await this.httpService.get(`${this.basePath}/revenue/weekly?weeks=${weeks}`, { skipAuth: true });
    }

    async getOccupancyRate(minDate, maxDate) {
        const params = new URLSearchParams({ minDate, maxDate });
        return await this.httpService.get(`${this.basePath}/occupancy-rate?${params.toString()}`, { skipAuth: true });
    }
}

const statisticalService = new StatisticalService();
export default statisticalService;