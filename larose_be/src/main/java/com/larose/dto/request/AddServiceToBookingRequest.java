package com.larose.dto.request;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddServiceToBookingRequest {
    private Long serviceId;
    private Integer quantity = 1;
    private String notes;
}

