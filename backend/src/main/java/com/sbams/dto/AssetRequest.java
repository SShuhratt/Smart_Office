package com.sbams.dto;

import com.sbams.model.AssetStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssetRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String category;

    private String serialNumber;
    private String location;
    private String description;
}
