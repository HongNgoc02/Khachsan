package com.larose.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class BookingQRRequest {
    private String bookingId;
    private String roomType;
    private String roomNumber;
    private String checkin;
    private String checkout;
    private String customer;
    private String paymentMethod;
    private BigDecimal amountPaid;
    private BigDecimal amountToPay;
    private BigDecimal remainingDue;
    private String paymentOption;
    private String customerEmail; // Email để gửi thông tin
    private String createdAt; // Ngày tạo booking
}

