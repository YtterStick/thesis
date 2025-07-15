package com.starwash.authservice.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/secret")
    public String secret() {
        return "Access granted to protected resource 🌌🔐";
    }
}