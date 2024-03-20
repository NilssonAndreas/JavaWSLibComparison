package com.example;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.codec.http.websocketx.TextWebSocketFrame;

public class NettyWebSocketFrameHandler extends SimpleChannelInboundHandler<TextWebSocketFrame> {

    private final BenchmarkSocketServer benchmarkServer;

    public NettyWebSocketFrameHandler(BenchmarkSocketServer benchmarkServer) {
        this.benchmarkServer = benchmarkServer;
    }

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, TextWebSocketFrame frame) {
        // Log the received message
        benchmarkServer.onMessageReceived();
        
        // Echo the frame
        ctx.channel().writeAndFlush(new TextWebSocketFrame("Echo: " + frame.text()));
        
        // Log the sent message
        benchmarkServer.onMessageSent();
    }

    @Override
    public void handlerAdded(ChannelHandlerContext ctx) {
        System.out.println("Handler added: " + ctx.channel().id().asLongText());
        // Log the new connection
        benchmarkServer.onOpen();
    }

    @Override
    public void handlerRemoved(ChannelHandlerContext ctx) {
        System.out.println("Handler removed: " + ctx.channel().id().asLongText());
        // Log the closed connection
        benchmarkServer.onClose(ctx.channel().id().asLongText());
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        cause.printStackTrace();
        ctx.close();
    }
}
