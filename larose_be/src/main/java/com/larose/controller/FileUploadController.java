package com.larose.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowCredentials = "true")
@Slf4j
public class FileUploadController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.backend.base-url:http://localhost:8080}")
    private String baseUrl;

    /**
     * Test endpoint to check authentication
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> testAuth(jakarta.servlet.http.HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        log.info("Test endpoint - Auth header: {}", authHeader != null ? "Present" : "Missing");
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Test endpoint works");
        response.put("authHeader", authHeader != null ? "Present" : "Missing");
        return ResponseEntity.ok(response);
    }

    /**
     * Upload single file
     */
    @PostMapping("/file")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "general") String folder,
            jakarta.servlet.http.HttpServletRequest request) {
        
        log.info("Upload file request - Folder: {}, File size: {}, Auth header: {}", 
                folder, file.getSize(), request.getHeader("Authorization") != null ? "Present" : "Missing");
        
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only image and video files are allowed"));
            }

            // Create directory if not exists
            String folderPath = uploadDir + "/" + folder;
            Path uploadPath = Paths.get(folderPath);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : "";
            String filename = UUID.randomUUID().toString() + extension;

            // Save file
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return URL
            String fileUrl = baseUrl + "/uploads/" + folder + "/" + filename;
            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            response.put("filename", filename);
            response.put("originalName", originalFilename);

            log.info("File uploaded successfully: {}", fileUrl);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Error uploading file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }

    /**
     * Upload multiple files
     */
    @PostMapping("/files")
    public ResponseEntity<Map<String, Object>> uploadFiles(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "folder", defaultValue = "general") String folder,
            jakarta.servlet.http.HttpServletRequest request) {
        
        log.info("Upload files request - Folder: {}, Files count: {}, Auth header: {}", 
                folder, files.length, request.getHeader("Authorization") != null ? "Present" : "Missing");
        
        try {
            List<Map<String, String>> uploadedFiles = new ArrayList<>();
            List<String> errors = new ArrayList<>();

            // Create directory if not exists
            String folderPath = uploadDir + "/" + folder;
            Path uploadPath = Paths.get(folderPath);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            for (MultipartFile file : files) {
                if (file.isEmpty()) {
                    errors.add("File " + file.getOriginalFilename() + " is empty");
                    continue;
                }

                try {
                    // Validate file type
                    String contentType = file.getContentType();
                    if (contentType == null || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
                        errors.add("File " + file.getOriginalFilename() + " is not an image or video");
                        continue;
                    }

                    // Generate unique filename
                    String originalFilename = file.getOriginalFilename();
                    String extension = originalFilename != null && originalFilename.contains(".") 
                        ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                        : "";
                    String filename = UUID.randomUUID().toString() + extension;

                    // Save file
                    Path filePath = uploadPath.resolve(filename);
                    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

                    // Add to response
                    String fileUrl = baseUrl + "/uploads/" + folder + "/" + filename;
                    Map<String, String> fileInfo = new HashMap<>();
                    fileInfo.put("url", fileUrl);
                    fileInfo.put("filename", filename);
                    fileInfo.put("originalName", originalFilename);
                    uploadedFiles.add(fileInfo);

                } catch (IOException e) {
                    log.error("Error uploading file: " + file.getOriginalFilename(), e);
                    errors.add("Failed to upload " + file.getOriginalFilename() + ": " + e.getMessage());
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("files", uploadedFiles);
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error in uploadFiles", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload files: " + e.getMessage()));
        }
    }

    /**
     * Delete file
     */
    @DeleteMapping("/file")
    public ResponseEntity<Map<String, String>> deleteFile(
            @RequestParam("url") String url) {
        
        try {
            // Extract path from URL
            String path = url.replace(baseUrl + "/uploads/", "");
            Path filePath = Paths.get(uploadDir, path);
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("File deleted: {}", filePath);
                return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (IOException e) {
            log.error("Error deleting file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete file: " + e.getMessage()));
        }
    }
}

