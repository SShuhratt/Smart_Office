package com.sbams.controller;

import com.sbams.dto.AssetResponse;
import com.sbams.service.AssetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/qr")
@RequiredArgsConstructor
public class QrController {

    private final AssetService assetService;

    @GetMapping("/{assetId}")
    public ResponseEntity<AssetResponse> lookup(@PathVariable Long assetId) {
        return ResponseEntity.ok(assetService.lookupByQr(assetId));
    }
}
