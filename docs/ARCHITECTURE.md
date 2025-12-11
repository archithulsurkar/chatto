# CHATTO — System Architecture Documentation

## 1. Overview
Chatto is a modular real-time chat application using:
- Node.js + Express (Backend)
- Socket.io (Realtime)
- MongoDB + Mongoose (Database)
- HTML/CSS/JS (Frontend)

The system is designed for extensibility, clarity, and developer friendliness.

## 2. High-Level Architecture

Client (HTML/JS) ⇵ HTTP + WebSocket ⇵ Express + Socket.io ⇵ MongoDB

## 3. Server Architecture
- Express for routing & auth
- Socket.io for realtime
- MongoDB for storage

## 4. Execution Flow
Login → JWT → WebSocket → Join Room → Load History → Realtime Chat

## 5. Scalability Notes
- Redis adapter recommended for scaling
