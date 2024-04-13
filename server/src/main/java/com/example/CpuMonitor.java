package com.example;

import java.lang.management.ManagementFactory;
import com.sun.management.OperatingSystemMXBean;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class CpuMonitor {
    private static final ArrayList<Double> data = new ArrayList<>(); // Store CPU load measurements
    public static boolean monitoring = true;

    private static final OperatingSystemMXBean osBean = ManagementFactory
            .getPlatformMXBean(OperatingSystemMXBean.class);

    public static double getJVMCpuLoad() {
        return osBean.getProcessCpuLoad() * 100; // Return CPU load as a percentage
    }

    public static void setMonitoring(boolean monitoring) {
        CpuMonitor.monitoring = monitoring;
    }

    public static boolean getMonitoring() {
        return monitoring;
    }

    public static void startCpuMonitoring() {

        ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

        scheduler.scheduleAtFixedRate(() -> {
            if (monitoring) {

                double cpuLoad = getJVMCpuLoad(); // Get the current CPU load
                synchronized (data) {
                    data.add(cpuLoad); // Add the load to the data list
                }

                System.out.println("Current JVM CPU Load: " + cpuLoad + "%");
            }
        }, 0, 1, TimeUnit.SECONDS);
    }

    public static Map<String, Double> getCpuLoad() {
        synchronized (data) {
            double maxLoad = data.stream()
                    .mapToDouble(Double::doubleValue)
                    .max()
                    .orElse(0.0);

            double averageLoad = data.stream()
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0.0);

            Map<String, Double> results = new HashMap<>();
            results.put("average", averageLoad);
            results.put("max", maxLoad);
            return results;
        }
    }

    public static void resetData() {
        synchronized (data) {
            data.clear(); // Clear the data list to reset it
        }
    }
}
