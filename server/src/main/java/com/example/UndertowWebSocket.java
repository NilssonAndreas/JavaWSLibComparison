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
        System.out.println("WebSocket opened: " + session.getId());
        benchmarkServer.onOpen();
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        System.out.println("Message received: " + message);
        benchmarkServer.onMessageReceived();
        try {
            session.getBasicRemote().sendText("Echo: " + message);
            benchmarkServer.onMessageSent();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @OnClose
    public void onClose(Session session) {
        System.out.println("WebSocket closed: " + session.getId());
        benchmarkServer.onClose(session.getId());
    }

    // Add @OnError method if needed
}
