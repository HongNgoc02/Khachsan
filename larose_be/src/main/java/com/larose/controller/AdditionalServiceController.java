package com.larose.controller;

import com.larose.dto.BookingServiceDTO;
import com.larose.dto.ServiceDTO;
import com.larose.dto.request.AddServiceToBookingRequest;
import com.larose.service.AdditionalServiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class AdditionalServiceController {

    private final AdditionalServiceService additionalServiceService;

    /**
     * Get all active services (for customers)
     */
    @GetMapping("/active")
    public ResponseEntity<List<ServiceDTO>> getAllActiveServices() {
        return ResponseEntity.ok(additionalServiceService.getAllActiveServices());
    }

    /**
     * Get all services (for admin)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ServiceDTO>> getAllServices() {
        return ResponseEntity.ok(additionalServiceService.getAllServices());
    }

    /**
     * Get service by id
     */
    @GetMapping("/{id}")
    public ResponseEntity<ServiceDTO> getServiceById(@PathVariable Long id) {
        return ResponseEntity.ok(additionalServiceService.getServiceById(id));
    }

    /**
     * Get services by booking id
     */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<BookingServiceDTO>> getServicesByBookingId(@PathVariable Long bookingId) {
        return ResponseEntity.ok(additionalServiceService.getServicesByBookingId(bookingId));
    }

    /**
     * Add service to booking
     */
    @PostMapping("/booking/{bookingId}")
    public ResponseEntity<BookingServiceDTO> addServiceToBooking(
            @PathVariable Long bookingId,
            @RequestBody AddServiceToBookingRequest request
    ) {
        try {
            BookingServiceDTO result = additionalServiceService.addServiceToBooking(bookingId, request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * Update booking service quantity
     */
    @PutMapping("/booking-service/{bookingServiceId}")
    public ResponseEntity<BookingServiceDTO> updateBookingServiceQuantity(
            @PathVariable Long bookingServiceId,
            @RequestParam Integer quantity
    ) {
        try {
            BookingServiceDTO result = additionalServiceService.updateBookingServiceQuantity(bookingServiceId, quantity);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * Remove service from booking
     */
    @DeleteMapping("/booking-service/{bookingServiceId}")
    public ResponseEntity<String> removeServiceFromBooking(@PathVariable Long bookingServiceId) {
        try {
            additionalServiceService.removeServiceFromBooking(bookingServiceId);
            return ResponseEntity.ok("Service removed successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Create a new service (for admin)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ServiceDTO> createService(@RequestBody ServiceDTO serviceDTO) {
        try {
            ServiceDTO created = additionalServiceService.createService(serviceDTO);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * Update service (for admin)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ServiceDTO> updateService(@PathVariable Long id, @RequestBody ServiceDTO serviceDTO) {
        try {
            ServiceDTO updated = additionalServiceService.updateService(id, serviceDTO);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * Delete service (for admin)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteService(@PathVariable Long id) {
        try {
            additionalServiceService.deleteService(id);
            return ResponseEntity.ok("Service deleted successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

