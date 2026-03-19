package com.sbams.controller;

import com.sbams.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR','USER')")
    public ResponseEntity<Map<String, Object>> summary() {
        return ResponseEntity.ok(reportService.getSummary());
    }
}
