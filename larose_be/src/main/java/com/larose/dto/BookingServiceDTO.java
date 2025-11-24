package com.larose.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingServiceDTO {
    private Long id;
    private Long bookingId;
    private Long serviceId;
    private String serviceName;
    private String serviceDescription;
    private String serviceImageUrl;
    private Integer quantity;
    private BigDecimal pricePerUnit;
    private BigDecimal totalPrice;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

