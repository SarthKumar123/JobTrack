package com.jobtrack.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail invalidInput(MethodArgumentNotValidException exception) {
        var error = exception.getBindingResult().getFieldErrors().get(0);
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                error.getField() + ": " + error.getDefaultMessage());
    }
}
