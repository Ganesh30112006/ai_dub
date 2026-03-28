package com.dubflow.auth.repository;

import com.dubflow.auth.model.UploadedAsset;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UploadedAssetRepository extends JpaRepository<UploadedAsset, String> {
}
