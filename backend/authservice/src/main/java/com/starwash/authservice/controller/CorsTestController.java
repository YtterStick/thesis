package com.starwash.authservice.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cors-test")
@CrossOrigin(origins = {"https://starwashph.com", "http://localhost:3000"})
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