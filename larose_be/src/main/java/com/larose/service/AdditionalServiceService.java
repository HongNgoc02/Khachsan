package com.larose.service;

import com.larose.dto.BookingServiceDTO;
import com.larose.dto.ServiceDTO;
import com.larose.dto.request.AddServiceToBookingRequest;
import com.larose.entity.Booking;
import com.larose.entity.BookingService;
import com.larose.entity.Service;
import com.larose.repository.BookingRepository;
import com.larose.repository.BookingServiceRepository;
import com.larose.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdditionalServiceService {

    private final ServiceRepository serviceRepository;
    private final BookingServiceRepository bookingServiceRepository;
    private final BookingRepository bookingRepository;

    /**
     * Get all active services
     */
    public List<ServiceDTO> getAllActiveServices() {
        return serviceRepository.findByIsActiveTrue().stream()
                .map(this::convertToServiceDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all services (for admin)
     */
    public List<ServiceDTO> getAllServices() {
        return serviceRepository.findAll().stream()
                .map(this::convertToServiceDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get service by id
     */
    public ServiceDTO getServiceById(Long id) {
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Service not found with id: " + id));
        return convertToServiceDTO(service);
    }

    /**
     * Get services by booking id
     */
    public List<BookingServiceDTO> getServicesByBookingId(Long bookingId) {
        return bookingServiceRepository.findByBookingIdWithService(bookingId).stream()
                .map(this::convertToBookingServiceDTO)
                .collect(Collectors.toList());
    }

    /**
     * Add service to booking
     */
    @Transactional
    public BookingServiceDTO addServiceToBooking(Long bookingId, AddServiceToBookingRequest request) {
        // Validate booking exists
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found with id: " + bookingId));

        // Validate service exists and is active
        Service service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new IllegalArgumentException("Service not found with id: " + request.getServiceId()));

        if (!service.getIsActive()) {
            throw new IllegalArgumentException("Service is not active");
        }

        // Create booking service
        BookingService bookingService = BookingService.builder()
                .booking(booking)
                .service(service)
                .quantity(request.getQuantity() != null ? request.getQuantity() : 1)
                .pricePerUnit(service.getPrice())
                .notes(request.getNotes())
                .build();

        // Calculate total price (done automatically by @PrePersist)
        BookingService saved = bookingServiceRepository.save(bookingService);

        return convertToBookingServiceDTO(saved);
    }

    /**
     * Update booking service quantity
     */
    @Transactional
    public BookingServiceDTO updateBookingServiceQuantity(Long bookingServiceId, Integer quantity) {
        BookingService bookingService = bookingServiceRepository.findById(bookingServiceId)
                .orElseThrow(() -> new IllegalArgumentException("Booking service not found with id: " + bookingServiceId));

        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }

        bookingService.setQuantity(quantity);
        bookingService.setTotalPrice(bookingService.getPricePerUnit().multiply(BigDecimal.valueOf(quantity)));

        BookingService updated = bookingServiceRepository.save(bookingService);
        return convertToBookingServiceDTO(updated);
    }

    /**
     * Remove service from booking
     */
    @Transactional
    public void removeServiceFromBooking(Long bookingServiceId) {
        if (!bookingServiceRepository.existsById(bookingServiceId)) {
            throw new IllegalArgumentException("Booking service not found with id: " + bookingServiceId);
        }
        bookingServiceRepository.deleteById(bookingServiceId);
    }

    /**
     * Create a new service (for admin)
     */
    @Transactional
    public ServiceDTO createService(ServiceDTO serviceDTO) {
        Service service = Service.builder()
                .name(serviceDTO.getName())
                .description(serviceDTO.getDescription())
                .price(serviceDTO.getPrice())
                .unit(serviceDTO.getUnit())
                .isActive(serviceDTO.getIsActive() != null ? serviceDTO.getIsActive() : true)
                .imageUrl(serviceDTO.getImageUrl())
                .category(Service.ServiceCategory.valueOf(serviceDTO.getCategory()))
                .build();

        Service saved = serviceRepository.save(service);
        return convertToServiceDTO(saved);
    }

    /**
     * Update service (for admin)
     */
    @Transactional
    public ServiceDTO updateService(Long id, ServiceDTO serviceDTO) {
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Service not found with id: " + id));

        if (serviceDTO.getName() != null) {
            service.setName(serviceDTO.getName());
        }
        if (serviceDTO.getDescription() != null) {
            service.setDescription(serviceDTO.getDescription());
        }
        if (serviceDTO.getPrice() != null) {
            service.setPrice(serviceDTO.getPrice());
        }
        if (serviceDTO.getUnit() != null) {
            service.setUnit(serviceDTO.getUnit());
        }
        if (serviceDTO.getIsActive() != null) {
            service.setIsActive(serviceDTO.getIsActive());
        }
        if (serviceDTO.getImageUrl() != null) {
            service.setImageUrl(serviceDTO.getImageUrl());
        }
        if (serviceDTO.getCategory() != null) {
            service.setCategory(Service.ServiceCategory.valueOf(serviceDTO.getCategory()));
        }

        Service updated = serviceRepository.save(service);
        return convertToServiceDTO(updated);
    }

    /**
     * Delete service (for admin)
     */
    @Transactional
    public void deleteService(Long id) {
        if (!serviceRepository.existsById(id)) {
            throw new IllegalArgumentException("Service not found with id: " + id);
        }
        serviceRepository.deleteById(id);
    }

    // Converter methods
    private ServiceDTO convertToServiceDTO(Service service) {
        return ServiceDTO.builder()
                .id(service.getId())
                .name(service.getName())
                .description(service.getDescription())
                .price(service.getPrice())
                .unit(service.getUnit())
                .isActive(service.getIsActive())
                .imageUrl(service.getImageUrl())
                .category(service.getCategory().name())
                .createdAt(service.getCreatedAt())
                .updatedAt(service.getUpdatedAt())
                .build();
    }

    private BookingServiceDTO convertToBookingServiceDTO(BookingService bookingService) {
        BookingServiceDTO dto = BookingServiceDTO.builder()
                .id(bookingService.getId())
                .bookingId(bookingService.getBooking().getId())
                .serviceId(bookingService.getService().getId())
                .quantity(bookingService.getQuantity())
                .pricePerUnit(bookingService.getPricePerUnit())
                .totalPrice(bookingService.getTotalPrice())
                .notes(bookingService.getNotes())
                .createdAt(bookingService.getCreatedAt())
                .updatedAt(bookingService.getUpdatedAt())
                .build();

        // Add service details
        if (bookingService.getService() != null) {
            dto.setServiceName(bookingService.getService().getName());
            dto.setServiceDescription(bookingService.getService().getDescription());
            dto.setServiceImageUrl(bookingService.getService().getImageUrl());
        }

        return dto;
    }
}

