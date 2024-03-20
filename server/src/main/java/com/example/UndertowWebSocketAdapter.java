package com.example;

import io.undertow.Undertow;
import io.undertow.server.DefaultByteBufferPool;
import io.undertow.servlet.Servlets;
import io.undertow.servlet.api.DeploymentInfo;
import io.undertow.servlet.api.DeploymentManager;
import io.undertow.websockets.jsr.WebSocketDeploymentInfo;

public class UndertowWebSocketAdapter {
        private static BenchmarkSocketServer benchmarkServer;
      
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
                // Implementation
            }

    };

    }

    public void start() {
        try{
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

        Undertow server = Undertow.builder()
                .addHttpListener(this.portNumber, "localhost")
                .setHandler(manager.start())
                .build();

        server.start();
        System.out.println("Undertow WebSocket server started on port " + this.portNumber);
        }catch (Exception e) {
            e.printStackTrace();
        }
        
    }

    public static BenchmarkSocketServer getBenchmarkServer() {
        return benchmarkServer;
    }
    public static void main(String[] args) {

    }
}
