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
					.requestMatchers(HttpMethod.POST, "/api/upload").hasAnyAuthority("ROLE_ADMIN", "ROLE_HOST")
					.requestMatchers(HttpMethod.POST, "/api/homestays/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_HOST")
					.requestMatchers(HttpMethod.PUT, "/api/homestays/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_HOST")
					.requestMatchers(HttpMethod.DELETE, "/api/homestays/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_HOST")
					.requestMatchers(HttpMethod.POST, "/api/bookings/**").authenticated()
					.requestMatchers(HttpMethod.GET, "/api/bookings/my").authenticated()
					.requestMatchers(HttpMethod.GET, "/api/bookings").hasAuthority("ROLE_ADMIN")
					.requestMatchers(HttpMethod.PUT, "/api/bookings/**").hasAuthority("ROLE_ADMIN")
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
