package com.example;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import static spark.Spark.*;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

public class BenchmarkServer {

    private static final Gson gson = new Gson();

    public static void main(String[] args) {
        port(8080);
        CpuMonitor.setMonitoring(false);
        // MemoryMonitor.printMemoryUsage();
        CpuMonitor.startCpuMonitoring();
        SystemMonitor.startMonitoring();

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
                CpuMonitor.resetData();
                CpuMonitor.setMonitoring(true);
                SystemMonitor.clearData();
                SystemMonitor.activateMonitoring();
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
            CpuMonitor.setMonitoring(false);
            SystemMonitor.deactivateMonitoring();
            return gatherSystemMetrics();
        });
    }

    /**
     * Calculates the statistics for CPU and RAM usage data and returns the result
     * as a JSON string.
     *
     * @return A JSON string representing the statistics for CPU and RAM usage data.
     */
    private static String gatherSystemMetrics() {
        double cpuMax = SystemMonitor.getMaxCpuUsage();
        double cpuAverage = SystemMonitor.getAverageCpuUsage();
        double ramMax = SystemMonitor.getMaxMemoryUsageGB();
        double ramAverage = SystemMonitor.getAverageMemoryUsageGB();
        Map<String, Double> jvmCpuLoad = CpuMonitor.getCpuLoad();

        // Prepare the JSON structure
        Map<String, Object> stats = new HashMap<>();
        stats.put("CpuAverage", cpuAverage);
        stats.put("CpuMax", cpuMax);
        stats.put("RamAverageGB", ramAverage);
        stats.put("RamMaxGB", ramMax);
        stats.put("JavaAvgCpuLoad", jvmCpuLoad.get("average"));
        stats.put("JavaMaxCpuLoad", jvmCpuLoad.get("max"));
        return gson.toJson(stats);
    }
}
