import React, {useEffect, useRef} from 'react';
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection" 

//Added as per TF api suggestions
import '@mediapipe/face_mesh';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

import Webcam from "react-webcam"
import {drawMesh} from "./FaceMeshUtilities"

function FaceMesh() {

const webcamRef= useRef(null)
const canvasRef = useRef(null)

//Load Facemesh
const runFacemesh = async () =>{
const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh; //Create model
const detectorConfig = {//Config
  runtime: 'tfjs',
};
const nodes = await faceLandmarksDetection.createDetector(model, detectorConfig);
  setInterval(() => {
    detect(nodes);
  }, 10);
}

//Detech function
const detect = async (nodes) => {
  if(typeof webcamRef.current !== "undefined" &&
  webcamRef.current !== null &&
  webcamRef.current.video.readyState === 4){// Checking cam is not unfefined or null and it is recieving data (readState === 4)
    //Get video properties
    const video = webcamRef.current.video;
    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;

    //Set video widths
    webcamRef.current.video.width=videoWidth;
    webcamRef.current.video.height=videoHeight;

    //Set canvas witdh
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    //Make detections
    const estimationConfig = {flipHorizontal: false};
    const face = await nodes.estimateFaces(video,estimationConfig);
    
    //Get canvas context for drawing
    const ctx = canvasRef.current.getContext("2d");
    requestAnimationFrame(() => {drawMesh(face[0], ctx)});
  }
}

useEffect(()=>{runFacemesh()}, []);

return (
  <div className="App">
      <Webcam
        ref={webcamRef}
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          textAlign: "center",
          zindex: 9,
          width: 640,
          height: 480,
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          textAlign: "center",
          zindex: 9,
          width: 640,
          height: 480,
        }}
      />
  </div>
);
}

export default FaceMesh;
