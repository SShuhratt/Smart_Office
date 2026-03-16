package com.sbams.repository;

import com.sbams.model.AssetAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetAssignmentRepository extends JpaRepository<AssetAssignment, Long> {

    Optional<AssetAssignment> findByAssetIdAndActiveTrue(Long assetId);

    List<AssetAssignment> findByEmployeeId(Long employeeId);

    List<AssetAssignment> findByAssetId(Long assetId);

    List<AssetAssignment> findByActiveTrue();

    boolean existsByAssetIdAndActiveTrue(Long assetId);

    boolean existsByEmployeeIdAndActiveTrue(Long employeeId);
}
