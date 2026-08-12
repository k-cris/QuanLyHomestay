const fs = require('fs');
const path = require('path');

const sourceDir = 'd:\\Bao_cao_nien_luan(new)\\src\\main\\java\\com\\homestay';
const destDir = 'd:\\Bao_cao_nien_luan(new)\\homestay-backend\\src\\main\\java\\com\\homestay\\homestay_backend';

function copyFolderSync(from, to) {
    if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
    if (!fs.existsSync(from)) return;
    fs.readdirSync(from).forEach(element => {
        if (fs.lstatSync(path.join(from, element)).isFile()) {
            let content = fs.readFileSync(path.join(from, element), 'utf8');
            content = content.replace(/package com\.homestay/g, 'package com.homestay.homestay_backend');
            content = content.replace(/import com\.homestay\./g, 'import com.homestay.homestay_backend.');
            fs.writeFileSync(path.join(to, element), content);
        } else {
            copyFolderSync(path.join(from, element), path.join(to, element));
        }
    });
}

// Copy entity, enums, repository, service
copyFolderSync(path.join(sourceDir, 'entity'), path.join(destDir, 'entity'));
copyFolderSync(path.join(sourceDir, 'enums'), path.join(destDir, 'enums'));
copyFolderSync(path.join(sourceDir, 'repository'), path.join(destDir, 'repository'));
copyFolderSync(path.join(sourceDir, 'service'), path.join(destDir, 'service'));

// Now write the updated Security and Auth classes
const jwtUtilCode = `package com.homestay.homestay_backend.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
\tprivate final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
\tprivate final long EXPIRATION = 1000 * 60 * 60 * 24;
\t
\tpublic String generateToken(String email, String role) {
\t\treturn Jwts.builder()
\t\t\t\t.setSubject(email)
\t\t\t\t.claim("role", role)
\t\t\t\t.setIssuedAt(new Date())
\t\t\t\t.setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
\t\t\t\t.signWith(key)
\t\t\t\t.compact();
\t}
\t
\tpublic String extractEmail(String token) {
\t\treturn Jwts.parserBuilder().setSigningKey(key).build()
\t\t\t\t.parseClaimsJws(token).getBody().getSubject();
\t}
\t
\tpublic boolean validateToken(String token) {
\t    try {
\t        Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
\t        return true;
\t    } catch (Exception e) {
\t        return false;
\t    }
\t}
\t
\tpublic String extractRole(String token) {
\t\treturn (String) Jwts.parserBuilder().setSigningKey(key).build()
\t\t\t\t.parseClaimsJws(token).getBody().get("role");
\t}
}
`;

const jwtAuthFilterCode = `package com.homestay.homestay_backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
\t@Autowired
\tprivate JwtUtil jwtUtil;

\t@Override
\tprotected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
\t\t\tthrows ServletException, IOException {
\t\t
\t\tString authHeader = request.getHeader("Authorization");
\t\tString token = null;
\t\tString email = null;
\t\t
\t\tif (authHeader != null && authHeader.startsWith("Bearer ")) {
\t\t\ttoken = authHeader.substring(7);
\t\t\ttry {
\t\t\t\temail = jwtUtil.extractEmail(token);
\t\t\t} catch (Exception e) {
\t\t\t\tSystem.out.println("Invalid Token");
\t\t\t}
\t\t}
\t\t
\t\tif (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
\t\t\tif (jwtUtil.validateToken(token)) {
\t\t\t\tString role = jwtUtil.extractRole(token);
\t\t\t\tUsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
\t\t\t\t\t\temail, null, Collections.singletonList(new SimpleGrantedAuthority(role)));
\t\t\t\tSecurityContextHolder.getContext().setAuthentication(authToken);
\t\t\t}
\t\t}
\t\t
\t\tfilterChain.doFilter(request, response);
\t}
}
`;

const securityConfigCode = `package com.homestay.homestay_backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration 
public class SecurityConfig {
\t@Autowired
\tprivate JwtAuthFilter jwtAuthFilter;
\t
\t@Bean
\tpublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
\t\thttp
\t\t\t.csrf(AbstractHttpConfigurer::disable)
\t\t\t.cors(cors -> cors.configurationSource(corsConfigurationSource()))
\t\t\t.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
\t\t\t.authorizeHttpRequests(auth -> auth
\t\t\t\t\t.requestMatchers("/api/auth/**").permitAll()
\t\t\t\t\t.requestMatchers("/uploads/**").permitAll()
\t\t\t\t\t.requestMatchers("/error").permitAll()
\t\t\t\t\t.requestMatchers(HttpMethod.GET, "/api/homestays/**").permitAll()
\t\t\t\t\t.requestMatchers(HttpMethod.POST, "/api/upload").hasAuthority("ROLE_ADMIN")
\t\t\t\t\t.requestMatchers(HttpMethod.POST, "/api/homestays/**").hasAuthority("ROLE_ADMIN")
\t\t\t\t\t.requestMatchers(HttpMethod.PUT, "/api/homestays/**").hasAuthority("ROLE_ADMIN")
\t\t\t\t\t.requestMatchers(HttpMethod.DELETE, "/api/homestays/**").hasAuthority("ROLE_ADMIN")
\t\t\t\t\t.requestMatchers(HttpMethod.POST, "/api/bookings/**").authenticated()
\t\t\t\t\t.requestMatchers(HttpMethod.GET, "/api/bookings/my").authenticated()
\t\t\t\t\t.requestMatchers(HttpMethod.GET, "/api/bookings").hasAuthority("ROLE_ADMIN")
\t\t\t\t\t.requestMatchers(HttpMethod.PUT, "/api/bookings/**").hasAuthority("ROLE_ADMIN")
\t\t\t\t\t.requestMatchers("/api/dashboard/**").hasAuthority("ROLE_ADMIN")
\t\t\t\t\t.anyRequest().authenticated()
\t\t\t)
\t\t\t.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
\t\treturn http.build();
\t}
\t
\t@Bean
\tpublic CorsConfigurationSource corsConfigurationSource() {
\t\tCorsConfiguration configuration = new CorsConfiguration();
\t\tconfiguration.setAllowedOriginPatterns(List.of("http://localhost:5173", "http://127.0.0.1:5173"));
\t\tconfiguration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
\t\tconfiguration.setAllowedHeaders(List.of("*"));
\t\tconfiguration.setAllowCredentials(true);
\t\t
\t\tUrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
\t\tsource.registerCorsConfiguration("/**", configuration);
\t\treturn source;
\t}
}
`;

const authControllerCode = `package com.homestay.homestay_backend.controller;

import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.enums.RoleEnum;
import com.homestay.homestay_backend.repository.UserRepository;
import com.homestay.homestay_backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().body("Email đã tồn tại");
        }
        user.setRole(RoleEnum.ROLE_USER);
        userRepository.save(user);
        return ResponseEntity.ok("Đăng ký thành công");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");
        
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || !user.getPassword().equals(password)) {
            return ResponseEntity.status(401).body("Sai email hoặc mật khẩu");
        }
        
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", user);
        
        return ResponseEntity.ok(response);
    }
}
`;

fs.writeFileSync(path.join(destDir, 'security', 'JwtUtil.java'), jwtUtilCode);
fs.writeFileSync(path.join(destDir, 'security', 'JwtAuthFilter.java'), jwtAuthFilterCode);
fs.writeFileSync(path.join(destDir, 'security', 'SecurityConfig.java'), securityConfigCode);
fs.writeFileSync(path.join(destDir, 'controller', 'AuthController.java'), authControllerCode);

console.log("Migration completed");
