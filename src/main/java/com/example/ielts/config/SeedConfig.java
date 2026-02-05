package com.example.ielts.config;

import com.example.ielts.entity.User;
import com.example.ielts.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class SeedConfig {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner seedDefaultUser() {
        return args -> {
            String username = "farishta";
            String rawPassword = "1234";

            if (userRepo.existsByUsername(username)) return;

            User u = new User();
            u.setUsername(username);
            u.setPasswordHash(passwordEncoder.encode(rawPassword)); // noming boshqacha bo‘lishi mumkin
            u.setRole("ADMIN"); // yoki "TEACHER" — senga qaysi kerak bo‘lsa
            u.setEnabled(true);

            userRepo.save(u);
            System.out.println("✅ Seeded default user: farishta / 1234");
        };
    }
}
