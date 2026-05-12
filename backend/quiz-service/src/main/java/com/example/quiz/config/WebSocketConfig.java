package com.example.quiz.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint SockJS attendu par Angular : /ws-quiz
        registry.addEndpoint("/ws-quiz")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Topic broadcast vers les clients Angular
        registry.enableSimpleBroker("/topic");
        // Prefix pour les messages envoyés par le client vers le serveur
        registry.setApplicationDestinationPrefixes("/app");
    }
}
