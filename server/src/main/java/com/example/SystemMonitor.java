package com.example;

import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import oshi.hardware.GlobalMemory;
import oshi.util.GlobalConfig;
import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class SystemMonitor {
    static {
        // Enabling the Processor Utility measurement for Windows
        GlobalConfig.set("oshi.os.windows.cpu.utility", true);
    }

    private static final SystemInfo systemInfo = new SystemInfo();
    private static final CentralProcessor processor = systemInfo.getHardware().getProcessor();
    private static final GlobalMemory memory = systemInfo.getHardware().getMemory();
    public static boolean monitoring = false;
    private static Map<Instant, Double> cpuUsageData = new HashMap<>();
    private static Map<Instant, Long> memoryUsageData = new HashMap<>();
    private static final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private static long[] prevTicks = processor.getSystemCpuLoadTicks();

    public static void startMonitoring() {
        scheduler.scheduleAtFixedRate(SystemMonitor::performMonitoringTasks, 0, 10, TimeUnit.SECONDS);
    }

    private static void performMonitoringTasks() {
        if (monitoring) {
            recordCpuUsage();
            recordMemoryUsage();
        }
    }

    private static void recordCpuUsage() {
        long[] ticks = processor.getSystemCpuLoadTicks();
        double load = processor.getSystemCpuLoadBetweenTicks(prevTicks) * 100;
        prevTicks = ticks;
        cpuUsageData.put(Instant.now(), load);
    }

    private static void recordMemoryUsage() {
        long totalMemory = memory.getTotal();
        long availableMemory = memory.getAvailable();
        long usedMemory = totalMemory - availableMemory;
        memoryUsageData.put(Instant.now(), usedMemory);
    }

    public static void activateMonitoring() {
        monitoring = true;
    }

    public static void deactivateMonitoring() {
        monitoring = false;
    }

    public static Map<Instant, Double> getCpuUsageData() {
        return new HashMap<>(cpuUsageData);
    }

    public static Map<Instant, Long> getMemoryUsageData() {
        return new HashMap<>(memoryUsageData);
    }

    public static void clearData() {
        cpuUsageData.clear();
        memoryUsageData.clear();
    }

    public static void shutdown() {
        scheduler.shutdown();
    }

    public static double getMaxCpuUsage() {
        return Collections.max(cpuUsageData.values());
    }

    public static double getAverageCpuUsage() {
        return cpuUsageData.values().stream().mapToDouble(v -> v).average().orElse(0.0);
    }

    public static double getMaxMemoryUsageGB() {
        return Collections.max(memoryUsageData.values()) / (1024.0 * 1024.0 * 1024.0);
    }

    public static double getAverageMemoryUsageGB() {
        return memoryUsageData.values().stream().mapToLong(v -> v).average().orElse(0.0) / (1024.0 * 1024.0 * 1024.0);
    }
}
