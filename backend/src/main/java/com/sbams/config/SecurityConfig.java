package com.sbams.config;

import com.sbams.model.*;
import com.sbams.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final SystemUserRepository userRepository;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JwtAuthFilter jwtAuthFilter(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        return new JwtAuthFilter(jwtUtil, userDetailsService);
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            SystemUser user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
            return new User(
                    user.getUsername(),
                    user.getPassword(),
                    List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
            );
        };
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/assets/**", "/qr/**", "/employees/**").authenticated()
                .requestMatchers("/assets/**", "/assignments/**", "/employees/**").hasRole("ADMIN")
                .requestMatchers("/reports/**").hasAnyRole("ADMIN", "AUDITOR")
                .requestMatchers("/audit/**").hasAnyRole("ADMIN", "AUDITOR")
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // Seed default admin user on startup
    @Bean
    public CommandLineRunner seedAdmin(SystemUserRepository repo, PasswordEncoder encoder) {
        return args -> {
            if (!repo.existsByUsername("admin")) {
                repo.save(SystemUser.builder()
                        .username("admin")
                        .password(encoder.encode("admin123"))
                        .role(Role.ADMIN)
                        .build());
            }
            if (!repo.existsByUsername("auditor")) {
                repo.save(SystemUser.builder()
                        .username("auditor")
                        .password(encoder.encode("auditor123"))
                        .role(Role.AUDITOR)
                        .build());
            }
        };
    }

    // Seed test data on startup
    @Bean
    public CommandLineRunner seedData(AssetRepository assetRepo, EmployeeRepository employeeRepo, AssetAssignmentRepository assignmentRepo) {
        return args -> {
            if (assetRepo.count() == 0) {
                assetRepo.save(Asset.builder().name("Dell Laptop").category("Laptop").serialNumber("SN001").status(AssetStatus.REGISTERED).location("Office 101").build());
                assetRepo.save(Asset.builder().name("HP Printer").category("Printer").serialNumber("SN002").status(AssetStatus.ASSIGNED).location("Office 102").build());
                assetRepo.save(Asset.builder().name("iPhone 12").category("Mobile").serialNumber("SN003").status(AssetStatus.IN_REPAIR).location("IT Department").build());
                assetRepo.save(Asset.builder().name("MacBook Pro").category("Laptop").serialNumber("SN004").status(AssetStatus.REGISTERED).location("Office 103").build());
                assetRepo.save(Asset.builder().name("Projector").category("Equipment").serialNumber("SN005").status(AssetStatus.LOST).location("Conference Room").build());
            }
            if (employeeRepo.count() == 0) {
                employeeRepo.save(Employee.builder().fullName("John Doe").email("john.doe@bank.com").department("IT").position("Developer").build());
                employeeRepo.save(Employee.builder().fullName("Jane Smith").email("jane.smith@bank.com").department("HR").position("Manager").build());
                employeeRepo.save(Employee.builder().fullName("Bob Johnson").email("bob.johnson@bank.com").department("Finance").position("Analyst").build());
            }

            if (assignmentRepo.count() == 0) {
                var john = employeeRepo.findByEmail("john.doe@bank.com").orElse(null);
                var jane = employeeRepo.findByEmail("jane.smith@bank.com").orElse(null);
                var laptop = assetRepo.findBySerialNumber("SN001").orElse(null);
                var printer = assetRepo.findBySerialNumber("SN002").orElse(null);

                if (john != null && laptop != null) {
                    assignmentRepo.save(AssetAssignment.builder().asset(laptop).employee(john).active(true).build());
                    laptop.setStatus(AssetStatus.ASSIGNED);
                    assetRepo.save(laptop);
                }
                if (jane != null && printer != null) {
                    assignmentRepo.save(AssetAssignment.builder().asset(printer).employee(jane).active(true).build());
                    printer.setStatus(AssetStatus.ASSIGNED);
                    assetRepo.save(printer);
                }
            }
        };
    }
}
