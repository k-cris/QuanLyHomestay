package com.homestay.homestay_backend.service;

import com.homestay.homestay_backend.dto.RefundResponseDto;
import com.homestay.homestay_backend.entity.Booking;
import com.homestay.homestay_backend.entity.Payment;
import com.homestay.homestay_backend.entity.Refund;
import com.homestay.homestay_backend.enums.PaymentStatusEnum;
import com.homestay.homestay_backend.enums.RoleEnum;
import com.homestay.homestay_backend.repository.PaymentRepository;
import com.homestay.homestay_backend.repository.RefundRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RefundService {

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;

    /**
     * ============================================================
     * HOST XEM DANH SÁCH HOÀN TIỀN
     * ============================================================
     */
    @Transactional(readOnly = true)
    public List<RefundResponseDto> getHostRefunds(Long hostId) {

        return refundRepository
                .findHostRefunds(hostId)
                .stream()
                .map(RefundResponseDto::from)
                .collect(Collectors.toList());
    }

    /**
     * ADMIN xem tất cả Refund.
     */
    @Transactional(readOnly = true)
    public List<RefundResponseDto> getAllRefunds() {

        return refundRepository
                .findAll()
                .stream()
                .sorted(
                        (a, b) -> {
                            if (a.getRequestedAt() == null
                                    && b.getRequestedAt() == null) {
                                return 0;
                            }

                            if (a.getRequestedAt() == null) {
                                return 1;
                            }

                            if (b.getRequestedAt() == null) {
                                return -1;
                            }

                            return b.getRequestedAt()
                                    .compareTo(a.getRequestedAt());
                        }
                )
                .map(RefundResponseDto::from)
                .collect(Collectors.toList());
    }

    /**
     * USER xem các Refund của mình.
     */
    @Transactional(readOnly = true)
    public List<RefundResponseDto> getMyRefunds(
            Long guestId) {

        return refundRepository
                .findMyRefunds(guestId)
                .stream()
                .map(RefundResponseDto::from)
                .collect(Collectors.toList());
    }

    /**
     * Xem chi tiết Refund.
     */
    @Transactional(readOnly = true)
    public RefundResponseDto getById(
            Long id,
            Long userId,
            RoleEnum userRole) {

        Refund refund = refundRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy thông tin hoàn tiền"));

        boolean isOwner =
                refund.getUser() != null
                        && refund.getUser()
                                .getId()
                                .equals(userId);

        boolean isHost =
                refund.getBooking() != null
                        && refund.getBooking().getHomestay() != null
                        && refund.getBooking()
                                .getHomestay()
                                .getHost() != null
                        && refund.getBooking()
                                .getHomestay()
                                .getHost()
                                .getId()
                                .equals(userId);

        boolean isAdmin =
                userRole == RoleEnum.ADMIN;

        if (!isOwner && !isHost && !isAdmin) {

            throw new RuntimeException(
                    "Bạn không có quyền xem thông tin này");
        }

        return RefundResponseDto.from(refund);
    }

    /**
     * ============================================================
     * HOST XÁC NHẬN ĐÃ CHUYỂN KHOẢN
     * ============================================================
     *
     * PENDING → SENT
     *
     * Lưu ý:
     *
     * Payment vẫn PAID.
     *
     * Vì User chưa xác nhận đã nhận tiền.
     */
    @Transactional
    public RefundResponseDto confirmSent(
            Long id,
            Long hostId) {

        Refund refund = refundRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy thông tin hoàn tiền"));

        /*
         * Kiểm tra Refund thuộc Homestay của Host
         */
        boolean isHost =
                refund.getBooking() != null
                        && refund.getBooking().getHomestay() != null
                        && refund.getBooking()
                                .getHomestay()
                                .getHost() != null
                        && refund.getBooking()
                                .getHomestay()
                                .getHost()
                                .getId()
                                .equals(hostId);

        if (!isHost) {

            throw new RuntimeException(
                    "Chỉ chủ nhà mới có thể xác nhận đã chuyển tiền");
        }

        /*
         * Chỉ PENDING mới được chuyển sang SENT.
         */
        if (!"PENDING".equals(refund.getStatus())) {

            throw new RuntimeException(
                    "Yêu cầu hoàn tiền không ở trạng thái chờ chuyển khoản");
        }

        /*
         * Host đã chuyển tiền.
         */
        refund.setStatus("SENT");
        refund.setSentAt(LocalDateTime.now());

        refundRepository.save(refund);

        /*
         * QUAN TRỌNG:
         *
         * Không chuyển Payment sang REFUNDED ở đây.
         *
         * Vì User vẫn chưa xác nhận nhận tiền.
         */

        return RefundResponseDto.from(refund);
    }

    /**
     * ============================================================
     * USER XÁC NHẬN ĐÃ NHẬN TIỀN
     * ============================================================
     *
     * SENT → CONFIRMED
     *
     * Sau đó:
     *
     * Payment PAID → REFUNDED
     */
    @Transactional
    public RefundResponseDto confirmReceived(
            Long id,
            Long guestId) {

        Refund refund = refundRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy thông tin hoàn tiền"));

        /*
         * Kiểm tra Refund thuộc User hiện tại.
         */
        boolean isOwner =
                refund.getUser() != null
                        && refund.getUser()
                                .getId()
                                .equals(guestId);

        if (!isOwner) {

            throw new RuntimeException(
                    "Chỉ người nhận mới có thể xác nhận đã nhận tiền");
        }

        /*
         * Chỉ SENT mới được xác nhận.
         */
        if (!"SENT".equals(refund.getStatus())) {

            throw new RuntimeException(
                    "Yêu cầu hoàn tiền chưa được chuyển hoặc đã hoàn tất");
        }

        /*
         * ========================================================
         * BƯỚC 1:
         *
         * Refund SENT → CONFIRMED
         * ========================================================
         */

        refund.setStatus("CONFIRMED");
        refund.setConfirmedAt(LocalDateTime.now());

        refundRepository.save(refund);

        /*
         * ========================================================
         * BƯỚC 2:
         *
         * Khi User xác nhận đã nhận tiền,
         * Payment mới chính thức trở thành REFUNDED.
         * ========================================================
         */

        Booking booking = refund.getBooking();

        if (booking == null || booking.getId() == null) {

            throw new RuntimeException(
                    "Refund không liên kết với booking");
        }

        Payment payment = booking.getPayment();

        /*
         * Nếu quan hệ Booking → Payment chưa được load,
         * tìm trực tiếp trong database.
         */
        if (payment == null) {

            payment = paymentRepository
                    .findByBookingId(booking.getId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Không tìm thấy thanh toán của booking"));
        }

        /*
         * Chỉ Payment PAID mới được chuyển REFUNDED.
         */
        if (payment.getStatus() != PaymentStatusEnum.PAID) {

            throw new RuntimeException(
                    "Thanh toán không ở trạng thái PAID để hoàn tiền");
        }

        payment.setStatus(
                PaymentStatusEnum.REFUNDED
        );

        payment.setRefundedAt(
                LocalDateTime.now()
        );

        /*
         * Đồng bộ thông tin hoàn tiền.
         */
        payment.setRefundBankAccount(
                refund.getReceiverBankAccount()
        );

        payment.setRefundPercent(
                calculateRefundPercent(refund)
        );

        payment.setRefundAmount(
                refund.getAmount() != null
                        ? refund.getAmount().doubleValue()
                        : 0.0
        );

        payment.setRefundNote(
                "Đã hoàn tiền thành công. " +
                "Khách đã xác nhận nhận tiền."
        );

        paymentRepository.save(payment);

        return RefundResponseDto.from(refund);
    }

    /**
     * Tính % hoàn tiền từ Refund.
     *
     * Ưu tiên lấy từ Payment nếu đã có.
     * Nếu không thì tính dựa trên amount.
     */
    private Integer calculateRefundPercent(
            Refund refund) {

        if (refund == null
                || refund.getBooking() == null) {

            return null;
        }

        Payment payment = refund.getBooking().getPayment();

        if (payment != null
                && payment.getRefundPercent() != null) {

            return payment.getRefundPercent();
        }

        if (payment == null
                || payment.getAmount() == null
                || payment.getAmount() <= 0
                || refund.getAmount() == null) {

            return null;
        }

        double original = payment.getAmount();
        double refundAmount =
                refund.getAmount().doubleValue();

        return (int) Math.round(
                refundAmount * 100.0 / original
        );
    }
}