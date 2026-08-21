package com.homestay.homestay_backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * UC-06 / BR-9: cấu hình cron hủy đơn PENDING quá hạn.
 */
@Component
@ConfigurationProperties(prefix = "homestay.scheduler")
@Getter
@Setter
public class HomestaySchedulerProperties {

    /** Bật/tắt job SYSTEM auto-cancel. */
    private boolean enabled = true;

    /** Cron expression (mặc định: mỗi 5 phút). */
    private String cron = "0 */5 * * * *";

    /** Số giờ chờ thanh toán sau khi tạo đơn PENDING (chưa PAID). */
    private int paymentDeadlineHours = 48;

    /** Số giờ chờ Host duyệt sau khi khách đã thanh toán (PAID + PENDING). */
    private int hostApprovalDeadlineHours = 48;
}
