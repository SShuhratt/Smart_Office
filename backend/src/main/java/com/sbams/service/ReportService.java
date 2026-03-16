package com.sbams.service;

import com.sbams.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final AssetRepository assetRepository;

    public Map<String, Object> getSummary() {
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (Object[] row : assetRepository.countByStatus()) {
            byStatus.put(row[0].toString(), (Long) row[1]);
        }

        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (Object[] row : assetRepository.countByCategory()) {
            byCategory.put(row[0].toString(), (Long) row[1]);
        }

        long total = assetRepository.count();

        return Map.of(
                "total", total,
                "byStatus", byStatus,
                "byCategory", byCategory
        );
    }
}
