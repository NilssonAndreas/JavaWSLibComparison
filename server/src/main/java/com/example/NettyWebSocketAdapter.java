package com.example;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;
import io.netty.handler.codec.http.websocketx.WebSocketServerProtocolHandler;
import io.netty.handler.stream.ChunkedWriteHandler;

public class NettyWebSocketAdapter {
    private BenchmarkSocketServer benchmark;

    private final int port;

    public NettyWebSocketAdapter(int port) {
        this.port = port;
        benchmark = new BenchmarkSocketServer() {
            @Override
            public void startServer() {
                // Not used in this context as the WebSocketServer's start method is called
                // directly.
            }

            @Override
            public void stopServer() {
                try {
                    System.out.println("Server shutting down...");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        };
    }

    public void start() {
        EventLoopGroup bossGroup = new NioEventLoopGroup(); // Accept incoming connections
        EventLoopGroup workerGroup = new NioEventLoopGroup(); // Handle the traffic of the accepted connections
        try {
            ServerBootstrap b = new ServerBootstrap();
            b.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) {
                            ch.pipeline().addLast(
                                    new HttpServerCodec(), // Codec for handling HTTP requests/responses
                                    new ChunkedWriteHandler(), // Handles writing of file content
                                    new HttpObjectAggregator(8192), // Aggregate HTTP messages into FullHttpRequests
                                    new WebSocketServerProtocolHandler("/"), // Handles WebSocket upgrade handshake
                                    new NettyWebSocketFrameHandler(benchmark)); // Your custom handler to process
                                                                                // WebSocket
                            // frames
                        }
                    });
            ChannelFuture f = b.bind(port).sync(); // Bind and start to accept incoming connections.
            System.out.println("Server started successfully on port " + port);
            f.channel().closeFuture().sync(); // Wait until the server socket is closed.
        } catch (Exception e) {
            System.err.println("An error occurred while starting the server: " + e.getMessage());
            e.printStackTrace();
        } finally {
            // Shut down all event loops to terminate all threads.
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
            System.out.println("Server shut down gracefully.");
        }
    }

    public static void main(String[] args) throws Exception {
        new NettyWebSocketAdapter(8887).start();
    }
}