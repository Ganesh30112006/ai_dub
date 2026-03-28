package com.dubflow.auth.repository;

import com.dubflow.auth.model.UserRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserRecord, String> {

    Optional<UserRecord> findByEmail(String email);

    boolean existsByEmail(String email);
}
