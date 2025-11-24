import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import additionalServiceService from "../../services/additionalService.service";
import AddServiceModal from "../components/service/AddServiceModal";
import EditServiceModal from "../components/service/EditServiceModal";
import DeleteConfirmationModal from "../components/room/DeleteConfirmationModal";
import {
    Package,
    ChevronLeft,
    ChevronRight,
    Edit,
    Plus,
    Trash,
} from "lucide-react";

const ServiceManagement = () => {
    const [services, setServices] = useState([]);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch services
    const fetchServices = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            const response = await additionalServiceService.getAllServices();
            setServices(response || []);
        } catch (error) {
            console.error("❌ Lỗi khi tải danh sách dịch vụ:", error);
            toast.error("Không thể tải danh sách dịch vụ");
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    // Fetch services when component mounts
    useEffect(() => {
        fetchServices();
    }, []);

    // Handle add service
    const handleAddService = async (serviceData) => {
        try {
            await additionalServiceService.createService(serviceData);
            toast.success("Thêm dịch vụ thành công");
            fetchServices(false);
            return true;
        } catch (error) {
            console.error("Lỗi khi thêm dịch vụ:", error);
            toast.error("Không thể thêm dịch vụ");
            return false;
        }
    };

    // Handle edit service
    const handleEditService = async (serviceId, serviceData) => {
        try {
            await additionalServiceService.updateService(serviceId, serviceData);
            toast.success("Cập nhật dịch vụ thành công");
            fetchServices(false);
            return true;
        } catch (error) {
            console.error("Lỗi khi cập nhật dịch vụ:", error);
            toast.error("Không thể cập nhật dịch vụ");
            return false;
        }
    };

    // Handle delete service
    const handleDeleteService = async (serviceId) => {
        try {
            await additionalServiceService.deleteService(serviceId);
            toast.success("Xóa dịch vụ thành công");
            fetchServices(false);
        } catch (error) {
            console.error("Lỗi khi xóa dịch vụ:", error);
            toast.error("Không thể xóa dịch vụ");
        }
    };

    // Handle edit
    const handleEdit = (service) => {
        setSelectedService(service);
        setEditModalOpen(true);
    };

    // Handle delete
    const handleDelete = (service) => {
        setServiceToDelete(service);
        setDeleteModalOpen(true);
    };

    // Handle confirm delete
    const handleConfirmDelete = () => {
        if (serviceToDelete) {
            handleDeleteService(serviceToDelete.id);
            setDeleteModalOpen(false);
            setServiceToDelete(null);
        }
    };

    // Handle cancel delete
    const handleCancelDelete = () => {
        setDeleteModalOpen(false);
        setServiceToDelete(null);
    };

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    // Get status text
    const getStatusText = (status) => {
        const statusMap = {
            active: "Hoạt động",
            inactive: "Ngừng hoạt động",
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        const statusColors = {
            active: "text-green-600 bg-green-100",
            inactive: "text-red-600 bg-red-100",
        };
        return statusColors[status] || "text-gray-600 bg-gray-100";
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-lg flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            Quản lý dịch vụ
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Tổng số: {services.length} dịch vụ
                        </p>
                    </div>
                    <button
                        onClick={() => setAddModalOpen(true)}
                        className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors flex items-center font-medium"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm dịch vụ
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    Tên dịch vụ
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Mô tả
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Giá
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Đơn vị
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Trạng thái
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-center"
                                >
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-8 text-center text-gray-500"
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            <Package className="w-16 h-16 text-gray-300 mb-4" />
                                            <p className="text-lg font-medium text-gray-400">
                                                Không có dữ liệu dịch vụ
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                services.map((service) => (
                                    <tr
                                        key={service.id}
                                        className="bg-white border-b hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {service.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900">
                                                {service.description || "N/A"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {formatPrice(service.price)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {service.unit || "lần"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                                                    service.isActive !== false ? "active" : "inactive"
                                                )}`}
                                            >
                                                {getStatusText(
                                                    service.isActive !== false ? "active" : "inactive"
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center space-x-2">
                                                <button
                                                    onClick={() =>
                                                        handleEdit(service)
                                                    }
                                                    className="text-green-600 hover:text-green-800 transition-colors p-1 rounded hover:bg-green-50"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(service)
                                                    }
                                                    className="text-red-600 hover:text-red-800 transition-colors p-1 rounded hover:bg-red-50"
                                                    title="Xóa"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {isAddModalOpen && (
                <AddServiceModal
                    isOpen={isAddModalOpen}
                    onClose={() => setAddModalOpen(false)}
                    onAddService={handleAddService}
                />
            )}

            {isEditModalOpen && selectedService && (
                <EditServiceModal
                    isOpen={isEditModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    onEditService={handleEditService}
                    service={selectedService}
                />
            )}

            {isDeleteModalOpen && (
                <DeleteConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                    title="Xác nhận xóa dịch vụ"
                    message={
                        serviceToDelete
                            ? `Bạn có chắc chắn muốn xóa dịch vụ "${serviceToDelete.name}" không? Hành động này không thể hoàn tác.`
                            : ""
                    }
                    confirmText="Xóa"
                    cancelText="Hủy"
                />
            )}
        </>
    );
};

export default ServiceManagement;

