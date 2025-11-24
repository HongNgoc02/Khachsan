package com.larose.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingSuggestionDTO {
    private Long roomTypeId;
    private String roomTypeName;
    private Long roomId;
    private String roomTitle;
    private String roomCode;
    private LocalDate lastBookedDate;
    private Integer bookingCount;
    private String suggestionType; // "roomType" or "room"
}
