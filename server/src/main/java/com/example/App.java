package com.example;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import java.net.InetSocketAddress;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

public class App extends WebSocketServer {

    private final Set<WebSocket> conns = Collections.synchronizedSet(new HashSet<>());
    private final AtomicInteger totalMessagesReceived = new AtomicInteger(0);
    private final AtomicInteger totalMessagesSent = new AtomicInteger(0);
    private final AtomicInteger errorCount = new AtomicInteger(0);

    public App(InetSocketAddress address) {
        super(address);
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        conns.add(conn);
        System.out.println("New connection: " + conn.getRemoteSocketAddress());
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        conns.remove(conn);
        System.out.println("Closed connection: " + conn.getRemoteSocketAddress());
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        totalMessagesReceived.incrementAndGet();
        System.out.println("Message from client: " + message);
        // Echo the message back to the client
        String response = "Echo: " + message;
        conn.send(response);
        totalMessagesSent.incrementAndGet();
    }

    @Override
    public void onError(WebSocket conn, Exception ex) {
        errorCount.incrementAndGet();
        ex.printStackTrace();
    }

    @Override
    public void onStart() {
        System.out.println("Server started successfully");
    }

    // Method to log or return metrics
    public void logMetrics() {
        System.out.println("Current connections: " + conns.size());
        System.out.println("Total messages received: " + totalMessagesReceived.get());
        System.out.println("Total messages sent: " + totalMessagesSent.get());
        System.out.println("Error count: " + errorCount.get());
    }

    public static void main(String[] args) {
        String host = "localhost";
        int port = 8887; // Choose an appropriate port for your application

        App server = new App(new InetSocketAddress(host, port));
        server.start();

        // Example: Log metrics every 10 seconds
        new java.util.Timer().schedule(
                new java.util.TimerTask() {
                    @Override
                    public void run() {
                        server.logMetrics();
                    }
                },
                10000, 10000);
    }
}
