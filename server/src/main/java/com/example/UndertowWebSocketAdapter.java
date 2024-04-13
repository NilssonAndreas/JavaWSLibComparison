package com.example;

import io.undertow.Undertow;
import io.undertow.server.DefaultByteBufferPool;
import io.undertow.servlet.Servlets;
import io.undertow.servlet.api.DeploymentInfo;
import io.undertow.servlet.api.DeploymentManager;
import io.undertow.websockets.jsr.WebSocketDeploymentInfo;

public class UndertowWebSocketAdapter implements Runnable, AutoCloseable {
    private static BenchmarkSocketServer benchmarkServer;
    private Undertow server;
    public int portNumber;

    public UndertowWebSocketAdapter(int port) {
        this.portNumber = port;
        benchmarkServer = new BenchmarkSocketServer() {
            @Override
            public void startServer() throws Exception {
                start();
            }

            @Override
            public void stopServer() throws Exception {
                stop();
            }
        };
    }

    @Override
    public void run() {
        try {
            start();
        } catch (Exception e) {
            System.err.println("Failed to start server: " + e.getMessage());
        }
    }

    @Override
    public void close() throws Exception {
        stop();
    }

    public void start() throws Exception {
        DeploymentInfo servletBuilder = Servlets.deployment()
            .setClassLoader(UndertowWebSocketAdapter.class.getClassLoader())
            .setContextPath("/")
            .setDeploymentName("test.war")
            .addServletContextAttribute(WebSocketDeploymentInfo.ATTRIBUTE_NAME,
                new WebSocketDeploymentInfo()
                    .addEndpoint(UndertowWebSocket.class)
                    .setBuffers(new DefaultByteBufferPool(false, 1024)));

        DeploymentManager manager = Servlets.defaultContainer().addDeployment(servletBuilder);
        manager.deploy();

        server = Undertow.builder()
            .addHttpListener(this.portNumber, "0.0.0.0")
            .setHandler(manager.start())
            .build();

        server.start();
        System.out.println("Undertow WebSocket server started on port " + this.portNumber);
    }

    public void stop() {
        if (server != null) {
            server.stop();
            System.out.println("Server stopped successfully.");
        }
    }

    public static BenchmarkSocketServer getBenchmarkServer() {
        return benchmarkServer;
    }

    public static void main(String[] args) {
        try (UndertowWebSocketAdapter server = new UndertowWebSocketAdapter(8888)) {
            server.run();
        } catch (Exception e) {
            System.err.println("Error during server lifecycle: " + e.getMessage());
        }
    }
}
