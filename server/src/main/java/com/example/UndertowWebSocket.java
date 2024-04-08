package com.example;

import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

@ServerEndpoint("/")
public class UndertowWebSocket {

    private static BenchmarkSocketServer benchmarkServer = UndertowWebSocketAdapter.getBenchmarkServer();

    @OnOpen
    public void onOpen(Session session) {
        benchmarkServer.onOpen();
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        benchmarkServer.onMessageReceived();
        try {
            session.getBasicRemote().sendText(message);
            benchmarkServer.onMessageSent();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @OnClose
    public void onClose(Session session) {
        benchmarkServer.onClose(session.getId());
    }

    // Add @OnError method if needed
}
