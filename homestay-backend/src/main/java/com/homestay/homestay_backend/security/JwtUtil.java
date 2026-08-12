package com.homestay.homestay_backend.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
	private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
	private final long EXPIRATION = 1000 * 60 * 60 * 24;
	
	public String generateToken(String email, String role) {
		return Jwts.builder()
				.setSubject(email)
				.claim("role", role)
				.setIssuedAt(new Date())
				.setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
				.signWith(key)
				.compact();
	}
	
	public String extractEmail(String token) {
		return Jwts.parserBuilder().setSigningKey(key).build()
				.parseClaimsJws(token).getBody().getSubject();
	}
	
	public boolean validateToken(String token) {
	    try {
	        Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
	        return true;
	    } catch (Exception e) {
	        return false;
	    }
	}
	
	public String extractRole(String token) {
		return (String) Jwts.parserBuilder().setSigningKey(key).build()
				.parseClaimsJws(token).getBody().get("role");
	}
}
