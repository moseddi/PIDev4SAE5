package com.example.assessment.controller;

import com.example.assessment.entity.Exam;
import com.example.assessment.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService service;

    @GetMapping
    public ResponseEntity<List<Exam>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Exam> getById(@PathVariable Long id) {
        Exam exam = service.getById(id);
        return exam != null ? ResponseEntity.ok(exam) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Exam> create(@RequestBody Exam exam) {
        exam.setId(null);
        return ResponseEntity.ok(service.save(exam));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Exam> update(@PathVariable Long id, @RequestBody Exam exam) {
        try {
            Exam updatedExam = service.updateSafe(id, exam);
            return ResponseEntity.ok(updatedExam);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadExamPdf(@PathVariable Long id) {
        Exam exam = service.getById(id);
        if (exam == null) {
            return ResponseEntity.notFound().build();
        }

        String title = exam.getTitle() != null ? exam.getTitle() : "Examen";
        String description = exam.getDescription() != null ? exam.getDescription() : "Sujet de l'examen";
        
        // Build a minimal raw PDF document
        StringBuilder sb = new StringBuilder();
        sb.append("%PDF-1.4\n");
        sb.append("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
        sb.append("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
        sb.append("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n");
        sb.append("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

        StringBuilder stream = new StringBuilder();
        stream.append("BT\n");
        stream.append("/F1 24 Tf\n");
        stream.append("100 750 Td\n");
        stream.append("(").append(sanitize(title)).append(") Tj\n");
        stream.append("/F1 14 Tf\n");
        stream.append("0 -50 Td\n");
        stream.append("(").append(sanitize(description)).append(") Tj\n");
        stream.append("0 -40 Td\n");
        stream.append("(Duree : ").append(exam.getDuration() != null ? exam.getDuration() : 0).append(" minutes) Tj\n");
        stream.append("0 -30 Td\n");
        stream.append("(Veuillez repondre a toutes les questions sur votre copie.) Tj\n");
        stream.append("ET\n");

        String streamStr = stream.toString();
        sb.append("4 0 obj\n<< /Length ").append(streamStr.length()).append(" >>\nstream\n");
        sb.append(streamStr);
        sb.append("endstream\nendobj\n");

        sb.append("xref\n0 6\n");
        sb.append("0000000000 65535 f \n");
        sb.append("0000000009 00000 n \n");
        sb.append("0000000058 00000 n \n");
        sb.append("0000000115 00000 n \n");
        sb.append("0000000306 00000 n \n");
        sb.append("0000000250 00000 n \n");
        sb.append("trailer\n<< /Size 6 /Root 1 0 R >>\n");
        sb.append("startxref\n0\n%%EOF\n");

        byte[] pdfBytes = sb.toString().getBytes(java.nio.charset.StandardCharsets.ISO_8859_1);

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.set(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=examen_" + title.replaceAll("\\s+", "_") + ".pdf");

        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    private String sanitize(String s) {
        if (s == null) return "";
        return s.replace("(", "").replace(")", "").replace("\\", "");
    }
}