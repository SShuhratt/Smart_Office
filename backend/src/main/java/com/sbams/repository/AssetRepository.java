package com.sbams.repository;

import com.sbams.model.Asset;
import com.sbams.model.AssetStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {

    List<Asset> findByStatus(AssetStatus status);

    List<Asset> findByCategory(String category);

    List<Asset> findByNameContainingIgnoreCase(String name);

    @Query("SELECT a.status, COUNT(a) FROM Asset a GROUP BY a.status")
    List<Object[]> countByStatus();

    @Query("SELECT a.category, COUNT(a) FROM Asset a GROUP BY a.category")
    List<Object[]> countByCategory();

    boolean existsBySerialNumber(String serialNumber);

    java.util.Optional<Asset> findBySerialNumber(String serialNumber);
}
