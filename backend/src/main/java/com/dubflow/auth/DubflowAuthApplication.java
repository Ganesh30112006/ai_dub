package com.dubflow.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DubflowAuthApplication {

    public static void main(String[] args) {
        SpringApplication.run(DubflowAuthApplication.class, args);
    }
}
