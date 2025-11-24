package com.larose.service;

import com.larose.constant.StatusConstant;
import com.larose.dto.BookingDTO;
import com.larose.dto.request.TransactionRequest;
import com.larose.dto.response.TransactionResponse;
import com.larose.entity.Booking;
import com.larose.entity.Transaction;
import com.larose.maptruct.BookingMapper;
import com.larose.maptruct.TransactionMapper;
import com.larose.repository.TransactionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final BookingService bookingService;
    private final TransactionMapper transactionMapper;
    private final BookingMapper bookingMapper;

    @Transactional
    public TransactionResponse create(TransactionRequest request) {
        Transaction transaction = transactionMapper.toEntity(request);
        transaction.setStatus(Transaction.Status.initiated);

        BookingDTO bookingDTO = bookingService.create(request.getBookingDTO());
        Booking getBookingByCode = bookingService.getBookingByCode(bookingDTO.getBookingCode());
        transaction.setUser(getBookingByCode.getUser());
        transaction.setBooking(getBookingByCode);
        if(request.getType().equals(StatusConstant.TransactionType.PAYMENT)){
            transaction.setType(Transaction.Type.PAYMENT);
            transaction.setStatus(Transaction.Status.initiated);
        }
        if(Objects.equals(request.getProvider(), "VNPAY")){
            transaction.setStatus(Transaction.Status.initiated);
        }
        TransactionResponse response = transactionMapper.toResponse(transactionRepository.save(transaction));
        response.setBookingDTO(bookingDTO);
        return response;
    }

    @Transactional
    public TransactionResponse getTransaction(Long bookingId) {

        Transaction transaction = transactionRepository.getByBookingId(bookingId)
                .orElseThrow(() -> new RuntimeException("Transaction not found for booking code: " + bookingId));
        TransactionResponse response = transactionMapper.toResponse(transaction);
        if (transaction.getBooking() != null) {
            BookingDTO bookingDTO = bookingMapper.toBookingDTO(transaction.getBooking());
            // Đảm bảo set userFullName và userEmail nếu chưa có
            if (transaction.getBooking().getUser() != null) {
                if (bookingDTO.getUserFullName() == null || bookingDTO.getUserFullName().isEmpty()) {
                    bookingDTO.setUserFullName(transaction.getBooking().getUser().getFullName());
                }
                if (bookingDTO.getUserEmail() == null || bookingDTO.getUserEmail().isEmpty()) {
                    bookingDTO.setUserEmail(transaction.getBooking().getUser().getEmail());
                }
            }
            response.setBookingDTO(bookingDTO);
        }
        return response;
    }

    @Transactional
    public TransactionResponse updateTransactionStatus(Long transactionId, String status) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + transactionId));
        
        // Convert string status to enum
        // Enum có: initiated, success, failed (lowercase) và REFUNDED (uppercase)
        Transaction.Status statusEnum;
        try {
            String statusLower = status.toLowerCase();
            switch (statusLower) {
                case "initiated":
                    statusEnum = Transaction.Status.initiated;
                    break;
                case "success":
                    statusEnum = Transaction.Status.success;
                    break;
                case "failed":
                    statusEnum = Transaction.Status.failed;
                    break;
                case "refunded":
                    statusEnum = Transaction.Status.refunded;
                    break;
                default:
                    throw new RuntimeException("Invalid transaction status: " + status);
            }
        } catch (Exception e) {
            throw new RuntimeException("Invalid transaction status: " + status, e);
        }
        
        transaction.setStatus(statusEnum);
        Transaction savedTransaction = transactionRepository.save(transaction);
        
        TransactionResponse response = transactionMapper.toResponse(savedTransaction);
        if (savedTransaction.getBooking() != null) {
            BookingDTO bookingDTO = bookingMapper.toBookingDTO(savedTransaction.getBooking());
            // Đảm bảo set userFullName và userEmail nếu chưa có
            if (savedTransaction.getBooking().getUser() != null) {
                if (bookingDTO.getUserFullName() == null || bookingDTO.getUserFullName().isEmpty()) {
                    bookingDTO.setUserFullName(savedTransaction.getBooking().getUser().getFullName());
                }
                if (bookingDTO.getUserEmail() == null || bookingDTO.getUserEmail().isEmpty()) {
                    bookingDTO.setUserEmail(savedTransaction.getBooking().getUser().getEmail());
                }
            }
            response.setBookingDTO(bookingDTO);
        }
        
        return response;
    }

    public Page<TransactionResponse> getAllTransactions(String status, String provider, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        Page<Transaction> transactions;
        
        // Convert string status to enum nếu có
        Transaction.Status statusEnum = null;
        if (status != null && !status.isEmpty()) {
            try {
                String statusLower = status.toLowerCase();
                switch (statusLower) {
                    case "initiated":
                        statusEnum = Transaction.Status.initiated;
                        break;
                    case "success":
                        statusEnum = Transaction.Status.success;
                        break;
                    case "failed":
                        statusEnum = Transaction.Status.failed;
                        break;
                    case "refunded":
                        statusEnum = Transaction.Status.refunded;
                        break;
                }
            } catch (Exception e) {
                // Nếu không parse được, bỏ qua filter status
            }
        }
        
        // Nếu có startDate và endDate, sử dụng query với khoảng thời gian
        if (startDate != null && endDate != null) {
            LocalDateTime startDateTime = startDate.atStartOfDay();
            LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
            
            // Nếu có status, filter theo status và khoảng thời gian
            if (statusEnum != null) {
                List<Transaction> allTransactions = transactionRepository.findAllByStatusAndCreatedAtBetween(
                    statusEnum, startDateTime, endDateTime
                );
                
                // Filter theo provider nếu có
                if (provider != null && !provider.isEmpty()) {
                    allTransactions = allTransactions.stream()
                        .filter(t -> provider.equalsIgnoreCase(t.getProvider()))
                        .collect(Collectors.toList());
                }
                
                // Áp dụng pagination
                int start = (int) pageable.getOffset();
                int end = Math.min((start + pageable.getPageSize()), allTransactions.size());
                List<Transaction> pagedTransactions = allTransactions.subList(start, end);
                
                transactions = new PageImpl<>(pagedTransactions, pageable, allTransactions.size());
            } else {
                // Nếu không có status, lấy tất cả và filter theo khoảng thời gian
                // Tạm thời lấy tất cả và filter trong memory (có thể tối ưu sau bằng query)
                List<Transaction> allTransactions = transactionRepository.findAll()
                    .stream()
                    .filter(t -> {
                        LocalDateTime createdAt = t.getCreatedAt();
                        return createdAt != null && 
                               (createdAt.isEqual(startDateTime) || createdAt.isAfter(startDateTime)) && 
                               (createdAt.isEqual(endDateTime) || createdAt.isBefore(endDateTime));
                    })
                    .collect(Collectors.toList());
                
                // Filter theo provider nếu có
                if (provider != null && !provider.isEmpty()) {
                    allTransactions = allTransactions.stream()
                        .filter(t -> provider.equalsIgnoreCase(t.getProvider()))
                        .collect(Collectors.toList());
                }
                
                // Áp dụng pagination
                int start = (int) pageable.getOffset();
                int end = Math.min((start + pageable.getPageSize()), allTransactions.size());
                List<Transaction> pagedTransactions = allTransactions.subList(start, end);
                
                transactions = new PageImpl<>(pagedTransactions, pageable, allTransactions.size());
            }
        } else {
            // Không có khoảng thời gian, sử dụng logic cũ
            if (statusEnum != null && provider != null && !provider.isEmpty()) {
                transactions = transactionRepository.findAllByStatusAndProvider(statusEnum, provider, pageable);
            } else if (statusEnum != null) {
                transactions = transactionRepository.findAllByStatus(statusEnum, pageable);
            } else if (provider != null && !provider.isEmpty()) {
                transactions = transactionRepository.findAllByProvider(provider, pageable);
            } else {
                transactions = transactionRepository.findAll(pageable);
            }
        }
        
        // Convert to TransactionResponse với bookingDTO
        return transactions.map(transaction -> {
            TransactionResponse response = transactionMapper.toResponse(transaction);
            if (transaction.getBooking() != null) {
                BookingDTO bookingDTO = bookingMapper.toBookingDTO(transaction.getBooking());
                // Đảm bảo set userFullName và userEmail nếu chưa có
                if (transaction.getBooking().getUser() != null) {
                    if (bookingDTO.getUserFullName() == null || bookingDTO.getUserFullName().isEmpty()) {
                        bookingDTO.setUserFullName(transaction.getBooking().getUser().getFullName());
                    }
                    if (bookingDTO.getUserEmail() == null || bookingDTO.getUserEmail().isEmpty()) {
                        bookingDTO.setUserEmail(transaction.getBooking().getUser().getEmail());
                    }
                }
                response.setBookingDTO(bookingDTO);
            }
            return response;
        });
    }

}
