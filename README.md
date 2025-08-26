# HLS Adaptive Bitrate Streaming Pipeline

This project implements a complete, scalable pipeline for HTTP Live Streaming (HLS) with adaptive bitrate. It allows users to upload a video, which is then automatically transcoded into multiple resolutions and made available for efficient, high-quality streaming on a custom video player. The architecture is designed to be robust, using AWS services for processing and storage.

<img width="1780" height="1001" alt="image" src="https://github.com/user-attachments/assets/5c8fd1dc-b9e1-4262-b5ba-063859f7bae6" />


## Architecture Overview

The system is composed of four main services that work together to process and stream video content.

1.  **Client (React + Vite):** A web interface for users to upload videos and watch the processed streams. It communicates with the server via HTTP and receives real-time transcoding updates via WebSockets.
2.  **Server (Node.js + Express):** An API server that handles file uploads from the client. It stores the original video in an AWS S3 bucket and then sends a message to an SQS queue to trigger the transcoding process.
3.  **SQS Consumer (Node.js):** A background service that polls the SQS queue for new messages. When a message is received, it launches a new task on AWS ECS to handle the video conversion.
4.  **HLS Converter (Node.js + FFmpeg in Docker):** A containerized worker that performs the heavy lifting. It downloads the video from S3, uses FFmpeg to transcode it into multiple resolutions (e.g., 480p, 720p, 1080p), generates the HLS playlist files (`.m3u8`), and uploads the resulting video segments back to S3.

## Features

- **File Upload:** A user-friendly interface to upload video files.
- **Adaptive Bitrate Streaming:** Videos are converted into multiple quality levels, allowing the player to automatically switch based on the user's network conditions.
- **Scalable Transcoding:** Uses AWS SQS and ECS to run transcoding tasks in a scalable and decoupled manner.
- **Real-time Progress:** The client receives live updates on the transcoding progress via WebSockets.
- **Custom Video Player:** A modern, custom-built video player on the client-side to handle HLS streams.

## Tech Stack

| Service         | Technologies                                               |
| --------------- | ---------------------------------------------------------- |
| **Client** | React, Vite, TypeScript, Tailwind CSS, HLS.js              |
| **Server** | Node.js, Express, TypeScript, Multer, AWS SDK (S3, SQS)    |
| **SQS Consumer**| Node.js, TypeScript, AWS SDK (SQS, ECS)                    |
| **HLS Converter** | Node.js, TypeScript, FFmpeg, Docker, AWS SDK (S3), WebSockets |

## Getting Started

To run this project locally, you will need to set up each service.

### Prerequisites

- Node.js (v18 or later)
- Docker
- AWS Account with configured credentials (IAM user with S3, SQS, and ECS permissions)
- FFmpeg installed locally for the HLS Converter service

### Environment Variables

Each service (`server`, `SQSConsumer`, `HLSConverter`) requires its own `.env` file. Copy the `duplicate.env` or `.env.example` in each directory to a new `.env` file and fill in the required AWS credentials and other configuration details.

**Key variables to set:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `S3_BUCKET_NAME`
- `SQS_QUEUE_URL`
- `ECS_CLUSTER_ARN`
- `ECS_TASK_DEFINITION_ARN`

### Installation & Running

1.  **Client:**
    ```bash
    cd client
    npm install
    npm run dev
    ```

2.  **Server:**
    ```bash
    cd server
    npm install
    npm run dev
    ```

3.  **SQS Consumer:**
    ```bash
    cd SQSConsumer
    npm install
    npm run start
    ```

4.  **HLS Converter:**
    This service is designed to run as a Docker container, typically orchestrated by ECS. To build and run it locally for testing:
    ```bash
    cd HLSConverter
    docker build -t hls-converter .
    # You'll need to pass environment variables to the container
    docker run --env-file ./getThis.env hls-converter
    ```

## Workflow

1.  The user visits the **Client** application and uploads a video file.
2.  The **Server** receives the file, uploads it to an "uploads" directory in your S3 bucket, and sends a message to the SQS queue with the video's information.
3.  The **SQS Consumer** picks up the message and starts a new ECS task using the **HLS Converter** container image.
4.  The **HLS Converter** task downloads the video from S3.
5.  It then uses FFmpeg to transcode the video into different resolutions, creating `.ts` segments and `.m3u8` playlists.
6.  The converted files are uploaded to a "processed" directory in the S3 bucket.
7.  A master `.m3u8` playlist file is created, which references all the different resolution playlists.
8.  The **Client** receives the URL to this master playlist and can begin streaming the video with adaptive bitrate.
