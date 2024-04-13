package com.example;

import java.lang.management.ManagementFactory;
import com.sun.management.OperatingSystemMXBean;
import java.util.ArrayList;
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
        if (monitoring == false) {
            return;
        }

        ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleAtFixedRate(() -> {
            double cpuLoad = getJVMCpuLoad(); // Get the current CPU load
            synchronized (data) {
                data.add(cpuLoad); // Add the load to the data list
            }
            System.out.println("Current JVM CPU Load: " + cpuLoad + "%");
        }, 0, 5, TimeUnit.SECONDS);
    }

    public static double getAverageCpuLoad() {
        synchronized (data) {
            System.out.println("Data: " + data);
            return data.stream() // Convert the data list to a stream
                    .mapToDouble(Double::doubleValue) // Convert each Double to double
                    .average() // Calculate the average
                    .orElse(0.0); // If the list is empty, return 0.0
        }
    }

    public static void resetData() {
        synchronized (data) {
            data.clear(); // Clear the data list to reset it
        }
    }
}
