package com.sbams.service;

import com.sbams.audit.AuditService;
import com.sbams.dto.*;
import com.sbams.model.*;
import com.sbams.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;
    private final AssetAssignmentRepository assignmentRepository;
    private final AssetStatusHistoryRepository statusHistoryRepository;
    private final QrCodeService qrCodeService;
    private final AuditService auditService;

    @Transactional
    public AssetResponse createAsset(AssetRequest request) {
        if (request.getSerialNumber() != null && assetRepository.existsBySerialNumber(request.getSerialNumber())) {
            throw new IllegalArgumentException("Serial number already exists: " + request.getSerialNumber());
        }

        Asset asset = Asset.builder()
                .name(request.getName())
                .category(request.getCategory())
                .serialNumber(request.getSerialNumber())
                .location(request.getLocation())
                .description(request.getDescription())
                .status(AssetStatus.REGISTERED)
                .build();

        asset = assetRepository.save(asset);
        asset.setQrCodeBase64(qrCodeService.generateForAsset(asset, null));
        asset = assetRepository.save(asset);

        auditService.log("ASSET_CREATED", "Asset", asset.getId(), "Asset registered: " + asset.getName());
        return toResponse(asset);
    }

    public List<AssetResponse> getAllAssets(String status, String category, String search) {
        String username = getCurrentUsername();
        String role = getCurrentUserRole();

        List<Asset> assets;
        if ("USER".equals(role)) {
            assets = assetRepository.findByActiveEmployeeEmail(username);
        } else if (search != null && !search.isBlank()) {
            assets = assetRepository.findByNameContainingIgnoreCase(search);
        } else if (status != null) {
            assets = assetRepository.findByStatus(AssetStatus.valueOf(status.toUpperCase()));
        } else if (category != null) {
            assets = assetRepository.findByCategory(category);
        } else {
            assets = assetRepository.findAll();
        }
        return assets.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public AssetResponse getAssetById(Long id) {
        Asset asset = findAssetById(id);

        if ("USER".equals(getCurrentUserRole())) {
            if (!isOwner(id, getCurrentUsername())) {
                throw new SecurityException("Access denied to asset: " + id);
            }
        }

        return toResponseWithHistory(asset);
    }

    @Transactional
    public AssetResponse updateAssetStatus(Long id, StatusUpdateRequest request) {
        Asset asset = findAssetById(id);

        String role = getCurrentUserRole();
        String username = getCurrentUsername();
        if (!"ADMIN".equals(role)) {
            if (!isOwner(id, username)) {
                throw new SecurityException("Access denied: You don't own this asset.");
            }
            if (!List.of(AssetStatus.REGISTERED, AssetStatus.IN_REPAIR, AssetStatus.LOST)
                    .contains(request.getStatus())) {
                throw new IllegalArgumentException("Unauthorized status change to: " + request.getStatus());
            }
        }

        if (asset.getStatus() == AssetStatus.LOST) {
            throw new IllegalStateException("Lost assets cannot have their status changed");
        }

        if (asset.getStatus() == AssetStatus.ASSIGNED &&
                !List.of(AssetStatus.REGISTERED, AssetStatus.WRITTEN_OFF, AssetStatus.LOST)
                        .contains(request.getStatus())) {
            throw new IllegalStateException(
                    "Assigned assets can only be changed to REGISTERED, WRITTEN_OFF, or LOST status");
        }

        AssetStatus previousStatus = asset.getStatus();

        AssetStatusHistory history = AssetStatusHistory.builder()
                .asset(asset)
                .previousStatus(previousStatus)
                .newStatus(request.getStatus())
                .changedBy(getCurrentUsername())
                .reason(request.getReason())
                .build();
        statusHistoryRepository.save(history);

        asset.setStatus(request.getStatus());

        if (previousStatus == AssetStatus.ASSIGNED &&
                (request.getStatus() == AssetStatus.REGISTERED ||
                 request.getStatus() == AssetStatus.WRITTEN_OFF ||
                 request.getStatus() == AssetStatus.LOST)) {
            Optional<AssetAssignment> activeAssignment = assignmentRepository.findByAssetIdAndActiveTrue(id);
            if (activeAssignment.isPresent()) {
                AssetAssignment assignment = activeAssignment.get();
                assignment.setActive(false);
                assignment.setReturnedAt(LocalDateTime.now());
                assignmentRepository.save(assignment);
                auditService.log("ASSET_RETURNED", "AssetAssignment", assignment.getId(),
                        "Asset returned via status change to " + request.getStatus());
            }
        }

        asset.setQrCodeBase64(qrCodeService.generateForAsset(asset, null));
        assetRepository.save(asset);

        auditService.log("STATUS_CHANGED", "Asset", id, previousStatus + " -> " + request.getStatus());
        return toResponse(asset);
    }

    @Transactional
    public AssetResponse uploadImage(Long id, MultipartFile file) {
        Asset asset = findAssetById(id);

        String role = getCurrentUserRole();
        if (!"ADMIN".equals(role)) {
            if (!isOwner(id, getCurrentUsername())) {
                throw new SecurityException("Access denied: You don't own this asset.");
            }
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed.");
        }

        try {
            byte[] bytes = file.getBytes();
            String base64 = Base64.getEncoder().encodeToString(bytes);
            asset.setImageBase64("data:" + contentType + ";base64," + base64);
            assetRepository.save(asset);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read uploaded file.", e);
        }

        auditService.log("IMAGE_UPLOADED", "Asset", id, "Image uploaded for: " + asset.getName());
        return toResponse(asset);
    }

    @Transactional
    public void deleteAsset(Long id) {
        Asset asset = findAssetById(id);
        assetRepository.delete(asset);
        auditService.log("ASSET_DELETED", "Asset", id, "Asset deleted: " + asset.getName());
    }

    @Transactional
    public void regenerateQr(Asset asset, AssetAssignment activeAssignment) {
        asset.setQrCodeBase64(qrCodeService.generateForAsset(asset, activeAssignment));
        assetRepository.save(asset);
    }

    public AssetResponse lookupByQr(Long assetId) {
        return getAssetById(assetId);
    }

    public boolean isOwner(Long assetId, String email) {
        return assignmentRepository.existsByAssetIdAndEmployeeEmailAndActiveTrue(assetId, email);
    }

    private Asset findAssetById(Long id) {
        return assetRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Asset not found: " + id));
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

    private AssetResponse toResponse(Asset asset) {
        AssignmentResponse activeAssignment = assignmentRepository
                .findByAssetIdAndActiveTrue(asset.getId())
                .map(this::toAssignmentResponse)
                .orElse(null);

        return AssetResponse.builder()
                .id(asset.getId())
                .name(asset.getName())
                .category(asset.getCategory())
                .serialNumber(asset.getSerialNumber())
                .status(asset.getStatus())
                .qrCodeBase64(asset.getQrCodeBase64())
                .imageBase64(asset.getImageBase64())
                .location(asset.getLocation())
                .description(asset.getDescription())
                .createdAt(asset.getCreatedAt())
                .updatedAt(asset.getUpdatedAt())
                .activeAssignment(activeAssignment)
                .build();
    }

    private AssetResponse toResponseWithHistory(Asset asset) {
        List<StatusHistoryResponse> history = statusHistoryRepository
                .findByAssetIdOrderByChangedAtDesc(asset.getId())
                .stream()
                .map(h -> StatusHistoryResponse.builder()
                        .id(h.getId())
                        .previousStatus(h.getPreviousStatus())
                        .newStatus(h.getNewStatus())
                        .changedBy(h.getChangedBy())
                        .reason(h.getReason())
                        .changedAt(h.getChangedAt())
                        .build())
                .collect(Collectors.toList());

        AssetResponse response = toResponse(asset);
        response.setStatusHistory(history);
        return response;
    }

    private AssignmentResponse toAssignmentResponse(AssetAssignment a) {
        return AssignmentResponse.builder()
                .id(a.getId())
                .assetId(a.getAsset().getId())
                .assetName(a.getAsset().getName())
                .employeeId(a.getEmployee().getId())
                .employeeName(a.getEmployee().getFullName())
                .employeeEmail(a.getEmployee().getEmail())
                .employeeDepartment(a.getEmployee().getDepartment())
                .assignedAt(a.getAssignedAt())
                .returnedAt(a.getReturnedAt())
                .active(a.isActive())
                .notes(a.getNotes())
                .build();
    }
}