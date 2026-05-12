package com.example.quiz.controller;

import com.example.quiz.service.GameEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Controller
public class QuizWebSocketController {

    @Autowired
    private GameEventService gameEventService;

    // ---------------------------------------------------
    // STOMP : Joueur envoie une réponse
    // stompClient.send('/app/quiz/answer', {}, JSON.stringify({...}))
    // payload : { sessionId, playerName, answerId, timeLeft }
    // ---------------------------------------------------
    @MessageMapping("/quiz/answer")
    public void handleAnswer(@Payload Map<String, Object> payload) {
        Long   sessionId     = toLong(payload.get("sessionId"));
        String playerName    = toString(payload.get("playerName"));
        Long   answerId      = toLong(payload.get("answerId"));
        int    timeLeft      = toInt(payload.get("timeLeft"));
        int    questionIndex = toInt(payload.get("questionIndex"));

        gameEventService.processAnswer(sessionId, playerName, answerId, timeLeft, questionIndex);
    }

    // ---------------------------------------------------
    // STOMP : Joueur rejoint la salle d'attente
    // stompClient.send('/app/quiz/join', {}, JSON.stringify({sessionId, playerName}))
    // ---------------------------------------------------
    @MessageMapping("/quiz/join")
    public void handleJoin(@Payload Map<String, Object> payload) {
        Long   sessionId  = toLong(payload.get("sessionId"));
        String playerName = toString(payload.get("playerName"));
        gameEventService.playerJoin(sessionId, playerName);
    }

    private Long toLong(Object val) {
        if (val instanceof Number n) return n.longValue();
        if (val instanceof String s) { try { return Long.parseLong(s); } catch (Exception e) { return 0L; } }
        return 0L;
    }

    private int toInt(Object val) {
        if (val instanceof Number n) return n.intValue();
        if (val instanceof String s) { try { return Integer.parseInt(s); } catch (Exception e) { return 0; } }
        return 0;
    }

    private String toString(Object val) {
        return val != null ? val.toString() : "Joueur";
    }
}
