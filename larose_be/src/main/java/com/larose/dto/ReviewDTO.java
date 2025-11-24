package com.larose.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReviewDTO {
    private Long id;
    private Byte rating;
    private String title;
    private String content;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Media files
    private List<String> images; // List of image URLs
    private List<String> videos; // List of video URLs

    // Thông tin booking liên quan
    private Long bookingId;
    private String bookingCode;

    // Thông tin phòng
    private Long roomId;
    private String roomCode;
    private String roomTitle;

    // Thông tin user
    private Long userId;
    private String userEmail;
    private String userFullName;

    // Phản hồi từ admin
    private List<ReviewResponseDTO> responses;
}