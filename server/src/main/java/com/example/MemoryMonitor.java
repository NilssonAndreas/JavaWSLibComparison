package com.example;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import com.sun.management.OperatingSystemMXBean;

public class MemoryMonitor {

    public static void printSystemMemoryInfo() {
        OperatingSystemMXBean osBean = ManagementFactory.getPlatformMXBean(OperatingSystemMXBean.class);

        // Total physical memory
        long totalPhysicalMemory = osBean.getTotalPhysicalMemorySize();
        // Free physical memory
        long freePhysicalMemory = osBean.getFreePhysicalMemorySize();

        System.out.println("Total Physical Memory: " + totalPhysicalMemory + " bytes");
        System.out.println("Free Physical Memory: " + freePhysicalMemory + " bytes");
    }

    public static void printJVMMemoryInfo() {
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();

        // Heap memory usage
        MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();
        // Non-heap memory usage
        MemoryUsage nonHeapUsage = memoryBean.getNonHeapMemoryUsage();

        System.out.println("JVM Heap Memory Usage: " + heapUsage);
        System.out.println("JVM Non-Heap Memory Usage: " + nonHeapUsage);
    }

    public static void printMemoryUsage() {
        ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleAtFixedRate(() -> {
            printSystemMemoryInfo();
            printJVMMemoryInfo();
        }, 0, 5, TimeUnit.SECONDS);

    }

    public static void main(String[] args) {
        printSystemMemoryInfo();
        printJVMMemoryInfo();
    }
}
