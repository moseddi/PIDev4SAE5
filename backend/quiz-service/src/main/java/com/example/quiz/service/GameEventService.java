package com.example.quiz.service;

import com.example.quiz.entity.GameSession;
import com.example.quiz.entity.GameStatus;
import com.example.quiz.entity.QuizAnswer;
import com.example.quiz.entity.QuizQuestion;
import com.example.quiz.entity.Score;
import com.example.quiz.repository.GameSessionRepository;
import com.example.quiz.repository.QuizAnswerRepository;
import com.example.quiz.repository.QuizQuestionRepository;
import com.example.quiz.repository.ScoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class GameEventService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private GameSessionRepository sessionRepository;

    @Autowired
    private QuizQuestionRepository questionRepository;

    @Autowired
    private ScoreRepository scoreRepository;

    @Autowired
    private QuizAnswerRepository answerRepository;

    // Joueurs connectés par session : sessionId → liste de prénoms
    private final Map<Long, List<String>> sessionPlayers = new ConcurrentHashMap<>();

    private String topic(Long sessionId) {
        return "/topic/quiz/" + sessionId;
    }

    // -----------------------------------------------
    // Un joueur rejoint la salle d'attente
    // -----------------------------------------------
    public Map<String, Object> playerJoin(Long sessionId, String playerName) {
        sessionPlayers.computeIfAbsent(sessionId, k -> new CopyOnWriteArrayList<>());
        List<String> players = sessionPlayers.get(sessionId);

        boolean isNew = !players.contains(playerName);
        if (isNew) {
            players.add(playerName);
            // Only broadcast when a genuinely new player joins
            broadcastEvent(sessionId, "PLAYER_JOINED", Map.of(
                    "playerName", playerName,
                    "players",    players,
                    "count",      players.size()
            ));
        }

        // Récupérer infos session pour la réponse
        GameSession session = sessionRepository.findById(sessionId).orElse(null);
        return Map.of(
                "sessionId", sessionId,
                "playerName", playerName,
                "players", players,
                "quizTitle", session != null && session.getQuiz() != null
                        ? session.getQuiz().getTitle() : "Quiz",
                "gamePin", session != null ? session.getGamePin() : ""
        );
    }

    // -----------------------------------------------
    // Démarrage du quiz : broadcast START puis Q1
    // -----------------------------------------------
    public void startGame(Long sessionId) {
        GameSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null) return;

        session.setStatus(GameStatus.STARTED);
        session.setCurrentQuestionIndex(0);
        sessionRepository.save(session);

        List<String> players = sessionPlayers.getOrDefault(sessionId, List.of());
        broadcastEvent(sessionId, "START", Map.of(
                "sessionId", sessionId,
                "players",   players,
                "count",     players.size()
        ));
        sendNextQuestion(sessionId);
    }

    // -----------------------------------------------
    // Envoie la question courante (sans la bonne réponse)
    // -----------------------------------------------
    @Transactional
    public void sendNextQuestion(Long sessionId) {
        GameSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null || session.getQuiz() == null) return;

        // Use JOIN FETCH to load questions + answers in one query (no N+1, no LazyInit)
        List<QuizQuestion> questions = questionRepository.findByQuizIdWithAnswers(session.getQuiz().getId());

        int index = session.getCurrentQuestionIndex();
        if (index >= questions.size()) {
            endGame(sessionId);
            return;
        }

        QuizQuestion question = questions.get(index);
        int timeLimit = question.getTimeLimit() > 0 ? question.getTimeLimit() : 10;

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("questionIndex",   index);
        payload.put("totalQuestions",  questions.size());
        payload.put("timeLimit",       timeLimit);
        payload.put("question", Map.of(
                "id",      question.getId(),
                "content", question.getContent(),
                // Envoie les réponses SANS isCorrect (pour ne pas tricher)
                "answers", question.getAnswers() != null
                        ? question.getAnswers().stream()
                                .map(a -> Map.of("id", a.getId(), "content", a.getContent()))
                                .toList()
                        : List.of()
        ));

        broadcastEvent(sessionId, "QUESTION", payload);
    }

    // -----------------------------------------------
    // Traitement d'une réponse joueur
    // -----------------------------------------------
    @Transactional
    public void processAnswer(Long sessionId, String playerName, Long answerId, int timeLeft, int questionIndex) {
        GameSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null) return;

        // Prevent double-answering the same question (uses client-provided index)
        if (scoreRepository.existsBySessionIdAndUsernameAndQuestionIndex(sessionId, playerName, questionIndex)) {
            return;
        }

        boolean isCorrect = answerId != null && answerRepository.findById(answerId)
                .map(QuizAnswer::isCorrect).orElse(false);

        int points = isCorrect ? (500 + (timeLeft * 50)) : 0;

        Score score = new Score();
        score.setUserId(0L);
        score.setUsername(playerName);
        score.setPoints(points);
        score.setQuestionIndex(questionIndex);
        score.setSession(session);
        scoreRepository.save(score);

        broadcastEvent(sessionId, "SCORE_UPDATE", Map.of(
                "playerName",    playerName,
                "points",        points,
                "isCorrect",     isCorrect,
                "questionIndex", questionIndex
        ));

        buildAndBroadcastRanking(sessionId);
    }

    // -----------------------------------------------
    // Question suivante
    // -----------------------------------------------
    public void nextQuestion(Long sessionId) {
        GameSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null) return;
        session.setCurrentQuestionIndex(session.getCurrentQuestionIndex() + 1);
        sessionRepository.save(session);
        sendNextQuestion(sessionId);
    }

    // -----------------------------------------------
    // Fin du quiz : broadcast classement final + nettoie
    // -----------------------------------------------
    public void endGame(Long sessionId) {
        GameSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null) return;
        session.setStatus(GameStatus.FINISHED);
        sessionRepository.save(session);

        List<Map<String, Object>> finalRanking = buildRanking(sessionId);
        broadcastEvent(sessionId, "END", Map.of("ranking", finalRanking));

        // Nettoyer la liste des joueurs en mémoire
        sessionPlayers.remove(sessionId);
    }

    // -----------------------------------------------
    // Helpers ranking
    // -----------------------------------------------
    private void buildAndBroadcastRanking(Long sessionId) {
        broadcastEvent(sessionId, "RANKING_UPDATE",
                Map.of("ranking", buildRanking(sessionId)));
    }

    private List<Map<String, Object>> buildRanking(Long sessionId) {
        List<Score> scores = scoreRepository.findBySessionId(sessionId);
        // Aggregate total points per player
        Map<String, Integer> totals = new LinkedHashMap<>();
        for (Score s : scores) {
            totals.merge(s.getUsername(), s.getPoints(), Integer::sum);
        }
        return totals.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .map(e -> Map.<String, Object>of(
                        "username", e.getKey(),
                        "points",   e.getValue()))
                .toList();
    }

    // -----------------------------------------------
    // Broadcast générique
    // -----------------------------------------------
    private void broadcastEvent(Long sessionId, String type, Object payload) {
        Map<String, Object> event = Map.of("type", type, "payload", payload);
        messagingTemplate.convertAndSend(topic(sessionId), event);
    }

    // Getter pour l'état actuel des joueurs (REST polling fallback)
    public List<String> getPlayers(Long sessionId) {
        return sessionPlayers.getOrDefault(sessionId, List.of());
    }
}
