package com.example;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ServerManager {
    private static final ConcurrentHashMap<String, Runnable> servers = new ConcurrentHashMap<>();
    private static final ExecutorService serverExecutor = Executors.newCachedThreadPool(); // Using a thread pool for
                                                                                           // server threads

    public static boolean isServerRunning(String key) {
        return servers.containsKey(key);
    }

    public static void startServer(String key, Runnable server) {
        if (!isServerRunning(key)) {
            servers.put(key, server); // Add the server to the map before starting
            serverExecutor.execute(() -> {
                try {
                    server.run();
                } catch (Exception e) {
                    System.err.println("Error running server " + key + ": " + e.getMessage());
                    servers.remove(key); // Remove from map if failed to start
                }
            });
            System.out.println("Server " + key + " started on a separate thread.");
        } else {
            System.out.println("Server " + key + " is already running.");
        }
    }

    public static String stopServer(String key) {
        Runnable server = servers.remove(key);
        if (server != null && server instanceof AutoCloseable) {
            try {
                ((AutoCloseable) server).close(); // Attempt to stop the server
                return "Server stopped successfully.";
            } catch (Exception e) {

                System.out.println("Failed to stop server: " + e.getMessage());
                System.out.println(e);
                return "Failed to stop server: " + e.getMessage();
            }
        }
        return "No such server running or unable to stop.";
    }
}
