package com.homestay.homestay_backend.security;

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

import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

@Configuration 
@EnableWebSecurity
public class SecurityConfig {
	@Autowired
	private JwtAuthFilter jwtAuthFilter;
	
	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
			.csrf(AbstractHttpConfigurer::disable)
			.cors(cors -> cors.configurationSource(corsConfigurationSource()))
			.formLogin(AbstractHttpConfigurer::disable)
		    .httpBasic(AbstractHttpConfigurer::disable)
			.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
			.authorizeHttpRequests(auth -> auth
					.requestMatchers("/api/auth/**").permitAll()
					.requestMatchers("/uploads/**").permitAll()
					.requestMatchers("/error").permitAll()
					.requestMatchers(HttpMethod.GET, "/api/homestays/**").permitAll()
					.requestMatchers(HttpMethod.GET, "/api/amenities").permitAll()
					// USER cần upload ảnh giấy tờ khi gửi HostRequest (UC-04)
					.requestMatchers(HttpMethod.POST, "/api/upload").hasAnyAuthority("ROLE_ADMIN", "ROLE_HOST", "ROLE_USER")
					.requestMatchers(HttpMethod.POST, "/api/homestays/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_HOST")
					.requestMatchers(HttpMethod.PUT, "/api/homestays/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_HOST")
					.requestMatchers(HttpMethod.DELETE, "/api/homestays/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_HOST")
					// UC-04: Đăng ký & duyệt làm Chủ Homestay
					.requestMatchers(HttpMethod.POST, "/api/host-requests").hasAuthority("ROLE_USER")
					.requestMatchers(HttpMethod.GET, "/api/host-requests/me").authenticated()
					.requestMatchers(HttpMethod.GET, "/api/host-requests").hasAuthority("ROLE_ADMIN")
					.requestMatchers(HttpMethod.GET, "/api/host-requests/*").hasAuthority("ROLE_ADMIN")
					.requestMatchers(HttpMethod.PUT, "/api/host-requests/*/approve").hasAuthority("ROLE_ADMIN")
					.requestMatchers(HttpMethod.PUT, "/api/host-requests/*/reject").hasAuthority("ROLE_ADMIN")
					.requestMatchers(HttpMethod.POST, "/api/bookings").authenticated()
					.requestMatchers(HttpMethod.GET, "/api/bookings/me").authenticated()
					.requestMatchers(HttpMethod.GET, "/api/bookings/host").hasAnyAuthority("ROLE_HOST", "ROLE_ADMIN")
					.requestMatchers(HttpMethod.PUT, "/api/bookings/*/confirm").hasAnyAuthority("ROLE_HOST", "ROLE_ADMIN")
					.requestMatchers(HttpMethod.PUT, "/api/bookings/*/reject").hasAnyAuthority("ROLE_HOST", "ROLE_ADMIN")
					.requestMatchers(HttpMethod.PUT, "/api/bookings/*/cancel").authenticated()
					.requestMatchers(HttpMethod.PUT, "/api/users/me").authenticated()
					.requestMatchers(HttpMethod.POST, "/api/payments").authenticated()
					.requestMatchers("/api/dashboard/**").hasAuthority("ROLE_ADMIN")
					.anyRequest().authenticated()
			)
			.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
		return http.build();
	}
	
	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOriginPatterns(List.of("http://localhost:5173", "http://127.0.0.1:5173"));
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("*"));
		configuration.setAllowCredentials(true);
		
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
