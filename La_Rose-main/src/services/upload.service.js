// /src/services/upload.service.js

import HttpService from "./http.service";
import axios from "axios";

class UploadService {
    constructor() {
        this.httpService = new HttpService("http://localhost:8080");
        this.basePath = "/api/upload";
    }

    /**
     * Upload single file
     * @param {File} file - File to upload
     * @param {string} folder - Folder name (default: 'reviews')
     * @returns {Promise<{url: string, filename: string, originalName: string}>}
     */
    async uploadFile(file, folder = 'reviews') {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', folder);

            // Get token manually to ensure it's sent
            const token = localStorage.getItem("accessToken");
            const headers = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
            // Don't set Content-Type - browser will set it with boundary for FormData

            console.log('Uploading file:', file.name, 'Token present:', !!token);

            const response = await this.httpService.instance.post(
                `${this.basePath}/file`,
                formData,
                { headers }
            );
            return response.data;
        } catch (error) {
            console.error("Error uploading file:", error);
            if (error.response) {
                console.error("Response status:", error.response.status);
                console.error("Response data:", error.response.data);
            }
            throw error;
        }
    }

    /**
     * Upload multiple files
     * @param {File[]} files - Array of files to upload
     * @param {string} folder - Folder name (default: 'reviews')
     * @returns {Promise<{files: Array, errors?: Array}>}
     */
    async uploadFiles(files, folder = 'reviews') {
        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });
            formData.append('folder', folder);

            // Get token manually to ensure it's sent
            const token = localStorage.getItem("accessToken");
            
            console.log('Uploading files:', files.length, 'Token present:', !!token);
            if (token) {
                console.log('Token preview:', token.substring(0, 20) + '...');
            }

            // Use axios directly with proper config to ensure headers are set correctly
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            // Don't set Content-Type - browser will set it with boundary for FormData

            const response = await axios.post(
                `http://localhost:8080${this.basePath}/files`,
                formData,
                {
                    headers: headers,
                    withCredentials: true
                }
            );
            return response.data;
        } catch (error) {
            console.error("Error uploading files:", error);
            if (error.response) {
                console.error("Response status:", error.response.status);
                console.error("Response data:", error.response.data);
                console.error("Response headers:", error.response.headers);
            }
            if (error.request) {
                console.error("Request config:", error.config);
            }
            throw error;
        }
    }

    /**
     * Delete file
     * @param {string} url - File URL to delete
     * @returns {Promise<{message: string}>}
     */
    async deleteFile(url) {
        try {
            return await this.httpService.delete(`${this.basePath}/file`, {
                params: { url },
            });
        } catch (error) {
            console.error("Error deleting file:", error);
            throw error;
        }
    }
}

const uploadService = new UploadService();
export default uploadService;

