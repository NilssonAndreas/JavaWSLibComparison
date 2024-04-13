package com.example;

import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import static spark.Spark.*;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

public class BenchmarkServer {
    private static final SystemInfo systemInfo = new SystemInfo();
    private static final CentralProcessor processor = systemInfo.getHardware().getProcessor();
    private static long[] prevTicks = processor.getSystemCpuLoadTicks();
    private static Map<Instant, Double> cpuUsageData = new HashMap<>();
    private static final AtomicBoolean monitoringActive = new AtomicBoolean(false);
    private static final Gson gson = new Gson();

    public static void main(String[] args) {
        port(8080);

        Thread monitoringThread = new Thread(() -> {
            while (!Thread.interrupted()) {
                if (monitoringActive.get()) {
                    recordCpuUsage();
                    try {
                        Thread.sleep(5000);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt(); // Ensure the interrupt flag is set back
                        break;
                    }
                }
            }
        });
        monitoringThread.start();

        post("/start", (request, response) -> {
            response.type("application/json");
            JsonObject jsonBody = gson.fromJson(request.body(), JsonObject.class);
            String serverType = jsonBody.get("serverType").getAsString();
            int port = jsonBody.get("port").getAsInt();

            try {
                if (ServerManager.isServerRunning(serverType)) {
                    return gson.toJson("Server already running");
                }

                switch (serverType) {
                    case "JavaWebSocket":
                        ServerManager.startServer("JavaWebSocket", new JavaWebSocketAdapter(port));
                        break;
                    case "NettyWebSocket":
                        ServerManager.startServer("NettyWebSocket", new NettyWebSocketAdapter(port));
                        break;
                    case "UndertowWebSocket":
                        ServerManager.startServer("UndertowWebSocket", new UndertowWebSocketAdapter(port));
                        break;
                    default:
                        response.status(400); // Bad Request
                        return gson.toJson("Invalid server type");
                }
                System.out.println("Server started successfully on port " + port);
                return gson.toJson("Server started successfully on port " + port);
            } catch (Exception e) {
                response.status(500); // Internal Server Error
                return gson.toJson("Error starting server: " + e.getMessage());
            }
        });

        post("/stop", (request, response) -> {
            response.type("application/json");
            JsonObject jsonBody = gson.fromJson(request.body(), JsonObject.class);
            String serverType = jsonBody.get("serverType").getAsString();

            String stopResponse = ServerManager.stopServer(serverType);
            System.err.println(stopResponse);
            if (stopResponse.contains("successfully")) {
                response.status(200); // OK
                return gson.toJson(stopResponse);
            } else {
                response.status(404); // Not Found or Unable to stop
                return gson.toJson(stopResponse);
            }
        });

        get("/monitor/start", (req, res) -> {
            res.type("application/json");
            Map<String, Object> responseMap = new HashMap<>();
            try {
                cpuUsageData.clear();
                monitoringActive.set(true);
                responseMap.put("status", 200);
                responseMap.put("message", "CPU monitoring started");
                return gson.toJson(responseMap);
            } catch (Exception e) {
                responseMap.put("status", 500);
                responseMap.put("message", "Error starting monitoring");
                return gson.toJson(responseMap);
            }
        });

        get("/monitor/stop", (req, res) -> {
            res.type("application/json");
            monitoringActive.set(false);
            return calculateStats();
        });
    }

    private static void recordCpuUsage() {
        long[] ticks = processor.getSystemCpuLoadTicks();
        double load = processor.getSystemCpuLoadBetweenTicks(prevTicks) * 100;
        prevTicks = ticks;
        cpuUsageData.put(Instant.now(), load);
    }

    private static String calculateStats() {
        double average = cpuUsageData.values().stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double max = cpuUsageData.values().stream().mapToDouble(Double::doubleValue).max().orElse(0);

        Map<String, Double> stats = new HashMap<>();
        stats.put("average", average);
        stats.put("max", max);
        return gson.toJson(stats);
    }
}
