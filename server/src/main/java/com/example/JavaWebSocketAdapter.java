package com.example;
import org.java_websocket.server.WebSocketServer;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;

import java.net.InetSocketAddress;

public class JavaWebSocketAdapter extends WebSocketServer {

    private BenchmarkSocketServer benchmarkServer;
    public int portNumber;

    public JavaWebSocketAdapter(int port) {
        super(new InetSocketAddress(port));
        this.portNumber = port;
        benchmarkServer = new BenchmarkSocketServer() {
            @Override
            public void startServer() {
                // Not used in this context as the WebSocketServer's start method is called directly.
            }

            @Override
            public void stopServer() {
                try {
                    JavaWebSocketAdapter.this.stop();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        };
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        String sessionId = benchmarkServer.onOpen();
        conn.setAttachment(sessionId); // Attach the session ID to the connection for later reference
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        String sessionId = conn.getAttachment();
        benchmarkServer.onClose(sessionId);
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        benchmarkServer.onMessageReceived();
        // Echo the message back to the client, for example
        conn.send(message);
        benchmarkServer.onMessageSent();
    }

    @Override
    public void onError(WebSocket conn, Exception ex) {
        System.out.println("WebSocket error: " + ex.getMessage());
    }

    @Override
    public void onStart() {
        System.out.println("WebSocket server started on port: " + this.portNumber);

    }

    // You can expose this method to allow external logging of the metrics
    public void logMetrics() {
        benchmarkServer.logMetrics();
    }
    
    public static void main(String[] args) {
        int port = 8887; // Set your desired port here
        JavaWebSocketAdapter server = new JavaWebSocketAdapter(port);
        server.start();
    }
}
