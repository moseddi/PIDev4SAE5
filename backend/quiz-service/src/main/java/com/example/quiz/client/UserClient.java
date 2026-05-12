package com.example.quiz.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-management-service")
public interface UserClient {

    @GetMapping("/api/users/{id}")
    Object getUserById(@PathVariable("id") String id);
}
