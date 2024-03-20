package com.example;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

public abstract class BenchmarkSocketServer {
    private final ConcurrentHashMap<String, String> sessionIds = new ConcurrentHashMap<>();
    private final AtomicInteger totalConnections = new AtomicInteger(0);
    private final AtomicInteger activeConnections = new AtomicInteger(0);
    private final AtomicLong totalMessagesReceived = new AtomicLong(0);
    private final AtomicLong totalMessagesSent = new AtomicLong(0);

    // Abstract methods to be implemented by subclasses for server control
    public abstract void startServer() throws Exception;
    public abstract void stopServer() throws Exception;

    // Methods for session management and metrics logging
    public String onOpen() {
        String sessionId = UUID.randomUUID().toString();
        sessionIds.put(sessionId, sessionId);
        int currentActive = activeConnections.incrementAndGet();
        totalConnections.incrementAndGet();
        System.out.println("Session opened: " + sessionId + ". Active connections: " + currentActive);
        return sessionId;
    }

    public void onClose(String sessionId) {
        sessionIds.remove(sessionId);
        int currentActive = activeConnections.decrementAndGet();
        System.out.println("Session closed: " + sessionId + ". Active connections: " + currentActive);
    }

    public void onMessageReceived() {
        long messages = totalMessagesReceived.incrementAndGet();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM-dd HH:mm:ss");
        String formattedDate = LocalDateTime.now().format(formatter);
        System.out.println("Messaged received on: " + formattedDate);
        System.out.println("Message received. Total messages received: " + messages);
    }

    public void onMessageSent() {
        long messages = totalMessagesSent.incrementAndGet();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM-dd HH:mm:ss");
        String formattedDate = LocalDateTime.now().format(formatter);
        System.out.println("Messaged sent on: " + formattedDate);
        System.out.println("Message sent. Total messages sent: " + messages);
    }

    public void logMetrics() {
        System.out.println("Current active connections: " + activeConnections.get());
        System.out.println("Total connections so far: " + totalConnections.get());
        System.out.println("Total messages received: " + totalMessagesReceived.get());
        System.out.println("Total messages sent: " + totalMessagesSent.get());
    }

    // Additional methods as needed...
}
