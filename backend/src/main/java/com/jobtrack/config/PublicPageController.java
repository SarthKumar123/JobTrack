package com.jobtrack.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PublicPageController {
    @GetMapping({"/privacy", "/terms"})
    public String publicPage() {
        return "forward:/index.html";
    }
}
