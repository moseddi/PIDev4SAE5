package com.example.assessment.controller;

import com.example.assessment.entity.Attempt;
import com.example.assessment.service.AttemptService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/attempts")
public class AttemptController {

    private final AttemptService attemptService;
    private final com.example.assessment.repository.ExamRepository examRepo;
    private final com.example.assessment.repository.AnswerRepository answerRepo;

    public AttemptController(AttemptService attemptService, 
                             com.example.assessment.repository.ExamRepository examRepo,
                             com.example.assessment.repository.AnswerRepository answerRepo) {
        this.attemptService = attemptService;
        this.examRepo = examRepo;
        this.answerRepo = answerRepo;
    }

    // UPDATE Attempt
    @PutMapping("/{id}")
    public Attempt update(@PathVariable Long id, @RequestBody Attempt attempt) {
        attempt.setId(id);
        return attemptService.update(attempt);
    }

    // DELETE Attempt
    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        attemptService.delete(id);
        return "Attempt deleted successfully";
    }

    // GET ALL
    @GetMapping
    public List<Attempt> getAll() {
        return attemptService.getAll();
    }

    // CREATE
    @PostMapping
    public Attempt create(@RequestBody Attempt a) {
        if (a.getDate() == null) {
            a.setDate(java.time.LocalDateTime.now());
        }
        if (a.getExam() != null && a.getExam().getId() != null) {
            com.example.assessment.entity.Exam exam = examRepo.findById(a.getExam().getId()).orElse(null);
            if (exam != null) {
                int passingScore = exam.getPassingScore() != null ? exam.getPassingScore() : 50;
                a.setPassed(a.getScore() >= passingScore);
            } else {
                a.setPassed(a.getScore() >= 50); // Fallback
            }
        } else {
            a.setPassed(a.getScore() >= 50);
        }
        return attemptService.save(a);
    }

    // GET BY USER ID
    @GetMapping("/user/{userId}")
    public List<Attempt> getByUserId(@PathVariable Long userId) {
        return attemptService.getByUserId(userId);
    }

    // SUBMIT EXAM
    @PostMapping("/submit")
    public Attempt submitExam(@RequestBody com.example.assessment.Dto.SubmitExamPayload payload) {
        return attemptService.submitExam(payload, examRepo, answerRepo);
    }

    // DOWNLOAD CERTIFICATE PDF
    @GetMapping("/{id}/certificate")
    public ResponseEntity<byte[]> downloadCertificate(@PathVariable Long id) {
        Attempt attempt = attemptService.getById(id);
        if (attempt == null) {
            return ResponseEntity.notFound().build();
        }
        if (!attempt.isPassed()) {
            return ResponseEntity.badRequest().build();
        }

        String studentName = attempt.getStudentName() != null ? attempt.getStudentName() : "Étudiant #" + attempt.getUserId();
        String examTitle = attempt.getExam() != null && attempt.getExam().getTitle() != null
                ? attempt.getExam().getTitle() : "Examen";
        String dateStr = attempt.getDate() != null
                ? attempt.getDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "N/A";
        int score = attempt.getScore();

        // Build a minimal valid PDF with certificate content
        String content = buildPdfContent(studentName, examTitle, score, dateStr);
        byte[] pdfBytes = content.getBytes(StandardCharsets.ISO_8859_1);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=certificat_" + examTitle.replaceAll("\\s+", "_") + ".pdf");

        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    /**
     * Builds a minimal raw PDF document (no external library needed).
     */
    private String buildPdfContent(String name, String exam, int score, String date) {
        StringBuilder sb = new StringBuilder();
        sb.append("%PDF-1.4\n");

        // Object 1: Catalog
        sb.append("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

        // Object 2: Pages
        sb.append("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

        // Object 3: Page
        sb.append("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n");

        // Object 5: Font
        sb.append("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

        // Build page content stream
        StringBuilder stream = new StringBuilder();
        stream.append("BT\n");
        stream.append("/F1 28 Tf\n");
        stream.append("120 750 Td\n");
        stream.append("(CERTIFICAT DE REUSSITE) Tj\n");
        stream.append("/F1 16 Tf\n");
        stream.append("0 -60 Td\n");
        stream.append("(Felicitations !) Tj\n");
        stream.append("/F1 14 Tf\n");
        stream.append("0 -40 Td\n");
        stream.append("(Nom : ").append(sanitize(name)).append(") Tj\n");
        stream.append("0 -30 Td\n");
        stream.append("(Examen : ").append(sanitize(exam)).append(") Tj\n");
        stream.append("0 -30 Td\n");
        stream.append("(Score : ").append(score).append("/100) Tj\n");
        stream.append("0 -30 Td\n");
        stream.append("(Date : ").append(sanitize(date)).append(") Tj\n");
        stream.append("0 -30 Td\n");
        stream.append("(Statut : REUSSI) Tj\n");
        stream.append("/F1 10 Tf\n");
        stream.append("0 -60 Td\n");
        stream.append("(Ce certificat atteste la reussite de l examen ci-dessus.) Tj\n");
        stream.append("ET\n");

        String streamStr = stream.toString();

        // Object 4: Contents
        sb.append("4 0 obj\n<< /Length ").append(streamStr.length()).append(" >>\nstream\n");
        sb.append(streamStr);
        sb.append("endstream\nendobj\n");

        // XRef / Trailer (simplified)
        sb.append("xref\n0 6\n");
        sb.append("0000000000 65535 f \n");
        sb.append("0000000009 00000 n \n");
        sb.append("0000000058 00000 n \n");
        sb.append("0000000115 00000 n \n");
        sb.append("0000000306 00000 n \n");
        sb.append("0000000250 00000 n \n");

        sb.append("trailer\n<< /Size 6 /Root 1 0 R >>\n");
        sb.append("startxref\n0\n%%EOF\n");

        return sb.toString();
    }

    private String sanitize(String s) {
        if (s == null) return "";
        return s.replace("(", "").replace(")", "").replace("\\", "");
    }
}
