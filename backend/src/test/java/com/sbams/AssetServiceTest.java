package com.sbams;

import com.sbams.model.AssetStatus;
import com.sbams.model.Asset;
import com.sbams.repository.AssetRepository;
import com.sbams.service.AssetService;
import com.sbams.service.QrCodeService;
import com.sbams.audit.AuditService;
import com.sbams.dto.AssetRequest;
import com.sbams.dto.AssetResponse;
import com.sbams.repository.AssetAssignmentRepository;
import com.sbams.repository.AssetStatusHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssetServiceTest {

    @Mock AssetRepository assetRepository;
    @Mock AssetAssignmentRepository assignmentRepository;
    @Mock AssetStatusHistoryRepository statusHistoryRepository;
    @Mock QrCodeService qrCodeService;
    @Mock AuditService auditService;

    @InjectMocks AssetService assetService;

    @BeforeEach
    void setup() {
        when(qrCodeService.generateQrCodeBase64(anyString())).thenReturn("data:image/png;base64,TEST");
    }

    @Test
    void createAsset_shouldReturnRegisteredStatus() {
        AssetRequest request = new AssetRequest();
        request.setName("Laptop");
        request.setCategory("IT");

        Asset saved = Asset.builder().id(1L).name("Laptop").category("IT")
                .status(AssetStatus.REGISTERED).build();

        when(assetRepository.save(any())).thenReturn(saved);
        when(assignmentRepository.findByAssetIdAndActiveTrue(any())).thenReturn(Optional.empty());

        AssetResponse response = assetService.createAsset(request);

        assertThat(response.getStatus()).isEqualTo(AssetStatus.REGISTERED);
        assertThat(response.getName()).isEqualTo("Laptop");
    }

    @Test
    void createAsset_duplicateSerial_shouldThrow() {
        AssetRequest request = new AssetRequest();
        request.setName("Monitor");
        request.setCategory("IT");
        request.setSerialNumber("SN-001");

        when(assetRepository.existsBySerialNumber("SN-001")).thenReturn(true);

        assertThatThrownBy(() -> assetService.createAsset(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("SN-001");
    }
}
