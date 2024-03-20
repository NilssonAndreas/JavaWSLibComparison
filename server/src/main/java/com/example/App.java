package com.example;

import java.util.Scanner;

public class App {

    public static void main(String[] args) {
        App app = new App();
        app.start();
    }

    public void start() {
        System.out.println("Please choose a server to start:");
        System.out.println("1. JavaWebSocketAdapter (Port 8887)");
        System.out.println("2. NettyWebSocketAdapter (Port 8888)");
        System.out.println("3. UndertowWebSocketAdapter (Port 8889)");
        System.out.print("Enter your choice (1/2/3): ");

        Scanner scanner = new Scanner(System.in);
        int choice = scanner.nextInt();

        try {
            switch (choice) {
                case 1:
                    JavaWebSocketAdapter javaServer = new JavaWebSocketAdapter(8887);
                    javaServer.start();
                    break;
                case 2:
                    NettyWebSocketAdapter nettyServer = new NettyWebSocketAdapter(8888);
                    nettyServer.start();
                    break;
                case 3:
                    UndertowWebSocketAdapter undertowServer = new UndertowWebSocketAdapter(8889);
                    undertowServer.start();
                    break;
                default:
                    System.out.println("Invalid choice. Please run the program again and select a valid option.");
                    break;
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            scanner.close();
        }
    }
}
