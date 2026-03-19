package com.sbams.service;

import com.sbams.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final AssetRepository assetRepository;

    public Map<String, Object> getSummary() {
        String username = getCurrentUsername();
        String role = getCurrentUserRole();

        Map<String, Long> byStatus = new LinkedHashMap<>();
        Map<String, Long> byCategory = new LinkedHashMap<>();
        long total;

        if ("USER".equals(role)) {
            for (Object[] row : assetRepository.countByStatusForEmployee(username)) {
                byStatus.put(row[0].toString(), (Long) row[1]);
            }
            for (Object[] row : assetRepository.countByCategoryForEmployee(username)) {
                byCategory.put(row[0].toString(), (Long) row[1]);
            }
            total = assetRepository.countByActiveEmployeeEmail(username);
        } else {
            for (Object[] row : assetRepository.countByStatus()) {
                byStatus.put(row[0].toString(), (Long) row[1]);
            }
            for (Object[] row : assetRepository.countByCategory()) {
                byCategory.put(row[0].toString(), (Long) row[1]);
            }
            total = assetRepository.count();
        }

        return Map.of(
                "total", total,
                "byStatus", byStatus,
                "byCategory", byCategory
        );
    }

    private String getCurrentUsername() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "system";
        }
    }

    private String getCurrentUserRole() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                    .stream().findFirst().get().getAuthority().replace("ROLE_", "");
        } catch (Exception e) {
            return "UNKNOWN";
        }
    }
}
