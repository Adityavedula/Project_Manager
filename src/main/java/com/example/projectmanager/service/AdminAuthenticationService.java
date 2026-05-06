package com.example.projectmanager.service;

import com.example.projectmanager.dto.AdminRegisterRequest;
import com.example.projectmanager.dto.AuthenticationRequest;
import com.example.projectmanager.dto.AuthenticationResponse;
import com.example.projectmanager.exception.UnauthorizedException;
import com.example.projectmanager.model.User;
import com.example.projectmanager.repository.UserRepository;
import com.example.projectmanager.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminAuthenticationService {
    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Value("${admin.secret-key:default-admin-secret}")
    private String adminSecretKey;

    public AuthenticationResponse register(AdminRegisterRequest request) {
        if (!adminSecretKey.equals(request.getAdminSecretKey())) {
            throw new UnauthorizedException("Invalid admin secret key");
        }

        if (repository.findByEmail(request.getEmail()).isPresent()) {
            throw new UnauthorizedException("Email already registered");
        }

        var user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.ADMIN)
                .build();
        repository.save(user);
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .id(user.getId())
                .token(jwtToken)
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        if (user.getRole() != User.Role.ADMIN) {
            throw new UnauthorizedException("Access denied: Admin only");
        }

        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .id(user.getId())
                .token(jwtToken)
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
