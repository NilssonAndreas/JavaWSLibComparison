package com.example;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.http.HttpServer;
import io.vertx.core.http.ServerWebSocket;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class VertxWebSocketVerticle extends AbstractVerticle {
    private int port;
    private static BenchmarkSocketServer benchmarkServer = VertxWebSocketAdapter.getBenchmarkServer();
    private Map<String, ServerWebSocket> sessions = new ConcurrentHashMap<>();

    public VertxWebSocketVerticle(int port) {
        this.port = port;
    }

    @Override
    public void start() {
        HttpServer server = vertx.createHttpServer();

        server.webSocketHandler(this::handleWebSocket);

        server.listen(port, result -> {
            if (result.succeeded()) {
                System.out.println("WebSocket server started on port " + port);
            } else {
                System.err.println("WebSocket server failed to start on port " + port);
            }
        });
    }

    private void handleWebSocket(ServerWebSocket webSocket) {
        String sessionId = benchmarkServer.onOpen(); // Generate and retrieve session ID on connection open
        sessions.put(sessionId, webSocket); // Store the webSocket with its session ID

        webSocket.handler(buffer -> {
            // Handle incoming messages
            benchmarkServer.onMessageReceived();
            // Echo back the message
            webSocket.writeTextMessage(buffer.toString());
        });

        webSocket.closeHandler(voidHandler -> {
            // Handle WebSocket close
            sessions.remove(sessionId); // Remove the session on close
            benchmarkServer.onClose(sessionId); // Notify the benchmark server about the session close
            // System.out.println("WebSocket closed: " + sessionId);
        });

        webSocket.exceptionHandler(exception -> {
            // Handle any exceptions
            System.err
                    .println("WebSocket encountered an error for session " + sessionId + ": " + exception.getMessage());
        });
    }
}
