package com.example;

import io.vertx.core.Vertx;

public class VertxWebSocketAdapter implements Runnable, AutoCloseable {
    private Vertx vertx;
    private static BenchmarkSocketServer benchmarkServer;
    public int portNumber;

    public VertxWebSocketAdapter(int port) {
        this.portNumber = port;
        benchmarkServer = new BenchmarkSocketServer() {
            @Override
            public void startServer() throws Exception {
                startServer();
            }

            @Override
            public void stopServer() throws Exception {
                close();
            }
        };
    }

    @Override
    public void run() {
        try {
            startServer();
        } catch (Exception e) {
            System.err.println("Failed to start server: " + e.getMessage());
        }
    }

    @Override
    public void close() throws Exception {
        stopServer();
    }

    public void startServer() throws Exception {
        vertx = Vertx.vertx();
        vertx.deployVerticle(new VertxWebSocketVerticle(portNumber));
        System.out.println("Vertx WebSocket server started on port " + this.portNumber);
    }

    public void stopServer() {
        if (vertx != null) {
            vertx.close(result -> {
                if (result.succeeded()) {
                    System.out.println("Vertx WebSocket server stopped successfully.");
                } else {
                    System.err.println("Vertx WebSocket server failed to stop.");
                }
            });
        }
    }

    public static BenchmarkSocketServer getBenchmarkServer() {
        return benchmarkServer;
    }

    public static void main(String[] args) {
        try (VertxWebSocketAdapter server = new VertxWebSocketAdapter(9999)) {
            server.run();
        } catch (Exception e) {
            System.err.println("Error during server lifecycle: " + e.getMessage());
        }
    }
}
