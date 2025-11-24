package com.larose.controller;

import com.larose.dto.request.TransactionRequest;
import com.larose.dto.response.TransactionResponse;
import com.larose.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transaction")
@RequiredArgsConstructor
public class TransactionController {
    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<TransactionResponse> create(@Valid @RequestBody TransactionRequest transaction) {
        TransactionResponse response = transactionService.create(transaction);
        System.out.println(response.getBookingDTO().getBookingCode());
        return ResponseEntity.ok(response);
    }
    @GetMapping("/{bookingId}")
    public ResponseEntity<TransactionResponse> getTransaction(@PathVariable Long bookingId) {
        TransactionResponse response = transactionService.getTransaction(bookingId);
        return ResponseEntity.ok(response);
    }
}
