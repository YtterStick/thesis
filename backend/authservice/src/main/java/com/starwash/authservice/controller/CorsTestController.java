package com.starwash.authservice.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cors-test")
public class CorsTestController {

    @GetMapping
    public String testCors() {
        return "CORS is working!";
    }

    @PostMapping
    public String testCorsPost(@RequestBody String test) {
        return "POST CORS is working! Received: " + test;
    }
}
