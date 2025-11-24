package com.larose.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReviewResponseDTO {
    private Long id;
    private String content;
    private LocalDateTime createdAt;
    
    // Thông tin người phản hồi (admin)
    private Long responderId;
    private String responderName;
    private String responderEmail;
}


