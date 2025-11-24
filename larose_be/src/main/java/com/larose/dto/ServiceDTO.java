package com.larose.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceDTO {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String unit;
    private Boolean isActive;
    private String imageUrl;
    private String category;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

