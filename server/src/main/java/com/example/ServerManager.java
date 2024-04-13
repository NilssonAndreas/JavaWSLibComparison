package com.example;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ServerManager {
    private static final ConcurrentHashMap<String, Runnable> servers = new ConcurrentHashMap<>();
    private static final ExecutorService serverExecutor = Executors.newCachedThreadPool();

    /**
     * Checks if a server with the specified key is running.
     *
     * @param key the key of the server to check
     * @return true if a server with the specified key is running, false otherwise
     */
    public static boolean isServerRunning(String key) {
        return servers.containsKey(key);
    }

    /**
     * Starts a server on a separate thread if it is not already running.
     * 
     * @param key    the key to identify the server
     * @param server the server to be started
     */
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

    /**
     * Stops the server associated with the given key.
     *
     * @param key the key associated with the server to stop
     * @return a message indicating the status of the server stop operation
     */
    public static String stopServer(String key) {
        Runnable server = servers.remove(key);
        if (server != null && server instanceof AutoCloseable) {
            try {
                ((AutoCloseable) server).close(); // Attempt to stop the server
                System.out.println("Server " + key + " stopped successfully.");
                return "Server stopped successfully.";
            } catch (Exception e) {
                System.err.println("Failed to stop server " + key + ": " + e.getMessage());
                e.printStackTrace(); // This will give a full stack trace, useful for debugging
                return "Failed to stop server: " + e.getMessage();
            }
        }
        System.out.println("No such server running or unable to stop for key: " + key);
        return "No such server running or unable to stop.";
    }
    
}
