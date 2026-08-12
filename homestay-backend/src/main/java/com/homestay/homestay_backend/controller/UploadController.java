package com.homestay.homestay_backend.controller;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.Files;
import java.util.UUID;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*")
public class UploadController {
	private final String uploadDir = "./uploads";
	
	@PostMapping
	public String uploadFile (@RequestParam("file") MultipartFile file) {
		try {
			File dir = new File(uploadDir);
			if (!dir.exists()) {
				dir.mkdirs();
			}
			String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
			Path filePath = Paths.get(uploadDir, fileName);
			Files.write(filePath, file.getBytes());
			return "/uploads/" + fileName;
		} catch (IOException e) {
			// TODO: handle exception
			throw new RuntimeException("Upload thất bại: " + e.getMessage());
		}
	}
}
